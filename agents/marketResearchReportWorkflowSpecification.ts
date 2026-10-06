/**
 * Market Research Report Workflow Specification
 *
 * End-to-end orchestration contract for SELL_SIDE_EVENT_NOTE reports.
 *
 * This module intentionally does not own:
 * - research facts or editorial prose;
 * - chart/image discovery implementations;
 * - visual rendering implementation.
 *
 * It defines how those responsibilities connect.
 */

export type ReportWorkflowStage =
  | 'RESEARCH'
  | 'VISUAL_DATA'
  | 'COMPOSITION'
  | 'RENDER'
  | 'COMPLETE';

export type ReportWorkflowOwner =
  | 'MARKET_RESEARCH_AGENT'
  | 'VISUAL_DATA_AGENT'
  | 'REPORT_COMPOSER'
  | 'REPORT_RENDERER';

export type ReportType = 'SELL_SIDE_EVENT_NOTE';

export type EvidenceAssetType =
  | 'research_exhibit'
  | 'verified_chart'
  | 'financial_table'
  | 'analytical_diagram'
  | 'editorial_image';

export type ClaimCertainty =
  | 'CONFIRMED'
  | 'REPORTED'
  | 'CLAIMED'
  | 'INFERRED'
  | 'UNKNOWN';

export interface WorkflowClaim {
  id: string;
  text: string;
  certainty: ClaimCertainty;
  sourceIds: string[];
}

export interface StructuredResearchReport {
  reportType: ReportType;
  headline: string;
  bottomLine: string;
  keyDebate: string;
  keyTakeaways: string[];
  claims: WorkflowClaim[];
  sectionIds: string[];
}

export interface WorkflowAsset {
  id: string;
  type: EvidenceAssetType;
  claimIds: string[];
  sourceUrl?: string;
  attribution?: string;
  provenanceStatus:
    | 'EXPLICIT_SOURCE'
    | 'ATTRIBUTED_SOURCE'
    | 'UNKNOWN_SOURCE';
}

export interface AssetRegistry {
  assets: WorkflowAsset[];
}

export interface ReportLayoutPlan {
  reportType: ReportType;
  sectionOrder: string[];
  leadImageAssetId?: string;
  primaryEvidenceBySection: Record<string, string | undefined>;
  supportingImageAssetIds: string[];
}

export interface ReportWorkflowState {
  stage: ReportWorkflowStage;
  researchReport?: StructuredResearchReport;
  assetRegistry?: AssetRegistry;
  layoutPlan?: ReportLayoutPlan;
  rendered: boolean;
}

export const MARKET_RESEARCH_REPORT_WORKFLOW = [
  'Market Research Agent',
  'Structured ResearchReport',
  'Visual & Data Agent',
  'Asset Registry',
  'Report Composer',
  'ReportLayoutPlan',
  'Report Renderer',
  'Final Sell-Side Event Note',
] as const;

/**
 * Responsibility architecture
 *
 * MARKET RESEARCH AGENT
 * ├─ Research architecture
 * ├─ Sell-side editorial / writing architecture
 * ├─ Claims + certainty + source linkage
 * └─ Structured ResearchReport
 *          ↓
 * SHARED SEMANTIC EVENT NOTE CONTRACT
 *          ↓
 * VISUAL & DATA AGENT
 * ├─ Chart / research visual architecture
 * ├─ Image architecture
 * ├─ Evidence / provenance
 * └─ Asset Registry
 *          ↓
 * REPORT COMPOSER
 * ├─ Investment-story ordering
 * ├─ Evidence mapping
 * ├─ Layout-pattern selection
 * ├─ Density / hierarchy decisions
 * └─ ReportLayoutPlan
 *          ↓
 * REPORT RENDERER
 * ├─ Pure presentation
 * ├─ No fact rewriting
 * ├─ No asset invention
 * └─ Final Sell-Side Event Note
 */
export const REPORT_WORKFLOW_RESPONSIBILITIES = {
  MARKET_RESEARCH_AGENT: {
    owns: [
      'research facts',
      'claim wording',
      'certainty classification',
      'source linkage',
      'sell-side editorial structure',
      'headline',
      'bottom line',
      'key debate',
      'key takeaways',
      'forward view',
      'catalysts',
      'risks',
      'view invalidators',
    ],
    mustNotOwn: [
      'page geometry',
      'image placement',
      'chart placement',
      'visual density',
      'physical report composition',
    ],
  },

  VISUAL_DATA_AGENT: {
    owns: [
      'research visual discovery',
      'chart evidence',
      'image discovery',
      'asset validation',
      'asset provenance',
      'claim-to-asset linkage',
      'Asset Registry',
    ],
    mustNotOwn: [
      'rewriting research conclusions',
      'inventing missing financial data',
      'changing claim certainty',
    ],
  },

  REPORT_COMPOSER: {
    owns: [
      'investment-story ordering',
      'section purpose resolution',
      'evidence mapping',
      'layout pattern selection',
      'visual hierarchy',
      'content density',
      'ReportLayoutPlan',
    ],
    mustNotOwn: [
      'new research claims',
      'new financial metrics',
      'source fabrication',
      'provenance rewriting',
    ],
  },

  REPORT_RENDERER: {
    owns: [
      'rendering ReportLayoutPlan',
      'typography',
      'spacing',
      'responsive presentation',
      'figure/source display',
    ],
    mustNotOwn: [
      'semantic research decisions',
      'asset selection',
      'claim rewriting',
      'evidence creation',
    ],
  },
} as const;

export const SELL_SIDE_EVENT_NOTE_WORKFLOW = {
  reportType: 'SELL_SIDE_EVENT_NOTE' as const,

  researchContract: {
    required: [
      'headline',
      'bottomLine',
      'keyDebate',
      'keyTakeaways',
      'claims',
    ],
    maxKeyTakeaways: 3,
  },

  composition: {
    firstPageMustAnswer: [
      'What happened?',
      'Why?',
      'What is the evidence?',
      'Why does it matter?',
      'What happens next?',
    ],
    sectionHeadlinesAreConclusions: true,
    onePrimaryConclusionPerSection: true,
    maxDominantVisualsPerSection: 1,
  },

  imagePolicy: {
    leadImage: {
      required: true,
      placement: 'first_page',
      size: 'compact',
      approximatePageSharePercent: {
        min: 25,
        max: 35,
      },
      fullBleed: false,
      backgroundHero: false,
    },
    supportingImages: {
      min: 0,
      max: 2,
      onlyWhenAdditive: true,
    },
    maxTotalImages: 3,
  },

  evidencePriority: [
    'research_exhibit',
    'verified_chart',
    'financial_table',
    'analytical_diagram',
    'editorial_image',
  ] as const,
} as const;

export const REPORT_WORKFLOW_GATES = {
  beforeVisualData: [
    'ResearchReport exists',
    'claims retain certainty classification',
    'material claims retain source linkage',
  ],

  beforeComposition: [
    'Asset Registry contains only validated assets',
    'financial visuals retain provenance',
    'assets remain linked to supporting claims',
  ],

  beforeRender: [
    'ReportLayoutPlan exists',
    'layout does not require invented content',
    'source lines are preserved for evidence',
  ],

  beforeComplete: [
    'renderer did not rewrite research facts',
    'renderer did not invent assets or metrics',
    'unconfirmed claims remain explicitly qualified',
  ],
} as const;

export function canAdvanceWorkflow(
  state: ReportWorkflowState,
): boolean {
  switch (state.stage) {
    case 'RESEARCH':
      return Boolean(state.researchReport);

    case 'VISUAL_DATA':
      return Boolean(state.researchReport && state.assetRegistry);

    case 'COMPOSITION':
      return Boolean(
        state.researchReport &&
        state.assetRegistry &&
        state.layoutPlan,
      );

    case 'RENDER':
      return Boolean(state.layoutPlan && state.rendered);

    case 'COMPLETE':
      return true;
  }
}

export function getNextWorkflowOwner(
  stage: ReportWorkflowStage,
): ReportWorkflowOwner | null {
  switch (stage) {
    case 'RESEARCH':
      return 'MARKET_RESEARCH_AGENT';
    case 'VISUAL_DATA':
      return 'VISUAL_DATA_AGENT';
    case 'COMPOSITION':
      return 'REPORT_COMPOSER';
    case 'RENDER':
      return 'REPORT_RENDERER';
    case 'COMPLETE':
      return null;
  }
}

export const REPORT_WORKFLOW_INTEGRITY_RULES = [
  'Never rewrite research facts to satisfy layout constraints.',
  'Never create a metric because a layout slot is empty.',
  'Never invent, estimate, interpolate, or simulate financial data.',
  'Never use editorial photography as evidence for a financial claim.',
  'Never hide or detach source attribution from a financial visual.',
  'Never upgrade REPORTED or CLAIMED information to CONFIRMED.',
  'Never let the renderer select or fabricate evidence.',
  'Never prefer aesthetics over evidence integrity.',
  'Preserve claim-to-source and claim-to-asset linkage end to end.',
  'The Report Composer is a deterministic composition layer, not an independent research agent.',
] as const;

/**
 * Runtime target:
 *
 * ResearchReport + Asset Registry
 *              ↓
 *       Report Composer
 *              ↓
 *       ReportLayoutPlan
 *              ↓
 *        Report Renderer
 *
 * Existing renderers should eventually consume ReportLayoutPlan rather than
 * independently deciding report semantics, evidence selection, or composition.
 */
export const REPORT_WORKFLOW_RUNTIME_TARGET = {
  composerInput: ['ResearchReport', 'Asset Registry'],
  composerOutput: 'ReportLayoutPlan',
  rendererInput: 'ReportLayoutPlan',
  rendererRole: 'presentational',
} as const;
