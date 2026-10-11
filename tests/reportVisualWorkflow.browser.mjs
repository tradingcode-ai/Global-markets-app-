process.env.PLAYWRIGHT_BROWSERS_PATH ||= process.cwd() + '/.cache/ms-playwright';
/** Independent browser QA for the real report modal. Fixtures are explicitly
 * synthetic QA artwork, contain no financial values and are not research evidence.
 * Run: node tests/reportVisualWorkflow.browser.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'vite';
const { chromium } = await import('playwright');

const root = process.cwd();
const qaDir = path.join(root, '.tmp/visual-qa');
await fs.mkdir(qaDir, { recursive: true });
await fs.writeFile(path.join(qaDir, 'stubs.jsx'), `import React from 'react';
export function StockLogo(){return <span aria-label="QA logo stub">QA</span>}
export function StockLogoLoader({onComplete}){React.useEffect(()=>{onComplete?.()},[]);return null}`);
await fs.writeFile(path.join(qaDir, 'index.html'), '<div id="root"></div><script type="module" src="./harness.jsx"></script>');
await fs.writeFile(path.join(qaDir, 'harness.jsx'), `import React from 'react';
import {createRoot} from 'react-dom/client';
import {ResearchReportModal} from '../../src/components/ResearchReportModal';
import '../../src/index.css';
function Harness(){
 const [report,setReport]=React.useState(null);
 window.openFixture=(next)=>{localStorage.setItem('visual-qa-report',JSON.stringify(next));setReport(JSON.parse(localStorage.getItem('visual-qa-report')))};
 window.reopenFixture=()=>setReport(JSON.parse(localStorage.getItem('visual-qa-report')));
 return report?<ResearchReportModal report={report} onClose={()=>setReport(null)}/>:<p>QA report closed</p>;
}
createRoot(document.getElementById('root')).render(<Harness/>);`);
const vite = await createServer({ configFile: path.join(root, 'vite.config.ts'), server: {host:'127.0.0.1',port:3197,strictPort:true}, resolve: { alias: [
 {find:/^\.\/StockLogoLoader$/,replacement:path.join(qaDir,'stubs.jsx')},
 {find:/^\.\/StockLogo$/,replacement:path.join(qaDir,'stubs.jsx')},
]}});
await vite.listen();
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:1280,height:1000},deviceScaleFactor:1});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
const external=[];
await page.route('**/*', route=>{const url=route.request().url(); if(url.startsWith('http')&&!url.startsWith('http://127.0.0.1:3197/')){external.push(url);return route.abort();}return route.continue();});
try{
 await page.goto('http://127.0.0.1:3197/.tmp/visual-qa/index.html',{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForFunction(()=>typeof window.openFixture==='function',null,{timeout:120000});
 // A source figure is captured in Chromium, then its exact PNG bytes are used.
 const source=await browser.newPage({viewport:{width:1300,height:900}});
 await source.setContent('<figure style="width:1200px;height:700px;background:#eef3fa;font-family:Arial;padding:20px;box-sizing:border-box"><h1>QA ONLY — Original exhibit capture fixture</h1><p>No financial data. Used only to verify screenshot placement and labels.</p><svg width="1100" height="450"><path d="M80 30V390H1050" fill="none" stroke="#334155" stroke-width="3"/><path d="M90 340L330 200L570 270L810 110L1030 70" fill="none" stroke="#0369a1" stroke-width="7"/><text x="450" y="440" font-size="25">Fixture axis — no market observations</text></svg><p>Source: QA fixture publisher · Figure A · Test document</p></figure>');
 const graph=await source.locator('figure').screenshot({path:path.join(qaDir,'source-exhibit.png')});
 await source.setContent('<div style="width:1200px;height:675px;background:linear-gradient(135deg,#12334c,#557c92);color:white;font:40px Arial;display:grid;place-items:center">QA editorial image fixture — not a company photograph</div>');
 const photo=await source.locator('div').screenshot({path:path.join(qaDir,'source-editorial-fixture.png')});
 await source.close();
 const graphUrl='data:image/png;base64,'+graph.toString('base64');
 const photoUrl='data:image/png;base64,'+photo.toString('base64');
 // Stored bytes mirror the production contract and survive JSON persistence.
 const fixture={id:'qa-report',ticker:'QA',assetName:'QA fixture — no investment analysis',assetClass:'Test fixture',status:'COMPLETED',confidence:'LOW',executiveSummary:'Synthetic QA content verifies rendering only.',immediateCatalyst:{facts:['Fixture source was captured for a rendering test.'],claims:[],inference:[]},directMarketImpact:'No market impact is asserted.',broaderContext:'QA-only report.',whatToWatchNext:'No forecast.',sources:[]};
 const stored=(bytes,url,method)=>({dataUrl:url,sha256:createHash('sha256').update(bytes).digest('hex'),mediaType:'image/png',byteLength:bytes.length,width:1200,height:method==='download'?675:700,captureMethod:method,capturedAt:'2026-10-09T10:00:00.000Z'});
 const makeAsset=(id,type,url,bytes,method)=>({id,type,purpose:type==='image'?'editorial_lead_image':'primary_evidence_exhibit',claimIds:['qa-claim'],stored:stored(bytes,url,method),source:{publisher:'QA fixture publisher',url:'https://example.com/qa-source',title:'QA ONLY original fixture',publishedAt:'2026-10-09'},attribution:{text:'QA fixture publisher — not research evidence',visible:true},asset:{url,width:1200,height:700},provenance:{discoverySource:'QA harness',visualSource:'QA fixture publisher',retrievedAt:'2026-10-09T10:00:00.000Z',status:'EXPLICIT_SOURCE'},extractionStatus:'VISUAL_ONLY',selection:{score:1,reason:'QA rendering fixture only'}});
 const exhibit=makeAsset('qa-exhibit','research_exhibit',graphUrl,graph,'element_screenshot');
 const hero=makeAsset('qa-photo','image',photoUrl,photo,'download');
 fixture.visualPayload={version:2,hero:{imageUrl:photoUrl,photographerCredit:'QA fixture publisher',locationLabel:'QA editorial artwork',sourceUrl:'https://example.com/qa-source'},assetRegistry:[hero,exhibit],researchVisuals:[],enrichedAt:'2026-10-09T10:00:00.000Z',availability:{photo:'AVAILABLE',evidence:'AVAILABLE'},layoutPlan:{reportType:'SELL_SIDE_EVENT_NOTE',firstPage:{headline:'QA ONLY — Stored original exhibit',bottomLine:fixture.executiveSummary,keyDebate:'Rendering only',keyTakeaways:['No market data in this fixture.'],leadImageAssetId:hero.id,primaryEvidenceAssetId:exhibit.id},sections:[{id:'qa-section',purpose:'what_drove_the_move',headline:'QA exhibit section',keyMessage:'Fixture capture',pattern:'TEXT_CHART_SPLIT',blocks:[{type:'research_exhibit',assetId:exhibit.id,claimId:'qa-claim',placement:'full_width'}]}]}};
 const open=async(report)=>{await page.evaluate(r=>window.openFixture(r),report);await page.waitForTimeout(400);};
 const decoded=async()=>page.locator('img').evaluateAll(imgs=>imgs.filter(img=>img.src.startsWith('data:')&&img.complete&&img.naturalWidth>0).length);
 await open(fixture);
 await page.waitForFunction(()=>Array.from(document.images).filter(i=>i.src.startsWith('data:')&&i.complete&&i.naturalWidth>0).length===2);
 assert.equal(await decoded(),2,'Stored editorial image and original exhibit must decode');
 assert.ok(await page.getByText('QA fixture publisher',{exact:false}).count(),'Visible source/credit is retained');
 await page.screenshot({path:path.join(qaDir,'modal-stored-assets.png'),fullPage:true});
 const renderedExhibit=page.locator('img').nth(1);
 await renderedExhibit.scrollIntoViewIfNeeded();
 await page.screenshot({path:path.join(qaDir,'modal-original-exhibit.png'),fullPage:true});
 await page.getByRole('button',{name:'Sluiten',exact:true}).click();
 await page.getByText('QA report closed',{exact:true}).waitFor();
 await page.evaluate(()=>window.reopenFixture());
 await page.waitForTimeout(200);
 assert.equal(await decoded(),2,'Persisted report reopens without source network');
 const pdf=structuredClone(fixture); pdf.id='qa-pdf';pdf.visualPayload.assetRegistry[1].stored.captureMethod='pdf_crop';pdf.visualPayload.assetRegistry[1].stored.pdfPage=3;pdf.visualPayload.assetRegistry[1].stored.crop={x:30,y:80,width:1000,height:600};
 await open(pdf); assert.equal(await decoded(),2,'PDF-crop bytes render identically');
 assert.ok((await page.locator('body').innerText()).includes('PDF page 3'),'PDF page provenance is visible');
 await page.screenshot({path:path.join(qaDir,'modal-pdf-crop.png'),fullPage:true});
 const missing=structuredClone(fixture);missing.id='qa-missing';delete missing.visualPayload.assetRegistry[1].stored;missing.visualPayload.assetRegistry[1].asset={url:'https://example.com/article-is-not-an-image'};
 await open(missing);assert.equal(await decoded(),1,'Missing original exhibit must not render its article URL');assert.ok((await page.locator('body').innerText()).includes('Original figure unavailable'),'Missing exhibit has explicit unavailable status');
 await page.screenshot({path:path.join(qaDir,'modal-missing-exhibit.png'),fullPage:true});
 const corrupt=structuredClone(fixture);corrupt.id='qa-corrupt';corrupt.visualPayload.assetRegistry[1].stored.dataUrl='data:image/png;base64,Y29ycnVwdA==';
 await open(corrupt);assert.equal(await decoded(),1,'Corrupt exhibit cannot masquerade as a decoded image');assert.ok((await page.locator('body').innerText()).includes('Original figure unavailable'),'Corrupt exhibit has explicit unavailable status');
 await page.screenshot({path:path.join(qaDir,'modal-corrupt-exhibit.png'),fullPage:true});
 const legacy=structuredClone(fixture);legacy.id='qa-legacy';legacy.visualPayload.assetRegistry=[];legacy.visualPayload.hero.imageUrl='https://images.unsplash.com/qa-remote';
 await open(legacy);assert.equal(await decoded(),0,'Legacy remote assets use explicit unavailable fallback');assert.ok((await page.locator('body').innerText()).includes('Editorial photo unavailable'),'Legacy remote hero has explicit unavailable status');
 await page.screenshot({path:path.join(qaDir,'modal-legacy-remote.png'),fullPage:true});
 assert.deepEqual(external,[],'Report assets must not initiate external network requests');
 assert.deepEqual(errors,[],'Real modal must render without browser exceptions');
 await fs.writeFile(path.join(qaDir,'browser-results.json'),JSON.stringify({status:'PASS',tests:['stored PNG exhibit and editorial asset decode','JSON-persisted reopen','PDF crop provenance','missing/corrupt exhibit fallback','legacy remote fallback','zero external requests','zero browser exceptions'],fixture:'Synthetic labeled QA artwork with no financial data; actual Chromium source-element screenshot and actual ResearchReportModal'},null,2));
 console.log('PASS: 7 independent real-modal browser checks; evidence .tmp/visual-qa');
}finally{await browser.close();await vite.close();}
