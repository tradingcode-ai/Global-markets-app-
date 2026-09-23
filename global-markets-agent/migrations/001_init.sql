-- PostgreSQL Migration: Market News & Dynamic User Alerts
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabel voor gebruikersmeldingen (Alerts / Watchlist met notificaties aan)
CREATE TABLE IF NOT EXISTS user_stock_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    ticker VARCHAR(20) NOT NULL,
    company_name VARCHAR(150),
    notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, ticker)
);

CREATE INDEX IF NOT EXISTS idx_user_stock_alerts_active 
ON user_stock_alerts (UPPER(ticker)) 
WHERE notifications_enabled = TRUE;

-- 2. Hoofdtabel voor autonoom gegenereerd marktnieuws (Append-Only)
CREATE TABLE IF NOT EXISTS market_news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(64) NOT NULL,
    edition VARCHAR(20) NOT NULL CHECK (edition IN ('MORNING_EUROPE', 'US_OPEN', 'MARKET_CLOSE')),
    ticker VARCHAR(20),
    company VARCHAR(150),
    category VARCHAR(30) NOT NULL CHECK (category IN (
        'MACRO', 'CENTRAL_BANK', 'ECONOMIC_DATA', 
        'EARNINGS', 'EQUITY', 'M&A', 'REGULATION', 
        'GEOPOLITICS', 'COMMODITIES'
    )),
    headline TEXT NOT NULL,
    summary TEXT NOT NULL,
    fact TEXT NOT NULL,
    market_reaction TEXT,
    analyst_interpretation TEXT,
    sentiment VARCHAR(10) NOT NULL CHECK (sentiment IN ('BULLISH', 'BEARISH', 'NEUTRAL')),
    impact VARCHAR(10) NOT NULL CHECK (impact IN ('LOW', 'MEDIUM', 'HIGH')),
    impact_score SMALLINT NOT NULL CHECK (impact_score BETWEEN 0 AND 100),
    urgency VARCHAR(15) NOT NULL CHECK (urgency IN ('ROUTINE', 'IMPORTANT', 'BREAKING')),
    published_at TIMESTAMPTZ NOT NULL,
    discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    edition_at TIMESTAMPTZ NOT NULL,
    source_name VARCHAR(150) NOT NULL,
    source_url TEXT NOT NULL,
    supporting_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
    confidence VARCHAR(10) NOT NULL CHECK (confidence IN ('LOW', 'MEDIUM', 'HIGH')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optimalisatie-indices voor query's en frontend filters
CREATE INDEX IF NOT EXISTS idx_market_news_timeline ON market_news (edition_at DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_news_ticker ON market_news (ticker) WHERE ticker IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_market_news_category ON market_news (category);
CREATE INDEX IF NOT EXISTS idx_market_news_sentiment ON market_news (sentiment);
CREATE INDEX IF NOT EXISTS idx_market_news_event_dedupe ON market_news (event_id, edition_at);

-- Seed wat testdata voor user alerts
INSERT INTO user_stock_alerts (user_id, ticker, company_name, notifications_enabled)
VALUES 
    (uuid_generate_v4(), 'ASML', 'ASML Holding', TRUE),
    (uuid_generate_v4(), 'NVDA', 'NVIDIA Corporation', TRUE),
    (uuid_generate_v4(), 'MSFT', 'Microsoft', TRUE),
    (uuid_generate_v4(), 'TSM', 'TSMC', TRUE)
ON CONFLICT DO NOTHING;
