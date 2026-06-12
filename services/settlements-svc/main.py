"""Settlements service - settlement packet generation."""

from __future__ import annotations

import logging
from datetime import date
from uuid import UUID

from fastapi import FastAPI, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from shared.database import get_db

from .generator import generate_settlement

app = FastAPI(title="Settlements Service", version="0.1.0")
logger = logging.getLogger(__name__)


class GenerateRequest(BaseModel):
    org_id: UUID
    driver_id: UUID
    period_start: date
    period_end: date


class SettlementResponse(BaseModel):
    included_load_ids: list[str]
    total_pay: float | None
    deductions: float
    net_pay: float | None
    required_docs: list[dict]
    exceptions: list[dict]


@app.post("/generate", response_model=SettlementResponse)
async def generate_endpoint(body: GenerateRequest, db: AsyncSession = Depends(get_db)):
    """Generate a settlement packet for a driver and period."""
    data = await generate_settlement(
        db, body.org_id, body.driver_id, body.period_start, body.period_end,
    )

    logger.info(
        "Generated settlement for driver %s: %d loads, net_pay=%s",
        body.driver_id, len(data["included_load_ids"]), data["net_pay"],
    )

    return SettlementResponse(
        included_load_ids=[str(lid) for lid in data["included_load_ids"]],
        total_pay=float(data["total_pay"]) if data["total_pay"] else None,
        deductions=float(data["deductions"]),
        net_pay=float(data["net_pay"]) if data["net_pay"] else None,
        required_docs=data["required_docs"],
        exceptions=data["exceptions"],
    )
