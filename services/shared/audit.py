"""Audit log helper for recording all entity changes."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def write_audit_log(
    db: AsyncSession,
    *,
    org_id: UUID,
    actor_id: UUID | None,
    actor_type: str,
    action: str,
    entity_type: str,
    entity_id: UUID | None,
    before_state: dict[str, Any] | None = None,
    after_state: dict[str, Any] | None = None,
    source: str | None = None,
    metadata: dict[str, Any] | None = None,
    ip_address: str | None = None,
) -> None:
    """Insert an append-only audit log record."""
    import json

    stmt = text("""
        INSERT INTO audit_logs
            (org_id, actor_id, actor_type, action, entity_type, entity_id,
             before_state, after_state, source, metadata, ip_address)
        VALUES
            (:org_id, :actor_id, :actor_type, :action, :entity_type, :entity_id,
             :before_state, :after_state, :source, :metadata, :ip_address)
    """)

    await db.execute(
        stmt,
        {
            "org_id": str(org_id),
            "actor_id": str(actor_id) if actor_id else None,
            "actor_type": actor_type,
            "action": action,
            "entity_type": entity_type,
            "entity_id": str(entity_id) if entity_id else None,
            "before_state": json.dumps(before_state) if before_state else None,
            "after_state": json.dumps(after_state) if after_state else None,
            "source": source,
            "metadata": json.dumps(metadata or {}),
            "ip_address": ip_address,
        },
    )
    await db.commit()
