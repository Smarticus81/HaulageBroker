"""Guardrails for copilot actions.

Enforces that write operations require explicit user confirmation.
Read operations execute immediately.
"""

from __future__ import annotations

from typing import Any

from .tools import TOOL_DEFINITIONS


def is_read_only(tool_name: str) -> bool:
    """Check if a tool is read-only (no user confirmation needed)."""
    for tool_def in TOOL_DEFINITIONS:
        if tool_def["name"] == tool_name:
            return tool_def.get("read_only", True)
    # Unknown tools are treated as write (safer default)
    return False


def build_confirmation_request(
    tool_name: str,
    parameters: dict[str, Any],
) -> dict[str, Any]:
    """Build a pending action confirmation request for the user.

    Returns:
        Dict describing the action that needs confirmation.
    """
    descriptions = {
        "create_task": "Create a new task",
        "create_document_request": "Create a document request",
        "propose_automation_rule": "Create a new automation rule",
    }

    return {
        "action_type": tool_name,
        "description": descriptions.get(tool_name, f"Execute action: {tool_name}"),
        "parameters": parameters,
    }


def validate_tool_parameters(tool_name: str, parameters: dict[str, Any]) -> list[str]:
    """Validate that required parameters are present for a tool call.

    Returns:
        List of validation error messages (empty if valid).
    """
    errors: list[str] = []

    for tool_def in TOOL_DEFINITIONS:
        if tool_def["name"] != tool_name:
            continue

        required = tool_def.get("parameters", {}).get("required", [])
        for param in required:
            if param not in parameters or parameters[param] is None:
                errors.append(f"Missing required parameter: {param}")
        break
    else:
        errors.append(f"Unknown tool: {tool_name}")

    return errors
