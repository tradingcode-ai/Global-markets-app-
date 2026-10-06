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
