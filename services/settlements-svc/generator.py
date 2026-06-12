"""Settlement packet generator.

Generates settlement packets for a driver over a period by aggregating
load records and checking for required documents and exceptions.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.models import Document, Exception_, LoadRecord


async def generate_settlement(
    db: AsyncSession,
    org_id: UUID,
    driver_id: UUID,
    period_start: date,
    period_end: date,
) -> dict[str, Any]:
    """Generate a settlement packet for a driver over the given period.

    Finds all load records within the period, calculates pay,
    checks for missing docs, and aggregates exceptions.

    Note: In a full implementation, loads would be linked to drivers.
    For now, we use all loads in the period for the org.

    Returns:
        Dict with included_load_ids, total_pay, deductions, net_pay,
        required_docs, and exceptions.
    """
    # Fetch loads in the delivery period
    result = await db.execute(
        select(LoadRecord).where(
            LoadRecord.org_id == org_id,
            LoadRecord.delivery_date >= period_start,
            LoadRecord.delivery_date <= period_end,
            LoadRecord.status.in_(["closed", "invoiced", "ready_to_invoice"]),
        )
    )
    loads = result.scalars().all()

    included_load_ids: list[UUID] = []
    total_pay = Decimal("0")
    required_docs_info: list[dict] = []
    exceptions_info: list[dict] = []

    for load in loads:
        included_load_ids.append(load.id)
        if load.billed_amount:
            total_pay += load.billed_amount

        # Check for missing required docs per load
        docs_result = await db.execute(
            select(Document).where(
                Document.linked_entity_type == "load_record",
                Document.linked_entity_id == load.id,
            )
        )
        docs = docs_result.scalars().all()
        doc_types = {d.doc_type.value for d in docs}

        for required_type in ["BOL", "POD", "RateConf"]:
            required_docs_info.append({
                "load_id": str(load.id),
                "load_number": load.load_number,
                "doc_type": required_type,
                "present": required_type in doc_types,
            })

        # Check for open exceptions on this load
        exc_result = await db.execute(
            select(Exception_).where(
                Exception_.linked_entity_type == "load_record",
                Exception_.linked_entity_id == load.id,
                Exception_.status.in_(["open", "investigating"]),
            )
        )
        for exc in exc_result.scalars().all():
            exceptions_info.append({
                "exception_id": str(exc.id),
                "load_id": str(load.id),
                "type": exc.type.value,
                "severity": exc.severity.value,
                "description": exc.description,
            })

    # Calculate deductions (placeholder - in production this comes from deduction rules)
    deductions = Decimal("0")

    net_pay = total_pay - deductions if total_pay else None

    return {
        "included_load_ids": included_load_ids,
        "total_pay": total_pay if total_pay > 0 else None,
        "deductions": deductions,
        "net_pay": net_pay,
        "required_docs": required_docs_info,
        "exceptions": exceptions_info,
    }
