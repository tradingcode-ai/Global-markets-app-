import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchVerifiedResearchQuote, getResearchSessionSnapshot } from './researchSessionQuotes';
import { closePreviousSessionEvents, getResearchEvents, saveResearchEvent } from './marketResearchStore';
import type { ResearchEvent } from '../types/marketResearch';

const seconds = (iso: string) => Date.parse(iso) / 1000;
const regular = {
  start: seconds('2026-10-02T13:30:00Z'),
  end: seconds('2026-10-02T20:00:00Z')
};

function yahooChart(period = regular, regularMarketTime = seconds('2026-10-02T16:59:00Z')) {
  return {
    chart: { result: [{
      meta: {
        exchangeTimezoneName: 'America/New_York',
        regularMarketPrice: 110,
        regularMarketPreviousClose: 100,
        regularMarketTime,
        currentTradingPeriod: { regular: period }
      },
      timestamp: [seconds('2026-10-01T13:30:00Z'), seconds('2026-10-02T13:30:00Z')],
      indicators: { quote: [{ close: [100, 110] }] }
    }] }
  };
}

async function withYahooChart<T>(chart: unknown, run: () => Promise<T>): Promise<T> {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(chart), { status: 200 });
  try { return await run(); } finally { globalThis.fetch = original; }
}

function event(id: string): ResearchEvent {
  return {
    id, ticker: id, marketSymbol: id, assetName: id, assetClass: 'Equities',
    changePercent: 8, currentPrice: 108, previousClose: 100,
    period: 'SESSION', triggeredAt: '2026-10-02T17:00:00Z',
    status: 'ACTIVE', fingerprint: `${id}_UP_2026-10-02`
  };
}

test('verified research quote requires a fresh regular-session trade', async () => {
  await withYahooChart(yahooChart(), async () => {
    const quote = await fetchVerifiedResearchQuote('TESTQUOTE', Date.parse('2026-10-02T17:00:00Z'));
    assert.equal(quote?.price, 110);
    assert.equal(quote?.changePercent, 10);
    assert.equal(quote?.sessionDate, '2026-10-02');
    assert.equal(quote?.isVerifiedRegularSession, true);
    assert.equal(await fetchVerifiedResearchQuote('TESTQUOTE', Date.parse('2026-10-02T21:00:00Z')), null);
  });
  await withYahooChart(yahooChart(regular, seconds('2026-10-02T15:00:00Z')), async () => {
    assert.equal(await fetchVerifiedResearchQuote('TESTSTALE', Date.parse('2026-10-02T17:00:00Z')), null);
  });
});

test('daily close is separate from the trigger and unavailable during the live session', async () => {
  await withYahooChart(yahooChart(), async () => {
    const live = await getResearchSessionSnapshot(event('TESTLIVE'), Date.parse('2026-10-02T17:00:00Z'));
    assert.deepEqual(live, { state: 'LIVE' });
    const pending = await getResearchSessionSnapshot(event('TESTPENDING'), Date.parse('2026-10-02T20:05:00Z'));
    assert.deepEqual(pending, { state: 'CLOSED' });
    const closed = await getResearchSessionSnapshot(event('TESTCLOSE'), Date.parse('2026-10-02T20:20:00Z'));
    assert.equal(closed.state, 'CLOSED');
    assert.equal(closed.closePrice, 110);
    assert.equal(closed.closeChangePercent, 10);
  });
});

test('a weekend event has no invented closing price', async () => {
  const monday = {
    start: seconds('2026-10-05T13:30:00Z'),
    end: seconds('2026-10-05T20:00:00Z')
  };
  await withYahooChart(yahooChart(monday), async () => {
    const weekend = { ...event('TESTWEEKEND'), triggeredAt: '2026-10-03T13:00:00Z' };
    const result = await getResearchSessionSnapshot(weekend, Date.parse('2026-10-03T15:00:00Z'));
    assert.deepEqual(result, { state: 'CLOSED' });
  });
});

test('reconciliation persists the verified close without overwriting trigger price', async () => {
  await withYahooChart(yahooChart(), async () => {
    const researchEvent = { ...event('TESTSTORE'), triggerPrice: 108, triggerChangePercent: 8 };
    await saveResearchEvent(researchEvent, null);
    await closePreviousSessionEvents(null);
    const [stored] = await getResearchEvents({ ticker: 'TESTSTORE' }, null);
    assert.equal(stored.status, 'COOLED_DOWN');
    assert.equal(stored.triggerPrice, 108);
    assert.equal(stored.sessionClosePrice, 110);
    assert.equal(stored.sessionCloseChangePercent, 10);
    assert.equal(stored.sessionState, 'CLOSED');
  });
});
