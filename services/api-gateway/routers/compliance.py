"""Compliance artifact and expiry routes."""

from __future__ import annotations

from datetime import date, datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.auth import TokenPayload, get_current_user
from shared.audit import write_audit_log
from shared.database import get_db
from shared.models import ComplianceArtifact, ComplianceRule

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ComplianceArtifactCreate(BaseModel):
    subject_type: str
    subject_id: UUID
    artifact_type: str
    description: str | None = None
    issue_date: date | None = None
    expiry_date: date | None = None
    evidence_document_id: UUID | None = None
    metadata: dict = {}


class ComplianceArtifactUpdate(BaseModel):
    description: str | None = None
    issue_date: date | None = None
    expiry_date: date | None = None
    status: str | None = None
    evidence_document_id: UUID | None = None
    metadata: dict | None = None


class ComplianceArtifactResponse(BaseModel):
    id: UUID
    org_id: UUID
    subject_type: str
    subject_id: UUID
    artifact_type: str
    description: str | None = None
    issue_date: date | None = None
    expiry_date: date | None = None
    status: str
    evidence_document_id: UUID | None = None
    metadata: dict = {}
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ComplianceArtifactListResponse(BaseModel):
    items: list[ComplianceArtifactResponse]
    total: int
    page: int
    page_size: int


class ExpiringArtifact(BaseModel):
    id: UUID
    artifact_type: str
    subject_type: str
    subject_id: UUID
    expiry_date: date
    days_remaining: int
    status: str
    description: str | None = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/expiring", response_model=list[ExpiringArtifact])
async def get_expiring_artifacts(
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    days_ahead: int = Query(30, ge=1, le=365),
):
    """Return all compliance artifacts expiring within the given number of days."""
    org_id = UUID(current_user.org_id)
    cutoff = date.today() + timedelta(days=days_ahead)

    result = await db.execute(
        select(ComplianceArtifact)
        .where(
            ComplianceArtifact.org_id == org_id,
            ComplianceArtifact.expiry_date.isnot(None),
            ComplianceArtifact.expiry_date <= cutoff,
            ComplianceArtifact.status.in_(["active", "expiring_soon"]),
        )
        .order_by(ComplianceArtifact.expiry_date.asc())
    )
    artifacts = result.scalars().all()

    items = []
    for a in artifacts:
        days_remaining = (a.expiry_date - date.today()).days
        items.append(ExpiringArtifact(
            id=a.id,
            artifact_type=a.artifact_type,
            subject_type=a.subject_type.value,
            subject_id=a.subject_id,
            expiry_date=a.expiry_date,
            days_remaining=days_remaining,
            status=a.status.value,
            description=a.description,
        ))
    return items


@router.get("/artifacts", response_model=ComplianceArtifactListResponse)
async def list_compliance_artifacts(
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    subject_type: str | None = None,
    artifact_type: str | None = None,
    status_filter: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
):
    org_id = UUID(current_user.org_id)
    query = select(ComplianceArtifact).where(ComplianceArtifact.org_id == org_id)
    count_q = select(func.count()).select_from(ComplianceArtifact).where(ComplianceArtifact.org_id == org_id)

    if subject_type:
        query = query.where(ComplianceArtifact.subject_type == subject_type)
        count_q = count_q.where(ComplianceArtifact.subject_type == subject_type)
    if artifact_type:
        query = query.where(ComplianceArtifact.artifact_type == artifact_type)
        count_q = count_q.where(ComplianceArtifact.artifact_type == artifact_type)
    if status_filter:
        query = query.where(ComplianceArtifact.status == status_filter)
        count_q = count_q.where(ComplianceArtifact.status == status_filter)

    total = (await db.execute(count_q)).scalar() or 0
    offset = (page - 1) * page_size
    rows = (await db.execute(
        query.order_by(ComplianceArtifact.created_at.desc()).offset(offset).limit(page_size)
    )).scalars().all()

    return ComplianceArtifactListResponse(items=rows, total=total, page=page, page_size=page_size)


@router.post("/artifacts", response_model=ComplianceArtifactResponse, status_code=status.HTTP_201_CREATED)
async def create_compliance_artifact(
    body: ComplianceArtifactCreate,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    artifact = ComplianceArtifact(
        org_id=UUID(current_user.org_id),
        subject_type=body.subject_type,
        subject_id=body.subject_id,
        artifact_type=body.artifact_type,
        description=body.description,
        issue_date=body.issue_date,
        expiry_date=body.expiry_date,
        evidence_document_id=body.evidence_document_id,
        metadata=body.metadata,
    )
    db.add(artifact)
    await db.commit()
    await db.refresh(artifact)

    await write_audit_log(
        db,
        org_id=UUID(current_user.org_id),
        actor_id=UUID(current_user.user_id),
        actor_type="user",
        action="compliance_artifact.created",
        entity_type="compliance_artifact",
        entity_id=artifact.id,
        after_state={"artifact_type": body.artifact_type, "subject_type": body.subject_type},
        source="api",
    )

    return artifact


@router.put("/artifacts/{artifact_id}", response_model=ComplianceArtifactResponse)
async def update_compliance_artifact(
    artifact_id: UUID,
    body: ComplianceArtifactUpdate,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = UUID(current_user.org_id)
    result = await db.execute(
        select(ComplianceArtifact).where(
            ComplianceArtifact.id == artifact_id,
            ComplianceArtifact.org_id == org_id,
        )
    )
    artifact = result.scalar_one_or_none()
    if not artifact:
        raise HTTPException(status_code=404, detail="Compliance artifact not found")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(artifact, field, value)
    await db.commit()
    await db.refresh(artifact)
    return artifact
