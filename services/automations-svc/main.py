"""Automations service - event-driven and scheduled rule execution."""

from __future__ import annotations

import asyncio
import logging

from fastapi import FastAPI, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from shared.database import get_db
from shared.events import EventBus

from .engine import AutomationEngine

app = FastAPI(title="Automations Service", version="0.1.0")
logger = logging.getLogger(__name__)


class RunEventRulesRequest(BaseModel):
    org_id: str
    event_type: str
    payload: dict


class RunEventRulesResponse(BaseModel):
    rules_evaluated: int
    rules_matched: int
    runs: list[dict]


class RunScheduledResponse(BaseModel):
    rules_evaluated: int
    runs: list[dict]


@app.post("/run-event-rules", response_model=RunEventRulesResponse)
async def run_event_rules(body: RunEventRulesRequest, db: AsyncSession = Depends(get_db)):
    """Evaluate event-triggered automation rules."""
    engine = AutomationEngine(db)
    results = await engine.evaluate_event_rules(body.event_type, body.payload)

    return RunEventRulesResponse(
        rules_evaluated=results["rules_evaluated"],
        rules_matched=results["rules_matched"],
        runs=results["runs"],
    )


@app.post("/run-scheduled-rules", response_model=RunScheduledResponse)
async def run_scheduled_rules(db: AsyncSession = Depends(get_db)):
    """Evaluate all scheduled automation rules."""
    engine = AutomationEngine(db)
    results = await engine.evaluate_scheduled_rules()

    return RunScheduledResponse(
        rules_evaluated=results["rules_evaluated"],
        runs=results["runs"],
    )


@app.on_event("startup")
async def setup_event_listeners():
    """Subscribe to relevant events for automation processing."""
    event_bus = EventBus()

    async def handle_event(payload: dict):
        """Generic event handler that triggers automation evaluation."""
        from shared.database import async_session

        async with async_session() as db:
            engine = AutomationEngine(db)
            event_type = payload.get("event_type", "unknown")
            await engine.evaluate_event_rules(event_type, payload)

    # Subscribe to all relevant event types
    for event_type in [
        "document.uploaded", "document.classified", "document.validated",
        "load.created", "load.status_changed",
        "compliance.expiring", "invoicepacket.ready",
        "exception.raised", "task.created",
    ]:
        event_bus.subscribe(event_type, handle_event)

    # Start listening in background (non-blocking)
    asyncio.create_task(event_bus.listen())
    logger.info("Automation event listeners started")
