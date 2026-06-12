-- Migration 009: Audit log (append-only)
-- CarrierBackOffice platform

BEGIN;

CREATE TYPE audit_actor_type AS ENUM (
    'user',
    'system',
    'automation',
    'copilot'
);

-- NOTE: For production at scale, consider partitioning this table by created_at range.
-- Example:
--   CREATE TABLE audit_logs (...) PARTITION BY RANGE (created_at);
--   CREATE TABLE audit_logs_2026_q1 PARTITION OF audit_logs
--       FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
--   CREATE TABLE audit_logs_2026_q2 PARTITION OF audit_logs
--       FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');

CREATE TABLE audit_logs (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id        uuid NOT NULL,
    actor_id      uuid,
    actor_type    audit_actor_type NOT NULL,
    action        text NOT NULL,
    entity_type   text NOT NULL,
    entity_id     uuid,
    before_state  jsonb,
    after_state   jsonb,
    metadata      jsonb NOT NULL DEFAULT '{}',
    ip_address    inet,
    source        text,
    created_at    timestamptz NOT NULL DEFAULT now()
);

-- INSERT-ONLY: prevent updates and deletes on audit_logs
CREATE RULE audit_logs_no_update AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
CREATE RULE audit_logs_no_delete AS ON DELETE TO audit_logs DO INSTEAD NOTHING;

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_org_id ON audit_logs(org_id);

COMMIT;
