-- Migration 008: Automation rules and runs
-- CarrierBackOffice platform

BEGIN;

CREATE TYPE trigger_type AS ENUM (
    'event',
    'schedule'
);

CREATE TYPE automation_run_status AS ENUM (
    'success',
    'partial',
    'failed',
    'skipped'
);

CREATE TABLE automation_rules (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            text NOT NULL,
    description     text,
    trigger_type    trigger_type NOT NULL,
    trigger_event   text,
    schedule_cron   text,
    conditions      jsonb NOT NULL DEFAULT '[]',
    actions         jsonb NOT NULL DEFAULT '[]',
    is_active       boolean NOT NULL DEFAULT true,
    is_system       boolean NOT NULL DEFAULT false,
    created_by      uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_automation_rules_org_id ON automation_rules(org_id);
CREATE INDEX idx_automation_rules_trigger_type ON automation_rules(trigger_type);
CREATE INDEX idx_automation_rules_is_active ON automation_rules(is_active);

CREATE TABLE automation_runs (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id           uuid NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
    trigger_data      jsonb NOT NULL DEFAULT '{}',
    actions_executed  jsonb NOT NULL DEFAULT '[]',
    status            automation_run_status NOT NULL,
    error_message     text,
    started_at        timestamptz NOT NULL DEFAULT now(),
    completed_at      timestamptz,
    created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_automation_runs_rule_id ON automation_runs(rule_id);
CREATE INDEX idx_automation_runs_status ON automation_runs(status);
CREATE INDEX idx_automation_runs_started_at ON automation_runs(started_at);

COMMIT;
