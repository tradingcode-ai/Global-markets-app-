import type { ImageIntent, ReportAsset } from '../types/marketResearch';
import { safeFetch, decodeAndPersistRaster } from './reportVisualCapture';

const plain = (value: unknown): string => String(value || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const reusableLicense = /^(CC0|Public domain|CC BY(?:-SA)? [1-4]\.0)$/i;

export interface CommonsPhotoDependencies {
  fetch?: typeof safeFetch;
  validate: (dataUrl: string, description: string) => Promise<{ relevant: boolean; description?: string }>;
}

/** Commons discovery supplies license/author metadata; bytes are downloaded once and kept in JSONB. */
export async function retrieveEditorialPhoto(intent: ImageIntent | null, deps: CommonsPhotoDependencies): Promise<ReportAsset | undefined> {
  if (!intent) return undefined;
  const query = [intent.subject, ...intent.preferredElements.slice(0, 1).map(value => value.replace(/_/g, ' '))].join(' ').replace(/[^\p{L}\p{N} .-]/gu, ' ').slice(0, 180);
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  Object.entries({ action: 'query', format: 'json', generator: 'search', gsrsearch: query + ' filetype:bitmap', gsrnamespace: '6', gsrlimit: '6', prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1600' }).forEach(([k,v]) => url.searchParams.set(k,v));
  const fetcher = deps.fetch || safeFetch;
  const response = await fetcher(url.href, 1024 * 1024);
  const json = JSON.parse(response.bytes.toString('utf8'));
  const pages = (Object.values(json?.query?.pages || {}) as any[]).sort((a, b) => (a.index ?? Infinity) - (b.index ?? Infinity));
  for (const page of pages.slice(0, 6)) {
    const info = page.imageinfo?.[0];
    const meta = info?.extmetadata || {};
    const license = plain(meta.LicenseShortName?.value);
    const author = plain(meta.Artist?.value);
    const imageUrl = info?.thumburl || info?.url;
    const width = info?.thumbwidth || info?.width;
    const height = info?.thumbheight || info?.height;
    if (!reusableLicense.test(license) || !author || !imageUrl || !info.descriptionurl) continue;
    if (width < (intent.requirements.minWidth || 1) || height < (intent.requirements.minHeight || 1)) continue;
    if (!/^image\/(jpeg|png)$/.test(info.mime || '')) continue;
    // Commons structured metadata, never a generic invented photographer/location.
    const description = plain(meta.ImageDescription?.value) || plain(page.title).replace(/^File:/, '');
    try {
      const download = await fetcher(imageUrl, 6 * 1024 * 1024);
      const stored = await decodeAndPersistRaster(download.bytes, { sourceUrl: info.descriptionurl, captureMethod: 'download', maxBytes: 500 * 1024 });
      if (stored.width < (intent.requirements.minWidth || 1) || stored.height < (intent.requirements.minHeight || 1)) continue;
      const review = await deps.validate(stored.dataUrl, description);
      if (!review.relevant) continue;
      return {
        id: 'photo_' + stored.sha256.slice(0, 16), type: 'image', purpose: 'editorial_lead_image', stored,
        source: { publisher: 'Wikimedia Commons', url: info.descriptionurl, title: review.description || description, publishedAt: plain(meta.DateTimeOriginal?.value) || undefined },
        attribution: { text: author + ' — ' + license, visible: true },
        asset: { width: stored.width, height: stored.height },
        license: { name: license, url: meta.LicenseUrl?.value || undefined, author, fileTitle: page.title, date: plain(meta.DateTimeOriginal?.value) || undefined },
        provenance: { discoverySource: 'Wikimedia Commons API', visualSource: author, retrievedAt: stored.capturedAt, status: 'ATTRIBUTED_SOURCE' },
        selection: { reason: 'Downloaded reusable editorial photo; pixels reviewed against selected ' + intent.imageIntent + ' concept.' },
      };
    } catch { /* A failed download/review must not turn into a remote image fallback. */ }
  }
  return undefined;
}
