"""Plan catalog and subscription routes (docs/business-model.md section 2)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.auth import TokenPayload, get_current_user, require_role
from shared.audit import write_audit_log
from shared.database import get_db
from shared.models import AutopilotPolicy, PlanTier, Subscription

router = APIRouter()

PlanId = Literal["solo", "fleet", "autopilot"]

# Per-truck monthly prices, USD (section 2)
PLAN_PRICES: dict[str, float] = {"solo": 0.0, "fleet": 39.0, "autopilot": 79.0}
SOLO_TRUCK_LIMIT = 1
SOLO_LOADS_PER_MONTH = 25

# Autopilot scope per plan: default mode after onboarding and the modes a plan may use.
DEFAULT_MODE_BY_PLAN: dict[str, str] = {"solo": "suggest", "fleet": "act", "autopilot": "full"}
ALLOWED_MODES_BY_PLAN: dict[str, tuple[str, ...]] = {
    "solo": ("suggest",),
    "fleet": ("suggest", "act"),
    "autopilot": ("suggest", "act", "full"),
}

PLAN_CATALOG: list[dict] = [
    {
        "id": "solo",
        "name": "Solo",
        "price_per_truck_month": 0.0,
        "price_label": "$0 / month",
        "truck_limit": SOLO_TRUCK_LIMIT,
        "loads_per_month_limit": SOLO_LOADS_PER_MONTH,
        "included": ["1 truck", "25 loads / month", "Inbox", "Invoicing", "Compliance calendar", "Business plan"],
        "autopilot_scope": "Suggest only",
        "autopilot_mode": "suggest",
    },
    {
        "id": "fleet",
        "name": "Fleet",
        "price_per_truck_month": 39.0,
        "price_label": "$39 / truck / month",
        "truck_limit": None,
        "loads_per_month_limit": None,
        "included": ["Everything in Solo", "Unlimited loads", "Driver capture app", "Settlements", "Copilot"],
        "autopilot_scope": "Acts within policy limits",
        "autopilot_mode": "act",
    },
    {
        "id": "autopilot",
        "name": "Autopilot",
        "price_per_truck_month": 79.0,
        "price_label": "$79 / truck / month",
        "truck_limit": None,
        "loads_per_month_limit": None,
        "included": ["Everything in Fleet", "Quick-pay routing", "Custom policies", "Audit exports", "Priority support"],
        "autopilot_scope": "Full autonomy within policy limits",
        "autopilot_mode": "full",
    },
]

ADD_ON_NOTE = (
    "Quick-pay routing through a factoring partner earns Haulage a referral share "
    "and never marks up the carrier's rate."
)


def plan_id(plan: PlanTier | str) -> str:
    return plan.value if isinstance(plan, PlanTier) else str(plan)


def monthly_price(plan: PlanTier | str, truck_count: int) -> float:
    return round(PLAN_PRICES[plan_id(plan)] * truck_count, 2)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class PlanCatalogEntry(BaseModel):
    id: PlanId
    name: str
    price_per_truck_month: float
    price_label: str
    truck_limit: int | None = None
    loads_per_month_limit: int | None = None
    included: list[str]
    autopilot_scope: str
    autopilot_mode: str


class PlanCatalogResponse(BaseModel):
    plans: list[PlanCatalogEntry]
    add_on: str


class SubscriptionResponse(BaseModel):
    id: UUID
    org_id: UUID
    plan: PlanId
    truck_count: int
    status: str
    trial_ends_at: datetime | None = None
    current_period_end: datetime | None = None
    price_per_truck_month: float
    monthly_price: float
    created_at: datetime
    updated_at: datetime


class SubscriptionUpdate(BaseModel):
    plan: PlanId
    truck_count: int = Field(ge=1, le=1000)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def get_or_create_subscription(db: AsyncSession, org_id: UUID) -> Subscription:
    """Every workspace has a subscription; a missing row means the free Solo plan."""
    result = await db.execute(select(Subscription).where(Subscription.org_id == org_id))
    sub = result.scalar_one_or_none()
    if sub is None:
        sub = Subscription(org_id=org_id, plan=PlanTier.solo, truck_count=1, status="active")
        db.add(sub)
        await db.commit()
        await db.refresh(sub)
    return sub


async def current_plan_id(db: AsyncSession, org_id: UUID) -> str:
    result = await db.execute(select(Subscription.plan).where(Subscription.org_id == org_id))
    plan = result.scalar_one_or_none()
    return plan_id(plan) if plan is not None else "solo"


def subscription_response(sub: Subscription) -> SubscriptionResponse:
    pid = plan_id(sub.plan)
    return SubscriptionResponse(
        id=sub.id,
        org_id=sub.org_id,
        plan=pid,
        truck_count=sub.truck_count,
        status=sub.status,
        trial_ends_at=sub.trial_ends_at,
        current_period_end=sub.current_period_end,
        price_per_truck_month=PLAN_PRICES[pid],
        monthly_price=monthly_price(pid, sub.truck_count),
        created_at=sub.created_at,
        updated_at=sub.updated_at,
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/", response_model=PlanCatalogResponse)
async def list_plans():
    """Static plan catalog. Public: the landing page renders it before sign-up."""
    return PlanCatalogResponse(plans=[PlanCatalogEntry(**p) for p in PLAN_CATALOG], add_on=ADD_ON_NOTE)


@router.get("/subscription", response_model=SubscriptionResponse)
async def get_subscription(
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sub = await get_or_create_subscription(db, UUID(current_user.org_id))
    return subscription_response(sub)


@router.put("/subscription", response_model=SubscriptionResponse)
async def update_subscription(
    body: SubscriptionUpdate,
    current_user: TokenPayload = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Change plan and/or truck count. Solo is limited to one truck."""
    org_id = UUID(current_user.org_id)
    if body.plan == "solo" and body.truck_count > SOLO_TRUCK_LIMIT:
        raise HTTPException(
            status_code=400,
            detail=f"The Solo plan includes {SOLO_TRUCK_LIMIT} truck. Choose Fleet or Autopilot for {body.truck_count} trucks.",
        )

    sub = await get_or_create_subscription(db, org_id)
    before = {"plan": plan_id(sub.plan), "truck_count": sub.truck_count}

    sub.plan = PlanTier(body.plan)
    sub.truck_count = body.truck_count
    sub.status = "active"
    sub.updated_at = datetime.now(timezone.utc)

    # Autopilot may not keep a mode the new plan does not allow (e.g. downgrade to Solo).
    policy_result = await db.execute(select(AutopilotPolicy).where(AutopilotPolicy.org_id == org_id))
    policy = policy_result.scalar_one_or_none()
    if policy is not None and policy.mode not in ALLOWED_MODES_BY_PLAN[body.plan]:
        policy.mode = ALLOWED_MODES_BY_PLAN[body.plan][-1]
        policy.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(sub)

    after = {"plan": body.plan, "truck_count": body.truck_count, "monthly_price": monthly_price(body.plan, body.truck_count)}
    await write_audit_log(
        db,
        org_id=org_id,
        actor_id=UUID(current_user.user_id),
        actor_type="user",
        action="subscription.updated",
        entity_type="subscription",
        entity_id=sub.id,
        before_state=before,
        after_state=after,
        source="api",
    )
    return subscription_response(sub)
