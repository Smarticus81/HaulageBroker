-- Migration 005: Compliance artifacts and rules
-- CarrierBackOffice platform

BEGIN;

CREATE TYPE compliance_subject_type AS ENUM (
    'driver',
    'truck',
    'trailer',
    'carrier'
);

CREATE TYPE compliance_artifact_status AS ENUM (
    'active',
    'expiring_soon',
    'expired',
    'revoked',
    'pending_review'
);

CREATE TYPE compliance_severity AS ENUM (
    'critical',
    'high',
    'medium',
    'low'
);

CREATE TABLE compliance_artifacts (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subject_type          compliance_subject_type NOT NULL,
    subject_id            uuid NOT NULL,
    artifact_type         text NOT NULL,
    description           text,
    issue_date            date,
    expiry_date           date,
    status                compliance_artifact_status NOT NULL DEFAULT 'active',
    evidence_document_id  uuid REFERENCES documents(id) ON DELETE SET NULL,
    metadata              jsonb NOT NULL DEFAULT '{}',
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_compliance_artifacts_subject ON compliance_artifacts(subject_type, subject_id);
CREATE INDEX idx_compliance_artifacts_expiry ON compliance_artifacts(expiry_date);
CREATE INDEX idx_compliance_artifacts_status ON compliance_artifacts(status);
CREATE INDEX idx_compliance_artifacts_org_id ON compliance_artifacts(org_id);

CREATE TABLE compliance_rules (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            text NOT NULL,
    description     text,
    artifact_type   text NOT NULL,
    subject_type    compliance_subject_type,
    required        boolean NOT NULL DEFAULT true,
    lead_time_days  int[] NOT NULL DEFAULT '{30,14,7}',
    severity        compliance_severity NOT NULL DEFAULT 'high',
    is_active       boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_compliance_rules_org_id ON compliance_rules(org_id);
CREATE INDEX idx_compliance_rules_artifact_type ON compliance_rules(artifact_type);

COMMIT;
