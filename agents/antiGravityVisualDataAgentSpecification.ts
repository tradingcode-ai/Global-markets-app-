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
