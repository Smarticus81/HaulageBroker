"""Document management routes: upload, classify, extract, validate, list."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.auth import TokenPayload, get_current_user
from shared.audit import write_audit_log
from shared.database import get_db
from shared.events import EVENT_DOCUMENT_UPLOADED, EVENT_DOCUMENT_CLASSIFIED, EVENT_DOCUMENT_VALIDATED, EventBus
from shared.models import Document, DocumentTypeEnum, LoadRecord, ValidationStatus
from shared.storage import MinioStorage

router = APIRouter()
_event_bus = EventBus()
_storage = MinioStorage()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class DocumentResponse(BaseModel):
    id: UUID
    org_id: UUID
    doc_type: str
    original_filename: str | None = None
    storage_url: str
    content_type: str | None = None
    file_size_bytes: int | None = None
    uploaded_by: UUID | None = None
    linked_entity_type: str | None = None
    linked_entity_id: UUID | None = None
    extracted_fields: dict = {}
    extraction_confidence: Decimal | None = None
    validation_status: str
    validation_errors: list = []
    tags: list[str] = []
    ocr_text: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentWithUrl(DocumentResponse):
    signed_url: str | None = None


class DocumentListResponse(BaseModel):
    items: list[DocumentResponse]
    total: int
    page: int
    page_size: int


class ClassifyResponse(BaseModel):
    doc_type: str
    confidence: float


class ExtractResponse(BaseModel):
    extracted_fields: dict
    confidence: float
    needs_llm_fallback: bool = False


class ValidateResponse(BaseModel):
    validation_status: str
    validation_errors: list[str]


class AttachDocumentRequest(BaseModel):
    document_id: UUID


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/documents/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form("Other"),
    linked_entity_type: str | None = Form(None),
    linked_entity_id: str | None = Form(None),
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a document to MinIO and create a DB record."""
    content = await file.read()
    file.file.seek(0)

    object_key = _storage.upload_file(
        file.file,
        original_filename=file.filename or "unknown",
        content_type=file.content_type or "application/octet-stream",
    )

    doc = Document(
        org_id=UUID(current_user.org_id),
        doc_type=doc_type,
        original_filename=file.filename,
        storage_url=object_key,
        content_type=file.content_type,
        file_size_bytes=len(content),
        uploaded_by=UUID(current_user.user_id),
        linked_entity_type=linked_entity_type,
        linked_entity_id=UUID(linked_entity_id) if linked_entity_id else None,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    await write_audit_log(
        db,
        org_id=UUID(current_user.org_id),
        actor_id=UUID(current_user.user_id),
        actor_type="user",
        action="document.uploaded",
        entity_type="document",
        entity_id=doc.id,
        after_state={"doc_type": doc_type, "filename": file.filename},
        source="api",
    )

    await _event_bus.publish(EVENT_DOCUMENT_UPLOADED, {
        "document_id": str(doc.id),
        "org_id": current_user.org_id,
        "doc_type": doc_type,
        "filename": file.filename,
    })

    return doc


@router.get("/documents/{doc_id}", response_model=DocumentWithUrl)
async def get_document(
    doc_id: UUID,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document).where(Document.id == doc_id, Document.org_id == UUID(current_user.org_id))
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    signed_url = _storage.get_signed_url(doc.storage_url)
    resp = DocumentWithUrl.model_validate(doc)
    resp.signed_url = signed_url
    return resp


@router.post("/documents/{doc_id}/classify", response_model=ClassifyResponse)
async def classify_document(
    doc_id: UUID,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Trigger document classification."""
    result = await db.execute(
        select(Document).where(Document.id == doc_id, Document.org_id == UUID(current_user.org_id))
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Import classifier logic
    from docs_svc.classifier import classify

    doc_type, confidence = classify(doc.original_filename or "", doc.ocr_text or "")
    doc.doc_type = doc_type
    await db.commit()
    await db.refresh(doc)

    await _event_bus.publish(EVENT_DOCUMENT_CLASSIFIED, {
        "document_id": str(doc.id),
        "org_id": current_user.org_id,
        "doc_type": doc_type,
    })

    return ClassifyResponse(doc_type=doc_type, confidence=confidence)


@router.post("/documents/{doc_id}/extract", response_model=ExtractResponse)
async def extract_document(
    doc_id: UUID,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Trigger OCR field extraction."""
    result = await db.execute(
        select(Document).where(Document.id == doc_id, Document.org_id == UUID(current_user.org_id))
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    from ocr_svc.extractor import extract_fields

    fields, confidence, needs_llm = extract_fields(doc.doc_type.value, doc.ocr_text or "")
    doc.extracted_fields = fields
    doc.extraction_confidence = Decimal(str(round(confidence, 4)))
    await db.commit()
    await db.refresh(doc)

    return ExtractResponse(extracted_fields=fields, confidence=confidence, needs_llm_fallback=needs_llm)


@router.post("/documents/{doc_id}/validate", response_model=ValidateResponse)
async def validate_document(
    doc_id: UUID,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Validate a document against its linked load record."""
    result = await db.execute(
        select(Document).where(Document.id == doc_id, Document.org_id == UUID(current_user.org_id))
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.linked_entity_type != "load_record" or not doc.linked_entity_id:
        raise HTTPException(status_code=400, detail="Document is not linked to a load record")

    load_result = await db.execute(select(LoadRecord).where(LoadRecord.id == doc.linked_entity_id))
    load = load_result.scalar_one_or_none()
    if not load:
        raise HTTPException(status_code=404, detail="Linked load record not found")

    from docs_svc.validator import validate_document as run_validation

    val_status, errors = run_validation(doc, load)
    doc.validation_status = val_status
    doc.validation_errors = errors
    await db.commit()
    await db.refresh(doc)

    await _event_bus.publish(EVENT_DOCUMENT_VALIDATED, {
        "document_id": str(doc.id),
        "org_id": current_user.org_id,
        "validation_status": val_status,
    })

    return ValidateResponse(validation_status=val_status, validation_errors=errors)


@router.post("/load-records/{load_id}/attach-document", response_model=DocumentResponse)
async def attach_document_to_load(
    load_id: UUID,
    body: AttachDocumentRequest,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = UUID(current_user.org_id)

    load_result = await db.execute(
        select(LoadRecord).where(LoadRecord.id == load_id, LoadRecord.org_id == org_id)
    )
    if not load_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Load record not found")

    doc_result = await db.execute(
        select(Document).where(Document.id == body.document_id, Document.org_id == org_id)
    )
    doc = doc_result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.linked_entity_type = "load_record"
    doc.linked_entity_id = load_id
    await db.commit()
    await db.refresh(doc)

    await write_audit_log(
        db,
        org_id=org_id,
        actor_id=UUID(current_user.user_id),
        actor_type="user",
        action="document.attached",
        entity_type="document",
        entity_id=doc.id,
        after_state={"linked_entity_type": "load_record", "linked_entity_id": str(load_id)},
        source="api",
    )

    return doc


@router.get("/documents", response_model=DocumentListResponse)
async def list_documents(
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    doc_type: str | None = None,
    validation_status: str | None = None,
    linked_entity_type: str | None = None,
    linked_entity_id: UUID | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
):
    org_id = UUID(current_user.org_id)
    query = select(Document).where(Document.org_id == org_id)
    count_q = select(func.count()).select_from(Document).where(Document.org_id == org_id)

    if doc_type:
        query = query.where(Document.doc_type == doc_type)
        count_q = count_q.where(Document.doc_type == doc_type)
    if validation_status:
        query = query.where(Document.validation_status == validation_status)
        count_q = count_q.where(Document.validation_status == validation_status)
    if linked_entity_type:
        query = query.where(Document.linked_entity_type == linked_entity_type)
        count_q = count_q.where(Document.linked_entity_type == linked_entity_type)
    if linked_entity_id:
        query = query.where(Document.linked_entity_id == linked_entity_id)
        count_q = count_q.where(Document.linked_entity_id == linked_entity_id)

    total = (await db.execute(count_q)).scalar() or 0
    offset = (page - 1) * page_size
    query = query.order_by(Document.created_at.desc()).offset(offset).limit(page_size)
    rows = (await db.execute(query)).scalars().all()

    return DocumentListResponse(items=rows, total=total, page=page, page_size=page_size)
