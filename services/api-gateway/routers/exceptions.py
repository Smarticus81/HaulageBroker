"""Exception management routes."""

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
from shared.events import EVENT_EXCEPTION_RAISED, EventBus
from shared.models import Exception_

router = APIRouter()
_event_bus = EventBus()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ExceptionCreate(BaseModel):
    type: str
    severity: str = "medium"
    linked_entity_type: str
    linked_entity_id: UUID
    description: str | None = None


class ExceptionResolve(BaseModel):
    resolution_notes: str


class ExceptionResponse(BaseModel):
    id: UUID
    org_id: UUID
    type: str
    severity: str
    linked_entity_type: str
    linked_entity_id: UUID
    description: str | None = None
    status: str
    resolution_notes: str | None = None
    resolved_by: UUID | None = None
    resolved_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ExceptionListResponse(BaseModel):
    items: list[ExceptionResponse]
    total: int
    page: int
    page_size: int


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=ExceptionListResponse)
async def list_exceptions(
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    status_filter: str | None = Query(None, alias="status"),
    type_filter: str | None = Query(None, alias="type"),
    severity: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
):
    org_id = UUID(current_user.org_id)
    query = select(Exception_).where(Exception_.org_id == org_id)
    count_q = select(func.count()).select_from(Exception_).where(Exception_.org_id == org_id)

    if status_filter:
        query = query.where(Exception_.status == status_filter)
        count_q = count_q.where(Exception_.status == status_filter)
    if type_filter:
        query = query.where(Exception_.type == type_filter)
        count_q = count_q.where(Exception_.type == type_filter)
    if severity:
        query = query.where(Exception_.severity == severity)
        count_q = count_q.where(Exception_.severity == severity)

    total = (await db.execute(count_q)).scalar() or 0
    offset = (page - 1) * page_size
    rows = (await db.execute(
        query.order_by(Exception_.created_at.desc()).offset(offset).limit(page_size)
    )).scalars().all()

    return ExceptionListResponse(items=rows, total=total, page=page, page_size=page_size)


@router.post("", response_model=ExceptionResponse, status_code=status.HTTP_201_CREATED)
async def create_exception(
    body: ExceptionCreate,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    exc = Exception_(
        org_id=UUID(current_user.org_id),
        type=body.type,
        severity=body.severity,
        linked_entity_type=body.linked_entity_type,
        linked_entity_id=body.linked_entity_id,
        description=body.description,
    )
    db.add(exc)
    await db.commit()
    await db.refresh(exc)

    await write_audit_log(
        db,
        org_id=UUID(current_user.org_id),
        actor_id=UUID(current_user.user_id),
        actor_type="user",
        action="exception.created",
        entity_type="exception",
        entity_id=exc.id,
        after_state={"type": body.type, "severity": body.severity},
        source="api",
    )

    await _event_bus.publish(EVENT_EXCEPTION_RAISED, {
        "exception_id": str(exc.id),
        "org_id": current_user.org_id,
        "type": body.type,
        "severity": body.severity,
        "linked_entity_type": body.linked_entity_type,
        "linked_entity_id": str(body.linked_entity_id),
    })

    return exc


@router.put("/{exc_id}/resolve", response_model=ExceptionResponse)
async def resolve_exception(
    exc_id: UUID,
    body: ExceptionResolve,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = UUID(current_user.org_id)
    result = await db.execute(
        select(Exception_).where(Exception_.id == exc_id, Exception_.org_id == org_id)
    )
    exc = result.scalar_one_or_none()
    if not exc:
        raise HTTPException(status_code=404, detail="Exception not found")

    if exc.status.value in ("resolved", "dismissed"):
        raise HTTPException(status_code=400, detail="Exception is already resolved")

    before_status = exc.status.value
    exc.status = "resolved"
    exc.resolution_notes = body.resolution_notes
    exc.resolved_by = UUID(current_user.user_id)
    exc.resolved_at = datetime.utcnow()
    await db.commit()
    await db.refresh(exc)

    await write_audit_log(
        db,
        org_id=org_id,
        actor_id=UUID(current_user.user_id),
        actor_type="user",
        action="exception.resolved",
        entity_type="exception",
        entity_id=exc.id,
        before_state={"status": before_status},
        after_state={"status": "resolved", "resolution_notes": body.resolution_notes},
        source="api",
    )

    return exc
