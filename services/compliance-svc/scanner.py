"""Compliance artifact expiry scanner.

Scans compliance_artifacts for items expiring within the lead time
defined by compliance_rules.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.models import ComplianceArtifact, ComplianceRule


async def scan_expiring_artifacts(
    db: AsyncSession,
    org_id: UUID,
    days_ahead: int = 30,
) -> list[dict[str, Any]]:
    """Scan for compliance artifacts expiring within `days_ahead` days.

    Cross-references compliance_rules to determine severity.

    Returns:
        List of dicts with artifact details and severity.
    """
    cutoff = date.today() + timedelta(days=days_ahead)

    # Fetch expiring artifacts
    result = await db.execute(
        select(ComplianceArtifact).where(
            ComplianceArtifact.org_id == org_id,
            ComplianceArtifact.expiry_date.isnot(None),
            ComplianceArtifact.expiry_date <= cutoff,
            ComplianceArtifact.status.in_(["active", "expiring_soon"]),
        )
    )
    artifacts = result.scalars().all()

    # Fetch rules for severity lookup
    rules_result = await db.execute(
        select(ComplianceRule).where(
            ComplianceRule.org_id == org_id,
            ComplianceRule.is_active == True,  # noqa: E712
        )
    )
    rules = rules_result.scalars().all()
    rule_map: dict[str, ComplianceRule] = {}
    for r in rules:
        key = r.artifact_type
        if r.subject_type:
            key = f"{r.artifact_type}:{r.subject_type.value}"
        rule_map[key] = r
        rule_map[r.artifact_type] = r  # Also index by artifact_type alone

    items = []
    for artifact in artifacts:
        days_remaining = (artifact.expiry_date - date.today()).days
        severity = "medium"

        # Look up matching rule for severity
        subject_type = artifact.subject_type.value if artifact.subject_type else ""
        rule = rule_map.get(f"{artifact.artifact_type}:{subject_type}") or rule_map.get(artifact.artifact_type)
        if rule:
            severity = rule.severity.value if hasattr(rule.severity, "value") else str(rule.severity)

        # Update status if transitioning
        if days_remaining <= 0 and artifact.status.value != "expired":
            artifact.status = "expired"
        elif days_remaining <= 14 and artifact.status.value == "active":
            artifact.status = "expiring_soon"

        items.append({
            "artifact_id": str(artifact.id),
            "artifact_type": artifact.artifact_type,
            "subject_type": subject_type,
            "subject_id": str(artifact.subject_id),
            "expiry_date": artifact.expiry_date,
            "days_remaining": days_remaining,
            "severity": severity,
        })

    await db.commit()
    return items
