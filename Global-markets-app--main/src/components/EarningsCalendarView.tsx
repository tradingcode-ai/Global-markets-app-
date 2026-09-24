import React from 'react';
import { QuarterlyResult, LiveQuote } from '../types';
import { Clock, Bell, BellOff, ArrowUpRight, ArrowDownRight, Sparkles, ChevronRight, Activity } from 'lucide-react';
import { TECH_COMPANIES } from '../data/earningsData';
import { StockLogo } from './StockLogo';
import { MetricCards } from './MetricCards';

interface EarningsCalendarViewProps {
  results: QuarterlyResult[];
  subscribedTickers: string[];
  quotes: Record<string, LiveQuote>;
  onToggleSubscription: (ticker: string) => void;
  onSelectResult: (result: QuarterlyResult) => void;
  onGenerateAiMemo: (result: QuarterlyResult) => void;
}

export const EarningsCalendarView: React.FC<EarningsCalendarViewProps> = ({
  results,
  subscribedTickers,
  quotes,
  onToggleSubscription,
  onSelectResult,
  onGenerateAiMemo
}) => {
  const todayResults = results.filter(r => r.status === 'reporting_today');
  const upcomingResults = results.filter(r => r.status === 'upcoming').sort(
    (a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime()
  );
  const recentResults = results.filter(r => r.status === 'reported').sort(
    (a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
  );

  const renderCard = (item: QuarterlyResult) => {
    const meta = TECH_COMPANIES[item.ticker];
    const quote = quotes[item.ticker];
    const isSubscribed = subscribedTickers.includes(item.ticker);
    const isReported = item.status === 'reported' || item.status === 'reporting_today';

    const livePrice = quote?.price || meta?.currentPrice || 0;
    const curSym = quote?.currency === 'EUR' || item.currency === 'EUR' || ['ASML', 'SAP', 'PRX', 'SU', 'SIE', 'ADYEN', 'IFX', 'STM'].includes(item.ticker) ? '€' : '$';
    const liveChangePct = quote?.changePercent !== undefined ? quote.changePercent : (meta?.dayChangePercent || 0);
    const isPricePositive = liveChangePct >= 0;
    const liveChangeVal = quote?.change !== undefined 
      ? quote.change 
      : ((livePrice * (meta?.dayChangePercent || 0)) / 100);
    const formattedCurChg = `${isPricePositive ? '+' : '-'}${curSym}${Math.abs(liveChangeVal).toFixed(2)}`;

    return (
      <div 
        key={item.id}
        className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition duration-150 shadow-2xs"
      >
        <div>
          {/* Top Bar: Ticker, Price, Timing Badge */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5">
              <StockLogo ticker={item.ticker} size="lg" className="shrink-0" />
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold font-mono-code text-slate-900 text-sm">{item.ticker}</span>
                  <span className="text-xs text-slate-700 font-mono-code font-semibold">
                    {curSym}{livePrice.toFixed(2)}
                  </span>
                  <span className={`text-[10px] font-mono-code font-bold px-1.5 py-0.2 rounded-full inline-flex items-center gap-1 ${
                    isPricePositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    <span>{formattedCurChg}</span>
                    <span className="opacity-80">({isPricePositive ? '+' : ''}{liveChangePct.toFixed(2)}%)</span>
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium truncate max-w-[150px]">
                  {item.companyName}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold ${
                item.reportTime === 'BMO' 
                  ? 'bg-blue-50 text-blue-800 border border-blue-200' 
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                {item.reportTime} ({item.reportTime === 'BMO' ? 'Pre-Mkt' : 'Post-Mkt'})
              </span>
              <button
                onClick={() => onToggleSubscription(item.ticker)}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  isSubscribed 
                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' 
                    : 'text-slate-400 hover:text-slate-600 bg-slate-50 border border-slate-200'
                }`}
                title={isSubscribed ? 'Push alert active' : 'Click to enable push notification'}
              >
                {isSubscribed ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Date & Quarter */}
          <div className="text-xs text-slate-500 flex items-center justify-between border-y border-slate-100 py-2 my-2.5">
            <span className="font-mono-code text-slate-800 font-semibold">{item.reportDate}</span>
            <span className="font-medium">{item.quarter}</span>
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <Clock className="w-3 h-3 text-slate-400" />
              {item.conferenceCallTime || 'Call TBA'}
            </span>
          </div>

          {/* Estimates vs Actuals */}
          <div className="grid grid-cols-2 gap-2 my-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-medium">EPS</span>
              {isReported ? (
                <div className="font-mono-code">
                  <span className={`font-bold ${((item.epsActual ?? 0) >= item.epsEstimate) ? 'text-emerald-700' : 'text-rose-700'}`}>
                    ${item.epsActual?.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500 ml-1">vs ${item.epsEstimate.toFixed(2)}</span>
                </div>
              ) : (
                <div className="font-mono-code font-bold text-slate-800">
                  Est. ${item.epsEstimate.toFixed(2)}
                </div>
              )}
            </div>

            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-medium">Revenue</span>
              {isReported ? (
                <div className="font-mono-code">
                  <span className={`font-bold ${((item.revenueActual ?? 0) >= item.revenueEstimate) ? 'text-slate-900' : 'text-rose-700'}`}>
                    ${item.revenueActual?.toFixed(2)}B
                  </span>
                  <span className="text-[10px] text-slate-500 ml-1">vs ${item.revenueEstimate.toFixed(2)}B</span>
                </div>
              ) : (
                <div className="font-mono-code font-bold text-slate-800">
                  Est. ${item.revenueEstimate.toFixed(2)}B
                </div>
              )}
            </div>
          </div>

          {/* Guidance / Status Tag */}
          <div className="text-[11px] text-slate-600 line-clamp-2 my-2">
            {item.guidanceSummary || item.keyHighlights?.[0] || 'Awaiting live 8-K disclosure.'}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 pt-3 mt-2 flex items-center justify-between">
          <button
            onClick={() => onGenerateAiMemo(item)}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-semibold cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Memo</span>
          </button>

          <button
            onClick={() => onSelectResult(item)}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer"
          >
            <span>Full Profile</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div id="corporate-calendar-view" className="space-y-6 mb-8">
      {/* 4 KPI Summary Cards (Moved here to the Earnings Calendar) */}
      <MetricCards results={results} />

      {/* Category: Today */}
      {todayResults.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <h3 className="text-sm font-bold text-slate-900 font-mono-code uppercase tracking-wider">
              Reporting Today (Q2/Q3 Cycle)
            </h3>
            <span className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full font-semibold">
              Live Release Window
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayResults.map(renderCard)}
          </div>
        </div>
      )}

      {/* Category: Upcoming Schedule */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <h3 className="text-sm font-bold text-slate-900 font-mono-code uppercase tracking-wider">
              Upcoming Tech Earnings Releases ({upcomingResults.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Chronological by report date
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcomingResults.map(renderCard)}
        </div>
      </div>

      {/* Category: Recently Reported */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h3 className="text-sm font-bold text-slate-900 font-mono-code uppercase tracking-wider">
              Recently Reported Filings ({recentResults.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Verified SEC figures & street surprises
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentResults.map(renderCard)}
        </div>
      </div>
    </div>
  );
};
