import pg from 'pg';
import { ResearchEvent, ResearchConfig } from '../types/marketResearch';
import {
  getResearchConfig,
  findActiveEventForTicker,
  saveResearchEvent,
  updateResearchEvent,
  recordMarketMonitorRun,
  cleanupStaleResearchEvents
} from './marketResearchStore';
import { executeResearchForEvent } from './marketResearchAgent';

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

/**
 * Deterministic Market Monitor:
 * 1. Checks real quote movements against configured category thresholds for enabled assets.
 * 2. Deduplicates against existing ongoing research events within the dedup window.
 * 3. Generates ResearchEvent and queues/executes the Deep Research Agent.
 */
export async function runMarketResearchMonitor(
  quoteFetcher: QuoteFetcher,
  pool: pg.Pool | null,
  options?: { autoRunAgent?: boolean; waitForAgent?: boolean }
): Promise<MonitorRunResult> {
  // 0. Auto-clean any stale researching events older than 3 minutes
  await cleanupStaleResearchEvents(60, pool);

  const config = await getResearchConfig(pool);
  const autoRunAgent = options?.autoRunAgent !== false; // Default true
  const waitForAgent = Boolean(options?.waitForAgent);

  let checkedAssetsCount = 0;
  let triggeredCount = 0;
  let skippedDedupCount = 0;
  const newEvents: ResearchEvent[] = [];

  const enabledAssets = Object.values(config.assets).filter(a => a.enabled);
  console.log(`[Market Monitor] Evaluating ${enabledAssets.length} enabled assets for deterministic threshold triggers...`);

  for (const asset of enabledAssets) {
    checkedAssetsCount++;

    // 1. Fetch live quote
    let quote: MarketQuoteInput | null = null;
    try {
      quote = await quoteFetcher(asset.symbol);
    } catch (err: any) {
      console.warn(`[Market Monitor] Quote fetch error for ${asset.symbol}:`, err.message);
      continue;
    }

    if (!quote?.isVerifiedRegularSession || !Number.isFinite(quote.price) || quote.price <= 0 ||
        !Number.isFinite(quote.changePercent) || !quote.previousClose || quote.previousClose <= 0) {
      continue; // Never evaluate on missing or fabricated quote data
    }

    // 2. Determine applicable threshold
    const category = config.categories[asset.categoryKey];
    const thresholdPct = asset.customThresholdPct ?? category?.thresholdPct ?? 5.0;

    const absChange = Math.abs(quote.changePercent);
    // Refresh an open event even if the move has dropped below the threshold.
    const todayDateStr = quote.sessionDate || quote.quoteTime?.slice(0, 10) || new Date().toISOString().slice(0, 10);
    const existingActiveEvent = await findActiveEventForTicker(
      asset.symbol, config.dedupWindowHours || 24, pool, todayDateStr,
      quote.sessionStart, quote.sessionEnd
    );
    if (existingActiveEvent) {
      await updateResearchEvent(existingActiveEvent.id, {
        changePercent: quote.changePercent,
        currentPrice: quote.price,
        lastCheckedAt: quote.quoteTime || new Date().toISOString()
      }, pool);
      if (absChange >= thresholdPct) {
        triggeredCount++;
        skippedDedupCount++;
      }
      continue;
    }
    if (absChange >= thresholdPct) {
      triggeredCount++;
      console.log(`[Market Monitor] Trigger condition met for ${asset.symbol}: |${quote.changePercent.toFixed(2)}%| >= ${thresholdPct}%`);

      // 3. New qualifying ResearchEvent in this exchange session.

      // 4. Create NEW qualifying ResearchEvent
      const eventId = `evt_${Date.now()}_${asset.symbol.toLowerCase()}`;
      const direction = quote.changePercent >= 0 ? 'UP' : 'DOWN';
      const fingerprint = `${asset.symbol}_${direction}_${todayDateStr}`;

      const previousClose = quote.previousClose ?? 
        (quote.price > 0 && quote.changePercent !== -100 ? quote.price / (1 + quote.changePercent / 100) : quote.price);

      const newEvent: ResearchEvent = {
        id: eventId,
        ticker: asset.symbol,
        assetName: asset.name,
        assetClass: asset.assetClass,
        changePercent: Number(quote.changePercent.toFixed(4)),
        currentPrice: Number(quote.price.toFixed(6)),
        triggerPrice: quote.price,
        triggerChangePercent: quote.changePercent,
        marketSymbol: quote.marketSymbol,
        previousClose: Number(previousClose.toFixed(6)),
        period: 'SESSION',
        triggeredAt: quote.quoteTime || new Date().toISOString(),
        status: 'NEW',
        fingerprint,
        lastCheckedAt: quote.quoteTime || new Date().toISOString()
      };

      await saveResearchEvent(newEvent, pool);
      newEvents.push(newEvent);
    }
  }

  // 5. Trigger Deep Market Research Agent sequentially (one-by-one)
  // Executing 1-by-1 avoids concurrent Gemini API load, prevents 429 quota exhaustion,
  // and ensures each investigation completes reliably before the next one starts.
  let executionPromise: Promise<void> | null = null;
  if (autoRunAgent && newEvents.length > 0) {
    const processSequentially = async () => {
      console.log(`[Market Monitor] Starting sequential (1-by-1) research queue for ${newEvents.length} event(s)...`);
      for (let i = 0; i < newEvents.length; i++) {
        const ev = newEvents[i];
        try {
          console.log(`[Market Monitor] Researching [${i + 1}/${newEvents.length}] ${ev.ticker} (${ev.assetName})...`);
          await executeResearchForEvent(ev, pool);
        } catch (agentErr: any) {
          console.error(`[Market Monitor] Error executing research agent for ${ev.ticker}:`, agentErr);
          await updateResearchEvent(
            ev.id,
            {
              status: 'COOLED_DOWN',
              catalystSummary: `Research execution error: ${agentErr?.message || 'Unknown error'}`
            },
            pool
          );
        }

        // Brief 2-second breathing window between consecutive AI research runs
        if (i < newEvents.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      console.log(`[Market Monitor] Sequential research queue completed.`);
    };

    executionPromise = processSequentially();
    if (waitForAgent) {
      await executionPromise;
    }
  }

  recordMarketMonitorRun();
  console.log(`[Market Monitor] Cycle completed: ${checkedAssetsCount} assets checked, ${triggeredCount} triggered, ${newEvents.length} new events, ${skippedDedupCount} deduped.`);

  return {
    checkedAssetsCount,
    triggeredCount,
    newEvents,
    skippedDedupCount,
    timestamp: new Date().toISOString()
  };
}

/**
 * Manual trigger for on-demand research on any asset (e.g. from UI trigger button or testing)
 */
export async function triggerManualResearch(
  symbol: string,
  quoteFetcher: QuoteFetcher,
  pool: pg.Pool | null,
  options?: { customMovePct?: number; force?: boolean }
): Promise<{ success: boolean; event?: ResearchEvent; error?: string }> {
  const config = await getResearchConfig(pool);
  const normalizedSymbol = symbol.trim().toUpperCase();

  const assetConfig = config.assets[normalizedSymbol] || {
    symbol: normalizedSymbol,
    name: normalizedSymbol,
    assetClass: 'Equities',
    categoryKey: 'normal_large_mid_cap',
    enabled: true
  };

  // Fetch real quote if available
  const quote = await quoteFetcher(normalizedSymbol);
  if (!quote?.isVerifiedRegularSession || !Number.isFinite(quote.price) || quote.price <= 0 ||
      !quote.previousClose || quote.previousClose <= 0) {
    return { success: false, error: `Geen verifieerbare reguliere beurskoers voor ${normalizedSymbol}; trigger niet aangemaakt.` };
  }
  if (options?.customMovePct !== undefined) {
    return { success: false, error: 'Handmatige procentuele koersoverschrijving is uitgeschakeld; alleen geverifieerde beursdata wordt gebruikt.' };
  }
  const changePercent = quote.changePercent;

  // Check deduplication unless forced
  if (!options?.force) {
    const todayDateStr = quote.sessionDate || quote.quoteTime?.slice(0, 10) || new Date().toISOString().slice(0, 10);
    const existing = await findActiveEventForTicker(normalizedSymbol, config.dedupWindowHours || 24, pool, todayDateStr, quote.sessionStart, quote.sessionEnd);
    if (existing) {
      return {
        success: false,
        error: `Active research event already in progress for ${normalizedSymbol} (ID: ${existing.id}).`
      };
    }
  }

  const eventId = `evt_manual_${Date.now()}_${normalizedSymbol.toLowerCase()}`;
  const direction = changePercent >= 0 ? 'UP' : 'DOWN';
  const fingerprint = `${normalizedSymbol}_${direction}_${Date.now()}`;

  const event: ResearchEvent = {
    id: eventId,
    ticker: normalizedSymbol,
    assetName: assetConfig.name,
    assetClass: assetConfig.assetClass,
    changePercent: Number(changePercent.toFixed(4)),
    currentPrice: Number(quote.price.toFixed(6)),
    triggerPrice: quote.price,
    triggerChangePercent: changePercent,
    marketSymbol: quote.marketSymbol,
    previousClose: Number((quote.previousClose || quote.price).toFixed(6)),
    period: 'SESSION',
    triggeredAt: quote.quoteTime || new Date().toISOString(),
    status: 'NEW',
    fingerprint,
    lastCheckedAt: quote.quoteTime || new Date().toISOString()
  };

  await saveResearchEvent(event, pool);

  // Execute research agent
  const agentResult = await executeResearchForEvent(event, pool);
  return {
    success: agentResult.success,
    event,
    error: agentResult.error
  };
}
