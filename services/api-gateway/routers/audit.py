"""Audit log routes."""

from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.auth import TokenPayload, get_current_user
from shared.database import get_db
from shared.models import AuditLog

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class AuditLogResponse(BaseModel):
    id: UUID
    org_id: UUID
    actor_id: UUID | None = None
    actor_type: str
    action: str
    entity_type: str
    entity_id: UUID | None = None
    before_state: dict | None = None
    after_state: dict | None = None
    metadata: dict = {}
    ip_address: str | None = None
    source: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditLogListResponse(BaseModel):
    items: list[AuditLogResponse]
    total: int
    page: int
    page_size: int


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=AuditLogListResponse)
async def list_audit_logs(
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    entity_type: str | None = None,
    entity_id: UUID | None = None,
    actor_id: UUID | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    org_id = UUID(current_user.org_id)
    query = select(AuditLog).where(AuditLog.org_id == org_id)
    count_q = select(func.count()).select_from(AuditLog).where(AuditLog.org_id == org_id)

    if entity_type:
        query = query.where(AuditLog.entity_type == entity_type)
        count_q = count_q.where(AuditLog.entity_type == entity_type)
    if entity_id:
        query = query.where(AuditLog.entity_id == entity_id)
        count_q = count_q.where(AuditLog.entity_id == entity_id)
    if actor_id:
        query = query.where(AuditLog.actor_id == actor_id)
        count_q = count_q.where(AuditLog.actor_id == actor_id)
    if date_from:
        query = query.where(AuditLog.created_at >= datetime.combine(date_from, datetime.min.time()))
        count_q = count_q.where(AuditLog.created_at >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        query = query.where(AuditLog.created_at <= datetime.combine(date_to, datetime.max.time()))
        count_q = count_q.where(AuditLog.created_at <= datetime.combine(date_to, datetime.max.time()))

    total = (await db.execute(count_q)).scalar() or 0
    offset = (page - 1) * page_size
    rows = (await db.execute(
        query.order_by(AuditLog.created_at.desc()).offset(offset).limit(page_size)
    )).scalars().all()

    return AuditLogListResponse(items=rows, total=total, page=page, page_size=page_size)
