import { GoogleGenAI } from '@google/genai';
import pg from 'pg';
import {
  EditorialHeroPayload,
  MacroChartPayload,
  MacroChartType,
  ResearchReport,
  TransmissionNode,
  VisualBrief,
  VisualEnrichmentPayload
} from '../types/marketResearch';

const VISUAL_AGENT = 'antigravity-preview-05-2026';
const VISUAL_MODEL = 'gemini-3.8-flash';
const VISUAL_AGENT_LABEL = `${VISUAL_AGENT} (${VISUAL_MODEL})`;

const VISUAL_DESIGNER_SYSTEM_PROMPT = `You are the Visual Designer and Macro Data Agent for the Global Markets application.
Your role is to enrich an institutional research report with one source-verified macro chart dataset.

DATA INTEGRITY
Never invent, estimate, interpolate, or round market, economic, company, or macroeconomic data.
Use Google Search only to locate current, authoritative primary sources such as official agencies,
central banks, exchanges, company investor-relations pages, or regulators. The returned sourceUrl
must be a URL that appears in the Google Search grounding metadata for this interaction.
If a source-backed dataset cannot be established, return an empty JSON object.

OUTPUT
Return ONLY valid JSON matching the requested schema. Every data value must be finite, and every
chart must include a named source and sourceUrl. Do not include markdown fences or commentary.`;

/** Only stable, direct-photo hosts are permitted in the editorial registry. */
export const EDITORIAL_HERO_ALLOWED_HOSTS = [
  'images.unsplash.com',
  'upload.wikimedia.org'
] as const;

function isAllowedEditorialHeroUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && EDITORIAL_HERO_ALLOWED_HOSTS.some(host => url.hostname === host);
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
    alt
  };
}

/**
 * Curated real-photo registry. It intentionally contains no generated-art or
 * image-search URLs, and every entry carries source/license/alt metadata for
 * auditability in the report payload.
 */
export const EDITORIAL_HERO_REGISTRY: Record<VisualBrief['editorialScene'], EditorialHeroPayload[]> = {
  WALL_STREET: [
    unsplashHero('photo-1611974789855-9c2a0a7236a3', 'Wall Street, New York', 'Exterior of a financial district trading venue'),
    unsplashHero('photo-1590283603385-17ffb3a7f29f', 'Lower Manhattan, New York', 'Financial district architecture and street activity'),
    unsplashHero('photo-1526304640581-d334cdbbf45e', 'Institutional trading desk', 'Institutional market data displayed on trading terminals'),
    unsplashHero('photo-1486406146926-c627a92ad1ab', 'Global financial centre', 'Modern financial district office architecture')
  ],
  SEMICONDUCTOR_CLEANROOM: [
    unsplashHero('photo-1518770660439-4636190af475', 'Semiconductor fabrication facility', 'Close-up photograph of semiconductor technology'),
    unsplashHero('photo-1550751827-4bd374c3f58b', 'Advanced wafer processing hub', 'Technology hardware and electronics in an industrial setting'),
    unsplashHero('photo-1563770660941-20978e870e26', 'Precision lithography laboratory', 'Precision electronics and optical engineering equipment'),
    unsplashHero('photo-1504384308090-c894fdcc538d', 'Semiconductor fabrication facility', 'Semiconductor hardware photographed in a clean technical setting')
  ],
  ENERGY_TERMINAL: [
    unsplashHero('photo-1518709268805-4e9042af9f23', 'North Sea offshore basin', 'Industrial energy infrastructure photographed offshore'),
    unsplashHero('photo-1542601906990-b4d3fb778b09', 'Rotterdam energy gateway', 'Industrial logistics and energy infrastructure'),
    unsplashHero('photo-1578328819058-b69f3a3b0f6b', 'Industrial refining hub', 'Industrial processing infrastructure at dusk'),
    unsplashHero('photo-1497435334941-8c899ee9e8e9', 'Global energy infrastructure', 'Large-scale industrial infrastructure and utilities')
  ],
  AEROSPACE_HANGAR: [
    unsplashHero('photo-1517976487502-5f690246654c', 'Aerospace engineering plant', 'Aircraft photographed in an engineering facility'),
    unsplashHero('photo-1541185933-ef5d8ed016c2', 'Flight systems test facility', 'Commercial aircraft photographed in flight'),
    unsplashHero('photo-1436491865332-7a61a109cc05', 'Global aviation network', 'Passenger aircraft photographed from the air'),
    unsplashHero('photo-1464037866556-6812c9d1c72e', 'Aerospace operations hub', 'Airport and aircraft operations photographed at scale')
  ],
  CENTRAL_BANK: [
    unsplashHero('photo-1541872703-74c5e44368f9', 'Sovereign monetary authority', 'Classical government building architecture'),
    unsplashHero('photo-1556761175-b413da4baf72', 'Fixed-income trading desk', 'Institutional policy and markets research office'),
    unsplashHero('photo-1529107386315-e1a2ed48a620', 'Government district', 'Government building and civic architecture'),
    unsplashHero('photo-1454165804606-c3d57bc86b40', 'Policy and markets research office', 'Research and market analysis materials on a desk')
  ]
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

/**
 * Stable rotation by ticker/event. Numeric event suffixes are treated as a
 * sequence so evt_101 and evt_102 cannot collide when a pool has >1 image.
 */
export function selectEditorialHero(
  scene: string,
  ticker: string,
  eventId: string
): EditorialHeroPayload {
  const pool = EDITORIAL_HERO_REGISTRY[scene as VisualBrief['editorialScene']] || EDITORIAL_HERO_REGISTRY.WALL_STREET;
  const numericSuffix = eventId.match(/(\d+)$/)?.[1];
  const tickerOffset = stableHash(ticker.toUpperCase()) % pool.length;
  const sequenceOffset = numericSuffix
    ? decimalStringModulo(numericSuffix, pool.length)
    : stableHash(`${ticker}_${eventId}`) % pool.length;
  const selected = pool[(tickerOffset + sequenceOffset) % pool.length];
  if (isAllowedEditorialHeroUrl(selected.imageUrl)) return selected;
  return pool.find(hero => isAllowedEditorialHeroUrl(hero.imageUrl)) || EDITORIAL_HERO_REGISTRY.WALL_STREET[0];
}

/**
 * Computes market-cap impact only from an explicit, verified market-cap input.
 * Ticker names are never used as a proxy for market capitalization.
 */
export function calculateMarketCapImpact(
  _ticker: string,
  changePercent: number,
  marketCapUsdBillions?: number
): number | undefined {
  if (!Number.isFinite(changePercent) || !Number.isFinite(marketCapUsdBillions) || (marketCapUsdBillions as number) <= 0) {
    return undefined;
  }
  return Number(((marketCapUsdBillions as number * changePercent) / 100).toFixed(1));
}

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
  const directText = response?.output_text || response?.outputText;
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
  return outputText.join('\n').trim();
}

/**
 * Interactions API responses expose search citations in slightly different
 * metadata containers across SDK versions. Only citation/grounding metadata
 * is inspected; model output text is never treated as source evidence.
 */
function collectGroundingUrls(response: any): Set<string> {
  const urls = new Set<string>();
  const metadataRoots = [
    response?.groundingMetadata,
    response?.grounding_metadata,
    response?.metadata?.groundingMetadata,
    response?.metadata?.grounding_metadata,
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
        output?.citations
      ])
      : [])
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
      if (/grounding|citation|annotation|source/i.test(key)) visit(value);
    });
  };

  metadataRoots.forEach(visit);
  return urls;
}

/** Rejects any result with missing attribution or a malformed/non-finite row. */
function validateMacroChart(
  candidate: unknown,
  brief: VisualBrief,
  groundedUrls: Set<string>
): MacroChartPayload | undefined {
  if (!candidate || typeof candidate !== 'object') return undefined;
  const record = candidate as Record<string, unknown>;
  const chartType = record.chartType ?? record.chart_type;
  const title = typeof record.title === 'string' ? record.title.trim() : '';
  const unit = typeof record.unit === 'string' ? record.unit.trim() : '';
  const source = typeof record.source === 'string' ? record.source.trim() : '';
  const sourceUrl = record.sourceUrl ?? record.source_url;
  const rawData = Array.isArray(record.data)
    ? record.data
    : Array.isArray(record.data_points)
      ? record.data_points
      : [];

  if (!isMacroChartType(chartType) || chartType !== brief.chartType || !title || !unit || !source || !isHttpUrl(sourceUrl) || rawData.length === 0) {
    return undefined;
  }

  // A URL-shaped string is not evidence. Only accept a source explicitly
  // returned by Google's grounding metadata for this generation.
  const normalizedSourceUrl = String(sourceUrl).replace(/\/$/, '');
  if (groundedUrls.size === 0 || ![...groundedUrls].some(url => {
    const normalizedGroundingUrl = url.replace(/\/$/, '');
    return normalizedGroundingUrl === normalizedSourceUrl || normalizedGroundingUrl.startsWith(`${normalizedSourceUrl}/`) || normalizedSourceUrl.startsWith(`${normalizedGroundingUrl}/`);
  })) {
    return undefined;
  }

  const data = rawData.map((item): MacroChartPayload['data'][number] | undefined => {
    if (!item || typeof item !== 'object') return undefined;
    const row = item as Record<string, unknown>;
    const label = typeof row.label === 'string' ? row.label.trim() : '';
    const value = typeof row.value === 'number' ? row.value : Number(row.value);
    const benchmarkRaw = row.benchmark ?? row.benchmark_value;
    const benchmark = benchmarkRaw === undefined ? undefined : Number(benchmarkRaw);
    const highlightRaw = row.highlight ?? row.is_highlighted;
    if (!label || !Number.isFinite(value) || (benchmark !== undefined && !Number.isFinite(benchmark))) {
      return undefined;
    }
    return {
      label,
      value,
      ...(benchmark !== undefined ? { benchmark, benchmark_value: benchmark } : {}),
      ...(highlightRaw === true ? { highlight: true, is_highlighted: true } : {})
    };
  });

  if (data.some(point => !point)) return undefined;

  return {
    chartType,
    title,
    subtitle: typeof record.subtitle === 'string' ? record.subtitle.trim() || undefined : undefined,
    unit,
    source,
    sourceUrl,
    data: data as NonNullable<typeof data[number]>[],
    data_points: data as NonNullable<typeof data[number]>[]
  };
}

async function fetchVerifiedMacroChart(
  report: ResearchReport,
  brief: VisualBrief,
  pool: pg.Pool | null
): Promise<MacroChartPayload | undefined> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_KEY;
  if (!apiKey) {
    console.info('[Visual Designer Agent] Macro data unavailable: no Gemini API key configured.');
    return undefined;
  }

  try {
    const startedAt = Date.now();
    const ai = new GoogleGenAI({ apiKey });
    if (!ai.interactions || typeof ai.interactions.create !== 'function') {
      console.warn('[Visual Designer Agent] Antigravity Interactions API is unavailable in the installed SDK.');
      return undefined;
    }

    const response: any = await ai.interactions.create({
      agent: VISUAL_AGENT,
      agent_config: {
        type: 'antigravity',
        model: VISUAL_MODEL
      },
      environment: {
        type: 'remote',
        sources: [
          {
            type: 'inline',
            content: VISUAL_DESIGNER_SYSTEM_PROMPT,
            target: '.agents/VISUAL_DESIGNER_AGENT.md'
          }
        ]
      },
      system_instruction: VISUAL_DESIGNER_SYSTEM_PROMPT,
      input: `You are the macro-data specialist for an institutional research report.
Asset: ${report.ticker} (${report.assetName || report.asset || report.ticker})
Movement: ${report.changePercent ?? report.change_percent ?? 'unknown'}%
Theme: ${brief.primaryTheme}
Chart title: ${brief.suggestedChartTitle}
Unit: ${brief.unit}
Search query: ${brief.dataSearchQuery}

Use Google Search grounding to find a verified underlying-driver series or breakdown from an official agency, exchange, company investor-relations page, or other authoritative primary source. Do not invent, estimate, interpolate, or use a generic placeholder series. Return ONLY JSON with this shape:
{
  "chartType": "${brief.chartType}",
  "title": "...",
  "subtitle": "...",
  "unit": "${brief.unit}",
  "source": "named source",
  "sourceUrl": "https://authoritative-source.example/page",
  "data": [{"label":"...","value":12.3,"highlight":true}]
}
Every data value must be a finite number and the response must include a real source and sourceUrl. If those requirements cannot be met, return an empty JSON object.`,
      tools: [{ type: 'google_search' }]
    });

    await recordVisualDesignerUsage(pool, response, startedAt, report);

    const groundedUrls = collectGroundingUrls(response);

    return validateMacroChart(parseJsonResponse(extractInteractionText(response)), brief, groundedUrls);
  } catch (error) {
    console.warn('[Visual Designer Agent] Verified macro search failed; retaining unavailable state.', error);
    return undefined;
  }
}

async function recordVisualDesignerUsage(
  pool: pg.Pool | null,
  response: any,
  startedAt: number,
  report: ResearchReport
): Promise<void> {
  if (!pool || !response) return;

  const usage = response.usage || response.usage_metadata || response.usageMetadata || {};
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
    await pool.query(`
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
    `, [
      'visual_designer_agent',
      VISUAL_AGENT_LABEL,
      inputTokens,
      outputTokens,
      totalTokens,
      `VISUAL_MACRO_${report.ticker}`,
      JSON.stringify({
        ticker: report.ticker,
        eventId: report.eventId || report.event_id || report.id,
        latencyMs: Date.now() - startedAt,
        usageMetadataAvailable: Boolean(response.usage || response.usage_metadata || response.usageMetadata),
        source: 'VISUAL_DESIGNER_ANTIGRAVITY_INTERACTIONS_API_GOOGLE_SEARCH',
        agent: VISUAL_AGENT,
        agentType: 'antigravity'
      })
    ]);
  } catch (error: any) {
    console.warn('[Visual Designer Agent] Could not persist exact usage metadata:', error?.message || error);
  }
}

export async function runVisualDesignerAgent(
  report: ResearchReport,
  brief: VisualBrief,
  pool: pg.Pool | null = null
): Promise<VisualEnrichmentPayload> {
  const eventId = report.eventId || report.event_id || report.id || 'evt_default';
  const changePercent = report.changePercent ?? report.change_percent;
  const marketCapUsdBillions = report.marketCapUsdBillions ?? report.market_cap_usd_billions;
  const marketCapImpactUsdBillions = calculateMarketCapImpact(report.ticker, changePercent ?? Number.NaN, marketCapUsdBillions);
  const transmissionSummary = brief.transmissionSummary.filter(step => typeof step === 'string' && step.trim());
  const transmissionSteps: TransmissionNode[] = transmissionSummary.map((text, index) => ({
    step: index + 1,
    step_number: index + 1,
    label: text.trim(),
    type: index === 0
      ? 'CATALYST'
      : index === transmissionSummary.length - 1
        ? 'SECTOR_EFFECT'
        : index === transmissionSummary.length - 2
          ? 'FINANCIAL_IMPACT'
          : 'TRANSMISSION'
  }));

  const macroChart = await fetchVerifiedMacroChart(report, brief, pool);
  const payload: VisualEnrichmentPayload = {
    hero: selectEditorialHero(brief.editorialScene, report.ticker, eventId),
    transmissionSteps,
    transmission_steps: transmissionSteps,
    enrichedAt: new Date().toISOString()
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
