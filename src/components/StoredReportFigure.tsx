import React, { useState } from 'react';
import type { ReportAsset } from '../types/marketResearch';

export function isStoredRasterUrl(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 1400000 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
}

export const StoredReportFigure: React.FC<{ asset?: ReportAsset; editorial?: boolean; unavailable?: string }> = ({ asset, editorial = false, unavailable }) => {
  const [failed, setFailed] = useState(false);
  const src = asset?.stored?.dataUrl;
  const available = !failed && isStoredRasterUrl(src);
  const sourceUrl = asset?.source.url && /^https?:\/\//i.test(asset.source.url) ? asset.source.url : undefined;
  return (
    <figure className="overflow-hidden rounded-xl border border-slate-200 bg-white" aria-label={editorial ? 'Editorial photo' : 'Original research exhibit'}>
      {available ? <img src={src} alt={asset?.source.title || (editorial ? 'Editorial photo' : 'Original research figure')} className={editorial ? 'w-full max-h-72 object-cover' : 'w-full h-auto object-contain'} onError={() => setFailed(true)} /> : <div className="p-5 text-sm text-slate-500" role="status">{unavailable || (editorial ? 'Editorial photo unavailable: no verified stored image.' : 'Original figure unavailable: no verified stored image.')}</div>}
      {asset && <figcaption className="space-y-1 border-t border-slate-100 p-3 text-xs text-slate-600">
        <div className="font-medium text-slate-800">{editorial ? 'Editorial photo' : 'Figure 1'}: {asset.source.title || 'Original research exhibit'}{asset.stored?.pdfPage ? ' — PDF page ' + asset.stored.pdfPage : ''}</div>
        <div>{asset.attribution?.text || asset.provenance.visualSource}{sourceUrl && <> · <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">Source</a></>}</div>
        {asset.provenance.discoverySource && asset.provenance.discoverySource !== asset.provenance.visualSource && <div>Discovered via {asset.provenance.discoverySource}</div>}
        {editorial && asset.license && <div>{asset.license.url && /^https:\/\//i.test(asset.license.url) ? <a href={asset.license.url} target="_blank" rel="noopener noreferrer" className="underline">{asset.license.name}</a> : asset.license.name}{asset.license.date ? ' · Photo date: ' + asset.license.date : ''}</div>}
      </figcaption>}
    </figure>
  );
};
