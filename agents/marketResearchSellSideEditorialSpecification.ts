/**
 * Sell-Side Editorial & Writing Architecture
 *
 * Scope:
 * - Market Research Agent only.
 * - Defines WHAT a SELL_SIDE_EVENT_NOTE must communicate and HOW it is written.
 * - Does not decide chart/image placement, page geometry, or visual layout.
 * - The Visual & Data Agent consumes this structured output through a shared
 *   semantic Event Note contract.
 */

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

export interface ResearchSection {
  purpose: EventNoteSectionPurpose;
  headline: string;
  keyMessage: string;
  claimIds: string[];
  paragraphs: string[];
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

export interface SellSideEventNoteResearch {
  reportType: 'SELL_SIDE_EVENT_NOTE';
  event: {
    asset: string;
    ticker?: string;
    eventDate: string;
    marketMove?: number;
  };
  headline: string;
  bottomLine: string;
  keyDebate: string;
  keyTakeaways: string[];
  sections: ResearchSection[];
  catalysts: Catalyst[];
  risks: Risk[];
  whatWouldChangeOurView: string[];
  claims: ResearchClaim[];
}

/**
 * Core editorial sequence:
 *
 * CLAIM
 *   -> EVIDENCE
 *   -> INTERPRETATION
 *   -> MARKET / FINANCIAL IMPLICATION
 *   -> WHAT TO WATCH
 *
 * The note should not merely summarize news. It should explain why the event
 * matters to the asset, earnings, valuation, expectations or market debate.
 */
export const SELL_SIDE_EDITORIAL_FLOW = [
  'Claim',
  'Evidence',
  'Interpretation',
  'Market / Financial Implication',
  'What To Watch',
] as const;

export const SELL_SIDE_EVENT_NOTE_CONTENT_CONTRACT = {
  reportType: 'SELL_SIDE_EVENT_NOTE',
  required: [
    'headline',
    'bottomLine',
    'keyDebate',
    'keyTakeaways',
    'whatDroveTheMove',
    'whyItMatters',
    'forwardView',
    'catalysts',
    'risks',
    'whatWouldChangeOurView',
    'claims',
  ],
  optionalWhenMaterialAndSupported: [
    'transmission',
    'financialImpact',
  ],
  maxKeyTakeaways: 3,
} as const;

/**
 * Tone target:
 * - institutional and concise;
 * - analytical rather than promotional;
 * - informed enough for a professional market reader;
 * - allowed to become moderately journalistic when describing a developing,
 *   disputed or not-yet-confirmed event;
 * - never converts reporting, allegations or claims into established fact.
 */
export const SELL_SIDE_WRITING_STYLE = {
  bottomLineFirst: true,
  analyticalDefault: true,
  conciseParagraphs: true,
  assumeFinanciallyLiterateReader: true,
  avoidGenericMarketBackground: true,
  avoidPromotionalLanguage: true,
  avoidArtificialDrama: true,
  allowMeasuredJournalisticNarrativeForDevelopingEvents: true,
  distinguishFactFromReportingFromInterpretation: true,
  quantifyWhenVerified: true,
  neverFillMissingNumbers: true,
  conclusionStyleSectionHeadlines: true,
} as const;

/**
 * Headline policy:
 *
 * Report headline:
 * - identify the event/debate and its investment relevance;
 * - may use restrained journalistic language when the event is developing;
 * - must not state an unconfirmed allegation as fact.
 *
 * Section headline:
 * - state the analytical conclusion rather than a generic topic.
 *
 * Strong:
 * "China remains material, but headline exposure overstates near-term
 * earnings sensitivity"
 *
 * Weak:
 * "China Exposure"
 */
export const HEADLINE_RULES = {
  reportHeadlineMayBeEditorial: true,
  sectionHeadlineMustBeAnalyticalConclusion: true,
  noClickbait: true,
  noSensationalism: true,
  noUnsupportedCausality: true,
  noUnconfirmedClaimPresentedAsFact: true,
} as const;

/**
 * Certainty controls wording.
 *
 * CONFIRMED:
 *   State directly when supported by an authoritative source.
 *
 * REPORTED:
 *   Attribute: "Reuters reported...", "According to..."
 *
 * CLAIMED:
 *   Preserve the claimant: "The company said...", "Officials claimed..."
 *
 * INFERRED:
 *   Signal analysis: "This suggests...", "Our interpretation is...",
 *   "The move appears consistent with..."
 *
 * UNKNOWN:
 *   Say what is not yet established. Do not resolve the uncertainty yourself.
 */
export const CERTAINTY_LANGUAGE: Record<ResearchCertainty, {
  mayStateAsFact: boolean;
  attributionRequired: boolean;
  preferredLanguage: readonly string[];
}> = {
  CONFIRMED: {
    mayStateAsFact: true,
    attributionRequired: false,
    preferredLanguage: ['confirmed', 'disclosed', 'reported in official data'],
  },
  REPORTED: {
    mayStateAsFact: false,
    attributionRequired: true,
    preferredLanguage: ['reported', 'according to', 'was reported by'],
  },
  CLAIMED: {
    mayStateAsFact: false,
    attributionRequired: true,
    preferredLanguage: ['said', 'stated', 'claimed', 'according to'],
  },
  INFERRED: {
    mayStateAsFact: false,
    attributionRequired: false,
    preferredLanguage: [
      'suggests',
      'appears consistent with',
      'our interpretation is',
      'may imply',
    ],
  },
  UNKNOWN: {
    mayStateAsFact: false,
    attributionRequired: false,
    preferredLanguage: [
      'has not been confirmed',
      'remains unclear',
      'cannot yet be established',
    ],
  },
} as const;

/**
 * Developing-event writing may read somewhat more like financial journalism,
 * but attribution and epistemic status must remain visible in the prose.
 *
 * Acceptable:
 * "Reuters reported that officials are considering additional restrictions.
 * The scope has not been confirmed. If implemented as reported, the measures
 * could increase uncertainty around..."
 *
 * Not acceptable:
 * "Officials imposed new restrictions..." when only a report/claim exists.
 */
export const DEVELOPING_EVENT_RULES = {
  allowNarrativeLead: true,
  requireAttributionForReportedInformation: true,
  retainSourceQualifierNearMaterialClaim: true,
  explicitlyStateWhatRemainsUnconfirmed: true,
  separateReportedEventFromInvestmentInterpretation: true,
  conditionalizeImplicationsWhenEventIsUnconfirmed: true,
  neverUpgradeRumorToFact: true,
  neverUpgradeClaimToConfirmation: true,
} as const;

/**
 * Bottom Line should normally answer, in compact form:
 * 1. What happened?
 * 2. What is confirmed vs reported/claimed?
 * 3. Why did the market care?
 * 4. What is the investment implication?
 * 5. What matters next?
 */
export const BOTTOM_LINE_RULES = {
  leadWithEventAndInvestmentMeaning: true,
  distinguishConfirmedFromUnconfirmed: true,
  explainMarketRelevance: true,
  stateImplicationWithoutOverclaiming: true,
  endWithKeyWatchItemWhenUseful: true,
  avoidChronologicalNewsRecap: true,
} as const;

/**
 * The Key Debate is the investment question the Event Note resolves or frames.
 * It should create analytical tension, not repeat the event headline.
 */
export const KEY_DEBATE_RULES = {
  phraseAsInvestmentQuestionOrTension: true,
  connectToExpectationsEarningsValuationOrPositioning: true,
  avoidRepeatingHeadline: true,
  avoidFalseBinaryWhenEvidenceIsMixed: true,
} as const;

export const QUANTITATIVE_WRITING_RULES = {
  preferExactVerifiedNumbersOverQualitativeAdjectives: true,
  preserveUnitsCurrencyPeriodAndBasis: true,
  distinguishActualEstimateGuidanceAndConsensus: true,
  neverInventMissingValues: true,
  neverBacksolveUnstatedFiguresWithoutExplicitMethodology: true,
  neverUseSyntheticFallbackFinancialData: true,
  labelPrePublicDataWhenApplicable: true,
} as const;

export const ATTRIBUTION_RULES = {
  sourceMaterialClaims: true,
  nameOriginalSourceWhenKnown: true,
  doNotPresentDiscoveryHostAsOriginalSource: true,
  distinguishCompanyStatementFromIndependentConfirmation: true,
  distinguishMediaReportFromOfficialConfirmation: true,
  keepMaterialAttributionCloseToUnconfirmedClaim: true,
} as const;

/**
 * The agent must not manufacture the voice of a brokerage analyst when the
 * underlying system does not actually maintain the required model/rating.
 */
export const ANALYST_VOICE_GUARDRAILS = {
  noFakeBuyHoldSellRating: true,
  noFakePriceTarget: true,
  noFakeEarningsEstimate: true,
  noFakeHouseView: true,
  noFakeModelRevision: true,
  useMarketImplicationInsteadWhenAppropriate: true,
  useBaseCaseInterpretationInsteadWhenAppropriate: true,
  onlySayOurEstimateWhenAnActualTraceableModelEstimateExists: true,
} as const;

export const PARAGRAPH_ARCHITECTURE = {
  onePrimaryIdeaPerParagraph: true,
  leadSentenceCarriesConclusion: true,
  evidenceImmediatelySupportsConclusion: true,
  interpretationSeparatedFromRawFactWhenAmbiguous: true,
  implicationFollowsEvidence: true,
  avoidLongSceneSettingIntroductions: true,
  avoidRepeatedSummaryAcrossSections: true,
} as const;

export const FORWARD_VIEW_RULES = {
  identifyNextObservableCatalysts: true,
  distinguishKnownDatesFromEstimatedTiming: true,
  identifyWhatWouldConfirmInterpretation: true,
  identifyWhatWouldInvalidateInterpretation: true,
  avoidFalsePrecision: true,
  avoidUnsupportedPrediction: true,
} as const;

export const EDITORIAL_INTEGRITY_RULES = {
  neverFabricateFacts: true,
  neverFabricateQuotes: true,
  neverFabricateNumbers: true,
  neverConvertReportedIntoConfirmed: true,
  neverConvertClaimedIntoConfirmed: true,
  neverHideMaterialUncertainty: true,
  neverUseCertaintyLanguageBeyondEvidence: true,
  neverAttributeCausalityWithoutSupport: true,
  neverImitateARealBankOrAnalystIdentity: true,
  preserveSourceAttribution: true,
} as const;

/**
 * Semantic hand-off to the Visual & Data Agent.
 *
 * The Research Agent owns these meanings. The Visual & Data Agent may map
 * them to charts, exhibits, images and layout patterns, but must not rewrite
 * the underlying facts merely to fit the composition.
 */
export const VISUAL_DATA_HANDOFF_CONTRACT = {
  provideStructuredClaims: true,
  provideCertaintyPerClaim: true,
  provideSectionPurposePerClaim: true,
  provideBottomLine: true,
  provideKeyDebate: true,
  provideKeyTakeaways: true,
  provideCatalystsAndRisks: true,
  provideViewInvalidators: true,
  visualAgentOwnsLayoutPlacement: true,
  visualAgentMustPreserveResearchMeaning: true,
} as const;
