"""SQLAlchemy ORM models for all CarrierBackOffice entities."""

from __future__ import annotations

import enum
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY, INET, JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


# ---------------------------------------------------------------------------
# Enum types matching the database
# ---------------------------------------------------------------------------

class UserRole(str, enum.Enum):
    admin = "admin"
    backoffice = "backoffice"
    billing = "billing"
    compliance = "compliance"
    safety = "safety"
    auditor = "auditor"
    driver_readonly = "driver_readonly"


class CustomerType(str, enum.Enum):
    shipper = "shipper"
    broker = "broker"


class LoadStatus(str, enum.Enum):
    created = "created"
    docs_pending = "docs_pending"
    docs_received = "docs_received"
    validation_failed = "validation_failed"
    ready_to_invoice = "ready_to_invoice"
    invoiced = "invoiced"
    closed = "closed"


class DocumentTypeEnum(str, enum.Enum):
    BOL = "BOL"
    POD = "POD"
    RateConf = "RateConf"
    Lumper = "Lumper"
    ScaleTicket = "ScaleTicket"
    DetentionForm = "DetentionForm"
    RepairReceipt = "RepairReceipt"
    FuelReceipt = "FuelReceipt"
    InsuranceCert = "InsuranceCert"
    CDL = "CDL"
    MedCard = "MedCard"
    AnnualInspection = "AnnualInspection"
    DVIR = "DVIR"
    Other = "Other"


class ValidationStatus(str, enum.Enum):
    pending = "pending"
    valid = "valid"
    invalid = "invalid"
    needs_review = "needs_review"


class DocRequestStatus(str, enum.Enum):
    pending = "pending"
    partially_fulfilled = "partially_fulfilled"
    fulfilled = "fulfilled"
    overdue = "overdue"
    cancelled = "cancelled"


class ComplianceSubjectType(str, enum.Enum):
    driver = "driver"
    truck = "truck"
    trailer = "trailer"
    carrier = "carrier"


class ComplianceArtifactStatus(str, enum.Enum):
    active = "active"
    expiring_soon = "expiring_soon"
    expired = "expired"
    revoked = "revoked"
    pending_review = "pending_review"


class ComplianceSeverity(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class PacketStatus(str, enum.Enum):
    incomplete = "incomplete"
    ready_for_review = "ready_for_review"
    approved = "approved"
    exported = "exported"
    rejected = "rejected"


class InvoiceStatus(str, enum.Enum):
    draft = "draft"
    pending_approval = "pending_approval"
    approved = "approved"
    exported = "exported"
    voided = "voided"


class SettlementStatus(str, enum.Enum):
    draft = "draft"
    review = "review"
    approved = "approved"
    paid = "paid"
    disputed = "disputed"


class TaskQueue(str, enum.Enum):
    billing = "billing"
    compliance = "compliance"
    docs = "docs"
    audit = "audit"
    general = "general"


class TaskPriority(str, enum.Enum):
    urgent = "urgent"
    high = "high"
    medium = "medium"
    low = "low"


class TaskStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class ExceptionType(str, enum.Enum):
    missing_pod = "missing_pod"
    missing_rateconf = "missing_rateconf"
    invalid_pod = "invalid_pod"
    mismatch_amount = "mismatch_amount"
    compliance_expired = "compliance_expired"
    doc_unreadable = "doc_unreadable"
    missing_bol = "missing_bol"
    other = "other"


class ExceptionSeverity(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class ExceptionStatus(str, enum.Enum):
    open = "open"
    investigating = "investigating"
    resolved = "resolved"
    dismissed = "dismissed"


class TriggerType(str, enum.Enum):
    event = "event"
    schedule = "schedule"


class AutomationRunStatus(str, enum.Enum):
    success = "success"
    partial = "partial"
    failed = "failed"
    skipped = "skipped"


class AuditActorType(str, enum.Enum):
    user = "user"
    system = "system"
    automation = "automation"
    copilot = "copilot"


class CopilotMessageRole(str, enum.Enum):
    user = "user"
    assistant = "assistant"
    system = "system"
    tool = "tool"


# ---------------------------------------------------------------------------
# ORM Models
# ---------------------------------------------------------------------------

class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    name: Mapped[str] = mapped_column(Text, nullable=False)
    slug: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    settings: Mapped[dict] = mapped_column(JSONB, server_default=text("'{}'::jsonb"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))

    users: Mapped[list[User]] = relationship(back_populates="organization", cascade="all, delete-orphan")
    customers: Mapped[list[Customer]] = relationship(back_populates="organization", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    org_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    email: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, name="user_role", create_type=False), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))

    organization: Mapped[Organization] = relationship(back_populates="users")


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    org_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[CustomerType] = mapped_column(Enum(CustomerType, name="customer_type", create_type=False), nullable=False)
    contact_email: Mapped[str | None] = mapped_column(Text)
    contact_phone: Mapped[str | None] = mapped_column(Text)
    billing_email: Mapped[str | None] = mapped_column(Text)
    payment_terms_days: Mapped[int] = mapped_column(Integer, server_default=text("30"))
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))

    organization: Mapped[Organization] = relationship(back_populates="customers")


class CarrierProfile(Base):
    __tablename__ = "carrier_profiles"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    org_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    mc_number: Mapped[str | None] = mapped_column(Text)
    dot_number: Mapped[str | None] = mapped_column(Text)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    contact_email: Mapped[str | None] = mapped_column(Text)
    contact_phone: Mapped[str | None] = mapped_column(Text)
    insurance_expiry: Mapped[date | None] = mapped_column(Date)
    authority_status: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))


class LoadRecord(Base):
    __tablename__ = "load_records"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    org_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    load_number: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    customer_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False)
    customer_ref: Mapped[str | None] = mapped_column(Text)
    pickup_date: Mapped[date | None] = mapped_column(Date)
    delivery_date: Mapped[date | None] = mapped_column(Date)
    origin_city: Mapped[str | None] = mapped_column(Text)
    origin_state: Mapped[str | None] = mapped_column(String(2))
    dest_city: Mapped[str | None] = mapped_column(Text)
    dest_state: Mapped[str | None] = mapped_column(String(2))
    billed_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    accessorials_expected: Mapped[Decimal] = mapped_column(Numeric(12, 2), server_default=text("0"))
    status: Mapped[LoadStatus] = mapped_column(Enum(LoadStatus, name="load_status", create_type=False), server_default=text("'created'"))
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))

    customer: Mapped[Customer] = relationship()
    documents: Mapped[list[Document]] = relationship(
        primaryjoin="and_(LoadRecord.id == foreign(Document.linked_entity_id), Document.linked_entity_type == 'load_record')",
        viewonly=True,
    )


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    org_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    doc_type: Mapped[DocumentTypeEnum] = mapped_column(Enum(DocumentTypeEnum, name="document_type_enum", create_type=False), nullable=False)
    original_filename: Mapped[str | None] = mapped_column(Text)
    storage_url: Mapped[str] = mapped_column(Text, nullable=False)
    content_type: Mapped[str | None] = mapped_column(Text)
    file_size_bytes: Mapped[int | None] = mapped_column()
    uploaded_by: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    linked_entity_type: Mapped[str | None] = mapped_column(Text)
    linked_entity_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True))
    extracted_fields: Mapped[dict] = mapped_column(JSONB, server_default=text("'{}'::jsonb"))
    extraction_confidence: Mapped[Decimal | None] = mapped_column(Numeric(5, 4))
    validation_status: Mapped[ValidationStatus] = mapped_column(Enum(ValidationStatus, name="validation_status", create_type=False), server_default=text("'pending'"))
    validation_errors: Mapped[list] = mapped_column(JSONB, server_default=text("'[]'::jsonb"))
    tags: Mapped[list[str]] = mapped_column(ARRAY(Text), server_default=text("'{}'::text[]"))
    ocr_text: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))


class DocumentRequest(Base):
    __tablename__ = "document_requests"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    org_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    requested_by: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    target_user_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    target_email: Mapped[str | None] = mapped_column(Text)
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    required_doc_types: Mapped[list] = mapped_column(ARRAY(Enum(DocumentTypeEnum, name="document_type_enum", create_type=False)), nullable=False)
    linked_entity_type: Mapped[str | None] = mapped_column(Text)
    linked_entity_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True))
    status: Mapped[DocRequestStatus] = mapped_column(Enum(DocRequestStatus, name="doc_request_status", create_type=False), server_default=text("'pending'"))
    reminders_sent: Mapped[int] = mapped_column(Integer, server_default=text("0"))
    last_reminder_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))


class ComplianceArtifact(Base):
    __tablename__ = "compliance_artifacts"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    org_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    subject_type: Mapped[ComplianceSubjectType] = mapped_column(Enum(ComplianceSubjectType, name="compliance_subject_type", create_type=False), nullable=False)
    subject_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    artifact_type: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    issue_date: Mapped[date | None] = mapped_column(Date)
    expiry_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[ComplianceArtifactStatus] = mapped_column(Enum(ComplianceArtifactStatus, name="compliance_artifact_status", create_type=False), server_default=text("'active'"))
    evidence_document_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("documents.id", ondelete="SET NULL"))
    metadata: Mapped[dict] = mapped_column(JSONB, server_default=text("'{}'::jsonb"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))

    evidence_document: Mapped[Document | None] = relationship()


class ComplianceRule(Base):
    __tablename__ = "compliance_rules"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    org_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    artifact_type: Mapped[str] = mapped_column(Text, nullable=False)
    subject_type: Mapped[ComplianceSubjectType | None] = mapped_column(Enum(ComplianceSubjectType, name="compliance_subject_type", create_type=False))
    required: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
    lead_time_days: Mapped[list[int]] = mapped_column(ARRAY(Integer), server_default=text("'{30,14,7}'::int[]"))
    severity: Mapped[ComplianceSeverity] = mapped_column(Enum(ComplianceSeverity, name="compliance_severity", create_type=False), server_default=text("'high'"))
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))


class InvoicePacket(Base):
    __tablename__ = "invoice_packets"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    org_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    load_record_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("load_records.id", ondelete="CASCADE"), unique=True, nullable=False)
    required_docs: Mapped[list] = mapped_column(JSONB, server_default=text("'[]'::jsonb"))
    docs_present: Mapped[list] = mapped_column(JSONB, server_default=text("'[]'::jsonb"))
    packet_status: Mapped[PacketStatus] = mapped_column(Enum(PacketStatus, name="packet_status", create_type=False), server_default=text("'incomplete'"))
    reviewed_by: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    approved_by: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    exported_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    export_format: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))

    load_record: Mapped[LoadRecord] = relationship()


class InvoiceDraft(Base):
    __tablename__ = "invoice_drafts"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    org_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    customer_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False)
    load_record_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("load_records.id", ondelete="CASCADE"), nullable=False)
    invoice_number: Mapped[str | None] = mapped_column(Text)
    line_items: Mapped[list] = mapped_column(JSONB, server_default=text("'[]'::jsonb"))
    subtotal: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    taxes: Mapped[Decimal] = mapped_column(Numeric(12, 2), server_default=text("0"))
    fees: Mapped[Decimal] = mapped_column(Numeric(12, 2), server_default=text("0"))
    total: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    status: Mapped[InvoiceStatus] = mapped_column(Enum(InvoiceStatus, name="invoice_status", create_type=False), server_default=text("'draft'"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))

    customer: Mapped[Customer] = relationship()
    load_record: Mapped[LoadRecord] = relationship()


class SettlementPacket(Base):
    __tablename__ = "settlement_packets"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    org_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    driver_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    period_start: Mapped[date | None] = mapped_column(Date)
    period_end: Mapped[date | None] = mapped_column(Date)
    included_load_ids: Mapped[list[UUID]] = mapped_column(ARRAY(PG_UUID(as_uuid=True)), server_default=text("'{}'::uuid[]"))
    required_docs: Mapped[list] = mapped_column(JSONB, server_default=text("'[]'::jsonb"))
    exceptions: Mapped[list] = mapped_column(JSONB, server_default=text("'[]'::jsonb"))
    total_pay: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    deductions: Mapped[Decimal] = mapped_column(Numeric(12, 2), server_default=text("0"))
    net_pay: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    status: Mapped[SettlementStatus] = mapped_column(Enum(SettlementStatus, name="settlement_status", create_type=False), server_default=text("'draft'"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    org_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    queue: Mapped[TaskQueue] = mapped_column(Enum(TaskQueue, name="task_queue", create_type=False), server_default=text("'general'"))
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    priority: Mapped[TaskPriority] = mapped_column(Enum(TaskPriority, name="task_priority", create_type=False), server_default=text("'medium'"))
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    assignee_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    linked_entity_type: Mapped[str | None] = mapped_column(Text)
    linked_entity_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True))
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus, name="task_status", create_type=False), server_default=text("'open'"))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))

    assignee: Mapped[User | None] = relationship()


class Exception_(Base):
    __tablename__ = "exceptions"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    org_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    type: Mapped[ExceptionType] = mapped_column(Enum(ExceptionType, name="exception_type", create_type=False), nullable=False)
    severity: Mapped[ExceptionSeverity] = mapped_column(Enum(ExceptionSeverity, name="exception_severity", create_type=False), server_default=text("'medium'"))
    linked_entity_type: Mapped[str] = mapped_column(Text, nullable=False)
    linked_entity_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[ExceptionStatus] = mapped_column(Enum(ExceptionStatus, name="exception_status", create_type=False), server_default=text("'open'"))
    resolution_notes: Mapped[str | None] = mapped_column(Text)
    resolved_by: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))


class AutomationRule(Base):
    __tablename__ = "automation_rules"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    org_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    trigger_type: Mapped[TriggerType] = mapped_column(Enum(TriggerType, name="trigger_type", create_type=False), nullable=False)
    trigger_event: Mapped[str | None] = mapped_column(Text)
    schedule_cron: Mapped[str | None] = mapped_column(Text)
    conditions: Mapped[list] = mapped_column(JSONB, server_default=text("'[]'::jsonb"))
    actions: Mapped[list] = mapped_column(JSONB, server_default=text("'[]'::jsonb"))
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
    is_system: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    created_by: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))


class AutomationRun(Base):
    __tablename__ = "automation_runs"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    rule_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("automation_rules.id", ondelete="CASCADE"), nullable=False)
    trigger_data: Mapped[dict] = mapped_column(JSONB, server_default=text("'{}'::jsonb"))
    actions_executed: Mapped[list] = mapped_column(JSONB, server_default=text("'[]'::jsonb"))
    status: Mapped[AutomationRunStatus] = mapped_column(Enum(AutomationRunStatus, name="automation_run_status", create_type=False), nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))

    rule: Mapped[AutomationRule] = relationship()


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    org_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    actor_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True))
    actor_type: Mapped[AuditActorType] = mapped_column(Enum(AuditActorType, name="audit_actor_type", create_type=False), nullable=False)
    action: Mapped[str] = mapped_column(Text, nullable=False)
    entity_type: Mapped[str] = mapped_column(Text, nullable=False)
    entity_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True))
    before_state: Mapped[dict | None] = mapped_column(JSONB)
    after_state: Mapped[dict | None] = mapped_column(JSONB)
    metadata: Mapped[dict] = mapped_column(JSONB, server_default=text("'{}'::jsonb"))
    ip_address: Mapped[str | None] = mapped_column(INET)
    source: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))


class CopilotConversation(Base):
    __tablename__ = "copilot_conversations"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    org_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))

    messages: Mapped[list[CopilotMessage]] = relationship(back_populates="conversation", cascade="all, delete-orphan")


class CopilotMessage(Base):
    __tablename__ = "copilot_messages"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    conversation_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("copilot_conversations.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[CopilotMessageRole] = mapped_column(Enum(CopilotMessageRole, name="copilot_message_role", create_type=False), nullable=False)
    content: Mapped[str | None] = mapped_column(Text)
    tool_calls: Mapped[dict | None] = mapped_column(JSONB)
    citations: Mapped[list] = mapped_column(JSONB, server_default=text("'[]'::jsonb"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))

    conversation: Mapped[CopilotConversation] = relationship(back_populates="messages")
