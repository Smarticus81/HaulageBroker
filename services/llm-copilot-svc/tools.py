"""Tool definitions for the LLM copilot.

Each tool has a name, description, parameters schema, and execute function.
Read-only tools execute immediately; write tools require user confirmation.
"""

from __future__ import annotations

import logging
from typing import Any
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from shared.models import (
    LoadRecord, Document, Exception_, Task, DocumentRequest,
)
from shared.audit import write_audit_log

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Tool definitions (for LLM function calling)
# ---------------------------------------------------------------------------

TOOL_DEFINITIONS: list[dict[str, Any]] = [
    {
        "name": "query_loads",
        "description": "Search and list load records with optional filters.",
        "parameters": {
            "type": "object",
            "properties": {
                "status": {"type": "string", "description": "Filter by load status"},
                "customer_id": {"type": "string", "description": "Filter by customer UUID"},
                "limit": {"type": "integer", "description": "Max results (default 10)"},
            },
        },
        "read_only": True,
    },
    {
        "name": "query_docs",
        "description": "Search and list documents with optional filters.",
        "parameters": {
            "type": "object",
            "properties": {
                "doc_type": {"type": "string", "description": "Filter by document type"},
                "linked_entity_id": {"type": "string", "description": "Filter by linked entity UUID"},
                "limit": {"type": "integer", "description": "Max results (default 10)"},
            },
        },
        "read_only": True,
    },
    {
        "name": "query_exceptions",
        "description": "Search and list exceptions with optional filters.",
        "parameters": {
            "type": "object",
            "properties": {
                "status": {"type": "string", "description": "Filter by exception status"},
                "type": {"type": "string", "description": "Filter by exception type"},
                "limit": {"type": "integer", "description": "Max results (default 10)"},
            },
        },
        "read_only": True,
    },
    {
        "name": "query_tasks",
        "description": "Search and list tasks with optional filters.",
        "parameters": {
            "type": "object",
            "properties": {
                "queue": {"type": "string", "description": "Filter by task queue"},
                "status": {"type": "string", "description": "Filter by task status"},
                "limit": {"type": "integer", "description": "Max results (default 10)"},
            },
        },
        "read_only": True,
    },
    {
        "name": "create_task",
        "description": "Create a new task. Requires user confirmation.",
        "parameters": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "Task title"},
                "queue": {"type": "string", "description": "Task queue (billing, compliance, docs, general)"},
                "priority": {"type": "string", "description": "Priority (urgent, high, medium, low)"},
                "description": {"type": "string", "description": "Task description"},
            },
            "required": ["title"],
        },
        "read_only": False,
    },
    {
        "name": "create_document_request",
        "description": "Create a document request. Requires user confirmation.",
        "parameters": {
            "type": "object",
            "properties": {
                "required_doc_types": {"type": "array", "items": {"type": "string"}, "description": "List of required doc types"},
                "target_email": {"type": "string", "description": "Email of the person to request from"},
                "notes": {"type": "string", "description": "Additional notes"},
            },
            "required": ["required_doc_types"],
        },
        "read_only": False,
    },
    {
        "name": "draft_email",
        "description": "Draft an email message. Returns the draft for review.",
        "parameters": {
            "type": "object",
            "properties": {
                "to": {"type": "string", "description": "Recipient email"},
                "subject": {"type": "string", "description": "Email subject"},
                "body": {"type": "string", "description": "Email body"},
            },
            "required": ["to", "subject", "body"],
        },
        "read_only": True,  # Drafting is read-only; sending would be write
    },
    {
        "name": "propose_automation_rule",
        "description": "Propose a new automation rule. Requires user confirmation.",
        "parameters": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "Rule name"},
                "trigger_type": {"type": "string", "description": "event or schedule"},
                "trigger_event": {"type": "string", "description": "Event type to trigger on"},
                "conditions": {"type": "array", "description": "Condition definitions"},
                "actions": {"type": "array", "description": "Action definitions"},
            },
            "required": ["name", "trigger_type"],
        },
        "read_only": False,
    },
]


# ---------------------------------------------------------------------------
# Read-only tool execution
# ---------------------------------------------------------------------------

async def execute_read_tool(
    db: AsyncSession,
    org_id: UUID,
    tool_name: str,
    parameters: dict[str, Any],
) -> dict[str, Any]:
    """Execute a read-only tool and return results."""
    executor = _READ_EXECUTORS.get(tool_name)
    if not executor:
        return {"error": f"Unknown read tool: {tool_name}"}
    return await executor(db, org_id, parameters)


async def _query_loads(db: AsyncSession, org_id: UUID, params: dict) -> dict:
    limit = params.get("limit", 10)
    query = select(LoadRecord).where(LoadRecord.org_id == org_id)

    if params.get("status"):
        query = query.where(LoadRecord.status == params["status"])
    if params.get("customer_id"):
        query = query.where(LoadRecord.customer_id == UUID(params["customer_id"]))

    result = await db.execute(query.order_by(LoadRecord.created_at.desc()).limit(limit))
    loads = result.scalars().all()

    return {
        "loads": [
            {
                "id": str(l.id),
                "load_number": l.load_number,
                "status": l.status.value,
                "billed_amount": str(l.billed_amount) if l.billed_amount else None,
                "pickup_date": str(l.pickup_date) if l.pickup_date else None,
                "delivery_date": str(l.delivery_date) if l.delivery_date else None,
            }
            for l in loads
        ],
        "count": len(loads),
    }


async def _query_docs(db: AsyncSession, org_id: UUID, params: dict) -> dict:
    limit = params.get("limit", 10)
    query = select(Document).where(Document.org_id == org_id)

    if params.get("doc_type"):
        query = query.where(Document.doc_type == params["doc_type"])
    if params.get("linked_entity_id"):
        query = query.where(Document.linked_entity_id == UUID(params["linked_entity_id"]))

    result = await db.execute(query.order_by(Document.created_at.desc()).limit(limit))
    docs = result.scalars().all()

    return {
        "documents": [
            {
                "id": str(d.id),
                "doc_type": d.doc_type.value,
                "original_filename": d.original_filename,
                "validation_status": d.validation_status.value,
            }
            for d in docs
        ],
        "count": len(docs),
    }


async def _query_exceptions(db: AsyncSession, org_id: UUID, params: dict) -> dict:
    limit = params.get("limit", 10)
    query = select(Exception_).where(Exception_.org_id == org_id)

    if params.get("status"):
        query = query.where(Exception_.status == params["status"])
    if params.get("type"):
        query = query.where(Exception_.type == params["type"])

    result = await db.execute(query.order_by(Exception_.created_at.desc()).limit(limit))
    exceptions = result.scalars().all()

    return {
        "exceptions": [
            {
                "id": str(e.id),
                "type": e.type.value,
                "severity": e.severity.value,
                "status": e.status.value,
                "description": e.description,
            }
            for e in exceptions
        ],
        "count": len(exceptions),
    }


async def _query_tasks(db: AsyncSession, org_id: UUID, params: dict) -> dict:
    limit = params.get("limit", 10)
    query = select(Task).where(Task.org_id == org_id)

    if params.get("queue"):
        query = query.where(Task.queue == params["queue"])
    if params.get("status"):
        query = query.where(Task.status == params["status"])

    result = await db.execute(query.order_by(Task.created_at.desc()).limit(limit))
    tasks = result.scalars().all()

    return {
        "tasks": [
            {
                "id": str(t.id),
                "title": t.title,
                "queue": t.queue.value,
                "priority": t.priority.value,
                "status": t.status.value,
            }
            for t in tasks
        ],
        "count": len(tasks),
    }


async def _draft_email(db: AsyncSession, org_id: UUID, params: dict) -> dict:
    return {
        "draft": {
            "to": params.get("to", ""),
            "subject": params.get("subject", ""),
            "body": params.get("body", ""),
        },
        "message": "Email draft prepared. Review and send when ready.",
    }


_READ_EXECUTORS = {
    "query_loads": _query_loads,
    "query_docs": _query_docs,
    "query_exceptions": _query_exceptions,
    "query_tasks": _query_tasks,
    "draft_email": _draft_email,
}


# ---------------------------------------------------------------------------
# Write tool execution (requires confirmation)
# ---------------------------------------------------------------------------

async def execute_write_action(
    db: AsyncSession,
    org_id: UUID,
    user_id: UUID,
    action_type: str,
    parameters: dict[str, Any],
) -> dict[str, Any]:
    """Execute a confirmed write action.

    Called only after user confirms the pending action.
    """
    if action_type == "create_task":
        task = Task(
            org_id=org_id,
            queue=parameters.get("queue", "general"),
            title=parameters["title"],
            description=parameters.get("description", ""),
            priority=parameters.get("priority", "medium"),
        )
        db.add(task)
        await db.commit()
        await db.refresh(task)

        await write_audit_log(
            db, org_id=org_id, actor_id=user_id, actor_type="copilot",
            action="task.created", entity_type="task", entity_id=task.id,
            after_state={"title": task.title}, source="copilot",
        )
        return {"task_id": str(task.id), "message": f"Task '{task.title}' created."}

    elif action_type == "create_document_request":
        doc_req = DocumentRequest(
            org_id=org_id,
            requested_by=user_id,
            target_email=parameters.get("target_email"),
            required_doc_types=parameters.get("required_doc_types", []),
            notes=parameters.get("notes", "Created via Copilot"),
        )
        db.add(doc_req)
        await db.commit()
        await db.refresh(doc_req)

        return {"doc_request_id": str(doc_req.id), "message": "Document request created."}

    elif action_type == "propose_automation_rule":
        from shared.models import AutomationRule

        rule = AutomationRule(
            org_id=org_id,
            name=parameters["name"],
            trigger_type=parameters.get("trigger_type", "event"),
            trigger_event=parameters.get("trigger_event"),
            conditions=parameters.get("conditions", []),
            actions=parameters.get("actions", []),
            created_by=user_id,
        )
        db.add(rule)
        await db.commit()
        await db.refresh(rule)

        return {"rule_id": str(rule.id), "message": f"Automation rule '{rule.name}' created."}

    else:
        return {"error": f"Unknown write action: {action_type}"}
