import assert from 'node:assert';
import {
  ANTI_GRAVITY_VISUAL_DATA_AGENT_CONFIG,
  RESEARCH_VISUAL_SOURCE_STRATEGY,
  DOCUMENT_INSPECTION_SIGNALS,
  VISUAL_RETRIEVAL_ORDER,
  VISUAL_AGENT_INTEGRITY_RULES,
  CHART_WORKFLOW,
  CHART_DISCOVERY_RULES,
  IMAGE_ELEMENT_TAXONOMY,
  IMAGE_REQUIREMENT_PRESETS,
  IMAGE_WORKFLOW,
  IMAGE_ARCHITECTURE_RULES,
  SELL_SIDE_EVENT_NOTE_COMPOSITION,
  SELL_SIDE_SECTION_RULES,
  SELL_SIDE_EVENT_NOTE_SECTION_ORDER,
  EVENT_NOTE_IMAGE_COMPOSITION_POLICY,
  EDITORIAL_HERO_ALLOWED_HOSTS,
  EDITORIAL_HERO_REGISTRY,
  isAllowedEditorialHeroUrl,
  selectEditorialHero,
  calculateMarketCapImpact,
  isVisualCandidateSatisfied,
  shouldStopRetrieval,
  canRenderDerivedChart,
  shouldUseOriginalResearchVisual,
  normalizeProvenance,
  buildResearchVisualAttribution,
  buildChartSearchPlan,
  selectChartRenderMode,
  evaluateChartCandidate,
  createResearchVisualAsset,
  imageMeetsTechnicalRequirements,
  rankImageCandidates,
  selectImageElements,
  buildImageIntent,
  selectImagesForSlot,
  selectLayoutPattern,
  assetEvidencePriority,
  preferEvidenceOverEditorialImage,
  analyzeReportContext,
  inspectDocumentSources,
  composeSellSideEventNote,
  runAntiGravityVisualDataAgent,
} from '../services/antiGravityVisualDataAgent';


import type {
  ResearchReport,
  VisualBrief,
  ResearchVisualCandidate,
  ReportAsset,
  ImageCandidate,
  ImageSlotPolicy,
} from '../types/marketResearch';

async function runAllTests() {
  console.log('===============================================================');
  console.log('RUNNING AntiGravity Visual & Data Agent Verification Test Suite');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    return Promise.resolve()
      .then(() => fn())
      .then(() => {
        console.log(`[PASS] ${name}`);
        passed++;
      })
      .catch((err) => {
        console.error(`[FAIL] ${name}:`, err.message || err);
        failed++;
      });
  }

  // TEST 1: Constants and Configuration Verification
  await test('Configuration & Policies matches specification', () => {
    assert.strictEqual(ANTI_GRAVITY_VISUAL_DATA_AGENT_CONFIG.retrieval.maxCount, 1);
    assert.strictEqual(ANTI_GRAVITY_VISUAL_DATA_AGENT_CONFIG.retrieval.stopWhenSatisfied, true);
    assert.strictEqual(ANTI_GRAVITY_VISUAL_DATA_AGENT_CONFIG.retrieval.minQualityScore, 0.8);
    assert.strictEqual(ANTI_GRAVITY_VISUAL_DATA_AGENT_CONFIG.integrity.forbidSyntheticFinancialData, true);
    assert.strictEqual(ANTI_GRAVITY_VISUAL_DATA_AGENT_CONFIG.integrity.forbidRandomFallbackData, true);
    assert.strictEqual(ANTI_GRAVITY_VISUAL_DATA_AGENT_CONFIG.integrity.requireExactSourceAttribution, true);
    assert.strictEqual(ANTI_GRAVITY_VISUAL_DATA_AGENT_CONFIG.integrity.requireDocumentInspectionBeforeChartClaim, true);
    assert.strictEqual(ANTI_GRAVITY_VISUAL_DATA_AGENT_CONFIG.integrity.allowOriginalVisualWhenDataNotExtractable, true);

    // Preferred investment banks
    assert(RESEARCH_VISUAL_SOURCE_STRATEGY.preferredBanks.includes('Goldman Sachs'));
    assert(RESEARCH_VISUAL_SOURCE_STRATEGY.preferredBanks.includes('Morgan Stanley'));
    assert(RESEARCH_VISUAL_SOURCE_STRATEGY.preferredBanks.includes('J.P. Morgan'));

    // Image taxonomy
    assert.deepStrictEqual(Object.keys(IMAGE_ELEMENT_TAXONOMY).sort(), [
      'company',
      'industry_context',
      'operations',
      'product_technology',
    ].sort());
  });

  // TEST 2: Early Stopping Policy
  await test('Early stopping policy stops immediately when maxCount satisfied', () => {
    const policy = {
      maxCount: 1,
      maxSearches: 10,
      stopWhenSatisfied: true,
      minQualityScore: 0.8,
    };

    // Before any selection and candidate not satisfied -> should NOT stop
    assert.strictEqual(shouldStopRetrieval(0, 1, false, policy), false);

    // Before any selection but candidate satisfied -> with maxCount=1, selectedCount + 1 >= 1 -> SHOULD STOP!
    assert.strictEqual(shouldStopRetrieval(0, 1, true, policy), true);

    // Selected count already satisfies maxCount -> SHOULD STOP
    assert.strictEqual(shouldStopRetrieval(1, 1, false, policy), true);

    // Search count exceeds maxSearches -> SHOULD STOP
    assert.strictEqual(shouldStopRetrieval(0, 10, false, policy), true);
  });

  // TEST 3: Provenance Logic & Source Separation
  await test('normalizeProvenance and buildResearchVisualAttribution separate discovery from visual source', () => {
    // Case A: Discovered via ZeroHedge, original source Goldman Sachs GIR with visible attribution
    const provA = normalizeProvenance({
      discoverySource: 'ZeroHedge',
      visualSource: 'Goldman Sachs Global Investment Research',
      sourceText: 'Source: Goldman Sachs GIR Exhibit 4',
      sourceAttributionVisible: true,
    });

    assert.strictEqual(provA.status, 'EXPLICIT_SOURCE');
    assert.strictEqual(provA.discoverySource, 'ZeroHedge');
    assert.strictEqual(provA.visualSource, 'Goldman Sachs Global Investment Research');

    const assetA: Pick<ReportAsset, 'source' | 'provenance'> = {
      source: {
        publisher: 'Goldman Sachs',
        researchDivision: 'Global Investment Research',
        url: 'https://zerohedge.com/markets/hyperscaler-capex-surge',
      },
      provenance: {
        discoverySource: 'ZeroHedge',
        visualSource: 'Goldman Sachs Global Investment Research',
        retrievedAt: new Date().toISOString(),
        status: provA.status,
      },
    };

    const attributionA = buildResearchVisualAttribution(assetA);
    assert.strictEqual(
      attributionA,
      'Source: Goldman Sachs Global Investment Research. Visual discovered via ZeroHedge.'
    );

    // Case B: Direct official source where discovery and visual source match
    const provB = normalizeProvenance({
      discoverySource: 'Morgan Stanley Research',
      visualSource: 'Morgan Stanley Research',
      sourceAttributionVisible: true,
    });
    assert.strictEqual(provB.status, 'EXPLICIT_SOURCE');

    const assetB: Pick<ReportAsset, 'source' | 'provenance'> = {
      source: {
        publisher: 'Morgan Stanley',
        url: 'https://morganstanley.com/research/semis',
      },
      provenance: {
        discoverySource: 'Morgan Stanley Research',
        visualSource: 'Morgan Stanley Research',
        retrievedAt: new Date().toISOString(),
        status: provB.status,
      },
    };
    const attributionB = buildResearchVisualAttribution(assetB);
    assert.strictEqual(attributionB, 'Source: Morgan Stanley Research.');

    // Case C: Unknown source
    const provC = normalizeProvenance({
      discoverySource: 'SomeForum',
      sourceAttributionVisible: false,
    });
    assert.strictEqual(provC.status, 'UNKNOWN_SOURCE');
  });

  // TEST 4: Integrity Rules & Render Mode Selection
  await test('Integrity rules: EXACT allows derived chart, VISUAL_ONLY forces original visual, synthetic data forbidden', () => {
    // EXACT extraction with points
    const exactCandidate: ResearchVisualCandidate = {
      id: 'vis_exact_1',
      type: 'bar_chart',
      sourceUrl: 'https://example.com/source',
      provenanceStatus: 'EXPLICIT_SOURCE',
      extractionStatus: 'EXACT',
      technicallyUsable: true,
      relevant: true,
      quality: 0.95,
      extractedData: [
        { label: 'Hyperscalers', value: 180, benchmark: 140 },
        { label: 'Enterprise', value: 45, benchmark: 40 },
      ],
      sourceAttributionVisible: true,
    };

    assert.strictEqual(canRenderDerivedChart(exactCandidate), true);
    assert.strictEqual(selectChartRenderMode(exactCandidate), 'DERIVED_CHART');

    // EXACT extraction without points cannot render derived chart
    const exactEmpty: ResearchVisualCandidate = {
      ...exactCandidate,
      extractedData: [],
    };
    assert.strictEqual(canRenderDerivedChart(exactEmpty), false);
    assert.strictEqual(selectChartRenderMode(exactEmpty), 'NO_VISUAL');

    // VISUAL_ONLY with imageUrl
    const visualOnlyCandidate: ResearchVisualCandidate = {
      id: 'vis_vo_1',
      type: 'exhibit',
      sourceUrl: 'https://example.com/source',
      imageUrl: 'https://example.com/chart.png',
      provenanceStatus: 'EXPLICIT_SOURCE',
      extractionStatus: 'VISUAL_ONLY',
      technicallyUsable: true,
      relevant: true,
      quality: 0.88,
      sourceAttributionVisible: true,
    };

    assert.strictEqual(canRenderDerivedChart(visualOnlyCandidate), false);
    assert.strictEqual(shouldUseOriginalResearchVisual(visualOnlyCandidate), true);
    assert.strictEqual(selectChartRenderMode(visualOnlyCandidate), 'ORIGINAL_RESEARCH_VISUAL');

    // FAILED extraction
    const failedCandidate: ResearchVisualCandidate = {
      ...visualOnlyCandidate,
      extractionStatus: 'FAILED',
    };
    assert.strictEqual(selectChartRenderMode(failedCandidate), 'NO_VISUAL');

    // UNKNOWN_SOURCE must be rejected
    const unknownCandidate: ResearchVisualCandidate = {
      ...exactCandidate,
      provenanceStatus: 'UNKNOWN_SOURCE',
    };
    assert.strictEqual(selectChartRenderMode(unknownCandidate), 'NO_VISUAL');
  });

  // TEST 5: Candidate Evaluation & Workflow Decision
  await test('evaluateChartCandidate follows retrieval policies and triggers complete on satisfaction', () => {
    const candidate: ResearchVisualCandidate = {
      id: 'vis_test_1',
      type: 'bar_chart',
      sourceUrl: 'https://example.com/chart',
      provenanceStatus: 'EXPLICIT_SOURCE',
      extractionStatus: 'EXACT',
      technicallyUsable: true,
      relevant: true,
      quality: 0.9,
      extractedData: [{ label: 'Q1', value: 100 }],
      sourceAttributionVisible: true,
    };

    const decision = evaluateChartCandidate(
      candidate,
      0, // selectedCount = 0
      1, // searchCount = 1
      ['bar_chart', 'line_chart'],
      ANTI_GRAVITY_VISUAL_DATA_AGENT_CONFIG.retrieval
    );

    assert.strictEqual(decision.stage, 'COMPLETE');
    assert.strictEqual(decision.continueRetrieval, false);
    assert.strictEqual(decision.renderMode, 'DERIVED_CHART');
    assert(decision.selectedCandidate !== undefined);
  });

  // TEST 6: Context Analysis and Taxonomy Scoring
  await test('analyzeReportContext identifies semiconductor theme and scores product/technology correctly', () => {
    const asmlReport: ResearchReport = {
      id: 'rep_asml',
      ticker: 'ASML',
      assetName: 'ASML Holding N.V.',
      changePercent: -4.8,
      marketCapUsdBillions: 320,
      executiveSummary: 'ASML lowers 2025 net bookings guidance citing slower foundry recovery and EUV delay in non-AI nodes.',
      immediateCatalyst: 'Q3 net bookings of €2.63B fell significantly below €5.4B consensus expectations.',
      directMarketImpact: 'Global semiconductor equipment peers (LRCX, AMAT, KLA) fall 3-5% on downstream wafer fab capex deceleration.',
      broaderContext: 'China customer revenue concentration remains high at 47% of total sales before 2025 export restrictions.',
      whatMarketIsReactingTo: 'Debate centers on whether memory fab delay represents structural AI saturation or cyclical inventory overhang.',
      whatToWatchNext: 'Watch TSMC Q3 earnings capex commentary and memory OEM node roadmap updates.',
      confidence: 'HIGH',
      status: 'COMPLETED',
      sources: [
        {
          title: 'ASML Q3 2024 Earnings Release and Deck',
          publisher: 'ASML Investor Relations',
          url: 'https://asml.com/investors',
        },
      ],
    };

    const analysis = analyzeReportContext(asmlReport);
    assert.strictEqual(analysis.editorialScene, 'SEMICONDUCTOR_CLEANROOM');
    assert(analysis.contextScores.product_technology >= 0.8);
    assert(analysis.contextScores.operations >= 0.5);
    assert(analysis.entities.includes('ASML'));
    assert(analysis.claims.length >= 5);
    assert(analysis.claims.some((c) => c.isQuantitative));
  });

  // TEST 7: Image Element Selection Modes
  await test('selectImageElements supports best_match, priority, and all selection modes', () => {
    const policy: ImageSlotPolicy = {
      slot: 'hero',
      allowedElements: ['company', 'product_technology', 'operations', 'industry_context'],
      maxImages: 1,
      selectionMode: 'best_match',
      requirements: IMAGE_REQUIREMENT_PRESETS.equityProductTechnology,
    };

    const scores = {
      company: 0.3,
      product_technology: 0.95,
      operations: 0.7,
      industry_context: 0.4,
    };

    // best_match selects product_technology
    const bestMatch = selectImageElements(policy, scores);
    assert.deepStrictEqual(bestMatch.selectedElements, ['product_technology']);

    // priority selects in configured order
    const priority = selectImageElements({ ...policy, selectionMode: 'priority' }, scores);
    assert.deepStrictEqual(priority.selectedElements, policy.allowedElements);

    // all selects all
    const all = selectImageElements({ ...policy, selectionMode: 'all' }, scores);
    assert.deepStrictEqual(all.selectedElements, policy.allowedElements);
  });

  // TEST 8: Technical Filtering and Ranking for Images
  await test('imageMeetsTechnicalRequirements and rankImageCandidates filter correctly', () => {
    const reqs = IMAGE_REQUIREMENT_PRESETS.equityCompanyPhoto;

    const validCandidate: ImageCandidate = {
      id: 'img_valid',
      element: 'company',
      type: 'photo',
      url: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
      sourceUrl: 'https://unsplash.com',
      sourceIdentified: true,
      attributionAvailable: true,
      technicallyUsable: true,
      relevant: true,
      width: 1600,
      height: 900,
      quality: 0.9,
      relevanceScore: 0.95,
    };

    assert.strictEqual(imageMeetsTechnicalRequirements(validCandidate, reqs), true);

    const smallCandidate: ImageCandidate = {
      ...validCandidate,
      id: 'img_small',
      width: 800, // below minWidth 1200
    };
    assert.strictEqual(imageMeetsTechnicalRequirements(smallCandidate, reqs), false);

    const ranked = rankImageCandidates([smallCandidate, validCandidate], reqs);
    assert.strictEqual(ranked.length, 1);
    assert.strictEqual(ranked[0].id, 'img_valid');
  });

  // TEST 9: Curated Editorial Hero & Market Cap Impact
  await test('selectEditorialHero returns valid curated image and calculateMarketCapImpact is accurate', () => {
    const hero = selectEditorialHero('SEMICONDUCTOR_CLEANROOM', 'ASML', 'evt_123');
    assert(isAllowedEditorialHeroUrl(hero.imageUrl));
    assert(hero.imageUrl.startsWith('https://images.unsplash.com/'));
    assert(hero.photographerCredit.length > 0);

    // Market cap impact calculation: $320B * -4.8% = -$15.4B
    const impact = calculateMarketCapImpact('ASML', -4.8, 320);
    assert.strictEqual(impact, -15.4);

    // Invalid numbers
    assert.strictEqual(calculateMarketCapImpact('ASML', NaN, 320), undefined);
    assert.strictEqual(calculateMarketCapImpact('ASML', -4.8, -10), undefined);
  });

  // TEST 10: Sell-Side Event Note Layout Composition
  await test('composeSellSideEventNote builds standard First Page and Body rhythm sections', () => {
    const report: ResearchReport = {
      id: 'rep_nvda',
      ticker: 'NVDA',
      assetName: 'NVIDIA Corporation',
      changePercent: 3.5,
      marketCapUsdBillions: 3100,
      executiveSummary: 'NVIDIA reports record datacenter revenue driven by Blackwell architecture deployment.',
      immediateCatalyst: 'Datacenter revenue grew 154% YoY to $30.8B surpassing consensus by $2.1B.',
      directMarketImpact: 'AI server OEMs and optics suppliers rally on expanded capex commitments.',
      broaderContext: 'Gross margins normalized to 75.0% reflecting initial Blackwell ramp costs.',
      whatMarketIsReactingTo: 'Hyperscaler capex sustainability and sovereign AI revenue expansion.',
      whatToWatchNext: 'Blackwell shipment volume milestones and co-packaged optics adoption in H2.',
      confidence: 'HIGH',
      status: 'COMPLETED',
      sources: [],
    };

    const contextAnalysis = analyzeReportContext(report);
    const hero = selectEditorialHero('SEMICONDUCTOR_CLEANROOM', 'NVDA', 'evt_999');

    const leadAsset: ReportAsset = {
      id: 'asset_hero_nvda',
      type: 'image',
      purpose: 'editorial_lead_image',
      source: { url: hero.imageUrl },
      provenance: { retrievedAt: new Date().toISOString(), status: 'EXPLICIT_SOURCE' },
      selection: { reason: 'Lead hero' },
      asset: { url: hero.imageUrl },
    };

    const evidenceAsset: ReportAsset = {
      id: 'asset_chart_nvda',
      type: 'chart',
      purpose: 'primary_evidence',
      source: { url: 'https://example.com/exhibit' },
      provenance: {
        visualSource: 'Goldman Sachs GIR',
        discoverySource: 'Bloomberg',
        retrievedAt: new Date().toISOString(),
        status: 'EXPLICIT_SOURCE',
      },
      selection: { reason: 'Primary capex exhibit' },
      asset: { url: 'https://example.com/chart.png' },
    };

    const layout = composeSellSideEventNote(
      report,
      contextAnalysis,
      [leadAsset, evidenceAsset],
      leadAsset.id,
      evidenceAsset.id
    );

    // 1. First Page verification
    assert.strictEqual(layout.reportType, 'SELL_SIDE_EVENT_NOTE');
    assert(layout.firstPage.headline.includes('NVDA'));
    assert(layout.firstPage.headline.includes('+3.5%'));
    assert.strictEqual(layout.firstPage.bottomLine, report.executiveSummary);
    assert.strictEqual(layout.firstPage.keyDebate, report.whatMarketIsReactingTo);
    assert(layout.firstPage.keyTakeaways.length >= 1 && layout.firstPage.keyTakeaways.length <= 3);
    assert.strictEqual(layout.firstPage.leadImageAssetId, leadAsset.id);
    assert.strictEqual(layout.firstPage.primaryEvidenceAssetId, evidenceAsset.id);

    // 2. Body sections rhythm verification
    const purposes = layout.sections.map((s) => s.purpose);
    assert(purposes.includes('what_drove_the_move'));
    assert(purposes.includes('why_it_matters'));
    assert(purposes.includes('transmission'));
    assert(purposes.includes('financial_impact'));
    assert(purposes.includes('forward_view'));
    assert(purposes.includes('sources_and_methodology'));

    // Check evidence placement in what_drove_the_move
    const whatDrove = layout.sections.find((s) => s.purpose === 'what_drove_the_move')!;
    assert.strictEqual(whatDrove.pattern, 'TEXT_CHART_SPLIT');
    assert(whatDrove.blocks.some((b) => b.type === 'chart' && b.assetId === evidenceAsset.id));
  });

  // TEST 11: Document Inspection for Attached Research
  await test('inspectDocumentSources extracts exhibit from report sources if bank or signal present', () => {
    const reportWithBankSource: ResearchReport = {
      id: 'rep_doc_inspect',
      ticker: 'TSMC',
      status: 'COMPLETED',
      confidence: 'HIGH',
      sources: [
        {
          title: 'Morgan Stanley Research: Foundry Utilization and AI Node Capacity',
          publisher: 'Morgan Stanley',
          url: 'https://morganstanley.com/research/foundry-exhibit',
          relevance: 'Figure 3: Advanced packaging CoWoS capacity growth',
        },
      ],
    };

    const candidate = inspectDocumentSources(reportWithBankSource);
    assert(candidate !== undefined);
    assert.strictEqual(candidate.publisher, 'Morgan Stanley');
    assert.strictEqual(candidate.type, 'exhibit');
    assert.strictEqual(candidate.extractionStatus, 'VISUAL_ONLY');
    assert.strictEqual(candidate.provenanceStatus, 'EXPLICIT_SOURCE');
    assert.strictEqual(candidate.technicallyUsable, true);
  });

  // TEST 12: End-to-end execution without API key (Graceful Fallback Mode)
  await test('runAntiGravityVisualDataAgent executes gracefully without API key and returns valid payload', async () => {
    const report: ResearchReport = {
      id: 'rep_offline',
      ticker: 'AMD',
      assetName: 'Advanced Micro Devices',
      changePercent: -2.3,
      marketCapUsdBillions: 220,
      executiveSummary: 'AMD guides client segment modestly below seasonal expectations.',
      confidence: 'HIGH',
      status: 'COMPLETED',
      sources: [],
    };

    const brief: VisualBrief = {
      primaryTheme: 'SEMICONDUCTOR_CLIENT_DEMAND',
      suggestedChartTitle: 'Client PC TAM and Node Transitions',
      dataSearchQuery: 'AMD PC TAM client processor units',
      unit: 'million units',
      chartType: 'BAR',
      editorialScene: 'SEMICONDUCTOR_CLEANROOM',
      transmissionSummary: [
        'Client PC shipment guidance lowered for Q4',
        'OEM inventory adjustments delay revenue recognition',
        'Gross margin impacted by lower mix of premium processors',
        'Sector peers absorb revised client computing expectations',
      ],
    };

    const payload = await runAntiGravityVisualDataAgent(report, brief, null);

    assert(payload.hero !== undefined);
    assert(payload.hero.imageUrl.startsWith('https://images.unsplash.com/'));
    assert.strictEqual(payload.marketCapImpactUsdBillions, -5.1); // 220 * -2.3% = -5.06 -> -5.1
    assert(Array.isArray(payload.transmissionSteps));
    assert.strictEqual(payload.transmissionSteps!.length, 4);
    assert(payload.layoutPlan !== undefined);
    assert.strictEqual(payload.layoutPlan!.reportType, 'SELL_SIDE_EVENT_NOTE');
    assert(Array.isArray(payload.assetRegistry));
    assert(payload.assetRegistry!.length >= 1);
  });

  // TEST 13: Direct Agent Execution and Payload Verification
  await test('runAntiGravityVisualDataAgent generates complete institutional payload', async () => {
    const report: ResearchReport = {
      id: 'rep_compat',
      ticker: 'MSFT',
      assetName: 'Microsoft Corporation',
      changePercent: 1.8,
      marketCapUsdBillions: 3200,
      executiveSummary: 'Azure AI revenue growth accelerates to 34% YoY in fiscal Q1.',
      confidence: 'HIGH',
      status: 'COMPLETED',
      sources: [],
    };

    const brief: VisualBrief = {
      primaryTheme: 'CLOUD_AND_AI_INFRASTRUCTURE',
      suggestedChartTitle: 'Azure Revenue Growth vs AWS and GCP',
      dataSearchQuery: 'Azure revenue growth cloud hyperscaler',
      unit: '% YoY',
      chartType: 'BAR',
      editorialScene: 'WALL_STREET',
      transmissionSummary: ['Azure capex expands', 'Datacenter capacity scales'],
    };

    const payload = await runAntiGravityVisualDataAgent(report, brief, null);

    // Verify all canonical and snake_case properties
    assert(payload.hero !== undefined);
    assert(payload.transmissionSteps !== undefined);
    assert(payload.transmission_steps !== undefined);
    assert(payload.marketCapImpactUsdBillions !== undefined);
    assert(payload.market_cap_impact_usd_billions !== undefined);
    assert(payload.enrichedAt !== undefined);
    assert(payload.enriched_at !== undefined);
    assert(payload.layoutPlan !== undefined);
    assert(payload.assetRegistry !== undefined);
  });

  // TEST 14: Token Usage Logger Robustness with Null and Error-Throwing Pool
  await test('Token usage logger does not crash when pool is null or query throws', async () => {
    const report: ResearchReport = {
      id: 'rep_pool_test',
      ticker: 'INTC',
      changePercent: 0,
      confidence: 'LOW',
      status: 'COMPLETED',
      sources: [],
    };

    // A mock pool whose query throws an error (e.g. table does not exist or connection down)
    const errorPool: any = {
      query: async () => {
        throw new Error('relation "gemini_token_usage" does not exist');
      },
    };

    // We invoke runAntiGravityVisualDataAgent with this errorPool.
    // It should complete gracefully without throwing an uncaught exception.
    const payload = await runAntiGravityVisualDataAgent(report, undefined, errorPool);
    assert(payload !== undefined);
    assert(payload.hero !== undefined);
  });

  // TEST 15: Document Inspection Candidate Attached to Report
  await test('End-to-end with document inspection candidate wires exhibit into layout and asset registry', async () => {
    const report: ResearchReport = {
      id: 'rep_doc_e2e',
      ticker: 'TSMC',
      assetName: 'Taiwan Semiconductor Manufacturing Co.',
      changePercent: 4.2,
      marketCapUsdBillions: 850,
      executiveSummary: 'TSMC reports blowout AI accelerator foundry revenue and increases capex range.',
      confidence: 'HIGH',
      status: 'COMPLETED',
      sources: [
        {
          title: 'Goldman Sachs Global Investment Research: Foundry Capex and CoWoS Allocation',
          publisher: 'Goldman Sachs',
          url: 'https://goldmansachs.com/research/foundry-capex-2025',
          relevance: 'Figure 1: CoWoS packaging capacity 2024-2026',
        },
      ],
    };

    const payload = await runAntiGravityVisualDataAgent(report, undefined, null);

    assert(payload.researchVisuals !== undefined && payload.researchVisuals.length === 1);
    const visual = payload.researchVisuals[0];
    assert.strictEqual(visual.publisher, 'Goldman Sachs');
    assert.strictEqual(visual.extractionStatus, 'VISUAL_ONLY');
    assert.strictEqual(visual.provenanceStatus, 'EXPLICIT_SOURCE');

    // Layout plan should have primaryEvidenceAssetId matching the candidate ID
    assert(payload.layoutPlan !== undefined);
    assert.strictEqual(payload.layoutPlan.firstPage.primaryEvidenceAssetId, visual.id);

    // Asset registry should contain both lead hero and primary evidence exhibit
    assert(payload.assetRegistry !== undefined && payload.assetRegistry.length === 2);
    const exhibitAsset = payload.assetRegistry.find((a) => a.id === visual.id);
    assert(exhibitAsset !== undefined);
    assert.strictEqual(exhibitAsset.type, 'research_exhibit');
  });

  console.log('===============================================================');
  console.log(`TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Test suite failed with unexpected error:', err);
  process.exit(1);
});
