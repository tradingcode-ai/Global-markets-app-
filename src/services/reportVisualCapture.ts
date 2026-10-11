// Server-only acquisition of original report figures. No authenticated browser state is used.
import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { isIP } from 'node:net';

const MAX_IMAGE_BYTES = 1024 * 1024;
const MAX_DOCUMENT_BYTES = 12 * 1024 * 1024;
const MAX_PIXELS = 10_000_000;
const MIN_QUALITY = 0.8;

export interface VisualInspection {
  relevant: boolean;
  isChart: boolean;
  readable: boolean;
  visualSource?: string;
  sourceText?: string;
  sourceAttributionVisible?: boolean;
  title?: string;
  quality: number;
  page?: number;
  crop?: { x: number; y: number; width: number; height: number };
}

export interface VisualLead {
  sourceUrl: string;
  imageUrl?: string;
  page?: number;
  title?: string;
  publisher?: string;
  claim?: string;
  description?: string;
}

export interface PersistedVisual {
  dataUrl: string;
  sha256: string;
  width: number;
  height: number;
  mediaType: 'image/png' | 'image/jpeg';
  byteLength: number;
  capturedAt: string;
  captureMethod: 'download' | 'element_screenshot' | 'pdf_crop';
  sourceUrl?: string;
  imageUrl?: string;
  pdfPage?: number;
  crop?: VisualInspection['crop'];
  inspection?: VisualInspection;
}

export interface FetchResult { bytes: Buffer; contentType: string; url: string }
export interface NetworkDependencies {
  // Test seam: both transports and resolvers are explicitly injectable.
  resolve?: (hostname: string) => Promise<Array<{ address: string; family: number }>>;
  fetch?: (url: string, maxBytes: number, timeoutMs: number) => Promise<FetchResult>;
}
export interface CaptureDependencies extends NetworkDependencies {
  inspect: (dataUrl: string, context: Record<string, unknown>) => Promise<VisualInspection>;
}

function publicIPv4(address: string): boolean {
  const octets = address.split('.').map(Number);
  if (octets.length !== 4 || octets.some((x) => !Number.isInteger(x) || x < 0 || x > 255)) return false;
  const [a, b, c] = octets;
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
    (a === 192 && b === 88 && c === 99) || (a === 192 && b === 0) || (a === 192 && b === 2) ||
    (a === 198 && (b === 18 || b === 19 || b === 51 && c === 100)) ||
    (a === 203 && b === 0 && c === 113));
}

function publicAddress(address: string): boolean {
  if (isIP(address) === 4) return publicIPv4(address);
  if (isIP(address) !== 6) return false;
  // Limit IPv6 to ordinary global unicast. This also excludes IPv4-mapped,
  // loopback, ULA, link-local, multicast, NAT64 and unspecified addresses.
  const lower = address.toLowerCase();
  if (!/^[23][0-9a-f]{3}:/.test(lower)) return false;
  const prefix = lower.split(':').slice(0, 2).map((part) => parseInt(part || '0', 16));
  return !(prefix[0] === 0x2001 && (prefix[1] < 0x200 || prefix[1] === 0xdb8)) && prefix[0] !== 0x2002;
}

async function boundedResolve(hostname: string, deps: NetworkDependencies) {
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      (deps.resolve || ((host: string) => lookup(host, { all: true })))(hostname),
      new Promise<never>((_resolve, reject) => { timer = setTimeout(() => reject(new Error('Source DNS timed out')), 5_000); }),
    ]);
  } finally { clearTimeout(timer!); }
}

async function validatedTarget(input: string, deps: NetworkDependencies = {}) {
  const url = new URL(input);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Only unauthenticated public HTTP(S) sources are permitted');
  }
  if (url.port && !['80', '443'].includes(url.port)) throw new Error('Nonstandard source port blocked');
  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local') || !hostname.includes('.') && !isIP(hostname)) {
    throw new Error('Local source host blocked');
  }
  const addresses = isIP(hostname)
    ? [{ address: hostname, family: isIP(hostname) }]
    : await boundedResolve(hostname, deps);
  if (!addresses.length || addresses.some(({ address }) => !publicAddress(address))) {
    throw new Error('Source does not resolve exclusively to public addresses');
  }
  url.hash = '';
  return { url, addresses };
}

export async function assertPublicUrl(url: string, deps: NetworkDependencies = {}): Promise<void> {
  await validatedTarget(url, deps);
}

/** Bounded bytes, validated redirect chain, and pinned DNS for every request. */
export async function safeFetch(
  input: string,
  maxBytes = MAX_DOCUMENT_BYTES,
  timeoutMs = 12_000,
  deps: NetworkDependencies = {},
): Promise<FetchResult> {
  if (!Number.isFinite(maxBytes) || maxBytes < 1 || maxBytes > MAX_DOCUMENT_BYTES) throw new Error('Invalid byte limit');
  const deadline = Date.now() + Math.min(Math.max(timeoutMs, 1), 30_000);
  let current = input;
  for (let redirects = 0; redirects <= 5; redirects += 1) {
    const { url, addresses } = await validatedTarget(current, deps);
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error('Source fetch timed out');
    if (deps.fetch) {
      const result = await deps.fetch(url.href, maxBytes, remaining);
      await assertPublicUrl(result.url, deps);
      if (result.bytes.length > maxBytes) throw new Error('Source exceeds byte limit');
      return result;
    }
    const response = await new Promise<{ bytes: Buffer; contentType: string; location?: string; status: number }>((resolve, reject) => {
      const selected = addresses[0];
      const req = (url.protocol === 'https:' ? httpsRequest : httpRequest)(url, {
        method: 'GET',
        agent: false,
        headers: { 'User-Agent': 'GlobalMarkets-ReportVisual/1.0', Accept: 'image/*,application/pdf,text/html;q=0.9,*/*;q=0.5', 'Accept-Encoding': 'identity' },
        lookup: ((_hostname: string, options: any, callback: any) => {
          if (options?.all) callback(null, [selected]);
          else callback(null, selected.address, selected.family);
        }) as any,
      }, (res) => {
        const status = res.statusCode || 0;
        if (status >= 300 && status < 400) {
          res.destroy();
          resolve({ status, bytes: Buffer.alloc(0), contentType: '', location: res.headers.location });
          return;
        }
        if (status < 200 || status >= 300) { res.destroy(); reject(new Error(`Source HTTP ${status}`)); return; }
        if (Number(res.headers['content-length'] || 0) > maxBytes || res.headers['content-encoding'] && res.headers['content-encoding'] !== 'identity') {
          res.destroy(); reject(new Error('Oversized or encoded source blocked')); return;
        }
        const chunks: Buffer[] = [];
        let length = 0;
        res.on('data', (chunk: Buffer) => {
          length += chunk.length;
          if (length > maxBytes) { res.destroy(new Error('Source exceeds byte limit')); return; }
          chunks.push(chunk);
        });
        res.on('error', reject);
        res.on('end', () => resolve({ status, bytes: Buffer.concat(chunks), contentType: String(res.headers['content-type'] || '').split(';')[0].toLowerCase() }));
      });
      const timer = setTimeout(() => req.destroy(new Error('Source fetch timed out')), remaining);
      req.on('close', () => clearTimeout(timer));
      req.on('error', reject);
      req.end();
    });
    if (response.status >= 300 && response.status < 400) {
      if (!response.location || redirects === 5) throw new Error('Invalid or excessive source redirects');
      current = new URL(response.location, url).href;
      continue;
    }
    return { bytes: response.bytes, contentType: response.contentType, url: url.href };
  }
  throw new Error('Source redirect limit exceeded');
}

function rasterDimensions(bytes: Buffer): { width: number; height: number } {
  if (bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    for (let i = 2; i + 8 < bytes.length;) {
      if (bytes[i] !== 0xff) { i += 1; continue; }
      const marker = bytes[i + 1];
      if (marker === 0xd9 || marker === 0xda) break;
      if (marker === 0x00 || marker === 0xff || marker >= 0xd0 && marker <= 0xd8) { i += 2; continue; }
      const size = bytes.readUInt16BE(i + 2);
      if (size < 2 || i + 2 + size > bytes.length) break;
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { width: bytes.readUInt16BE(i + 7), height: bytes.readUInt16BE(i + 5) };
      }
      i += 2 + size;
    }
  }
  throw new Error('Only PNG and JPEG raster images are accepted');
}

function boundedDimensions(width: number, height: number) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 120 || height < 100 || width * height > MAX_PIXELS) {
    throw new Error('Image dimensions are outside capture limits');
  }
}

/** Decode to prove this is a real raster; strip metadata and persist actual bytes. */
export async function decodeAndPersistRaster(
  input: Uint8Array,
  metadata: Partial<PersistedVisual> & { maxBytes?: number } = {},
): Promise<PersistedVisual> {
  const bytes = Buffer.from(input);
  if (!bytes.length || bytes.length > MAX_DOCUMENT_BYTES) throw new Error('Image exceeds input byte limit');
  const dimensions = rasterDimensions(bytes);
  boundedDimensions(dimensions.width, dimensions.height);
  const { loadImage, createCanvas } = await import('@napi-rs/canvas');
  const image = await loadImage(bytes);
  boundedDimensions(image.width, image.height);
  const { maxBytes = MAX_IMAGE_BYTES, ...persistedMetadata } = metadata;
  if (!Number.isFinite(maxBytes) || maxBytes < 1024 || maxBytes > MAX_IMAGE_BYTES) throw new Error('Invalid persisted image limit');
  const canvas = createCanvas(image.width, image.height);
  canvas.getContext('2d').drawImage(image, 0, 0);
  let output = await canvas.encode('png');
  let mediaType: 'image/png' | 'image/jpeg' = 'image/png';
  for (const quality of [90, 82, 72]) {
    if (output.length <= maxBytes) break;
    output = await canvas.encode('jpeg', quality);
    mediaType = 'image/jpeg';
  }
  if (output.length > maxBytes) throw new Error('Normalized image exceeds persisted byte limit');
  return {
    ...persistedMetadata,
    dataUrl: `data:${mediaType};base64,${output.toString('base64')}`,
    sha256: createHash('sha256').update(output).digest('hex'),
    width: image.width,
    height: image.height,
    mediaType,
    byteLength: output.length,
    capturedAt: new Date().toISOString(),
    captureMethod: metadata.captureMethod || 'download',
  };
}

function verified(inspection: VisualInspection): boolean {
  return inspection?.relevant === true && inspection.isChart === true && inspection.readable === true &&
    Number.isFinite(inspection.quality) && inspection.quality >= MIN_QUALITY &&
    typeof inspection.visualSource === 'string' && inspection.visualSource.trim().length > 0;
}

interface CaptureBudget { deadline: number; reviews: number; signal: AbortSignal; cleanups: Array<() => Promise<void>> }
type BoundedCaptureDependencies = CaptureDependencies & { budget: CaptureBudget };

function remainingCapture(deps: BoundedCaptureDependencies): number {
  const remaining = deps.budget.deadline - Date.now();
  if (deps.budget.signal.aborted || remaining <= 0) throw new Error('Visual source capture exceeded 60 seconds');
  return remaining;
}

async function withinCapture<T>(promise: Promise<T>, deps: BoundedCaptureDependencies): Promise<T> {
  remainingCapture(deps);
  let onAbort: () => void;
  const aborted = new Promise<never>((_resolve, reject) => {
    onAbort = () => reject(new Error('Visual source capture exceeded 60 seconds'));
    deps.budget.signal.addEventListener('abort', onAbort, { once: true });
  });
  try { return await Promise.race([promise, aborted]); }
  finally { deps.budget.signal.removeEventListener('abort', onAbort!); }
}

async function reviewFigure(dataUrl: string, context: Record<string, unknown>, deps: BoundedCaptureDependencies) {
  remainingCapture(deps);
  if (deps.budget.reviews >= 4) throw new Error('Visual source inspection budget exhausted');
  deps.budget.reviews += 1;
  return withinCapture(deps.inspect(dataUrl, context), deps);
}

async function inspectRaster(bytes: Buffer, lead: VisualLead, deps: BoundedCaptureDependencies, metadata: Partial<PersistedVisual>, sourceContext?: string) {
  remainingCapture(deps);
  const asset = await decodeAndPersistRaster(bytes, { sourceUrl: lead.sourceUrl, ...metadata });
  const inspection = await reviewFigure(asset.dataUrl, { ...lead, sourceContext: sourceContext?.slice(0, 3000), sourceContextIsUntrusted: true, phase: 'verify_figure', width: asset.width, height: asset.height, ...metadata }, deps);
  if (!verified(inspection)) throw new Error('Figure failed relevance, chart or readability inspection');
  asset.inspection = inspection;
  return asset;
}

async function capturePdf(document: FetchResult, lead: VisualLead, deps: BoundedCaptureDependencies): Promise<PersistedVisual> {
  remainingCapture(deps);
  const canvasModule = await import('@napi-rs/canvas');
  // PDF.js uses these DOM primitives in its Node rendering path.
  for (const key of ['DOMMatrix', 'ImageData', 'Path2D'] as const) {
    if (!(globalThis as any)[key]) (globalThis as any)[key] = (canvasModule as any)[key];
  }
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  remainingCapture(deps);
  const task = pdfjs.getDocument({ data: new Uint8Array(document.bytes), useSystemFonts: true, disableFontFace: true, maxImageSize: MAX_PIXELS, stopAtErrors: true });
  let pdfClosing: Promise<void>;
  const closePdf = () => pdfClosing ||= task.destroy().catch(() => undefined);
  deps.budget.cleanups.push(closePdf);
  const stopPdf = () => { void closePdf(); };
  deps.budget.signal.addEventListener('abort', stopPdf, { once: true });
  try {
    const pdf = await withinCapture(task.promise, deps);
    const nominated = Number.isInteger(lead.page) && lead.page! >= 1 && lead.page! <= pdf.numPages ? lead.page : undefined;
    const pageOrder = [...new Set([nominated, 1, 2].filter((page): page is number => Boolean(page) && page! <= pdf.numPages))].slice(0, 2);
    for (const number of pageOrder) {
      remainingCapture(deps);
      if (deps.budget.reviews >= 4) break;
      const page = await withinCapture(pdf.getPage(number), deps);
      const initial = page.getViewport({ scale: 1 });
      const scale = Math.min(1.8, Math.sqrt(MAX_PIXELS / (initial.width * initial.height)));
      const viewport = page.getViewport({ scale });
      const width = Math.floor(viewport.width), height = Math.floor(viewport.height);
      boundedDimensions(width, height);
      const canvas = canvasModule.createCanvas(width, height);
      try {
        await withinCapture(page.render({ canvas: canvas as any, canvasContext: canvas.getContext('2d') as any, viewport }).promise, deps);
        const pageBytes = await canvas.encode('jpeg', 88);
        if (pageBytes.length > MAX_IMAGE_BYTES) continue;
        const inspection = await reviewFigure(`data:image/jpeg;base64,${pageBytes.toString('base64')}`, {
          ...lead, phase: 'locate_pdf_figure', page: number, width, height,
          instruction: 'Select only the relevant original chart, including axes, legend, title and source footnotes. Return a pixel crop; never select the entire page.',
        }, deps);
        const crop = inspection?.crop;
        if (!crop || !inspection.relevant || !inspection.isChart) continue;
        const { x, y, width: cw, height: ch } = crop;
        if (![x, y, cw, ch].every(Number.isFinite) || x < 0 || y < 0 || cw < 120 || ch < 100 || x + cw > width || y + ch > height || cw * ch > width * height * 0.92) continue;
        const selected = canvasModule.createCanvas(Math.floor(cw), Math.floor(ch));
        selected.getContext('2d').drawImage(canvas, x, y, cw, ch, 0, 0, Math.floor(cw), Math.floor(ch));
        try {
          return await inspectRaster(await selected.encode('png'), lead, deps, { captureMethod: 'pdf_crop', pdfPage: number, crop });
        } catch { /* Another page can contain a clearer figure. */ }
      } finally { page.cleanup(); }
    }
    throw new Error('No verified chart crop found within the two-page/four-review PDF budget');
  } finally { deps.budget.signal.removeEventListener('abort', stopPdf); await closePdf(); }
}

async function captureWeb(document: FetchResult, lead: VisualLead, deps: BoundedCaptureDependencies): Promise<PersistedVisual> {
  const { chromium } = await import('playwright');
  remainingCapture(deps);
  if (remainingCapture(deps) < 15_000) throw new Error('Insufficient source budget to start an isolated browser');
  const browser = await chromium.launch({ headless: true, chromiumSandbox: true, timeout: 15_000 });
  let browserClosing: Promise<void>;
  const closeBrowser = () => browserClosing ||= browser.close().catch(() => undefined);
  deps.budget.cleanups.push(closeBrowser);
  const stopBrowser = () => { void closeBrowser(); };
  deps.budget.signal.addEventListener('abort', stopBrowser, { once: true });
  try {
    remainingCapture(deps);
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, serviceWorkers: 'block', acceptDownloads: false });
    await context.routeWebSocket('**/*', (socket) => socket.close());
    let requests = 0;
    let transferred = document.bytes.length;
    const deadline = deps.budget.deadline;
    await context.route('**/*', async (route) => {
      try {
        const request = route.request();
        if (++requests > 65 || Date.now() > deadline || !['GET', 'HEAD'].includes(request.method())) return await route.abort();
        const result = request.isNavigationRequest() && request.url() === document.url
          ? document
          : await safeFetch(request.url(), 4 * 1024 * 1024, 8_000, deps);
        transferred += result.bytes.length;
        if (transferred > 30 * 1024 * 1024) return await route.abort();
        await route.fulfill({ status: 200, body: result.bytes, contentType: result.contentType || 'application/octet-stream', headers: { 'Cache-Control': 'no-store' } });
      } catch { await route.abort().catch(() => undefined); }
    });
    const page = await context.newPage();
    page.setDefaultTimeout(8_000);
    await page.goto(document.url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await page.waitForLoadState('networkidle', { timeout: 4_000 }).catch(() => undefined);
    const candidates = page.locator('figure, img, svg, canvas');
    // Bound work, preferring elements large enough to contain readable charts.
    const count = Math.min(await candidates.count(), 60);
    let inspected = 0;
    for (let i = 0; i < count && inspected < 4 && deps.budget.reviews < 4 && Date.now() < deadline; i += 1) {
      const element = candidates.nth(i);
      const box = await element.boundingBox();
      if (!box || box.width < 240 || box.height < 150 || box.width * box.height > MAX_PIXELS) continue;
      inspected += 1;
      try {
        const sourceContext = await element.evaluate((node) => {
          const surrounding = node.closest('figure') || node.parentElement;
          return (surrounding?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 3000);
        });
        const bytes = await element.screenshot({ type: 'png', timeout: Math.min(5_000, remainingCapture(deps)), animations: 'disabled' });
        return await inspectRaster(bytes, lead, deps, { captureMethod: 'element_screenshot', sourceUrl: document.url }, sourceContext);
      } catch { /* Try the next bounded figure candidate. */ }
    }
    throw new Error('No verified readable chart element found; no page screenshot was substituted');
  } finally { deps.budget.signal.removeEventListener('abort', stopBrowser); await closeBrowser(); }
}

function referencesImage(document: FetchResult, imageUrl: string): boolean {
  if (!['text/html', 'application/xhtml+xml'].includes(document.contentType)) return false;
  const text = document.bytes.toString('utf8').replaceAll('&amp;', '&').replaceAll('\\/', '/').replaceAll('\\u0026', '&');
  const target = new URL(imageUrl);
  target.hash = '';
  // Only accept a URL actually present in the acquired page, including relative
  // image attributes. A model-supplied association is never enough on its own.
  if (text.includes(target.href)) return true;
  const attributes = text.matchAll(/(?:src|data-src|content|href|srcset)\s*=\s*["']([^"']+)["']/gi);
  for (const attribute of attributes) {
    for (const item of attribute[1].split(',')) {
      const value = item.trim().split(/\s+/)[0];
      try { if (new URL(value, document.url).href === target.href) return true; } catch { /* Ignore malformed page attributes. */ }
    }
  }
  return false;
}


function observedImageContext(document: FetchResult, imageUrl: string): string {
  const html = document.bytes.toString('utf8').replaceAll('&amp;', '&').replaceAll('\\/', '/').replaceAll('\\u0026', '&');
  const target = new URL(imageUrl);
  const position = [target.href, target.pathname].map(value => html.indexOf(value)).find(index => index >= 0);
  if (position === undefined) return '';
  const figureStart = html.lastIndexOf('<figure', position);
  const figureEnd = html.indexOf('</figure>', position);
  const snippet = figureStart >= 0 && position - figureStart < 5000 && figureEnd >= position && figureEnd - position < 5000
    ? html.slice(figureStart, figureEnd + 9)
    : html.slice(Math.max(0, position - 1400), position + 2400);
  return snippet.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000);
}

async function captureBoundedLead(lead: VisualLead, deps: BoundedCaptureDependencies): Promise<PersistedVisual> {
  remainingCapture(deps);
  const document = await withinCapture(safeFetch(lead.sourceUrl, MAX_DOCUMENT_BYTES, Math.min(15_000, remainingCapture(deps)), deps), deps);
  remainingCapture(deps);
  if (document.bytes.subarray(0, 5).toString() === '%PDF-') return capturePdf(document, lead, deps);
  if (document.contentType.startsWith('image/')) return inspectRaster(document.bytes, lead, deps, { captureMethod: 'download', sourceUrl: document.url, imageUrl: document.url });
  if (!['text/html', 'application/xhtml+xml'].includes(document.contentType)) throw new Error('Source is not an image, PDF or HTML document');
  if (lead.imageUrl && referencesImage(document, lead.imageUrl)) {
    try {
      const image = await safeFetch(lead.imageUrl, MAX_DOCUMENT_BYTES, 12_000, deps);
      return await inspectRaster(image.bytes, lead, deps, { captureMethod: 'download', sourceUrl: document.url, imageUrl: image.url }, observedImageContext(document, lead.imageUrl));
    } catch { /* A discovered link is a lead, not proof of a valid figure. */ }
  }
  return captureWeb(document, lead, deps);
}

export async function captureVisualLead(lead: VisualLead, dependencies: CaptureDependencies): Promise<PersistedVisual> {
  const controller = new AbortController();
  const deps: BoundedCaptureDependencies = {
    ...dependencies,
    budget: { deadline: Date.now() + 60_000, reviews: 0, signal: controller.signal, cleanups: [] },
  };
  const timer = setTimeout(() => controller.abort(), 60_000);
  try { return await withinCapture(captureBoundedLead(lead, deps), deps); }
  finally {
    clearTimeout(timer);
    controller.abort();
    await Promise.allSettled(deps.budget.cleanups.map((cleanup) => cleanup()));
  }
}
