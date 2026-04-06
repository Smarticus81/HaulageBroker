"""Compliance monitoring service - expiry scanning and rule evaluation."""

from __future__ import annotations

import logging
from datetime import date, timedelta
from uuid import UUID

from fastapi import FastAPI, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from shared.database import get_db
from shared.events import EVENT_COMPLIANCE_EXPIRING, EventBus

from .scanner import scan_expiring_artifacts
from .evaluator import evaluate_compliance_rules

app = FastAPI(title="Compliance Service", version="0.1.0")
logger = logging.getLogger(__name__)
_event_bus = EventBus()


class ExpiringItem(BaseModel):
    artifact_id: str
    artifact_type: str
    subject_type: str
    subject_id: str
    expiry_date: date
    days_remaining: int
    severity: str


class ScanResponse(BaseModel):
    expiring: list[ExpiringItem]
    total: int


class EvaluateResponse(BaseModel):
    violations: list[dict]
    total: int


@app.post("/scan-expiring", response_model=ScanResponse)
async def scan_expiring_endpoint(
    org_id: UUID,
    days_ahead: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
):
    """Scan for compliance artifacts expiring within the specified window."""
    items = await scan_expiring_artifacts(db, org_id, days_ahead)

    # Emit events for critical items
    for item in items:
        if item["severity"] in ("critical", "high"):
            await _event_bus.publish(EVENT_COMPLIANCE_EXPIRING, {
                "org_id": str(org_id),
                "artifact_id": item["artifact_id"],
                "artifact_type": item["artifact_type"],
                "days_remaining": item["days_remaining"],
            })

    expiring = [ExpiringItem(**item) for item in items]
    return ScanResponse(expiring=expiring, total=len(expiring))


@app.post("/evaluate-rules", response_model=EvaluateResponse)
async def evaluate_rules_endpoint(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Evaluate all active compliance rules for the organization."""
    violations = await evaluate_compliance_rules(db, org_id)
    return EvaluateResponse(violations=violations, total=len(violations))
