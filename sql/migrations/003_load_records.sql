-- Migration 003: Load records
-- CarrierBackOffice platform

BEGIN;

CREATE TYPE load_status AS ENUM (
    'created',
    'docs_pending',
    'docs_received',
    'validation_failed',
    'ready_to_invoice',
    'invoiced',
    'closed'
);

CREATE TABLE load_records (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                 uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    load_number            text NOT NULL UNIQUE,
    customer_id            uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    customer_ref           text,
    pickup_date            date,
    delivery_date          date,
    origin_city            text,
    origin_state           text CHECK (char_length(origin_state) = 2),
    dest_city              text,
    dest_state             text CHECK (char_length(dest_state) = 2),
    billed_amount          numeric(12,2),
    accessorials_expected  numeric(12,2) NOT NULL DEFAULT 0,
    status                 load_status NOT NULL DEFAULT 'created',
    notes                  text,
    created_at             timestamptz NOT NULL DEFAULT now(),
    updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_load_records_status ON load_records(status);
CREATE INDEX idx_load_records_customer_id ON load_records(customer_id);
CREATE INDEX idx_load_records_load_number ON load_records(load_number);
CREATE INDEX idx_load_records_pickup_date ON load_records(pickup_date);
CREATE INDEX idx_load_records_delivery_date ON load_records(delivery_date);
CREATE INDEX idx_load_records_org_id ON load_records(org_id);

COMMIT;
