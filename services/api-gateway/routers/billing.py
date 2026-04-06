"""Billing routes: invoice packets, invoice drafts."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.auth import TokenPayload, get_current_user, require_role
from shared.audit import write_audit_log
from shared.database import get_db
from shared.events import EVENT_INVOICEPACKET_READY, EventBus
from shared.models import InvoiceDraft, InvoicePacket, LoadRecord

router = APIRouter()
_event_bus = EventBus()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class GeneratePacketRequest(BaseModel):
    load_record_id: UUID


class InvoicePacketResponse(BaseModel):
    id: UUID
    org_id: UUID
    load_record_id: UUID
    required_docs: list
    docs_present: list
    packet_status: str
    reviewed_by: UUID | None = None
    approved_by: UUID | None = None
    approved_at: datetime | None = None
    exported_at: datetime | None = None
    export_format: str | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class InvoicePacketListResponse(BaseModel):
    items: list[InvoicePacketResponse]
    total: int
    page: int
    page_size: int


class RejectRequest(BaseModel):
    notes: str


class InvoiceDraftCreate(BaseModel):
    customer_id: UUID
    load_record_id: UUID
    invoice_number: str | None = None
    line_items: list[dict] = []
    subtotal: Decimal | None = None
    taxes: Decimal = Decimal("0")
    fees: Decimal = Decimal("0")
    total: Decimal | None = None


class InvoiceDraftResponse(BaseModel):
    id: UUID
    org_id: UUID
    customer_id: UUID
    load_record_id: UUID
    invoice_number: str | None = None
    line_items: list
    subtotal: Decimal | None = None
    taxes: Decimal
    fees: Decimal
    total: Decimal | None = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class InvoiceDraftListResponse(BaseModel):
    items: list[InvoiceDraftResponse]
    total: int
    page: int
    page_size: int


# ---------------------------------------------------------------------------
# Invoice Packet Endpoints
# ---------------------------------------------------------------------------

@router.post("/invoice-packets/generate", response_model=InvoicePacketResponse, status_code=status.HTTP_201_CREATED)
async def generate_invoice_packet(
    body: GeneratePacketRequest,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = UUID(current_user.org_id)

    # Verify load exists
    load_result = await db.execute(
        select(LoadRecord).where(LoadRecord.id == body.load_record_id, LoadRecord.org_id == org_id)
    )
    load = load_result.scalar_one_or_none()
    if not load:
        raise HTTPException(status_code=404, detail="Load record not found")

    # Check if packet already exists
    existing = await db.execute(
        select(InvoicePacket).where(InvoicePacket.load_record_id == body.load_record_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Invoice packet already exists for this load")

    # Build packet using billing service logic
    from billing_svc.packet_builder import build_packet

    packet_data = await build_packet(db, load)

    packet = InvoicePacket(
        org_id=org_id,
        load_record_id=body.load_record_id,
        required_docs=packet_data["required_docs"],
        docs_present=packet_data["docs_present"],
        packet_status=packet_data["status"],
    )
    db.add(packet)
    await db.commit()
    await db.refresh(packet)

    if packet.packet_status.value == "ready_for_review":
        await _event_bus.publish(EVENT_INVOICEPACKET_READY, {
            "packet_id": str(packet.id),
            "org_id": current_user.org_id,
            "load_record_id": str(body.load_record_id),
        })

    await write_audit_log(
        db,
        org_id=org_id,
        actor_id=UUID(current_user.user_id),
        actor_type="user",
        action="invoice_packet.generated",
        entity_type="invoice_packet",
        entity_id=packet.id,
        after_state={"status": packet.packet_status.value},
        source="api",
    )

    return packet


@router.get("/invoice-packets", response_model=InvoicePacketListResponse)
async def list_invoice_packets(
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
):
    org_id = UUID(current_user.org_id)
    query = select(InvoicePacket).where(InvoicePacket.org_id == org_id)
    count_q = select(func.count()).select_from(InvoicePacket).where(InvoicePacket.org_id == org_id)

    if status_filter:
        query = query.where(InvoicePacket.packet_status == status_filter)
        count_q = count_q.where(InvoicePacket.packet_status == status_filter)

    total = (await db.execute(count_q)).scalar() or 0
    offset = (page - 1) * page_size
    rows = (await db.execute(
        query.order_by(InvoicePacket.created_at.desc()).offset(offset).limit(page_size)
    )).scalars().all()

    return InvoicePacketListResponse(items=rows, total=total, page=page, page_size=page_size)


@router.get("/invoice-packets/{packet_id}", response_model=InvoicePacketResponse)
async def get_invoice_packet(
    packet_id: UUID,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(InvoicePacket).where(
            InvoicePacket.id == packet_id,
            InvoicePacket.org_id == UUID(current_user.org_id),
        )
    )
    packet = result.scalar_one_or_none()
    if not packet:
        raise HTTPException(status_code=404, detail="Invoice packet not found")
    return packet


@router.post("/invoice-packets/{packet_id}/approve", response_model=InvoicePacketResponse)
async def approve_invoice_packet(
    packet_id: UUID,
    current_user: TokenPayload = Depends(require_role("billing", "admin")),
    db: AsyncSession = Depends(get_db),
):
    org_id = UUID(current_user.org_id)
    result = await db.execute(
        select(InvoicePacket).where(InvoicePacket.id == packet_id, InvoicePacket.org_id == org_id)
    )
    packet = result.scalar_one_or_none()
    if not packet:
        raise HTTPException(status_code=404, detail="Invoice packet not found")

    if packet.packet_status.value not in ("ready_for_review", "incomplete"):
        raise HTTPException(status_code=400, detail=f"Cannot approve packet in status '{packet.packet_status.value}'")

    packet.packet_status = "approved"
    packet.approved_by = UUID(current_user.user_id)
    packet.approved_at = datetime.utcnow()
    await db.commit()
    await db.refresh(packet)

    await write_audit_log(
        db,
        org_id=org_id,
        actor_id=UUID(current_user.user_id),
        actor_type="user",
        action="invoice_packet.approved",
        entity_type="invoice_packet",
        entity_id=packet.id,
        after_state={"status": "approved"},
        source="api",
    )

    return packet


@router.post("/invoice-packets/{packet_id}/reject", response_model=InvoicePacketResponse)
async def reject_invoice_packet(
    packet_id: UUID,
    body: RejectRequest,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = UUID(current_user.org_id)
    result = await db.execute(
        select(InvoicePacket).where(InvoicePacket.id == packet_id, InvoicePacket.org_id == org_id)
    )
    packet = result.scalar_one_or_none()
    if not packet:
        raise HTTPException(status_code=404, detail="Invoice packet not found")

    packet.packet_status = "rejected"
    packet.notes = body.notes
    await db.commit()
    await db.refresh(packet)

    return packet


# ---------------------------------------------------------------------------
# Invoice Draft Endpoints
# ---------------------------------------------------------------------------

@router.get("/invoice-drafts", response_model=InvoiceDraftListResponse)
async def list_invoice_drafts(
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
):
    org_id = UUID(current_user.org_id)
    query = select(InvoiceDraft).where(InvoiceDraft.org_id == org_id)
    count_q = select(func.count()).select_from(InvoiceDraft).where(InvoiceDraft.org_id == org_id)

    if status_filter:
        query = query.where(InvoiceDraft.status == status_filter)
        count_q = count_q.where(InvoiceDraft.status == status_filter)

    total = (await db.execute(count_q)).scalar() or 0
    offset = (page - 1) * page_size
    rows = (await db.execute(
        query.order_by(InvoiceDraft.created_at.desc()).offset(offset).limit(page_size)
    )).scalars().all()

    return InvoiceDraftListResponse(items=rows, total=total, page=page, page_size=page_size)


@router.post("/invoice-drafts", response_model=InvoiceDraftResponse, status_code=status.HTTP_201_CREATED)
async def create_invoice_draft(
    body: InvoiceDraftCreate,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    draft = InvoiceDraft(
        org_id=UUID(current_user.org_id),
        customer_id=body.customer_id,
        load_record_id=body.load_record_id,
        invoice_number=body.invoice_number,
        line_items=body.line_items,
        subtotal=body.subtotal,
        taxes=body.taxes,
        fees=body.fees,
        total=body.total,
    )
    db.add(draft)
    await db.commit()
    await db.refresh(draft)
    return draft
