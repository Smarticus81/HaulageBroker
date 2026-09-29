"""Autopilot policies, events (receipts) and summary routes (docs/business-model.md section 5)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.auth import TokenPayload, get_current_user, require_role
from shared.audit import write_audit_log
from shared.database import get_db
from shared.models import AutopilotEvent, AutopilotPolicy

from .plans import ALLOWED_MODES_BY_PLAN, DEFAULT_MODE_BY_PLAN, current_plan_id

router = APIRouter()

Mode = Literal["suggest", "act", "full"]
Outcome = Literal["done", "needs_you", "skipped"]
Weekday = Literal["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

# Columns copied into audit before/after states
POLICY_FIELDS = (
    "auto_invoice_max_amount",
    "pod_chase_hours",
    "pod_chase_cadence_hours",
    "quick_pay_min_days",
    "compliance_alert_days",
    "auto_link_confidence",
    "settlement_day",
    "quiet_hours",
    "mode",
)
_DECIMAL_FIELDS = {"auto_invoice_max_amount", "auto_link_confidence"}


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class AutopilotPolicyResponse(BaseModel):
    id: UUID
    org_id: UUID
    auto_invoice_max_amount: float
    pod_chase_hours: int
    pod_chase_cadence_hours: int
    quick_pay_min_days: int
    compliance_alert_days: list[int]
    auto_link_confidence: float
    settlement_day: str
    quiet_hours: str
    mode: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AutopilotPolicyUpdate(BaseModel):
    auto_invoice_max_amount: float | None = Field(None, ge=0)
    pod_chase_hours: int | None = Field(None, ge=0, le=24 * 14)
    pod_chase_cadence_hours: int | None = Field(None, ge=1, le=24 * 14)
    quick_pay_min_days: int | None = Field(None, ge=0, le=365)
    compliance_alert_days: list[int] | None = None
    auto_link_confidence: float | None = Field(None, ge=0, le=1)
    settlement_day: Weekday | None = None
    quiet_hours: str | None = Field(None, pattern=r"^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$")
    mode: Mode | None = None

    @field_validator("compliance_alert_days")
    @classmethod
    def _alert_days(cls, value: list[int] | None) -> list[int] | None:
        if value is None:
            return None
        if not value or any(d < 0 or d > 365 for d in value):
            raise ValueError("compliance_alert_days must be 1-10 values between 0 and 365")
        if len(value) > 10:
            raise ValueError("compliance_alert_days must hold at most 10 windows")
        return sorted(set(value), reverse=True)


class AutopilotEventResponse(BaseModel):
    id: UUID
    org_id: UUID
    kind: str
    summary: str
    entity_type: str | None = None
    entity_id: UUID | None = None
    outcome: str
    saved_minutes: int
    payload: dict = {}
    created_at: datetime

    model_config = {"from_attributes": True}


class AutopilotEventListResponse(BaseModel):
    items: list[AutopilotEventResponse]
    total: int


class AutopilotSummaryResponse(BaseModel):
    events_7d: int
    needs_you: int
    saved_minutes_7d: int
    saved_minutes_30d: int
    mode: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def policy_snapshot(policy: AutopilotPolicy) -> dict:
    snapshot = {}
    for name in POLICY_FIELDS:
        value = getattr(policy, name)
        snapshot[name] = float(value) if isinstance(value, Decimal) else value
    return snapshot


async def ensure_default_policies(db: AsyncSession, org_id: UUID, mode: str | None = None) -> AutopilotPolicy:
    """Return the org's policy row, creating spec defaults if missing.

    ``mode`` defaults to the plan's scope (solo -> suggest, fleet -> act, autopilot -> full).
    """
    result = await db.execute(select(AutopilotPolicy).where(AutopilotPolicy.org_id == org_id))
    policy = result.scalar_one_or_none()
    if policy is not None:
        return policy

    if mode is None:
        mode = DEFAULT_MODE_BY_PLAN[await current_plan_id(db, org_id)]
    policy = AutopilotPolicy(org_id=org_id, mode=mode)
    db.add(policy)
    await db.commit()
    await db.refresh(policy)
    return policy


# ---------------------------------------------------------------------------
# Endpoints: policies
# ---------------------------------------------------------------------------

@router.get("/policies", response_model=AutopilotPolicyResponse)
async def get_policies(
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ensure_default_policies(db, UUID(current_user.org_id))


@router.put("/policies", response_model=AutopilotPolicyResponse)
async def update_policies(
    body: AutopilotPolicyUpdate,
    current_user: TokenPayload = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    org_id = UUID(current_user.org_id)
    policy = await ensure_default_policies(db, org_id)
    updates = body.model_dump(exclude_unset=True, exclude_none=True)
    if not updates:
        return policy

    if "mode" in updates:
        plan = await current_plan_id(db, org_id)
        if updates["mode"] not in ALLOWED_MODES_BY_PLAN[plan]:
            raise HTTPException(
                status_code=400,
                detail=f"Mode '{updates['mode']}' is not available on the {plan} plan "
                       f"(allowed: {', '.join(ALLOWED_MODES_BY_PLAN[plan])}).",
            )

    before = policy_snapshot(policy)
    for name, value in updates.items():
        if name in _DECIMAL_FIELDS:
            value = Decimal(str(value))
        setattr(policy, name, value)
    policy.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(policy)

    await write_audit_log(
        db,
        org_id=org_id,
        actor_id=UUID(current_user.user_id),
        actor_type="user",
        action="autopilot_policy.updated",
        entity_type="autopilot_policy",
        entity_id=policy.id,
        before_state=before,
        after_state=policy_snapshot(policy),
        source="api",
    )
    return policy


# ---------------------------------------------------------------------------
# Endpoints: events and summary
# ---------------------------------------------------------------------------

@router.get("/events", response_model=AutopilotEventListResponse)
async def list_events(
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
    outcome: Outcome | None = Query(None),
):
    """Autopilot receipts, newest first."""
    org_id = UUID(current_user.org_id)
    query = select(AutopilotEvent).where(AutopilotEvent.org_id == org_id)
    count_q = select(func.count()).select_from(AutopilotEvent).where(AutopilotEvent.org_id == org_id)
    if outcome:
        query = query.where(AutopilotEvent.outcome == outcome)
        count_q = count_q.where(AutopilotEvent.outcome == outcome)

    total = (await db.execute(count_q)).scalar() or 0
    rows = (await db.execute(query.order_by(AutopilotEvent.created_at.desc()).limit(limit))).scalars().all()
    return AutopilotEventListResponse(items=rows, total=total)


@router.get("/summary", response_model=AutopilotSummaryResponse)
async def get_summary(
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Numbers for the Today page header: activity, open items and hours given back."""
    org_id = UUID(current_user.org_id)
    now = datetime.now(timezone.utc)
    since_7d = now - timedelta(days=7)
    since_30d = now - timedelta(days=30)

    events_7d = (await db.execute(
        select(func.count()).select_from(AutopilotEvent)
        .where(AutopilotEvent.org_id == org_id, AutopilotEvent.created_at >= since_7d)
    )).scalar() or 0
    needs_you = (await db.execute(
        select(func.count()).select_from(AutopilotEvent)
        .where(AutopilotEvent.org_id == org_id, AutopilotEvent.outcome == "needs_you")
    )).scalar() or 0
    saved_7d = (await db.execute(
        select(func.coalesce(func.sum(AutopilotEvent.saved_minutes), 0))
        .where(AutopilotEvent.org_id == org_id, AutopilotEvent.created_at >= since_7d)
    )).scalar() or 0
    saved_30d = (await db.execute(
        select(func.coalesce(func.sum(AutopilotEvent.saved_minutes), 0))
        .where(AutopilotEvent.org_id == org_id, AutopilotEvent.created_at >= since_30d)
    )).scalar() or 0

    policy = await ensure_default_policies(db, org_id)
    return AutopilotSummaryResponse(
        events_7d=int(events_7d),
        needs_you=int(needs_you),
        saved_minutes_7d=int(saved_7d),
        saved_minutes_30d=int(saved_30d),
        mode=policy.mode,
    )


@router.post("/events/{event_id}/resolve", response_model=AutopilotEventResponse)
async def resolve_event(
    event_id: UUID,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a needs_you receipt as handled."""
    org_id = UUID(current_user.org_id)
    result = await db.execute(
        select(AutopilotEvent).where(AutopilotEvent.id == event_id, AutopilotEvent.org_id == org_id)
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Autopilot event not found")

    before_outcome = event.outcome
    event.outcome = "done"
    await db.commit()
    await db.refresh(event)

    await write_audit_log(
        db,
        org_id=org_id,
        actor_id=UUID(current_user.user_id),
        actor_type="user",
        action="autopilot_event.resolved",
        entity_type="autopilot_event",
        entity_id=event.id,
        before_state={"outcome": before_outcome},
        after_state={"outcome": "done", "kind": event.kind},
        source="api",
    )
    return event
