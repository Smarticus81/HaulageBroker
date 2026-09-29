"""Condition evaluators for automation rules.

Each condition is a dict with a 'type' key and type-specific parameters.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta, timezone
from typing import Any

logger = logging.getLogger(__name__)


def evaluate_condition(condition: dict[str, Any], context: dict[str, Any]) -> bool:
    """Evaluate a single condition against the given context.

    Conditions may carry their parameters flat (``{"type": ..., "days": 30}``)
    or nested under ``params`` (``{"type": ..., "params": {"days": 30}}``),
    which is the shape the seeded default rules use.
    """
    return _evaluate_single(condition, context)


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


def _params(condition: dict[str, Any]) -> dict[str, Any]:
    """Merge flat keys and the nested ``params`` dict of a condition."""
    merged = {k: v for k, v in condition.items() if k not in ("type", "params")}
    merged.update(condition.get("params") or {})
    return merged


def _get(obj: Any, key: str, default: Any = None) -> Any:
    """Read ``key`` from a dict or an attribute from an object."""
    if obj is None:
        return default
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def _parse_datetime(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, date):
        return datetime(value.year, value.month, value.day)
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def _parse_date(value: Any) -> date | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    try:
        return date.fromisoformat(str(value)[:10])
    except ValueError:
        return None


def _doc_missing_after(condition: dict[str, Any], context: dict[str, Any]) -> bool:
    """Check if a required doc type is still missing after N hours.

    Params: doc_type (str), hours (int, optional; ``hours_after`` accepted).
    Context: ``present_doc_types`` or ``load.documents`` (list of {doc_type});
    the elapsed time is measured from ``reference_time``, ``load.delivery_date``
    or ``load_created_at`` when one of them is present.
    """
    params = _params(condition)
    required_type = params.get("doc_type")
    load = context.get("load") or {}

    present_types = context.get("present_doc_types")
    if present_types is None:
        present_types = [_get(d, "doc_type") for d in (_get(load, "documents") or [])]
    if required_type in present_types:
        return False

    hours = params.get("hours", params.get("hours_after"))
    reference = (
        context.get("reference_time")
        or _get(load, "delivery_date")
        or context.get("load_created_at")
    )
    reference_dt = _parse_datetime(reference)
    if hours is None or reference_dt is None:
        return True
    now = datetime.now(timezone.utc) if reference_dt.tzinfo else datetime.utcnow()
    return now - reference_dt >= timedelta(hours=float(hours))


def _compliance_expiry_within(condition: dict[str, Any], context: dict[str, Any]) -> bool:
    """Check if a compliance artifact expires within N days.

    Params: days (int).
    Context: ``days_remaining`` or ``artifact.expiry_date`` (ISO date); revoked
    artifacts never match.
    """
    threshold = _params(condition).get("days", 30)
    days_remaining = context.get("days_remaining")
    if days_remaining is None:
        artifact = context.get("artifact")
        if _get(artifact, "status") == "revoked":
            return False
        expiry = _parse_date(_get(artifact, "expiry_date"))
        if expiry is not None:
            days_remaining = (expiry - date.today()).days
    if days_remaining is None:
        return False
    return days_remaining <= threshold


def _amount_mismatch(condition: dict[str, Any], context: dict[str, Any]) -> bool:
    """Check if an extracted amount differs from the load amount by more than a share.

    Params: threshold_pct (float, e.g. 0.02 for 2%).
    Context: load_amount, extracted_amount.
    """
    threshold = float(_params(condition).get("threshold_pct", 0.02))
    load_amount = context.get("load_amount")
    extracted_amount = context.get("extracted_amount")
    if load_amount in (None, 0) or extracted_amount is None:
        return False
    load_amount = float(load_amount)
    return abs(float(extracted_amount) - load_amount) / abs(load_amount) > threshold


def _load_status_equals(condition: dict[str, Any], context: dict[str, Any]) -> bool:
    """Check if the load status matches a given value.

    Params: status (str).
    """
    expected = _params(condition).get("status")
    actual = context.get("new_status") or context.get("status")
    return actual == expected


def _severity_at_least(condition: dict[str, Any], context: dict[str, Any]) -> bool:
    """Check if severity meets a minimum threshold.

    Params: min_severity (str).
    """
    order = {"low": 0, "medium": 1, "high": 2, "critical": 3}
    min_sev = _params(condition).get("min_severity", "medium")
    actual_sev = context.get("severity", "low")
    return order.get(actual_sev, 0) >= order.get(min_sev, 0)


def _event_type_equals(condition: dict[str, Any], context: dict[str, Any]) -> bool:
    """Check if the event type matches.

    Params: event_type (str).
    """
    return context.get("event_type") == _params(condition).get("event_type")


def _field_equals(condition: dict[str, Any], context: dict[str, Any]) -> bool:
    """Generic field equality check.

    Params: field (str), value (any).
    """
    params = _params(condition)
    field = params.get("field", "")
    expected = params.get("value")
    actual = context.get(field)
    return actual == expected


_EVALUATORS = {
    "doc_missing_after": _doc_missing_after,
    "compliance_expiry_within": _compliance_expiry_within,
    "amount_mismatch": _amount_mismatch,
    "load_status_equals": _load_status_equals,
    "severity_at_least": _severity_at_least,
    "event_type_equals": _event_type_equals,
    "field_equals": _field_equals,
}
