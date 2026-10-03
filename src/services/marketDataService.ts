import { LiveQuote } from '../types';

export interface LiveEarningsDateData {
  symbol: string;
  reportDate?: string;
  reportTime?: 'BMO' | 'AMC';
  isConfirmed?: boolean;
  provider?: string;
  epsEstimate?: number;
  revenueEstimate?: number;
}

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

export async function fetchLiveEarningsCalendar(symbols?: string[]): Promise<Record<string, LiveEarningsDateData>> {
  try {
    const url = symbols && symbols.length > 0
      ? `/api/earnings-calendar?symbols=${encodeURIComponent(symbols.join(','))}`
      : '/api/earnings-calendar';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.calendar || {};
  } catch (err) {
    console.warn('Failed to fetch live earnings calendar:', err);
    return {};
  }
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
