"""Document management service - classification and validation logic."""

from __future__ import annotations

import logging
from uuid import UUID

from fastapi import FastAPI, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.database import get_db
from shared.models import Document, LoadRecord

from .classifier import classify
from .validator import validate_document

app = FastAPI(title="Document Service", version="0.1.0")
logger = logging.getLogger(__name__)


class ClassifyRequest(BaseModel):
    document_id: UUID


class ClassifyResponse(BaseModel):
    doc_type: str
    confidence: float


class ValidateRequest(BaseModel):
    document_id: UUID


class ValidateResponse(BaseModel):
    validation_status: str
    validation_errors: list[str]


@app.post("/classify", response_model=ClassifyResponse)
async def classify_endpoint(body: ClassifyRequest, db: AsyncSession = Depends(get_db)):
    """Classify a document based on filename and OCR text."""
    result = await db.execute(select(Document).where(Document.id == body.document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        return ClassifyResponse(doc_type="Other", confidence=0.0)

    doc_type, confidence = classify(doc.original_filename or "", doc.ocr_text or "")
    doc.doc_type = doc_type
    await db.commit()

    logger.info("Classified document %s as %s (confidence=%.2f)", body.document_id, doc_type, confidence)
    return ClassifyResponse(doc_type=doc_type, confidence=confidence)


@app.post("/validate", response_model=ValidateResponse)
async def validate_endpoint(body: ValidateRequest, db: AsyncSession = Depends(get_db)):
    """Validate a document against its linked load record."""
    result = await db.execute(select(Document).where(Document.id == body.document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        return ValidateResponse(validation_status="invalid", validation_errors=["Document not found"])

    if doc.linked_entity_type != "load_record" or not doc.linked_entity_id:
        return ValidateResponse(validation_status="invalid", validation_errors=["No linked load record"])

    load_result = await db.execute(select(LoadRecord).where(LoadRecord.id == doc.linked_entity_id))
    load = load_result.scalar_one_or_none()
    if not load:
        return ValidateResponse(validation_status="invalid", validation_errors=["Linked load not found"])

    val_status, errors = validate_document(doc, load)
    doc.validation_status = val_status
    doc.validation_errors = errors
    await db.commit()

    return ValidateResponse(validation_status=val_status, validation_errors=errors)
