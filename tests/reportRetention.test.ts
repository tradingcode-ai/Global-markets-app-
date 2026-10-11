import assert from 'node:assert/strict';
import test from 'node:test';
import { cleanupExpiredResearchReports, saveResearchReport, getResearchReport, getResearchReports, saveResearchEvent, getResearchEvents, startResearchReportRetention } from '../src/services/marketResearchStore';
import { isResearchReportRetained, RESEARCH_REPORT_RETENTION_MS, retainResearchDashboard } from '../src/utils/researchReportPolicy';
import type { ResearchReport, ResearchEvent } from '../src/types/marketResearch';
const now = Date.parse('2026-10-09T12:00:00Z');
const report = (id: string, created: number): ResearchReport => ({ id, ticker: 'QA', confidence: 'LOW', sources: [], status: 'COMPLETED', executiveSummary: 'QA fixture only', createdAt: new Date(created).toISOString() });

test('retention expires at exactly seven days, independently of calendar dates and aliases', () => {
  assert.equal(isResearchReportRetained(report('edge', now - RESEARCH_REPORT_RETENTION_MS), now), false);
  assert.equal(isResearchReportRetained(report('recent', now - RESEARCH_REPORT_RETENTION_MS + 1), now), true);
  assert.equal(isResearchReportRetained({ ...report('snake', now), createdAt: undefined, created_at: new Date(now).toISOString() }, now), true);
  assert.equal(isResearchReportRetained({ ...report('bad', now), createdAt: 'invalid' }, now), false);
});

test('expired reports and copied catalyst links disappear from dashboard snapshots', () => {
  const old = report('old', now - RESEARCH_REPORT_RETENTION_MS);
  const recent = report('recent', now);
  const event = { id: 'event', ticker: 'QA', status: 'ACTIVE', reportId: old.id, catalystSummary: 'Old report copy' } as ResearchEvent;
  const snapshot = { recentReports: [old, recent], recentEvents: [event], activeEvents: [event], stats: { totalReports: 2 } } as any;
  const retained = retainResearchDashboard(snapshot, now);
  assert.deepEqual(retained.recentReports?.map(r => r.id), ['recent']);
  assert.equal(retained.recentEvents?.[0].reportId, undefined);
  assert.equal(retained.activeEvents?.[0].catalystSummary, undefined);
  assert.equal(retained.stats?.totalReports, 1);
  assert.equal(snapshot.recentReports.length, 2);
});

test('RAM retention deletes old text/visuals and clears event copies, keeping recent reports', async () => {
  const clock = Date.now(); const expired = report('retention-old', clock - RESEARCH_REPORT_RETENTION_MS - 1000); const recent = report('retention-new', clock);
  await saveResearchReport(expired, null); await saveResearchReport(recent, null);
  await saveResearchEvent({ id: 'retention-event', ticker: 'QA', status: 'COOLED_DOWN', reportId: expired.id, catalystSummary: 'Expired report excerpt', triggeredAt: new Date(clock).toISOString() } as ResearchEvent, null);
  assert.equal(await getResearchReport(expired.id, null), null);
  await cleanupExpiredResearchReports(null, clock);
  assert.equal(await getResearchReport(expired.id, null), null);
  assert.equal((await getResearchReport(recent.id, null))?.id, recent.id);
  assert.ok(!(await getResearchReports(undefined, null)).some(r => r.id === expired.id));
  const event = (await getResearchEvents(undefined, null)).find(e => e.id === 'retention-event');
  assert.equal(event?.reportId, undefined); assert.equal(event?.catalystSummary, undefined);
});

test('SQL retention issues a physical DELETE and atomic event-copy cleanup with a parameterized cutoff', async () => {
  let sqlSeen = ''; let cutoff = '';
  const fakePool: any = { connect: async () => ({ query: async () => ({ rows: [] }), release() {} }), query: async (sql: string, params: any[]) => { sqlSeen = sql; cutoff = params[0]; return { rows: [{ id: 'db-old' }] }; } };
  assert.equal(await cleanupExpiredResearchReports(fakePool, now), 1);
  assert.match(sqlSeen, /DELETE FROM market_research_reports WHERE created_at <= \$1 RETURNING id/);
  assert.match(sqlSeen, /report_id = NULL, catalyst_summary = NULL/);
  assert.equal(cutoff, new Date(now - RESEARCH_REPORT_RETENTION_MS).toISOString());
});

test('database misses do not resurrect a still-cached RAM report', async () => {
  const recent = report('retention-db-miss', Date.now()); await saveResearchReport(recent, null);
  const queries: Array<{ sql: string; params: any[] }> = [];
  const fakePool: any = { query: async (sql: string, params: any[]) => { queries.push({ sql, params }); return { rows: [] }; } };
  assert.equal(await getResearchReport(recent.id, fakePool), null);
  assert.deepEqual(await getResearchReports({ ticker: 'QA', limit: 5 }, fakePool), []);
  assert.match(queries[0].sql, /created_at > \$2/);
  assert.match(queries[1].sql, /created_at > \$1.*ticker = \$2.*LIMIT \$3/);
  assert.equal(queries[1].params[1], 'QA'); assert.equal(queries[1].params[2], 5);
});

test('retention scheduler cleans on start and each minute without a market monitor', async context => {
  context.mock.timers.enable({ apis: ['setInterval'] });
  let queries = 0; const fakePool: any = { query: async () => { queries++; return { rows: [] }; } };
  const stop = startResearchReportRetention(fakePool);
  await new Promise(resolve => setImmediate(resolve)); assert.equal(queries, 1);
  context.mock.timers.tick(60_000); await new Promise(resolve => setImmediate(resolve)); assert.equal(queries, 2);
  stop(); context.mock.timers.tick(60_000); await new Promise(resolve => setImmediate(resolve)); assert.equal(queries, 2);
});
