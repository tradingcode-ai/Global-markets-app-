import assert from 'node:assert/strict';
import { NOTIFICATION_APP_STOCKS } from '../data/allAppStocks';
import {
  addDaysToDateKey,
  addMonthsToDateKey,
  getMonthGridDateKeys,
  getMonthStartForDateKey,
  getUpcomingWeekStart,
  getWeekStartForDateKey,
  getWeekdayDateKeys,
  parseYahooEarningsCalendarPayload,
  providerCompanyNameMatches,
  providerDatesOverlapRange,
  providerDatesOverlapWeek
} from '../services/earningsCalendarRules';
import { YahooEarningsCalendarProvider } from '../services/yahooEarningsCalendarProvider';

// Synthetic Yahoo-shaped payloads and tickers in this script are isolated regression fixtures only;
// they are never imported by the application or returned from production routes.

function yahooPayload(args: {
  symbol: string;
  name: string;
  dates?: Array<{ fmt?: string; raw?: number }>;
  estimateFlag?: boolean | { raw: boolean };
  reportTime?: string;
  timeZone?: string;
}): unknown {
  const earnings: Record<string, unknown> = {};
  if (args.dates) earnings.earningsDate = args.dates;
  if (args.estimateFlag !== undefined) earnings.isEarningsDateEstimate = args.estimateFlag;
  if (args.reportTime) earnings.reportTime = args.reportTime;
  return {
    quoteSummary: {
      result: [{
        price: {
          symbol: args.symbol,
          longName: args.name,
          quoteType: 'EQUITY',
          exchangeTimezoneName: args.timeZone
        },
        calendarEvents: { earnings }
      }]
    }
  };
}

function providerReply(symbol: string, name: string, date = '2026-11-17'): Response {
  return new Response(JSON.stringify(yahooPayload({ symbol, name, dates: [{ fmt: date }], estimateFlag: false })), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
}

function assertFixture(name: string, passed: boolean): void {
  assert.ok(passed, `${name} fixture failed`);
}

async function testProviderCacheAndSingleflight(): Promise<void> {
  let quoteCalls = 0;
  let now = Date.parse('2026-10-11T12:00:00Z');
  const mockFetch: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    if (url.hostname === 'fc.yahoo.com') return new Response('', { status: 404, headers: { 'set-cookie': 'session=fixture; Path=/' } });
    if (url.pathname.endsWith('/getcrumb')) return new Response('fixture-crumb', { status: 200 });
    if (url.pathname.includes('/quoteSummary/NVDA')) {
      quoteCalls += 1;
      return providerReply('NVDA', 'NVIDIA Corporation');
    }
    return new Response('Not found', { status: 404 });
  };
  const provider = new YahooEarningsCalendarProvider({ mapSymbol: symbol => symbol, fetchImpl: mockFetch, now: () => now });
  const equity = { symbol: 'NVDA', name: 'NVIDIA Corporation' };
  const [first, duplicate] = await Promise.all([provider.get(equity), provider.get(equity)]);
  assert.equal(first.coverage, 'SCHEDULED');
  assert.equal(duplicate.coverage, 'SCHEDULED');
  assert.equal(quoteCalls, 1, 'same ticker requests should share in-flight provider work');
  now += 1000;
  const cached = await provider.get(equity);
  assert.equal(cached.cached, true);
  assert.equal(cached.checkedAt, first.checkedAt, 'cache retains original retrieval time');
  assert.notEqual(cached.lastCheckedAt, first.lastCheckedAt, 'cache tracks the latest local check separately');
  await provider.get(equity, true);
  assert.equal(quoteCalls, 2, 'force refresh should bypass a successful cache');
}

async function testProviderConcurrency(): Promise<void> {
  let active = 0;
  let maxActive = 0;
  const mockFetch: typeof fetch = async input => {
    const url = new URL(String(input));
    if (url.hostname === 'fc.yahoo.com') return new Response('', { status: 404, headers: { 'set-cookie': 'session=fixture; Path=/' } });
    if (url.pathname.endsWith('/getcrumb')) return new Response('fixture-crumb', { status: 200 });
    const symbol = decodeURIComponent(url.pathname.split('/').pop() || '');
    active += 1;
    maxActive = Math.max(maxActive, active);
    await new Promise(resolve => setTimeout(resolve, 5));
    active -= 1;
    return providerReply(symbol, `${symbol} Holdings Inc.`);
  };
  const provider = new YahooEarningsCalendarProvider({ mapSymbol: symbol => symbol, fetchImpl: mockFetch, maxConcurrent: 2 });
  await Promise.all(['AAA', 'BBB', 'CCC', 'DDD', 'EEE'].map(symbol => provider.get({ symbol, name: `${symbol} Holdings Inc.` })));
  assert.equal(maxActive, 2, 'provider quote concurrency should be bounded across concurrent calls');
}

async function testProviderBodyTimeout(): Promise<void> {
  const mockFetch: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    if (url.hostname === 'fc.yahoo.com') return new Response('', { status: 404, headers: { 'set-cookie': 'session=fixture; Path=/' } });
    if (url.pathname.endsWith('/getcrumb')) return new Response('fixture-crumb', { status: 200 });
    return {
      ok: true,
      status: 200,
      json: () => new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })), { once: true });
      })
    } as Response;
  };
  const provider = new YahooEarningsCalendarProvider({ mapSymbol: symbol => symbol, fetchImpl: mockFetch, quoteTimeoutMs: 15, authTimeoutMs: 50 });
  const startedAt = Date.now();
  let watchdog: ReturnType<typeof setTimeout> | undefined;
  const request = provider.get({ symbol: 'NVDA', name: 'NVIDIA Corporation' });
  const result = await Promise.race([
    request,
    new Promise<never>((_resolve, reject) => {
      watchdog = setTimeout(() => reject(new Error('provider body timeout regression: request exceeded test watchdog')), 1000);
    })
  ]).finally(() => {
    if (watchdog) clearTimeout(watchdog);
  });
  assert.equal(result.coverage, 'UNAVAILABLE');
  assert.ok(Date.now() - startedAt < 500, 'quote JSON body must remain under the bounded request timeout');
}

async function testConcurrentExpiredSessionRetry(): Promise<void> {
  let sessionCount = 0;
  let crumb = '';
  const mockFetch: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    if (url.hostname === 'fc.yahoo.com') {
      sessionCount += 1;
      return new Response('', { status: 404, headers: { 'set-cookie': `session=${sessionCount}; Path=/` } });
    }
    if (url.pathname.endsWith('/getcrumb')) {
      crumb = `crumb-${sessionCount}`;
      return new Response(crumb, { status: 200 });
    }
    const symbol = decodeURIComponent(url.pathname.split('/').pop() || '');
    const requestCrumb = new URLSearchParams(url.search).get('crumb');
    if (requestCrumb === 'crumb-1') {
      if (symbol === 'TSLA') await new Promise(resolve => setTimeout(resolve, 35));
      return new Response('expired', { status: 401 });
    }
    if (requestCrumb !== crumb) return new Response('expired', { status: 401 });
    return providerReply(symbol, symbol === 'NVDA' ? 'NVIDIA Corporation' : 'Tesla, Inc.');
  };
  const provider = new YahooEarningsCalendarProvider({ mapSymbol: symbol => symbol, fetchImpl: mockFetch, quoteTimeoutMs: 250 });
  const results = await Promise.all([
    provider.get({ symbol: 'NVDA', name: 'NVIDIA Corporation' }),
    provider.get({ symbol: 'TSLA', name: 'Tesla, Inc.' })
  ]);
  assert.deepEqual(results.map(result => result.coverage), ['SCHEDULED', 'SCHEDULED']);
  assert.equal(sessionCount, 2, 'a late rejection from an expired session must reuse the new shared session');
}

async function run(): Promise<void> {
  assert.ok(NOTIFICATION_APP_STOCKS.length >= 100, 'calendar should cover the complete app equity inventory');
  assert.equal(new Set(NOTIFICATION_APP_STOCKS.map(stock => stock.ticker)).size, NOTIFICATION_APP_STOCKS.length, 'inventory tickers should be unique');

  assertFixture('compact company identity', providerCompanyNameMatches('SK Hynix Inc.', 'SKHynix'));
  assertFixture('declared ticker acronym identity', providerCompanyNameMatches('ChangXin Memory Technologies (CXMT)', 'CXMT Corporation'));
  assertFixture('company mismatch rejection', !providerCompanyNameMatches('NVIDIA Corporation', 'Alphabet Inc.'));
  assertFixture('General Electric vs General Dynamics rejected', !providerCompanyNameMatches('General Electric Company', 'General Dynamics Corporation'));
  assertFixture('Bank of America vs Bank of China rejected', !providerCompanyNameMatches('Bank of America Corporation', 'Bank of China Limited'));

  const confirmed = parseYahooEarningsCalendarPayload({
    symbol: 'NVDA', expectedProviderSymbol: 'NVDA', expectedCompanyName: 'NVIDIA Corporation',
    payload: yahooPayload({ symbol: 'NVDA', name: 'NVIDIA Corporation', dates: [{ fmt: '2026-11-17', raw: 1794945600 }], estimateFlag: false }),
    checkedAt: '2026-10-11T12:00:00.000Z'
  });
  assert.equal(confirmed.coverage, 'SCHEDULED');
  assert.deepEqual(confirmed.providerDates, ['2026-11-17']);
  assert.equal(confirmed.dateConfidence, 'CONFIRMED');
  assert.equal(confirmed.reportTime, 'UNKNOWN', 'Yahoo does not imply AMC/BMO when timing is absent');
  assert.equal(confirmed.timeZone, undefined, 'no provider time zone is fabricated');

  const estimatedWindow = parseYahooEarningsCalendarPayload({
    symbol: 'NVDA', expectedProviderSymbol: 'NVDA', expectedCompanyName: 'NVIDIA Corporation',
    payload: yahooPayload({ symbol: 'NVDA', name: 'NVIDIA Corporation', dates: [{ fmt: '2026-10-10' }, { fmt: '2026-10-20' }], estimateFlag: { raw: true } }),
    checkedAt: '2026-10-11T12:00:00.000Z'
  });
  assert.equal(estimatedWindow.dateConfidence, 'ESTIMATED');
  assert.equal(estimatedWindow.providerDates.length, 2, 'possible dates remain one provider window, not separate weekday events');
  assert.equal(providerDatesOverlapWeek(estimatedWindow.providerDates, '2026-10-12'), true, 'a date span can overlap a week between its endpoints');
  assert.equal(providerDatesOverlapRange(['2026-09-20', '2026-09-30'], '2026-10-01', '2026-10-31'), false);

  const noDate = parseYahooEarningsCalendarPayload({
    symbol: '688825.SS', expectedProviderSymbol: '688825.SS', expectedCompanyName: 'ChangXin Memory Technologies (CXMT)',
    payload: yahooPayload({ symbol: '688825.SS', name: 'CXMT Corporation', dates: [] }),
    checkedAt: '2026-10-11T12:00:00.000Z'
  });
  assert.equal(noDate.coverage, 'NO_DATE', 'a valid quote with an empty calendar stays covered-no-date');
  const identityMismatch = parseYahooEarningsCalendarPayload({
    symbol: 'NVDA', expectedProviderSymbol: 'NVDA', expectedCompanyName: 'NVIDIA Corporation',
    payload: yahooPayload({ symbol: 'NVDA', name: 'Suncor Energy Inc.', dates: [{ fmt: '2026-11-17' }] }),
    checkedAt: '2026-10-11T12:00:00.000Z'
  });
  assert.equal(identityMismatch.coverage, 'IDENTITY_MISMATCH');
  const rawOnlyDate = parseYahooEarningsCalendarPayload({
    symbol: 'NVDA', expectedProviderSymbol: 'NVDA', expectedCompanyName: 'NVIDIA Corporation',
    payload: yahooPayload({ symbol: 'NVDA', name: 'NVIDIA Corporation', dates: [{ raw: 1794945600 }] }),
    checkedAt: '2026-10-11T12:00:00.000Z'
  });
  assert.equal(rawOnlyDate.coverage, 'NO_DATE', 'epoch-only dates are not reinterpreted across provider time zones');

  assert.equal(getUpcomingWeekStart(new Date(2026, 9, 10)), '2026-10-12', 'Saturday defaults to the upcoming business week');
  assert.equal(getUpcomingWeekStart(new Date(2026, 9, 11)), '2026-10-12', 'Sunday defaults to the upcoming business week');
  assert.deepEqual(getWeekdayDateKeys('2026-10-12'), ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16']);
  assert.equal(addDaysToDateKey('2026-12-31', 1), '2027-01-01');
  assert.equal(getWeekStartForDateKey('2026-12-31'), '2026-12-28');
  assert.equal(getMonthStartForDateKey('2026-10-11'), '2026-10-01');
  assert.equal(addMonthsToDateKey('2026-12-01', 1), '2027-01-01');
  const februaryGrid = getMonthGridDateKeys('2024-02-01');
  assert.equal(februaryGrid.length, 42, 'month pages keep a stable six-row grid');
  assert.equal(februaryGrid[0], '2024-01-29', 'month grid starts on Monday');
  assert.ok(februaryGrid.includes('2024-02-29'), 'leap-day is present');
  assert.equal(februaryGrid[februaryGrid.length - 1], '2024-03-10');

  await testProviderCacheAndSingleflight();
  await testProviderConcurrency();
  await testProviderBodyTimeout();
  await testConcurrentExpiredSessionRetry();
  console.log(`Earnings calendar rules/provider checks passed for ${NOTIFICATION_APP_STOCKS.length} unique app equities.`);

  if (process.argv.includes('--live')) {
    const liveProvider = new YahooEarningsCalendarProvider({ mapSymbol: symbol => symbol });
    const nvidia = NOTIFICATION_APP_STOCKS.find(stock => stock.ticker === 'NVDA');
    assert.ok(nvidia, 'the app inventory should contain NVDA for the live adapter probe');
    const result = await liveProvider.get({ symbol: nvidia.ticker, name: nvidia.name }, true);
    assert.ok(['SCHEDULED', 'NO_DATE'].includes(result.coverage), `live Yahoo probe must return a verified NVDA identity, got ${result.coverage}`);
    console.log(`Live Yahoo adapter probe NVDA: ${result.coverage}; provider=${result.providerSymbol}; dates=${result.providerDates.join(',') || 'none'}; time=${result.reportTime}.`);
  }
}

void run();
