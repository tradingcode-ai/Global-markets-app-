import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { LiveQuote, QuarterlyResult } from '../types';
import { formatMatrixNumber, getMatrixReportedFinancials, isFreshYahooSnapshot } from '../utils/consensusMatrix';
import { AnimatePresence } from 'motion/react';
import { StockLogoLoader } from './StockLogoLoader';

export function ConsensusCompanyModal({ result, quote, onClose }: {
  result: QuarterlyResult; quote?: LiveQuote | null; onClose: () => void;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 60000); return () => window.clearInterval(timer); }, []);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    return () => { document.body.style.overflow = overflow; previousFocus?.focus(); };
  }, []);
  const snapshot = isFreshYahooSnapshot(result.quarterlyConsensus, now) ? result.quarterlyConsensus : undefined;
  const actual = getMatrixReportedFinancials(snapshot, now);
  const marketQuote = quote?.isLive === true ? quote : undefined;
  const forwardPeriod = snapshot?.consensusPeriodEnd || snapshot?.nextQuarterLabel || 'N/A';
  const reportedPeriod = actual?.fiscalDate || 'N/A';
  const cards = [
    ['Forward EPS consensus', formatMatrixNumber(snapshot?.nextQuarterEps, snapshot?.consensusCurrency), forwardPeriod],
    ['Forward revenue consensus', formatMatrixNumber(snapshot?.nextQuarterRevenue, snapshot?.consensusCurrency, true), forwardPeriod],
    ['Last reported EPS', formatMatrixNumber(actual?.eps, actual?.currency), reportedPeriod],
    ['Last reported revenue', formatMatrixNumber(actual?.revenue, actual?.currency, true), reportedPeriod]
  ];
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    setIsLoading(true);
  }, [result?.ticker]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="consensus-company-title" onClick={event => event.stopPropagation()} onKeyDown={event => {
        if (event.key === 'Escape') { event.stopPropagation(); onClose(); }
        if (event.key === 'Tab') {
          const controls = dialog.current?.querySelectorAll<HTMLElement>('button, a[href], input, select, [tabindex="0"]');
          if (!controls?.length) return;
          const first = controls[0], last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      }} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl relative">
        <AnimatePresence>
          {isLoading && result?.ticker && (
            <StockLogoLoader
              ticker={result.ticker}
              onComplete={() => setIsLoading(false)}
            />
          )}
        </AnimatePresence>
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4"><div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Yahoo Finance · Equity consensus</p>
          <h2 id="consensus-company-title" className="mt-1 text-lg font-bold text-slate-900">{result.ticker} · {result.companyName}</h2>
          <p className="mt-1 text-xs text-slate-500">{result.sector} · {result.country || 'Country N/A'}</p>
        </div><button ref={closeButton} onClick={onClose} aria-label="Close consensus details" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 cursor-pointer"><X className="h-5 w-5" /></button></div>
        <div className="my-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div>Market price <strong className="ml-1 font-mono-code text-slate-900">{formatMatrixNumber(marketQuote?.price, marketQuote?.currency)}</strong></div>
          <div>Confirmed earnings date <strong>{result.reportDate || 'N/A'}</strong></div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{cards.map(([label, value, period]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
            <div className="mt-1 font-mono-code text-xl font-semibold text-slate-900">{value}</div><div className="mt-1 text-xs text-slate-500">Fiscal period end: {period}</div>
          </div>
        ))}</div>
        <div className="mt-4 space-y-2 rounded-xl border border-slate-200 p-4 text-xs text-slate-600">
          <p>Consensus source: {snapshot?.consensusCurrency && (Number.isFinite(snapshot.nextQuarterEps) || Number.isFinite(snapshot.nextQuarterRevenue)) ? `Yahoo Finance ${snapshot.isCachedSnapshot || snapshot.isProviderCache ? '(cached)' : '(live fetch)'} · ${snapshot.snapshotDate}` : 'N/A'}</p>
          <p>Reported source: {actual && (Number.isFinite(actual.eps) || Number.isFinite(actual.revenue)) ? `${actual.provider || 'Yahoo Finance Fundamentals Time Series'} ${actual.isCachedSnapshot ? '(cached)' : '(live fetch)'} · ${actual.snapshotDate}` : 'N/A'}</p>
          <p>Quote source: {marketQuote ? `${marketQuote.provider || 'Connected market feed'} · ${marketQuote.lastUpdated}` : 'N/A'}</p>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-slate-500">Revenue is shown in billions in the source currency. Forward analyst estimates and last reported results concern different periods and may use different EPS definitions. Missing values stay N/A; no beat or miss is calculated from these two columns.</p>
      </div>
    </div>
  );
}
