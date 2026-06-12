"""Condition evaluators for automation rules.

Each condition is a dict with a 'type' key and type-specific parameters.
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


def evaluate_conditions(conditions: list[dict[str, Any]], context: dict[str, Any]) -> bool:
    """Evaluate all conditions against the given context.

    All conditions must pass (AND logic).

    Returns:
        True if all conditions are satisfied.
    """
    if not conditions:
        return True

    for condition in conditions:
        if not _evaluate_single(condition, context):
            return False
    return True


def _evaluate_single(condition: dict[str, Any], context: dict[str, Any]) -> bool:
    """Evaluate a single condition."""
    cond_type = condition.get("type", "")
    evaluator = _EVALUATORS.get(cond_type)

    if not evaluator:
        logger.warning("Unknown condition type: %s", cond_type)
        return False

    try:
        return evaluator(condition, context)
    except Exception:
        logger.exception("Condition evaluation failed: %s", condition)
        return False


def _doc_missing_after(condition: dict[str, Any], context: dict[str, Any]) -> bool:
    """Check if a required doc type is still missing after N hours.

    Params: doc_type (str), hours_after (int).
    Context should include: load_created_at, present_doc_types.
    """
    required_type = condition.get("doc_type")
    present_types = context.get("present_doc_types", [])
    return required_type not in present_types


def _compliance_expiry_within(condition: dict[str, Any], context: dict[str, Any]) -> bool:
    """Check if a compliance artifact expires within N days.

    Params: days (int).
    Context should include: days_remaining.
    """
    threshold = condition.get("days", 30)
    days_remaining = context.get("days_remaining")
    if days_remaining is None:
        return False
    return days_remaining <= threshold


def _load_status_equals(condition: dict[str, Any], context: dict[str, Any]) -> bool:
    """Check if the load status matches a given value.

    Params: status (str).
    """
    expected = condition.get("status")
    actual = context.get("new_status") or context.get("status")
    return actual == expected


def _severity_at_least(condition: dict[str, Any], context: dict[str, Any]) -> bool:
    """Check if severity meets a minimum threshold.

    Params: min_severity (str).
    """
    order = {"low": 0, "medium": 1, "high": 2, "critical": 3}
    min_sev = condition.get("min_severity", "medium")
    actual_sev = context.get("severity", "low")
    return order.get(actual_sev, 0) >= order.get(min_sev, 0)


def _event_type_equals(condition: dict[str, Any], context: dict[str, Any]) -> bool:
    """Check if the event type matches.

    Params: event_type (str).
    """
    return context.get("event_type") == condition.get("event_type")


def _field_equals(condition: dict[str, Any], context: dict[str, Any]) -> bool:
    """Generic field equality check.

    Params: field (str), value (any).
    """
    field = condition.get("field", "")
    expected = condition.get("value")
    actual = context.get(field)
    return actual == expected


_EVALUATORS = {
    "doc_missing_after": _doc_missing_after,
    "compliance_expiry_within": _compliance_expiry_within,
    "load_status_equals": _load_status_equals,
    "severity_at_least": _severity_at_least,
    "event_type_equals": _event_type_equals,
    "field_equals": _field_equals,
}
