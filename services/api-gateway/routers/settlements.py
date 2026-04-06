"""Settlement packet routes."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.auth import TokenPayload, get_current_user
from shared.audit import write_audit_log
from shared.database import get_db
from shared.models import SettlementPacket

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class GenerateSettlementRequest(BaseModel):
    driver_id: UUID
    period_start: date
    period_end: date


class SettlementPacketResponse(BaseModel):
    id: UUID
    org_id: UUID
    driver_id: UUID
    period_start: date | None = None
    period_end: date | None = None
    included_load_ids: list[UUID] = []
    required_docs: list = []
    exceptions: list = []
    total_pay: Decimal | None = None
    deductions: Decimal
    net_pay: Decimal | None = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SettlementListResponse(BaseModel):
    items: list[SettlementPacketResponse]
    total: int
    page: int
    page_size: int


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=SettlementListResponse)
async def list_settlement_packets(
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    status_filter: str | None = Query(None, alias="status"),
    driver_id: UUID | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
):
    org_id = UUID(current_user.org_id)
    query = select(SettlementPacket).where(SettlementPacket.org_id == org_id)
    count_q = select(func.count()).select_from(SettlementPacket).where(SettlementPacket.org_id == org_id)

    if status_filter:
        query = query.where(SettlementPacket.status == status_filter)
        count_q = count_q.where(SettlementPacket.status == status_filter)
    if driver_id:
        query = query.where(SettlementPacket.driver_id == driver_id)
        count_q = count_q.where(SettlementPacket.driver_id == driver_id)

    total = (await db.execute(count_q)).scalar() or 0
    offset = (page - 1) * page_size
    rows = (await db.execute(
        query.order_by(SettlementPacket.created_at.desc()).offset(offset).limit(page_size)
    )).scalars().all()

    return SettlementListResponse(items=rows, total=total, page=page, page_size=page_size)


@router.post("/generate", response_model=SettlementPacketResponse, status_code=status.HTTP_201_CREATED)
async def generate_settlement_packet(
    body: GenerateSettlementRequest,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = UUID(current_user.org_id)

    from settlements_svc.generator import generate_settlement

    packet_data = await generate_settlement(db, org_id, body.driver_id, body.period_start, body.period_end)

    packet = SettlementPacket(
        org_id=org_id,
        driver_id=body.driver_id,
        period_start=body.period_start,
        period_end=body.period_end,
        included_load_ids=packet_data["included_load_ids"],
        required_docs=packet_data["required_docs"],
        exceptions=packet_data["exceptions"],
        total_pay=packet_data["total_pay"],
        deductions=packet_data["deductions"],
        net_pay=packet_data["net_pay"],
    )
    db.add(packet)
    await db.commit()
    await db.refresh(packet)

    await write_audit_log(
        db,
        org_id=org_id,
        actor_id=UUID(current_user.user_id),
        actor_type="user",
        action="settlement_packet.generated",
        entity_type="settlement_packet",
        entity_id=packet.id,
        after_state={"driver_id": str(body.driver_id), "net_pay": str(packet.net_pay)},
        source="api",
    )

    return packet
