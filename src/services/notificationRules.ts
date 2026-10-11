import { LiveQuote } from '../types';

export const MAX_ALERT_TRADE_AGE_MS = 120_000;
export const MAX_PROVIDER_CLOCK_SKEW_MS = 5_000;
export const MAX_ALERT_OBSERVATION_GAP_MS = 120_000;
export const SEC_NOTIFICATION_MAX_AGE_MS = 10 * 60_000;

export interface QuoteObservation {
  sessionDate: string;
  tradeTimeMs: number;
  price: number;
  changePercent: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
}

const QUOTE_OBSERVATION_STORAGE_KEY = 'veritas_institutional_quote_observations_v1';
const memoryQuoteObservations = new Map<string, QuoteObservation>();

export function getQuoteObservation(symbol: string): QuoteObservation | null {
  if (!symbol) return null;
  const memoryValue = memoryQuoteObservations.get(symbol);
  if (memoryValue) return memoryValue;
  try {
    const raw = localStorage.getItem(QUOTE_OBSERVATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, QuoteObservation>;
    const value = parsed[symbol];
    if (!value || !Number.isFinite(value.tradeTimeMs) || !Number.isFinite(value.price) || !Number.isFinite(value.changePercent)) return null;
    memoryQuoteObservations.set(symbol, value);
    return value;
  } catch {
    return null;
  }
}

export function saveQuoteObservation(symbol: string, observation: QuoteObservation): void {
  if (!symbol) return;
  memoryQuoteObservations.set(symbol, observation);
  try {
    const raw = localStorage.getItem(QUOTE_OBSERVATION_STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) as Record<string, QuoteObservation> : {};
    const merged = { ...saved, [symbol]: observation };
    const cutoff = Date.now() - 14 * 86400_000;
    for (const [key, value] of Object.entries(merged)) {
      if (!value || !Number.isFinite(value.tradeTimeMs) || value.tradeTimeMs < cutoff) delete merged[key];
    }
    localStorage.setItem(QUOTE_OBSERVATION_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // The in-memory observation still prevents repeats until this page closes.
  }
}

export interface EligibleMarketQuote {
  tradeTimeMs: number;
  sessionDate: string;
  price: number;
  changePercent: number;
  previousClose: number;
  timezone: string;
}

export interface AlertPreviousCloseInput {
  officialPreviousClose?: number;
  chartPreviousClose?: number;
  chartRange: string;
  regularSessionStartSeconds?: number;
  timestampsSeconds: number[];
  closes: Array<number | null | undefined>;
}

function isPositiveFinite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/** Selects a source-verified prior close for percentage alerts, never backsolving. */
export function getVerifiedAlertPreviousClose(input: AlertPreviousCloseInput): number | undefined {
  if (isPositiveFinite(input.officialPreviousClose)) return input.officialPreviousClose;
  const sessionStart = input.regularSessionStartSeconds;
  if (!Number.isFinite(sessionStart)) return undefined;
  if (
    input.chartRange === '1d' && isPositiveFinite(input.chartPreviousClose) &&
    input.timestampsSeconds.some(timestamp => timestamp === sessionStart)
  ) {
    return input.chartPreviousClose;
  }

  let closestPriorTimestamp = 0;
  let closestPriorClose: number | undefined;
  for (let index = 0; index < Math.min(input.timestampsSeconds.length, input.closes.length); index++) {
    const timestamp = input.timestampsSeconds[index];
    const close = input.closes[index];
    if (Number.isFinite(timestamp) && timestamp < (sessionStart as number) && isPositiveFinite(close) && timestamp > closestPriorTimestamp) {
      closestPriorTimestamp = timestamp;
      closestPriorClose = close;
    }
  }
  return closestPriorTimestamp > 0 && (sessionStart as number) - closestPriorTimestamp <= 5 * 86400
    ? closestPriorClose
    : undefined;
}

function parseTimestamp(value: string | number | undefined): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value < 10_000_000_000 ? value * 1000 : value;
  }
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getProviderSessionDate(timestampMs: number, timezone: string): string | null {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(timestampMs);
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return values.year && values.month && values.day
      ? `${values.year}-${values.month}-${values.day}`
      : null;
  } catch {
    return null;
  }
}

/**
 * Alert eligibility uses the provider's actual trade time, source session window,
 * current price, and prior official close. Fetch time and `marketState` alone are
 * deliberately insufficient because expired cache entries can retain both.
 */
export function getEligibleMarketQuote(
  quote: LiveQuote | null | undefined,
  nowMs = Date.now()
): EligibleMarketQuote | null {
  if (!quote || quote.isLive !== true || quote.marketState !== 'REGULAR' || (typeof quote.providerDelaySeconds === 'number' && quote.providerDelaySeconds > 0)) return null;
  const tradeTimeMs = parseTimestamp(quote.providerTradeTimestamp);
  const startMs = parseTimestamp(quote.regularSessionStartMs);
  const endMs = parseTimestamp(quote.regularSessionEndMs);
  const price = quote.alertCurrentPrice;
  const previousClose = quote.alertPreviousClose;
  const timezone = quote.exchangeTimezoneName;
  if (
    tradeTimeMs === null || startMs === null || endMs === null ||
    !Number.isFinite(price) || !Number.isFinite(previousClose) ||
    (price as number) <= 0 || (previousClose as number) <= 0 ||
    typeof timezone !== 'string' || !timezone ||
    startMs >= endMs || nowMs < startMs || nowMs >= endMs ||
    tradeTimeMs < startMs || tradeTimeMs >= endMs ||
    tradeTimeMs > nowMs + MAX_PROVIDER_CLOCK_SKEW_MS ||
    nowMs - tradeTimeMs > MAX_ALERT_TRADE_AGE_MS
  ) {
    return null;
  }

  // Provider sessions can span midnight in the exchange timezone. Dedupe and
  // observation identity follow the session start, matching the research monitor.
  const sessionDate = getProviderSessionDate(startMs, timezone);
  const changePercent = ((price as number) - (previousClose as number)) / (previousClose as number) * 100;
  if (!sessionDate || !Number.isFinite(changePercent)) return null;
  return {
    tradeTimeMs,
    sessionDate,
    price: price as number,
    changePercent,
    previousClose: previousClose as number,
    timezone
  };
}

export function getNewMomentumCrossing(previousPercent: number, currentPercent: number): {
  direction: 'up' | 'down';
  threshold: number;
  crossedThresholds: number[];
} | null {
  if (!Number.isFinite(previousPercent) || !Number.isFinite(currentPercent)) return null;
  if (currentPercent >= 5 && previousPercent < currentPercent) {
    const crossedThresholds = [5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30, 35, 40, 50]
      .filter(level => currentPercent >= level && previousPercent < level);
    return crossedThresholds.length > 0
      ? { direction: 'up', threshold: crossedThresholds[crossedThresholds.length - 1], crossedThresholds }
      : null;
  }
  if (currentPercent <= -5 && previousPercent > currentPercent) {
    const crossedThresholds = [-5, -7.5, -10, -12.5, -15, -17.5, -20, -22.5, -25, -27.5, -30, -35, -40, -50]
      .filter(level => currentPercent <= level && previousPercent > level);
    return crossedThresholds.length > 0
      ? { direction: 'down', threshold: crossedThresholds[crossedThresholds.length - 1], crossedThresholds }
      : null;
  }
  return null;
}

export function getNewConfiguredThresholdCrossing(
  previousPercent: number,
  currentPercent: number,
  thresholdPct: number
): 'up' | 'down' | null {
  if (!Number.isFinite(previousPercent) || !Number.isFinite(currentPercent) || !Number.isFinite(thresholdPct) || thresholdPct <= 0) return null;
  if (previousPercent < thresholdPct && currentPercent >= thresholdPct) return 'up';
  if (previousPercent > -thresholdPct && currentPercent <= -thresholdPct) return 'down';
  return null;
}

export function advanceQuoteObservation(
  previous: QuoteObservation | null,
  current: EligibleMarketQuote,
  quote: LiveQuote,
  maxGapMs = MAX_ALERT_OBSERVATION_GAP_MS
): { observation: QuoteObservation; mayTrigger: boolean; previous: QuoteObservation | null } {
  const next: QuoteObservation = {
    sessionDate: current.sessionDate,
    tradeTimeMs: current.tradeTimeMs,
    price: current.price,
    changePercent: current.changePercent,
    fiftyTwoWeekHigh: quote.is52WeekMetricsVerified ? quote.fiftyTwoWeekHigh : undefined,
    fiftyTwoWeekLow: quote.is52WeekMetricsVerified ? quote.fiftyTwoWeekLow : undefined
  };
  if (!previous || previous.sessionDate !== current.sessionDate) {
    return { observation: next, mayTrigger: false, previous: null };
  }
  if (current.tradeTimeMs <= previous.tradeTimeMs) {
    return { observation: previous, mayTrigger: false, previous: null };
  }
  if (current.tradeTimeMs - previous.tradeTimeMs > maxGapMs) {
    return { observation: next, mayTrigger: false, previous: null };
  }
  return { observation: next, mayTrigger: true, previous };
}

export function isFreshSecAcceptance(acceptanceDateTime: string | undefined, nowMs = Date.now()): boolean {
  if (!acceptanceDateTime || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(acceptanceDateTime)) return false;
  const acceptedMs = Date.parse(acceptanceDateTime);
  return Number.isFinite(acceptedMs) &&
    acceptedMs <= nowMs + MAX_PROVIDER_CLOCK_SKEW_MS &&
    nowMs - acceptedMs <= SEC_NOTIFICATION_MAX_AGE_MS;
}

export function formatNotificationEventTime(eventOccurredAt?: string, deliveredAt?: string, tradingDate?: string): string {
  const source = eventOccurredAt || deliveredAt;
  if (source && /^\d{4}-\d{2}-\d{2}$/.test(source)) return source;
  if (source) {
    const date = new Date(source);
    if (Number.isFinite(date.getTime())) {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(date);
    }
  }
  if (tradingDate && /^\d{4}-\d{2}-\d{2}$/.test(tradingDate)) return tradingDate;
  return 'Date unavailable';
}
