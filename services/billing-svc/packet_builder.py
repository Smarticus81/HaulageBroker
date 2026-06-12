"""Invoice packet builder.

Determines required documents for a load and checks which are present/validated.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.models import Document, LoadRecord


# Standard required docs for invoice packets
REQUIRED_DOCS_DEFAULT = ["BOL", "POD", "RateConf"]


async def build_packet(db: AsyncSession, load: LoadRecord) -> dict[str, Any]:
    """Build an invoice packet for a load record.

    Checks which required documents are present and validated,
    then determines the packet status.

    Returns:
        Dict with required_docs, docs_present, and status.
    """
    required_docs = list(REQUIRED_DOCS_DEFAULT)

    # If the load has accessorials, we might need additional docs
    if load.accessorials_expected and load.accessorials_expected > 0:
        # Accessorial docs are variable - for now, no additional requirement
        pass

    # Fetch all linked, validated documents
    result = await db.execute(
        select(Document).where(
            Document.linked_entity_type == "load_record",
            Document.linked_entity_id == load.id,
            Document.org_id == load.org_id,
        )
    )
    documents = result.scalars().all()

    docs_present: list[str] = []
    for doc in documents:
        doc_type = doc.doc_type.value if hasattr(doc.doc_type, "value") else str(doc.doc_type)
        # Count as present if validated or at least uploaded
        if doc.validation_status.value in ("valid", "pending", "needs_review"):
            if doc_type not in docs_present:
                docs_present.append(doc_type)

    # Determine status
    missing = [d for d in required_docs if d not in docs_present]

    if not missing:
        # All required docs are present
        all_valid = all(
            d.validation_status.value == "valid"
            for d in documents
            if (d.doc_type.value if hasattr(d.doc_type, "value") else str(d.doc_type)) in required_docs
        )
        status = "ready_for_review" if all_valid else "incomplete"
    else:
        status = "incomplete"

    return {
        "required_docs": required_docs,
        "docs_present": docs_present,
        "status": status,
    }
