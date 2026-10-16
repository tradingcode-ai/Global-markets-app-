import assert from 'node:assert/strict';
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import type { ResearchEvent, ResearchReport } from '../types/marketResearch';
import { parseVerifiedResearchQuote, getResearchSessionSnapshot } from '../services/researchSessionQuotes';
import { groupResearchReports } from '../services/researchReportGrouping';
import { normalizeResearchConfig } from '../services/marketResearchConfig';
import { ensureResearchTables, saveResearchReport, getResearchReports, cleanupExpiredResearchReports } from '../services/marketResearchStore';
import { ensureResearchSessionSchema, reserveResearchSession, acquireResearchLease, failResearchLease,
  renewResearchLease, getRunnableResearchEvents, getResearchDatabaseId } from '../services/marketResearchSessionStore';

// Test-only fixtures. No agent is called and no real market event is emitted.
const now = Date.now();
const start = new Date(now - 3600_000).toISOString();
const end = new Date(now + 3600_000).toISOString();
const date = start.slice(0, 10);
function event(ticker = 'NVDA', move = 10, sessionStart = start): ResearchEvent {
  return { id: `test_${randomUUID()}`, ticker, assetName: 'Isolated regression fixture', assetClass: 'Test',
    currentPrice: 100 + move, previousClose: 100, changePercent: move, triggerPrice: 100 + move,
    triggerChangePercent: move, triggeredAt: sessionStart === start ? new Date(now).toISOString() : sessionStart,
    marketSymbol: ticker === 'GOLD' ? 'GC=F' : ticker,
    sessionStart, sessionEnd: sessionStart === start ? end : new Date(Date.parse(sessionStart) + 7200_000).toISOString(),
    sessionDate: sessionStart === start ? date : sessionStart.slice(0, 10), status: 'NEW',
    lastCheckedAt: new Date(now).toISOString(), period: 'SESSION' };
}
function report(id: string, eventId: string, ticker = 'NVDA'): ResearchReport {
  return { id, eventId, ticker, assetName: 'Regression fixture', assetClass: 'Test', changePercent: 10,
    period: 'SESSION', triggerTimestamp: new Date(now).toISOString(), createdAt: new Date(now).toISOString(),
    status: 'COMPLETED', confidence: 'LOW', executiveSummary: 'Isolated test report', immediateCatalyst: 'Test',
    directMarketImpact: 'Test', broaderContext: 'Test', whatMarketIsReactingTo: 'Test', whatToWatchNext: 'Test', sources: [] };
}

async function pureChecks(): Promise<void> {
  const chart = { meta: { symbol: 'NVDA', exchangeTimezoneName: 'America/New_York', regularMarketPrice: 110,
    regularMarketTime: Math.floor(now / 1000), regularMarketChangePercent: 10, regularMarketChange: 10,
    currentTradingPeriod: { regular: { start: Math.floor(Date.parse(start) / 1000), end: Math.floor(Date.parse(end) / 1000) } } } };
  const parsed = parseVerifiedResearchQuote('NVDA', chart, now);
  assert.equal(parsed?.previousClose, 100);
  assert.ok(Math.abs(parsed!.changePercent - 10) < 0.0001);
  assert.equal(parseVerifiedResearchQuote('AMD', chart, now), null, 'wrong identity');
  assert.equal(parseVerifiedResearchQuote('NVDA', { meta: { ...chart.meta, regularMarketTime: now / 1000 - 121 } }, now), null, 'stale quote');
  assert.equal(parseVerifiedResearchQuote('NVDA', chart, Date.parse(end)), null, 'closed market');
  assert.equal(parseVerifiedResearchQuote('NVDA', { meta: { ...chart.meta, regularMarketChange: 1 } }, now), null, 'conflicting reference');
  assert.equal(parseVerifiedResearchQuote('NVDA', { meta: { ...chart.meta, regularMarketChange: undefined,
    regularMarketChangePercent: undefined, previousClose: 90 } }, now), null, 'ambiguous range close is never used');
  const overnight = event();
  overnight.sessionStart = '2026-10-15T22:00:00Z'; overnight.sessionEnd = '2026-10-16T21:00:00Z';
  assert.equal((await getResearchSessionSnapshot(overnight, Date.parse('2026-10-16T01:00:00Z'))).state, 'LIVE', 'overnight session is not closed at midnight');
  const first = { ...report('one', 'e1'), period: '1D', createdAt: '2026-10-12T14:00:00Z' };
  const second = { ...report('two', 'e2'), period: '1D', createdAt: '2026-10-12T15:00:00Z' };
  const legacy = ['e1', 'e2'].map(id => ({ id, ticker: 'NVDA', status: 'CLOSED', fingerprint: 'NVDA_UP_2026-10-12' } as ResearchEvent));
  const grouped = groupResearchReports([first, second], legacy);
  assert.equal(grouped.length, 1); assert.equal(grouped[0].id, 'one');
  assert.equal(grouped[0].alternativeReports?.[0].id, 'two');
  assert.equal(groupResearchReports(grouped).length, 1, 'grouping is idempotent');
  assert.equal(groupResearchReports([first, second]).length, 2, 'unverified historical dates are not guessed');
  assert.ok(!('dedupWindowHours' in normalizeResearchConfig({ dedupWindowHours: 24 } as any)));
  await assert.rejects(() => ensureResearchSessionSchema(null));
  console.log('PASS: quote identity/freshness/reference/session checks, overnight boundary, history grouping and obsolete setting removal.');
}

async function databaseChecks(): Promise<void> {
  const url = process.env.RESEARCH_TEST_DATABASE_URL;
  if (!url) throw new Error('Set RESEARCH_TEST_DATABASE_URL explicitly. Tests use an isolated temporary schema only.');
  const schema = `research_dedup_test_${randomUUID().replaceAll('-', '')}`;
  const settings = { connectionString: url, ssl: url.includes('localhost') ? false as const : { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000, statement_timeout: 15000, max: 4 };
  const admin = new pg.Pool(settings);
  const pool = new pg.Pool({ ...settings, options: `-c search_path=${schema}` });
  const otherWorker = new pg.Pool({ ...settings, options: `-c search_path=${schema}` });
  let created = false;
  try {
    assert.match(schema, /^research_dedup_test_[a-f0-9]{32}$/);
    await admin.query(`CREATE SCHEMA "${schema}"`); created = true;
    await ensureResearchTables(pool); await ensureResearchSessionSchema(pool); await ensureResearchSessionSchema(otherWorker);
    const databaseId = await getResearchDatabaseId(pool);
    assert.match(databaseId!, /^[a-f0-9-]{36}$/);
    assert.equal(await getResearchDatabaseId(otherWorker), databaseId, 'independent connections report the same database identity');
    const results = await Promise.all(Array.from({ length: 24 }, (_, i) => reserveResearchSession(i % 2 ? pool : otherWorker, event(), true)));
    assert.equal(results.filter(value => value?.created).length, 1, 'two workers reserve only one UP event');
    const id = results[0]!.event.id;
    assert.equal(new Set(results.map(value => value!.event.id)).size, 1);
    assert.equal((await reserveResearchSession(pool, event('NVDA', 15), true))?.created, false, 'higher move reuses slot');
    assert.equal((await reserveResearchSession(pool, event('NVDA', 4), false))?.event.id, id, 'below threshold reuses slot');
    assert.ok((await reserveResearchSession(pool, event('NVDA', -10), true))?.created, 'opposite direction gets its own slot');
    assert.ok((await reserveResearchSession(pool, event('NVDA', 10, new Date(now + 86400_000).toISOString()), true))?.created, 'new session gets a slot');
    const gold = await reserveResearchSession(pool, event('GOLD'), true);
    assert.equal((await reserveResearchSession(otherWorker, event('GC=F'), true))?.event.id, gold?.event.id, 'aliases share a slot');

    const leases = await Promise.all([acquireResearchLease(pool, id), acquireResearchLease(otherWorker, id)]);
    assert.equal(leases.filter(Boolean).length, 1, 'only one worker executes');
    const old = leases.find(Boolean)!;
    assert.equal(await acquireResearchLease(otherWorker, gold!.event.id), null, 'global slot prevents parallel research on another asset');
    assert.ok(await renewResearchLease(pool, old));
    await pool.query("UPDATE market_research_session_claims SET lease_until=NOW()-INTERVAL '1 second' WHERE event_id=$1", [id]);
    await pool.query("UPDATE market_research_agent_slot SET lease_until=NOW()-INTERVAL '1 second'");
    const takeover = (await acquireResearchLease(otherWorker, id))!;
    assert.ok(takeover); assert.notEqual(takeover.owner, old.owner); assert.equal(takeover.reportId, old.reportId);
    assert.equal(await renewResearchLease(pool, old), false);
    await assert.rejects(() => saveResearchReport(report(old.reportId, id), pool, old), /ownership expired/);
    await saveResearchReport(report(takeover.reportId, id), pool, takeover);
    assert.equal(await acquireResearchLease(otherWorker, gold!.event.id), null, 'two-second pacing applies across workers');
    await pool.query("UPDATE market_research_agent_slot SET next_allowed_at=NOW()-INTERVAL '1 second'");
    assert.equal(await acquireResearchLease(pool, id), null, 'completed reports never execute again');
    assert.equal((await pool.query('SELECT COUNT(*)::int AS count FROM market_research_reports WHERE event_id=$1', [id])).rows[0].count, 1);
    assert.equal((await reserveResearchSession(pool, event(), true))?.event.reportId, takeover.reportId);

    for (const suffix of ['1', '2']) {
      await pool.query(`INSERT INTO market_research_events
        (id,ticker,asset_name,asset_class,change_percent,current_price,previous_close,period,triggered_at,status,fingerprint)
        VALUES ($1,'LEGACY_FIXTURE','Test','Test',10,110,100,'1D',$2,'ACTIVE',$3)`,
      [`legacy_${suffix}`, new Date(now - Number(suffix) * 60_000).toISOString(), `LEGACY_FIXTURE_UP_${date}`]);
      await pool.query(`INSERT INTO market_research_reports
        SELECT $1,$2,asset_name,'LEGACY_FIXTURE',asset_class,change_percent,'1D',trigger_timestamp,
          executive_summary,immediate_catalyst,direct_market_impact,broader_context,what_market_is_reacting_to,
          what_to_watch_next,confidence,confidence_explanation,sources,visual_payload,raw_markdown,status,$3
        FROM market_research_reports WHERE id=$4`,
      [`legacy_report_${suffix}`, `legacy_${suffix}`, new Date(now - (3 - Number(suffix)) * 60_000).toISOString(), takeover.reportId]);
    }
    const adopted = await reserveResearchSession(pool, event('LEGACY_FIXTURE'), true);
    assert.equal(adopted?.created, false, 'existing legacy session event is adopted');
    const legacyReports = await getResearchReports({ ticker: 'LEGACY_FIXTURE' }, pool);
    assert.equal(legacyReports.length, 1); assert.equal(legacyReports[0].id, 'legacy_report_1');
    assert.equal(legacyReports[0].alternativeReports?.[0].id, 'legacy_report_2');
    assert.equal((await pool.query("SELECT COUNT(*)::int AS count FROM market_research_reports WHERE ticker='LEGACY_FIXTURE'")).rows[0].count, 2, 'old copies remain stored');
    await pool.query(`INSERT INTO market_research_events
      (id,ticker,asset_name,asset_class,change_percent,current_price,previous_close,period,triggered_at,status,fingerprint)
      VALUES ('unverified_legacy','LEGACY_PENDING','Test','Test',10,110,100,'1D',$1,'COOLED_DOWN',$2)`,
    [new Date(now - 60_000).toISOString(), `LEGACY_PENDING_UP_${date}`]);
    assert.equal(await reserveResearchSession(pool, event('LEGACY_PENDING', 1), false), null,
      'an unverified legacy event without a report cannot start research below threshold');
    const recoveredLegacy = await reserveResearchSession(pool, event('LEGACY_PENDING'), true);
    assert.equal(recoveredLegacy?.event.id, 'unverified_legacy');
    assert.equal(recoveredLegacy?.event.triggerPrice, 110);
    assert.equal(recoveredLegacy?.event.triggerChangePercent, 10);
    assert.equal(recoveredLegacy?.event.period, 'SESSION');

    const failure = (await reserveResearchSession(pool, event('RETRY_FIXTURE'), true))!.event;
    for (let attempt = 0; attempt < 3; attempt++) {
      const lease = (await acquireResearchLease(pool, failure.id))!; assert.ok(lease);
      await failResearchLease(pool, lease, 'Isolated test failure');
      assert.equal(await acquireResearchLease(pool, failure.id), null, 'backoff or final limit blocks immediate execution');
      await pool.query("UPDATE market_research_session_claims SET next_attempt_at=NOW()-INTERVAL '1 second' WHERE event_id=$1", [failure.id]);
      await pool.query("UPDATE market_research_agent_slot SET next_allowed_at=NOW()-INTERVAL '1 second'");
    }
    assert.equal(await acquireResearchLease(pool, failure.id), null, 'three attempts maximum');
    assert.equal((await reserveResearchSession(pool, event('RETRY_FIXTURE'), true))?.created, false, 'failure never releases session reservation');
    const running = await getRunnableResearchEvents(pool, new Set([`NVDA|${start}`]));
    assert.ok(running.every(item => item.marketSymbol === 'NVDA'));
    const fetched = await getResearchReports({}, pool);
    assert.ok(fetched.some(item => item.id === takeover.reportId));
    await cleanupExpiredResearchReports(pool, now + 8 * 86400_000);
    assert.equal((await pool.query('SELECT COUNT(*)::int AS count FROM market_research_reports')).rows[0].count, 0, 'seven-day retention still removes report bytes/text');
    assert.equal((await reserveResearchSession(pool, event(), true))?.created, false, 'report removal does not release session slot');
    console.log('PASS: real PostgreSQL concurrent reservations, directions/sessions/aliases, leases, stale-worker fence, retry limit, reads and retention.');
  } finally {
    await pool.end(); await otherWorker.end();
    if (created) await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
    await admin.end();
  }
}

await pureChecks();
if (process.argv.includes('--database')) await databaseChecks();
