"""Default automation rules for CarrierBackOffice.

These are the 6 built-in system rules that ship with every organization.
They can be disabled but not deleted.
"""

from __future__ import annotations

DEFAULT_RULES: list[dict] = [
    {
        "name": "Auto-request missing POD after 24h",
        "description": "When a load is created and no POD is attached after 24 hours, "
                       "automatically create a document request for the POD.",
        "trigger_type": "schedule",
        "schedule_cron": "0 */6 * * *",  # Every 6 hours
        "conditions": [
            {"type": "doc_missing_after", "doc_type": "POD", "hours_after": 24},
        ],
        "actions": [
            {
                "type": "create_task",
                "queue": "docs",
                "title": "Missing POD - auto-detected",
                "description": "POD has not been uploaded within 24 hours of load creation.",
                "priority": "high",
            },
            {
                "type": "create_doc_request",
                "required_doc_types": ["POD"],
                "notes": "Automatically generated: POD missing after 24h.",
            },
        ],
        "is_system": True,
    },
    {
        "name": "Flag rate confirmation mismatch",
        "description": "When a document is validated and the rate confirmation amount "
                       "does not match the load billed amount, create an exception.",
        "trigger_type": "event",
        "trigger_event": "document.validated",
        "conditions": [
            {"type": "field_equals", "field": "validation_status", "value": "invalid"},
        ],
        "actions": [
            {
                "type": "add_exception_note",
                "exception_type": "mismatch_amount",
                "severity": "high",
                "description": "Rate confirmation amount does not match load billed amount.",
            },
        ],
        "is_system": True,
    },
    {
        "name": "Auto-generate invoice packet when docs complete",
        "description": "When a load transitions to 'docs_received' status, "
                       "automatically generate an invoice packet.",
        "trigger_type": "event",
        "trigger_event": "load.status_changed",
        "conditions": [
            {"type": "load_status_equals", "status": "docs_received"},
        ],
        "actions": [
            {"type": "generate_invoice_packet"},
        ],
        "is_system": True,
    },
    {
        "name": "Compliance expiry alert - 30 days",
        "description": "When a compliance artifact is detected as expiring within 30 days, "
                       "create a task for the compliance team.",
        "trigger_type": "event",
        "trigger_event": "compliance.expiring",
        "conditions": [
            {"type": "compliance_expiry_within", "days": 30},
        ],
        "actions": [
            {
                "type": "create_task",
                "queue": "compliance",
                "title": "Compliance artifact expiring soon",
                "description": "A compliance artifact is expiring within 30 days.",
                "priority": "high",
            },
            {
                "type": "send_notification",
                "channel": "email",
                "subject": "Compliance Alert: Artifact Expiring Soon",
                "body": "A compliance artifact is expiring within 30 days. Please take action.",
            },
        ],
        "is_system": True,
    },
    {
        "name": "Move load to docs_pending on creation",
        "description": "When a new load is created, automatically move it to docs_pending status.",
        "trigger_type": "event",
        "trigger_event": "load.created",
        "conditions": [],
        "actions": [
            {"type": "move_load_status", "new_status": "docs_pending"},
        ],
        "is_system": True,
    },
    {
        "name": "Create task for critical exceptions",
        "description": "When a critical exception is raised, create an urgent task "
                       "and notify the back-office team.",
        "trigger_type": "event",
        "trigger_event": "exception.raised",
        "conditions": [
            {"type": "severity_at_least", "min_severity": "critical"},
        ],
        "actions": [
            {
                "type": "create_task",
                "queue": "general",
                "title": "Critical exception requires attention",
                "description": "A critical exception has been raised and requires immediate attention.",
                "priority": "urgent",
            },
            {
                "type": "send_notification",
                "channel": "email",
                "subject": "CRITICAL: Exception Requires Immediate Attention",
                "body": "A critical exception has been raised. Please review immediately.",
            },
        ],
        "is_system": True,
    },
]
