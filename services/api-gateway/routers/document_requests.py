"""Document request routes."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.auth import TokenPayload, get_current_user
from shared.audit import write_audit_log
from shared.database import get_db
from shared.models import DocumentRequest

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class DocRequestCreate(BaseModel):
    target_user_id: UUID | None = None
    target_email: str | None = None
    due_date: datetime | None = None
    required_doc_types: list[str]
    linked_entity_type: str | None = None
    linked_entity_id: UUID | None = None
    notes: str | None = None


class DocRequestResponse(BaseModel):
    id: UUID
    org_id: UUID
    requested_by: UUID
    target_user_id: UUID | None = None
    target_email: str | None = None
    due_date: datetime | None = None
    required_doc_types: list[str]
    linked_entity_type: str | None = None
    linked_entity_id: UUID | None = None
    status: str
    reminders_sent: int
    last_reminder_at: datetime | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocRequestListResponse(BaseModel):
    items: list[DocRequestResponse]
    total: int
    page: int
    page_size: int


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=DocRequestListResponse)
async def list_document_requests(
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
):
    org_id = UUID(current_user.org_id)
    query = select(DocumentRequest).where(DocumentRequest.org_id == org_id)
    count_q = select(func.count()).select_from(DocumentRequest).where(DocumentRequest.org_id == org_id)

    if status_filter:
        query = query.where(DocumentRequest.status == status_filter)
        count_q = count_q.where(DocumentRequest.status == status_filter)

    total = (await db.execute(count_q)).scalar() or 0
    offset = (page - 1) * page_size
    rows = (await db.execute(
        query.order_by(DocumentRequest.created_at.desc()).offset(offset).limit(page_size)
    )).scalars().all()

    return DocRequestListResponse(items=rows, total=total, page=page, page_size=page_size)


@router.post("", response_model=DocRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_document_request(
    body: DocRequestCreate,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    doc_req = DocumentRequest(
        org_id=UUID(current_user.org_id),
        requested_by=UUID(current_user.user_id),
        target_user_id=body.target_user_id,
        target_email=body.target_email,
        due_date=body.due_date,
        required_doc_types=body.required_doc_types,
        linked_entity_type=body.linked_entity_type,
        linked_entity_id=body.linked_entity_id,
        notes=body.notes,
    )
    db.add(doc_req)
    await db.commit()
    await db.refresh(doc_req)

    await write_audit_log(
        db,
        org_id=UUID(current_user.org_id),
        actor_id=UUID(current_user.user_id),
        actor_type="user",
        action="document_request.created",
        entity_type="document_request",
        entity_id=doc_req.id,
        after_state={"required_doc_types": body.required_doc_types},
        source="api",
    )

    return doc_req
