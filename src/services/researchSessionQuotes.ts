import type { ResearchEvent } from '../types/marketResearch';
import type { MarketQuoteInput } from './marketResearchMonitor';

// These aliases are used only for research history/monitoring. A missing symbol
// is queried as-is; a failed lookup must never become a fabricated quote.
export const RESEARCH_YAHOO_ALIASES: Record<string, string> = {
  WTI: 'CL=F', BRENT: 'BZ=F', GOLD: 'GC=F', SILVER: 'SI=F',
  COPPER: 'HG=F', NG: 'NG=F', TTF: 'TTF=F', JKM: 'JKM=F',
  WHEAT: 'ZW=F', CORN: 'ZC=F', RBOB: 'RB=F', HO: 'HO=F',
  US10Y: '^TNX', US30Y: '^TYX', US2Y: '2Y=F',
  ASML: 'ASML.AS', SAP: 'SAP.DE', PRX: 'PRX.AS', ADYEN: 'ADYEN.AS',
  IFX: 'IFX.DE', SU: 'SU.PA', SIE: 'SIE.DE',
  TSM: '2330.TW', TOELY: '8035.T', ATEYY: '6857.T',
  SSNLF: '005930.KS', HXSCF: '000660.KS', SMICY: '0981.HK',
  KIOXIA: '285A.T', TCEHY: '0700.HK', NTDOY: '7974.T',
  DRO: 'DRO.AX', STM: 'STMPA.PA'
};

export type YahooChart = {
  meta?: {
    symbol?: string;
    exchangeTimezoneName?: string;
    regularMarketPrice?: number;
    regularMarketTime?: number;
    regularMarketChangePercent?: number;
    regularMarketChange?: number;
    regularMarketPreviousClose?: number;
    previousClose?: number;
    currentTradingPeriod?: { regular?: { start?: number; end?: number } };
  };
  timestamp?: number[];
  indicators?: { quote?: Array<{ close?: Array<number | null> }> };
};

const historyCache = new Map<string, { at: number; chart: YahooChart | null }>();

export function researchYahooSymbol(symbol: string): string {
  const upper = symbol.trim().toUpperCase();
  return RESEARCH_YAHOO_ALIASES[upper] || upper;
}

async function fetchChart(symbol: string, range: string): Promise<YahooChart | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${range}&includePrePost=false`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) return null;
    const json = await response.json();
    return json?.chart?.result?.[0] || null;
  } catch {
    return null;
  }
}

/** Only a fresh quote from an open regular session may create an automatic trigger. */
export async function fetchVerifiedResearchQuote(symbol: string, nowMs = Date.now()): Promise<MarketQuoteInput | null> {
  const marketSymbol = researchYahooSymbol(symbol);
  const chart = await fetchChart(marketSymbol, '5d');
  return parseVerifiedResearchQuote(symbol, chart, nowMs);
}

/** Interpret regular-session quote fields, never the start-of-range chartPreviousClose. */
export function parseVerifiedResearchQuote(symbol: string, chart: YahooChart | null, nowMs = Date.now()): MarketQuoteInput | null {
  const marketSymbol = researchYahooSymbol(symbol);
  const meta = chart?.meta;
  const regular = meta?.currentTradingPeriod?.regular;
  const now = nowMs / 1000;
  if (meta?.symbol?.toUpperCase() !== marketSymbol.toUpperCase() || !meta.exchangeTimezoneName ||
      !regular?.start || !regular?.end || regular.end <= regular.start ||
      now < regular.start || now >= regular.end ||
      !meta?.regularMarketTime || meta.regularMarketTime < regular.start ||
      meta.regularMarketTime >= regular.end ||
      now - meta.regularMarketTime > 2 * 60 || meta.regularMarketTime > now + 60 ||
      !Number.isFinite(meta.regularMarketPrice) || meta.regularMarketPrice! <= 0) return null;

  // Yahoo sometimes omits the explicit previous close. Its regular quote change
  // still gives that reference directly; daily futures bars can use a different
  // settlement reference and chartPreviousClose can cover several days.
  const reportedPct = meta.regularMarketChangePercent;
  const previousClose = meta.regularMarketPreviousClose ??
    (Number.isFinite(meta.regularMarketChange) ? meta.regularMarketPrice! - meta.regularMarketChange! :
      Number.isFinite(reportedPct) && reportedPct! > -100 ? meta.regularMarketPrice! / (1 + reportedPct! / 100) : undefined);
  if (!Number.isFinite(previousClose) || previousClose! <= 0) return null;
  const changePercent = (meta.regularMarketPrice! / previousClose! - 1) * 100;
  if (!Number.isFinite(changePercent) || (Number.isFinite(reportedPct) && Math.abs(changePercent - reportedPct!) > 0.05)) return null;
  let sessionDate: string;
  try { sessionDate = exchangeDate(regular.start * 1000, meta.exchangeTimezoneName); }
  catch { return null; }
  return {
    symbol, marketSymbol, price: meta.regularMarketPrice!, previousClose: previousClose!,
    changePercent, quoteTime: new Date(meta.regularMarketTime * 1000).toISOString(),
    sessionStart: new Date(regular.start * 1000).toISOString(),
    sessionEnd: new Date(regular.end * 1000).toISOString(),
    sessionDate,
    isVerifiedRegularSession: true
  };
}

function exchangeDate(epochMs: number, zone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date(epochMs));
  const value = (type: string) => parts.find(part => part.type === type)?.value || '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export interface ResearchSessionSnapshot {
  state: 'LIVE' | 'CLOSED' | 'UNKNOWN';
  closePrice?: number;
  closeChangePercent?: number;
  closeSource?: string;
}

/** Match the event's exchange-local session to a Yahoo regular daily bar. */
export async function getResearchSessionSnapshot(
  event: ResearchEvent, nowMs = Date.now()
): Promise<ResearchSessionSnapshot> {
  if (!event.triggeredAt || !Number.isFinite(Date.parse(event.triggeredAt))) return { state: 'UNKNOWN' };
  const storedStart = Date.parse(event.sessionStart || '');
  const storedEnd = Date.parse(event.sessionEnd || '');
  const storedSession = Number.isFinite(storedStart) && Number.isFinite(storedEnd) && storedEnd > storedStart;
  if (storedSession && nowMs >= storedStart && nowMs < storedEnd) return { state: 'LIVE' };
  if (storedSession && nowMs < storedStart) return { state: 'UNKNOWN' };
  const symbol = event.marketSymbol || researchYahooSymbol(event.ticker);
  let entry = historyCache.get(symbol);
  if (!entry || nowMs - entry.at > (entry.chart ? 5 * 60_000 : 60_000)) {
    entry = { at: nowMs, chart: await fetchChart(symbol, '1y') };
    historyCache.set(symbol, entry);
  }
  const chart = entry.chart;
  const regular = chart?.meta?.currentTradingPeriod?.regular;
  const zone = chart?.meta?.exchangeTimezoneName;
  if (!chart || !zone || !regular?.start || !regular?.end) return { state: storedSession && nowMs >= storedEnd ? 'CLOSED' : 'UNKNOWN' };

  const eventDay = event.sessionDate || exchangeDate(Date.parse(event.triggeredAt), zone);
  const today = exchangeDate(nowMs, zone);
  const nowSec = nowMs / 1000;
  const sameDay = eventDay === today;
  const live = !storedSession && sameDay && nowSec >= regular.start && nowSec < regular.end;
  if (live) return { state: 'LIVE' };

  // Session ends at the official boundary; the close bar needs extra time to settle.
  const ended = storedSession ? nowMs >= storedEnd : eventDay < today || (sameDay && nowSec >= regular.end) ||
    (sameDay && regular.start > nowSec);
  if (!ended) return { state: 'UNKNOWN' };
  if (sameDay && nowSec >= regular.end && nowSec < regular.end + 15 * 60) {
    return { state: 'CLOSED' };
  }

  const timestamps = chart.timestamp || [];
  const closes = chart.indicators?.quote?.[0]?.close || [];
  const index = timestamps.findIndex(ts => exchangeDate(ts * 1000, zone) === eventDay);
  const close = index >= 0 ? closes[index] : null;
  const prior = index > 0 ? closes[index - 1] : null;
  if (typeof close !== 'number' || !Number.isFinite(close) || close <= 0) {
    return { state: 'CLOSED' };
  }
  return {
    state: 'CLOSED', closePrice: close,
    closeChangePercent: typeof prior === 'number' && Number.isFinite(prior) && prior > 0
      ? (close / prior - 1) * 100 : undefined,
    closeSource: 'Yahoo Finance daily regular close'
  };
}
