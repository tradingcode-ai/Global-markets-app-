import pg from 'pg';
import { ResearchEvent, ResearchConfig } from '../types/marketResearch';
import {
  getResearchConfig,
  findActiveEventForTicker,
  saveResearchEvent,
  updateResearchEvent,
  recordMarketMonitorRun
} from './marketResearchStore';
import { executeResearchForEvent } from './marketResearchAgent';

export interface MarketQuoteInput {
  symbol: string;
  price: number;
  changePercent: number;
  previousClose?: number;
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
  options?: { autoRunAgent?: boolean }
): Promise<MonitorRunResult> {
  const config = await getResearchConfig(pool);
  const autoRunAgent = options?.autoRunAgent !== false; // Default true

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

    if (!quote || typeof quote.changePercent !== 'number' || isNaN(quote.changePercent)) {
      continue; // Never evaluate on missing or fabricated quote data
    }

    // 2. Determine applicable threshold
    const category = config.categories[asset.categoryKey];
    const thresholdPct = asset.customThresholdPct ?? category?.thresholdPct ?? 5.0;

    const absChange = Math.abs(quote.changePercent);
    if (absChange >= thresholdPct) {
      triggeredCount++;
      console.log(`[Market Monitor] Trigger condition met for ${asset.symbol}: |${quote.changePercent.toFixed(2)}%| >= ${thresholdPct}%`);

      // 3. Event Deduplication (Section 12 of specification)
      const existingActiveEvent = await findActiveEventForTicker(
        asset.symbol,
        config.dedupWindowHours || 24,
        pool
      );

      if (existingActiveEvent) {
        console.log(`[Market Monitor] Dedup: Active event already exists for ${asset.symbol} (Event ID: ${existingActiveEvent.id}, Status: ${existingActiveEvent.status}). Skipping duplicate creation.`);
        // Keep quote movement fresh on active event without spawning duplicate report
        await updateResearchEvent(
          existingActiveEvent.id,
          {
            changePercent: quote.changePercent,
            currentPrice: quote.price,
            lastCheckedAt: new Date().toISOString()
          },
          pool
        );
        skippedDedupCount++;
        continue;
      }

      // 4. Create NEW qualifying ResearchEvent
      const eventId = `evt_${Date.now()}_${asset.symbol.toLowerCase()}`;
      const direction = quote.changePercent >= 0 ? 'UP' : 'DOWN';
      const todayDateStr = new Date().toISOString().slice(0, 10);
      const fingerprint = `${asset.symbol}_${direction}_${todayDateStr}`;

      const previousClose = quote.previousClose ?? 
        (quote.price > 0 && quote.changePercent !== -100 ? quote.price / (1 + quote.changePercent / 100) : quote.price);

      const newEvent: ResearchEvent = {
        id: eventId,
        ticker: asset.symbol,
        assetName: asset.name,
        assetClass: asset.assetClass,
        changePercent: Number(quote.changePercent.toFixed(2)),
        currentPrice: Number(quote.price.toFixed(2)),
        previousClose: Number(previousClose.toFixed(2)),
        period: '1D',
        triggeredAt: new Date().toISOString(),
        status: 'NEW',
        fingerprint,
        lastCheckedAt: new Date().toISOString()
      };

      await saveResearchEvent(newEvent, pool);
      newEvents.push(newEvent);

      // 5. Trigger Deep Market Research Agent
      if (autoRunAgent) {
        // Run agent asynchronously in background so monitor cycle does not block
        executeResearchForEvent(newEvent, pool).catch(agentErr => {
          console.error(`[Market Monitor] Error executing research agent for ${newEvent.ticker}:`, agentErr);
        });
      }
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
  let quote = await quoteFetcher(normalizedSymbol);
  if (!quote && options?.customMovePct !== undefined) {
    quote = {
      symbol: normalizedSymbol,
      price: 100.0,
      changePercent: options.customMovePct,
      previousClose: 100.0 / (1 + options.customMovePct / 100)
    };
  }

  if (!quote) {
    return { success: false, error: `Could not fetch quote for ${normalizedSymbol}. Cannot fabricate market data.` };
  }

  const changePercent = options?.customMovePct !== undefined ? options.customMovePct : quote.changePercent;

  // Check deduplication unless forced
  if (!options?.force) {
    const existing = await findActiveEventForTicker(normalizedSymbol, config.dedupWindowHours || 24, pool);
    if (existing && existing.status !== 'CLOSED' && existing.status !== 'COOLED_DOWN') {
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
    changePercent: Number(changePercent.toFixed(2)),
    currentPrice: Number(quote.price.toFixed(2)),
    previousClose: Number((quote.previousClose || quote.price).toFixed(2)),
    period: '1D',
    triggeredAt: new Date().toISOString(),
    status: 'NEW',
    fingerprint,
    lastCheckedAt: new Date().toISOString()
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
