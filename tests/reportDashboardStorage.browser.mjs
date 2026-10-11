import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
process.env.PLAYWRIGHT_BROWSERS_PATH ||= process.cwd() + '/.cache/ms-playwright';
const { chromium } = await import('playwright');
const root = process.cwd(), qa = path.join(root, '.tmp/visual-qa');
await fs.mkdir(qa, { recursive: true });
await fs.writeFile(path.join(qa, 'storage-stubs.jsx'), "import React from 'react'; export function StockLogo(){return <span>QA</span>} export function StockLogoLoader({onComplete}){React.useEffect(()=>{onComplete?.()},[]);return null}");
await fs.writeFile(path.join(qa, 'storage.html'), '<div id="root"></div><script type="module" src="./storage-harness.jsx"></script>');
await fs.writeFile(path.join(qa, 'storage-harness.jsx'), "import React from 'react'; import {createRoot} from 'react-dom/client'; import {ResearchDashboard} from '../../src/components/ResearchDashboard'; import '../../src/index.css'; createRoot(document.getElementById('root')).render(<ResearchDashboard/>);");
const vite = await createServer({ configFile: path.join(root, 'vite.config.ts'), server: { host: '127.0.0.1', port: 3198, strictPort: true }, resolve: { alias: [
  { find: /^\.\/StockLogoLoader$/, replacement: path.join(qa, 'storage-stubs.jsx') },
  { find: /^\.\/StockLogo$/, replacement: path.join(qa, 'storage-stubs.jsx') },
] } });
await vite.listen();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
const source = await browser.newPage();
await source.setContent('<figure style="width:1000px;height:500px;background:#e6f0fa;font:24px Arial"><h1>QA ONLY original figure fixture</h1><svg width="900" height="300"><path d="M50 20V250H850M50 220L250 100L500 190L800 60" stroke="#0369a1" fill="none" stroke-width="5"/></svg><p>Source: QA fixture creator. No financial data.</p></figure>');
const png = await source.locator('figure').screenshot(); await source.close();
const stored = { dataUrl: 'data:image/png;base64,' + png.toString('base64'), sha256: 'qa-fixture', mediaType: 'image/png', byteLength: png.length, width: 1000, height: 500, capturedAt: new Date().toISOString(), captureMethod: 'element_screenshot' };
const now = Date.now();
const reports = Array.from({ length: 4 }, (_, i) => ({ id: 'qa-storage-' + i, ticker: 'QA' + i, assetName: 'QA storage report ' + i, assetClass: 'QA fixture', confidence: 'LOW', status: 'COMPLETED', sources: [], createdAt: new Date(now - i * 1000).toISOString(), executiveSummary: 'QA only. No investment analysis.', immediateCatalyst: 'QA capture.', directMarketImpact: 'None asserted.', whatToWatchNext: 'QA only.', visualPayload: { version: 2, enrichedAt: new Date(now).toISOString(), assetRegistry: [{ id: 'figure-' + i, type: 'research_exhibit', purpose: 'primary_evidence_exhibit', stored, source: { title: 'QA original fixture ' + i, url: 'https://example.invalid/qa', publisher: 'QA fixture creator' }, asset: {}, attribution: { text: 'QA fixture creator', visible: true }, provenance: { visualSource: 'QA fixture creator', discoverySource: 'QA harness' }, selection: { reason: 'QA only' } }], availability: { photo: 'QA fixture has no editorial photo.', evidence: 'AVAILABLE' }, layoutPlan: { firstPage: { headline: 'QA report ' + i, bottomLine: 'QA only', keyTakeaways: [], primaryEvidenceAssetId: 'figure-' + i }, sections: [] } } }));
const metadata = reports.map(r => ({ ...r, visualPayload: { ...r.visualPayload, assetRegistry: r.visualPayload.assetRegistry.map(({ stored: _stored, ...a }) => a) } }));
const calls = new Map(), external = [], errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.route('**/*', async route => {
  const url = new URL(route.request().url());
  if (url.origin !== 'http://127.0.0.1:3198') { if (url.protocol.startsWith('http')) { external.push(url.href); return route.abort(); } return route.continue(); }
  if (url.pathname === '/api/research/dashboard') return route.fulfill({ json: { recentReports: metadata, activeEvents: [], recentEvents: [], config: { assets: {} }, stats: { totalReports: 4, totalEvents: 0, activeCount: 0, monitoredAssetsCount: 0 } } });
  if (url.pathname.startsWith('/api/research/reports/')) { const id = url.pathname.split('/').pop(); calls.set(id, (calls.get(id) || 0) + 1); return route.fulfill({ json: { report: reports.find(r => r.id === id) } }); }
  return route.continue();
});
const key = 'global_markets_research_dashboard_snapshot_v2';
try {
  await page.goto('http://127.0.0.1:3198/.tmp/visual-qa/storage.html', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.getByText('QA storage report 0', { exact: true }).waitFor({ timeout: 120000 });
  assert.deepEqual(await page.evaluate(k => JSON.parse(localStorage.getItem(k)).recentReports.map(r => r.id), key), reports.slice(0, 3).map(r => r.id));
  const open = async i => { await page.getByText('QA storage report ' + i, { exact: true }).click(); await page.waitForFunction(() => Array.from(document.images).some(img => img.src.startsWith('data:') && img.complete && img.naturalWidth > 0)); };
  const close = async () => { await page.getByRole('button', { name: 'Sluiten', exact: true }).click(); };
  await open(0); await page.screenshot({ path: path.join(qa, 'dashboard-open-full-report.png'), fullPage: true }); await close();
  await open(0); await close(); assert.equal(calls.get(reports[0].id), 1, 'Newest report reopens from complete browser cache');
  await open(3); await close(); await open(3); await close(); assert.equal(calls.get(reports[3].id), 2, 'Fourth report always comes from own server');
  const cached = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
  assert.deepEqual(cached.recentReports.map(r => r.id), reports.slice(0, 3).map(r => r.id));
  assert.ok(cached.recentReports[0].visualPayload.assetRegistry[0].stored.dataUrl.startsWith('data:'));
  assert.deepEqual(errors, []); assert.deepEqual(external, []);
  console.log('PASS: real dashboard loads full stored images, caches only newest3, reopens cached report, fetches fourth from server; zero external image requests/browser exceptions.');
} finally { await browser.close(); await vite.close(); }
