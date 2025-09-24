-- Analytics and Reporting Schema
-- Version: 0.1.2
-- Created: 2024-12-23

-- Carbon footprint tracking
CREATE TABLE carbon_footprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
    distance_miles DECIMAL(10,2),
    fuel_consumed_gallons DECIMAL(10,2),
    co2_emissions_lbs DECIMAL(10,2),
    equipment_type VARCHAR(50),
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance metrics
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carrier_id UUID REFERENCES carriers(id) ON DELETE CASCADE,
    shipper_id UUID REFERENCES shippers(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL, -- on_time_rate, damage_rate, etc.
    value DECIMAL(10,4) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market rates for analytics
CREATE TABLE market_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    origin_city VARCHAR(100) NOT NULL,
    origin_state VARCHAR(50) NOT NULL,
    destination_city VARCHAR(100) NOT NULL,
    destination_state VARCHAR(50) NOT NULL,
    equipment_code VARCHAR(10) REFERENCES equipment_types(code),
    rate_per_mile DECIMAL(8,4),
    fuel_surcharge DECIMAL(6,3),
    sample_size INTEGER,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lane analytics
CREATE TABLE lane_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    origin_city VARCHAR(100) NOT NULL,
    origin_state VARCHAR(50) NOT NULL,
    destination_city VARCHAR(100) NOT NULL,
    destination_state VARCHAR(50) NOT NULL,
    equipment_code VARCHAR(10) REFERENCES equipment_types(code),
    total_loads INTEGER DEFAULT 0,
    total_revenue DECIMAL(15,2) DEFAULT 0,
    avg_rate_per_mile DECIMAL(8,4),
    on_time_percentage DECIMAL(5,2),
    damage_rate DECIMAL(5,2),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Carrier performance scores
CREATE TABLE carrier_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carrier_id UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
    score_type VARCHAR(50) NOT NULL, -- trust, performance, reliability
    score DECIMAL(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
    factors JSONB, -- Detailed breakdown of score factors
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ
);

-- Create indexes for analytics
CREATE INDEX idx_carbon_footprints_load_id ON carbon_footprints(load_id);
CREATE INDEX idx_carbon_footprints_calculated_at ON carbon_footprints(calculated_at);

CREATE INDEX idx_performance_metrics_carrier_id ON performance_metrics(carrier_id);
CREATE INDEX idx_performance_metrics_shipper_id ON performance_metrics(shipper_id);
CREATE INDEX idx_performance_metrics_metric_type ON performance_metrics(metric_type);
CREATE INDEX idx_performance_metrics_period ON performance_metrics(period_start, period_end);

CREATE INDEX idx_market_rates_lane ON market_rates(origin_city, origin_state, destination_city, destination_state);
CREATE INDEX idx_market_rates_equipment ON market_rates(equipment_code);
CREATE INDEX idx_market_rates_period ON market_rates(period_start, period_end);

CREATE INDEX idx_lane_analytics_lane ON lane_analytics(origin_city, origin_state, destination_city, destination_state);
CREATE INDEX idx_lane_analytics_equipment ON lane_analytics(equipment_code);
CREATE INDEX idx_lane_analytics_period ON lane_analytics(period_start, period_end);

CREATE INDEX idx_carrier_scores_carrier_id ON carrier_scores(carrier_id);
CREATE INDEX idx_carrier_scores_score_type ON carrier_scores(score_type);
CREATE INDEX idx_carrier_scores_calculated_at ON carrier_scores(calculated_at);

-- Function to calculate carbon footprint
CREATE OR REPLACE FUNCTION calculate_carbon_footprint(
    p_load_id UUID,
    p_distance_miles DECIMAL,
    p_equipment_type VARCHAR DEFAULT 'dry_van'
)
RETURNS DECIMAL AS $$
DECLARE
    co2_per_mile DECIMAL := 0;
    result DECIMAL;
BEGIN
    -- CO2 emissions per mile by equipment type (lbs CO2 per mile)
    CASE p_equipment_type
        WHEN 'dry_van' THEN co2_per_mile := 0.85;
        WHEN 'reefer' THEN co2_per_mile := 1.15;
        WHEN 'flatbed' THEN co2_per_mile := 0.90;
        WHEN 'tanker' THEN co2_per_mile := 0.95;
        ELSE co2_per_mile := 0.85;
    END CASE;
    
    result := p_distance_miles * co2_per_mile;
    
    -- Insert the calculation
    INSERT INTO carbon_footprints (load_id, distance_miles, co2_emissions_lbs, equipment_type)
    VALUES (p_load_id, p_distance_miles, result, p_equipment_type);
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update carrier trust score
CREATE OR REPLACE FUNCTION update_carrier_trust_score(p_carrier_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    on_time_rate DECIMAL;
    damage_rate DECIMAL;
    payment_history DECIMAL;
    trust_score DECIMAL;
BEGIN
    -- Calculate on-time rate (last 30 days)
    SELECT COALESCE(
        (COUNT(*) FILTER (WHERE status = 'delivered' AND updated_at <= delivery_latest)::DECIMAL / 
         NULLIF(COUNT(*) FILTER (WHERE status = 'delivered'), 0)) * 100, 
        0
    ) INTO on_time_rate
    FROM loads l
    JOIN awards a ON l.id = a.load_id
    WHERE a.carrier_id = p_carrier_id
    AND l.updated_at >= NOW() - INTERVAL '30 days';
    
    -- Calculate damage rate (last 30 days)
    SELECT COALESCE(
        (COUNT(*) FILTER (WHERE exception_type = 'damage')::DECIMAL / 
         NULLIF(COUNT(*), 0)) * 100, 
        0
    ) INTO damage_rate
    FROM exceptions e
    JOIN loads l ON e.load_id = l.id
    JOIN awards a ON l.id = a.load_id
    WHERE a.carrier_id = p_carrier_id
    AND e.created_at >= NOW() - INTERVAL '30 days';
    
    -- Calculate payment history score
    SELECT COALESCE(
        (COUNT(*) FILTER (WHERE status = 'paid')::DECIMAL / 
         NULLIF(COUNT(*), 0)) * 100, 
        0
    ) INTO payment_history
    FROM invoices i
    WHERE i.carrier_id = p_carrier_id
    AND i.created_at >= NOW() - INTERVAL '30 days';
    
    -- Calculate weighted trust score
    trust_score := (on_time_rate * 0.4) + ((100 - damage_rate) * 0.3) + (payment_history * 0.3);
    
    -- Update carrier trust score
    UPDATE carriers 
    SET trust_score = trust_score,
        updated_at = NOW()
    WHERE id = p_carrier_id;
    
    -- Insert score record
    INSERT INTO carrier_scores (carrier_id, score_type, score, factors)
    VALUES (p_carrier_id, 'trust', trust_score, jsonb_build_object(
        'on_time_rate', on_time_rate,
        'damage_rate', damage_rate,
        'payment_history', payment_history
    ));
    
    RETURN trust_score;
END;
$$ LANGUAGE plpgsql;
