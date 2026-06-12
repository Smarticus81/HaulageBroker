"""Field extraction logic per document type.

Uses regex patterns on OCR text for MVP. Marks as needing LLM fallback
when confidence is low.
"""

from __future__ import annotations

import re
from typing import Any


def extract_fields(doc_type: str, ocr_text: str) -> tuple[dict[str, Any], float, bool]:
    """Extract structured fields from OCR text based on document type.

    Args:
        doc_type: The document type (POD, RateConf, BOL, etc.).
        ocr_text: Raw OCR text content.

    Returns:
        Tuple of (extracted_fields_dict, confidence_score, needs_llm_fallback).
    """
    text = ocr_text.strip()
    if not text:
        return {}, 0.0, True

    extractors = {
        "POD": _extract_pod,
        "RateConf": _extract_rate_conf,
        "BOL": _extract_bol,
        "InsuranceCert": _extract_insurance_cert,
        "CDL": _extract_cdl,
        "MedCard": _extract_med_card,
    }

    extractor = extractors.get(doc_type)
    if not extractor:
        return {}, 0.0, True

    fields = extractor(text)
    filled = sum(1 for v in fields.values() if v is not None)
    total = len(fields) or 1
    confidence = filled / total
    needs_llm = confidence < 0.5

    return fields, confidence, needs_llm


def _extract_pod(text: str) -> dict[str, Any]:
    """Extract POD fields: delivery_date, receiver_name, signature_present."""
    fields: dict[str, Any] = {
        "delivery_date": None,
        "receiver_name": None,
        "signature_present": None,
    }

    # Delivery date patterns
    date_match = re.search(
        r"(?:deliver(?:y|ed)\s*(?:date)?)\s*[:\-]?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})",
        text, re.IGNORECASE,
    )
    if date_match:
        fields["delivery_date"] = date_match.group(1)

    # Receiver/received by
    receiver_match = re.search(
        r"(?:received\s+by|receiver|signed\s+by)\s*[:\-]?\s*([A-Za-z][A-Za-z\s]{1,40})",
        text, re.IGNORECASE,
    )
    if receiver_match:
        fields["receiver_name"] = receiver_match.group(1).strip()

    # Signature detection
    sig_patterns = [r"signature", r"signed", r"/s/", r"x[_\s]*_{3,}"]
    fields["signature_present"] = any(re.search(p, text, re.IGNORECASE) for p in sig_patterns)

    return fields


def _extract_rate_conf(text: str) -> dict[str, Any]:
    """Extract rate confirmation fields: rate, accessorials, origin, destination."""
    fields: dict[str, Any] = {
        "rate": None,
        "accessorials": None,
        "origin": None,
        "destination": None,
    }

    # Rate amount
    rate_match = re.search(
        r"(?:total\s*rate|agreed\s*rate|line\s*haul|rate)\s*[:\-]?\s*\$?\s*([\d,]+\.?\d{0,2})",
        text, re.IGNORECASE,
    )
    if rate_match:
        fields["rate"] = rate_match.group(1).replace(",", "")

    # Accessorials
    acc_match = re.search(
        r"(?:accessorial|additional\s*charges?)\s*[:\-]?\s*\$?\s*([\d,]+\.?\d{0,2})",
        text, re.IGNORECASE,
    )
    if acc_match:
        fields["accessorials"] = acc_match.group(1).replace(",", "")

    # Origin
    origin_match = re.search(
        r"(?:origin|pickup|ship\s*from)\s*[:\-]?\s*([A-Za-z\s]+,\s*[A-Z]{2})",
        text, re.IGNORECASE,
    )
    if origin_match:
        fields["origin"] = origin_match.group(1).strip()

    # Destination
    dest_match = re.search(
        r"(?:destination|delivery|deliver\s*to|ship\s*to)\s*[:\-]?\s*([A-Za-z\s]+,\s*[A-Z]{2})",
        text, re.IGNORECASE,
    )
    if dest_match:
        fields["destination"] = dest_match.group(1).strip()

    return fields


def _extract_bol(text: str) -> dict[str, Any]:
    """Extract BOL fields: shipper, consignee, pickup_date, pieces, weight."""
    fields: dict[str, Any] = {
        "shipper": None,
        "consignee": None,
        "pickup_date": None,
        "pieces": None,
        "weight": None,
    }

    # Shipper
    shipper_match = re.search(
        r"shipper\s*[:\-]?\s*([A-Za-z][\w\s,\.]{2,50})",
        text, re.IGNORECASE,
    )
    if shipper_match:
        fields["shipper"] = shipper_match.group(1).strip()

    # Consignee
    consignee_match = re.search(
        r"consignee\s*[:\-]?\s*([A-Za-z][\w\s,\.]{2,50})",
        text, re.IGNORECASE,
    )
    if consignee_match:
        fields["consignee"] = consignee_match.group(1).strip()

    # Pickup date
    date_match = re.search(
        r"(?:pickup|ship)\s*(?:date)?\s*[:\-]?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})",
        text, re.IGNORECASE,
    )
    if date_match:
        fields["pickup_date"] = date_match.group(1)

    # Pieces
    pieces_match = re.search(r"(?:pieces?|qty|quantity)\s*[:\-]?\s*(\d+)", text, re.IGNORECASE)
    if pieces_match:
        fields["pieces"] = int(pieces_match.group(1))

    # Weight
    weight_match = re.search(
        r"(?:weight|gross\s*weight)\s*[:\-]?\s*([\d,]+)\s*(?:lbs?|pounds?)?",
        text, re.IGNORECASE,
    )
    if weight_match:
        fields["weight"] = weight_match.group(1).replace(",", "")

    return fields


def _extract_insurance_cert(text: str) -> dict[str, Any]:
    """Extract insurance certificate fields."""
    fields: dict[str, Any] = {
        "policy_number": None,
        "expiry_date": None,
        "coverage_amount": None,
    }

    policy_match = re.search(
        r"(?:policy\s*(?:no|number|#))\s*[:\-]?\s*([A-Za-z0-9\-]+)",
        text, re.IGNORECASE,
    )
    if policy_match:
        fields["policy_number"] = policy_match.group(1)

    expiry_match = re.search(
        r"(?:expir(?:y|ation)\s*date|valid\s*(?:through|until))\s*[:\-]?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})",
        text, re.IGNORECASE,
    )
    if expiry_match:
        fields["expiry_date"] = expiry_match.group(1)

    coverage_match = re.search(
        r"(?:coverage|limit)\s*[:\-]?\s*\$?\s*([\d,]+)",
        text, re.IGNORECASE,
    )
    if coverage_match:
        fields["coverage_amount"] = coverage_match.group(1).replace(",", "")

    return fields


def _extract_cdl(text: str) -> dict[str, Any]:
    """Extract CDL fields."""
    fields: dict[str, Any] = {
        "license_number": None,
        "expiry_date": None,
        "endorsements": None,
    }

    license_match = re.search(
        r"(?:license\s*(?:no|number|#)|dl\s*(?:no|number|#))\s*[:\-]?\s*([A-Za-z0-9\-]+)",
        text, re.IGNORECASE,
    )
    if license_match:
        fields["license_number"] = license_match.group(1)

    expiry_match = re.search(
        r"(?:expir(?:y|ation)\s*date|valid\s*(?:through|until)|exp)\s*[:\-]?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})",
        text, re.IGNORECASE,
    )
    if expiry_match:
        fields["expiry_date"] = expiry_match.group(1)

    endorse_match = re.search(
        r"endorsement[s]?\s*[:\-]?\s*([A-Z,\s]+)",
        text, re.IGNORECASE,
    )
    if endorse_match:
        fields["endorsements"] = [e.strip() for e in endorse_match.group(1).split(",") if e.strip()]

    return fields


def _extract_med_card(text: str) -> dict[str, Any]:
    """Extract medical card fields."""
    fields: dict[str, Any] = {
        "expiry_date": None,
        "physician_name": None,
    }

    expiry_match = re.search(
        r"(?:expir(?:y|ation)\s*date|valid\s*(?:through|until)|certificate\s*expires)\s*[:\-]?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})",
        text, re.IGNORECASE,
    )
    if expiry_match:
        fields["expiry_date"] = expiry_match.group(1)

    physician_match = re.search(
        r"(?:physician|examiner|doctor|dr\.?)\s*(?:name)?\s*[:\-]?\s*([A-Za-z][A-Za-z\s\.]{2,40})",
        text, re.IGNORECASE,
    )
    if physician_match:
        fields["physician_name"] = physician_match.group(1).strip()

    return fields
