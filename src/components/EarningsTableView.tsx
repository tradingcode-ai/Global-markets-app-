import React, { useEffect, useMemo, useState } from 'react';
import { LiveQuote, QuarterlyResult } from '../types';
import { ArrowUpDown, Bell, BellOff, ChevronRight, RefreshCw, Search, X } from 'lucide-react';
import { StockLogo } from './StockLogo';
import { ConsensusMatrixRow, MatrixSortField, filterConsensusRows, formatMatrixNumber, getMatrixReportedFinancials, isFreshYahooSnapshot, sortConsensusRows } from '../utils/consensusMatrix';

interface EarningsTableViewProps {
  results: ConsensusMatrixRow[];
  subscribedTickers: string[];
  quotes: Record<string, LiveQuote>;
  recentTicks: Record<string, 'up' | 'down'>;
  onToggleSubscription: (ticker: string) => void;
  onSelectResult: (result: QuarterlyResult) => void;
  onGenerateAiMemo: (result: QuarterlyResult) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

function timestamp(value?: string): string {
  const date = new Date(value || '');
  return Number.isFinite(date.getTime()) ? date.toLocaleString('en-GB', { timeZone: 'UTC' }) + ' UTC' : 'N/A';
}

export const EarningsTableView: React.FC<EarningsTableViewProps> = ({
  results, subscribedTickers, quotes, recentTicks, onToggleSubscription, onSelectResult, onRefresh, isLoading = false
}) => {
  const [sortField, setSortField] = useState<MatrixSortField>('ticker');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [tableSearch, setTableSearch] = useState('');
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 60000); return () => window.clearInterval(timer); }, []);
  const sectors = useMemo(() => Array.from(new Set(results.map(row => row.matrixSector))).sort(), [results]);
  const sortedResults = useMemo(() => sortConsensusRows(filterConsensusRows(results, sectorFilter, tableSearch), sortField, sortOrder, quotes), [results, sectorFilter, tableSearch, sortField, sortOrder, quotes, now]);
  const coverage = results.filter(row => isFreshYahooSnapshot(row.quarterlyConsensus) && (Number.isFinite(row.quarterlyConsensus?.nextQuarterEps) || Number.isFinite(row.quarterlyConsensus?.nextQuarterRevenue))).length;
  const sort = (field: MatrixSortField) => { setSortField(field); setSortOrder(sortField === field && sortOrder === 'asc' ? 'desc' : 'asc'); };
  const heading = (title: string, field: MatrixSortField) => (
    <th className="px-3 py-3 whitespace-nowrap" aria-sort={sortField === field ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button onClick={() => sort(field)} className="inline-flex items-center gap-1 cursor-pointer hover:text-blue-700">{title}<ArrowUpDown className="h-3 w-3" /></button>
    </th>
  );
  return (
    <section id="corporate-table-container" className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-4">
        <div><h2 className="text-sm font-bold tracking-tight text-slate-900">EQUITY CONSENSUS MATRIX</h2>
          <p className="mt-1 text-xs text-slate-500">{sortedResults.length} of {results.length} instruments · {coverage} with Yahoo consensus</p>
          <p className="mt-1 text-xs text-slate-500">Forward estimates and latest reported results show their own fiscal periods and currencies. Revenue in billions.</p>
        </div>
        <button onClick={onRefresh} disabled={isLoading || !onRefresh} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 cursor-pointer disabled:opacity-50 disabled:cursor-wait">
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />{isLoading ? 'Updating Yahoo data…' : 'Refresh Yahoo data'}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3">
        <div className="relative min-w-[240px] max-w-md flex-1"><Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input aria-label="Search consensus matrix" placeholder="Search ticker, company, sector or country" value={tableSearch} onChange={event => setTableSearch(event.target.value)} className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-8 text-xs outline-none focus:border-blue-400" />
          {tableSearch && <button aria-label="Clear matrix search" onClick={() => setTableSearch('')} className="absolute right-2 top-2 cursor-pointer text-slate-400"><X className="h-4 w-4" /></button>}
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-600">Sector
          <select aria-label="Filter consensus matrix by sector" value={sectorFilter} onChange={event => setSectorFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800">
            <option value="ALL">All sectors ({results.length})</option>
            {sectors.map(sector => <option key={sector} value={sector}>{sector} ({results.filter(row => row.matrixSector === sector).length})</option>)}
          </select>
        </label>
        {(tableSearch || sectorFilter !== 'ALL') && <button onClick={() => { setTableSearch(''); setSectorFilter('ALL'); }} className="text-xs text-blue-700 cursor-pointer">Reset filters</button>}
      </div>
      <div className="overflow-x-auto"><table className="w-full border-collapse text-left text-xs">
        <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-600"><tr>
          {heading('Ticker / Company', 'ticker')}<th className="px-3 py-3">Sector</th>{heading('Market price', 'price')}{heading('Earnings date', 'date')}
          {heading('Forward EPS', 'eps')}{heading('Forward revenue', 'revenue')}<th className="px-3 py-3 whitespace-nowrap">Last reported EPS / revenue</th>
          <th className="px-3 py-3">Source / retrieved</th><th className="px-3 py-3">Alert</th><th className="px-3 py-3">Details</th>
        </tr></thead>
        <tbody className="divide-y divide-slate-100">{sortedResults.map(row => {
          const snapshot = isFreshYahooSnapshot(row.quarterlyConsensus, now) ? row.quarterlyConsensus : undefined;
          const actual = getMatrixReportedFinancials(snapshot, now);
          const quote = quotes[row.ticker]?.isLive === true ? quotes[row.ticker] : undefined;
          const cached = snapshot?.isCachedSnapshot || snapshot?.isProviderCache;
          const hasConsensus = snapshot?.consensusCurrency && (Number.isFinite(snapshot.nextQuarterEps) || Number.isFinite(snapshot.nextQuarterRevenue));
          const hasActual = actual && (Number.isFinite(actual.eps) || Number.isFinite(actual.revenue));
          const subscribed = subscribedTickers.includes(row.ticker);
          const period = snapshot?.consensusPeriodEnd || snapshot?.nextQuarterLabel || 'Period N/A';
          return (<tr key={row.ticker} className={`hover:bg-slate-50 ${recentTicks[row.ticker] === 'up' ? 'tick-flash-up' : recentTicks[row.ticker] === 'down' ? 'tick-flash-down' : ''}`}>
            <td className="px-3 py-3"><div className="flex items-center gap-2"><StockLogo ticker={row.ticker} size="lg" /><div>
              <button onClick={() => onSelectResult(row)} className="font-mono-code font-bold text-slate-900 hover:text-blue-700 cursor-pointer">{row.ticker}</button>
              <div className="max-w-[190px] text-[11px] text-slate-500">{row.companyName}</div><div className="text-[10px] text-slate-400">{row.country}</div>
            </div></div></td>
            <td className="px-3 py-3"><div className="font-medium text-slate-700">{row.matrixSector}</div><div className="text-[10px] text-slate-400">{row.subSector}</div></td>
            <td className="px-3 py-3 whitespace-nowrap font-mono-code"><div className="font-semibold">{formatMatrixNumber(quote?.price, quote?.currency)}</div>
              <div className={quote && quote.changePercent < 0 ? 'text-rose-600' : 'text-slate-500'}>{quote && Number.isFinite(quote.changePercent) ? `${quote.changePercent >= 0 ? '+' : ''}${quote.changePercent.toFixed(2)}%` : 'N/A'}</div>
              {quote && <div className="text-[9px] text-slate-400" title={timestamp(quote.lastUpdated)}>{quote.provider || 'Market quote'}</div>}
            </td>
            <td className="px-3 py-3 whitespace-nowrap"><div>{row.reportDate || 'N/A'}</div><div className="text-[10px] text-slate-400">{row.reportDate ? `${row.reportTime || ''} ${row.liveDateProvider || ''}` : 'No confirmed release date'}</div></td>
            <td className="px-3 py-3 whitespace-nowrap"><div className="font-mono-code font-semibold">{formatMatrixNumber(snapshot?.nextQuarterEps, snapshot?.consensusCurrency)}</div><div className="text-[10px] text-slate-400">{hasConsensus ? period : 'N/A'}</div></td>
            <td className="px-3 py-3 whitespace-nowrap"><div className="font-mono-code font-semibold">{formatMatrixNumber(snapshot?.nextQuarterRevenue, snapshot?.consensusCurrency, true)}</div><div className="text-[10px] text-slate-400">{hasConsensus ? period : 'N/A'}</div></td>
            <td className="px-3 py-3 whitespace-nowrap"><div className="font-mono-code">EPS {formatMatrixNumber(hasActual ? actual?.eps : undefined, actual?.currency)}</div>
              <div className="font-mono-code">Revenue {formatMatrixNumber(hasActual ? actual?.revenue : undefined, actual?.currency, true)}</div>
              <div className="text-[10px] text-slate-400">{hasActual ? `Period end ${actual?.fiscalDate} · reported EPS` : 'Yahoo reported data unavailable'}</div>
            </td>
            <td className="px-3 py-3 whitespace-nowrap text-[10px] text-slate-500"><div className={hasConsensus && !cached ? 'font-semibold text-emerald-700' : ''}>Consensus: {hasConsensus ? (cached ? 'Yahoo cached' : 'Yahoo live') : 'N/A'}</div>
              {hasConsensus && <div>{timestamp(snapshot?.snapshotDate)}</div>}<div className="mt-1">Reported: {hasActual ? (actual?.isCachedSnapshot ? 'Yahoo cached' : 'Yahoo live') : 'N/A'}</div>{hasActual && <div>{timestamp(actual?.snapshotDate)}</div>}
            </td>
            <td className="px-3 py-3"><button aria-label={`${subscribed ? 'Unsubscribe' : 'Subscribe'} ${row.ticker} alerts`} onClick={() => onToggleSubscription(row.ticker)} className={`rounded-lg border p-1.5 cursor-pointer ${subscribed ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-400'}`}>{subscribed ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}</button></td>
            <td className="px-3 py-3"><button aria-label={`View ${row.ticker} details`} onClick={() => onSelectResult(row)} className="rounded p-1 text-slate-500 hover:text-blue-700 cursor-pointer"><ChevronRight className="h-4 w-4" /></button></td>
          </tr>);
        })}
        {sortedResults.length === 0 && <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-500">No instruments match these filters. Try a different ticker or reset the filters.</td></tr>}
        </tbody>
      </table></div>
      <p className="border-t border-slate-200 px-4 py-3 text-[10px] text-slate-500">Yahoo snapshots expire after 12 hours. Missing data stays N/A. Forward consensus may use adjusted EPS; reported EPS can use a different basis, so these periods are not used to calculate a beat or miss. Sorting uses the displayed native-currency values.</p>
    </section>
  );
};
