"""Load records CRUD with RBAC, audit logging, and event emission."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from shared.auth import TokenPayload, get_current_user
from shared.audit import write_audit_log
from shared.database import get_db
from shared.events import EVENT_LOAD_CREATED, EVENT_LOAD_STATUS_CHANGED, EventBus
from shared.models import Document, Exception_, InvoicePacket, LoadRecord, LoadStatus

router = APIRouter()
_event_bus = EventBus()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class LoadRecordCreate(BaseModel):
    load_number: str
    customer_id: UUID
    customer_ref: str | None = None
    pickup_date: date | None = None
    delivery_date: date | None = None
    origin_city: str | None = None
    origin_state: str | None = None
    dest_city: str | None = None
    dest_state: str | None = None
    billed_amount: Decimal | None = None
    accessorials_expected: Decimal = Decimal("0")
    notes: str | None = None


class LoadRecordUpdate(BaseModel):
    customer_ref: str | None = None
    pickup_date: date | None = None
    delivery_date: date | None = None
    origin_city: str | None = None
    origin_state: str | None = None
    dest_city: str | None = None
    dest_state: str | None = None
    billed_amount: Decimal | None = None
    accessorials_expected: Decimal | None = None
    status: str | None = None
    notes: str | None = None


class LoadRecordResponse(BaseModel):
    id: UUID
    org_id: UUID
    load_number: str
    customer_id: UUID
    customer_ref: str | None = None
    pickup_date: date | None = None
    delivery_date: date | None = None
    origin_city: str | None = None
    origin_state: str | None = None
    dest_city: str | None = None
    dest_state: str | None = None
    billed_amount: Decimal | None = None
    accessorials_expected: Decimal
    status: str
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LoadRecordListResponse(BaseModel):
    items: list[LoadRecordResponse]
    total: int
    page: int
    page_size: int


class DocumentBrief(BaseModel):
    id: UUID
    doc_type: str
    original_filename: str | None = None
    validation_status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ExceptionBrief(BaseModel):
    id: UUID
    type: str
    severity: str
    status: str
    description: str | None = None

    model_config = {"from_attributes": True}


class InvoicePacketBrief(BaseModel):
    id: UUID
    packet_status: str
    required_docs: list
    docs_present: list

    model_config = {"from_attributes": True}


class LoadRecordDetail(LoadRecordResponse):
    documents: list[DocumentBrief] = []
    exceptions: list[ExceptionBrief] = []
    invoice_packet: InvoicePacketBrief | None = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("", response_model=LoadRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_load_record(
    body: LoadRecordCreate,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    load = LoadRecord(
        org_id=UUID(current_user.org_id),
        load_number=body.load_number,
        customer_id=body.customer_id,
        customer_ref=body.customer_ref,
        pickup_date=body.pickup_date,
        delivery_date=body.delivery_date,
        origin_city=body.origin_city,
        origin_state=body.origin_state,
        dest_city=body.dest_city,
        dest_state=body.dest_state,
        billed_amount=body.billed_amount,
        accessorials_expected=body.accessorials_expected,
        notes=body.notes,
    )
    db.add(load)
    await db.commit()
    await db.refresh(load)

    await write_audit_log(
        db,
        org_id=UUID(current_user.org_id),
        actor_id=UUID(current_user.user_id),
        actor_type="user",
        action="load.created",
        entity_type="load_record",
        entity_id=load.id,
        after_state={"load_number": load.load_number, "status": load.status.value},
        source="api",
    )

    await _event_bus.publish(EVENT_LOAD_CREATED, {
        "load_id": str(load.id),
        "org_id": current_user.org_id,
        "load_number": load.load_number,
    })

    return load


@router.get("", response_model=LoadRecordListResponse)
async def list_load_records(
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    status_filter: str | None = Query(None, alias="status"),
    customer_id: UUID | None = None,
    pickup_from: date | None = None,
    pickup_to: date | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
):
    org_id = UUID(current_user.org_id)
    query = select(LoadRecord).where(LoadRecord.org_id == org_id)
    count_query = select(func.count()).select_from(LoadRecord).where(LoadRecord.org_id == org_id)

    if status_filter:
        query = query.where(LoadRecord.status == status_filter)
        count_query = count_query.where(LoadRecord.status == status_filter)
    if customer_id:
        query = query.where(LoadRecord.customer_id == customer_id)
        count_query = count_query.where(LoadRecord.customer_id == customer_id)
    if pickup_from:
        query = query.where(LoadRecord.pickup_date >= pickup_from)
        count_query = count_query.where(LoadRecord.pickup_date >= pickup_from)
    if pickup_to:
        query = query.where(LoadRecord.pickup_date <= pickup_to)
        count_query = count_query.where(LoadRecord.pickup_date <= pickup_to)

    total = (await db.execute(count_query)).scalar() or 0
    offset = (page - 1) * page_size
    query = query.order_by(LoadRecord.created_at.desc()).offset(offset).limit(page_size)
    rows = (await db.execute(query)).scalars().all()

    return LoadRecordListResponse(items=rows, total=total, page=page, page_size=page_size)


@router.get("/{load_id}", response_model=LoadRecordDetail)
async def get_load_record(
    load_id: UUID,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = UUID(current_user.org_id)
    result = await db.execute(
        select(LoadRecord).where(LoadRecord.id == load_id, LoadRecord.org_id == org_id)
    )
    load = result.scalar_one_or_none()
    if not load:
        raise HTTPException(status_code=404, detail="Load record not found")

    # Fetch related documents
    docs_result = await db.execute(
        select(Document).where(
            Document.linked_entity_type == "load_record",
            Document.linked_entity_id == load_id,
            Document.org_id == org_id,
        )
    )
    docs = docs_result.scalars().all()

    # Fetch related exceptions
    exc_result = await db.execute(
        select(Exception_).where(
            Exception_.linked_entity_type == "load_record",
            Exception_.linked_entity_id == load_id,
            Exception_.org_id == org_id,
        )
    )
    exceptions = exc_result.scalars().all()

    # Fetch invoice packet
    pkt_result = await db.execute(
        select(InvoicePacket).where(InvoicePacket.load_record_id == load_id, InvoicePacket.org_id == org_id)
    )
    packet = pkt_result.scalar_one_or_none()

    return LoadRecordDetail(
        **LoadRecordResponse.model_validate(load).model_dump(),
        documents=[DocumentBrief.model_validate(d) for d in docs],
        exceptions=[ExceptionBrief.model_validate(e) for e in exceptions],
        invoice_packet=InvoicePacketBrief.model_validate(packet) if packet else None,
    )


@router.put("/{load_id}", response_model=LoadRecordResponse)
async def update_load_record(
    load_id: UUID,
    body: LoadRecordUpdate,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = UUID(current_user.org_id)
    result = await db.execute(
        select(LoadRecord).where(LoadRecord.id == load_id, LoadRecord.org_id == org_id)
    )
    load = result.scalar_one_or_none()
    if not load:
        raise HTTPException(status_code=404, detail="Load record not found")

    before = {"status": load.status.value, "billed_amount": str(load.billed_amount) if load.billed_amount else None}
    old_status = load.status.value

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(load, field, value)

    await db.commit()
    await db.refresh(load)

    await write_audit_log(
        db,
        org_id=org_id,
        actor_id=UUID(current_user.user_id),
        actor_type="user",
        action="load.updated",
        entity_type="load_record",
        entity_id=load.id,
        before_state=before,
        after_state={"status": load.status.value, "billed_amount": str(load.billed_amount) if load.billed_amount else None},
        source="api",
    )

    if load.status.value != old_status:
        await _event_bus.publish(EVENT_LOAD_STATUS_CHANGED, {
            "load_id": str(load.id),
            "org_id": current_user.org_id,
            "old_status": old_status,
            "new_status": load.status.value,
        })

    return load
