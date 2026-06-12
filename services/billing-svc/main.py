"""Billing service - invoice packet generation and readiness checking."""

from __future__ import annotations

import logging
from uuid import UUID

from fastapi import FastAPI, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.database import get_db
from shared.models import LoadRecord, InvoicePacket

from .packet_builder import build_packet

app = FastAPI(title="Billing Service", version="0.1.0")
logger = logging.getLogger(__name__)


class GenerateRequest(BaseModel):
    load_record_id: UUID


class PacketResponse(BaseModel):
    required_docs: list[str]
    docs_present: list[str]
    status: str
    missing_docs: list[str]


class ReadinessRequest(BaseModel):
    load_record_id: UUID


class ReadinessResponse(BaseModel):
    is_ready: bool
    missing_docs: list[str]


@app.post("/generate-packet", response_model=PacketResponse)
async def generate_packet_endpoint(body: GenerateRequest, db: AsyncSession = Depends(get_db)):
    """Generate an invoice packet for a load record."""
    result = await db.execute(select(LoadRecord).where(LoadRecord.id == body.load_record_id))
    load = result.scalar_one_or_none()
    if not load:
        return PacketResponse(required_docs=[], docs_present=[], status="incomplete", missing_docs=[])

    data = await build_packet(db, load)
    missing = [d for d in data["required_docs"] if d not in data["docs_present"]]

    logger.info(
        "Generated packet for load %s: status=%s, missing=%s",
        load.load_number, data["status"], missing,
    )

    return PacketResponse(
        required_docs=data["required_docs"],
        docs_present=data["docs_present"],
        status=data["status"],
        missing_docs=missing,
    )


@app.post("/check-readiness", response_model=ReadinessResponse)
async def check_readiness_endpoint(body: ReadinessRequest, db: AsyncSession = Depends(get_db)):
    """Check if a load has all required docs for invoicing."""
    result = await db.execute(select(LoadRecord).where(LoadRecord.id == body.load_record_id))
    load = result.scalar_one_or_none()
    if not load:
        return ReadinessResponse(is_ready=False, missing_docs=["Load not found"])

    data = await build_packet(db, load)
    missing = [d for d in data["required_docs"] if d not in data["docs_present"]]

    return ReadinessResponse(is_ready=len(missing) == 0, missing_docs=missing)
