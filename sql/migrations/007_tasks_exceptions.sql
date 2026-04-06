-- Migration 007: Tasks and exceptions
-- CarrierBackOffice platform

BEGIN;

CREATE TYPE task_queue AS ENUM (
    'billing',
    'compliance',
    'docs',
    'audit',
    'general'
);

CREATE TYPE task_priority AS ENUM (
    'urgent',
    'high',
    'medium',
    'low'
);

CREATE TYPE task_status AS ENUM (
    'open',
    'in_progress',
    'completed',
    'cancelled'
);

CREATE TYPE exception_type AS ENUM (
    'missing_pod',
    'missing_rateconf',
    'invalid_pod',
    'mismatch_amount',
    'compliance_expired',
    'doc_unreadable',
    'missing_bol',
    'other'
);

CREATE TYPE exception_severity AS ENUM (
    'critical',
    'high',
    'medium',
    'low'
);

CREATE TYPE exception_status AS ENUM (
    'open',
    'investigating',
    'resolved',
    'dismissed'
);

CREATE TABLE tasks (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    queue               task_queue NOT NULL DEFAULT 'general',
    title               text NOT NULL,
    description         text,
    priority            task_priority NOT NULL DEFAULT 'medium',
    due_date            timestamptz,
    assignee_id         uuid REFERENCES users(id) ON DELETE SET NULL,
    linked_entity_type  text,
    linked_entity_id    uuid,
    status              task_status NOT NULL DEFAULT 'open',
    completed_at        timestamptz,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_queue ON tasks(queue);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_org_id ON tasks(org_id);

CREATE TABLE exceptions (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type                exception_type NOT NULL,
    severity            exception_severity NOT NULL DEFAULT 'medium',
    linked_entity_type  text NOT NULL,
    linked_entity_id    uuid NOT NULL,
    description         text,
    status              exception_status NOT NULL DEFAULT 'open',
    resolution_notes    text,
    resolved_by         uuid REFERENCES users(id) ON DELETE SET NULL,
    resolved_at         timestamptz,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_exceptions_type ON exceptions(type);
CREATE INDEX idx_exceptions_severity ON exceptions(severity);
CREATE INDEX idx_exceptions_status ON exceptions(status);
CREATE INDEX idx_exceptions_linked_entity ON exceptions(linked_entity_type, linked_entity_id);
CREATE INDEX idx_exceptions_org_id ON exceptions(org_id);

COMMIT;
