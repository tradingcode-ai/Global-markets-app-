import assert from 'node:assert/strict';
import test from 'node:test';
import { persistDashboardSnapshot, getStoredDashboardSnapshot, fetchResearchReportById } from '../src/services/marketResearchService';
import type { ResearchDashboardData, ResearchReport, StoredReportVisual } from '../src/types/marketResearch';
import { RESEARCH_REPORT_RETENTION_MS } from '../src/utils/researchReportPolicy';
const key = 'global_markets_research_dashboard_snapshot_v2';
const stored: StoredReportVisual = {
  dataUrl: 'data:image/png;base64,' + 'A'.repeat(800), // Size fixture only, never displayed.
  sha256: 'fixture', mediaType: 'image/png', byteLength: 600,
  width: 400, height: 300, captureMethod: 'download', capturedAt: new Date().toISOString(),
};
function report(id: string): ResearchReport {
  const visualPayload = {
    version: 2 as const, enrichedAt: new Date().toISOString(),
    assetRegistry: [{ id: 'figure-' + id, type: 'research_exhibit' as const,
      purpose: 'primary_evidence_exhibit', stored,
      source: { url: 'https://example.invalid/test-source', publisher: 'QA fixture' },
      asset: {}, provenance: { retrievedAt: new Date().toISOString(), status: 'ATTRIBUTED_SOURCE' as const },
      selection: { reason: 'Cache fixture only' } }],
  };
  return { id, ticker: 'QA', confidence: 'LOW', sources: [], status: 'ACTIVE', createdAt: new Date().toISOString(),
    executiveSummary: 'Explicit nonfinancial cache-test fixture', visualPayload, visual_payload: visualPayload };
}
function dashboard(reports: ResearchReport[]) { return { recentReports: reports } as ResearchDashboardData; }
async function withStorage(limit: number, fn: (values: Map<string, string>) => void | Promise<void>) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    setItem(k: string, value: string) {
      if (value.length > limit) throw Object.assign(new Error('Test quota'), { name: 'QuotaExceededError' });
      values.set(k, value);
    }, getItem(k: string) { return values.get(k) ?? null; }, removeItem(k: string) { values.delete(k); },
  } });
  try { await fn(values); } finally {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
}

test('cache keeps only three newest complete reports and stores bytes once without mutation', async () => {
  const clock = Date.now(); const reports = Array.from({ length: 5 }, (_, i) => ({ ...report('r' + i), createdAt: new Date(clock - i * 1000).toISOString() }));
  const legacy = { ...reports[0], visualPayload: undefined }; reports[0] = legacy;
  await withStorage(Infinity, values => {
    persistDashboardSnapshot(dashboard([reports[4], reports[1], reports[3], reports[0], reports[2]]));
    const cached = JSON.parse(values.get(key)!); assert.deepEqual(cached.recentReports.map((r: ResearchReport) => r.id), ['r0', 'r1', 'r2']);
    for (const item of cached.recentReports) {
      assert.equal(item.visual_payload, undefined); assert.equal(item.visualPayload.assetRegistry[0].stored.dataUrl, stored.dataUrl);
      assert.equal(item.executiveSummary, reports[0].executiveSummary);
    }
    assert.ok(reports[4].visualPayload!.assetRegistry![0].stored);
    assert.ok(legacy.visual_payload!.assetRegistry![0].stored);
  });
});

test('quota pressure evicts whole oldest browser copies and never strips images from originals', async () => {
  const clock = Date.now(); const reports = [0, 1, 2].map(i => ({ ...report('quota' + i), createdAt: new Date(clock - i * 1000).toISOString() }));
  let completeLength = 0; await withStorage(Infinity, values => { persistDashboardSnapshot(dashboard(reports)); completeLength = values.get(key)!.length; });
  await withStorage(completeLength - 200, values => {
    persistDashboardSnapshot(dashboard(reports)); const cached = JSON.parse(values.get(key)!);
    assert.deepEqual(cached.recentReports.map((r: ResearchReport) => r.id), ['quota0', 'quota1']);
    assert.ok(cached.recentReports.every((r: ResearchReport) => r.visualPayload?.assetRegistry?.[0].stored));
    assert.ok(reports[2].visualPayload!.assetRegistry![0].stored);
  });
});

test('failed cache update preserves the previous copy without affecting complete server reports', async () => {
  await withStorage(20, values => {
    values.set(key, JSON.stringify(dashboard([]))); const previous = values.get(key); const original = report('large');
    const previousWarn = console.warn; console.warn = () => {};
    try { persistDashboardSnapshot(dashboard([original])); } finally { console.warn = previousWarn; }
    assert.equal(values.get(key), previous); assert.ok(original.visualPayload!.assetRegistry![0].stored);
  });
});

test('reading old caches removes expired/excess copies but preserves newest stored pixels', async () => {
  await withStorage(Infinity, values => {
    const clock = Date.now(); const recent = Array.from({ length: 4 }, (_, i) => ({ ...report('recent' + i), createdAt: new Date(clock - i * 1000).toISOString() }));
    const expired = { ...report('expired'), createdAt: new Date(clock - RESEARCH_REPORT_RETENTION_MS).toISOString() };
    values.set(key, JSON.stringify(dashboard([expired, ...recent])));
    const cached = getStoredDashboardSnapshot(); assert.deepEqual(cached?.recentReports?.map(r => r.id), ['recent0', 'recent1', 'recent2']);
    assert.equal(cached?.recentReports?.[0].visualPayload?.assetRegistry?.[0].stored?.dataUrl, stored.dataUrl);
    assert.equal(JSON.parse(values.get(key)!).recentReports.length, 3);
    assert.ok(!values.get(key)!.includes('expired'));
  });
});

test('empty cache after expiry stays empty rather than resurrecting sample reports', async () => {
  await withStorage(Infinity, values => {
    values.set(key, JSON.stringify(dashboard([{ ...report('expired'), createdAt: new Date(Date.now() - RESEARCH_REPORT_RETENTION_MS).toISOString() }])));
    assert.deepEqual(getStoredDashboardSnapshot()?.recentReports, []);
  });
});

test('dashboard refresh preserves matching complete pixels and discards superseded enrichment', async () => {
  await withStorage(Infinity, values => {
    const current = report('refresh'); persistDashboardSnapshot(dashboard([current]));
    const metadata = { ...current, visualPayload: { ...current.visualPayload!, assetRegistry: current.visualPayload!.assetRegistry!.map(({stored: _stored, ...asset}) => asset) }, visual_payload: undefined };
    persistDashboardSnapshot(dashboard([metadata]));
    assert.equal(getStoredDashboardSnapshot()?.recentReports?.[0].visualPayload?.assetRegistry?.[0].stored?.dataUrl, stored.dataUrl);
    persistDashboardSnapshot(dashboard([{ ...metadata, visualPayload: { ...metadata.visualPayload!, enrichedAt: 'new-enrichment' } }]));
    assert.equal(getStoredDashboardSnapshot()?.recentReports?.[0].visualPayload?.assetRegistry?.[0].stored, undefined);
  });
});

test('detail loads complete server bytes once, then reopens directly from the three-report cache', async () => {
  await withStorage(Infinity, async values => {
    const current = report('detail'); const metadata = { ...current, visualPayload: undefined, visual_payload: undefined };
    persistDashboardSnapshot(dashboard([metadata])); const originalFetch = globalThis.fetch; let fetches = 0;
    try {
      globalThis.fetch = async () => { fetches++; return new Response(JSON.stringify({ report: current }), { status: 200, headers: { 'Content-Type': 'application/json' } }); };
      assert.equal((await fetchResearchReportById(current.id))?.visualPayload?.assetRegistry?.[0].stored?.dataUrl, stored.dataUrl);
      globalThis.fetch = async () => { fetches++; throw new Error('Offline test'); };
      assert.equal((await fetchResearchReportById(current.id))?.visualPayload?.assetRegistry?.[0].stored?.dataUrl, stored.dataUrl);
      assert.equal(fetches, 1);
    } finally { globalThis.fetch = originalFetch; }
  });
});

test('a404 cannot resurrect a browser metadata copy', async () => {
  await withStorage(Infinity, async values => {
    const current = { ...report('deleted'), visualPayload: undefined, visual_payload: undefined };
    persistDashboardSnapshot(dashboard([current])); const originalFetch = globalThis.fetch;
    try { globalThis.fetch = async () => new Response('', { status: 404 }); assert.equal(await fetchResearchReportById(current.id), null); }
    finally { globalThis.fetch = originalFetch; }
  });
});
