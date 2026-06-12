"""Action executors for automation rules.

Each action is a dict with a 'type' key and type-specific parameters.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from shared.models import (
    Task,
    DocumentRequest,
    Exception_,
    InvoicePacket,
    LoadRecord,
)
from shared.audit import write_audit_log

logger = logging.getLogger(__name__)


async def execute_action(
    db: AsyncSession,
    action_def: dict[str, Any],
    trigger_data: dict[str, Any],
    org_id: UUID,
) -> dict[str, Any]:
    """Execute a single automation action.

    Args:
        db: Database session.
        action_def: Action definition dict with 'type' and parameters.
        trigger_data: The data that triggered this automation.
        org_id: Organization ID.

    Returns:
        Result dict describing what was done.
    """
    action_type = action_def.get("type", "")
    executor = _EXECUTORS.get(action_type)

    if not executor:
        raise ValueError(f"Unknown action type: {action_type}")

    return await executor(db, action_def, trigger_data, org_id)


async def _create_task(
    db: AsyncSession, action_def: dict, trigger_data: dict, org_id: UUID
) -> dict[str, Any]:
    """Create a task from automation action."""
    task = Task(
        org_id=org_id,
        queue=action_def.get("queue", "general"),
        title=action_def.get("title", "Automated task"),
        description=action_def.get("description", ""),
        priority=action_def.get("priority", "medium"),
        linked_entity_type=trigger_data.get("linked_entity_type") or action_def.get("linked_entity_type"),
        linked_entity_id=UUID(trigger_data["linked_entity_id"]) if trigger_data.get("linked_entity_id") else None,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)

    await write_audit_log(
        db, org_id=org_id, actor_id=None, actor_type="automation",
        action="task.created", entity_type="task", entity_id=task.id,
        after_state={"title": task.title}, source="automation",
    )

    return {"task_id": str(task.id), "title": task.title}


async def _send_notification(
    db: AsyncSession, action_def: dict, trigger_data: dict, org_id: UUID
) -> dict[str, Any]:
    """Send a notification (stub - logs for dev)."""
    channel = action_def.get("channel", "email")
    recipient = action_def.get("recipient", "")
    subject = action_def.get("subject", "Automated notification")
    body = action_def.get("body", "")

    logger.info(
        "NOTIFICATION [%s] to=%s subject=%s body=%s",
        channel, recipient, subject, body,
    )

    return {"channel": channel, "recipient": recipient, "subject": subject}


async def _create_doc_request(
    db: AsyncSession, action_def: dict, trigger_data: dict, org_id: UUID
) -> dict[str, Any]:
    """Create a document request from automation action."""
    doc_request = DocumentRequest(
        org_id=org_id,
        requested_by=UUID(action_def["requested_by"]) if action_def.get("requested_by") else None,
        target_email=action_def.get("target_email"),
        required_doc_types=action_def.get("required_doc_types", []),
        linked_entity_type=trigger_data.get("linked_entity_type") or action_def.get("linked_entity_type"),
        linked_entity_id=UUID(trigger_data["linked_entity_id"]) if trigger_data.get("linked_entity_id") else None,
        notes=action_def.get("notes", "Auto-generated document request"),
    )
    db.add(doc_request)
    await db.commit()
    await db.refresh(doc_request)

    return {"doc_request_id": str(doc_request.id)}


async def _move_load_status(
    db: AsyncSession, action_def: dict, trigger_data: dict, org_id: UUID
) -> dict[str, Any]:
    """Change a load record's status."""
    from sqlalchemy import select

    load_id = trigger_data.get("load_id") or action_def.get("load_id")
    if not load_id:
        raise ValueError("No load_id in trigger_data or action_def")

    result = await db.execute(
        select(LoadRecord).where(LoadRecord.id == UUID(load_id), LoadRecord.org_id == org_id)
    )
    load = result.scalar_one_or_none()
    if not load:
        raise ValueError(f"Load {load_id} not found")

    old_status = load.status.value
    new_status = action_def.get("new_status", "docs_pending")
    load.status = new_status
    await db.commit()

    await write_audit_log(
        db, org_id=org_id, actor_id=None, actor_type="automation",
        action="load.status_changed", entity_type="load_record", entity_id=load.id,
        before_state={"status": old_status}, after_state={"status": new_status},
        source="automation",
    )

    return {"load_id": load_id, "old_status": old_status, "new_status": new_status}


async def _generate_invoice_packet(
    db: AsyncSession, action_def: dict, trigger_data: dict, org_id: UUID
) -> dict[str, Any]:
    """Generate an invoice packet for a load."""
    from billing_svc.packet_builder import build_packet
    from sqlalchemy import select

    load_id = trigger_data.get("load_id") or action_def.get("load_id")
    if not load_id:
        raise ValueError("No load_id provided")

    result = await db.execute(
        select(LoadRecord).where(LoadRecord.id == UUID(load_id), LoadRecord.org_id == org_id)
    )
    load = result.scalar_one_or_none()
    if not load:
        raise ValueError(f"Load {load_id} not found")

    packet_data = await build_packet(db, load)

    packet = InvoicePacket(
        org_id=org_id,
        load_record_id=UUID(load_id),
        required_docs=packet_data["required_docs"],
        docs_present=packet_data["docs_present"],
        packet_status=packet_data["status"],
    )
    db.add(packet)
    await db.commit()
    await db.refresh(packet)

    return {"packet_id": str(packet.id), "status": packet_data["status"]}


async def _add_exception_note(
    db: AsyncSession, action_def: dict, trigger_data: dict, org_id: UUID
) -> dict[str, Any]:
    """Add a note/create an exception for a linked entity."""
    exc = Exception_(
        org_id=org_id,
        type=action_def.get("exception_type", "other"),
        severity=action_def.get("severity", "medium"),
        linked_entity_type=trigger_data.get("linked_entity_type", action_def.get("linked_entity_type", "")),
        linked_entity_id=UUID(trigger_data.get("linked_entity_id", action_def.get("linked_entity_id", ""))),
        description=action_def.get("description", "Auto-generated exception"),
    )
    db.add(exc)
    await db.commit()
    await db.refresh(exc)

    return {"exception_id": str(exc.id)}


_EXECUTORS = {
    "create_task": _create_task,
    "send_notification": _send_notification,
    "create_doc_request": _create_doc_request,
    "move_load_status": _move_load_status,
    "generate_invoice_packet": _generate_invoice_packet,
    "add_exception_note": _add_exception_note,
}
