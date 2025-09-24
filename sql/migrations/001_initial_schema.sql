-- Clearhaul Brokerage Platform - Initial Schema
-- Version: 0.1.0
-- Created: 2024-12-23

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
CREATE TYPE load_status AS ENUM (
    'created', 'quoted', 'tendered', 'awarded', 
    'picked_up', 'in_transit', 'delivered', 'cancelled'
);

CREATE TYPE service_level AS ENUM ('standard', 'expedited', 'urgent');

CREATE TYPE tender_status AS ENUM ('sent', 'accepted', 'declined', 'expired');

CREATE TYPE document_type AS ENUM (
    'bol', 'pod', 'invoice', 'rate_confirmation', 'insurance_certificate'
); -- BOL = Bill of Lading, POD = Proof of Delivery

CREATE TYPE invoice_status AS ENUM ('pending', 'paid', 'overdue', 'disputed');

CREATE TYPE payout_method AS ENUM ('ach', 'rtp', 'wire', 'check');

CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TYPE exception_type AS ENUM ('delay', 'damage', 'dispute', 'fraud', 'compliance');

CREATE TYPE exception_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- Shippers table
CREATE TABLE shippers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_state VARCHAR(50),
    address_zip VARCHAR(20),
    address_country VARCHAR(2) DEFAULT 'US',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Carriers table
CREATE TABLE carriers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mc_number VARCHAR(20) UNIQUE NOT NULL, -- Motor Carrier Number
    dot_number VARCHAR(20) UNIQUE NOT NULL, -- Department of Transportation Number
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_state VARCHAR(50),
    address_zip VARCHAR(20),
    address_country VARCHAR(2) DEFAULT 'US',
    equipment_types TEXT[], -- Array of equipment codes (dry van, reefer, flatbed, etc.)
    insurance_liability DECIMAL(12,2),
    insurance_cargo DECIMAL(12,2),
    insurance_general DECIMAL(12,2),
    insurance_expiration DATE,
    trust_score INTEGER DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drivers table
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carrier_id UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL, -- Commercial Driver's License Number
    cdl_class VARCHAR(10), -- CDL Class (A, B, C)
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment types table
CREATE TABLE equipment_types (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    max_weight INTEGER,
    max_length DECIMAL(8,2),
    max_width DECIMAL(8,2),
    max_height DECIMAL(8,2)
);

-- Loads table
CREATE TABLE loads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipper_id UUID NOT NULL REFERENCES shippers(id) ON DELETE CASCADE,
    origin_name VARCHAR(255) NOT NULL,
    origin_address VARCHAR(255) NOT NULL,
    origin_city VARCHAR(100) NOT NULL,
    origin_state VARCHAR(50) NOT NULL,
    origin_zip VARCHAR(20) NOT NULL,
    origin_lat DECIMAL(10, 8),
    origin_lng DECIMAL(11, 8),
    destination_name VARCHAR(255) NOT NULL,
    destination_address VARCHAR(255) NOT NULL,
    destination_city VARCHAR(100) NOT NULL,
    destination_state VARCHAR(50) NOT NULL,
    destination_zip VARCHAR(20) NOT NULL,
    destination_lat DECIMAL(10, 8),
    destination_lng DECIMAL(11, 8),
    commodity VARCHAR(255),
    weight_lbs INTEGER,
    equipment_code VARCHAR(10) REFERENCES equipment_types(code),
    pickup_earliest TIMESTAMPTZ,
    delivery_latest TIMESTAMPTZ,
    service_level service_level DEFAULT 'standard',
    special_requirements TEXT[],
    status load_status DEFAULT 'created',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotes table
CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
    price_usd DECIMAL(12,2) NOT NULL,
    fuel_index DECIMAL(6,3),
    basis VARCHAR(255),
    valid_until TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenders table
CREATE TABLE tenders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
    carrier_id UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
    price_usd DECIMAL(12,2) NOT NULL,
    status tender_status DEFAULT 'sent',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Awards table
CREATE TABLE awards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
    carrier_id UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    pickup_instructions TEXT,
    delivery_instructions TEXT
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
    type document_type NOT NULL,
    filename VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    uploaded_by UUID NOT NULL, -- References user who uploaded
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    verified BOOLEAN DEFAULT FALSE
);

-- Invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
    carrier_id UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
    amount_usd DECIMAL(12,2) NOT NULL,
    due_date DATE NOT NULL,
    status invoice_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);

-- Payouts table
CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carrier_id UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    amount_usd DECIMAL(12,2) NOT NULL,
    method payout_method NOT NULL,
    status payout_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Exceptions table for tracking issues
CREATE TABLE exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
    exception_type exception_type NOT NULL,
    severity exception_severity NOT NULL,
    description TEXT NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX idx_loads_shipper_id ON loads(shipper_id);
CREATE INDEX idx_loads_status ON loads(status);
CREATE INDEX idx_loads_created_at ON loads(created_at);
CREATE INDEX idx_tenders_carrier_id ON tenders(carrier_id);
CREATE INDEX idx_tenders_status ON tenders(status);
CREATE INDEX idx_tenders_expires_at ON tenders(expires_at);
CREATE INDEX idx_documents_load_id ON documents(load_id);
CREATE INDEX idx_invoices_carrier_id ON invoices(carrier_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_payouts_carrier_id ON payouts(carrier_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_exceptions_load_id ON exceptions(load_id);
CREATE INDEX idx_exceptions_resolved ON exceptions(resolved);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_shippers_updated_at BEFORE UPDATE ON shippers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_carriers_updated_at BEFORE UPDATE ON carriers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loads_updated_at BEFORE UPDATE ON loads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenders_updated_at BEFORE UPDATE ON tenders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
