export type ResearchEventStatus = 'NEW' | 'RESEARCHING' | 'ACTIVE' | 'COOLED_DOWN' | 'CLOSED';

export type ResearchReportStatus = 'COMPLETED' | 'FAILED' | 'PARTIAL';

export type ResearchStatus = 
  | ResearchEventStatus 
  | ResearchReportStatus
  | 'COMPLETED'
  | 'PARTIAL'
  | 'FAILED';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type ResearchConfidence = ConfidenceLevel;

export type SourceCategory = 
  | 'PRIMARY_OFFICIAL' 
  | 'PRIMARY' 
  | 'FINANCIAL_NEWS' 
  | 'REAL_TIME_SIGNAL' 
  | 'SPECIALIST' 
  | string;

export type ResearchSourceCategory = SourceCategory;

export interface ResearchSource {
  title: string;
  url: string;
  publisher: string;
  sourceCategory?: SourceCategory;
  category?: SourceCategory;
  relevance?: string;
  accessedAt?: string;
  accessed_at?: string;
}

export interface CatalystBreakdown {
  facts: string[];
  claims: string[];
  inference: string[];
  summary?: string;
}

// Institutional visual and macro-data enrichment. The snake_case aliases are
// retained for reports written by older API/database serializers.
export type MacroChartType = 'BAR' | 'LINE' | 'BREAKDOWN' | 'YIELD_CURVE';

export interface MacroChartDatapoint {
  label: string;
  value: number;
  benchmark?: number;
  highlight?: boolean;
  benchmark_value?: number;
  is_highlighted?: boolean;
}

export interface MacroChartPayload {
  chartType: MacroChartType;
  chart_type?: MacroChartType;
  title: string;
  subtitle?: string;
  unit: string;
  source: string;
  sourceUrl?: string;
  source_url?: string;
  data: MacroChartDatapoint[];
  data_points?: MacroChartDatapoint[];
}

export interface TransmissionNode {
  step: number;
  label: string;
  type: 'CATALYST' | 'TRANSMISSION' | 'FINANCIAL_IMPACT' | 'SECTOR_EFFECT';
  detail?: string;
  step_number?: number;
}

export interface EditorialHeroPayload {
  imageUrl: string;
  photographerCredit: string;
  locationLabel: string;
  source?: string;
  license?: string;
  sourceUrl?: string;
  alt?: string;
  image_url?: string;
  photographer_credit?: string;
  location_label?: string;
  source_url?: string;
}

export interface VisualEnrichmentPayload {
  hero: EditorialHeroPayload;
  marketCapImpactUsdBillions?: number;
  market_cap_impact_usd_billions?: number;
  macroChart?: MacroChartPayload;
  macro_chart?: MacroChartPayload;
  transmissionSteps?: TransmissionNode[];
  transmission_steps?: TransmissionNode[];
  enrichedAt: string;
  enriched_at?: string;
}

export interface VisualBrief {
  primaryTheme: string;
  suggestedChartTitle: string;
  dataSearchQuery: string;
  unit: string;
  chartType: MacroChartType;
  editorialScene: 'WALL_STREET' | 'SEMICONDUCTOR_CLEANROOM' | 'ENERGY_TERMINAL' | 'AEROSPACE_HANGAR' | 'CENTRAL_BANK';
  transmissionSummary: string[];
}

export interface ResearchReport {
  id: string;
  eventId?: string;
  event_id?: string;
  ticker: string;
  assetName?: string;
  asset?: string;
  asset_name?: string;
  assetClass?: string;
  asset_class?: string;
  changePercent?: number;
  change_percent?: number;
  /** Only populated when supplied by a verified upstream market-data record. */
  marketCapUsdBillions?: number;
  market_cap_usd_billions?: number;
  period?: string;
  movement_period?: string;
  triggerTimestamp?: string;
  trigger_timestamp?: string;
  executiveSummary?: string;
  executive_summary?: string;
  immediateCatalyst?: string | CatalystBreakdown;
  immediate_catalyst?: string | CatalystBreakdown;
  directMarketImpact?: string;
  direct_market_impact?: string;
  broaderContext?: string;
  broader_context?: string;
  whatMarketIsReactingTo?: string;
  what_market_is_reacting_to?: string;
  market_reaction?: string;
  whatToWatchNext?: string;
  what_to_watch_next?: string;
  confidence: ConfidenceLevel;
  confidenceExplanation?: string;
  confidence_explanation?: string;
  sources: ResearchSource[];
  rawMarkdown?: string;
  raw_markdown?: string;
  status: ResearchStatus;
  visualPayload?: VisualEnrichmentPayload;
  visual_payload?: VisualEnrichmentPayload;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
}

export interface ResearchEvent {
  id: string;
  ticker: string;
  assetName?: string;
  asset_name?: string;
  assetClass?: string;
  asset_class?: string;
  changePercent?: number;
  change_percent?: number;
  /** Optional verified market-cap input; never inferred from ticker identity. */
  marketCapUsdBillions?: number;
  market_cap_usd_billions?: number;
  currentPrice?: number;
  current_price?: number;
  /** Price/percent captured at the trigger, never overwritten by later scans. */
  triggerPrice?: number;
  triggerChangePercent?: number;
  marketSymbol?: string;
  /** Exchange regular-session close, not the report creation price. */
  sessionClosePrice?: number;
  sessionCloseChangePercent?: number;
  sessionClosedAt?: string;
  sessionCloseSource?: string;
  /** Ephemeral verification from the quote provider; UNKNOWN is never shown as live. */
  sessionState?: 'LIVE' | 'CLOSED' | 'UNKNOWN';
  previousClose?: number;
  previous_close?: number;
  period?: string;
  triggeredAt?: string;
  timestamp?: string;
  status: ResearchStatus;
  fingerprint?: string;
  reportId?: string;
  report_id?: string;
  catalystSummary?: string;
  trigger_threshold?: number;
  trigger_reason?: string;
  lastCheckedAt?: string;
  cooldownUntil?: string;
  createdAt?: string;
  created_at?: string;
}

export interface CategoryThreshold {
  key: string;
  label: string;
  thresholdPct: number;
  description: string;
}

export interface AssetResearchConfig {
  symbol: string;
  name: string;
  assetClass: string;
  categoryKey: string;
  enabled: boolean;
  customThresholdPct?: number;
}

export interface ResearchConfig {
  schedulerIntervalMin?: number;
  categories?: Record<string, CategoryThreshold>;
  assets?: Record<string, AssetResearchConfig>;
  dedupWindowHours?: number;
  // Aliases for frontend/compatibility
  scheduler_interval_minutes?: number;
  is_scheduler_active?: boolean;
  asset_classes?: Record<string, boolean>;
  securities?: Record<string, boolean>;
  thresholds?: Record<string, number>;
  updated_at?: string;
}

export interface ResearchDashboardStats {
  totalEvents: number;
  totalReports: number;
  activeCount: number;
  monitoredAssetsCount: number;
  lastRunAt?: string | null;
}

export interface ResearchDashboardData {
  activeEvents?: ResearchEvent[];
  recentReports?: ResearchReport[];
  recentEvents?: ResearchEvent[];
  stats?: ResearchDashboardStats;
  config?: ResearchConfig;
  // Compatibility aliases
  kpi?: {
    active_research_count: number;
    completed_reports_count: number;
    triggered_events_count: number;
    monitored_assets_count: number;
  };
  active_research?: ResearchEvent[];
  recent_reports?: ResearchReport[];
  recent_events?: ResearchEvent[];
}
