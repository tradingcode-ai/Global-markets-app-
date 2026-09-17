import React from 'react';
import { LiveQuote } from '../types';
import { StockLogo } from './StockLogo';
import { getStockTechnicalMetrics } from '../data/technicalData';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Play, 
  Pause, 
  AlertTriangle,
  Flame
} from 'lucide-react';

interface RealTimeTrackerBarProps {
  quotes: Record<string, LiveQuote>;
  isLoading: boolean;
  isStreaming: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
  onToggleStreaming: () => void;
  onSelectTicker: (ticker: string) => void;
  recentTicks: Record<string, 'up' | 'down'>;
}

const US_TECH_TICKERS = [
  'NVDA', 'MSFT', 'AAPL', 'GOOGL', 'AMZN', 'META', 
  'TSM', 'AVGO', 'ORCL', 'AMD', 'CRM', 'NFLX'
];

const EU_TECH_TICKERS = [
  'ASML', 'SAP', 'ARM', 'PRX', 'SU', 'SIE', 'SPOT', 'ADYEN', 'IFX', 'STM'
];

const US_FINANCIAL_TICKERS = [
  'JPM', 'BAC', 'C', 'WFC', 'MS', 'GS', 'BX', 'KKR', 'APO', 'ARES'
];

const EU_FINANCIAL_TICKERS = [
  'BCS', 'BARC', 'HSBC', 'ABN', 'ING', 'RABO', 'BNP', 'GLE', 'UBS', 'SAN', 'BBVA', 'SX7P'
];

const COMMODITY_TICKERS = [
  'TTF', 'NG', 'JKM', 'WTI', 'BRENT', 'MURBAN', 'INE-SC', 
  'RBOB', 'HO', 'GOLD', 'SILVER', 'COPPER', 'URANIUM', 'LITHIUM', 'WHEAT', 'CORN'
];

type CategoryFilter = 'ALL' | 'US_TECH' | 'EU_TECH' | 'US_FIN' | 'EU_FIN' | 'COMMODITIES';

export const RealTimeTrackerBar: React.FC<RealTimeTrackerBarProps> = ({
  quotes,
  isLoading,
  isStreaming,
  lastUpdated,
  onRefresh,
  onToggleStreaming,
  onSelectTicker,
  recentTicks
}) => {
  const [activeCategory, setActiveCategory] = React.useState<CategoryFilter>('ALL');

  const formattedTime = lastUpdated 
    ? lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  let displayedTickers: string[] = [];
  if (activeCategory === 'US_TECH') displayedTickers = US_TECH_TICKERS;
  else if (activeCategory === 'EU_TECH') displayedTickers = EU_TECH_TICKERS;
  else if (activeCategory === 'US_FIN') displayedTickers = US_FINANCIAL_TICKERS;
  else if (activeCategory === 'EU_FIN') displayedTickers = EU_FINANCIAL_TICKERS;
  else if (activeCategory === 'COMMODITIES') displayedTickers = COMMODITY_TICKERS;
  else displayedTickers = [
    ...US_TECH_TICKERS, 
    ...US_FINANCIAL_TICKERS, 
    ...EU_FINANCIAL_TICKERS, 
    ...EU_TECH_TICKERS, 
    ...COMMODITY_TICKERS
  ];

  return (
    <div 
      id="real-time-tracker-bar"
      className="bg-white border-b border-slate-200 text-slate-800 text-xs shadow-2xs relative z-10"
    >
      {/* LAYER 1: Controls, Live Clock, and Asset Class Categorization */}
      <div className="border-b border-slate-100 bg-slate-50/80 px-4 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Live Stream Status, Clock, and Control Buttons */}
          <div className="flex items-center space-x-2.5">
            <div className="flex items-center space-x-2 bg-white border border-slate-200 px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-700 shadow-2xs">
              <span className="relative flex h-2 w-2">
                {isStreaming && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isStreaming ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
              </span>
              <span className="font-bold tracking-wider text-slate-800 uppercase font-mono-code text-[10px]">
                {isStreaming ? 'LIVE TICKER FEED' : 'PAUSED'}
              </span>
              <span className="text-slate-300">|</span>
              <span className="font-mono-code tabular-nums text-slate-600 text-[10px] font-semibold">
                {formattedTime} ET
              </span>
            </div>

            <div className="flex items-center space-x-1">
              <button
                id="btn-refresh-quotes"
                onClick={onRefresh}
                disabled={isLoading}
                className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-white border border-transparent hover:border-slate-200 transition cursor-pointer disabled:opacity-50"
                title="Refresh All Quotes Now"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
              </button>

              <button
                id="btn-toggle-streaming"
                onClick={onToggleStreaming}
                className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-white border border-transparent hover:border-slate-200 transition cursor-pointer"
                title={isStreaming ? 'Pause auto-polling (every 8s)' : 'Resume real-time auto-polling'}
              >
                {isStreaming ? (
                  <Pause className="w-3.5 h-3.5 text-slate-600" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-emerald-600" />
                )}
              </button>
            </div>
          </div>

          {/* Right: Quick Segment Filter Tabs */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-[10px] font-mono-code overflow-x-auto">
            <button
              onClick={() => setActiveCategory('ALL')}
              className={`px-2.5 py-1 rounded transition cursor-pointer whitespace-nowrap font-medium ${
                activeCategory === 'ALL' ? 'bg-[#002D62] text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ALL ({displayedTickers.length})
            </button>
            <button
              onClick={() => setActiveCategory('US_TECH')}
              className={`px-2 py-1 rounded transition cursor-pointer whitespace-nowrap font-medium ${
                activeCategory === 'US_TECH' ? 'bg-[#005a9c] text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              US TECH ({US_TECH_TICKERS.length})
            </button>
            <button
              onClick={() => setActiveCategory('US_FIN')}
              className={`px-2 py-1 rounded transition cursor-pointer whitespace-nowrap font-medium ${
                activeCategory === 'US_FIN' ? 'bg-indigo-700 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              US FINANCIALS ({US_FINANCIAL_TICKERS.length})
            </button>
            <button
              onClick={() => setActiveCategory('EU_FIN')}
              className={`px-2 py-1 rounded transition cursor-pointer whitespace-nowrap font-medium ${
                activeCategory === 'EU_FIN' ? 'bg-blue-800 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EU FINANCIALS ({EU_FINANCIAL_TICKERS.length})
            </button>
            <button
              onClick={() => setActiveCategory('EU_TECH')}
              className={`px-2 py-1 rounded transition cursor-pointer whitespace-nowrap font-medium ${
                activeCategory === 'EU_TECH' ? 'bg-sky-700 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EU TECH ({EU_TECH_TICKERS.length})
            </button>
            <button
              onClick={() => setActiveCategory('COMMODITIES')}
              className={`px-2 py-1 rounded transition cursor-pointer whitespace-nowrap font-medium ${
                activeCategory === 'COMMODITIES' ? 'bg-amber-700 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              COMMODITIES ({COMMODITY_TICKERS.length})
            </button>
          </div>
        </div>
      </div>

      {/* LAYER 2: ONE LAYER DOWN - FULLY DISPLAYED HORIZONTAL TICKER RIBBON */}
      <div className="px-4 lg:px-8 py-2.5 bg-white">
        <div className="max-w-7xl mx-auto flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth">
          {displayedTickers.map((sym) => {
            const q = quotes[sym];
            const tick = recentTicks[sym];
            if (!q) return null;

            const isPositive = q.change >= 0;
            const isFlashingUp = tick === 'up';
            const isFlashingDown = tick === 'down';
            const curSym = q.currency === 'EUR' ? '€' : q.currency === 'CNY' ? '¥' : q.currency === 'GBp' ? 'p' : '$';
            const isCommodity = COMMODITY_TICKERS.includes(sym);
            
            // Technical check: below 200 DMA
            const tech = !isCommodity ? getStockTechnicalMetrics(sym, q.price, q) : null;
            const isBelow200D = tech?.belowTwoHundredDayAverage;

            return (
              <button
                key={sym}
                id={`ticker-pill-${sym.toLowerCase()}`}
                onClick={() => onSelectTicker(sym)}
                className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-lg border text-xs font-mono-code transition cursor-pointer shrink-0 shadow-2xs hover:shadow-xs ${
                  isFlashingUp 
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-950 ring-1 ring-emerald-300' 
                    : isFlashingDown 
                    ? 'bg-rose-50 border-rose-400 text-rose-950 ring-1 ring-rose-300' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                }`}
                title={`${sym} - Click to inspect ${isCommodity ? 'commodity metrics' : 'earnings, analyst outlook, and 200 DMA'}`}
              >
                {/* Logo & Symbol */}
                <span className="flex items-center space-x-1.5">
                  {!isCommodity && <StockLogo ticker={sym} size="xs" />}
                  {isCommodity && <Flame className="w-3.5 h-3.5 text-amber-600" />}
                  <span className="font-bold tracking-tight text-slate-900">
                    {sym}
                  </span>
                </span>

                {/* Price */}
                <span className="font-bold tabular-nums text-slate-900">
                  {curSym}{q.price.toFixed(2)}
                </span>

                {/* Return Badge */}
                <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded ${
                  isPositive 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isPositive ? `+${q.changePercent.toFixed(2)}%` : `${q.changePercent.toFixed(2)}%`}
                </span>

                {/* 200 DMA Technical Warning Pill */}
                {isBelow200D && (
                  <span 
                    title={`Warning: ${sym} ($${q.price.toFixed(2)}) is trading below its 200 DMA ($${tech?.twoHundredDayAverage.toFixed(2)})`}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-bold"
                  >
                    <AlertTriangle className="w-2.5 h-2.5 text-amber-700" />
                    <span>&lt;200D</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
