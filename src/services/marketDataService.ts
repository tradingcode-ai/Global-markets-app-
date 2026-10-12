import { LiveQuote, NotificationAssetCatalogItem } from '../types';
import { createUnavailableEarningsCalendarData, LiveEarningsDateData } from './earningsCalendarRules';

export async function fetchLiveMarketQuotes(symbols?: string[]): Promise<Record<string, LiveQuote>> {
  try {
    const url = symbols && symbols.length > 0
      ? `/api/market-quotes?symbols=${encodeURIComponent(symbols.join(','))}`
      : '/api/market-quotes';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.quotes || {};
  } catch (err) {
    console.warn('Failed to fetch live market quotes:', err);
    return {};
  }
}

export async function fetchNotificationAssetCatalog(): Promise<NotificationAssetCatalogItem[]> {
  try {
    const response = await fetch('/api/notification-assets');
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const payload = await response.json();
    return Array.isArray(payload?.assets) ? payload.assets : [];
  } catch (error) {
    console.warn('Could not load notification asset catalog:', error);
    return [];
  }
}

export async function fetchNotificationAssetQuotes(symbols: string[]): Promise<{ quotes: Record<string, LiveQuote>; unavailableSymbols: string[]; unprocessedSymbols: string[] }> {
  const normalized = [...new Set(symbols.map(symbol => symbol.toUpperCase().trim()).filter(Boolean))];
  if (!normalized.length) return { quotes: {}, unavailableSymbols: [], unprocessedSymbols: [] };
  const batches: string[][] = [];
  for (let index = 0; index < normalized.length; index += 80) batches.push(normalized.slice(index, index + 80));
  const results = await Promise.all(batches.map(async batch => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180_000);
    try {
      const response = await fetch('/api/notification-asset-quotes?symbols=' + encodeURIComponent(batch.join(',')), { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const payload = await response.json();
      return {
        quotes: payload?.quotes && typeof payload.quotes === 'object' ? payload.quotes as Record<string, LiveQuote> : {},
        unavailableSymbols: Array.isArray(payload?.unavailableSymbols) ? payload.unavailableSymbols as string[] : [],
        unprocessedSymbols: Array.isArray(payload?.unprocessedSymbols) ? payload.unprocessedSymbols as string[] : []
      };
    } catch (error) {
      console.warn('Could not load verified notification asset quotes:', error);
      return { quotes: {}, unavailableSymbols: batch, unprocessedSymbols: [] };
    } finally {
      clearTimeout(timeout);
    }
  }));
  return results.reduce((combined, result) => ({
    quotes: { ...combined.quotes, ...result.quotes },
    unavailableSymbols: [...combined.unavailableSymbols, ...result.unavailableSymbols],
    unprocessedSymbols: [...combined.unprocessedSymbols, ...result.unprocessedSymbols]
  }), { quotes: {} as Record<string, LiveQuote>, unavailableSymbols: [] as string[], unprocessedSymbols: [] as string[] });
}

export async function fetchNotificationStockQuotes(symbols: string[]): Promise<{ quotes: Record<string, LiveQuote>; unavailableSymbols: string[]; unprocessedSymbols: string[] }> {
  const normalized = [...new Set(symbols.map(symbol => symbol.toUpperCase().trim()).filter(Boolean))];
  if (!normalized.length) return { quotes: {}, unavailableSymbols: [], unprocessedSymbols: [] };
  const batches: string[][] = [];
  for (let index = 0; index < normalized.length; index += 80) batches.push(normalized.slice(index, index + 80));
  const results = await Promise.all(batches.map(async batch => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180_000);
    try {
      const response = await fetch('/api/market-quotes?alertOnly=1&symbols=' + encodeURIComponent(batch.join(',')), { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const payload = await response.json();
      return {
        quotes: payload?.quotes && typeof payload.quotes === 'object' ? payload.quotes as Record<string, LiveQuote> : {},
        unavailableSymbols: Array.isArray(payload?.unavailableSymbols) ? payload.unavailableSymbols as string[] : [],
        unprocessedSymbols: Array.isArray(payload?.unprocessedSymbols) ? payload.unprocessedSymbols as string[] : []
      };
    } catch (error) {
      console.warn('Could not load selected-stock notification quotes:', error);
      return { quotes: {}, unavailableSymbols: batch, unprocessedSymbols: [] };
    } finally {
      clearTimeout(timeout);
    }
  }));
  return results.reduce((combined, result) => ({
    quotes: { ...combined.quotes, ...result.quotes },
    unavailableSymbols: [...combined.unavailableSymbols, ...result.unavailableSymbols],
    unprocessedSymbols: [...combined.unprocessedSymbols, ...result.unprocessedSymbols]
  }), { quotes: {} as Record<string, LiveQuote>, unavailableSymbols: [] as string[], unprocessedSymbols: [] as string[] });
}

export async function fetchLiveEarningsCalendar(
  symbols: string[],
  options: {
    forceRefresh?: boolean;
    signal?: AbortSignal;
    onBatch?: (batch: Record<string, LiveEarningsDateData>) => void;
  } = {}
): Promise<Record<string, LiveEarningsDateData>> {
  const normalized = [...new Set(symbols.map(symbol => symbol.toUpperCase().trim()).filter(Boolean))];
  const combined: Record<string, LiveEarningsDateData> = {};
  const batchSize = 12;

  for (let offset = 0; offset < normalized.length; offset += batchSize) {
    if (options.signal?.aborted) break;
    const batch = normalized.slice(offset, offset + batchSize);
    const controller = new AbortController();
    const abortFromCaller = () => controller.abort();
    options.signal?.addEventListener('abort', abortFromCaller, { once: true });
    const timeout = setTimeout(() => controller.abort(), 90_000);
    try {
      const query = new URLSearchParams({ symbols: batch.join(',') });
      if (options.forceRefresh) query.set('refresh', '1');
      const response = await fetch(`/api/earnings-calendar?${query.toString()}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const payload = await response.json();
      const received = payload?.calendar && typeof payload.calendar === 'object'
        ? payload.calendar as Record<string, LiveEarningsDateData>
        : {};
      const checkedAt = new Date().toISOString();
      const batchResult: Record<string, LiveEarningsDateData> = {};
      for (const symbol of batch) {
        const data = received[symbol];
        batchResult[symbol] = data && data.symbol === symbol
          ? data
          : createUnavailableEarningsCalendarData(symbol, 'The provider did not return a status for this ticker.', checkedAt);
      }
      Object.assign(combined, batchResult);
      options.onBatch?.(batchResult);
    } catch (error) {
      if (options.signal?.aborted) break;
      const checkedAt = new Date().toISOString();
      const reason = error instanceof Error && error.name === 'AbortError'
        ? 'The Yahoo calendar request timed out.'
        : 'The Yahoo calendar source could not be reached.';
      const failedBatch = Object.fromEntries(batch.map(symbol => [
        symbol,
        createUnavailableEarningsCalendarData(symbol, reason, checkedAt)
      ]));
      Object.assign(combined, failedBatch);
      options.onBatch?.(failedBatch);
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener('abort', abortFromCaller);
    }
  }

  return combined;
}

export async function fetchQuarterlyAnalystOutlook(symbols?: string[], forceRefresh = false): Promise<{ data: Record<string, any>; provider?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const baseUrl = symbols && symbols.length > 0
      ? `/api/quarterly-analyst-outlook?symbols=${encodeURIComponent(symbols.join(','))}`
      : '/api/quarterly-analyst-outlook';
    const url = forceRefresh
      ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}refresh=1`
      : baseUrl;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return {
      data: json.data || {},
      provider: json.provider
    };
  } catch (err) {
    console.warn('Failed to fetch quarterly analyst outlook:', err);
    return { data: {} };
  } finally {
    clearTimeout(timeout);
  }
}

const ANALYST_SNAPSHOT_STORAGE_KEY = 'global-markets-analyst-snapshots-v1';
const ANALYST_SNAPSHOT_MAX_AGE_MS = 12 * 60 * 60 * 1000;

export function getStoredAnalystSnapshots(): Record<string, any> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(ANALYST_SNAPSHOT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveAnalystSnapshots(snapshots: Record<string, any>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ANALYST_SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshots));
  } catch {
    // Ignore unavailable/full browser storage.
  }
}

export function mergeAnalystSnapshots(
  live: Record<string, any>,
  stored: Record<string, any>
): Record<string, any> {
  const merged: Record<string, any> = {};
  for (const [ticker, snapshot] of Object.entries(stored || {})) {
    if (!snapshot || snapshot.isLiveFeed !== true) continue;
    const capturedAt = Date.parse(snapshot.snapshotDate || '');
    if (!Number.isFinite(capturedAt) || capturedAt > Date.now() + 300000 || Date.now() - capturedAt > ANALYST_SNAPSHOT_MAX_AGE_MS) continue;
    merged[ticker] = {
      ...snapshot,
      dataSource: 'Yahoo Finance',
      isCachedSnapshot: true,
      reportedFinancials: snapshot.reportedFinancials
        ? { ...snapshot.reportedFinancials, isCachedSnapshot: true } : undefined
    };
  }
  for (const [ticker, snapshot] of Object.entries(live || {})) {
    if (!snapshot || snapshot.isLiveFeed !== true) continue;
    const capturedAt = Date.parse(snapshot.snapshotDate || '');
    if (!Number.isFinite(capturedAt) || capturedAt > Date.now() + 300000 || Date.now() - capturedAt > ANALYST_SNAPSHOT_MAX_AGE_MS) continue;
    const previous = merged[ticker];
    const hasEstimates = Number.isFinite(snapshot.nextQuarterEps) || Number.isFinite(snapshot.nextQuarterRevenue);
    const previousHasEstimates = previous && (Number.isFinite(previous.nextQuarterEps) || Number.isFinite(previous.nextQuarterRevenue));
    if (!hasEstimates && previousHasEstimates) {
      // An actuals-only response must not discard still-valid cached estimates.
      merged[ticker] = { ...previous, reportedFinancials: snapshot.reportedFinancials || previous.reportedFinancials };
      continue;
    }
    merged[ticker] = {
      ...snapshot,
      snapshotSavedAt: snapshot.snapshotSavedAt || new Date().toISOString(),
      dataSource: 'Yahoo Finance',
      // The endpoint retains a verified Yahoo response for up to 12 hours.
      // Keep that distinction visible instead of presenting it as a new fetch.
      isCachedSnapshot: snapshot.isProviderCache === true
    };
  }
  return merged;
}
