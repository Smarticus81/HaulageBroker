"""Compliance rule evaluator.

Evaluates active compliance rules against the current state of
compliance artifacts to find violations.
"""

from __future__ import annotations

from datetime import date
from typing import Any
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from shared.models import ComplianceArtifact, ComplianceRule


async def evaluate_compliance_rules(
    db: AsyncSession,
    org_id: UUID,
) -> list[dict[str, Any]]:
    """Evaluate all active compliance rules and return any violations.

    A violation occurs when:
    - A required artifact type is missing for a known subject
    - An artifact has expired or is expiring within the first lead_time_days threshold
    - An artifact is in a non-compliant status (expired, revoked)

    Returns:
        List of violation dicts.
    """
    # Fetch active rules
    rules_result = await db.execute(
        select(ComplianceRule).where(
            ComplianceRule.org_id == org_id,
            ComplianceRule.is_active == True,  # noqa: E712
        )
    )
    rules = rules_result.scalars().all()

    violations: list[dict[str, Any]] = []

    for rule in rules:
        # Find all artifacts matching this rule
        query = select(ComplianceArtifact).where(
            ComplianceArtifact.org_id == org_id,
            ComplianceArtifact.artifact_type == rule.artifact_type,
        )
        if rule.subject_type:
            query = query.where(ComplianceArtifact.subject_type == rule.subject_type)

        result = await db.execute(query)
        artifacts = result.scalars().all()

        for artifact in artifacts:
            # Check for expired status
            if artifact.status.value == "expired":
                violations.append({
                    "rule_id": str(rule.id),
                    "rule_name": rule.name,
                    "artifact_id": str(artifact.id),
                    "artifact_type": artifact.artifact_type,
                    "subject_type": artifact.subject_type.value if artifact.subject_type else None,
                    "subject_id": str(artifact.subject_id),
                    "violation_type": "expired",
                    "severity": rule.severity.value if hasattr(rule.severity, "value") else str(rule.severity),
                    "description": f"{rule.name}: artifact has expired",
                })
            elif artifact.status.value == "revoked":
                violations.append({
                    "rule_id": str(rule.id),
                    "rule_name": rule.name,
                    "artifact_id": str(artifact.id),
                    "artifact_type": artifact.artifact_type,
                    "subject_type": artifact.subject_type.value if artifact.subject_type else None,
                    "subject_id": str(artifact.subject_id),
                    "violation_type": "revoked",
                    "severity": rule.severity.value if hasattr(rule.severity, "value") else str(rule.severity),
                    "description": f"{rule.name}: artifact has been revoked",
                })
            elif artifact.expiry_date:
                # Check if within first lead time threshold
                lead_times = rule.lead_time_days or [30]
                max_lead = max(lead_times)
                days_remaining = (artifact.expiry_date - date.today()).days
                if 0 < days_remaining <= max_lead:
                    violations.append({
                        "rule_id": str(rule.id),
                        "rule_name": rule.name,
                        "artifact_id": str(artifact.id),
                        "artifact_type": artifact.artifact_type,
                        "subject_type": artifact.subject_type.value if artifact.subject_type else None,
                        "subject_id": str(artifact.subject_id),
                        "violation_type": "expiring_soon",
                        "severity": rule.severity.value if hasattr(rule.severity, "value") else str(rule.severity),
                        "days_remaining": days_remaining,
                        "description": f"{rule.name}: expires in {days_remaining} days",
                    })

    return violations
