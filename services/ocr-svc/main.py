"""OCR extraction service - extracts structured fields from document text."""

from __future__ import annotations

import logging
from uuid import UUID

from fastapi import FastAPI, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.database import get_db
from shared.models import Document

from .extractor import extract_fields

app = FastAPI(title="OCR Extraction Service", version="0.1.0")
logger = logging.getLogger(__name__)


class ExtractRequest(BaseModel):
    document_id: UUID


class ExtractResponse(BaseModel):
    extracted_fields: dict
    confidence: float
    needs_llm_fallback: bool


@app.post("/extract", response_model=ExtractResponse)
async def extract_endpoint(body: ExtractRequest, db: AsyncSession = Depends(get_db)):
    """Extract structured fields from a document's OCR text."""
    result = await db.execute(select(Document).where(Document.id == body.document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        return ExtractResponse(extracted_fields={}, confidence=0.0, needs_llm_fallback=True)

    doc_type = doc.doc_type.value if hasattr(doc.doc_type, "value") else str(doc.doc_type)
    fields, confidence, needs_llm = extract_fields(doc_type, doc.ocr_text or "")

    doc.extracted_fields = fields
    doc.extraction_confidence = round(confidence, 4)
    await db.commit()

    logger.info(
        "Extracted fields from document %s (type=%s, confidence=%.2f, needs_llm=%s)",
        body.document_id, doc_type, confidence, needs_llm,
    )

    return ExtractResponse(
        extracted_fields=fields,
        confidence=confidence,
        needs_llm_fallback=needs_llm,
    )
