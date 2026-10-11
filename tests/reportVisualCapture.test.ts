process.env.PLAYWRIGHT_BROWSERS_PATH ||= process.cwd() + '/.cache/ms-playwright';
/** Independent capture checks. All documents are explicitly QA fixtures with
 * no financial observations; network transport and semantic reviewer are test doubles.
 * Browser element screenshot, raster decode, PDF render/crop and hashes are real.
 * Run: node --import tsx --test tests/reportVisualCapture.test.ts
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { createCanvas } from '@napi-rs/canvas';
import { assertPublicUrl, safeFetch, decodeAndPersistRaster, captureVisualLead } from '../src/services/reportVisualCapture';
const resolve=async()=>[{address:'93.184.216.34',family:4}];
const yes=async()=>({relevant:true,isChart:true,readable:true,quality:0.95,visualSource:'QA fixture publisher',sourceText:'QA ONLY — no financial observations',sourceAttributionVisible:true});
const png=async()=>{const c=createCanvas(1200,700),x=c.getContext('2d');x.fillStyle='#eef3fa';x.fillRect(0,0,1200,700);x.fillStyle='#173752';x.font='30px Arial';x.fillText('QA ONLY — original exhibit fixture',50,70);x.fillText('No financial data',50,120);x.strokeStyle='#0369a1';x.lineWidth=5;x.beginPath();x.moveTo(100,550);x.lineTo(350,250);x.lineTo(600,400);x.lineTo(1000,180);x.stroke();x.fillText('Source: QA fixture publisher',50,650);return c.encode('png');};
const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const bytes=(v:{dataUrl:string})=>Buffer.from(v.dataUrl.split(',')[1],'base64');
const lead={sourceUrl:'https://qa.example/article',claim:'QA fixture visual only'};
await fs.mkdir('.tmp/visual-qa',{recursive:true});

test('SSRF guards reject private/ambiguous targets before any transport',async()=>{
 for(const url of ['http://localhost/x','http://127.0.0.1/x','http://10.1.2.3/x','http://169.254.169.254/x','http://[::1]/x','http://[::ffff:127.0.0.1]/x','http://example.com:8080/x','http://u:p@example.com/x','file:///etc/passwd']) await assert.rejects(assertPublicUrl(url,{resolve}));
 await assert.rejects(assertPublicUrl('https://qa.example',{resolve:async()=>[{address:'93.184.216.34',family:4},{address:'10.1.1.1',family:4}]}));
 await assertPublicUrl('https://qa.example',{resolve});
});
test('safe fetch validates final redirect destination and enforces byte limits',async()=>{
 await assert.rejects(safeFetch(lead.sourceUrl,100,1000,{resolve,fetch:async()=>({bytes:Buffer.from('x'),contentType:'text/html',url:'http://127.0.0.1/private'})}));
 await assert.rejects(safeFetch(lead.sourceUrl,10,1000,{resolve,fetch:async()=>({bytes:Buffer.alloc(11),contentType:'image/png',url:lead.sourceUrl})}));
 await assert.rejects(safeFetch(lead.sourceUrl,13*1024*1024,1000,{resolve}));
});
test('raster normalization proves decode, stores bytes and deterministic checksum',async()=>{
 const original=await png(), stored=await decodeAndPersistRaster(original);
 assert.equal(stored.width,1200);assert.equal(stored.height,700);assert.equal(stored.byteLength,bytes(stored).length);assert.equal(stored.sha256,hash(bytes(stored)));
 const persisted=JSON.parse(JSON.stringify(stored));assert.equal(persisted.dataUrl,stored.dataUrl);
 await assert.rejects(decodeAndPersistRaster(Buffer.from('<html>not a figure</html>')));
 const invalid=Buffer.alloc(24);Buffer.from([137,80,78,71,13,10,26,10]).copy(invalid);invalid.writeUInt32BE(1200,16);invalid.writeUInt32BE(700,20);await assert.rejects(decodeAndPersistRaster(invalid));
 const bomb=Buffer.from(invalid);bomb.writeUInt32BE(100000,16);await assert.rejects(decodeAndPersistRaster(bomb));
});
test('original image requires positive figure inspection, never just a URL',async()=>{
 const original=await png();const deps={resolve,fetch:async(url:string)=>({bytes:original,contentType:'image/png',url}),inspect:yes};
 const stored=await captureVisualLead({...lead,imageUrl:'https://qa.example/chart.png'},deps);assert.equal(stored.captureMethod,'download');assert.equal(stored.sha256,hash(bytes(stored)));
 await assert.rejects(captureVisualLead(lead,{...deps,inspect:async()=>({relevant:false,isChart:false,readable:false,quality:0})}));
 const sourceHtml=Buffer.from('<figure><img src="/chart.png"><figcaption>Source: QA caption publisher — original test exhibit</figcaption></figure>');let contextSeen:any;
 const downloaded=await captureVisualLead({...lead,imageUrl:'https://qa.example/chart.png'},{resolve,fetch:async(url)=>({url,contentType:url===lead.sourceUrl?'text/html':'image/png',bytes:url===lead.sourceUrl?sourceHtml:original}),inspect:async(_data,context)=>{contextSeen=context;return yes();}});
 assert.equal(downloaded.captureMethod,'download');assert.ok(contextSeen.sourceContext.includes('QA caption publisher'));assert.equal(contextSeen.sourceContextIsUntrusted,true);assert.equal(downloaded.sourceUrl,lead.sourceUrl);
});
test('actual browser captures original figure and blocks private subresources',async()=>{
 const html=Buffer.from('<html><body><img src="http://169.254.169.254/private"><figure style="width:1200px;height:700px;background:#eef3fa;font-family:Arial"><h1>QA ONLY original exhibit</h1><p>No financial data</p><svg width="1100" height="480"><path d="M80 50V400H1000M80 350L350 190L600 300L950 100" fill="none" stroke="#0369a1" stroke-width="6"/></svg><p>Source: QA fixture publisher</p></figure></body></html>');
 const requested:string[]=[];const contexts:any[]=[];const stored=await captureVisualLead(lead,{resolve,fetch:async(url)=>{requested.push(url);return {bytes:html,contentType:'text/html',url};},inspect:async(data,context)=>{contexts.push(context);return yes();}});
 assert.equal(stored.captureMethod,'element_screenshot');assert.ok(contexts[0].sourceContext.includes('Source: QA fixture publisher'));assert.equal(contexts[0].sourceContextIsUntrusted,true);assert.ok(contexts[0].sourceContext.length<=3000);assert.ok(stored.width>=1100);assert.ok(!requested.some(x=>x.includes('169.254.169.254')));assert.equal(stored.sha256,hash(bytes(stored)));await fs.writeFile('.tmp/visual-qa/service-web-exhibit.png',bytes(stored));
});
test('an article link with no figure cannot become a screenshot URL or full-page image',async()=>{
 await assert.rejects(captureVisualLead({...lead,imageUrl:lead.sourceUrl},{resolve,fetch:async(url)=>({bytes:Buffer.from('<html><body><h1>QA article with no chart</h1></body></html>'),contentType:'text/html',url}),inspect:yes}),/No verified readable chart element/);
});
function pdfFixture(){
 const stream='BT /F1 24 Tf 60 730 Td (QA ONLY original PDF exhibit) Tj ET\nBT /F1 15 Tf 60 700 Td (No financial observations) Tj ET\n0.02 0.42 0.65 RG 4 w 70 300 m 70 640 l 530 640 l S\n70 330 m 180 500 l 300 410 l 500 600 l S\nBT /F1 14 Tf 60 260 Td (Source: QA fixture publisher) Tj ET';
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>','<< /Length '+Buffer.byteLength(stream)+' >>\nstream\n'+stream+'\nendstream','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
 let doc='%PDF-1.4\n';const offsets=[0];objects.forEach((o,i)=>{offsets.push(Buffer.byteLength(doc));doc+=(i+1)+' 0 obj\n'+o+'\nendobj\n';});const xref=Buffer.byteLength(doc);doc+='xref\n0 6\n0000000000 65535 f \n'+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';return Buffer.from(doc);
}
test('actual PDF renderer crops a selected figure and retains page/crop provenance',async()=>{
 const pdf=pdfFixture();await fs.writeFile('.tmp/visual-qa/source-fixture.pdf',pdf);
 const phases:string[]=[];const stored=await captureVisualLead({...lead,sourceUrl:'https://qa.example/report.pdf'},{resolve,fetch:async(url)=>({bytes:pdf,contentType:'application/pdf',url}),inspect:async(_url,context)=>{phases.push(String(context.phase));return {...await yes(),crop:context.phase==='locate_pdf_figure'?{x:70,y:130,width:940,height:1020}:undefined};}});
 assert.equal(stored.captureMethod,'pdf_crop');assert.equal(stored.pdfPage,1);assert.deepEqual(stored.crop,{x:70,y:130,width:940,height:1020});assert.deepEqual(phases,['locate_pdf_figure','verify_figure']);assert.equal(stored.width,940);assert.equal(stored.height,1020);await fs.writeFile('.tmp/visual-qa/service-pdf-exhibit.png',bytes(stored));
});

import { runAntiGravityVisualDataAgent, isLeadInDiscoveryChannel, ANTI_GRAVITY_VISUAL_DATA_AGENT_CONFIG } from '../src/services/antiGravityVisualDataAgent';
import type { ResearchReport, DiscoveryChannel } from '../src/types/marketResearch';
const report:ResearchReport={id:'qa',ticker:'QA',assetName:'QA fixture',confidence:'LOW',status:'COMPLETED',executiveSummary:'QA only — no investment analysis.',immediateCatalyst:'QA fixture claim.',directMarketImpact:'No financial inference.',whatToWatchNext:'QA checks only.',claims:[{id:'qa-claim',text:'QA fixture claim.',certainty:'REPORTED',sourceIds:[],sectionPurpose:'what_drove_the_move'}],sources:[]};
const captured=async()=>({...await decodeAndPersistRaster(await png()),inspection:await yes()});
test('existing source is actually captured first and successful capture stops all discovery',async()=>{
 let discoveries=0,captures=0;const payload=await runAntiGravityVisualDataAgent({...report,sources:[{url:lead.sourceUrl,title:'QA source',publisher:'QA fixture'}]},undefined,null,{discover:async()=>{discoveries++;return[]},capture:async()=>{captures++;return captured()},inspect:yes,photo:async()=>undefined});
 assert.equal(captures,1);assert.equal(discoveries,0);assert.equal(payload.assetRegistry?.length,1);assert.ok(payload.assetRegistry?.[0].stored?.dataUrl.startsWith('data:image/'));assert.equal(payload.layoutPlan?.firstPage.primaryEvidenceAssetId,payload.assetRegistry?.[0].id);assert.equal(payload.macroChart,undefined);assert.equal(payload.macro_chart,undefined);assert.equal(payload.assetRegistry?.[0].extractionStatus,'VISUAL_ONLY');
});
test('discovery reaches specialist and social in declared order and stops after verified social figure',async()=>{
 const order:DiscoveryChannel[]=[];const payload=await runAntiGravityVisualDataAgent(report,undefined,null,{discover:async(channel)=>{order.push(channel);return channel==='social'?[{...lead,sourceUrl:'https://x.com/qa-fixture/status/1',publisher:'QA social discovery'}]:[]},capture:captured,inspect:yes,photo:async()=>undefined});
 assert.deepEqual(order,['official_research','financial_media','specialist_finance','social']);assert.equal(payload.assetRegistry?.[0].provenance.discoverySource,'x.com');assert.equal(payload.assetRegistry?.[0].provenance.visualSource,'QA fixture publisher');
});
test('failed sources reach all bounded discovery channels, deduplicate URLs and produce honest unavailable state',async()=>{
 const order:DiscoveryChannel[]=[];let captures=0;const payload=await runAntiGravityVisualDataAgent({...report,sources:Array.from({length:20},()=>({url:lead.sourceUrl,title:'QA duplicate',publisher:'QA'}))},undefined,null,{discover:async(channel)=>{order.push(channel);return [lead,lead,lead]},capture:async()=>{captures++;throw new Error('Fixture has no figure')},inspect:yes,photo:async()=>undefined});
 assert.deepEqual(order,['official_research','financial_media','specialist_finance','social','primary_source','structured_data']);assert.equal(captures,1);assert.deepEqual(payload.assetRegistry,[]);assert.notEqual(payload.availability?.evidence,'AVAILABLE');assert.equal(payload.layoutPlan?.firstPage.primaryEvidenceAssetId,undefined);assert.equal(payload.macroChart,undefined);
});
test('a capture without verified attributed pixels cannot satisfy evidence and a remote photo is not registered',async()=>{
 const result=await captured();delete result.inspection.visualSource;const payload=await runAntiGravityVisualDataAgent(report,undefined,null,{discover:async()=>[lead],capture:async()=>result,inspect:yes,photo:async()=>({id:'remote',asset:{url:'https://qa.example/photo.jpg'}} as any)});
 assert.deepEqual(payload.assetRegistry,[]);assert.notEqual(payload.availability?.photo,'AVAILABLE');assert.notEqual(payload.availability?.evidence,'AVAILABLE');
});

import { retrieveEditorialPhoto } from '../src/services/reportEditorialPhoto';
const photoIntent:any={section:'QA header',subject:'QA fixture',entities:['QA'],imageIntent:'company',preferredElements:['factory'],maxImages:1,requirements:{minWidth:1200,minHeight:675,sourceRequirement:'identify',attributionRequirement:'required',freshnessRequirement:'recent',allowedTypes:['photo']}};
const photoResponse=(license='Public domain')=>({query:{pages:{1:{title:'File:QA_fixture.png',imageinfo:[{thumburl:'https://qa.example/photo.png',thumbwidth:1600,thumbheight:900,mime:'image/png',descriptionurl:'https://commons.wikimedia.org/wiki/File:QA_fixture.png',extmetadata:{LicenseShortName:{value:license},Artist:{value:'QA fixture creator'},ImageDescription:{value:'QA ONLY artwork, not a real company photograph'},DateTimeOriginal:{value:'2008-01-01'}}}]}}}});
test('editorial photo persists decoded bytes and honest author/license/source date without hotlink',async()=>{
 const original=await png();const asset=await retrieveEditorialPhoto(photoIntent,{fetch:async(url)=>({url,contentType:url.includes('/w/api.php')?'application/json':'image/png',bytes:url.includes('/w/api.php')?Buffer.from(JSON.stringify(photoResponse())):original}),validate:async()=>({relevant:true,description:'QA artwork'})});
 assert.ok(asset?.stored?.dataUrl.startsWith('data:image/'));assert.equal(asset?.asset.url,undefined);assert.equal(asset?.license?.name,'Public domain');assert.equal(asset?.source.publishedAt,'2008-01-01');assert.equal(asset?.attribution?.text,'QA fixture creator — Public domain');
});
test('editorial photo rejects unsupported reuse license before download',async()=>{
 let requests=0;const asset=await retrieveEditorialPhoto(photoIntent,{fetch:async(url)=>{requests++;return {url,contentType:'application/json',bytes:Buffer.from(JSON.stringify(photoResponse('CC BY-NC 4.0')))}},validate:async()=>({relevant:true})});assert.equal(asset,undefined);assert.equal(requests,1);
});
test('editorial dimensions are checked on actual decoded pixels, not provider metadata',async()=>{
 const tiny=createCanvas(200,150);tiny.getContext('2d').fillRect(0,0,200,150);const small=await tiny.encode('png');let reviews=0;
 const asset=await retrieveEditorialPhoto(photoIntent,{fetch:async(url)=>({url,contentType:url.includes('/w/api.php')?'application/json':'image/png',bytes:url.includes('/w/api.php')?Buffer.from(JSON.stringify(photoResponse())):small}),validate:async()=>{reviews++;return {relevant:true}}});assert.equal(asset,undefined);assert.equal(reviews,0);
});

test('browser semantic review stops after four actual figure candidates',async()=>{
 const html=Buffer.from('<html><body>'+Array.from({length:6},(_,i)=>'<figure style="width:500px;height:200px;background:#eef3fa">QA ONLY nonmatching figure '+i+'</figure>').join('')+'</body></html>');let reviews=0;
 await assert.rejects(captureVisualLead(lead,{resolve,fetch:async(url)=>({bytes:html,contentType:'text/html',url}),inspect:async()=>{reviews++;return {relevant:false,isChart:false,readable:true,quality:0}}}),/No verified readable chart element/);assert.equal(reviews,4);
});

test('discovery channel domain guard rejects early social leads and spoofed suffixes',async()=>{
 assert.equal(isLeadInDiscoveryChannel('https://x.com/qa-fixture/status/1','official_research'),false);assert.equal(isLeadInDiscoveryChannel('https://www.zerohedge.com/qa-fixture','specialist_finance'),true);assert.equal(isLeadInDiscoveryChannel('https://reuters.com.evil.example/article','financial_media'),false);assert.equal(isLeadInDiscoveryChannel('https://www.reuters.com/qa-fixture','financial_media'),true);
 const order:DiscoveryChannel[]=[];const attempted:string[]=[];const payload=await runAntiGravityVisualDataAgent(report,undefined,null,{discover:async(channel)=>{order.push(channel);return [{...lead,sourceUrl:channel==='official_research'?'https://x.com/qa-fixture/status/1':'https://www.reuters.com/qa-fixture'}]},capture:async(l)=>{attempted.push(l.sourceUrl);return captured()},inspect:yes,photo:async()=>undefined});assert.deepEqual(order,['official_research','financial_media']);assert.deepEqual(attempted,['https://www.reuters.com/qa-fixture']);assert.equal(payload.assetRegistry?.length,1);
});
test('configured search budget includes existing-document inspection and stops subsequent channels',async()=>{
 const prior=ANTI_GRAVITY_VISUAL_DATA_AGENT_CONFIG.retrieval.maxSearches;ANTI_GRAVITY_VISUAL_DATA_AGENT_CONFIG.retrieval.maxSearches=2;
 try{const order:DiscoveryChannel[]=[];const payload=await runAntiGravityVisualDataAgent({...report,sources:[{url:lead.sourceUrl,title:'QA source',publisher:'QA'}]},undefined,null,{discover:async(channel)=>{order.push(channel);return[]},capture:async()=>{throw new Error('No figure')},inspect:yes,photo:async()=>undefined});assert.deepEqual(order,['official_research']);assert.deepEqual(payload.assetRegistry,[]);}finally{ANTI_GRAVITY_VISUAL_DATA_AGENT_CONFIG.retrieval.maxSearches=prior;}
});

test('PDF rejects a full-page crop rather than presenting an article page as a figure',async()=>{
 const pdf=pdfFixture();await assert.rejects(captureVisualLead({...lead,sourceUrl:'https://qa.example/report.pdf'},{resolve,fetch:async(url)=>({bytes:pdf,contentType:'application/pdf',url}),inspect:async(_url,context)=>({...await yes(),crop:{x:0,y:0,width:Number(context.width),height:Number(context.height)}})}),/No verified chart crop/);
});

import { saveResearchReport, getResearchReport } from '../src/services/marketResearchStore';
test('PostgreSQL save/read adapter carries complete stored raster bytes and metadata through visual_payload',async()=>{
 // Explicit database double: this verifies the actual SQL adapter/JSON parser;
 // it does not connect to PostgreSQL or claim that a live Render write succeeded.
 const raster=await captured();const payload:any={version:2,enrichedAt:raster.capturedAt,assetRegistry:[{id:'qa-persisted-figure',type:'research_exhibit',purpose:'primary_evidence_exhibit',claimIds:['qa-claim'],stored:{...raster,pdfPage:3,crop:{x:10,y:20,width:1200,height:700}},source:{url:'https://qa.example/source',publisher:'QA fixture publisher'},asset:{width:1200,height:700},attribution:{text:'QA fixture credit',visible:true},provenance:{visualSource:'QA fixture publisher',discoverySource:'QA fixture discovery',retrievedAt:raster.capturedAt,status:'EXPLICIT_SOURCE'},selection:{reason:'QA persistence fixture only'}}]};
 let insertParams:any[]|undefined;let selected=0;let row:any;let schemaContainsJsonb=false;
 const fakePool:any={connect:async()=>({query:async(sql:string)=>{schemaContainsJsonb ||= /visual_payload JSONB/.test(sql);return {rows:[]}},release(){}}),query:async(sql:string,params:any[])=>{if(sql.includes('INSERT INTO market_research_reports')){insertParams=params;row={id:params[0],ticker:params[3],confidence:params[14],executive_summary:params[8],sources:params[16],status:params[18],visual_payload:params[20]};return {rows:[]};}if(sql.includes('SELECT * FROM market_research_reports WHERE id')){selected++;return {rows:[row]};}throw new Error('Unexpected SQL in QA database double');}};
 const saved={...report,id:'qa-persisted-report',visualPayload:payload};const oldLog=console.log;console.log=()=>{};try{await saveResearchReport(saved,fakePool);}finally{console.log=oldLog;}
 assert.ok(schemaContainsJsonb);assert.ok(insertParams);const serialized=JSON.parse(insertParams![20]);assert.equal(serialized.assetRegistry[0].stored.dataUrl,raster.dataUrl);assert.equal(serialized.assetRegistry[0].stored.sha256,hash(bytes(raster)));assert.equal(serialized.assetRegistry[0].stored.byteLength,bytes(raster).length);assert.equal(serialized.assetRegistry[0].stored.pdfPage,3);assert.equal(serialized.assetRegistry[0].source.url,'https://qa.example/source');
 const fromString=await getResearchReport(saved.id,fakePool);assert.deepEqual(fromString?.visualPayload,payload);assert.deepEqual(fromString?.visual_payload,payload);row.visual_payload=JSON.parse(row.visual_payload);const fromJsonb=await getResearchReport(saved.id,fakePool);assert.deepEqual(fromJsonb?.visualPayload,payload);assert.equal(selected,2,'Reads use database double, not in-memory fallback');assert.equal(fromJsonb?.executiveSummary,report.executiveSummary);
});
