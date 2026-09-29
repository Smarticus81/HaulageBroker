"""Document validation against linked load records.

Checks that extracted fields are consistent with the load data.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any


def validate_document(doc: Any, load: Any) -> tuple[str, list[str]]:
    """Validate a document's extracted fields against its linked load record.

    Args:
        doc: Document ORM instance with extracted_fields populated.
        load: LoadRecord ORM instance.

    Returns:
        Tuple of (validation_status, list_of_error_strings).
        Status is one of: 'valid', 'invalid', 'needs_review'.
    """
    errors: list[str] = []
    fields = doc.extracted_fields or {}
    doc_type = doc.doc_type.value if hasattr(doc.doc_type, "value") else str(doc.doc_type)

    if not fields:
        return "needs_review", ["No extracted fields available for validation"]

    if doc_type == "POD":
        errors.extend(_validate_pod(fields, load))
    elif doc_type == "RateConf":
        errors.extend(_validate_rate_conf(fields, load))
    elif doc_type == "BOL":
        errors.extend(_validate_bol(fields, load))
    elif doc_type in ("InsuranceCert", "CDL", "MedCard"):
        # Compliance documents - check expiry only
        if fields.get("expiry_date") and fields["expiry_date"] < str(load.pickup_date or ""):
            errors.append(f"{doc_type} expired before pickup date")
    else:
        # For other doc types, just confirm the document exists and has some fields
        return "valid", []

    if errors:
        return "invalid", errors
    return "valid", []


def _validate_pod(fields: dict, load: Any) -> list[str]:
    """Validate POD fields against load record."""
    errors = []

    if not fields.get("receiver_name"):
        errors.append("POD missing receiver name")

    if not fields.get("delivery_date"):
        errors.append("POD missing delivery date")
    elif load.delivery_date and fields["delivery_date"] != str(load.delivery_date):
        errors.append(
            f"POD delivery date ({fields['delivery_date']}) does not match "
            f"load delivery date ({load.delivery_date})"
        )

    if fields.get("signature_present") is False:
        errors.append("POD missing signature")

    return errors


def _validate_rate_conf(
    fields: dict,
    load: Any,
    threshold_pct: float = 0.0,
    require_route: bool = True,
) -> list[str]:
    """Validate rate confirmation fields against load record.

    ``threshold_pct`` widens the amount tolerance (0.01 = 1% of the billed
    amount); the tolerance is never below one cent.
    """
    errors = []

    if not fields.get("rate"):
        errors.append("Rate confirmation missing rate amount")
    elif load.billed_amount:
        try:
            rate = Decimal(str(fields["rate"]))
            billed = Decimal(str(load.billed_amount))
            tolerance = max(Decimal("0.01"), abs(billed) * Decimal(str(threshold_pct)))
            if abs(rate - billed) > tolerance:
                errors.append(
                    f"Rate confirmation amount ({rate}) does not match "
                    f"billed amount ({billed})"
                )
        except (ValueError, TypeError, ArithmeticError):
            errors.append("Rate confirmation has non-numeric rate value")

    if require_route and not fields.get("origin"):
        errors.append("Rate confirmation missing origin")

    if require_route and not fields.get("destination"):
        errors.append("Rate confirmation missing destination")

    return errors


def _validate_bol(fields: dict, load: Any) -> list[str]:
    """Validate BOL fields against load record."""
    errors = []

    if not fields.get("shipper"):
        errors.append("BOL missing shipper information")

    if not fields.get("consignee"):
        errors.append("BOL missing consignee information")

    if not fields.get("pickup_date"):
        errors.append("BOL missing pickup date")
    elif load is not None and load.pickup_date and fields["pickup_date"] != str(load.pickup_date):
        errors.append(
            f"BOL pickup date ({fields['pickup_date']}) does not match "
            f"load pickup date ({load.pickup_date})"
        )

    return errors


# ---------------------------------------------------------------------------
# Object API (no ORM required)
# ---------------------------------------------------------------------------

@dataclass
class ValidationResult:
    is_valid: bool
    errors: list[str] = field(default_factory=list)


class _LoadView:
    """Attribute access over a load given as a dict or an ORM row."""

    def __init__(self, load: Any) -> None:
        self._load = load

    def __getattr__(self, name: str) -> Any:
        load = self._load
        if load is None:
            return None
        if isinstance(load, dict):
            return load.get(name)
        return getattr(load, name, None)


class DocumentValidator:
    """Per-document-type validators returning :class:`ValidationResult`.

    Accepts extracted-field dicts and loads as dicts (as the OCR pipeline and
    tests hand them over) or ORM rows; shares the rules used by
    :func:`validate_document`.
    """

    def validate_pod(self, extracted: dict, load: Any) -> ValidationResult:
        errors = _validate_pod(extracted or {}, _LoadView(load))
        return ValidationResult(is_valid=not errors, errors=errors)

    def validate_rate_conf(self, extracted: dict, load: Any, threshold_pct: float = 0.0) -> ValidationResult:
        errors = _validate_rate_conf(extracted or {}, _LoadView(load), threshold_pct=threshold_pct, require_route=False)
        return ValidationResult(is_valid=not errors, errors=errors)

    def validate_bol(self, extracted: dict, load: Any = None) -> ValidationResult:
        errors = _validate_bol(extracted or {}, _LoadView(load) if load is not None else None)
        return ValidationResult(is_valid=not errors, errors=errors)
