export type NewsEdition = 'ASIA_OPEN' | 'MORNING_EUROPE' | 'US_OPEN' | 'MARKET_CLOSE';

export type NewsCategory = 
  | 'MACRO' 
  | 'CENTRAL_BANK' 
  | 'ECONOMIC_DATA' 
  | 'EARNINGS' 
  | 'EQUITY' 
  | 'M&A' 
  | 'REGULATION' 
  | 'GEOPOLITICS' 
  | 'COMMODITIES';

export type NewsSentiment = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type NewsImpact = 'LOW' | 'MEDIUM' | 'HIGH';
export type NewsUrgency = 'ROUTINE' | 'IMPORTANT' | 'BREAKING';
export type NewsConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface SupportingSource {
  name: string;
  url: string;
  tier?: number;
}

export interface MarketNewsItem {
  id?: string;
  event_id: string;
  edition: NewsEdition;
  ticker: string | null;
  company: string | null;
  category: NewsCategory;
  headline: string;
  summary: string;
  fact: string;
  market_reaction?: string | null;
  analyst_interpretation?: string | null;
  sentiment: NewsSentiment;
  impact: NewsImpact;
  impact_score: number;
  urgency: NewsUrgency;
  published_at: string;
  discovered_at?: string;
  edition_at: string;
  source_name: string;
  source_url: string;
  supporting_sources?: SupportingSource[];
  confidence: NewsConfidence;
}

export interface NewsAgentStatus {
  model: string;
  thinkingLevel: string;
  temperature: number;
  timezone: string;
  currentEdition: NewsEdition;
  nextScheduledTime: string;
  nextEdition: NewsEdition;
  activeAlertTickers: string[];
  totalNewsItems: number;
  postgresConnected: boolean;
}
