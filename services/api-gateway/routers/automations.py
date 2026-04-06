"""Automation rules and runs routes."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.auth import TokenPayload, get_current_user
from shared.audit import write_audit_log
from shared.database import get_db
from shared.models import AutomationRule, AutomationRun

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class AutomationRuleCreate(BaseModel):
    name: str
    description: str | None = None
    trigger_type: str
    trigger_event: str | None = None
    schedule_cron: str | None = None
    conditions: list[dict] = []
    actions: list[dict] = []


class AutomationRuleResponse(BaseModel):
    id: UUID
    org_id: UUID
    name: str
    description: str | None = None
    trigger_type: str
    trigger_event: str | None = None
    schedule_cron: str | None = None
    conditions: list
    actions: list
    is_active: bool
    is_system: bool
    created_by: UUID | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AutomationRuleListResponse(BaseModel):
    items: list[AutomationRuleResponse]
    total: int


class AutomationRunResponse(BaseModel):
    id: UUID
    rule_id: UUID
    trigger_data: dict
    actions_executed: list
    status: str
    error_message: str | None = None
    started_at: datetime
    completed_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AutomationRunListResponse(BaseModel):
    items: list[AutomationRunResponse]
    total: int
    page: int
    page_size: int


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/rules", response_model=AutomationRuleListResponse)
async def list_automation_rules(
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = UUID(current_user.org_id)
    result = await db.execute(
        select(AutomationRule).where(AutomationRule.org_id == org_id).order_by(AutomationRule.created_at.desc())
    )
    rules = result.scalars().all()
    return AutomationRuleListResponse(items=rules, total=len(rules))


@router.post("/rules", response_model=AutomationRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_automation_rule(
    body: AutomationRuleCreate,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rule = AutomationRule(
        org_id=UUID(current_user.org_id),
        name=body.name,
        description=body.description,
        trigger_type=body.trigger_type,
        trigger_event=body.trigger_event,
        schedule_cron=body.schedule_cron,
        conditions=body.conditions,
        actions=body.actions,
        created_by=UUID(current_user.user_id),
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)

    await write_audit_log(
        db,
        org_id=UUID(current_user.org_id),
        actor_id=UUID(current_user.user_id),
        actor_type="user",
        action="automation_rule.created",
        entity_type="automation_rule",
        entity_id=rule.id,
        after_state={"name": body.name, "trigger_type": body.trigger_type},
        source="api",
    )

    return rule


@router.put("/rules/{rule_id}/enable", response_model=AutomationRuleResponse)
async def enable_automation_rule(
    rule_id: UUID,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = UUID(current_user.org_id)
    result = await db.execute(
        select(AutomationRule).where(AutomationRule.id == rule_id, AutomationRule.org_id == org_id)
    )
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Automation rule not found")

    rule.is_active = True
    await db.commit()
    await db.refresh(rule)
    return rule


@router.put("/rules/{rule_id}/disable", response_model=AutomationRuleResponse)
async def disable_automation_rule(
    rule_id: UUID,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = UUID(current_user.org_id)
    result = await db.execute(
        select(AutomationRule).where(AutomationRule.id == rule_id, AutomationRule.org_id == org_id)
    )
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Automation rule not found")

    rule.is_active = False
    await db.commit()
    await db.refresh(rule)
    return rule


@router.get("/runs", response_model=AutomationRunListResponse)
async def list_automation_runs(
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    rule_id: UUID | None = None,
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
):
    org_id = UUID(current_user.org_id)

    # Join through rule to filter by org
    query = (
        select(AutomationRun)
        .join(AutomationRule, AutomationRun.rule_id == AutomationRule.id)
        .where(AutomationRule.org_id == org_id)
    )
    count_q = (
        select(func.count())
        .select_from(AutomationRun)
        .join(AutomationRule, AutomationRun.rule_id == AutomationRule.id)
        .where(AutomationRule.org_id == org_id)
    )

    if rule_id:
        query = query.where(AutomationRun.rule_id == rule_id)
        count_q = count_q.where(AutomationRun.rule_id == rule_id)
    if status_filter:
        query = query.where(AutomationRun.status == status_filter)
        count_q = count_q.where(AutomationRun.status == status_filter)

    total = (await db.execute(count_q)).scalar() or 0
    offset = (page - 1) * page_size
    rows = (await db.execute(
        query.order_by(AutomationRun.started_at.desc()).offset(offset).limit(page_size)
    )).scalars().all()

    return AutomationRunListResponse(items=rows, total=total, page=page, page_size=page_size)
