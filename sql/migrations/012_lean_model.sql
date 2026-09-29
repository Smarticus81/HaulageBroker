-- Migration 012: Lean business model - plans, onboarding profile, business plan, autopilot
-- Haulage platform (see docs/business-model.md)

BEGIN;

-- ---------------------------------------------------------------------------
-- Plans (section 2)
-- ---------------------------------------------------------------------------

CREATE TYPE plan_tier AS ENUM (
    'solo',
    'fleet',
    'autopilot'
);

CREATE TABLE subscriptions (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id             uuid NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    plan               plan_tier NOT NULL DEFAULT 'solo',
    truck_count        integer NOT NULL DEFAULT 1 CHECK (truck_count >= 1),
    status             text NOT NULL DEFAULT 'active',
    trial_ends_at      timestamptz,
    current_period_end timestamptz,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_plan ON subscriptions(plan);

-- ---------------------------------------------------------------------------
-- Onboarding profile (section 3). NULL trailers/drivers mean "same as trucks".
-- ---------------------------------------------------------------------------

CREATE TABLE onboarding_profiles (
    id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                        uuid NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    company_name                  text,
    dot_number                    text,
    mc_number                     text,
    stage                         text NOT NULL DEFAULT 'operating' CHECK (stage IN ('starting', 'operating')),
    trucks                        integer NOT NULL DEFAULT 1 CHECK (trucks >= 0),
    trailers                      integer CHECK (trailers >= 0),
    drivers                       integer CHECK (drivers >= 0),
    miles_per_truck_per_week      integer NOT NULL DEFAULT 2500,
    deadhead_pct                  numeric(5,4) NOT NULL DEFAULT 0.15 CHECK (deadhead_pct >= 0 AND deadhead_pct <= 1),
    rate_per_loaded_mile          numeric(10,4) NOT NULL DEFAULT 2.35,
    fuel_mpg                      numeric(10,4) NOT NULL DEFAULT 6.5,
    fuel_price                    numeric(10,4) NOT NULL DEFAULT 3.85,
    driver_pay_per_mile           numeric(10,4) NOT NULL DEFAULT 0.62,
    insurance_per_truck_month     numeric(12,2) NOT NULL DEFAULT 1400,
    truck_payment_per_month       numeric(12,2) NOT NULL DEFAULT 2200,
    trailer_payment_per_month     numeric(12,2) NOT NULL DEFAULT 600,
    maintenance_per_mile          numeric(10,4) NOT NULL DEFAULT 0.18,
    tires_per_mile                numeric(10,4) NOT NULL DEFAULT 0.04,
    tolls_permits_per_truck_month numeric(12,2) NOT NULL DEFAULT 350,
    overhead_per_month            numeric(12,2) NOT NULL DEFAULT 800,
    payment_terms_days            integer NOT NULL DEFAULT 35,
    factoring_enabled             boolean NOT NULL DEFAULT false,
    factoring_rate_pct            numeric(5,2) NOT NULL DEFAULT 3.0,
    factoring_advance_pct         numeric(5,2) NOT NULL DEFAULT 95,
    starting_cash                 numeric(12,2) NOT NULL DEFAULT 15000,
    doc_channels                  text[] NOT NULL DEFAULT '{email,photo}',
    voice_used                    boolean NOT NULL DEFAULT false,
    completed_at                  timestamptz,
    answers                       jsonb NOT NULL DEFAULT '{}',
    created_at                    timestamptz NOT NULL DEFAULT now(),
    updated_at                    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Business plans (section 4): one row per computation, newest version wins
-- ---------------------------------------------------------------------------

CREATE TABLE business_plans (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id           uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    version          integer NOT NULL DEFAULT 1,
    inputs           jsonb NOT NULL DEFAULT '{}',
    results          jsonb NOT NULL DEFAULT '{}',
    projection       jsonb NOT NULL DEFAULT '[]',
    recommendations  jsonb NOT NULL DEFAULT '[]',
    health           integer NOT NULL DEFAULT 0 CHECK (health >= 0 AND health <= 100),
    generated_by     text NOT NULL DEFAULT 'onboarding' CHECK (generated_by IN ('onboarding', 'recompute', 'autopilot')),
    created_at       timestamptz NOT NULL DEFAULT now(),
    UNIQUE (org_id, version)
);

CREATE INDEX idx_business_plans_org_created ON business_plans(org_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Autopilot policies (section 5): one row per org, defaults from the spec
-- ---------------------------------------------------------------------------

CREATE TABLE autopilot_policies (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                   uuid NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    auto_invoice_max_amount  numeric(12,2) NOT NULL DEFAULT 5000,
    pod_chase_hours          integer NOT NULL DEFAULT 12,
    pod_chase_cadence_hours  integer NOT NULL DEFAULT 24,
    quick_pay_min_days       integer NOT NULL DEFAULT 45,
    compliance_alert_days    int[] NOT NULL DEFAULT '{30,14,7,1}',
    auto_link_confidence     numeric(5,4) NOT NULL DEFAULT 0.92 CHECK (auto_link_confidence >= 0 AND auto_link_confidence <= 1),
    settlement_day           text NOT NULL DEFAULT 'friday',
    quiet_hours              text NOT NULL DEFAULT '21:00-06:00',
    mode                     text NOT NULL DEFAULT 'suggest' CHECK (mode IN ('suggest', 'act', 'full')),
    created_at               timestamptz NOT NULL DEFAULT now(),
    updated_at               timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Autopilot events (section 5): the receipt for every action
-- ---------------------------------------------------------------------------

CREATE TABLE autopilot_events (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id         uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    kind           text NOT NULL,
    summary        text NOT NULL,
    entity_type    text,
    entity_id      uuid,
    outcome        text NOT NULL DEFAULT 'done' CHECK (outcome IN ('done', 'needs_you', 'skipped')),
    saved_minutes  integer NOT NULL DEFAULT 0 CHECK (saved_minutes >= 0),
    payload        jsonb NOT NULL DEFAULT '{}',
    created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_autopilot_events_org_created ON autopilot_events(org_id, created_at DESC);
CREATE INDEX idx_autopilot_events_org_outcome ON autopilot_events(org_id, outcome);

-- ---------------------------------------------------------------------------
-- Seed data for the demo org (Acme Trucking LLC, a0000000-0000-0000-0000-000000000001)
-- ---------------------------------------------------------------------------

-- Fleet plan, 3 trucks
INSERT INTO subscriptions (id, org_id, plan, truck_count, status, current_period_end) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'fleet', 3, 'active', now() + INTERVAL '23 days')
ON CONFLICT (org_id) DO NOTHING;

-- Onboarding profile = the worked example in docs/business-model.md section 4.8
INSERT INTO onboarding_profiles (
    id, org_id, company_name, dot_number, mc_number, stage, trucks, trailers, drivers,
    miles_per_truck_per_week, deadhead_pct, rate_per_loaded_mile, fuel_mpg, fuel_price, driver_pay_per_mile,
    insurance_per_truck_month, truck_payment_per_month, trailer_payment_per_month, maintenance_per_mile, tires_per_mile,
    tolls_permits_per_truck_month, overhead_per_month, payment_terms_days, factoring_enabled, factoring_rate_pct,
    factoring_advance_pct, starting_cash, doc_channels, voice_used, completed_at, answers
) VALUES (
    'a2000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Acme Trucking LLC', 'DOT-7890123', 'MC-123456', 'operating', 3, 3, 3,
    2500, 0.15, 2.35, 6.5, 3.85, 0.62,
    1400, 2200, 600, 0.18, 0.04,
    350, 800, 35, false, 3.0,
    95, 15000, '{email,photo}', true, now() - INTERVAL '6 days',
    '{"source": "voice", "turns": 16, "skipped": ["factoring_rate_pct", "factoring_advance_pct"], "transcript_summary": "Owner runs 3 trucks out of Dallas, brokers pay in about 35 days, paperwork arrives by email and driver photos."}'
)
ON CONFLICT (org_id) DO NOTHING;

-- Business plan v1 generated at onboarding (numbers = the spec 4.8 table, produced by the engine)
INSERT INTO business_plans (id, org_id, version, inputs, results, projection, recommendations, health, generated_by, created_at) VALUES (
    'a3000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 1,
    '{"stage":"operating","trucks":3,"trailers":3,"drivers":3,"miles_per_truck_per_week":2500,"deadhead_pct":0.15,"rate_per_loaded_mile":2.35,"fuel_mpg":6.5,"fuel_price":3.85,"driver_pay_per_mile":0.62,"insurance_per_truck_month":1400.0,"truck_payment_per_month":2200.0,"trailer_payment_per_month":600.0,"maintenance_per_mile":0.18,"tires_per_mile":0.04,"tolls_permits_per_truck_month":350.0,"overhead_per_month":800.0,"payment_terms_days":35,"factoring_enabled":false,"factoring_rate_pct":3.0,"factoring_advance_pct":95.0,"starting_cash":15000.0}',
    '{"total_miles":32500.0,"loaded_miles":27625.0,"revenue":64918.75,"fuel":19250.0,"driver_pay":20150.0,"maintenance":7150.0,"variable":46550.0,"fixed":14450.0,"factoring_fee":0.0,"total_cost":61000.0,"profit":3918.75,"margin_pct":6.04,"operating_ratio":0.9396,"revenue_per_mile":1.9975,"cost_per_mile":1.8769,"contribution_per_mile":0.5652,"break_even_miles":25566.52,"daily_revenue":2163.96,"cash_gap_days":35.0,"working_capital_need":75738.54,"runway_months":0.2459}',
    '[{"month":1,"revenue":64918.75,"costs":61000.0,"profit":3918.75,"collections":0.0,"cash":-46000.0},{"month":2,"revenue":64918.75,"costs":61000.0,"profit":3918.75,"collections":64918.75,"cash":-42081.25},{"month":3,"revenue":64918.75,"costs":61000.0,"profit":3918.75,"collections":64918.75,"cash":-38162.5},{"month":4,"revenue":64918.75,"costs":61000.0,"profit":3918.75,"collections":64918.75,"cash":-34243.75},{"month":5,"revenue":64918.75,"costs":61000.0,"profit":3918.75,"collections":64918.75,"cash":-30325.0},{"month":6,"revenue":64918.75,"costs":61000.0,"profit":3918.75,"collections":64918.75,"cash":-26406.25},{"month":7,"revenue":64918.75,"costs":61000.0,"profit":3918.75,"collections":64918.75,"cash":-22487.5},{"month":8,"revenue":64918.75,"costs":61000.0,"profit":3918.75,"collections":64918.75,"cash":-18568.75},{"month":9,"revenue":64918.75,"costs":61000.0,"profit":3918.75,"collections":64918.75,"cash":-14650.0},{"month":10,"revenue":64918.75,"costs":61000.0,"profit":3918.75,"collections":64918.75,"cash":-10731.25},{"month":11,"revenue":64918.75,"costs":61000.0,"profit":3918.75,"collections":64918.75,"cash":-6812.5},{"month":12,"revenue":64918.75,"costs":61000.0,"profit":3918.75,"collections":64918.75,"cash":-2893.75}]',
    '[{"id":"thin_margin","title":"Margin is thin","message":"Margin is thin. Every 5 cents per mile on rate adds $1,625.00 per month.","impact_per_month":1625.0},{"id":"cash_gap","title":"Cash does not cover the payment gap","message":"Cash on hand does not cover the payment gap. Quick-pay on the slowest customers closes it.","impact_per_month":null}]',
    41, 'onboarding', now() - INTERVAL '6 days'
)
ON CONFLICT (id) DO NOTHING;

-- Default policies, acting within limits (Fleet plan)
INSERT INTO autopilot_policies (id, org_id, mode) VALUES
  ('a4000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'act')
ON CONFLICT (org_id) DO NOTHING;

-- A week of Autopilot receipts (newest first). Entity ids reference seeded loads/users from 011.
INSERT INTO autopilot_events (id, org_id, kind, summary, entity_type, entity_id, outcome, saved_minutes, payload, created_at) VALUES
  ('a5000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'invoice.sent',
   'Sent invoice for LD-2024-003 ($2,000.00) to Global Freight Solutions; packet complete, under the $5,000 auto-send limit',
   'load_record', 'e0000000-0000-0000-0000-000000000003', 'done', 12,
   '{"load_number": "LD-2024-003", "amount": 2000.00, "customer": "Global Freight Solutions", "policy": "auto_invoice_max_amount"}',
   now() - INTERVAL '2 hours'),
  ('a5000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'pod.chased',
   'Texted Dave Driver for the missing POD on LD-2024-005, 12 hours after delivery',
   'load_record', 'e0000000-0000-0000-0000-000000000005', 'done', 8,
   '{"load_number": "LD-2024-005", "driver": "Dave Driver", "attempt": 1, "policy": "pod_chase_hours"}',
   now() - INTERVAL '5 hours'),
  ('a5000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'document.linked',
   'Linked an emailed rate confirmation to LD-2024-011 (confidence 0.97)',
   'load_record', 'e0000000-0000-0000-0000-000000000011', 'done', 4,
   '{"load_number": "LD-2024-011", "doc_type": "RateConf", "confidence": 0.97, "policy": "auto_link_confidence"}',
   now() - INTERVAL '9 hours'),
  ('a5000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'compliance.alert',
   'Dave Driver''s CDL expires in 10 days. Book the renewal; we will hold his loads if it lapses.',
   'driver', 'b0000000-0000-0000-0000-000000000006', 'needs_you', 5,
   '{"artifact_type": "CDL", "days_remaining": 10, "window": 14, "policy": "compliance_alert_days"}',
   now() - INTERVAL '1 day'),
  ('a5000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'quick_pay.routed',
   'Routed invoice LD-2024-012 (Midwest Manufacturing, 45-day terms) to quick-pay; funds expected in 2 days',
   'load_record', 'e0000000-0000-0000-0000-000000000012', 'done', 15,
   '{"load_number": "LD-2024-012", "customer_terms_days": 45, "amount": 1150.00, "policy": "quick_pay_min_days"}',
   now() - INTERVAL '1 day 6 hours'),
  ('a5000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'invoice.held',
   'Held invoice for LD-2024-007: rate confirmation shows $1,700.00 but the load is billed at $1,850.00',
   'load_record', 'e0000000-0000-0000-0000-000000000007', 'needs_you', 3,
   '{"load_number": "LD-2024-007", "rate_conf_amount": 1700.00, "billed_amount": 1850.00, "reason": "amount_mismatch"}',
   now() - INTERVAL '2 days'),
  ('a5000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'document.link_review',
   'Could not match a photographed BOL to a load with confidence (best guess LD-2024-014 at 0.61). Pick the load.',
   'load_record', 'e0000000-0000-0000-0000-000000000014', 'needs_you', 2,
   '{"doc_type": "BOL", "best_guess": "LD-2024-014", "confidence": 0.61, "policy": "auto_link_confidence"}',
   now() - INTERVAL '2 days 3 hours'),
  ('a5000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'settlement.generated',
   'Generated the Friday settlement for Dave Driver: 4 loads, $2,418.60 net, sent for approval',
   'driver', 'b0000000-0000-0000-0000-000000000006', 'done', 45,
   '{"driver": "Dave Driver", "loads": 4, "net_pay": 2418.60, "policy": "settlement_day"}',
   now() - INTERVAL '3 days'),
  ('a5000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'pod.received',
   'POD for LD-2024-016 received from a driver photo; packet is complete',
   'load_record', 'e0000000-0000-0000-0000-000000000016', 'done', 6,
   '{"load_number": "LD-2024-016", "doc_type": "POD", "channel": "photo"}',
   now() - INTERVAL '3 days 5 hours'),
  ('a5000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'invoice.sent',
   'Sent invoice for LD-2024-016 ($1,550.00) to Pacific Coast Logistics',
   'load_record', 'e0000000-0000-0000-0000-000000000016', 'done', 12,
   '{"load_number": "LD-2024-016", "amount": 1550.00, "customer": "Pacific Coast Logistics", "policy": "auto_invoice_max_amount"}',
   now() - INTERVAL '3 days 4 hours'),
  ('a5000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'notification.deferred',
   'Held 2 driver reminders during quiet hours (21:00-06:00) and sent them at 06:00',
   NULL, NULL, 'skipped', 0,
   '{"held": 2, "policy": "quiet_hours"}',
   now() - INTERVAL '4 days'),
  ('a5000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'compliance.alert',
   'Trailer #201 annual inspection is due in 7 days. Confirm the shop appointment.',
   'carrier_profile', 'd0000000-0000-0000-0000-000000000001', 'needs_you', 5,
   '{"artifact_type": "AnnualInspection", "subject": "Trailer #201", "days_remaining": 7, "window": 7, "policy": "compliance_alert_days"}',
   now() - INTERVAL '5 days'),
  ('a5000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'invoice.sent',
   'Sent invoice for LD-2024-002 ($1,200.00) to Midwest Manufacturing Co',
   'load_record', 'e0000000-0000-0000-0000-000000000002', 'done', 12,
   '{"load_number": "LD-2024-002", "amount": 1200.00, "customer": "Midwest Manufacturing Co", "policy": "auto_invoice_max_amount"}',
   now() - INTERVAL '6 days'),
  ('a5000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'cash.checked',
   'Weekly cash check: 18 days of runway on hand; $3,700.00 across two invoices is due in 4 days',
   NULL, NULL, 'done', 10,
   '{"runway_days": 18, "receivables_due_4d": 3700.00}',
   now() - INTERVAL '6 days 12 hours')
ON CONFLICT (id) DO NOTHING;

COMMIT;
