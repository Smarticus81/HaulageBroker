"""Document validation against linked load records.

Checks that extracted fields are consistent with the load data.
"""

from __future__ import annotations

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


def _validate_rate_conf(fields: dict, load: Any) -> list[str]:
    """Validate rate confirmation fields against load record."""
    errors = []

    if not fields.get("rate"):
        errors.append("Rate confirmation missing rate amount")
    elif load.billed_amount:
        try:
            rate = Decimal(str(fields["rate"]))
            if abs(rate - load.billed_amount) > Decimal("0.01"):
                errors.append(
                    f"Rate confirmation amount ({rate}) does not match "
                    f"billed amount ({load.billed_amount})"
                )
        except (ValueError, TypeError):
            errors.append("Rate confirmation has non-numeric rate value")

    if not fields.get("origin"):
        errors.append("Rate confirmation missing origin")

    if not fields.get("destination"):
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
    elif load.pickup_date and fields["pickup_date"] != str(load.pickup_date):
        errors.append(
            f"BOL pickup date ({fields['pickup_date']}) does not match "
            f"load pickup date ({load.pickup_date})"
        )

    return errors
