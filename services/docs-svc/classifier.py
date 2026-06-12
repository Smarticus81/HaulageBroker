"""Document classifier using keyword and pattern matching.

Determines document type from filename and OCR text content.
"""

from __future__ import annotations

import re

# Keyword/pattern rules: (doc_type, filename_patterns, text_patterns)
_RULES: list[tuple[str, list[str], list[str]]] = [
    ("POD", ["pod", "proof_of_delivery", "delivery_receipt"], ["proof of delivery", "delivered to", "received by", "delivery confirmation"]),
    ("BOL", ["bol", "bill_of_lading", "billoflading"], ["bill of lading", "shipper:", "consignee:", "b/l number"]),
    ("RateConf", ["rate_con", "ratecon", "rate_confirmation"], ["rate confirmation", "agreed rate", "total rate", "accessorial"]),
    ("Lumper", ["lumper"], ["lumper", "unloading fee", "lumper receipt"]),
    ("ScaleTicket", ["scale", "weight_ticket"], ["scale ticket", "gross weight", "tare weight", "net weight"]),
    ("DetentionForm", ["detention"], ["detention", "waiting time", "detention charge"]),
    ("RepairReceipt", ["repair", "maintenance"], ["repair order", "work order", "parts total", "labor total"]),
    ("FuelReceipt", ["fuel"], ["fuel receipt", "gallons", "diesel", "fuel purchase"]),
    ("InsuranceCert", ["insurance", "cert_of_insurance", "coi"], ["certificate of insurance", "policy number", "coverage amount", "general liability"]),
    ("CDL", ["cdl", "license", "drivers_license"], ["commercial driver", "cdl", "license number", "class a", "class b"]),
    ("MedCard", ["medical", "medcard", "med_card", "dot_physical"], ["medical examiner", "dot physical", "medical certificate"]),
    ("AnnualInspection", ["annual_inspection", "inspection"], ["annual inspection", "vehicle inspection", "fhwa"]),
    ("DVIR", ["dvir", "vehicle_inspection_report"], ["driver vehicle inspection", "dvir", "pre-trip", "post-trip"]),
]


def classify(filename: str, ocr_text: str) -> tuple[str, float]:
    """Classify a document based on filename and OCR text.

    Returns:
        Tuple of (document_type, confidence_score) where confidence is 0.0-1.0.
    """
    filename_lower = filename.lower().replace(" ", "_").replace("-", "_")
    text_lower = ocr_text.lower()

    best_type = "Other"
    best_score = 0.0

    for doc_type, filename_patterns, text_patterns in _RULES:
        score = 0.0

        # Filename match (high signal)
        for pattern in filename_patterns:
            if pattern in filename_lower:
                score += 0.5
                break

        # Text content match
        text_hits = 0
        for pattern in text_patterns:
            if pattern in text_lower:
                text_hits += 1
        if text_patterns:
            text_ratio = text_hits / len(text_patterns)
            score += text_ratio * 0.5

        if score > best_score:
            best_score = score
            best_type = doc_type

    # Minimum threshold
    if best_score < 0.15:
        return "Other", best_score

    return best_type, min(best_score, 1.0)
