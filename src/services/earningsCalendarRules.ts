export type EarningsCalendarSession = 'BMO' | 'AMC' | 'UNKNOWN';
export type EarningsDateConfidence = 'CONFIRMED' | 'ESTIMATED' | 'UNKNOWN';
export type EarningsCalendarCoverage =
  | 'SCHEDULED'
  | 'NO_DATE'
  | 'UNAVAILABLE'
  | 'UNSUPPORTED'
  | 'IDENTITY_MISMATCH';

export interface LiveEarningsDateData {
  symbol: string;
  providerSymbol?: string;
  providerName?: string;
  quoteType?: string;
  providerDates: string[];
  reportTime: EarningsCalendarSession;
  timeZone?: string;
  dateConfidence: EarningsDateConfidence;
  coverage: EarningsCalendarCoverage;
  reason?: string;
  provider: 'Yahoo Finance';
  checkedAt: string;
  lastCheckedAt?: string;
  cached?: boolean;
}

type UnknownRecord = Record<string, unknown>;

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const COMPANY_SUFFIXES = new Set([
  'ag', 'asa', 'bhd', 'bv', 'co', 'company', 'corp', 'corporation', 'gmbh', 'inc', 'incorporated',
  'limited', 'llc', 'lp', 'ltd', 'nv', 'of', 'plc', 'sa', 'se', 'spa', 'sarl', 'the'
]);

function asRecord(value: unknown): UnknownRecord | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function isCalendarDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_KEY_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function normalizedCompanyTokens(value: string): string[] {
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  return normalized.split(/\s+/).filter(token => token && !COMPANY_SUFFIXES.has(token));
}

function compactCompanyIdentity(value: string): string {
  return normalizedCompanyTokens(value).join('');
}

export function providerCompanyNameMatches(expectedName: string, providerName: string): boolean {
  const expectedTokens = normalizedCompanyTokens(expectedName);
  const actualTokens = normalizedCompanyTokens(providerName);
  const expectedCompact = compactCompanyIdentity(expectedName);
  const actualCompact = compactCompanyIdentity(providerName);
  if (expectedCompact && expectedCompact === actualCompact) return true;

  const expected = new Set(expectedTokens);
  const actual = new Set(actualTokens);
  if (!expected.size || !actual.size) return false;
  const declaredAcronyms = [...expectedName.matchAll(/\(([A-Z0-9]{2,})\)/g)].map(match => match[1].toLowerCase());
  if (declaredAcronyms.some(acronym => actual.has(acronym))) return true;
  const overlap = [...expected].filter(token => actual.has(token));
  const smallerNameTokenCount = Math.min(expected.size, actual.size);
  // Require multiple shared tokens unless the compact legal-name forms match exactly.
  return overlap.length >= 2 && overlap.length / smallerNameTokenCount >= 0.5;
}

function getBooleanFlag(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  const record = asRecord(value);
  if (typeof record?.raw === 'boolean') return record.raw;
  if (typeof record?.fmt === 'string') {
    if (record.fmt.toLowerCase() === 'true') return true;
    if (record.fmt.toLowerCase() === 'false') return false;
  }
  return undefined;
}

function getExplicitSession(earnings: UnknownRecord): EarningsCalendarSession {
  const candidates = [earnings.reportTime, earnings.session, earnings.earningsSession];
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;
    const normalized = candidate.trim().toUpperCase();
    if (normalized === 'BMO' || normalized === 'AMC') return normalized;
  }
  return 'UNKNOWN';
}

function getSourceDates(earnings: UnknownRecord): string[] {
  if (!Array.isArray(earnings.earningsDate)) return [];
  return [...new Set(earnings.earningsDate
    .map(value => asRecord(value)?.fmt)
    .filter((value): value is string => isCalendarDateKey(value)))]
    .sort((left, right) => left.localeCompare(right));
}

function getSourceTimeZone(price: UnknownRecord): string | undefined {
  const value = asString(price.exchangeTimezoneName) || asString(price.timezone) || asString(price.timeZone);
  return value && value.includes('/') ? value : undefined;
}

function resultFor(
  symbol: string,
  checkedAt: string,
  coverage: EarningsCalendarCoverage,
  reason: string,
  values: Partial<LiveEarningsDateData> = {}
): LiveEarningsDateData {
  return {
    symbol,
    providerDates: [],
    reportTime: 'UNKNOWN',
    dateConfidence: 'UNKNOWN',
    coverage,
    reason,
    provider: 'Yahoo Finance',
    checkedAt,
    ...values
  };
}

export function createUnavailableEarningsCalendarData(symbol: string, reason: string, checkedAt = new Date().toISOString()): LiveEarningsDateData {
  return resultFor(symbol.toUpperCase().trim(), checkedAt, 'UNAVAILABLE', reason);
}

export function createUnsupportedEarningsCalendarData(symbol: string, reason: string, checkedAt = new Date().toISOString()): LiveEarningsDateData {
  return resultFor(symbol.toUpperCase().trim(), checkedAt, 'UNSUPPORTED', reason);
}

/** Parse one Yahoo QuoteSummary response without supplying local fallback dates or timing. */
export function parseYahooEarningsCalendarPayload(args: {
  symbol: string;
  expectedProviderSymbol: string;
  expectedCompanyName: string;
  payload: unknown;
  checkedAt: string;
}): LiveEarningsDateData {
  const symbol = args.symbol.toUpperCase().trim();
  const expectedProviderSymbol = args.expectedProviderSymbol.toUpperCase().trim();
  const payload = asRecord(args.payload);
  const quoteSummary = asRecord(payload?.quoteSummary);
  const result = Array.isArray(quoteSummary?.result) ? asRecord(quoteSummary.result[0]) : undefined;
  const price = asRecord(result?.price);
  const providerSymbol = asString(price?.symbol)?.toUpperCase();
  const providerName = asString(price?.longName) || asString(price?.shortName);
  const quoteType = asString(price?.quoteType) || asString(asRecord(result?.quoteType)?.quoteType);

  if (!result || !price || !providerSymbol) {
    return resultFor(symbol, args.checkedAt, 'UNAVAILABLE', 'Yahoo returned no quote identity for this symbol.');
  }

  if (providerSymbol !== expectedProviderSymbol || !providerName || !providerCompanyNameMatches(args.expectedCompanyName, providerName)) {
    return resultFor(symbol, args.checkedAt, 'IDENTITY_MISMATCH', 'Yahoo returned a different or unverified company identity.', {
      providerSymbol,
      providerName,
      quoteType
    });
  }

  if (quoteType && quoteType.toUpperCase() !== 'EQUITY') {
    return resultFor(symbol, args.checkedAt, 'UNSUPPORTED', 'Yahoo did not identify this instrument as an equity.', {
      providerSymbol,
      providerName,
      quoteType
    });
  }

  const calendar = asRecord(result.calendarEvents);
  const earnings = asRecord(calendar?.earnings);
  const providerDates = earnings ? getSourceDates(earnings) : [];
  const estimateFlag = earnings ? getBooleanFlag(earnings.isEarningsDateEstimate) : undefined;
  const dateConfidence: EarningsDateConfidence = estimateFlag === true
    ? 'ESTIMATED'
    : estimateFlag === false
      ? 'CONFIRMED'
      : 'UNKNOWN';

  if (!providerDates.length) {
    return resultFor(symbol, args.checkedAt, 'NO_DATE', 'Yahoo returned no earnings date for this equity.', {
      providerSymbol,
      providerName,
      quoteType,
      dateConfidence,
      reportTime: earnings ? getExplicitSession(earnings) : 'UNKNOWN',
      timeZone: getSourceTimeZone(price)
    });
  }

  return resultFor(symbol, args.checkedAt, 'SCHEDULED', '', {
    providerSymbol,
    providerName,
    quoteType,
    providerDates,
    reportTime: getExplicitSession(earnings!),
    timeZone: getSourceTimeZone(price),
    dateConfidence
  });
}

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

export function getLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${padDatePart(date.getUTCMonth() + 1)}-${padDatePart(date.getUTCDate())}`;
}

export function getWeekStartForDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay();
  return addDaysToDateKey(dateKey, -(weekday === 0 ? 6 : weekday - 1));
}

export function getUpcomingWeekStart(now = new Date()): string {
  const localDateKey = getLocalDateKey(now);
  const weekday = now.getDay();
  if (weekday === 6) return addDaysToDateKey(localDateKey, 2);
  if (weekday === 0) return addDaysToDateKey(localDateKey, 1);
  return getWeekStartForDateKey(localDateKey);
}

export function getMonthStartForDateKey(dateKey: string): string {
  const [year, month] = dateKey.split('-').map(Number);
  return `${year}-${padDatePart(month)}-01`;
}

export function addMonthsToDateKey(monthStartKey: string, months: number): string {
  const [year, month] = monthStartKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + months, 1));
  return `${date.getUTCFullYear()}-${padDatePart(date.getUTCMonth() + 1)}-01`;
}

/** A stable Monday-first six-row month grid, including leading/trailing month days. */
export function getMonthGridDateKeys(monthStartKey: string): string[] {
  const firstDate = getMonthStartForDateKey(monthStartKey);
  const [year, month, day] = firstDate.split('-').map(Number);
  const firstDay = new Date(Date.UTC(year, month - 1, day));
  const offsetToMonday = firstDay.getUTCDay() === 0 ? 6 : firstDay.getUTCDay() - 1;
  const gridStart = addDaysToDateKey(firstDate, -offsetToMonday);
  return Array.from({ length: 42 }, (_, index) => addDaysToDateKey(gridStart, index));
}

export function getWeekdayDateKeys(weekStart: string): string[] {
  return Array.from({ length: 5 }, (_, index) => addDaysToDateKey(weekStart, index));
}

export function providerDatesOverlapWeek(providerDates: string[], weekStart: string): boolean {
  return providerDatesOverlapRange(providerDates, weekStart, addDaysToDateKey(weekStart, 6));
}

export function providerDatesOverlapRange(providerDates: string[], rangeStart: string, rangeEnd: string): boolean {
  const validDates = providerDates.filter(isCalendarDateKey).sort((left, right) => left.localeCompare(right));
  if (!validDates.length) return false;
  // Yahoo can return an estimated date window; its span can overlap the displayed range
  // even when neither endpoint itself is inside it.
  return validDates[0] <= rangeEnd && validDates[validDates.length - 1] >= rangeStart;
}

