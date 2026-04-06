-- Migration 004: Documents and document requests
-- CarrierBackOffice platform

BEGIN;

CREATE TYPE document_type_enum AS ENUM (
    'BOL',
    'POD',
    'RateConf',
    'Lumper',
    'ScaleTicket',
    'DetentionForm',
    'RepairReceipt',
    'FuelReceipt',
    'InsuranceCert',
    'CDL',
    'MedCard',
    'AnnualInspection',
    'DVIR',
    'Other'
);

CREATE TYPE validation_status AS ENUM (
    'pending',
    'valid',
    'invalid',
    'needs_review'
);

CREATE TYPE doc_request_status AS ENUM (
    'pending',
    'partially_fulfilled',
    'fulfilled',
    'overdue',
    'cancelled'
);

CREATE TABLE documents (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    doc_type                document_type_enum NOT NULL,
    original_filename       text,
    storage_url             text NOT NULL,
    content_type            text,
    file_size_bytes         bigint,
    uploaded_by             uuid REFERENCES users(id) ON DELETE SET NULL,
    linked_entity_type      text,
    linked_entity_id        uuid,
    extracted_fields        jsonb NOT NULL DEFAULT '{}',
    extraction_confidence   numeric(5,4),
    validation_status       validation_status NOT NULL DEFAULT 'pending',
    validation_errors       jsonb NOT NULL DEFAULT '[]',
    tags                    text[] NOT NULL DEFAULT '{}',
    ocr_text                text,
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_doc_type ON documents(doc_type);
CREATE INDEX idx_documents_linked_entity ON documents(linked_entity_type, linked_entity_id);
CREATE INDEX idx_documents_validation_status ON documents(validation_status);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_org_id ON documents(org_id);

CREATE TABLE document_requests (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    requested_by        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id      uuid REFERENCES users(id) ON DELETE SET NULL,
    target_email        text,
    due_date            timestamptz,
    required_doc_types  document_type_enum[] NOT NULL,
    linked_entity_type  text,
    linked_entity_id    uuid,
    status              doc_request_status NOT NULL DEFAULT 'pending',
    reminders_sent      integer NOT NULL DEFAULT 0,
    last_reminder_at    timestamptz,
    notes               text,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_document_requests_org_id ON document_requests(org_id);
CREATE INDEX idx_document_requests_status ON document_requests(status);

COMMIT;
