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

export const ANTI_GRAVITY_VISUAL_DATA_AGENT_CONFIG: VisualDataAgentConfig = {
  sourcePriority: {
    investmentBanks: [
      'Goldman Sachs',
      'J.P. Morgan',
      'Morgan Stanley',
      'Bank of America',
      'Barclays',
      'UBS',
      'Bernstein',
      'Citi',
      'Deutsche Bank',
      'HSBC',
      'Jefferies',
      'Evercore ISI',
      'Berenberg',
    ],
    consulting: [
      'McKinsey',
      'BCG',
      'Bain',
      'Deloitte',
      'PwC',
      'EY',
      'Accenture',
      'Oliver Wyman',
      'Kearney',
    ],
    primaryAndStructured: [
      'SEC/EDGAR',
      'Company Investor Relations',
      'Annual Reports',
      'Earnings Releases',
      'Eurostat',
      'ECB',
      'Federal Reserve/FRED',
      'World Bank',
      'OECD',
      'IMF',
      'National Statistical Agencies',
      'Official Customs Agencies',
      'Official Energy Agencies',
      'Official Industry Agencies',
    ],
  },

  discoveryChannels: [
    'existing_research_document',
    'official_research',
    'financial_media',
    'specialist_finance',
    'social',
    'primary_source',
    'structured_data',
  ],

  retrieval: {
    maxCount: 1,
    maxSearches: 10,
    stopWhenSatisfied: true,
    minQualityScore: 0.8,
  },

  imagePolicies: {
    equityHero: {
      slot: 'hero',
      allowedElements: [
        'company',
        'product_technology',
        'operations',
        'industry_context',
      ],
      maxImages: 1,
      selectionMode: 'best_match',
      requirements: {
        minWidth: 1200,
        minHeight: 675,
        sourceRequirement: 'identify',
        attributionRequirement: 'required',
        freshnessRequirement: 'recent',
        allowedTypes: ['photo', 'factory', 'product'],
      },
    },
  },

  integrity: {
    forbidSyntheticFinancialData: true,
    forbidRandomFallbackData: true,
    requireExactSourceAttribution: true,
    requireDocumentInspectionBeforeChartClaim: true,
    allowOriginalVisualWhenDataNotExtractable: true,
  },
};

export const RESEARCH_VISUAL_SOURCE_STRATEGY = {
  preferredBanks: [
    'Goldman Sachs',
    'J.P. Morgan',
    'Morgan Stanley',
    'Bank of America',
    'Barclays',
    'UBS',
    'Bernstein',
  ],
  discoverySites: [
    'Bloomberg',
    'Reuters',
    'CNBC',
    'Financial Times',
    'MarketWatch',
    'ZeroHedge',
    'Benzinga',
    'X',
    'LinkedIn',
    'Reddit',
    'TradingView',
  ],
} as const;

export function isVisualCandidateSatisfied(
  candidate: Pick<
    ResearchVisualCandidate,
    | 'relevant'
    | 'provenanceStatus'
    | 'technicallyUsable'
    | 'quality'
  > & {
    visualTypeMatches: boolean;
  },
  policy: RetrievalPolicy = ANTI_GRAVITY_VISUAL_DATA_AGENT_CONFIG.retrieval,
): boolean {
  return (
    candidate.relevant &&
    candidate.visualTypeMatches &&
    candidate.provenanceStatus !== 'UNKNOWN_SOURCE' &&
    candidate.technicallyUsable &&
    candidate.quality >= policy.minQualityScore
  );
}

export function shouldStopRetrieval(
  selectedCount: number,
  searchCount: number,
  latestCandidateSatisfied: boolean,
  policy: RetrievalPolicy = ANTI_GRAVITY_VISUAL_DATA_AGENT_CONFIG.retrieval,
): boolean {
  if (selectedCount >= policy.maxCount) return true;
  if (searchCount >= policy.maxSearches) return true;

  return (
    policy.stopWhenSatisfied &&
    latestCandidateSatisfied &&
    selectedCount + 1 >= policy.maxCount
  );
}

export function canRenderDerivedChart(
  candidate: Pick<ResearchVisualCandidate, 'extractionStatus' | 'extractedData'>,
): boolean {
  return (
    candidate.extractionStatus === 'EXACT' &&
    Array.isArray(candidate.extractedData) &&
    candidate.extractedData.length > 0
  );
}

export function shouldUseOriginalResearchVisual(
  candidate: Pick<ResearchVisualCandidate, 'extractionStatus' | 'imageUrl' | 'screenshotUrl'>,
): boolean {
  return (
    candidate.extractionStatus === 'VISUAL_ONLY' &&
    Boolean(candidate.imageUrl || candidate.screenshotUrl)
  );
}

export function normalizeProvenance(input: {
  discoverySource?: string;
  visualSource?: string;
  sourceText?: string;
  sourceAttributionVisible?: boolean;
}): {
  discoverySource?: string;
  visualSource?: string;
  sourceText?: string;
  sourceAttributionVisible: boolean;
  status: ProvenanceStatus;
} {
  const sourceAttributionVisible = Boolean(input.sourceAttributionVisible);

  if (sourceAttributionVisible && input.visualSource) {
    return {
      ...input,
      sourceAttributionVisible,
      status: 'EXPLICIT_SOURCE',
    };
  }

  if (input.visualSource) {
    return {
      ...input,
      sourceAttributionVisible,
      status: 'ATTRIBUTED_SOURCE',
    };
  }

  return {
    ...input,
    sourceAttributionVisible,
    status: 'UNKNOWN_SOURCE',
  };
}

export function buildResearchVisualAttribution(asset: Pick<ReportAsset, 'source' | 'provenance'>): string {
  const visualSource =
    asset.provenance.visualSource ||
    asset.source.researchDivision ||
    asset.source.publisher ||
    'Unknown source';

  const discoverySource = asset.provenance.discoverySource;

  if (discoverySource && discoverySource !== visualSource) {
    return `Source: ${visualSource}. Visual discovered via ${discoverySource}.`;
  }

  return `Source: ${visualSource}.`;
}

export const DOCUMENT_INSPECTION_SIGNALS = [
  'Figure',
  'Exhibit',
  'Chart',
  'Source',
  'GPU',
  'semiconductor',
  'wafer',
  'capacity',
  'capex',
] as const;

export const VISUAL_RETRIEVAL_ORDER: readonly DiscoveryChannel[] = [
  'existing_research_document',
  'official_research',
  'financial_media',
  'specialist_finance',
  'social',
  'primary_source',
  'structured_data',
] as const;

export const VISUAL_AGENT_INTEGRITY_RULES = {
  neverFabricateDatapoints: true,
  neverInterpolateUnlabeledRasterCharts: true,
  neverTreatSearchSnippetAsChartVerification: true,
  neverTreatDiscoveryHostAsOriginalSourceByDefault: true,
  useOriginalVisualForVisualOnlyExtraction: true,
  onlyRenderDerivedChartFromExactData: true,
} as const;


// ============================================================================
// CHART / RESEARCH-VISUAL WORKFLOW
// ============================================================================

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

/**
 * Builds the chart retrieval plan from the ResearchReport claim.
 *
 * IMPORTANT:
 * - The agent must decide what the visual should prove BEFORE searching.
 * - It must not search for generic "nice charts".
 * - maxCount is the number of returned visuals, not the number of searches.
 */
export function buildChartSearchPlan(
  request: ChartWorkflowRequest,
): ChartSearchPlan {
  return {
    claimId: request.claimId,
    purpose: request.intent.purpose,
    requestedTypes: request.intent.preferredTypes,
    sourcePriority: [
      'investment_bank',
      'consulting',
      'primary_source',
      'structured_data',
    ],
    discoveryOrder: VISUAL_RETRIEVAL_ORDER,
    maxAgeDays: request.maxAgeDays,
    retrievalPolicy:
      request.retrievalPolicy ??
      ANTI_GRAVITY_VISUAL_DATA_AGENT_CONFIG.retrieval,
  };
}

/**
 * Required workflow for charts, tables, exhibits and research diagrams.
 *
 * 1. Analyze the ResearchReport claim.
 * 2. Create VisualIntent only if a visual materially supports the claim.
 * 3. Check already-available research files first.
 * 4. If a PDF/report exists, OPEN/INSPECT it. A search result/snippet is NOT
 *    proof that the document contains a usable chart.
 * 5. Search official investment-bank / consulting research.
 * 6. If needed, search financial media and specialist sites such as
 *    Bloomberg, Reuters, MarketWatch and ZeroHedge for reproduced exhibits.
 * 7. If needed, search X / LinkedIn / other social discovery layers.
 * 8. Validate relevance, visual type, technical usability and provenance.
 * 9. Classify extraction:
 *      EXACT       -> underlying data is reliable; derived chart is allowed.
 *      PARTIAL     -> do not invent missing points; normally prefer original.
 *      VISUAL_ONLY -> use the original screenshot/exhibit.
 *      FAILED      -> reject as evidence.
 * 10. Register discoverySource separately from visualSource/dataSource.
 * 11. Stop immediately when maxCount is satisfied.
 */
export const CHART_WORKFLOW: readonly ChartWorkflowStage[] = [
  'ANALYZE_CLAIM',
  'CREATE_VISUAL_INTENT',
  'CHECK_EXISTING_RESEARCH_DOCUMENTS',
  'INSPECT_DOCUMENT_CONTENT',
  'SEARCH_OFFICIAL_RESEARCH',
  'SEARCH_FINANCIAL_MEDIA',
  'SEARCH_SPECIALIST_FINANCE',
  'SEARCH_SOCIAL',
  'SEARCH_PRIMARY_OR_STRUCTURED_DATA',
  'VALIDATE_CANDIDATE',
  'CLASSIFY_EXTRACTION',
  'SELECT_RENDER_MODE',
  'REGISTER_ASSET',
  'COMPLETE',
] as const;

export const CHART_DISCOVERY_RULES = {
  existingDocumentFirst: true,
  inspectDocumentBeforeClaimingChartExists: true,
  officialResearchBeforeSecondaryDiscovery: true,
  secondarySitesMayHostOriginalBankExhibits: true,
  socialIsDiscoveryLayerNotAutomaticDataSource: true,
  stopOnFirstSatisfiedCandidateWhenMaxCountReached: true,
  doNotSearchAllSourcesAfterSatisfaction: true,
} as const;

/**
 * Decide whether the candidate may be used and how it should be rendered.
 */
export function selectChartRenderMode(
  candidate: ResearchVisualCandidate,
): ChartRenderMode {
  if (
    !candidate.relevant ||
    !candidate.technicallyUsable ||
    candidate.provenanceStatus === 'UNKNOWN_SOURCE' ||
    candidate.extractionStatus === 'FAILED'
  ) {
    return 'NO_VISUAL';
  }

  if (canRenderDerivedChart(candidate)) {
    return 'DERIVED_CHART';
  }

  if (
    candidate.extractionStatus === 'VISUAL_ONLY' ||
    candidate.extractionStatus === 'PARTIAL'
  ) {
    return candidate.imageUrl || candidate.screenshotUrl
      ? 'ORIGINAL_RESEARCH_VISUAL'
      : 'NO_VISUAL';
  }

  return 'NO_VISUAL';
}

/**
 * Production early-stop rule.
 *
 * Example:
 * maxCount = 1
 * Search #1 finds a relevant Goldman/JPM/Barclays/UBS exhibit with clear
 * attribution and sufficient quality -> select it -> STOP.
 *
 * The agent must NOT continue with 20-50 searches merely because more
 * sources are available.
 */
export function evaluateChartCandidate(
  candidate: ResearchVisualCandidate,
  selectedCount: number,
  searchCount: number,
  requestedTypes: ResearchVisualType[],
  policy: RetrievalPolicy =
    ANTI_GRAVITY_VISUAL_DATA_AGENT_CONFIG.retrieval,
): ChartWorkflowDecision {
  const visualTypeMatches = requestedTypes.includes(candidate.type);

  const satisfied = isVisualCandidateSatisfied(
    {
      relevant: candidate.relevant,
      provenanceStatus: candidate.provenanceStatus,
      technicallyUsable: candidate.technicallyUsable,
      quality: candidate.quality,
      visualTypeMatches,
    },
    policy,
  );

  if (!satisfied) {
    return {
      stage: 'VALIDATE_CANDIDATE',
      continueRetrieval: searchCount < policy.maxSearches,
      reason:
        'Candidate does not yet satisfy relevance, requested visual type, provenance, technical usability or quality threshold.',
    };
  }

  const renderMode = selectChartRenderMode(candidate);

  if (renderMode === 'NO_VISUAL') {
    return {
      stage: 'CLASSIFY_EXTRACTION',
      continueRetrieval: searchCount < policy.maxSearches,
      reason:
        'Candidate is relevant but cannot be rendered safely without inventing or overstating data.',
    };
  }

  const stop = shouldStopRetrieval(
    selectedCount,
    searchCount,
    true,
    policy,
  );

  return {
    stage: stop ? 'COMPLETE' : 'REGISTER_ASSET',
    continueRetrieval: !stop,
    selectedCandidate: candidate,
    renderMode,
    reason:
      renderMode === 'DERIVED_CHART'
        ? 'Candidate contains EXACT reliable data and may be rendered as a derived chart.'
        : 'Underlying data is not fully reliable for reconstruction; use the original attributed research visual.',
  };
}

/**
 * Source/provenance policy for reproduced investment-bank charts.
 *
 * Example:
 * discoverySource = "ZeroHedge"
 * visualSource    = "Goldman Sachs Global Investment Research"
 *
 * Correct attribution:
 * "Source: Goldman Sachs Global Investment Research. Visual discovered via ZeroHedge."
 *
 * Never silently rewrite the source as ZeroHedge when ZeroHedge merely hosts
 * or reproduces the bank exhibit.
 */
export function createResearchVisualAsset(
  candidate: ResearchVisualCandidate,
  purpose: string,
  retrievedAt: string,
): ReportAsset {
  return {
    id: candidate.id,
    type:
      candidate.type === 'table'
        ? 'table'
        : candidate.type === 'exhibit'
          ? 'research_exhibit'
          : candidate.type.includes('diagram') ||
              candidate.type === 'value_chain' ||
              candidate.type === 'flow' ||
              candidate.type === 'matrix' ||
              candidate.type === 'timeline'
            ? 'diagram'
            : 'chart',
    purpose,
    source: {
      publisher: candidate.publisher,
      researchDivision: candidate.researchDivision,
      url: candidate.sourceUrl,
      title: candidate.documentTitle ?? candidate.title,
      publishedAt: candidate.documentDate,
    },
    attribution: {
      text: candidate.sourceText,
      visible: candidate.sourceAttributionVisible,
    },
    asset: {
      url: candidate.imageUrl,
      screenshotUrl: candidate.screenshotUrl,
    },
    provenance: {
      discoverySource: candidate.discoverySource,
      visualSource: candidate.visualSource,
      retrievedAt,
      status: candidate.provenanceStatus,
    },
    extractionStatus: candidate.extractionStatus,
    selection: {
      score: candidate.quality,
      reason:
        selectChartRenderMode(candidate) === 'DERIVED_CHART'
          ? 'Selected because the claim is visually supported and exact source data is available.'
          : 'Selected as the original attributed research visual because exact reconstruction is not reliable.',
    },
  };
}

export const CHART_WORKFLOW_EXAMPLE_HYPERSCALER_CAPEX = {
  claim:
    'Hyperscaler capital expenditure is rising as AI infrastructure investment accelerates.',
  intent: {
    claimId: 'hyperscaler-capex',
    purpose: 'trend',
    preferredTypes: ['line_chart', 'bar_chart'],
    sourcePreference: 'research_desk',
    maxVisuals: 1,
  } satisfies VisualIntent,
  retrieval: {
    maxCount: 1,
    maxSearches: 10,
    stopWhenSatisfied: true,
    minQualityScore: 0.8,
  } satisfies RetrievalPolicy,
  behavior: [
    'Check existing research files first.',
    'If a relevant PDF exists, inspect the actual PDF pages for charts/tables/exhibits.',
    'Search investment-bank research.',
    'If no satisfactory candidate exists, search financial media and reproduced research exhibits.',
    'If still needed, search X/LinkedIn as discovery layers.',
    'Validate visible source attribution and technical usability.',
    'If EXACT data is available, render a derived chart.',
    'If VISUAL_ONLY/PARTIAL, use the original attributed exhibit without inventing datapoints.',
    'Stop immediately after the first satisfactory visual because maxCount is 1.',
  ],
} as const;


// ============================================================================
// IMAGE FLOW / ARCHITECTURE
// ============================================================================

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

export interface ImageWorkflowDecision {
  stage: ImageWorkflowStage;
  continueRetrieval: boolean;
  selectedCandidate?: ImageCandidate;
  reason: string;
}

/**
 * The four image elements are a reusable taxonomy, NOT four mandatory images.
 *
 * company            -> factory, headquarters, campus, corporate environment
 * product_technology -> product, machine, chip, system or technology
 * operations         -> cleanroom, manufacturing, people, production process
 * industry_context   -> broader sector/supply-chain/industry context
 *
 * The module defines the playground through allowedElements.
 * selectionMode defines HOW to choose.
 * ResearchReport context determines WHAT is most relevant.
 */
export const IMAGE_ELEMENT_TAXONOMY: Record<ImageElement, readonly string[]> = {
  company: ['factory', 'headquarters', 'campus', 'company_facility'],
  product_technology: ['product', 'machine', 'chip', 'system', 'technology'],
  operations: ['cleanroom', 'manufacturing', 'production', 'people', 'operations'],
  industry_context: ['industry', 'supply_chain', 'sector', 'infrastructure', 'market_context'],
} as const;

export const IMAGE_REQUIREMENT_PRESETS = {
  equityCompanyPhoto: {
    minWidth: 1200,
    minHeight: 675,
    sourceRequirement: 'identify',
    attributionRequirement: 'required',
    freshnessRequirement: 'recent',
    allowedTypes: ['photo', 'factory'],
  },
  equityProductTechnology: {
    minWidth: 1200,
    minHeight: 675,
    sourceRequirement: 'identify',
    attributionRequirement: 'required',
    freshnessRequirement: 'recent',
    allowedTypes: ['photo', 'product'],
  },
  sectorHero: {
    minWidth: 1200,
    minHeight: 675,
    sourceRequirement: 'identify',
    attributionRequirement: 'required',
    freshnessRequirement: 'recent',
    allowedTypes: ['photo', 'factory', 'product'],
  },
} satisfies Record<string, ImageRequirements>;

/**
 * Selection modes:
 *
 * best_match:
 *   Score only the allowed elements against structured ResearchReport signals.
 *   Choose the element with strongest entity/theme/keyword/claim linkage.
 *   Do NOT blindly search all four concepts first.
 *
 * priority:
 *   Try allowedElements in their configured order. Stop when an element yields
 *   enough satisfactory candidates.
 *
 * all:
 *   Search every allowed element, still respecting maxImages.
 */
export function selectImageElements(
  policy: ImageSlotPolicy,
  contextScores: Partial<Record<ImageElement, number>>,
): ImageSelectionDecision {
  const allowed = policy.allowedElements;

  if (policy.selectionMode === 'all') {
    return {
      selectedElements: allowed,
      reason: 'selectionMode=all: all allowed image elements may be searched.',
    };
  }

  if (policy.selectionMode === 'priority') {
    return {
      selectedElements: allowed,
      reason: 'selectionMode=priority: search allowed elements sequentially in configured priority order and stop when satisfied.',
    };
  }

  const ranked = allowed
    .map((element) => ({ element, score: contextScores[element] ?? 0 }))
    .sort((a, b) => b.score - a.score);

  return {
    selectedElements: ranked.length > 0 ? [ranked[0].element] : [],
    reason: 'selectionMode=best_match: search only the allowed element with the strongest structured ResearchReport relevance.',
  };
}

export function buildImageIntent(
  context: ImageContext,
  policy: ImageSlotPolicy,
  contextScores: Partial<Record<ImageElement, number>>,
): ImageIntent | null {
  const selection = selectImageElements(policy, contextScores);
  const imageIntent = selection.selectedElements[0];

  if (!imageIntent) return null;

  return {
    section: context.section,
    subject: context.subject,
    entities: context.entities,
    imageIntent,
    preferredElements: IMAGE_ELEMENT_TAXONOMY[imageIntent].slice(),
    maxImages: policy.maxImages,
    requirements: policy.requirements,
  };
}

export const IMAGE_WORKFLOW: readonly ImageWorkflowStage[] = [
  'ANALYZE_REPORT_CONTEXT',
  'RESOLVE_IMAGE_SLOT',
  'SELECT_IMAGE_ELEMENT',
  'BUILD_IMAGE_QUERY',
  'DISCOVER_IMAGES',
  'TECHNICAL_FILTER',
  'RELEVANCE_FILTER',
  'SOURCE_AND_ATTRIBUTION',
  'RANK_CANDIDATES',
  'SELECT_IMAGE',
  'REGISTER_ASSET',
  'COMPLETE',
] as const;

export const IMAGE_ARCHITECTURE_RULES = {
  reportContextDrivesSelection: true,
  moduleControlsAllowedElements: true,
  selectionModeControlsSelectionMethod: true,
  fourElementsAreNotFourRequiredImages: true,
  bestMatchSearchesSelectedElementOnly: true,
  prefilterBeforeLLMReview: true,
  doNotSendHundredsOfRawCandidatesToLLM: true,
  imageDoesNotProveFinancialClaims: true,
  preserveOriginalImageSource: true,
  stopWhenMaxImagesSatisfied: true,
} as const;

/**
 * Candidate filtering should happen before expensive semantic/LLM review.
 * Image search providers should apply native date/size/type filters whenever
 * supported. This function is a final technical sanity check, not a reason to
 * download and inspect hundreds of candidates.
 */
export function imageMeetsTechnicalRequirements(
  candidate: ImageCandidate,
  requirements: ImageRequirements,
): boolean {
  if (!candidate.technicallyUsable) return false;
  if (requirements.minWidth && (!candidate.width || candidate.width < requirements.minWidth)) return false;
  if (requirements.minHeight && (!candidate.height || candidate.height < requirements.minHeight)) return false;
  if (requirements.allowedTypes && !requirements.allowedTypes.includes(candidate.type)) return false;
  if (requirements.sourceRequirement !== 'none' && !candidate.sourceIdentified) return false;
  if (requirements.attributionRequirement === 'required' && !candidate.attributionAvailable) return false;
  return true;
}

export function rankImageCandidates(
  candidates: ImageCandidate[],
  requirements: ImageRequirements,
): ImageCandidate[] {
  return candidates
    .filter((candidate) => imageMeetsTechnicalRequirements(candidate, requirements))
    .filter((candidate) => candidate.relevant)
    .sort((a, b) => {
      const aScore = a.relevanceScore * 0.6 + a.quality * 0.3 + (a.freshnessScore ?? 0) * 0.1;
      const bScore = b.relevanceScore * 0.6 + b.quality * 0.3 + (b.freshnessScore ?? 0) * 0.1;
      return bScore - aScore;
    });
}

export function selectImagesForSlot(
  candidates: ImageCandidate[],
  policy: ImageSlotPolicy,
): ImageCandidate[] {
  return rankImageCandidates(candidates, policy.requirements).slice(0, policy.maxImages);
}

/**
 * Search flow:
 *
 * ResearchReport
 *   -> Image Planner
 *   -> resolve slot policy
 *   -> select allowed element(s) using selectionMode
 *   -> query builder
 *   -> image discovery provider / company site / news source
 *   -> provider-side size/date/type filters
 *   -> technical validation
 *   -> semantic relevance validation
 *   -> source + attribution validation
 *   -> ranking
 *   -> selected image(s)
 *   -> Asset Registry
 *   -> Report Composer
 */
export const IMAGE_DISCOVERY_PIPELINE = [
  'ResearchReport',
  'Image Planner',
  'Slot Policy',
  'Selection Mode',
  'Image Query Builder',
  'Image Discovery',
  'Provider-side Filters',
  'Technical Validation',
  'Relevance Validation',
  'Source/Attribution Validation',
  'Ranking',
  'Selected Image',
  'Asset Registry',
  'Report Composer',
] as const;

export const IMAGE_TOOL_RESPONSIBILITIES = {
  discovery:
    'Use structured image search for candidate discovery. Apply native dimensions, freshness and type filters before returning candidates when supported.',
  browser:
    'Use browser/Playwright-style retrieval when the original page, exact image asset, dynamic page, SVG/canvas or element screenshot is needed.',
  llm:
    'Use the LLM as a decision layer over a small prefiltered candidate set, not as a bulk image crawler.',
  provenance:
    'Persist the actual image publisher/source URL, discovery source and attribution metadata in the Asset Registry.',
} as const;

export const IMAGE_WORKFLOW_EXAMPLE_ASML = {
  context: {
    section: 'Semiconductor outlook',
    subject: 'semiconductor industry',
    entities: ['ASML', 'TSMC', 'NVIDIA'],
    keywords: ['EUV', 'High-NA', 'wafer', 'fab', 'AI chips'],
    themes: ['semiconductor manufacturing', 'capacity', 'advanced lithography'],
  } satisfies ImageContext,
  slot: {
    slot: 'hero',
    allowedElements: [
      'company',
      'product_technology',
      'operations',
      'industry_context',
    ],
    maxImages: 1,
    selectionMode: 'best_match',
    requirements: {
      minWidth: 1200,
      minHeight: 675,
      sourceRequirement: 'identify',
      attributionRequirement: 'required',
      freshnessRequirement: 'recent',
      allowedTypes: ['photo', 'factory', 'product'],
    },
  } satisfies ImageSlotPolicy,
  behavior: [
    'Score the four allowed concepts against the ResearchReport context.',
    'Choose the strongest concept before image search.',
    'Do not automatically retrieve one image for every concept.',
    'Search only the selected best_match concept unless it fails to produce a satisfactory candidate.',
    'Apply technical filters before semantic review.',
    'Prefer a recent, high-resolution and contextually relevant image with identifiable source.',
    'Register the selected image with provenance and attribution.',
    'Stop as soon as maxImages=1 is satisfied.',
  ],
} as const;


// ============================================================================
// REPORT COMPOSITION ARCHITECTURE — SELL-SIDE EVENT NOTE
// ============================================================================

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

/**
 * This is a deterministic composition layer inside the Visual & Data Agent,
 * NOT a separate research/LLM agent.
 *
 * Research Agent -> factual narrative, claims, thesis, catalysts and risks.
 * Visual & Data Agent -> verified charts, exhibits, tables and images.
 * Report Composer -> decides hierarchy, placement and sell-side layout.
 * Renderer -> turns ReportLayoutPlan into app/PDF presentation.
 */
export const REPORT_COMPOSITION_PIPELINE = [
  'ResearchReport',
  'Asset Registry',
  'Narrative Analysis',
  'Investment Story Ordering',
  'Section Purpose Resolution',
  'Evidence Mapping',
  'Layout Pattern Selection',
  'Density and Hierarchy Rules',
  'ReportLayoutPlan',
  'Report Renderer',
] as const;

export const SELL_SIDE_EVENT_NOTE_COMPOSITION = {
  reportType: 'SELL_SIDE_EVENT_NOTE',

  firstPage: {
    researchHeader: true,
    conclusionStyleHeadline: true,
    marketMetrics: true,
    bottomLineRequired: true,
    keyDebateRequired: true,
    maxKeyTakeaways: 3,

    leadImage: {
      required: true,
      role: 'editorial_support',
      size: 'compact',
      placement: 'adjacent_to_bottom_line',
      useAsFullBleedBackground: false,
      approximatePageShare: '25-35%',
    },

    primaryEvidence: {
      max: 1,
      preferredOnFirstPageWhenMaterial: true,
    },
  },

  body: {
    conclusionStyleHeadlines: true,
    onePrimaryConclusionPerSection: true,
    evidenceInlineWithArgument: true,
    figureNumbering: true,
    sourceDirectlyUnderEveryFigure: true,
    maxDominantVisualsPerSection: 1,

    supportingImages: {
      min: 0,
      max: 2,
      onlyWhenAdditive: true,
    },
  },

  evidencePriority: [
    'research_exhibit',
    'verified_chart',
    'financial_table',
    'analytical_diagram',
    'editorial_image',
  ],

  visualStyle: {
    documentFirst: true,
    dashboardFirst: false,
    lightOrOffWhiteCanvas: true,
    restrainedInstitutionalAccent: true,
    semanticRedGreenOnly: true,
    thinRulesAndBorders: true,
    minimalShadows: true,
    useWhitespaceForHierarchy: true,
    avoidDecorativeCardOveruse: true,
    tabularFinancialNumerals: true,
  },
} as const;

/**
 * Every section answers one investment question and leads with the conclusion.
 * Headings must state the analytical conclusion, not merely name the topic.
 *
 * Good:
 * "China remains material, but headline exposure overstates near-term earnings sensitivity"
 *
 * Weak:
 * "China Exposure"
 */
export const SELL_SIDE_SECTION_RULES = {
  oneInvestmentQuestionPerSection: true,
  onePrimaryConclusionPerSection: true,
  headlineMustStateConclusion: true,
  everyVisualMustSupportAClaim: true,
  noDecorativeChartQuota: true,
  noOrphanCharts: true,
  noOrphanHeadings: true,
  noVisualWithoutAnalyticalReason: true,
  executiveFirstPageMustStandAlone: true,
  methodologyBelongsAtEnd: true,
} as const;

export const SELL_SIDE_EVENT_NOTE_SECTION_ORDER: readonly ReportSectionPurpose[] = [
  'bottom_line',
  'key_debate',
  'what_drove_the_move',
  'why_it_matters',
  'evidence',
  'transmission',
  'financial_impact',
  'forward_view',
  'catalysts_and_risks',
  'view_invalidators',
  'sources_and_methodology',
] as const;

/**
 * Photos provide context and editorial quality; they do not outrank evidence.
 * The lead image is standard and compact. Body images are optional.
 */
export const EVENT_NOTE_IMAGE_COMPOSITION_POLICY = {
  leadImage: {
    required: true,
    maxCount: 1,
    size: 'compact',
    placement: 'adjacent_to_bottom_line',
    role: 'editorial_support',
  },
  supportingImages: {
    minCount: 0,
    maxCount: 2,
    onlyWhenAdditive: true,
  },
  evidenceAlwaysWinsLayoutConflict: true,
  totalImageMaximum: 3,
} as const;

export function selectLayoutPattern(
  purpose: ReportSectionPurpose,
  hasEvidence: boolean,
): ReportLayoutPattern {
  switch (purpose) {
    case 'bottom_line':
    case 'key_debate':
      return 'FIRST_PAGE_SELL_SIDE';
    case 'evidence':
      return hasEvidence ? 'FULL_WIDTH_EVIDENCE' : 'TEXT_ONLY';
    case 'what_drove_the_move':
    case 'why_it_matters':
    case 'financial_impact':
      return hasEvidence ? 'TEXT_CHART_SPLIT' : 'TEXT_ONLY';
    case 'transmission':
      return 'CAUSAL_FLOW';
    case 'catalysts_and_risks':
    case 'view_invalidators':
    case 'forward_view':
      return 'CATALYST_RISK_SPLIT';
    default:
      return 'TEXT_ONLY';
  }
}

export function assetEvidencePriority(asset: ReportAsset): number {
  switch (asset.type) {
    case 'research_exhibit':
      return 5;
    case 'chart':
      return 4;
    case 'table':
      return 3;
    case 'diagram':
      return 2;
    case 'image':
      return 1;
  }
}

export function preferEvidenceOverEditorialImage(
  evidence: ReportAsset | undefined,
  image: ReportAsset | undefined,
): ReportAsset | undefined {
  if (!evidence) return image;
  if (!image) return evidence;
  return assetEvidencePriority(evidence) >= assetEvidencePriority(image)
    ? evidence
    : image;
}

export const SELL_SIDE_EVENT_NOTE_FIRST_PAGE = [
  'Research header / date / coverage classification',
  'Asset or company name',
  'Conclusion-style event headline',
  'Price / move / market-cap or relevant market metrics',
  'Bottom Line',
  'Compact authentic lead image adjacent to Bottom Line',
  'The Key Debate',
  'Maximum three Key Takeaways',
  'Maximum one primary evidence exhibit when material',
] as const;

export const SELL_SIDE_EVENT_NOTE_BODY_RHYTHM = [
  'What Drove the Move',
  'Why It Matters',
  'Inline verified evidence / research exhibit',
  'Transmission and Financial Impact',
  'Forward View',
  'Catalysts and Risks',
  'What Would Change the View',
  'Sources and Methodology',
] as const;

export const REPORT_COMPOSER_INTEGRITY_RULES = {
  neverRewriteResearchFactsToFitLayout: true,
  neverCreateMetricsForEmptyLayoutSlots: true,
  neverCreateDecorativeFinancialCharts: true,
  neverUsePhotographyAsFinancialEvidence: true,
  neverHideSourceLines: true,
  neverPreferAestheticBalanceOverEvidenceIntegrity: true,
  preserveClaimAssetLinkage: true,
  preserveSourceProvenance: true,
} as const;
