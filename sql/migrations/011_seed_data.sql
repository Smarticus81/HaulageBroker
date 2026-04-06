-- Seed data for CarrierBackOffice development
-- Organization
INSERT INTO organizations (id, name, slug, settings) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Acme Trucking LLC', 'acme-trucking', '{"timezone": "America/Chicago", "currency": "USD"}');

-- Users (password: password123)
INSERT INTO users (id, org_id, email, name, password_hash, role) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'admin@acme.com', 'Alice Admin', crypt('password123', gen_salt('bf')), 'admin'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'billing@acme.com', 'Bob Billing', crypt('password123', gen_salt('bf')), 'billing'),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'compliance@acme.com', 'Carol Compliance', crypt('password123', gen_salt('bf')), 'compliance'),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'safety@acme.com', 'Sam Safety', crypt('password123', gen_salt('bf')), 'safety'),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'backoffice@acme.com', 'Dana Backoffice', crypt('password123', gen_salt('bf')), 'backoffice'),
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'driver1@acme.com', 'Dave Driver', crypt('password123', gen_salt('bf')), 'driver_readonly');

-- Customers
INSERT INTO customers (id, org_id, name, type, contact_email, contact_phone, billing_email, payment_terms_days) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Global Freight Solutions', 'broker', 'ops@globalfreight.com', '555-100-2000', 'billing@globalfreight.com', 30),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Midwest Manufacturing Co', 'shipper', 'shipping@midwestmfg.com', '555-200-3000', 'ap@midwestmfg.com', 45),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Pacific Coast Logistics', 'broker', 'dispatch@pclogistics.com', '555-300-4000', 'invoices@pclogistics.com', 30);

-- Carrier Profile
INSERT INTO carrier_profiles (id, org_id, mc_number, dot_number, name, contact_email, contact_phone, insurance_expiry, authority_status) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'MC-123456', 'DOT-7890123', 'Acme Trucking LLC', 'ops@acmetrucking.com', '555-000-1000', (CURRENT_DATE + INTERVAL '180 days')::date, 'active');

-- Load Records (20 loads across various statuses)
INSERT INTO load_records (id, org_id, load_number, customer_id, customer_ref, pickup_date, delivery_date, origin_city, origin_state, dest_city, dest_state, billed_amount, accessorials_expected, status) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'LD-2024-001', 'c0000000-0000-0000-0000-000000000001', 'GFS-8801', '2024-01-10', '2024-01-12', 'Dallas', 'TX', 'Atlanta', 'GA', 2500.00, 150.00, 'closed'),
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'LD-2024-002', 'c0000000-0000-0000-0000-000000000002', 'MMC-4420', '2024-01-14', '2024-01-15', 'Chicago', 'IL', 'Indianapolis', 'IN', 1200.00, 0.00, 'invoiced'),
  ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'LD-2024-003', 'c0000000-0000-0000-0000-000000000001', 'GFS-8815', '2024-01-18', '2024-01-20', 'Houston', 'TX', 'Memphis', 'TN', 1800.00, 200.00, 'ready_to_invoice'),
  ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'LD-2024-004', 'c0000000-0000-0000-0000-000000000003', 'PCL-1100', '2024-01-22', '2024-01-24', 'Los Angeles', 'CA', 'Phoenix', 'AZ', 1500.00, 100.00, 'docs_received'),
  ('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'LD-2024-005', 'c0000000-0000-0000-0000-000000000002', 'MMC-4438', '2024-01-25', '2024-01-26', 'Detroit', 'MI', 'Columbus', 'OH', 950.00, 0.00, 'docs_pending'),
  ('e0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'LD-2024-006', 'c0000000-0000-0000-0000-000000000001', 'GFS-8830', '2024-01-28', '2024-01-30', 'Nashville', 'TN', 'Charlotte', 'NC', 2100.00, 0.00, 'validation_failed'),
  ('e0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'LD-2024-007', 'c0000000-0000-0000-0000-000000000003', 'PCL-1115', '2024-02-01', '2024-02-03', 'San Francisco', 'CA', 'Portland', 'OR', 1700.00, 150.00, 'ready_to_invoice'),
  ('e0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'LD-2024-008', 'c0000000-0000-0000-0000-000000000002', 'MMC-4450', '2024-02-05', '2024-02-06', 'Milwaukee', 'WI', 'St Louis', 'MO', 1100.00, 0.00, 'created'),
  ('e0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'LD-2024-009', 'c0000000-0000-0000-0000-000000000001', 'GFS-8845', '2024-02-08', '2024-02-10', 'Jacksonville', 'FL', 'Savannah', 'GA', 800.00, 0.00, 'docs_pending'),
  ('e0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'LD-2024-010', 'c0000000-0000-0000-0000-000000000003', 'PCL-1130', '2024-02-12', '2024-02-14', 'Seattle', 'WA', 'Sacramento', 'CA', 2800.00, 200.00, 'docs_received'),
  ('e0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'LD-2024-011', 'c0000000-0000-0000-0000-000000000001', 'GFS-8860', '2024-02-15', '2024-02-17', 'Denver', 'CO', 'Kansas City', 'MO', 1400.00, 0.00, 'ready_to_invoice'),
  ('e0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'LD-2024-012', 'c0000000-0000-0000-0000-000000000002', 'MMC-4465', '2024-02-18', '2024-02-19', 'Cincinnati', 'OH', 'Pittsburgh', 'PA', 1050.00, 100.00, 'invoiced'),
  ('e0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'LD-2024-013', 'c0000000-0000-0000-0000-000000000003', 'PCL-1145', '2024-02-22', '2024-02-24', 'Las Vegas', 'NV', 'Salt Lake City', 'UT', 1600.00, 0.00, 'docs_pending'),
  ('e0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'LD-2024-014', 'c0000000-0000-0000-0000-000000000001', 'GFS-8875', '2024-02-25', '2024-02-27', 'Miami', 'FL', 'Tampa', 'FL', 900.00, 0.00, 'created'),
  ('e0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001', 'LD-2024-015', 'c0000000-0000-0000-0000-000000000002', 'MMC-4480', '2024-03-01', '2024-03-02', 'Cleveland', 'OH', 'Buffalo', 'NY', 1300.00, 0.00, 'docs_received'),
  ('e0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000001', 'LD-2024-016', 'c0000000-0000-0000-0000-000000000003', 'PCL-1160', '2024-03-04', '2024-03-06', 'San Diego', 'CA', 'Tucson', 'AZ', 1450.00, 100.00, 'ready_to_invoice'),
  ('e0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000001', 'LD-2024-017', 'c0000000-0000-0000-0000-000000000001', 'GFS-8890', '2024-03-08', '2024-03-10', 'Birmingham', 'AL', 'New Orleans', 'LA', 1750.00, 0.00, 'validation_failed'),
  ('e0000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000001', 'LD-2024-018', 'c0000000-0000-0000-0000-000000000002', 'MMC-4495', '2024-03-11', '2024-03-12', 'Minneapolis', 'MN', 'Des Moines', 'IA', 1000.00, 0.00, 'docs_pending'),
  ('e0000000-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000001', 'LD-2024-019', 'c0000000-0000-0000-0000-000000000003', 'PCL-1175', '2024-03-14', '2024-03-16', 'Oakland', 'CA', 'Reno', 'NV', 1550.00, 150.00, 'closed'),
  ('e0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000001', 'LD-2024-020', 'c0000000-0000-0000-0000-000000000001', 'GFS-8905', '2024-03-18', '2024-03-20', 'Raleigh', 'NC', 'Richmond', 'VA', 1150.00, 0.00, 'created');

-- Documents (some linked to loads, some missing to demo missing docs scenarios)
INSERT INTO documents (id, org_id, doc_type, original_filename, storage_url, content_type, uploaded_by, linked_entity_type, linked_entity_id, extracted_fields, validation_status) VALUES
  -- Load 001: all docs present (closed)
  ('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'POD', 'POD_LD-2024-001.pdf', 's3://carrier-docs/pod/ld-2024-001.pdf', 'application/pdf', 'b0000000-0000-0000-0000-000000000005', 'load_record', 'e0000000-0000-0000-0000-000000000001', '{"delivery_date": "2024-01-12", "receiver_name": "John Smith", "signature_present": true}', 'valid'),
  ('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'BOL', 'BOL_LD-2024-001.pdf', 's3://carrier-docs/bol/ld-2024-001.pdf', 'application/pdf', 'b0000000-0000-0000-0000-000000000005', 'load_record', 'e0000000-0000-0000-0000-000000000001', '{"shipper": "Midwest Mfg", "consignee": "Atlanta Dist", "pickup_date": "2024-01-10"}', 'valid'),
  ('f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'RateConf', 'RateConf_LD-2024-001.pdf', 's3://carrier-docs/rateconf/ld-2024-001.pdf', 'application/pdf', 'b0000000-0000-0000-0000-000000000005', 'load_record', 'e0000000-0000-0000-0000-000000000001', '{"rate": 2500.00, "accessorials": 150.00}', 'valid'),
  -- Load 002: POD + BOL present, RateConf missing
  ('f0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'POD', 'POD_LD-2024-002.pdf', 's3://carrier-docs/pod/ld-2024-002.pdf', 'application/pdf', 'b0000000-0000-0000-0000-000000000005', 'load_record', 'e0000000-0000-0000-0000-000000000002', '{"delivery_date": "2024-01-15", "receiver_name": "Mike Wilson", "signature_present": true}', 'valid'),
  ('f0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'BOL', 'BOL_LD-2024-002.pdf', 's3://carrier-docs/bol/ld-2024-002.pdf', 'application/pdf', 'b0000000-0000-0000-0000-000000000005', 'load_record', 'e0000000-0000-0000-0000-000000000002', '{"shipper": "Midwest Mfg", "consignee": "Indy Warehouse"}', 'valid'),
  -- Load 003: all docs present (ready to invoice)
  ('f0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'POD', 'POD_LD-2024-003.pdf', 's3://carrier-docs/pod/ld-2024-003.pdf', 'application/pdf', 'b0000000-0000-0000-0000-000000000006', 'load_record', 'e0000000-0000-0000-0000-000000000003', '{"delivery_date": "2024-01-20", "receiver_name": "Sarah Lee", "signature_present": true}', 'valid'),
  ('f0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'RateConf', 'RateConf_LD-2024-003.pdf', 's3://carrier-docs/rateconf/ld-2024-003.pdf', 'application/pdf', 'b0000000-0000-0000-0000-000000000005', 'load_record', 'e0000000-0000-0000-0000-000000000003', '{"rate": 1800.00, "accessorials": 200.00}', 'valid'),
  ('f0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'BOL', 'BOL_LD-2024-003.pdf', 's3://carrier-docs/bol/ld-2024-003.pdf', 'application/pdf', 'b0000000-0000-0000-0000-000000000005', 'load_record', 'e0000000-0000-0000-0000-000000000003', '{}', 'valid'),
  -- Load 005: no docs (docs_pending)
  -- Load 006: POD with validation failure
  ('f0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'POD', 'POD_LD-2024-006.pdf', 's3://carrier-docs/pod/ld-2024-006.pdf', 'application/pdf', 'b0000000-0000-0000-0000-000000000006', 'load_record', 'e0000000-0000-0000-0000-000000000006', '{"delivery_date": "2024-01-31", "receiver_name": "unclear", "signature_present": false}', 'invalid'),
  -- Load 009: no docs (docs_pending)
  -- Load 010: BOL only
  ('f0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'BOL', 'BOL_LD-2024-010.pdf', 's3://carrier-docs/bol/ld-2024-010.pdf', 'application/pdf', 'b0000000-0000-0000-0000-000000000005', 'load_record', 'e0000000-0000-0000-0000-000000000010', '{"shipper": "Seattle Goods", "consignee": "Sac Warehouse"}', 'valid'),
  -- Compliance documents
  ('f0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'CDL', 'CDL_Dave_Driver.pdf', 's3://carrier-docs/compliance/cdl-dave.pdf', 'application/pdf', 'b0000000-0000-0000-0000-000000000006', 'user', 'b0000000-0000-0000-0000-000000000006', '{"license_number": "DL-998877", "expiry_date": "2024-06-15", "endorsements": "H,T"}', 'valid'),
  ('f0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'MedCard', 'MedCard_Dave_Driver.pdf', 's3://carrier-docs/compliance/medcard-dave.pdf', 'application/pdf', 'b0000000-0000-0000-0000-000000000006', 'user', 'b0000000-0000-0000-0000-000000000006', '{"expiry_date": "2024-04-20", "physician_name": "Dr. Brown"}', 'valid'),
  ('f0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'InsuranceCert', 'Insurance_Acme.pdf', 's3://carrier-docs/compliance/insurance-acme.pdf', 'application/pdf', 'b0000000-0000-0000-0000-000000000001', 'carrier_profile', 'd0000000-0000-0000-0000-000000000001', '{"policy_number": "INS-55443322", "expiry_date": "2024-12-31", "coverage_amount": 1000000}', 'valid');

-- Compliance Artifacts
INSERT INTO compliance_artifacts (id, org_id, subject_type, subject_id, artifact_type, description, issue_date, expiry_date, status, evidence_document_id) VALUES
  -- Driver Dave: CDL expiring in ~2.5 months
  ('g0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'driver', 'b0000000-0000-0000-0000-000000000006', 'CDL', 'Commercial Driver License - Class A', '2020-06-15', (CURRENT_DATE + INTERVAL '10 days')::date, 'expiring_soon', 'f0000000-0000-0000-0000-000000000011'),
  -- Driver Dave: Medical card expiring soon
  ('g0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'driver', 'b0000000-0000-0000-0000-000000000006', 'MedCard', 'DOT Medical Examiner Certificate', '2022-04-20', (CURRENT_DATE + INTERVAL '25 days')::date, 'expiring_soon', 'f0000000-0000-0000-0000-000000000012'),
  -- Carrier insurance: active
  ('g0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'carrier', 'd0000000-0000-0000-0000-000000000001', 'InsuranceCert', 'General Liability Insurance', '2024-01-01', (CURRENT_DATE + INTERVAL '180 days')::date, 'active', 'f0000000-0000-0000-0000-000000000013'),
  -- Truck annual inspection: expired
  ('g0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'truck', 'd0000000-0000-0000-0000-000000000001', 'AnnualInspection', 'Annual DOT Inspection - Truck #101', '2023-03-15', (CURRENT_DATE - INTERVAL '5 days')::date, 'expired', NULL),
  -- Trailer inspection: expiring in 7 days
  ('g0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'trailer', 'd0000000-0000-0000-0000-000000000001', 'AnnualInspection', 'Annual DOT Inspection - Trailer #201', '2023-03-20', (CURRENT_DATE + INTERVAL '7 days')::date, 'expiring_soon', NULL);

-- Compliance Rules
INSERT INTO compliance_rules (id, org_id, name, description, artifact_type, subject_type, required, lead_time_days, severity, is_active) VALUES
  ('h0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'CDL Expiration', 'Commercial Driver License must be current', 'CDL', 'driver', true, '{30,14,7}', 'critical', true),
  ('h0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Medical Card Expiration', 'DOT Medical Certificate must be current', 'MedCard', 'driver', true, '{30,14,7}', 'critical', true),
  ('h0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Annual Inspection', 'Annual DOT vehicle inspection required', 'AnnualInspection', 'truck', true, '{30,14,7}', 'high', true),
  ('h0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Insurance Certificate', 'Valid insurance coverage required', 'InsuranceCert', 'carrier', true, '{60,30,14}', 'critical', true),
  ('h0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Trailer Inspection', 'Annual DOT trailer inspection required', 'AnnualInspection', 'trailer', true, '{30,14,7}', 'high', true);

-- Invoice Packets
INSERT INTO invoice_packets (id, org_id, load_record_id, required_docs, docs_present, packet_status) VALUES
  ('i0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', '["POD", "BOL", "RateConf"]', '["POD", "BOL", "RateConf"]', 'exported'),
  ('i0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003', '["POD", "BOL", "RateConf"]', '["POD", "BOL", "RateConf"]', 'ready_for_review'),
  ('i0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000005', '["POD", "BOL", "RateConf"]', '[]', 'incomplete');

-- Tasks
INSERT INTO tasks (id, org_id, queue, title, description, priority, due_date, assignee_id, linked_entity_type, linked_entity_id, status) VALUES
  ('j0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'docs', 'Collect POD for LD-2024-005', 'POD missing for load LD-2024-005. Delivery was 2024-01-26.', 'high', (CURRENT_DATE + INTERVAL '1 day')::timestamptz, 'b0000000-0000-0000-0000-000000000005', 'load_record', 'e0000000-0000-0000-0000-000000000005', 'open'),
  ('j0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'billing', 'Missing Rate Confirmation for LD-2024-002', 'Rate confirmation not uploaded for load LD-2024-002.', 'medium', (CURRENT_DATE + INTERVAL '3 days')::timestamptz, 'b0000000-0000-0000-0000-000000000002', 'load_record', 'e0000000-0000-0000-0000-000000000002', 'open'),
  ('j0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'compliance', 'CDL expiring for Dave Driver', 'CDL expires in 10 days. Ensure renewal is in progress.', 'urgent', (CURRENT_DATE + INTERVAL '5 days')::timestamptz, 'b0000000-0000-0000-0000-000000000003', 'user', 'b0000000-0000-0000-0000-000000000006', 'open'),
  ('j0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'compliance', 'Truck #101 Annual Inspection Expired', 'Annual DOT inspection has expired. Vehicle must not operate until inspected.', 'urgent', CURRENT_DATE::timestamptz, 'b0000000-0000-0000-0000-000000000004', 'carrier_profile', 'd0000000-0000-0000-0000-000000000001', 'open'),
  ('j0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'billing', 'Review invoice packet for LD-2024-003', 'All docs present. Ready for approval.', 'medium', (CURRENT_DATE + INTERVAL '2 days')::timestamptz, 'b0000000-0000-0000-0000-000000000002', 'load_record', 'e0000000-0000-0000-0000-000000000003', 'open'),
  ('j0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'docs', 'Re-upload POD for LD-2024-006', 'POD failed validation: missing signature, date mismatch.', 'high', (CURRENT_DATE + INTERVAL '1 day')::timestamptz, 'b0000000-0000-0000-0000-000000000005', 'load_record', 'e0000000-0000-0000-0000-000000000006', 'in_progress'),
  ('j0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'docs', 'Collect all docs for LD-2024-009', 'No documents uploaded for load LD-2024-009.', 'medium', (CURRENT_DATE + INTERVAL '5 days')::timestamptz, NULL, 'load_record', 'e0000000-0000-0000-0000-000000000009', 'open'),
  ('j0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'compliance', 'Trailer #201 inspection expiring in 7 days', 'Schedule annual inspection for Trailer #201.', 'high', (CURRENT_DATE + INTERVAL '5 days')::timestamptz, 'b0000000-0000-0000-0000-000000000004', 'carrier_profile', 'd0000000-0000-0000-0000-000000000001', 'open');

-- Exceptions
INSERT INTO exceptions (id, org_id, type, severity, linked_entity_type, linked_entity_id, description, status) VALUES
  ('k0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'missing_pod', 'high', 'load_record', 'e0000000-0000-0000-0000-000000000005', 'POD not received for LD-2024-005. Delivery date was 2024-01-26.', 'open'),
  ('k0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'missing_rateconf', 'medium', 'load_record', 'e0000000-0000-0000-0000-000000000002', 'Rate confirmation missing for LD-2024-002.', 'open'),
  ('k0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'invalid_pod', 'high', 'load_record', 'e0000000-0000-0000-0000-000000000006', 'POD for LD-2024-006 failed validation: no signature, delivery date mismatch.', 'investigating'),
  ('k0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'compliance_expired', 'critical', 'carrier_profile', 'd0000000-0000-0000-0000-000000000001', 'Annual inspection for Truck #101 has expired.', 'open'),
  ('k0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'missing_pod', 'medium', 'load_record', 'e0000000-0000-0000-0000-000000000009', 'No documents uploaded for LD-2024-009.', 'open'),
  ('k0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'missing_pod', 'medium', 'load_record', 'e0000000-0000-0000-0000-000000000013', 'POD missing for LD-2024-013.', 'open'),
  ('k0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'missing_pod', 'low', 'load_record', 'e0000000-0000-0000-0000-000000000018', 'All docs pending for LD-2024-018.', 'open');

-- Default Automation Rules
INSERT INTO automation_rules (id, org_id, name, description, trigger_type, trigger_event, schedule_cron, conditions, actions, is_active, is_system) VALUES
  ('r0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'POD Chase', 'If delivery passed and POD not uploaded within 12 hours, create document request and task',
   'event', 'load.status_changed', NULL,
   '[{"type": "doc_missing_after", "params": {"doc_type": "POD", "hours": 12}}]',
   '[{"type": "create_document_request", "params": {"doc_types": ["POD"], "target": "driver"}}, {"type": "create_task", "params": {"queue": "docs", "title": "Collect POD", "priority": "high"}}]',
   true, true),
  ('r0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
   'Rate Confirmation Required', 'If load created and RateConf missing for 2 hours, create billing task',
   'event', 'load.created', NULL,
   '[{"type": "doc_missing_after", "params": {"doc_type": "RateConf", "hours": 2}}]',
   '[{"type": "create_task", "params": {"queue": "billing", "title": "Missing Rate Confirmation", "priority": "medium"}}]',
   true, true),
  ('r0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001',
   'Validation Mismatch', 'If extracted amount differs from load amount by >2%, raise exception',
   'event', 'document.validated', NULL,
   '[{"type": "amount_mismatch", "params": {"threshold_pct": 0.02}}]',
   '[{"type": "create_exception", "params": {"type": "mismatch_amount", "severity": "high"}}, {"type": "create_task", "params": {"queue": "billing", "title": "Amount Mismatch Review", "priority": "high"}}]',
   true, true),
  ('r0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001',
   'Compliance Expirations', 'Daily scan for compliance artifacts expiring in 30/14/7 days',
   'schedule', NULL, '0 6 * * *',
   '[{"type": "compliance_expiry_within", "params": {"days": 30}}]',
   '[{"type": "create_task", "params": {"queue": "compliance", "title": "Compliance Expiring", "priority": "high"}}, {"type": "send_notification", "params": {"channel": "email", "template": "compliance_expiring"}}]',
   true, true),
  ('r0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001',
   'Invoice Packet Readiness', 'When all required docs present and validations pass, mark packet ready',
   'event', 'document.validated', NULL,
   '[{"type": "all_required_docs_present", "params": {"doc_types": ["POD", "BOL", "RateConf"]}}]',
   '[{"type": "update_packet_status", "params": {"status": "ready_for_review"}}, {"type": "create_task", "params": {"queue": "billing", "title": "Invoice Packet Ready for Approval", "priority": "medium"}}]',
   true, true),
  ('r0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001',
   'Weekly Settlement Packet', 'Generate settlement packets weekly with missing docs list',
   'schedule', NULL, '0 8 * * 1',
   '[]',
   '[{"type": "generate_settlement_packets", "params": {}}, {"type": "create_task", "params": {"queue": "billing", "title": "Review Weekly Settlements", "priority": "medium"}}]',
   true, true);

-- Document Requests
INSERT INTO document_requests (id, org_id, requested_by, target_user_id, due_date, required_doc_types, linked_entity_type, linked_entity_id, status, reminders_sent) VALUES
  ('l0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000006', (CURRENT_DATE + INTERVAL '2 days')::timestamptz, '{POD}', 'load_record', 'e0000000-0000-0000-0000-000000000005', 'pending', 1),
  ('l0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000006', (CURRENT_DATE + INTERVAL '3 days')::timestamptz, '{POD,BOL}', 'load_record', 'e0000000-0000-0000-0000-000000000009', 'pending', 0),
  ('l0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000006', (CURRENT_DATE - INTERVAL '1 day')::timestamptz, '{CDL}', 'user', 'b0000000-0000-0000-0000-000000000006', 'overdue', 2);

-- Audit Log entries
INSERT INTO audit_logs (org_id, actor_id, actor_type, action, entity_type, entity_id, metadata, source) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'user', 'organization.created', 'organization', 'a0000000-0000-0000-0000-000000000001', '{}', 'system'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'user', 'document.uploaded', 'document', 'f0000000-0000-0000-0000-000000000001', '{"doc_type": "POD", "load": "LD-2024-001"}', 'ui'),
  ('a0000000-0000-0000-0000-000000000001', NULL, 'automation', 'task.created', 'task', 'j0000000-0000-0000-0000-000000000001', '{"rule": "POD Chase", "trigger": "load.status_changed"}', 'automation'),
  ('a0000000-0000-0000-0000-000000000001', NULL, 'automation', 'exception.created', 'exception', 'k0000000-0000-0000-0000-000000000001', '{"rule": "POD Chase", "type": "missing_pod"}', 'automation'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'user', 'invoice_packet.approved', 'invoice_packet', 'i0000000-0000-0000-0000-000000000001', '{"load": "LD-2024-001"}', 'ui');
