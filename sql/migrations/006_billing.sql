-- Migration 006: Billing - invoice packets, invoice drafts, settlement packets
-- CarrierBackOffice platform

BEGIN;

CREATE TYPE packet_status AS ENUM (
    'incomplete',
    'ready_for_review',
    'approved',
    'exported',
    'rejected'
);

CREATE TYPE invoice_status AS ENUM (
    'draft',
    'pending_approval',
    'approved',
    'exported',
    'voided'
);

CREATE TYPE settlement_status AS ENUM (
    'draft',
    'review',
    'approved',
    'paid',
    'disputed'
);

CREATE TABLE invoice_packets (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    load_record_id  uuid NOT NULL UNIQUE REFERENCES load_records(id) ON DELETE CASCADE,
    required_docs   jsonb NOT NULL DEFAULT '[]',
    docs_present    jsonb NOT NULL DEFAULT '[]',
    packet_status   packet_status NOT NULL DEFAULT 'incomplete',
    reviewed_by     uuid REFERENCES users(id) ON DELETE SET NULL,
    approved_by     uuid REFERENCES users(id) ON DELETE SET NULL,
    approved_at     timestamptz,
    exported_at     timestamptz,
    export_format   text,
    notes           text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoice_packets_org_id ON invoice_packets(org_id);
CREATE INDEX idx_invoice_packets_status ON invoice_packets(packet_status);

CREATE TABLE invoice_drafts (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id     uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    load_record_id  uuid NOT NULL REFERENCES load_records(id) ON DELETE CASCADE,
    invoice_number  text,
    line_items      jsonb NOT NULL DEFAULT '[]',
    subtotal        numeric(12,2),
    taxes           numeric(12,2) NOT NULL DEFAULT 0,
    fees            numeric(12,2) NOT NULL DEFAULT 0,
    total           numeric(12,2),
    status          invoice_status NOT NULL DEFAULT 'draft',
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoice_drafts_org_id ON invoice_drafts(org_id);
CREATE INDEX idx_invoice_drafts_customer_id ON invoice_drafts(customer_id);
CREATE INDEX idx_invoice_drafts_status ON invoice_drafts(status);

CREATE TABLE settlement_packets (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id            uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    driver_id         uuid NOT NULL,
    period_start      date,
    period_end        date,
    included_load_ids uuid[] NOT NULL DEFAULT '{}',
    required_docs     jsonb NOT NULL DEFAULT '[]',
    exceptions        jsonb NOT NULL DEFAULT '[]',
    total_pay         numeric(12,2),
    deductions        numeric(12,2) NOT NULL DEFAULT 0,
    net_pay           numeric(12,2),
    status            settlement_status NOT NULL DEFAULT 'draft',
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_settlement_packets_org_id ON settlement_packets(org_id);
CREATE INDEX idx_settlement_packets_driver_id ON settlement_packets(driver_id);
CREATE INDEX idx_settlement_packets_status ON settlement_packets(status);

COMMIT;
