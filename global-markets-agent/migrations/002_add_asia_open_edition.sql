-- Add the dedicated Asia Open edition without rewriting existing news.
ALTER TABLE market_news
  DROP CONSTRAINT IF EXISTS market_news_edition_check;

ALTER TABLE market_news
  ADD CONSTRAINT market_news_edition_check
  CHECK (edition IN ('ASIA_OPEN', 'MORNING_EUROPE', 'US_OPEN', 'MARKET_CLOSE'));
