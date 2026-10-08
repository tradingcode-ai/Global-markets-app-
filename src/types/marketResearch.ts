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

// ============================================================================
// Sell-Side Editorial & Writing Architecture Types
// ============================================================================

export type ResearchCertainty =
  | 'CONFIRMED'
  | 'REPORTED'
  | 'CLAIMED'
  | 'INFERRED'
  | 'UNKNOWN';

export type EventNoteSectionPurpose =
  | 'bottom_line'
  | 'key_debate'
  | 'what_drove_the_move'
  | 'why_it_matters'
  | 'transmission'
  | 'financial_impact'
  | 'forward_view'
  | 'catalysts_and_risks'
  | 'view_invalidators';

export interface ResearchClaim {
  id: string;
  text: string;
  certainty: ResearchCertainty;
  sourceIds: string[];
  sectionPurpose: EventNoteSectionPurpose;
  interpretation?: string;
  implication?: string;
}

export interface Catalyst {
  text: string;
  timing?: string;
  sourceIds?: string[];
}

export interface Risk {
  text: string;
  sourceIds?: string[];
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

// ============================================================================
// AntiGravity Visual & Data Agent (v1.0) Types & Specifications
// ============================================================================

export type VisualPurpose =
  | 'trend'
  | 'comparison'
  | 'composition'
  | 'relationship'
  | 'process'
  | 'ecosystem'
  | 'market_structure'
  | 'valuation'
  | 'forecast'
  | 'timeline';

export type ResearchVisualType =
  | 'line_chart'
  | 'bar_chart'
  | 'stacked_bar'
  | 'area_chart'
  | 'scatter'
  | 'waterfall'
  | 'bridge'
  | 'pie'
  | 'process_diagram'
  | 'ecosystem_diagram'
  | 'value_chain'
  | 'flow'
  | 'timeline'
  | 'matrix'
  | 'table'
  | 'exhibit'
  | 'infographic';

export type ExtractionStatus =
  | 'EXACT'
  | 'PARTIAL'
  | 'VISUAL_ONLY'
  | 'FAILED';

export type ProvenanceStatus =
  | 'EXPLICIT_SOURCE'
  | 'ATTRIBUTED_SOURCE'
  | 'UNKNOWN_SOURCE';

export type ImageElement =
  | 'company'
  | 'product_technology'
  | 'operations'
  | 'industry_context';

export type ImageSelectionMode =
  | 'best_match'
  | 'priority'
  | 'all';

export type AssetType =
  | 'image'
  | 'chart'
  | 'diagram'
  | 'table'
  | 'research_exhibit';

export type DiscoveryChannel =
  | 'existing_research_document'
  | 'official_research'
  | 'financial_media'
  | 'specialist_finance'
  | 'social'
  | 'primary_source'
  | 'structured_data';

export type SourceTier =
  | 'investment_bank'
  | 'consulting'
  | 'primary_source'
  | 'structured_data'
  | 'other';

export interface VisualIntent {
  claimId: string;
  purpose: VisualPurpose;
  preferredTypes: ResearchVisualType[];
  sourcePreference: 'research_desk' | 'primary_source' | 'any';
  maxVisuals: number;
}

export interface ImageRequirements {
  maxAgeDays?: number;
  minWidth?: number;
  minHeight?: number;
  aspectRatio?: string;
  sourceRequirement: 'none' | 'identify' | 'verified';
  attributionRequirement: 'none' | 'required';
  freshnessRequirement: 'none' | 'recent' | 'current';
  allowedTypes?: Array<
    'photo' |
    'illustration' |
    'screenshot' |
    'product' |
    'factory' |
    'logo'
  >;
}

export interface ImageSlotPolicy {
  slot: string;
  allowedElements: ImageElement[];
  maxImages: number;
  selectionMode: ImageSelectionMode;
  requirements: ImageRequirements;
}

export interface RetrievalPolicy {
  maxCount: number;
  maxSearches: number;
  stopWhenSatisfied: boolean;
  minQualityScore: number;
}

export interface ResearchVisualCandidate {
  id: string;
  claimId?: string;
  publisher?: string;
  researchDivision?: string;
  documentTitle?: string;
  documentDate?: string;
  page?: number;
  type: ResearchVisualType;
  title?: string;
  sourceUrl: string;
  sourceDocumentUrl?: string;
  imageUrl?: string;
  screenshotUrl?: string;
  discoverySource?: string;
  visualSource?: string;
  sourceAttributionVisible: boolean;
  sourceText?: string;
  provenanceStatus: ProvenanceStatus;
  extractionStatus: ExtractionStatus;
  technicallyUsable: boolean;
  relevant: boolean;
  quality: number;
  extractedData?: Array<{
    label: string;
    value: number;
    benchmark?: number;
  }>;
}

export interface ReportAsset {
  id: string;
  type: AssetType;
  purpose: string;
  source: {
    publisher?: string;
    researchDivision?: string;
    url: string;
    title?: string;
    publishedAt?: string;
  };
  attribution?: {
    text?: string;
    visible: boolean;
  };
  asset: {
    url?: string;
    screenshotUrl?: string;
    width?: number;
    height?: number;
  };
  provenance: {
    discoverySource?: string;
    visualSource?: string;
    retrievedAt: string;
    status: ProvenanceStatus;
  };
  extractionStatus?: ExtractionStatus;
  selection: {
    score?: number;
    reason: string;
  };
}

export interface ResearchDocumentIndex {
  metadata: {
    publisher?: string;
    researchDivision?: string;
    title?: string;
    documentDate?: string;
    sourceUrl?: string;
  };
  pages: Array<{
    page: number;
    text?: string;
    hasImages?: boolean;
    hasTables?: boolean;
  }>;
  claims: string[];
  charts: ResearchVisualCandidate[];
  diagrams: ResearchVisualCandidate[];
  tables: ResearchVisualCandidate[];
  extractedData: ResearchVisualCandidate['extractedData'];
}

export interface VisualDataAgentConfig {
  sourcePriority: {
    investmentBanks: string[];
    consulting: string[];
    primaryAndStructured: string[];
  };
  discoveryChannels: DiscoveryChannel[];
  retrieval: RetrievalPolicy;
  imagePolicies: Record<string, ImageSlotPolicy>;
  integrity: {
    forbidSyntheticFinancialData: boolean;
    forbidRandomFallbackData: boolean;
    requireExactSourceAttribution: boolean;
    requireDocumentInspectionBeforeChartClaim: boolean;
    allowOriginalVisualWhenDataNotExtractable: boolean;
  };
}

export interface ImageContext {
  section: string;
  subject: string;
  entities: string[];
  keywords?: string[];
  themes?: string[];
  claims?: string[];
}

export interface ImageIntent {
  section: string;
  subject: string;
  entities: string[];
  imageIntent: ImageElement;
  preferredElements: string[];
  maxImages: number;
  requirements: ImageRequirements;
}

export interface ImageCandidate {
  id: string;
  element: ImageElement;
  type: 'photo' | 'illustration' | 'screenshot' | 'product' | 'factory' | 'logo';
  url: string;
  sourceUrl: string;
  publisher?: string;
  title?: string;
  publishedAt?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  sourceIdentified: boolean;
  attributionAvailable: boolean;
  relevant: boolean;
  technicallyUsable: boolean;
  quality: number;
  relevanceScore: number;
  freshnessScore?: number;
}

export interface ImageSelectionDecision {
  selectedElements: ImageElement[];
  reason: string;
}

export type ImageWorkflowStage =
  | 'ANALYZE_REPORT_CONTEXT'
  | 'RESOLVE_IMAGE_SLOT'
  | 'SELECT_IMAGE_ELEMENT'
  | 'BUILD_IMAGE_QUERY'
  | 'DISCOVER_IMAGES'
  | 'TECHNICAL_FILTER'
  | 'RELEVANCE_FILTER'
  | 'SOURCE_AND_ATTRIBUTION'
  | 'RANK_CANDIDATES'
  | 'SELECT_IMAGE'
  | 'REGISTER_ASSET'
  | 'COMPLETE';

export interface ImageWorkflowDecision {
  stage: ImageWorkflowStage;
  continueRetrieval: boolean;
  selectedCandidate?: ImageCandidate;
  reason: string;
}

export type ChartWorkflowStage =
  | 'ANALYZE_CLAIM'
  | 'CREATE_VISUAL_INTENT'
  | 'CHECK_EXISTING_RESEARCH_DOCUMENTS'
  | 'INSPECT_DOCUMENT_CONTENT'
  | 'SEARCH_OFFICIAL_RESEARCH'
  | 'SEARCH_FINANCIAL_MEDIA'
  | 'SEARCH_SPECIALIST_FINANCE'
  | 'SEARCH_SOCIAL'
  | 'SEARCH_PRIMARY_OR_STRUCTURED_DATA'
  | 'VALIDATE_CANDIDATE'
  | 'CLASSIFY_EXTRACTION'
  | 'SELECT_RENDER_MODE'
  | 'REGISTER_ASSET'
  | 'COMPLETE';

export type ChartRenderMode =
  | 'DERIVED_CHART'
  | 'ORIGINAL_RESEARCH_VISUAL'
  | 'NO_VISUAL';

export interface ChartWorkflowRequest {
  claimId: string;
  claimText: string;
  reportSection?: string;
  entities: string[];
  keywords?: string[];
  intent: VisualIntent;
  maxAgeDays?: number;
  retrievalPolicy?: RetrievalPolicy;
}

export interface ChartWorkflowDecision {
  stage: ChartWorkflowStage;
  continueRetrieval: boolean;
  selectedCandidate?: ResearchVisualCandidate;
  renderMode?: ChartRenderMode;
  reason: string;
}

export interface ChartSearchPlan {
  claimId: string;
  purpose: VisualPurpose;
  requestedTypes: ResearchVisualType[];
  sourcePriority: SourceTier[];
  discoveryOrder: readonly DiscoveryChannel[];
  maxAgeDays?: number;
  retrievalPolicy: RetrievalPolicy;
}

export type ReportType = 'SELL_SIDE_EVENT_NOTE';

export type ReportSectionPurpose =
  | 'bottom_line'
  | 'key_debate'
  | 'what_drove_the_move'
  | 'why_it_matters'
  | 'evidence'
  | 'transmission'
  | 'financial_impact'
  | 'forward_view'
  | 'catalysts_and_risks'
  | 'view_invalidators'
  | 'sources_and_methodology';

export type ReportBlockType =
  | 'narrative'
  | 'key_takeaway'
  | 'chart'
  | 'research_exhibit'
  | 'image'
  | 'kpi'
  | 'table'
  | 'transmission'
  | 'scenario'
  | 'risk';

export type ReportLayoutPattern =
  | 'FIRST_PAGE_SELL_SIDE'
  | 'TEXT_CHART_SPLIT'
  | 'FULL_WIDTH_EVIDENCE'
  | 'KPI_TABLE'
  | 'CAUSAL_FLOW'
  | 'CATALYST_RISK_SPLIT'
  | 'TEXT_ONLY';

export interface ReportCompositionInput {
  reportId: string;
  ticker?: string;
  assetName: string;
  eventDate: string;
  headline: string;
  bottomLine: string;
  keyDebate: string;
  keyTakeaways: string[];
  claims: Array<{
    id: string;
    text: string;
    sectionPurpose: ReportSectionPurpose;
  }>;
  assets: ReportAsset[];
}

export interface ReportLayoutBlock {
  type: ReportBlockType;
  claimId?: string;
  assetId?: string;
  message?: string;
  placement?: 'inline' | 'full_width' | 'side_by_side';
}

export interface ReportLayoutSection {
  id: string;
  purpose: ReportSectionPurpose;
  headline: string;
  keyMessage: string;
  pattern: ReportLayoutPattern;
  blocks: ReportLayoutBlock[];
}

export interface ReportLayoutPlan {
  reportType: ReportType;
  firstPage: {
    headline: string;
    bottomLine: string;
    keyDebate: string;
    keyTakeaways: string[];
    leadImageAssetId?: string;
    primaryEvidenceAssetId?: string;
  };
  sections: ReportLayoutSection[];
}

export interface VisualEnrichmentPayload {
  hero: EditorialHeroPayload;
  marketCapImpactUsdBillions?: number;
  market_cap_impact_usd_billions?: number;
  macroChart?: MacroChartPayload;
  macro_chart?: MacroChartPayload;
  transmissionSteps?: TransmissionNode[];
  transmission_steps?: TransmissionNode[];
  layoutPlan?: ReportLayoutPlan;
  assetRegistry?: ReportAsset[];
  researchVisuals?: ResearchVisualCandidate[];
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
  visualStatus?: 'COMPLETE' | 'HERO_FALLBACK' | 'FAILED';
  visual_status?: 'COMPLETE' | 'HERO_FALLBACK' | 'FAILED';
  layoutPlan?: ReportLayoutPlan;
  layout_plan?: ReportLayoutPlan;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;

  // Sell-Side Editorial & Writing Architecture fields
  headline?: string;
  bottomLine?: string;
  bottom_line?: string;
  keyDebate?: string;
  key_debate?: string;
  keyTakeaways?: string[];
  key_takeaways?: string[];
  catalysts?: Catalyst[];
  risks?: Risk[];
  whatWouldChangeOurView?: string[];
  claims?: ResearchClaim[];
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
