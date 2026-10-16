import pg from 'pg';
import { randomUUID } from 'node:crypto';
import type { ResearchEvent, ResearchReport, AssetResearchConfig } from '../types/marketResearch';
import { getResearchConfig, ensureResearchTables, recordMarketMonitorRun, cleanupStaleResearchEvents, getResearchReport } from './marketResearchStore';
import { executeResearchForEvent } from './marketResearchAgent';
import { ensureResearchSessionSchema, reserveResearchSession, getRunnableResearchEvents } from './marketResearchSessionStore';
import { researchYahooSymbol } from './researchSessionQuotes';

export interface MarketQuoteInput {
  symbol: string;
  price: number;
  changePercent: number;
  previousClose?: number;
  marketSymbol?: string;
  quoteTime?: string;
  sessionStart?: string;
  sessionEnd?: string;
  sessionDate?: string;
  isVerifiedRegularSession?: boolean;
}
export type QuoteFetcher = (symbol: string) => Promise<MarketQuoteInput | null>;
export interface MonitorRunResult {
  checkedAssetsCount: number;
  triggeredCount: number;
  newEvents: ResearchEvent[];
  skippedDedupCount: number;
  timestamp: string;
}

/** No UTC/24-hour fallback: a verified exchange session is mandatory. */
export function isUsableResearchQuote(quote: MarketQuoteInput | null, symbol: string, now = Date.now()): boolean {
  if (!quote?.isVerifiedRegularSession || typeof quote.symbol !== 'string' || quote.symbol.toUpperCase() !== symbol.toUpperCase() ||
      quote.marketSymbol?.toUpperCase() !== researchYahooSymbol(symbol) || !Number.isFinite(quote.price) || quote.price <= 0 ||
      !Number.isFinite(quote.previousClose) || quote.previousClose! <= 0 ||
      !Number.isFinite(quote.changePercent) || !quote.sessionDate) return false;
  const start = Date.parse(quote.sessionStart || '');
  const end = Date.parse(quote.sessionEnd || '');
  const time = Date.parse(quote.quoteTime || '');
  const calculatedMove = (quote.price / quote.previousClose! - 1) * 100;
  return Number.isFinite(start) && Number.isFinite(end) && Number.isFinite(time) &&
    start <= now && now < end && start <= time && time < end &&
    now - time <= 2 * 60_000 && time <= now + 60_000 &&
    Math.abs(calculatedMove - quote.changePercent) < 0.01;
}

function candidateEvent(asset: AssetResearchConfig, quote: MarketQuoteInput): ResearchEvent {
  return {
    id: `evt_${randomUUID()}`, ticker: asset.symbol.toUpperCase(), assetName: asset.name, assetClass: asset.assetClass,
    changePercent: quote.changePercent, currentPrice: quote.price, triggerPrice: quote.price,
    triggerChangePercent: quote.changePercent, marketSymbol: quote.marketSymbol,
    previousClose: quote.previousClose, period: 'SESSION', triggeredAt: quote.quoteTime,
    status: 'NEW', lastCheckedAt: quote.quoteTime,
    sessionStart: quote.sessionStart, sessionEnd: quote.sessionEnd, sessionDate: quote.sessionDate,
    triggerDirection: quote.changePercent > 0 ? 'UP' : 'DOWN'
  };
}

async function requireSessionStorage(pool: pg.Pool | null): Promise<pg.Pool> {
  if (!pool) throw new Error('PostgreSQL unavailable: research generation paused to prevent duplicate reports.');
  await ensureResearchTables(pool);
  await ensureResearchSessionSchema(pool);
  return pool;
}

/** Every producer uses the same atomic session/direction reservation. */
export async function runMarketResearchMonitor(
  quoteFetcher: QuoteFetcher, pool: pg.Pool | null,
  options?: { autoRunAgent?: boolean; waitForAgent?: boolean }
): Promise<MonitorRunResult> {
  const db = await requireSessionStorage(pool);
  await cleanupStaleResearchEvents(60, db);
  const config = await getResearchConfig(db, true);
  const enabledAssets = Object.values(config.assets || {}).filter(asset => asset.enabled);
  let checkedAssetsCount = 0;
  let triggeredCount = 0;
  let skippedDedupCount = 0;
  const newEvents: ResearchEvent[] = [];
  const verifiedSessions = new Set<string>();
  for (const asset of enabledAssets) {
    checkedAssetsCount++;
    let quote: MarketQuoteInput | null;
    try { quote = await quoteFetcher(asset.symbol); }
    catch { console.warn(`[Market Monitor] Quote unavailable for ${asset.symbol}.`); continue; }
    if (!isUsableResearchQuote(quote, asset.symbol)) continue;
    verifiedSessions.add(`${quote!.marketSymbol!.toUpperCase()}|${quote!.sessionStart}`);
    if (quote!.changePercent === 0) continue;
    const threshold = asset.customThresholdPct ?? config.categories?.[asset.categoryKey]?.thresholdPct;
    if (!Number.isFinite(threshold) || threshold! <= 0) continue;
    const qualifies = Math.abs(quote!.changePercent) >= threshold!;
    const reservation = await reserveResearchSession(db, candidateEvent(asset, quote!), qualifies);
    if (qualifies) triggeredCount++;
    if (reservation?.created) newEvents.push(reservation.event);
    else if (qualifies && reservation) skippedDedupCount++;
  }
  // Recover durable pending/retry slots even if the price has moved below the threshold.
  const pending = options?.autoRunAgent === false ? [] : await getRunnableResearchEvents(db, verifiedSessions);
  const execute = async () => {
    for (const event of pending) {
      try { await executeResearchForEvent(event, db); }
      catch (error) { console.error(`[Market Monitor] Research execution failed for ${event.ticker}:`, error); }
    }
  };
  if (pending.length) {
    if (options?.waitForAgent) await execute();
    else void execute().catch(error => console.error('[Market Monitor] Research queue failed:', error));
  }
  recordMarketMonitorRun();
  return { checkedAssetsCount, triggeredCount, newEvents, skippedDedupCount, timestamp: new Date().toISOString() };
}

/** Manual requests obey the same session limits; force never creates a second slot. */
export async function triggerManualResearch(
  symbol: string, quoteFetcher: QuoteFetcher, pool: pg.Pool | null,
  options?: { customMovePct?: number; force?: boolean }
): Promise<{ success: boolean; event?: ResearchEvent; report?: ResearchReport; error?: string; message?: string; reused?: boolean }> {
  const db = await requireSessionStorage(pool);
  if (options?.customMovePct !== undefined) return { success: false, error: 'Only verified market price changes can trigger research.' };
  const normalized = symbol.trim().toUpperCase();
  const config = await getResearchConfig(db, true);
  const asset = config.assets?.[normalized];
  if (!asset) return { success: false, error: 'This security is not in the research configuration.' };
  const quote = await quoteFetcher(normalized);
  if (!isUsableResearchQuote(quote, normalized) || quote!.changePercent === 0) {
    return { success: false, error: 'No fresh, verified price movement in an open exchange session.' };
  }
  const threshold = asset.customThresholdPct ?? config.categories?.[asset.categoryKey]?.thresholdPct;
  if (!Number.isFinite(threshold) || threshold! <= 0) return { success: false, error: 'No valid research threshold configured.' };
  const reservation = await reserveResearchSession(db, candidateEvent(asset, quote!), Math.abs(quote!.changePercent) >= threshold!);
  if (!reservation) return { success: false, error: 'The session price change has not reached the configured research threshold.' };
  const event = reservation.event;
  if (event.reportId) {
    const report = await getResearchReport(event.reportId, db);
    if (report) return { success: true, event, report, reused: true, message: 'Existing session report opened.' };
  }
  const result = await executeResearchForEvent(event, db);
  return { ...result, event, reused: !reservation!.created, message: result.success ? 'Session research completed.' : result.error };
}
