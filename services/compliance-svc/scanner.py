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


def classify_urgency(days_remaining: int) -> str:
    """Map days until expiry to a severity bucket (expired counts as critical)."""
    if days_remaining <= 7:
        return "critical"
    if days_remaining <= 14:
        return "high"
    if days_remaining <= 30:
        return "medium"
    return "low"


class ComplianceScanner:
    """Pure-Python expiry scan over artifact dicts, no database required.

    ``scan_expiring_artifacts`` above is the DB-backed entry point; this class
    applies the same window/status rules to artifacts the caller already holds.
    """

    ACTIVE_STATUSES = ("active", "expiring_soon", "expired")

    def find_expiring(
        self,
        artifacts: list[dict[str, Any]],
        days_ahead: int = 30,
        today: date | None = None,
    ) -> list[dict[str, Any]]:
        """Return artifacts expiring within ``days_ahead`` days, soonest first.

        Revoked/pending artifacts and artifacts without an expiry date are
        skipped; already-expired artifacts are included (negative days).
        """
        today = today or date.today()
        expiring: list[dict[str, Any]] = []
        for artifact in artifacts:
            if artifact.get("status", "active") not in self.ACTIVE_STATUSES:
                continue
            expiry = _coerce_date(artifact.get("expiry_date"))
            if expiry is None:
                continue
            days_remaining = (expiry - today).days
            if days_remaining > days_ahead:
                continue
            item = dict(artifact)
            item["days_remaining"] = days_remaining
            item["severity"] = self.classify_urgency(days_remaining)
            expiring.append(item)
        expiring.sort(key=lambda item: item["days_remaining"])
        return expiring

    @staticmethod
    def classify_urgency(days_remaining: int) -> str:
        return classify_urgency(days_remaining)


def _coerce_date(value: Any) -> date | None:
    if value is None:
        return None
    if isinstance(value, date):
        return value
    try:
        return date.fromisoformat(str(value)[:10])
    except ValueError:
        return None
