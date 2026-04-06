"""Invoice data CSV export."""

from __future__ import annotations

import csv
import io
from typing import Any


def export_invoice_packets_csv(packets: list[dict[str, Any]]) -> str:
    """Export invoice packet data as a CSV string.

    Args:
        packets: List of invoice packet dicts with at least:
            load_number, customer_name, billed_amount, status, required_docs, docs_present.

    Returns:
        CSV-formatted string.
    """
    output = io.StringIO()
    fieldnames = [
        "load_number",
        "customer_name",
        "billed_amount",
        "status",
        "required_docs",
        "docs_present",
        "missing_docs",
        "approved_at",
    ]

    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()

    for packet in packets:
        required = packet.get("required_docs", [])
        present = packet.get("docs_present", [])
        missing = [d for d in required if d not in present]

        row = {
            "load_number": packet.get("load_number", ""),
            "customer_name": packet.get("customer_name", ""),
            "billed_amount": packet.get("billed_amount", ""),
            "status": packet.get("status", ""),
            "required_docs": "; ".join(required),
            "docs_present": "; ".join(present),
            "missing_docs": "; ".join(missing),
            "approved_at": packet.get("approved_at", ""),
        }
        writer.writerow(row)

    return output.getvalue()
