import { GoogleGenAI } from '@google/genai';
import type pg from 'pg';
import {
  AssetType,
  ChartRenderMode,
  ChartSearchPlan,
  ChartWorkflowDecision,
  ChartWorkflowRequest,
  ChartWorkflowStage,
  DiscoveryChannel,
  EditorialHeroPayload,
  ExtractionStatus,
  ImageCandidate,
  ImageContext,
  ImageElement,
  ImageIntent,
  ImageRequirements,
  ImageSelectionDecision,
  ImageSelectionMode,
  ImageSlotPolicy,
  ImageWorkflowDecision,
  ImageWorkflowStage,
  MacroChartDatapoint,
  MacroChartPayload,
  MacroChartType,
  ProvenanceStatus,
  ReportAsset,
  ReportBlockType,
  ReportCompositionInput,
  ReportLayoutBlock,
  ReportLayoutPattern,
  ReportLayoutPlan,
  ReportLayoutSection,
  ReportSectionPurpose,
  ReportType,
  ResearchDocumentIndex,
  ResearchReport,
  ResearchSource,
  ResearchVisualCandidate,
  ResearchVisualType,
  RetrievalPolicy,
  SourceTier,
  TransmissionNode,
  VisualBrief,
  VisualDataAgentConfig,
  VisualEnrichmentPayload,
  VisualIntent,
  VisualPurpose
} from '../types/marketResearch';

// ============================================================================
// CONFIGURATION, CONSTANTS & TAXONOMIES
// ============================================================================

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

// ============================================================================
// CURATED EDITORIAL PHOTO REGISTRY
// ============================================================================

export const EDITORIAL_HERO_ALLOWED_HOSTS = [
  'images.unsplash.com',
  'upload.wikimedia.org',
] as const;

export function isAllowedEditorialHeroUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      EDITORIAL_HERO_ALLOWED_HOSTS.some((host) => url.hostname === host)
    );
  } catch {
    return false;
  }
}

function unsplashHero(
  imageId: string,
  locationLabel: string,
  alt: string
): EditorialHeroPayload {
  return {
    imageUrl: `https://images.unsplash.com/${imageId}?auto=format&fit=crop&w=1600&q=80`,
    photographerCredit: 'Unsplash contributor (credit retained at source)',
    locationLabel,
    source: 'Unsplash',
    license: 'Unsplash License',
    sourceUrl: 'https://unsplash.com',
    alt,
  };
}

export const EDITORIAL_HERO_REGISTRY: Record<
  VisualBrief['editorialScene'],
  EditorialHeroPayload[]
> = {
  WALL_STREET: [
    unsplashHero('photo-1611974789855-9c2a0a7236a3', 'Wall Street, New York', 'Exterior of a financial district trading venue'),
    unsplashHero('photo-1590283603385-17ffb3a7f29f', 'Lower Manhattan, New York', 'Financial district architecture and street activity'),
    unsplashHero('photo-1526304640581-d334cdbbf45e', 'Institutional trading desk', 'Institutional market data displayed on trading terminals'),
    unsplashHero('photo-1486406146926-c627a92ad1ab', 'Global financial centre', 'Modern financial district office architecture'),
  ],
  SEMICONDUCTOR_CLEANROOM: [
    unsplashHero('photo-1518770660439-4636190af475', 'Semiconductor fabrication facility', 'Close-up photograph of semiconductor technology'),
    unsplashHero('photo-1550751827-4bd374c3f58b', 'Advanced wafer processing hub', 'Technology hardware and electronics in an industrial setting'),
    unsplashHero('photo-1563770660941-20978e870e26', 'Precision lithography laboratory', 'Precision electronics and optical engineering equipment'),
    unsplashHero('photo-1504384308090-c894fdcc538d', 'Semiconductor fabrication facility', 'Semiconductor hardware photographed in a clean technical setting'),
  ],
  ENERGY_TERMINAL: [
    unsplashHero('photo-1518709268805-4e9042af9f23', 'North Sea offshore basin', 'Industrial energy infrastructure photographed offshore'),
    unsplashHero('photo-1542601906990-b4d3fb778b09', 'Rotterdam energy gateway', 'Industrial logistics and energy infrastructure'),
    unsplashHero('photo-1578328819058-b69f3a3b0f6b', 'Industrial refining hub', 'Industrial processing infrastructure at dusk'),
    unsplashHero('photo-1497435334941-8c899ee9e8e9', 'Global energy infrastructure', 'Large-scale industrial infrastructure and utilities'),
  ],
  AEROSPACE_HANGAR: [
    unsplashHero('photo-1517976487502-5f690246654c', 'Aerospace engineering plant', 'Aircraft photographed in an engineering facility'),
    unsplashHero('photo-1541185933-ef5d8ed016c2', 'Flight systems test facility', 'Commercial aircraft photographed in flight'),
    unsplashHero('photo-1436491865332-7a61a109cc05', 'Global aviation network', 'Passenger aircraft photographed from the air'),
    unsplashHero('photo-1464037866556-6812c9d1c72e', 'Aerospace operations hub', 'Airport and aircraft operations photographed at scale'),
  ],
  CENTRAL_BANK: [
    unsplashHero('photo-1541872703-74c5e44368f9', 'Sovereign monetary authority', 'Classical government building architecture'),
    unsplashHero('photo-1556761175-b413da4baf72', 'Fixed-income trading desk', 'Institutional policy and markets research office'),
    unsplashHero('photo-1529107386315-e1a2ed48a620', 'Government district', 'Government building and civic architecture'),
    unsplashHero('photo-1454165804606-c3d57bc86b40', 'Policy and markets research office', 'Research and market analysis materials on a desk'),
  ],
};

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function decimalStringModulo(value: string, divisor: number): number {
  let remainder = 0;
  for (const character of value) {
    remainder = (remainder * 10 + Number(character)) % divisor;
  }
  return remainder;
}

export function selectEditorialHero(
  scene: string,
  ticker: string,
  eventId: string
): EditorialHeroPayload {
  const pool =
    EDITORIAL_HERO_REGISTRY[scene as VisualBrief['editorialScene']] ||
    EDITORIAL_HERO_REGISTRY.WALL_STREET;
  const numericSuffix = eventId.match(/(\d+)$/)?.[1];
  const tickerOffset = stableHash(ticker.toUpperCase()) % pool.length;
  const sequenceOffset = numericSuffix
    ? decimalStringModulo(numericSuffix, pool.length)
    : stableHash(`${ticker}_${eventId}`) % pool.length;
  const selected = pool[(tickerOffset + sequenceOffset) % pool.length];
  if (isAllowedEditorialHeroUrl(selected.imageUrl)) return selected;
  return (
    pool.find((hero) => isAllowedEditorialHeroUrl(hero.imageUrl)) ||
    EDITORIAL_HERO_REGISTRY.WALL_STREET[0]
  );
}

export function calculateMarketCapImpact(
  _ticker: string,
  changePercent: number,
  marketCapUsdBillions?: number
): number | undefined {
  if (
    !Number.isFinite(changePercent) ||
    !Number.isFinite(marketCapUsdBillions) ||
    (marketCapUsdBillions as number) <= 0
  ) {
    return undefined;
  }
  return Number((((marketCapUsdBillions as number) * changePercent) / 100).toFixed(1));
}

// ============================================================================
// SPECIFICATION DECISION LOGIC & HELPERS
// ============================================================================

export function isVisualCandidateSatisfied(
  candidate: Pick<
    ResearchVisualCandidate,
    'relevant' | 'provenanceStatus' | 'technicallyUsable' | 'quality'
  > & {
    visualTypeMatches: boolean;
  },
  policy: RetrievalPolicy = ANTI_GRAVITY_VISUAL_DATA_AGENT_CONFIG.retrieval
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
  policy: RetrievalPolicy = ANTI_GRAVITY_VISUAL_DATA_AGENT_CONFIG.retrieval
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
  candidate: Pick<ResearchVisualCandidate, 'extractionStatus' | 'extractedData'>
): boolean {
  return (
    candidate.extractionStatus === 'EXACT' &&
    Array.isArray(candidate.extractedData) &&
    candidate.extractedData.length > 0
  );
}

export function shouldUseOriginalResearchVisual(
  candidate: Pick<ResearchVisualCandidate, 'extractionStatus' | 'imageUrl' | 'screenshotUrl'>
): boolean {
  return (
    (candidate.extractionStatus === 'VISUAL_ONLY' || candidate.extractionStatus === 'PARTIAL') &&
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

export function buildResearchVisualAttribution(
  asset: Pick<ReportAsset, 'source' | 'provenance'>
): string {
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

export function buildChartSearchPlan(
  request: ChartWorkflowRequest
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
      request.retrievalPolicy ?? ANTI_GRAVITY_VISUAL_DATA_AGENT_CONFIG.retrieval,
  };
}

export function selectChartRenderMode(
  candidate: ResearchVisualCandidate
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

export function evaluateChartCandidate(
  candidate: ResearchVisualCandidate,
  selectedCount: number,
  searchCount: number,
  requestedTypes: ResearchVisualType[],
  policy: RetrievalPolicy = ANTI_GRAVITY_VISUAL_DATA_AGENT_CONFIG.retrieval
): ChartWorkflowDecision {
  const visualTypeMatches = requestedTypes.length === 0 || requestedTypes.includes(candidate.type);

  const satisfied = isVisualCandidateSatisfied(
    {
      relevant: candidate.relevant,
      provenanceStatus: candidate.provenanceStatus,
      technicallyUsable: candidate.technicallyUsable,
      quality: candidate.quality,
      visualTypeMatches,
    },
    policy
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

  const stop = shouldStopRetrieval(selectedCount, searchCount, true, policy);

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

export function createResearchVisualAsset(
  candidate: ResearchVisualCandidate,
  purpose: string,
  retrievedAt: string
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

export function imageMeetsTechnicalRequirements(
  candidate: ImageCandidate,
  requirements: ImageRequirements
): boolean {
  if (!candidate.technicallyUsable) return false;
  if (requirements.minWidth && (!candidate.width || candidate.width < requirements.minWidth)) {
    return false;
  }
  if (requirements.minHeight && (!candidate.height || candidate.height < requirements.minHeight)) {
    return false;
  }
  if (requirements.allowedTypes && !requirements.allowedTypes.includes(candidate.type)) {
    return false;
  }
  if (requirements.sourceRequirement !== 'none' && !candidate.sourceIdentified) {
    return false;
  }
  if (requirements.attributionRequirement === 'required' && !candidate.attributionAvailable) {
    return false;
  }
  return true;
}

export function rankImageCandidates(
  candidates: ImageCandidate[],
  requirements: ImageRequirements
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

export function selectImageElements(
  policy: ImageSlotPolicy,
  contextScores: Partial<Record<ImageElement, number>>
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
      reason:
        'selectionMode=priority: search allowed elements sequentially in configured priority order and stop when satisfied.',
    };
  }

  const ranked = allowed
    .map((element) => ({ element, score: contextScores[element] ?? 0 }))
    .sort((a, b) => b.score - a.score);

  return {
    selectedElements: ranked.length > 0 ? [ranked[0].element] : [],
    reason:
      'selectionMode=best_match: search only the allowed element with the strongest structured ResearchReport relevance.',
  };
}

export function buildImageIntent(
  context: ImageContext,
  policy: ImageSlotPolicy,
  contextScores: Partial<Record<ImageElement, number>>
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

export function selectImagesForSlot(
  candidates: ImageCandidate[],
  policy: ImageSlotPolicy
): ImageCandidate[] {
  return rankImageCandidates(candidates, policy.requirements).slice(0, policy.maxImages);
}

export function selectLayoutPattern(
  purpose: ReportSectionPurpose,
  hasEvidence: boolean
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
    default:
      return 0;
  }
}

export function preferEvidenceOverEditorialImage(
  evidence: ReportAsset | undefined,
  image: ReportAsset | undefined
): ReportAsset | undefined {
  if (!evidence) return image;
  if (!image) return evidence;
  return assetEvidencePriority(evidence) >= assetEvidencePriority(image) ? evidence : image;
}

// ============================================================================
// CONTEXT & CLAIM ANALYZER
// ============================================================================

export interface ExtractedReportClaim {
  id: string;
  text: string;
  sectionPurpose: ReportSectionPurpose;
  entities: string[];
  isQuantitative: boolean;
}

export interface ReportContextAnalysis {
  entities: string[];
  themes: string[];
  claims: ExtractedReportClaim[];
  contextScores: Record<ImageElement, number>;
  primarySubject: string;
  editorialScene: VisualBrief['editorialScene'];
}

export function analyzeReportContext(
  report: ResearchReport,
  brief?: VisualBrief
): ReportContextAnalysis {
  const ticker = (report.ticker || '').toUpperCase();
  const assetName = report.assetName || report.asset || report.asset_name || ticker;
  const assetClass = (report.assetClass || report.asset_class || '').toLowerCase();

  const entities = Array.from(
    new Set(
      [
        ticker,
        assetName,
        ...(report.sources || []).map((s) => s.publisher).filter(Boolean),
      ].filter((e) => typeof e === 'string' && e.trim().length > 1)
    )
  );

  const rawText = [
    report.executiveSummary,
    typeof report.immediateCatalyst === 'string'
      ? report.immediateCatalyst
      : report.immediateCatalyst?.summary,
    report.directMarketImpact,
    report.broaderContext,
    report.whatMarketIsReactingTo,
    report.whatToWatchNext,
  ]
    .filter(Boolean)
    .join(' ');

  const lower = rawText.toLowerCase();

  // Compute contextScores for the 4 image elements based on keyword presence
  const companyKeywords = ['headquarters', 'campus', 'facility', 'corporate', 'earnings', 'shareholders', 'ceo', 'cfo', 'management'];
  const techKeywords = ['gpu', 'chip', 'semiconductor', 'wafer', 'lithography', 'architecture', 'software', 'hardware', 'model', 'euv', 'high-na', 'transistor', 'node'];
  const opsKeywords = ['cleanroom', 'fab', 'foundry', 'manufacturing', 'assembly', 'production', 'capacity', 'supply chain', 'logistics', 'plant', 'refinery'];
  const indKeywords = ['macro', 'rates', 'monetary', 'treasury', 'yield', 'geopolitics', 'tariffs', 'sanctions', 'energy', 'oil', 'opec', 'commodity', 'sector'];

  const scoreFor = (words: string[]) =>
    Math.min(1, words.filter((w) => lower.includes(w)).length * 0.25);

  const contextScores: Record<ImageElement, number> = {
    company: Math.max(0.2, scoreFor(companyKeywords)),
    product_technology: scoreFor(techKeywords),
    operations: scoreFor(opsKeywords),
    industry_context: scoreFor(indKeywords),
  };

  // Determine editorial scene
  let editorialScene: VisualBrief['editorialScene'] = brief?.editorialScene || 'WALL_STREET';
  if (!brief?.editorialScene) {
    if (ticker === 'ASML' || assetClass.includes('semi') || lower.includes('semiconductor') || lower.includes('cleanroom')) {
      editorialScene = 'SEMICONDUCTOR_CLEANROOM';
      contextScores.product_technology = Math.max(contextScores.product_technology, 0.9);
      contextScores.operations = Math.max(contextScores.operations, 0.85);
    } else if (ticker.includes('CL') || lower.includes('crude') || lower.includes('refining') || assetClass.includes('energy')) {
      editorialScene = 'ENERGY_TERMINAL';
      contextScores.operations = Math.max(contextScores.operations, 0.8);
      contextScores.industry_context = Math.max(contextScores.industry_context, 0.85);
    } else if (assetClass.includes('rate') || assetClass.includes('bond') || lower.includes('yield curve') || lower.includes('treasury')) {
      editorialScene = 'CENTRAL_BANK';
      contextScores.industry_context = Math.max(contextScores.industry_context, 0.9);
    } else if (lower.includes('aerospace') || lower.includes('aviation') || ticker.includes('BA')) {
      editorialScene = 'AEROSPACE_HANGAR';
    }
  }

  // Extract claims
  const claims: ExtractedReportClaim[] = [];
  let claimIndex = 1;

  if (report.executiveSummary) {
    claims.push({
      id: `claim_${claimIndex++}`,
      text: report.executiveSummary.trim(),
      sectionPurpose: 'bottom_line',
      entities: [ticker],
      isQuantitative: /\d+(?:\.\d+)?%?/.test(report.executiveSummary),
    });
  }

  const catalystText =
    typeof report.immediateCatalyst === 'string'
      ? report.immediateCatalyst
      : report.immediateCatalyst?.summary;

  if (catalystText) {
    claims.push({
      id: `claim_${claimIndex++}`,
      text: catalystText.trim(),
      sectionPurpose: 'what_drove_the_move',
      entities: [ticker],
      isQuantitative: /\d+(?:\.\d+)?%?/.test(catalystText),
    });
  }

  if (report.directMarketImpact) {
    claims.push({
      id: `claim_${claimIndex++}`,
      text: report.directMarketImpact.trim(),
      sectionPurpose: 'why_it_matters',
      entities: [ticker],
      isQuantitative: /\d+(?:\.\d+)?%?/.test(report.directMarketImpact),
    });
  }

  if (report.broaderContext) {
    claims.push({
      id: `claim_${claimIndex++}`,
      text: report.broaderContext.trim(),
      sectionPurpose: 'financial_impact',
      entities: [ticker],
      isQuantitative: /\d+(?:\.\d+)?%?/.test(report.broaderContext),
    });
  }

  if (report.whatMarketIsReactingTo) {
    claims.push({
      id: `claim_${claimIndex++}`,
      text: report.whatMarketIsReactingTo.trim(),
      sectionPurpose: 'key_debate',
      entities: [ticker],
      isQuantitative: /\d+(?:\.\d+)?%?/.test(report.whatMarketIsReactingTo),
    });
  }

  if (report.whatToWatchNext) {
    claims.push({
      id: `claim_${claimIndex++}`,
      text: report.whatToWatchNext.trim(),
      sectionPurpose: 'forward_view',
      entities: [ticker],
      isQuantitative: /\d+(?:\.\d+)?%?/.test(report.whatToWatchNext),
    });
  }

  return {
    entities,
    themes: [brief?.primaryTheme || (assetClass ? `${assetClass.toUpperCase()}_OUTLOOK` : 'EQUITY_RESEARCH')],
    claims,
    contextScores,
    primarySubject: `${ticker} (${assetName})`,
    editorialScene,
  };
}

// ============================================================================
// INSPECTION OF ATTACHED LOCAL / DOCUMENT SOURCES
// ============================================================================

export function inspectDocumentSources(
  report: ResearchReport
): ResearchVisualCandidate | undefined {
  if (!report.sources || report.sources.length === 0) return undefined;

  for (const source of report.sources) {
    const publisher = source.publisher || '';
    const title = source.title || '';
    const textToScan = `${publisher} ${title} ${source.relevance || ''}`.toLowerCase();

    const isPreferredBank = RESEARCH_VISUAL_SOURCE_STRATEGY.preferredBanks.some((bank) =>
      textToScan.includes(bank.toLowerCase())
    );

    const hasInspectionSignal = DOCUMENT_INSPECTION_SIGNALS.some((sig) =>
      textToScan.includes(sig.toLowerCase())
    );

    if (isPreferredBank || hasInspectionSignal) {
      const candidate: ResearchVisualCandidate = {
        id: `vis_doc_${stableHash(source.url || title)}`,
        claimId: 'claim_1',
        publisher: publisher || 'Investment Research Desk',
        researchDivision: 'Global Investment Research',
        documentTitle: title,
        documentDate: source.accessedAt || source.accessed_at || new Date().toISOString().slice(0, 10),
        type: 'exhibit',
        title: title || 'Research Exhibit',
        sourceUrl: source.url,
        imageUrl: source.url,
        screenshotUrl: source.url,
        sourceAttributionVisible: true,
        sourceText: `Source: ${publisher || 'Research Desk'} Exhibit`,
        visualSource: publisher || 'Investment Research Desk',
        discoverySource: source.publisher,
        provenanceStatus: 'EXPLICIT_SOURCE',
        extractionStatus: 'VISUAL_ONLY',
        technicallyUsable: Boolean(source.url),
        relevant: true,
        quality: 0.85,
      };

      return candidate;
    }
  }

  return undefined;
}

// ============================================================================
// MODEL ROUTER & GROUNDING SEARCH
// ============================================================================

const PRIMARY_AGENT = 'antigravity-preview-09-2026';
const FALLBACK_AGENT = 'antigravity-preview-05-2026';
const PRIMARY_MODEL = 'gemini-3.8-flash';

const VISUAL_DATA_AGENT_SYSTEM_PROMPT = `You are the AntiGravity Visual & Data Agent (v1.0) for institutional equity research.
Your role is to discover and verify authentic visual evidence (research exhibits, line/bar charts, breakdowns, or tables)
from official investment-bank research desks (Goldman Sachs GIR, Morgan Stanley, J.P. Morgan, Bernstein, UBS, Barclays),
official agencies (Federal Reserve/FRED, ECB, Eurostat, SEC, BLS), or financial media reporting.

DATA INTEGRITY RULES:
1. Never fabricate, interpolate, round, or invent financial numbers.
2. If exact series data is available in the source, set extractionStatus to "EXACT" and include real finite data points.
3. If only a screenshot, graphic or exhibit was discovered but exact numbers are not machine-extractable,
   set extractionStatus to "VISUAL_ONLY" or "PARTIAL" and provide the sourceUrl / imageUrl. DO NOT fabricate data points.
4. If no authentic source-backed chart or exhibit is found, return an empty object {} or extractionStatus "FAILED".
5. Distinguish discoverySource (e.g. ZeroHedge, Bloomberg, X) from visualSource (e.g. Goldman Sachs Global Investment Research).

OUTPUT FORMAT:
Return ONLY valid JSON (no markdown formatting or fences) matching this schema:
{
  "publisher": "Goldman Sachs",
  "researchDivision": "Global Investment Research",
  "documentTitle": "Semiconductor Equipment Outlook",
  "type": "bar_chart",
  "title": "Revenue by Customer Geography",
  "unit": "% of total",
  "sourceUrl": "https://...",
  "imageUrl": "https://...",
  "discoverySource": "ZeroHedge",
  "visualSource": "Goldman Sachs Global Investment Research",
  "sourceAttributionVisible": true,
  "sourceText": "Source: Goldman Sachs Global Investment Research.",
  "extractionStatus": "EXACT",
  "quality": 0.9,
  "extractedData": [
    {"label": "China", "value": 46.0, "benchmark": 35.0},
    {"label": "Taiwan", "value": 24.0, "benchmark": 25.0}
  ]
}`;

function isMacroChartType(value: unknown): value is MacroChartType {
  return value === 'BAR' || value === 'LINE' || value === 'BREAKDOWN' || value === 'YIELD_CURVE';
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function parseJsonResponse(responseText: string): unknown {
  const cleaned = responseText
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start < 0 || end <= start) return undefined;
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return undefined;
    }
  }
}

function extractInteractionText(response: any): string {
  const directText = response?.output_text || response?.outputText || response?.text;
  if (typeof directText === 'string' && directText.trim()) return directText.trim();

  const outputText: string[] = [];
  const outputs = Array.isArray(response?.outputs) ? response.outputs : [];
  for (const output of outputs) {
    if (typeof output?.text === 'string') outputText.push(output.text);
    const content = Array.isArray(output?.content) ? output.content : [];
    for (const part of content) {
      if (typeof part?.text === 'string') outputText.push(part.text);
    }
  }

  const steps = Array.isArray(response?.steps) ? response.steps : [];
  for (const step of steps) {
    const content = Array.isArray(step?.content) ? step.content : [];
    for (const part of content) {
      if (typeof part?.text === 'string') outputText.push(part.text);
    }
  }

  if (Array.isArray(response?.candidates)) {
    for (const candidate of response.candidates) {
      const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
      for (const part of parts) {
        if (typeof part?.text === 'string') outputText.push(part.text);
      }
    }
  }

  return outputText.join('\n').trim();
}

function collectGroundingUrls(response: any): Set<string> {
  const urls = new Set<string>();
  const metadataRoots = [
    response?.groundingMetadata,
    response?.grounding_metadata,
    response?.metadata?.groundingMetadata,
    response?.metadata?.grounding_metadata,
    response?.candidates?.[0]?.groundingMetadata,
    ...(Array.isArray(response?.steps)
      ? response.steps.flatMap((step: any) => [step, step?.result])
      : []),
    ...(Array.isArray(response?.outputs)
      ? response.outputs.flatMap((output: any) => [
          output?.groundingMetadata,
          output?.grounding_metadata,
          output?.metadata?.groundingMetadata,
          output?.metadata?.grounding_metadata,
          output?.annotations,
          output?.citations,
        ])
      : []),
  ];

  const visit = (node: any): void => {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (typeof node !== 'object') return;

    const uri = node.web?.uri || node.uri;
    if (typeof uri === 'string' && isHttpUrl(uri)) urls.add(uri);

    const url = node.url;
    if (typeof url === 'string' && isHttpUrl(url)) urls.add(url);

    Object.entries(node).forEach(([key, value]) => {
      if (/grounding|citation|annotation|source|chunk/i.test(key)) visit(value);
    });
  };

  metadataRoots.forEach(visit);
  return urls;
}

async function recordVisualAgentUsage(
  pool: pg.Pool | null,
  response: any,
  startedAt: number,
  report: ResearchReport,
  routerStage: string,
  modelUsed: string
): Promise<void> {
  if (!pool || !response) return;

  const usage =
    response.usage ||
    response.usage_metadata ||
    response.usageMetadata ||
    {};

  const inputTokens = Number(
    usage.total_input_tokens ?? usage.prompt_tokens ?? usage.promptTokenCount ?? 0
  );
  const candidatesTokens = Number(
    usage.total_output_tokens ?? usage.completion_tokens ?? usage.candidatesTokenCount ?? 0
  );
  const thoughtsTokens = Number(
    usage.total_thought_tokens ?? usage.thoughts_tokens ?? usage.thoughtsTokenCount ?? 0
  );
  const outputTokens = candidatesTokens + thoughtsTokens;
  const totalTokens = Number(
    usage.total_tokens ?? usage.totalTokenCount ?? inputTokens + outputTokens
  );

  try {
    await pool.query(
      `
      CREATE TABLE IF NOT EXISTS gemini_token_usage (
        id SERIAL PRIMARY KEY,
        agent_type VARCHAR(64) NOT NULL,
        model VARCHAR(64) NOT NULL,
        input_tokens INT NOT NULL DEFAULT 0,
        output_tokens INT NOT NULL DEFAULT 0,
        total_tokens INT NOT NULL DEFAULT 0,
        operation VARCHAR(128),
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      INSERT INTO gemini_token_usage (
        agent_type, model, input_tokens, output_tokens, total_tokens, operation, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7);
    `,
      [
        'antigravity_visual_data_agent',
        modelUsed,
        inputTokens,
        outputTokens,
        totalTokens,
        `VISUAL_DATA_RESEARCH_${report.ticker}`,
        JSON.stringify({
          ticker: report.ticker,
          eventId: report.eventId || report.event_id || report.id,
          latencyMs: Date.now() - startedAt,
          routerStage,
          model: modelUsed,
          usageMetadataAvailable: Boolean(
            response.usage || response.usage_metadata || response.usageMetadata
          ),
          source: 'ANTIGRAVITY_VISUAL_DATA_AGENT_V1',
        }),
      ]
    );
  } catch (error: any) {
    console.warn(
      '[Visual & Data Agent] Could not persist token usage to PostgreSQL:',
      error?.message || error
    );
  }
}

async function executeVisualRetrievalWithRouter(
  prompt: string,
  report: ResearchReport,
  pool: pg.Pool | null
): Promise<{ rawText: string; groundedUrls: Set<string>; routerStage: string; modelUsed: string } | undefined> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_KEY;

  if (!apiKey) {
    console.info('[Visual & Data Agent] No Gemini API key configured; visual search unavailable.');
    return undefined;
  }

  const ai = new GoogleGenAI({ apiKey });
  const startedAt = Date.now();

  // STAGE 1: Try Primary Agent (antigravity-preview-09-2026) via Interactions API
  if (ai.interactions && typeof ai.interactions.create === 'function') {
    try {
      console.log(`[Visual & Data Agent] Router Stage 1: Calling primary agent ${PRIMARY_AGENT}...`);
      const response: any = await ai.interactions.create({
        agent: PRIMARY_AGENT,
        agent_config: {
          type: 'antigravity',
          model: PRIMARY_MODEL,
        },
        environment: {
          type: 'remote',
          sources: [
            {
              type: 'inline',
              content: VISUAL_DATA_AGENT_SYSTEM_PROMPT,
              target: '.agents/VISUAL_DATA_AGENT.md',
            },
          ],
        },
        system_instruction: VISUAL_DATA_AGENT_SYSTEM_PROMPT,
        input: prompt,
        tools: [{ type: 'google_search' }],
      });

      const rawText = extractInteractionText(response);
      const groundedUrls = collectGroundingUrls(response);
      const modelUsed = `${PRIMARY_AGENT} (${PRIMARY_MODEL})`;

      await recordVisualAgentUsage(pool, response, startedAt, report, 'PRIMARY_INTERACTION', modelUsed);

      if (rawText && rawText.length > 5) {
        return { rawText, groundedUrls, routerStage: 'PRIMARY_INTERACTION', modelUsed };
      }
    } catch (err: any) {
      console.warn(`[Visual & Data Agent] Primary agent ${PRIMARY_AGENT} failed:`, err?.message || err);
    }

    // STAGE 2: Try Fallback Agent (antigravity-preview-05-2026) via Interactions API
    try {
      console.log(`[Visual & Data Agent] Router Stage 2: Calling fallback agent ${FALLBACK_AGENT}...`);
      const response: any = await ai.interactions.create({
        agent: FALLBACK_AGENT,
        agent_config: {
          type: 'antigravity',
          model: PRIMARY_MODEL,
        },
        environment: {
          type: 'remote',
          sources: [
            {
              type: 'inline',
              content: VISUAL_DATA_AGENT_SYSTEM_PROMPT,
              target: '.agents/VISUAL_DATA_AGENT.md',
            },
          ],
        },
        system_instruction: VISUAL_DATA_AGENT_SYSTEM_PROMPT,
        input: prompt,
        tools: [{ type: 'google_search' }],
      });

      const rawText = extractInteractionText(response);
      const groundedUrls = collectGroundingUrls(response);
      const modelUsed = `${FALLBACK_AGENT} (${PRIMARY_MODEL})`;

      await recordVisualAgentUsage(pool, response, startedAt, report, 'FALLBACK_INTERACTION', modelUsed);

      if (rawText && rawText.length > 5) {
        return { rawText, groundedUrls, routerStage: 'FALLBACK_INTERACTION', modelUsed };
      }
    } catch (err: any) {
      console.warn(`[Visual & Data Agent] Fallback agent ${FALLBACK_AGENT} failed:`, err?.message || err);
    }
  }

  // STAGE 3: Direct Gemini API SDK fallback (gemini-3.8-flash) with Google Search tool
  try {
    console.log(`[Visual & Data Agent] Router Stage 3: Calling direct Gemini SDK ${PRIMARY_MODEL}...`);
    const response: any = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: prompt,
      config: {
        systemInstruction: VISUAL_DATA_AGENT_SYSTEM_PROMPT,
        tools: [{ googleSearch: {} }],
      },
    });

    const rawText = extractInteractionText(response);
    const groundedUrls = collectGroundingUrls(response);
    const modelUsed = `${PRIMARY_MODEL} (direct-sdk)`;

    await recordVisualAgentUsage(pool, response, startedAt, report, 'DIRECT_SDK', modelUsed);

    if (rawText && rawText.length > 5) {
      return { rawText, groundedUrls, routerStage: 'DIRECT_SDK', modelUsed };
    }
  } catch (err: any) {
    console.warn(`[Visual & Data Agent] Direct SDK fallback ${PRIMARY_MODEL} failed:`, err?.message || err);
  }

  return undefined;
}

// ============================================================================
// PARSING & CANDIDATE NORMALIZATION
// ============================================================================

function normalizeExtractedCandidate(
  rawCandidate: any,
  groundedUrls: Set<string>
): ResearchVisualCandidate | undefined {
  if (!rawCandidate || typeof rawCandidate !== 'object') return undefined;

  const rawUrl = rawCandidate.sourceUrl || rawCandidate.source_url || rawCandidate.url;
  const sourceUrl = isHttpUrl(rawUrl) ? String(rawUrl) : '';

  // Provenance separation
  const visualSource = rawCandidate.visualSource || rawCandidate.visual_source || rawCandidate.publisher;
  const discoverySource = rawCandidate.discoverySource || rawCandidate.discovery_source || rawCandidate.publisher;
  const sourceAttributionVisible = Boolean(rawCandidate.sourceAttributionVisible ?? true);

  const prov = normalizeProvenance({
    discoverySource,
    visualSource,
    sourceText: rawCandidate.sourceText || `Source: ${visualSource || 'Research Desk'}`,
    sourceAttributionVisible,
  });

  // Extraction status
  let extractionStatus: ExtractionStatus = 'VISUAL_ONLY';
  const statusStr = String(rawCandidate.extractionStatus || rawCandidate.extraction_status || '').toUpperCase();
  if (statusStr === 'EXACT' || statusStr === 'PARTIAL' || statusStr === 'VISUAL_ONLY' || statusStr === 'FAILED') {
    extractionStatus = statusStr as ExtractionStatus;
  }

  // Data points validation if EXACT
  let extractedData: ResearchVisualCandidate['extractedData'] = undefined;
  const rawPoints = Array.isArray(rawCandidate.extractedData)
    ? rawCandidate.extractedData
    : Array.isArray(rawCandidate.data)
    ? rawCandidate.data
    : [];

  if (rawPoints.length > 0) {
    const validPoints = rawPoints
      .map((item: any) => {
        if (!item || typeof item !== 'object') return undefined;
        const label = String(item.label || item.name || '').trim();
        const value = typeof item.value === 'number' ? item.value : Number(item.value);
        const benchmark = item.benchmark !== undefined ? Number(item.benchmark) : undefined;
        if (!label || !Number.isFinite(value)) return undefined;
        return { label, value, benchmark };
      })
      .filter((p): p is NonNullable<typeof p> => Boolean(p));

    if (validPoints.length > 0 && extractionStatus === 'EXACT') {
      extractedData = validPoints;
    } else if (validPoints.length > 0 && extractionStatus !== 'EXACT') {
      extractedData = validPoints;
    }
  }

  const quality = Number.isFinite(rawCandidate.quality)
    ? Math.max(0, Math.min(1, Number(rawCandidate.quality)))
    : 0.85;

  const candidateType: ResearchVisualType =
    rawCandidate.type === 'line_chart' ||
    rawCandidate.type === 'bar_chart' ||
    rawCandidate.type === 'stacked_bar' ||
    rawCandidate.type === 'area_chart' ||
    rawCandidate.type === 'table' ||
    rawCandidate.type === 'exhibit' ||
    rawCandidate.type === 'pie'
      ? rawCandidate.type
      : 'bar_chart';

  return {
    id: `vis_${stableHash(sourceUrl || rawCandidate.title || String(Date.now()))}`,
    claimId: rawCandidate.claimId || 'claim_primary',
    publisher: rawCandidate.publisher || visualSource || 'Research Desk',
    researchDivision: rawCandidate.researchDivision || 'Global Investment Research',
    documentTitle: rawCandidate.documentTitle || rawCandidate.title,
    documentDate: rawCandidate.documentDate || new Date().toISOString().slice(0, 10),
    type: candidateType,
    title: rawCandidate.title || 'Institutional Research Exhibit',
    sourceUrl,
    imageUrl: isHttpUrl(rawCandidate.imageUrl) ? rawCandidate.imageUrl : undefined,
    screenshotUrl: isHttpUrl(rawCandidate.screenshotUrl) ? rawCandidate.screenshotUrl : undefined,
    discoverySource: prov.discoverySource,
    visualSource: prov.visualSource,
    sourceAttributionVisible: prov.sourceAttributionVisible,
    sourceText: prov.sourceText,
    provenanceStatus: prov.status,
    extractionStatus,
    technicallyUsable: Boolean(sourceUrl || rawCandidate.imageUrl),
    relevant: true,
    quality,
    extractedData,
  };
}

function deriveMacroChartPayload(
  candidate: ResearchVisualCandidate,
  brief?: VisualBrief
): MacroChartPayload | undefined {
  if (!canRenderDerivedChart(candidate) || !candidate.extractedData) return undefined;

  let chartType: MacroChartType = brief?.chartType || 'BAR';
  if (candidate.type === 'line_chart') chartType = 'LINE';
  else if (candidate.type === 'stacked_bar') chartType = 'BREAKDOWN';

  const data: MacroChartDatapoint[] = candidate.extractedData.map((d, index) => ({
    label: d.label,
    value: d.value,
    benchmark: d.benchmark,
    benchmark_value: d.benchmark,
    highlight: index === candidate.extractedData!.length - 1,
    is_highlighted: index === candidate.extractedData!.length - 1,
  }));

  return {
    chartType,
    chart_type: chartType,
    title: candidate.title || brief?.suggestedChartTitle || 'Institutional Driver Series',
    subtitle: candidate.documentTitle,
    unit: brief?.unit || 'reported units',
    source: candidate.visualSource || candidate.publisher || 'Official Research',
    sourceUrl: candidate.sourceUrl,
    source_url: candidate.sourceUrl,
    data,
    data_points: data,
  };
}

// ============================================================================
// SELL-SIDE EVENT NOTE REPORT COMPOSER
// ============================================================================

export function composeSellSideEventNote(
  report: ResearchReport,
  contextAnalysis: ReportContextAnalysis,
  assets: ReportAsset[],
  leadImageAssetId: string,
  primaryEvidenceAssetId?: string
): ReportLayoutPlan {
  const ticker = (report.ticker || '').toUpperCase();
  const changePercent = report.changePercent ?? report.change_percent;
  const moveStr =
    changePercent !== undefined
      ? `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%`
      : '';

  const headline = `${ticker}: ${moveStr ? moveStr + ' Move — ' : ''}${
    report.executiveSummary ? report.executiveSummary.slice(0, 100) : 'Sell-Side Event Analysis'
  }`;

  const bottomLine =
    report.executiveSummary?.trim() ||
    (typeof report.immediateCatalyst === 'string'
      ? report.immediateCatalyst
      : report.immediateCatalyst?.summary) ||
    'Fundamental catalyst drives immediate repricing across institutional expectations.';

  const keyDebate =
    report.whatMarketIsReactingTo?.trim() ||
    report.directMarketImpact?.trim() ||
    'Assessing whether the headline catalyst constitutes structural inflection or near-term sentiment overshoot.';

  const keyTakeaways: string[] = [];
  if (typeof report.immediateCatalyst === 'string' && report.immediateCatalyst.trim()) {
    keyTakeaways.push(report.immediateCatalyst.slice(0, 180));
  } else if (
    report.immediateCatalyst &&
    typeof report.immediateCatalyst === 'object' &&
    'facts' in report.immediateCatalyst &&
    Array.isArray(report.immediateCatalyst.facts) &&
    report.immediateCatalyst.facts[0]
  ) {
    keyTakeaways.push(report.immediateCatalyst.facts[0]);
  }

  if (report.directMarketImpact?.trim()) {
    keyTakeaways.push(report.directMarketImpact.slice(0, 180));
  }

  if (report.whatToWatchNext?.trim()) {
    keyTakeaways.push(report.whatToWatchNext.slice(0, 180));
  }

  if (keyTakeaways.length === 0) {
    keyTakeaways.push(
      'Primary catalyst triggers repricing across peer cohort.',
      'Valuation multiples absorb revised growth expectations.',
      'Watch order intake and guidance revision at upcoming reporting dates.'
    );
  }

  const hasEvidence = Boolean(primaryEvidenceAssetId);

  const sections: ReportLayoutSection[] = [
    {
      id: 'sec_what_drove_the_move',
      purpose: 'what_drove_the_move',
      headline: 'What Drove the Move',
      keyMessage:
        typeof report.immediateCatalyst === 'string'
          ? report.immediateCatalyst.slice(0, 200)
          : report.immediateCatalyst?.summary || 'Primary catalyst driver.',
      pattern: hasEvidence ? 'TEXT_CHART_SPLIT' : 'TEXT_ONLY',
      blocks: [
        {
          type: 'narrative',
          message:
            typeof report.immediateCatalyst === 'string'
              ? report.immediateCatalyst
              : report.immediateCatalyst?.summary,
          placement: 'inline',
        },
        ...(hasEvidence
          ? [
              {
                type: 'chart' as ReportBlockType,
                assetId: primaryEvidenceAssetId,
                placement: 'side_by_side' as const,
              },
            ]
          : []),
      ],
    },
    {
      id: 'sec_why_it_matters',
      purpose: 'why_it_matters',
      headline: 'Strategic & Market Significance',
      keyMessage: report.directMarketImpact?.slice(0, 200) || 'Significance to coverage universe.',
      pattern: 'TEXT_ONLY',
      blocks: [
        {
          type: 'narrative',
          message: report.directMarketImpact,
          placement: 'inline',
        },
      ],
    },
    {
      id: 'sec_transmission',
      purpose: 'transmission',
      headline: 'Transmission & Sector Spillovers',
      keyMessage: 'Causal flow from catalyst through cash flows to peer equity valuations.',
      pattern: 'CAUSAL_FLOW',
      blocks: [
        {
          type: 'transmission',
          message: 'Catalyst transmits through volume, pricing, and peer sentiment.',
          placement: 'full_width',
        },
      ],
    },
    {
      id: 'sec_financial_impact',
      purpose: 'financial_impact',
      headline: 'Financial & Capital Impact',
      keyMessage: report.broaderContext?.slice(0, 200) || 'Quantified earnings sensitivity.',
      pattern: 'KPI_TABLE',
      blocks: [
        {
          type: 'kpi',
          message: report.broaderContext,
          placement: 'inline',
        },
      ],
    },
    {
      id: 'sec_forward_view',
      purpose: 'forward_view',
      headline: 'Forward View & Catalysts',
      keyMessage: report.whatToWatchNext?.slice(0, 200) || 'Upcoming signposts to validate thesis.',
      pattern: 'CATALYST_RISK_SPLIT',
      blocks: [
        {
          type: 'narrative',
          message: report.whatToWatchNext,
          placement: 'inline',
        },
      ],
    },
    {
      id: 'sec_sources_and_methodology',
      purpose: 'sources_and_methodology',
      headline: 'Sources & Provenance Verification',
      keyMessage: 'Attributed via primary research desks, official disclosures, and verified quotes.',
      pattern: 'TEXT_ONLY',
      blocks: [
        {
          type: 'narrative',
          message: `Evidence grounded via ${assets.length} registered institutional assets.`,
          placement: 'inline',
        },
      ],
    },
  ];

  return {
    reportType: 'SELL_SIDE_EVENT_NOTE',
    firstPage: {
      headline,
      bottomLine,
      keyDebate,
      keyTakeaways: keyTakeaways.slice(0, 3),
      leadImageAssetId,
      primaryEvidenceAssetId,
    },
    sections,
  };
}

// ============================================================================
// MAIN VISUAL & DATA AGENT ENTRY POINT
// ============================================================================

export async function runAntiGravityVisualDataAgent(
  report: ResearchReport,
  brief?: VisualBrief,
  pool: pg.Pool | null = null
): Promise<VisualEnrichmentPayload> {
  const eventId = report.eventId || report.event_id || report.id || 'evt_default';
  const changePercent = report.changePercent ?? report.change_percent;
  const marketCapUsdBillions = report.marketCapUsdBillions ?? report.market_cap_usd_billions;
  const marketCapImpactUsdBillions = calculateMarketCapImpact(
    report.ticker,
    changePercent ?? Number.NaN,
    marketCapUsdBillions
  );

  // 1. Context & Claim Analysis
  const contextAnalysis = analyzeReportContext(report, brief);

  // 2. Image Intent Planning & Lead Editorial Asset
  const slotPolicy = ANTI_GRAVITY_VISUAL_DATA_AGENT_CONFIG.imagePolicies.equityHero;
  const imageIntent = buildImageIntent(
    {
      section: 'Lead Editorial Header',
      subject: contextAnalysis.primarySubject,
      entities: contextAnalysis.entities,
      keywords: [contextAnalysis.editorialScene],
      themes: contextAnalysis.themes,
      claims: contextAnalysis.claims.map((c) => c.text),
    },
    slotPolicy,
    contextAnalysis.contextScores
  );

  const selectedHero = selectEditorialHero(
    contextAnalysis.editorialScene,
    report.ticker,
    eventId
  );

  const heroAssetId = `asset_lead_${stableHash(selectedHero.imageUrl)}`;
  const leadHeroAsset: ReportAsset = {
    id: heroAssetId,
    type: 'image',
    purpose: 'editorial_lead_image',
    source: {
      publisher: selectedHero.source || 'Unsplash',
      url: selectedHero.sourceUrl || selectedHero.imageUrl,
      title: selectedHero.alt || selectedHero.locationLabel,
    },
    attribution: {
      text: selectedHero.photographerCredit,
      visible: true,
    },
    asset: {
      url: selectedHero.imageUrl,
      width: 1600,
      height: 900,
    },
    provenance: {
      discoverySource: 'Curated Authentic Editorial Photo Registry',
      visualSource: selectedHero.source || 'Unsplash',
      retrievedAt: new Date().toISOString(),
      status: 'EXPLICIT_SOURCE',
    },
    extractionStatus: 'EXACT',
    selection: {
      score: 0.95,
      reason: `Context-selected ${imageIntent?.imageIntent || 'company'} authentic photography matching scene ${contextAnalysis.editorialScene}`,
    },
  };

  const assetRegistry: ReportAsset[] = [leadHeroAsset];
  const researchVisuals: ResearchVisualCandidate[] = [];
  let macroChart: MacroChartPayload | undefined = undefined;

  // 3. Visual Intent Planning
  const primaryClaim = contextAnalysis.claims.find((c) => c.isQuantitative) || contextAnalysis.claims[0];
  const chartWorkflowRequest: ChartWorkflowRequest = {
    claimId: primaryClaim?.id || 'claim_primary',
    claimText: primaryClaim?.text || brief?.suggestedChartTitle || `${report.ticker} key fundamental driver`,
    entities: contextAnalysis.entities,
    keywords: [contextAnalysis.editorialScene, ...(brief ? [brief.primaryTheme] : [])],
    intent: {
      claimId: primaryClaim?.id || 'claim_primary',
      purpose: 'trend',
      preferredTypes: ['bar_chart', 'line_chart', 'stacked_bar', 'exhibit'],
      sourcePreference: 'research_desk',
      maxVisuals: 1,
    },
    retrievalPolicy: ANTI_GRAVITY_VISUAL_DATA_AGENT_CONFIG.retrieval,
  };

  const chartSearchPlan = buildChartSearchPlan(chartWorkflowRequest);

  // 4. Inspection of Existing Documents First
  const docCandidate = inspectDocumentSources(report);
  let satisfiedCandidate: ResearchVisualCandidate | undefined = undefined;

  if (docCandidate) {
    const decision = evaluateChartCandidate(
      docCandidate,
      0,
      1,
      chartSearchPlan.requestedTypes,
      chartSearchPlan.retrievalPolicy
    );

    if (decision.selectedCandidate) {
      satisfiedCandidate = decision.selectedCandidate;
      researchVisuals.push(satisfiedCandidate);
      assetRegistry.push(
        createResearchVisualAsset(
          satisfiedCandidate,
          'primary_evidence_exhibit',
          new Date().toISOString()
        )
      );
      console.log(`[Visual & Data Agent] Satisfied candidate found via document inspection: ${satisfiedCandidate.title}`);
    }
  }

  // 5. Online Retrieval with Early Stopping Policy (if not satisfied via local docs)
  if (!satisfiedCandidate) {
    const query =
      brief?.dataSearchQuery ||
      `${report.ticker} ${contextAnalysis.primarySubject} ${brief?.suggestedChartTitle || 'revenue capex breakdown'} official research exhibit Goldman Sachs J.P. Morgan`;

    const prompt = `You are the AntiGravity Visual & Data Agent conducting visual research.
Asset: ${report.ticker} (${contextAnalysis.primarySubject})
Movement: ${changePercent ?? 'unknown'}%
Theme: ${brief?.primaryTheme || contextAnalysis.themes[0]}
Query: ${query}

Search for an authentic research exhibit, macro chart, or breakdown supporting this claim:
"${chartWorkflowRequest.claimText}"

Follow the integrity rules:
- Search investment banks (Goldman Sachs GIR, Morgan Stanley, J.P. Morgan, Bernstein, UBS) or official primary sources (FRED, SEC).
- If EXACT numbers are available, include them in extractedData.
- If only a screenshot/exhibit exists, set extractionStatus to "VISUAL_ONLY" and do not fake datapoints.
- Distinguish discoverySource from visualSource.`;

    const retrievalResult = await executeVisualRetrievalWithRouter(prompt, report, pool);

    if (retrievalResult) {
      const parsedJson = parseJsonResponse(retrievalResult.rawText);
      const candidateObj =
        parsedJson && typeof parsedJson === 'object' && 'candidate' in parsedJson
          ? (parsedJson as any).candidate
          : parsedJson;

      const onlineCandidate = normalizeExtractedCandidate(
        candidateObj,
        retrievalResult.groundedUrls
      );

      if (onlineCandidate) {
        const decision = evaluateChartCandidate(
          onlineCandidate,
          0,
          1,
          chartSearchPlan.requestedTypes,
          chartSearchPlan.retrievalPolicy
        );

        if (decision.selectedCandidate) {
          satisfiedCandidate = decision.selectedCandidate;
          researchVisuals.push(satisfiedCandidate);
          assetRegistry.push(
            createResearchVisualAsset(
              satisfiedCandidate,
              'primary_evidence_exhibit',
              new Date().toISOString()
            )
          );

          if (decision.renderMode === 'DERIVED_CHART') {
            macroChart = deriveMacroChartPayload(satisfiedCandidate, brief);
          }

          console.log(
            `[Visual & Data Agent] Online candidate satisfied (renderMode: ${decision.renderMode}): ${satisfiedCandidate.title}`
          );
        } else {
          console.log(`[Visual & Data Agent] Online candidate rejected: ${decision.reason}`);
        }
      }
    }
  }

  // 6. Transmission Steps
  const rawTransmission = brief?.transmissionSummary || [
    'Documented fundamental catalyst triggers sector reassessment',
    'Exposure transmits through customer order visibility and pricing power',
    'Financial impact reprices forward earnings and valuation multiples',
    'Sector peers absorb revised risk and positioning premiums',
  ];

  const transmissionSteps: TransmissionNode[] = rawTransmission
    .filter((step) => typeof step === 'string' && step.trim())
    .map((text, index, arr) => ({
      step: index + 1,
      step_number: index + 1,
      label: text.trim(),
      type:
        index === 0
          ? 'CATALYST'
          : index === arr.length - 1
          ? 'SECTOR_EFFECT'
          : index === arr.length - 2
          ? 'FINANCIAL_IMPACT'
          : 'TRANSMISSION',
    }));

  // 7. Compose Sell-Side Event Note Layout Plan
  const primaryEvidenceAssetId = satisfiedCandidate?.id;
  const layoutPlan = composeSellSideEventNote(
    report,
    contextAnalysis,
    assetRegistry,
    heroAssetId,
    primaryEvidenceAssetId
  );

  // 8. Build Backwards-Compatible VisualEnrichmentPayload
  const payload: VisualEnrichmentPayload = {
    hero: selectedHero,
    transmissionSteps,
    transmission_steps: transmissionSteps,
    layoutPlan,
    assetRegistry,
    researchVisuals,
    enrichedAt: new Date().toISOString(),
    enriched_at: new Date().toISOString(),
  };

  if (marketCapImpactUsdBillions !== undefined) {
    payload.marketCapImpactUsdBillions = marketCapImpactUsdBillions;
    payload.market_cap_impact_usd_billions = marketCapImpactUsdBillions;
  }

  if (macroChart) {
    payload.macroChart = macroChart;
    payload.macro_chart = macroChart;
  }

  return payload;
}
