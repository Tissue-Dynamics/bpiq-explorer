-- BPIQ Data Warehouse Schema
-- Designed for local storage of BiopharmIQ API data

-- Companies table (shared reference)
CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ticker)
);

CREATE INDEX idx_companies_ticker ON companies(ticker);

-- Indications table
CREATE TABLE IF NOT EXISTS indications (
    id INTEGER PRIMARY KEY,
    wix_id VARCHAR(255) UNIQUE,
    title VARCHAR(255) NOT NULL,
    nickname VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Stage events table
CREATE TABLE IF NOT EXISTS stage_events (
    id INTEGER PRIMARY KEY,
    wix_id VARCHAR(255) UNIQUE,
    label VARCHAR(255),
    stage_label VARCHAR(100),
    stage VARCHAR(50),
    event_label VARCHAR(100),
    event VARCHAR(50),
    score INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_stage_events_stage ON stage_events(stage);
CREATE INDEX idx_stage_events_score ON stage_events(score);

-- Drugs table (main pipeline data)
CREATE TABLE IF NOT EXISTS drugs (
    id INTEGER PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    stage_event_id INTEGER REFERENCES stage_events(id),
    wix_id VARCHAR(255) UNIQUE,
    drug_name VARCHAR(500) NOT NULL,
    ticker VARCHAR(10),
    is_big_mover BOOLEAN DEFAULT FALSE,
    is_suspected_mover BOOLEAN DEFAULT FALSE,
    mechanism_of_action TEXT,
    note TEXT,
    catalyst_date DATE,
    catalyst_date_text VARCHAR(100),
    indications_text TEXT,
    has_catalyst BOOLEAN DEFAULT FALSE,
    catalyst_source TEXT,
    market TEXT,
    last_name_updated TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    -- Data tracking
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_drugs_ticker ON drugs(ticker);
CREATE INDEX idx_drugs_catalyst_date ON drugs(catalyst_date);
CREATE INDEX idx_drugs_big_mover ON drugs(is_big_mover) WHERE is_big_mover = TRUE;
CREATE INDEX idx_drugs_suspected_mover ON drugs(is_suspected_mover) WHERE is_suspected_mover = TRUE;
CREATE INDEX idx_drugs_has_catalyst ON drugs(has_catalyst) WHERE has_catalyst = TRUE;
CREATE INDEX idx_drugs_company_id ON drugs(company_id);

-- Drug-Indication junction table (many-to-many)
CREATE TABLE IF NOT EXISTS drug_indications (
    drug_id INTEGER REFERENCES drugs(id) ON DELETE CASCADE,
    indication_id INTEGER REFERENCES indications(id) ON DELETE CASCADE,
    PRIMARY KEY (drug_id, indication_id)
);

-- Historical catalysts table (premium API data)
CREATE TABLE IF NOT EXISTS historical_catalysts (
    id INTEGER PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    ticker VARCHAR(10),
    drug_name VARCHAR(500),
    drug_indication VARCHAR(500),
    stage VARCHAR(100),
    catalyst_date DATE NOT NULL,
    catalyst_source TEXT,
    catalyst_text TEXT,
    -- Data tracking
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_historical_catalysts_ticker ON historical_catalysts(ticker);
CREATE INDEX idx_historical_catalysts_date ON historical_catalysts(catalyst_date);
CREATE INDEX idx_historical_catalysts_stage ON historical_catalysts(stage);
CREATE INDEX idx_historical_catalysts_year ON historical_catalysts(EXTRACT(YEAR FROM catalyst_date));

-- Scrape metadata table (track sync history)
CREATE TABLE IF NOT EXISTS scrape_history (
    id SERIAL PRIMARY KEY,
    scrape_type VARCHAR(50) NOT NULL, -- 'drugs' or 'historical_catalysts'
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    records_fetched INTEGER,
    pages_processed INTEGER,
    errors TEXT[],
    status VARCHAR(20) DEFAULT 'running', -- 'running', 'completed', 'failed'
    metadata JSONB
);

-- Analytics views
CREATE OR REPLACE VIEW catalyst_events_by_year AS
SELECT 
    EXTRACT(YEAR FROM catalyst_date) as year,
    COUNT(*) as event_count,
    COUNT(DISTINCT ticker) as unique_companies,
    COUNT(DISTINCT drug_name) as unique_drugs
FROM historical_catalysts
WHERE catalyst_date IS NOT NULL
GROUP BY EXTRACT(YEAR FROM catalyst_date)
ORDER BY year DESC;

CREATE OR REPLACE VIEW active_pipeline_summary AS
SELECT 
    s.stage_label,
    COUNT(DISTINCT d.id) as drug_count,
    COUNT(DISTINCT d.company_id) as company_count,
    COUNT(CASE WHEN d.is_big_mover THEN 1 END) as big_movers,
    COUNT(CASE WHEN d.has_catalyst THEN 1 END) as with_catalyst
FROM drugs d
JOIN stage_events s ON d.stage_event_id = s.id
GROUP BY s.stage_label
ORDER BY s.score DESC;

CREATE OR REPLACE VIEW upcoming_catalysts AS
SELECT 
    d.drug_name,
    c.name as company_name,
    c.ticker,
    d.catalyst_date,
    d.catalyst_date_text,
    d.indications_text,
    s.stage_label,
    d.is_big_mover,
    d.is_suspected_mover
FROM drugs d
JOIN companies c ON d.company_id = c.id
JOIN stage_events s ON d.stage_event_id = s.id
WHERE d.has_catalyst = TRUE
  AND d.catalyst_date >= CURRENT_DATE
ORDER BY d.catalyst_date ASC;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drugs_updated_at BEFORE UPDATE ON drugs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Stats function
CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS TABLE (
    metric VARCHAR(100),
    value BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'Total Drugs'::VARCHAR(100), COUNT(*)::BIGINT FROM drugs
    UNION ALL
    SELECT 'Total Companies'::VARCHAR(100), COUNT(*)::BIGINT FROM companies
    UNION ALL
    SELECT 'Total Historical Events'::VARCHAR(100), COUNT(*)::BIGINT FROM historical_catalysts
    UNION ALL
    SELECT 'Big Mover Events'::VARCHAR(100), COUNT(*)::BIGINT FROM drugs WHERE is_big_mover = TRUE
    UNION ALL
    SELECT 'Upcoming Catalysts'::VARCHAR(100), COUNT(*)::BIGINT FROM drugs WHERE has_catalyst = TRUE AND catalyst_date >= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;