-- Migration 002: Core entity tables
-- CarrierBackOffice platform

BEGIN;

-- Enum for user roles
CREATE TYPE user_role AS ENUM (
    'admin',
    'backoffice',
    'billing',
    'compliance',
    'safety',
    'auditor',
    'driver_readonly'
);

-- Enum for customer types
CREATE TYPE customer_type AS ENUM (
    'shipper',
    'broker'
);

-- Organizations
CREATE TABLE organizations (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text NOT NULL,
    slug        text NOT NULL UNIQUE,
    settings    jsonb NOT NULL DEFAULT '{}',
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Users
CREATE TABLE users (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id        uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email         text NOT NULL UNIQUE,
    name          text NOT NULL,
    password_hash text NOT NULL,
    role          user_role NOT NULL,
    avatar_url    text,
    is_active     boolean NOT NULL DEFAULT true,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_users_role ON users(role);

-- Customers (shippers / brokers)
CREATE TABLE customers (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id             uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name               text NOT NULL,
    type               customer_type NOT NULL,
    contact_email      text,
    contact_phone      text,
    billing_email      text,
    payment_terms_days integer NOT NULL DEFAULT 30,
    is_active          boolean NOT NULL DEFAULT true,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_org_id ON customers(org_id);

-- Carrier profiles
CREATE TABLE carrier_profiles (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id           uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    mc_number        text,
    dot_number       text,
    name             text NOT NULL,
    contact_email    text,
    contact_phone    text,
    insurance_expiry date,
    authority_status text,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_carrier_profiles_org_id ON carrier_profiles(org_id);

COMMIT;
