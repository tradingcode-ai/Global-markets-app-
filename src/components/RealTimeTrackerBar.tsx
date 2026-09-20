import React, { useState } from 'react';
import { LiveQuote } from '../types';
import { StockLogo } from './StockLogo';
import { getStockTechnicalMetrics } from '../data/technicalData';
import { getMarketSessionInfo } from '../utils/marketSession';
import { SHOVEL_SELLERS_COMPANIES } from '../data/shovelSellersData';
import { TECH_COMPANIES } from '../data/earningsData';
import { COMMODITIES_DATA } from '../data/commoditiesData';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Play, 
  Pause, 
  AlertTriangle,
  Flame,
  MoveHorizontal,
  Landmark
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

// 1. All 34 Shovel Sellers Tickers
const SHOVEL_SELLER_TICKERS = Object.keys(SHOVEL_SELLERS_COMPANIES);

// 2. US Tech Mega-Caps
const US_TECH_TICKERS = [
  'NVDA', 'MSFT', 'AAPL', 'GOOGL', 'AMZN', 'META', 
  'TSM', 'AVGO', 'ORCL', 'AMD', 'CRM', 'NFLX'
];

// 3. European Tech Champions
const EU_TECH_TICKERS = [
  'ASML', 'SAP', 'ARM', 'PRX', 'SU', 'SIE', 'SPOT', 'ADYEN', 'IFX', 'STM'
];

// 4. US Financials
const US_FINANCIAL_TICKERS = [
  'JPM', 'BAC', 'C', 'WFC', 'MS', 'GS', 'BX', 'KKR', 'APO', 'ARES'
];

// 5. European Financials
const EU_FINANCIAL_TICKERS = [
  'BCS', 'BARC', 'HSBC', 'ABN', 'ING', 'RABO', 'BNP', 'GLE', 'UBS', 'SAN', 'BBVA', 'SX7P'
];

// 6. Global Energy & Industrial Commodities
const COMMODITY_TICKERS = [
  'TTF', 'NG', 'JKM', 'WTI', 'BRENT', 'MURBAN', 'INE-SC', 
  'RBOB', 'HO', 'GOLD', 'SILVER', 'COPPER', 'URANIUM', 'LITHIUM', 'WHEAT', 'CORN'
];

// 7. Sovereign Benchmark Government Yields
const GOV_BOND_TICKERS = [
  'US10Y', 'US2Y', 'US30Y', 'DE10Y', 'DE30Y', 'GB10Y', 'FR10Y', 'IT10Y'
];

// All tickers across the application, deduplicated while preserving logical ordering
const ALL_APPLICATION_TICKERS = Array.from(new Set([
  ...US_TECH_TICKERS,
  ...SHOVEL_SELLER_TICKERS,
  ...EU_TECH_TICKERS,
  ...US_FINANCIAL_TICKERS,
  ...EU_FINANCIAL_TICKERS,
  ...COMMODITY_TICKERS,
  ...GOV_BOND_TICKERS
]));

type CategoryFilter = 'ALL' | 'SHOVEL_SELLERS' | 'US_TECH' | 'US_FIN' | 'EU_FIN' | 'EU_TECH' | 'COMMODITIES' | 'BONDS';

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
  const [isGliding, setIsGliding] = useState<boolean>(true);
  const [glideSpeed, setGlideSpeed] = useState<'normal' | 'slow'>('normal');

  const formattedTime = lastUpdated 
    ? lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  let displayedTickers: string[] = [];
  if (activeCategory === 'SHOVEL_SELLERS') displayedTickers = SHOVEL_SELLER_TICKERS;
  else if (activeCategory === 'US_TECH') displayedTickers = US_TECH_TICKERS;
  else if (activeCategory === 'EU_TECH') displayedTickers = EU_TECH_TICKERS;
  else if (activeCategory === 'US_FIN') displayedTickers = US_FINANCIAL_TICKERS;
  else if (activeCategory === 'EU_FIN') displayedTickers = EU_FINANCIAL_TICKERS;
  else if (activeCategory === 'COMMODITIES') displayedTickers = COMMODITY_TICKERS;
  else if (activeCategory === 'BONDS') displayedTickers = GOV_BOND_TICKERS;
  else displayedTickers = ALL_APPLICATION_TICKERS;

  // For continuous seamless marquee loop, double the list when gliding
  const marqueeItems = isGliding ? [...displayedTickers, ...displayedTickers] : displayedTickers;

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

              {/* Ticker Tape Glide Movement Control */}
              <button
                id="btn-toggle-glide"
                onClick={() => setIsGliding(!isGliding)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono-code transition cursor-pointer border ${
                  isGliding
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-semibold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
                title={isGliding ? 'Pause continuous exchange ticker glide' : 'Start smooth continuous exchange ticker glide'}
              >
                <MoveHorizontal className={`w-3 h-3 ${isGliding ? 'animate-pulse text-emerald-400' : ''}`} />
                <span>{isGliding ? 'TICKER MOVING' : 'TICKER STATIC'}</span>
              </button>

              {isGliding && (
                <button
                  onClick={() => setGlideSpeed(glideSpeed === 'normal' ? 'slow' : 'normal')}
                  className="px-1.5 py-1 rounded text-[9px] font-mono-code text-slate-500 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer"
                  title="Toggle ticker glide speed"
                >
                  {glideSpeed === 'normal' ? '1x SPEED' : '0.7x SLOW'}
                </button>
              )}
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
              ALL ({ALL_APPLICATION_TICKERS.length})
            </button>
            <button
              onClick={() => setActiveCategory('SHOVEL_SELLERS')}
              className={`px-2 py-1 rounded transition cursor-pointer whitespace-nowrap font-medium ${
                activeCategory === 'SHOVEL_SELLERS' ? 'bg-amber-800 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="All 34 Indispensable Semiconductor & AI Infrastructure Shovel Sellers"
            >
              SHOVEL SELLERS ({SHOVEL_SELLER_TICKERS.length})
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
              US FIN ({US_FINANCIAL_TICKERS.length})
            </button>
            <button
              onClick={() => setActiveCategory('EU_FIN')}
              className={`px-2 py-1 rounded transition cursor-pointer whitespace-nowrap font-medium ${
                activeCategory === 'EU_FIN' ? 'bg-blue-800 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EU FIN ({EU_FINANCIAL_TICKERS.length})
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
                activeCategory === 'COMMODITIES' ? 'bg-emerald-800 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              COMMODITIES ({COMMODITY_TICKERS.length})
            </button>
            <button
              onClick={() => setActiveCategory('BONDS')}
              className={`px-2 py-1 rounded transition cursor-pointer whitespace-nowrap font-medium ${
                activeCategory === 'BONDS' ? 'bg-purple-800 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              BONDS ({GOV_BOND_TICKERS.length})
            </button>
          </div>
        </div>
      </div>

      {/* LAYER 2: REAL-TIME CONTINUOUS MOVING TICKER RIBBON (EXCHANGE MARQUEE) */}
      <div className="px-4 lg:px-8 py-2.5 bg-white overflow-hidden relative group/ticker">
        {/* Soft edge fade masks for authentic ticker tape look */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />

        <div className="max-w-7xl mx-auto overflow-hidden">
          <div 
            className={`flex items-center gap-2.5 ${
              isGliding 
                ? (glideSpeed === 'slow' ? 'animate-ticker-glide-slow' : 'animate-ticker-glide') 
                : 'overflow-x-auto no-scrollbar scroll-smooth'
            }`}
            title={isGliding ? 'Hover to pause ticker glide' : ''}
          >
            {marqueeItems.map((sym, idx) => {
              // Retrieve live quote with instant fallback to company/commodity metadata so pills never disappear
              const q: LiveQuote | null = quotes[sym] || (() => {
                const meta = TECH_COMPANIES[sym] || (SHOVEL_SELLERS_COMPANIES as any)[sym];
                if (meta) {
                  const p = meta.currentPrice;
                  const chgPct = meta.dayChangePercent || 0;
                  const chg = (p * chgPct) / 100;
                  return {
                    symbol: sym,
                    price: p,
                    change: chg,
                    changePercent: chgPct,
                    dayHigh: meta.fiftyTwoWeekHigh || p * 1.05,
                    dayLow: meta.fiftyTwoWeekLow || p * 0.95,
                    volume: 12500000,
                    previousClose: p - chg,
                    currency: ['ASML', 'SAP', 'PRX', 'SU', 'SIE', 'ADYEN', 'IFX', 'STM', 'ABN', 'ING', 'BNP', 'GLE', 'SX7P'].includes(sym) ? 'EUR' : 'USD',
                    lastUpdated: new Date().toISOString(),
                    isLive: false,
                    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
                    fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
                    twoHundredDayAverage: meta.twoHundredDayAverage
                  };
                }
                const comm = COMMODITIES_DATA.find(c => c.symbol === sym);
                if (comm) {
                  return {
                    symbol: sym,
                    price: comm.currentPrice,
                    change: comm.change,
                    changePercent: comm.changePercent,
                    dayHigh: comm.dayHigh,
                    dayLow: comm.dayLow,
                    volume: 50000,
                    previousClose: comm.currentPrice - comm.change,
                    currency: comm.currency || 'USD',
                    lastUpdated: new Date().toISOString(),
                    isLive: false
                  };
                }
                return null;
              })();

              if (!q) return null;

              const tick = recentTicks[sym];
              const isPositive = q.change >= 0;
              const isFlashingUp = tick === 'up';
              const isFlashingDown = tick === 'down';
              const isCommodity = COMMODITY_TICKERS.includes(sym);
              const isBond = GOV_BOND_TICKERS.includes(sym);
              const curSym = isBond ? '' : q.currency === 'EUR' ? '€' : q.currency === 'CNY' ? '¥' : q.currency === 'GBp' ? 'p' : '$';
              const priceFormatted = isBond ? `${q.price.toFixed(3)}%` : `${curSym}${q.price.toFixed(2)}`;
              
              // Market Session & Pre/After-Market Calculation
              const session = (!isCommodity && !isBond) ? getMarketSessionInfo(sym, q) : null;
              const showPrePost = session && !session.isMarketOpen && session.prePostChangePercent !== undefined;

              // Technical check: below 200 DMA
              const tech = (!isCommodity && !isBond) ? getStockTechnicalMetrics(sym, q.price, q) : null;
              const isBelow200D = tech?.belowTwoHundredDayAverage;

              return (
                <button
                  key={`${sym}-${idx}`}
                  id={`ticker-pill-${sym.toLowerCase()}-${idx}`}
                  onClick={() => onSelectTicker(sym)}
                  className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-lg border text-xs font-mono-code transition cursor-pointer shrink-0 shadow-2xs hover:shadow-xs ${
                    isFlashingUp 
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-950 ring-1 ring-emerald-300' 
                      : isFlashingDown 
                      ? 'bg-rose-50 border-rose-400 text-rose-950 ring-1 ring-rose-300' 
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                  title={`${sym} - Click to inspect ${isCommodity ? 'commodity metrics' : isBond ? 'sovereign yield curve' : 'earnings, analyst outlook, and 200 DMA'}`}
                >
                  {/* Logo & Symbol */}
                  <span className="flex items-center space-x-1.5">
                    {!isCommodity && !isBond && <StockLogo ticker={sym} size="xs" />}
                    {isCommodity && <Flame className="w-3.5 h-3.5 text-amber-600" />}
                    {isBond && <Landmark className="w-3.5 h-3.5 text-purple-600" />}
                    <span className="font-bold tracking-tight text-slate-900">
                      {sym}
                    </span>
                  </span>

                  {/* Price / Yield */}
                  <span className="font-bold tabular-nums text-slate-900">
                    {priceFormatted}
                  </span>

                  {/* Percentage Rate of Price Change (Green for up, Red for down) */}
                  <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded ${
                    isPositive 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isPositive ? `+${q.changePercent.toFixed(2)}%` : `${q.changePercent.toFixed(2)}%`}
                  </span>

                  {/* Pre/After-Market Change (Disappears when the market is open) */}
                  {showPrePost && (
                    <span 
                      className={`inline-flex items-center gap-0.5 text-[9px] font-semibold tabular-nums px-1 py-0.5 rounded bg-slate-100 border border-slate-200 ${
                        session.prePostChangePercent! >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                      title={`${session.sessionLabel}: ${session.prePostChangePercent! >= 0 ? '+' : ''}${session.prePostChangePercent!.toFixed(2)}% ($${session.prePostPrice?.toFixed(2)})`}
                    >
                      <span className="text-[8px] uppercase text-slate-400 font-bold">
                        {session.sessionLabel === 'Pre-Market' ? 'PRE' : 'POST'}
                      </span>
                      <span>
                        {session.prePostChangePercent! >= 0 ? `+${session.prePostChangePercent!.toFixed(2)}%` : `${session.prePostChangePercent!.toFixed(2)}%`}
                      </span>
                    </span>
                  )}

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
    </div>
  );
};
