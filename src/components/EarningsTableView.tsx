import React, { useState } from 'react';
import { QuarterlyResult, LiveQuote } from '../types';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  Bell, 
  BellOff, 
  ChevronRight,
  ArrowUpDown,
  Activity
} from 'lucide-react';
import { TECH_COMPANIES } from '../data/earningsData';
import { StockLogo } from './StockLogo';
import { getStockTechnicalMetrics } from '../data/technicalData';
import { getMarketSessionInfo } from '../utils/marketSession';

interface EarningsTableViewProps {
  results: QuarterlyResult[];
  subscribedTickers: string[];
  quotes: Record<string, LiveQuote>;
  recentTicks: Record<string, 'up' | 'down'>;
  onToggleSubscription: (ticker: string) => void;
  onSelectResult: (result: QuarterlyResult) => void;
  onGenerateAiMemo: (result: QuarterlyResult) => void;
}

type SortField = 'date' | 'ticker' | 'epsSurprise' | 'revenue' | 'reaction' | 'livePrice';
type SortOrder = 'asc' | 'desc';

export const EarningsTableView: React.FC<EarningsTableViewProps> = ({
  results,
  subscribedTickers,
  quotes,
  recentTicks,
  onToggleSubscription,
  onSelectResult,
  onGenerateAiMemo
}) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [regionFilter, setRegionFilter] = useState<'ALL' | 'US' | 'Europe'>('ALL');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredByRegion = results.filter((item) => {
    const meta = TECH_COMPANIES[item.ticker];
    const companyRegion = item.region || meta?.region || (['ASML', 'SAP', 'ARM', 'PRX', 'SU', 'SIE', 'SPOT', 'ADYEN', 'IFX', 'STM'].includes(item.ticker) ? 'Europe' : 'US');
    if (regionFilter === 'ALL') return true;
    return companyRegion === regionFilter;
  });

  const sortedResults = [...filteredByRegion].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'date') {
      comparison = new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime();
    } else if (sortField === 'ticker') {
      comparison = a.ticker.localeCompare(b.ticker);
    } else if (sortField === 'epsSurprise') {
      comparison = (a.epsSurprisePercent || 0) - (b.epsSurprisePercent || 0);
    } else if (sortField === 'revenue') {
      comparison = (a.revenueActual || a.revenueEstimate) - (b.revenueActual || b.revenueEstimate);
    } else if (sortField === 'reaction') {
      comparison = (a.priceReactionPercent || 0) - (b.priceReactionPercent || 0);
    } else if (sortField === 'livePrice') {
      const priceA = quotes[a.ticker]?.price || 0;
      const priceB = quotes[b.ticker]?.price || 0;
      comparison = priceA - priceB;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const getGuidanceBadge = (rating: string) => {
    switch (rating) {
      case 'raised':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800">RAISED</span>;
      case 'lowered':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 border border-rose-200 text-rose-800">LOWERED</span>;
      case 'maintained':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 border border-slate-200 text-slate-700">MAINTAINED</span>;
      case 'mixed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 border border-amber-200 text-amber-800">MIXED</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-50 border border-slate-200 text-slate-500">PENDING</span>;
    }
  };

  const getCurrencySymbol = (item: QuarterlyResult, quote?: LiveQuote) => {
    if (quote?.currency === 'EUR' || item.currency === 'EUR') return '€';
    if (['ASML', 'SAP', 'PRX', 'SU', 'SIE', 'ADYEN', 'IFX', 'STM'].includes(item.ticker)) return '€';
    return '$';
  };

  return (
    <div id="corporate-table-container" className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden mb-6">
      {/* Table Control Header */}
      <div className="px-4 py-3.5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight font-mono-code flex items-center gap-2">
              <span>INSTITUTIONAL TECH EARNINGS MATRIX</span>
              <span className="text-xs font-normal text-slate-500 font-sans">
                ({sortedResults.length} tracked companies)
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Real-time quotes with verified regulatory filings & consensus models
            </p>
          </div>

          {/* Region Tabs */}
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              id="btn-region-all"
              onClick={() => setRegionFilter('ALL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                regionFilter === 'ALL'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Tech (22)
            </button>
            <button
              id="btn-region-us"
              onClick={() => setRegionFilter('US')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                regionFilter === 'US'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              US Megacap (12)
            </button>
            <button
              id="btn-region-europe"
              onClick={() => setRegionFilter('Europe')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                regionFilter === 'Europe'
                  ? 'bg-white text-blue-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              European Top 10 (10)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="hidden sm:inline text-slate-400">Sort by:</span>
          <button 
            onClick={() => handleSort('date')} 
            className={`px-2.5 py-1 rounded-md text-xs transition cursor-pointer ${
              sortField === 'date' ? 'bg-slate-200 text-slate-900 font-semibold' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            Report Date
          </button>
          <button 
            onClick={() => handleSort('livePrice')} 
            className={`px-2.5 py-1 rounded-md text-xs transition cursor-pointer ${
              sortField === 'livePrice' ? 'bg-slate-200 text-slate-900 font-semibold' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            Live Price
          </button>
          <button 
            onClick={() => handleSort('epsSurprise')} 
            className={`px-2.5 py-1 rounded-md text-xs transition cursor-pointer ${
              sortField === 'epsSurprise' ? 'bg-slate-200 text-slate-900 font-semibold' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            Surprise %
          </button>
          <button 
            onClick={() => handleSort('reaction')} 
            className={`px-2.5 py-1 rounded-md text-xs transition cursor-pointer ${
              sortField === 'reaction' ? 'bg-slate-200 text-slate-900 font-semibold' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            Post-Release Move
          </button>
        </div>
      </div>

      {/* Dense Institutional Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-2.5 px-3.5">Ticker / Company</th>
              <th className="py-2.5 px-3 cursor-pointer hover:text-slate-900" onClick={() => handleSort('livePrice')}>
                <div className="flex items-center gap-1">
                  <span>Live Price / 24h</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:text-slate-900" onClick={() => handleSort('date')}>
                <div className="flex items-center gap-1">
                  <span>Report Date</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right">EPS (Cons / Act)</th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-900" onClick={() => handleSort('epsSurprise')}>
                <div className="flex items-center justify-end gap-1">
                  <span>EPS Surprise</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right">Revenue (Cons / Act)</th>
              <th className="py-2.5 px-3 text-right">YoY Rev</th>
              <th className="py-2.5 px-3 text-center">Guidance</th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-900" onClick={() => handleSort('reaction')}>
                <div className="flex items-center justify-end gap-1">
                  <span>Post Move</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-2 text-center">Push Alert</th>
              <th className="py-2.5 px-3 text-right">Analysis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedResults.map((item) => {
              const meta = TECH_COMPANIES[item.ticker];
              const quote = quotes[item.ticker];
              const isSubscribed = subscribedTickers.includes(item.ticker);
              const isReported = item.status === 'reported' || item.status === 'reporting_today';
              const epsBeaten = isReported && (item.epsActual ?? 0) >= item.epsEstimate;
              const revBeaten = isReported && (item.revenueActual ?? 0) >= item.revenueEstimate;
              const tick = recentTicks[item.ticker];

              // Live price calculations
              const livePrice = quote?.price || meta?.currentPrice || 0;
              const liveChangePct = quote?.changePercent !== undefined ? quote.changePercent : (meta?.dayChangePercent || 0);
              const isPricePositive = liveChangePct >= 0;
              const cur = getCurrencySymbol(item, quote);

              // Calculate intraday range slider position
              const dayLow = quote?.dayLow || livePrice * 0.99;
              const dayHigh = quote?.dayHigh || livePrice * 1.01;
              const rangeSpan = dayHigh - dayLow || 1;
              const rangePct = Math.min(100, Math.max(0, ((livePrice - dayLow) / rangeSpan) * 100));

              return (
                <tr 
                  key={item.id} 
                  className={`hover:bg-slate-50/90 transition duration-150 group ${
                    tick === 'up' ? 'tick-flash-up' : tick === 'down' ? 'tick-flash-down' : ''
                  }`}
                >
                  {/* Ticker & Name */}
                  <td className="py-3 px-3.5">
                    <div className="flex items-center gap-2.5">
                      <StockLogo ticker={item.ticker} size="lg" className="shrink-0" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onSelectResult(item)}
                            className="font-bold font-mono-code text-slate-900 hover:text-blue-600 transition cursor-pointer text-xs"
                          >
                            {item.ticker}
                          </button>
                          {meta?.country && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              {meta.country === 'Netherlands' ? '🇳🇱 NL' :
                               meta.country === 'Germany' ? '🇩🇪 DE' :
                               meta.country === 'United Kingdom' ? '🇬🇧 UK' :
                               meta.country === 'France' ? '🇫🇷 FR' :
                               meta.country === 'Sweden' ? '🇸🇪 SE' :
                               meta.country === 'Switzerland' ? '🇨🇭 CH' : '🇺🇸 US'}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 font-mono-code">
                            {meta?.sector.replace(' & ', '/')}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[130px] sm:max-w-[160px]">
                          {item.companyName}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Real-Time Price & Intraday Range */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {(() => {
                      const session = getMarketSessionInfo(item.ticker, quote);
                      const showPrePost = !session.isMarketOpen && session.prePostChangePercent !== undefined;
                      const liveChangeVal = quote?.change !== undefined 
                        ? quote.change 
                        : ((livePrice * (meta?.dayChangePercent || 0)) / 100);
                      const formattedCurChg = `${isPricePositive ? '+' : '-'}${cur}${Math.abs(liveChangeVal).toFixed(2)}`;

                      return (
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold font-mono-code text-slate-900 tabular-nums">
                              {cur}{livePrice.toFixed(2)}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono-code ${
                              isPricePositive 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              <span>{formattedCurChg}</span>
                              <span className="text-[9px] opacity-80">({isPricePositive ? '+' : ''}{liveChangePct.toFixed(2)}%)</span>
                            </span>

                            {/* Pre/After-Market Rate (Disappears when the market of that stock is open) */}
                            {showPrePost && (
                              <span 
                                className={`inline-flex items-center gap-0.5 text-[9px] font-mono-code font-semibold px-1 py-0.2 rounded border ${
                                  session.prePostChangePercent! >= 0 
                                    ? 'bg-emerald-50/70 text-emerald-700 border-emerald-200' 
                                    : 'bg-rose-50/70 text-rose-700 border-rose-200'
                                }`}
                                title={`${session.sessionLabel}: ${session.prePostChangePercent! >= 0 ? '+' : ''}${session.prePostChangePercent!.toFixed(2)}% (${cur}${session.prePostPrice?.toFixed(2)})`}
                              >
                                <span className="text-[8px] uppercase text-slate-400 font-bold">
                                  {session.sessionLabel === 'Pre-Market' ? 'PRE' : 'POST'}
                                </span>
                                <span>
                                  {session.prePostChangePercent! >= 0 ? '+' : ''}{session.prePostChangePercent!.toFixed(2)}%
                                </span>
                              </span>
                            )}
                          </div>
                          {/* Range slider */}
                          <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-400 font-mono-code">
                            <span>L {cur}{dayLow.toFixed(1)}</span>
                            <div className="w-12 bg-slate-200 h-1 rounded-full overflow-hidden relative">
                              <div 
                                className="bg-slate-600 h-full rounded-full" 
                                style={{ width: `${rangePct}%` }}
                              />
                            </div>
                            <span>H {cur}{dayHigh.toFixed(1)}</span>
                          </div>

                          {/* 52W Range & 200 DMA Technical Metrics */}
                          {(() => {
                            const tech = getStockTechnicalMetrics(item.ticker, livePrice, quote);
                            return (
                              <div className="flex items-center gap-1.5 mt-1 text-[9px] font-mono-code">
                                <span className="text-slate-500" title={`52-Week Range: ${cur}${tech.fiftyTwoWeekLow.toFixed(1)} - ${cur}${tech.fiftyTwoWeekHigh.toFixed(1)}`}>
                                  52W: {cur}{tech.fiftyTwoWeekLow.toFixed(0)}-{cur}{tech.fiftyTwoWeekHigh.toFixed(0)}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span 
                                  className={`font-semibold ${tech.belowTwoHundredDayAverage ? 'text-amber-700 font-bold' : 'text-slate-600'}`}
                                  title={`200-Day Moving Average (${tech.provider}): ${cur}${tech.twoHundredDayAverage.toFixed(2)}`}
                                >
                                  200D: {cur}{tech.twoHundredDayAverage.toFixed(1)}
                                  {tech.belowTwoHundredDayAverage && ' ⚠️'}
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })()}
                  </td>

                  {/* Report Date & Timing */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono-code tabular-nums text-slate-800 font-medium">
                        {item.reportDate}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono-code font-semibold ${
                        item.reportTime === 'AMC' 
                          ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}>
                        {item.reportTime}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {item.quarter} • {item.conferenceCallTime || 'Call TBA'}
                    </div>
                  </td>

                  {/* EPS Consensus vs Actual */}
                  <td className="py-3 px-3 text-right font-mono-code tabular-nums whitespace-nowrap">
                    {isReported ? (
                      <div>
                        <span className={`font-bold ${epsBeaten ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {cur}{item.epsActual?.toFixed(2)}
                        </span>
                        <span className="text-slate-500 text-[11px]"> / {cur}{item.epsEstimate.toFixed(2)}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500">
                        Est. {cur}{item.epsEstimate.toFixed(2)}
                      </span>
                    )}
                  </td>

                  {/* EPS Surprise */}
                  <td className="py-3 px-3 text-right font-mono-code tabular-nums whitespace-nowrap">
                    {isReported && item.epsSurprisePercent !== undefined ? (
                      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        item.epsSurprisePercent >= 0 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {item.epsSurprisePercent >= 0 ? '+' : ''}{item.epsSurprisePercent.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Revenue Consensus vs Actual */}
                  <td className="py-3 px-3 text-right font-mono-code tabular-nums whitespace-nowrap">
                    {isReported ? (
                      <div>
                        <span className={`font-bold ${revBeaten ? 'text-slate-900' : 'text-rose-700'}`}>
                          {cur}{item.revenueActual?.toFixed(2)}B
                        </span>
                        <span className="text-slate-500 text-[11px]"> / {cur}{item.revenueEstimate.toFixed(2)}B</span>
                      </div>
                    ) : (
                      <span className="text-slate-500">
                        Est. {cur}{item.revenueEstimate.toFixed(2)}B
                      </span>
                    )}
                  </td>

                  {/* YoY Revenue Growth */}
                  <td className="py-3 px-3 text-right font-mono-code tabular-nums whitespace-nowrap">
                    {item.revenueYoY !== undefined ? (
                      <span className={item.revenueYoY >= 15 ? 'text-emerald-700 font-semibold' : 'text-slate-700'}>
                        +{item.revenueYoY.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Guidance */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    {getGuidanceBadge(item.guidanceRating)}
                  </td>

                  {/* Market Reaction */}
                  <td className="py-3 px-3 text-right font-mono-code tabular-nums whitespace-nowrap">
                    {item.priceReactionPercent !== undefined ? (
                      <span className={`inline-flex items-center gap-0.5 font-bold ${
                        item.priceReactionPercent >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {item.priceReactionPercent >= 0 ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {item.priceReactionPercent >= 0 ? '+' : ''}{item.priceReactionPercent.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">Unreported</span>
                    )}
                  </td>

                  {/* Push Alert Subscription toggle */}
                  <td className="py-3 px-2 text-center whitespace-nowrap">
                    <button
                      id={`btn-sub-${item.ticker.toLowerCase()}`}
                      onClick={() => onToggleSubscription(item.ticker)}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        isSubscribed 
                          ? 'text-emerald-700 hover:text-emerald-800 bg-emerald-50 border border-emerald-200' 
                          : 'text-slate-400 hover:text-slate-600 bg-slate-50 border border-slate-200'
                      }`}
                      title={isSubscribed ? `Subscribed to ${item.ticker} push alerts (Click to unsubscribe)` : `Subscribe to ${item.ticker} push alerts`}
                    >
                      {isSubscribed ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                    </button>
                  </td>

                  {/* Institutional Actions */}
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        id={`btn-ai-memo-${item.ticker.toLowerCase()}`}
                        onClick={() => onGenerateAiMemo(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-medium transition cursor-pointer"
                        title="Generate Institutional AI Earnings Memo via Gemini"
                      >
                        <Sparkles className="w-3 h-3 text-blue-600" />
                        <span>AI Memo</span>
                      </button>

                      <button
                        id={`btn-detail-${item.ticker.toLowerCase()}`}
                        onClick={() => onSelectResult(item)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                        title="View Full Corporate Breakdown"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
