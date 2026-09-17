import React, { useState, useMemo } from 'react';
import { QuarterlyResult, LiveQuote } from '../types';
import { COMMODITIES_DATA } from '../data/commoditiesData';
import { TECH_COMPANIES } from '../data/earningsData';
import { StockLogo } from './StockLogo';
import { 
  Menu, 
  Layers, 
  ArrowDown, 
  ArrowUp, 
  ArrowUpDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  Bell, 
  BellOff, 
  ChevronRight, 
  ChevronDown,
  Info,
  Search,
  SlidersHorizontal,
  ExternalLink,
  Flame,
  Fuel,
  Coins,
  Cpu,
  Wheat,
  Building2,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { getStockTechnicalMetrics } from '../data/technicalData';

interface JPMorganTableViewProps {
  results: QuarterlyResult[];
  subscribedTickers: string[];
  quotes: Record<string, LiveQuote>;
  recentTicks: Record<string, 'up' | 'down'>;
  onToggleSubscription: (ticker: string) => void;
  onSelectResult: (result: QuarterlyResult) => void;
  onGenerateAiMemo: (result: QuarterlyResult) => void;
  onSelectCommodity?: (id: string) => void;
  onTriggerTechnicalAlert?: (ticker: string, currentPrice: number, dma200: number, high52: number, low52: number) => void;
}

type ViewMode = 'list' | 'grouped';
type SortField = 'name' | 'nav' | 'change' | 'aum';
type SortOrder = 'asc' | 'desc';

interface UnifiedAsset {
  id: string;
  ticker: string;
  name: string;
  assetClass: string;
  assetType: 'equity' | 'commodity';
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  asOfDate: string;
  aumOrMarketCap: string;
  aumNumeric: number;
  noteBadge?: string;
  quarterlyResult?: QuarterlyResult;
  commodityData?: typeof COMMODITIES_DATA[0];
  statusText?: string;
  exchange: string;
}

export const JPMorganTableView: React.FC<JPMorganTableViewProps> = ({
  results,
  subscribedTickers,
  quotes,
  recentTicks,
  onToggleSubscription,
  onSelectResult,
  onGenerateAiMemo,
  onSelectCommodity,
  onTriggerTechnicalAlert
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortField, setSortField] = useState<SortField>('aum');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedAssetClassFilter, setSelectedAssetClassFilter] = useState<string>('ALL');
  const [tableSearch, setTableSearch] = useState<string>('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Assemble unified list of Equities (US & EU Tech) + Commodities
  const allAssets: UnifiedAsset[] = useMemo(() => {
    const list: UnifiedAsset[] = [];

    // Equities
    results.forEach((r) => {
      const meta = TECH_COMPANIES[r.ticker];
      const q = quotes[r.ticker];
      const price = q ? q.price : (meta?.currentPrice || 0);
      const chg = q ? q.change : (meta ? (meta.currentPrice * meta.dayChangePercent) / 100 : 0);
      const chgPct = q ? q.changePercent : (meta?.dayChangePercent || 0);
      const isEU = ['ASML', 'SAP', 'ARM', 'PRX', 'SU', 'SIE', 'SPOT', 'ADYEN', 'IFX', 'STM'].includes(r.ticker);
      
      let assetClass = 'US Mega-Cap Technology';
      if (r.sector === 'U.S. Financials' || meta?.sector === 'U.S. Financials') {
        assetClass = 'U.S. Financials';
      } else if (r.sector === 'European Financials' || meta?.sector === 'European Financials') {
        assetClass = 'European Financials';
      } else if (isEU) {
        assetClass = 'European Tech Champions';
      }

      let currency = r.currency || 'USD';
      if (!r.currency) {
        if (assetClass === 'European Tech Champions' || ['ABN', 'ING', 'RABO', 'BNP', 'GLE', 'SX7P'].includes(r.ticker)) {
          currency = 'EUR';
        } else if (['BCS', 'BARC'].includes(r.ticker)) {
          currency = 'GBp';
        }
      }

      let note = 'NOTE';
      if (r.status === 'reporting_today') note = 'TODAY';
      else if (r.status === 'reported') note = (r.epsActual ?? 0) >= r.epsEstimate ? 'BEAT' : 'MISS';

      list.push({
        id: `equity-${r.ticker}`,
        ticker: r.ticker,
        name: r.companyName,
        assetClass,
        assetType: 'equity',
        price,
        change: chg,
        changePercent: chgPct,
        currency,
        asOfDate: '09/15/2026',
        aumOrMarketCap: meta?.marketCap || '$100B+',
        aumNumeric: parseFloat((meta?.marketCap || '100').replace(/[^0-9.]/g, '')) * (meta?.marketCap.includes('T') ? 1000 : 1),
        noteBadge: note,
        quarterlyResult: r,
        exchange: meta?.exchange || 'NASDAQ'
      });
    });

    // Commodities
    COMMODITIES_DATA.forEach((c) => {
      const q = quotes[c.symbol] || quotes[c.id.toUpperCase()];
      const price = q ? q.price : c.currentPrice;
      const chg = q ? q.change : c.change;
      const chgPct = q ? q.changePercent : c.changePercent;

      let noteBadge = 'NOTE';
      if (c.curveStructure === 'Backwardation') noteBadge = 'PROMPT';
      else if (c.category.includes('Energy')) noteBadge = 'ENERGY';

      list.push({
        id: `commodity-${c.id}`,
        ticker: c.symbol,
        name: c.name,
        assetClass: c.category,
        assetType: 'commodity',
        price,
        change: chg,
        changePercent: chgPct,
        currency: c.currency,
        asOfDate: '09/15/2026',
        aumOrMarketCap: c.volume || 'Active',
        aumNumeric: 500, // Normalized default rank weight
        noteBadge,
        commodityData: c,
        exchange: c.marketCode
      });
    });

    return list;
  }, [results, quotes]);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return allAssets.filter((item) => {
      const matchesClass = selectedAssetClassFilter === 'ALL' || item.assetClass === selectedAssetClassFilter;
      const matchesSearch = tableSearch.trim() === '' ||
        item.ticker.toLowerCase().includes(tableSearch.toLowerCase()) ||
        item.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
        item.assetClass.toLowerCase().includes(tableSearch.toLowerCase());
      return matchesClass && matchesSearch;
    });
  }, [allAssets, selectedAssetClassFilter, tableSearch]);

  // Sorted Assets
  const sortedAssets = useMemo(() => {
    return [...filteredAssets].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'nav') {
        comparison = a.price - b.price;
      } else if (sortField === 'change') {
        comparison = a.changePercent - b.changePercent;
      } else if (sortField === 'aum') {
        comparison = a.aumNumeric - b.aumNumeric;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredAssets, sortField, sortOrder]);

  // Grouped by Asset Class
  const groupedAssets = useMemo<Record<string, UnifiedAsset[]>>(() => {
    const groups: Record<string, UnifiedAsset[]> = {};
    sortedAssets.forEach((asset) => {
      if (!groups[asset.assetClass]) {
        groups[asset.assetClass] = [];
      }
      groups[asset.assetClass].push(asset);
    });
    return groups;
  }, [sortedAssets]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const toggleGroupCollapse = (groupName: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const getCurrencySymbol = (cur: string) => {
    if (cur === 'EUR') return '€';
    if (cur === 'GBp' || cur === 'GBP') return '£';
    if (cur === 'CNY') return '¥';
    return '$';
  };

  const assetClassesList = useMemo(() => {
    return Array.from(new Set(allAssets.map(a => a.assetClass)));
  }, [allAssets]);

  return (
    <div id="jpmorgan-table-container" className="bg-white border border-slate-200 shadow-2xs rounded-none sm:rounded-lg overflow-hidden mb-6">
      {/* 1. Global Markets and Research and Trading Desk Institutional Header */}
      <div className="bg-[#f7f8f9] border-b border-slate-200 px-4 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-900 tracking-wider uppercase font-mono-code">
              GLOBAL MARKETS AND RESEARCH AND TRADING DESK
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#002D62] text-white uppercase tracking-wider font-mono-code">
              MULTI-ASSET INSTITUTIONAL TERMINAL
            </span>
          </div>

          <div className="text-[11px] text-slate-500 font-mono-code hidden sm:block">
            AS OF: <strong className="text-slate-800">SEPTEMBER 15, 2026</strong> • REAL-TIME FEED CONNECTED
          </div>
        </div>

        {/* Global Markets Desk Subtitle & Stats */}
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span>Real-time coverage across <strong>{allAssets.length} instruments</strong></span>
          <span>•</span>
          <span>Asset Classes: <strong>U.S. Financials (Big 6 & Alts)</strong>, <strong>European Financials & STOXX 600</strong>, US & EU Tech Champions, Commodities</span>
        </div>

        {/* Progress / Segmented Indicator */}
        <div className="mt-2.5 w-full bg-slate-200 h-1 rounded-full overflow-hidden flex">
          <div className="bg-[#002D62] h-full w-1/4"></div>
          <div className="bg-[#005a9c] h-full w-1/4"></div>
          <div className="bg-[#0072ce] h-full w-1/4"></div>
          <div className="bg-[#2870ed] h-full w-1/4"></div>
        </div>
      </div>

      {/* 2. J.P. Morgan Dual View Mode Navigation (List View vs Group by Asset Class) */}
      <div className="border-b border-slate-200 px-4 pt-3 flex flex-wrap items-center justify-between gap-4 bg-white">
        <div className="flex items-center space-x-8">
          <button
            id="btn-jpm-list-view"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold transition cursor-pointer relative ${
              viewMode === 'list'
                ? 'text-slate-900 border-b-2 border-[#005a9c]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Menu className="w-4 h-4 text-slate-700" />
            <span>List View</span>
          </button>

          <button
            id="btn-jpm-grouped-view"
            onClick={() => setViewMode('grouped')}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold transition cursor-pointer relative ${
              viewMode === 'grouped'
                ? 'text-slate-900 border-b-2 border-[#005a9c]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4 text-slate-700" />
            <span>Group by Asset Class</span>
          </button>
        </div>

        {/* Quick Filter & Search Bar */}
        <div className="flex items-center gap-2 pb-2.5">
          <div className="relative w-48 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by name, ticker..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 text-xs border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:outline-none focus:border-[#005a9c] font-sans"
            />
          </div>

          <select
            value={selectedAssetClassFilter}
            onChange={(e) => setSelectedAssetClassFilter(e.target.value)}
            className="border border-slate-200 rounded-md py-1 px-2 text-xs bg-slate-50 text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Asset Classes ({allAssets.length})</option>
            {assetClassesList.map(ac => (
              <option key={ac} value={ac}>{ac}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Subheader: "78 Available Shareclasses" (Screenshot 1 Authentic Styling) */}
      <div className="px-4 py-3 bg-white text-xs font-medium text-slate-500 flex items-center justify-between border-b border-slate-100">
        <span>{sortedAssets.length} Available Securities & Benchmarks</span>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono-code">
          <span>CURRENCY CONVERTED TO BASE</span>
          <span>•</span>
          <span>NYC / LON DESK QUOTES</span>
        </div>
      </div>

      {/* 4. Table Header Row (J.P. Morgan Authentic Hairline 2-Column or Multi-Column Table) */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-t border-b border-slate-200 bg-white text-xs font-semibold text-slate-900 uppercase tracking-tight">
              <th 
                onClick={() => handleSort('name')}
                className="py-3.5 px-4 border-r border-slate-200 cursor-pointer hover:bg-slate-50 transition select-none w-1/2 lg:w-5/12"
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <span>FUND / SECURITY NAME</span>
                  {sortField === 'name' ? (
                    sortOrder === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-[#005a9c]" /> : <ArrowUp className="w-3.5 h-3.5 text-[#005a9c]" />
                  ) : (
                    <ArrowDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
                <div className="text-[11px] font-normal text-[#005a9c] lowercase tracking-normal mt-0.5">
                  sorted by Market Cap / AUM
                </div>
              </th>

              <th 
                onClick={() => handleSort('nav')}
                className="py-3.5 px-4 border-r border-slate-200 text-right cursor-pointer hover:bg-slate-50 transition select-none w-1/4 sm:w-2/12"
              >
                <div className="flex items-center justify-end gap-1.5 font-bold">
                  <span>NAV / PRICE ($)</span>
                  {sortField === 'nav' ? (
                    sortOrder === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-[#005a9c]" /> : <ArrowUp className="w-3.5 h-3.5 text-[#005a9c]" />
                  ) : (
                    <ArrowDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
                <div className="text-[11px] font-normal text-slate-400 lowercase tracking-normal mt-0.5">
                  as of 09/15/2026
                </div>
              </th>

              {/* 52-Week High/Low & 200 DMA Technical Header */}
              <th className="hidden sm:table-cell py-3.5 px-4 border-r border-slate-200 text-right w-3/12 lg:w-3/12 select-none">
                <div className="flex items-center justify-end gap-1 font-bold text-slate-900">
                  <span>52W HIGH/LOW & 200 DMA</span>
                </div>
                <div className="text-[11px] font-normal text-slate-400 mt-0.5">
                  technical range & dma alert
                </div>
              </th>

              <th 
                onClick={() => handleSort('change')}
                className="hidden md:table-cell py-3.5 px-4 border-r border-slate-200 text-right cursor-pointer hover:bg-slate-50 transition select-none w-2/12"
              >
                <div className="flex items-center justify-end gap-1 font-bold">
                  <span>1-DAY RETURN</span>
                  {sortField === 'change' && (
                    sortOrder === 'desc' ? <ArrowDown className="w-3 h-3 text-[#005a9c]" /> : <ArrowUp className="w-3 h-3 text-[#005a9c]" />
                  )}
                </div>
              </th>

              <th className="hidden lg:table-cell py-3.5 px-4 border-r border-slate-200 text-left w-2/12">
                <span className="font-bold">ASSET CLASS & EXCHANGE</span>
              </th>

              <th className="py-3.5 px-4 text-center w-28">
                <span className="font-bold">RESEARCH</span>
              </th>
            </tr>
          </thead>

          {/* LIST VIEW RENDERING */}
          {viewMode === 'list' && (
            <tbody className="divide-y divide-slate-200 bg-white">
              {sortedAssets.map((asset) => {
                const isPositive = asset.change >= 0;
                const isSubscribed = subscribedTickers.includes(asset.ticker);
                const isTickUp = recentTicks[asset.ticker] === 'up';
                const isTickDown = recentTicks[asset.ticker] === 'down';

                return (
                  <tr 
                    key={asset.id} 
                    className={`hover:bg-[#fbfcfd] transition-colors ${
                      isTickUp ? 'bg-emerald-50/50' : isTickDown ? 'bg-rose-50/50' : ''
                    }`}
                  >
                    {/* Column 1: Fund / Security Name (Screenshot 1 Authentic Layout) */}
                    <td className="py-3.5 px-4 border-r border-slate-200 align-middle">
                      <div className="flex items-center gap-2 flex-wrap">
                        {asset.assetType === 'equity' && (
                          <StockLogo ticker={asset.ticker} size="sm" />
                        )}
                        <span className="font-mono-code font-bold text-sm text-slate-900 tracking-tight">
                          {asset.ticker}
                        </span>

                        {/* Yellow / Amber NOTE badge (Screenshot 1 pill) */}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FDF3D8] text-[#855B00] border border-[#F3DE9D]">
                          {asset.noteBadge || 'NOTE'}
                        </span>

                        {/* Push alert bell for equities */}
                        {asset.assetType === 'equity' && (
                          <button
                            onClick={() => onToggleSubscription(asset.ticker)}
                            title={isSubscribed ? "Alerts enabled" : "Enable push notifications"}
                            className="text-slate-400 hover:text-emerald-700 transition cursor-pointer p-0.5"
                          >
                            {isSubscribed ? (
                              <Bell className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                            ) : (
                              <BellOff className="w-3.5 h-3.5 hover:text-slate-600" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Security Full Name in J.P. Morgan Link Blue */}
                      <button
                        onClick={() => {
                          if (asset.quarterlyResult) onSelectResult(asset.quarterlyResult);
                          else if (asset.commodityData && onSelectCommodity) onSelectCommodity(asset.commodityData.id);
                        }}
                        className="text-left font-medium text-sm text-[#0066CC] hover:underline mt-0.5 block truncate max-w-md cursor-pointer"
                      >
                        {asset.name}
                      </button>

                      <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                        {asset.exchange} • {asset.aumOrMarketCap}
                      </div>
                    </td>

                    {/* Column 2: NAV ($) (Dual-tier stack) */}
                    <td className="py-3.5 px-4 border-r border-slate-200 text-right align-middle font-mono-code">
                      <div className="text-sm font-bold text-slate-900">
                        {getCurrencySymbol(asset.currency)}{asset.price.toFixed(asset.price < 10 ? 2 : 2)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-sans">
                        {asset.asOfDate}
                      </div>
                      {/* Mobile inline technical indicators */}
                      {(() => {
                        const tech = getStockTechnicalMetrics(asset.ticker, asset.price, quotes[asset.ticker]);
                        return (
                          <div className="sm:hidden text-[10px] mt-1 text-slate-500 font-sans">
                            <div>200D: {getCurrencySymbol(asset.currency)}{tech.twoHundredDayAverage.toFixed(2)}</div>
                            {tech.belowTwoHundredDayAverage && (
                              <span className="text-amber-700 font-bold font-mono-code">&lt; 200 DMA</span>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    {/* Column 3: 52-Week High / Low & 200-Day Moving Average */}
                    <td className="hidden sm:table-cell py-3.5 px-4 border-r border-slate-200 text-right align-middle font-mono-code">
                      {(() => {
                        const curSym = getCurrencySymbol(asset.currency);
                        const tech = getStockTechnicalMetrics(asset.ticker, asset.price, quotes[asset.ticker]);

                        return (
                          <div className="flex flex-col items-end">
                            {/* 52W Range */}
                            <div className="text-xs text-slate-800 flex items-center gap-1 font-medium">
                              <span className="text-[10px] text-slate-400 uppercase font-sans">52W:</span>
                              <span className="font-bold text-slate-900">{curSym}{tech.fiftyTwoWeekLow.toFixed(2)}</span>
                              <span className="text-slate-300">-</span>
                              <span className="font-bold text-slate-900">{curSym}{tech.fiftyTwoWeekHigh.toFixed(2)}</span>
                            </div>

                            {/* 200 DMA */}
                            <div className="text-xs mt-0.5 text-slate-700 flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 uppercase font-sans">200 DMA:</span>
                              <span className="font-bold text-slate-900">{curSym}{tech.twoHundredDayAverage.toFixed(2)}</span>
                            </div>

                            {/* Technical Status Button / Warning Alert */}
                            <div className="mt-1">
                              {tech.belowTwoHundredDayAverage ? (
                                <button
                                  onClick={() => onTriggerTechnicalAlert?.(
                                    asset.ticker, 
                                    asset.price, 
                                    tech.twoHundredDayAverage, 
                                    tech.fiftyTwoWeekHigh, 
                                    tech.fiftyTwoWeekLow
                                  )}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300 text-[10px] font-bold hover:bg-amber-100 transition cursor-pointer shadow-2xs"
                                  title={`Warning: ${asset.ticker} ($${asset.price.toFixed(2)}) is below its 200 DMA ($${tech.twoHundredDayAverage.toFixed(2)}). Click to trigger institutional alert.`}
                                >
                                  <AlertTriangle className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                                  <span>BELOW 200 DMA ({tech.distanceFromTwoHundredDayPercent}%)</span>
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                                  <span>Above 200 DMA (+{tech.distanceFromTwoHundredDayPercent}%)</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Column 3: 1-Day Return */}
                    <td className="hidden md:table-cell py-3.5 px-4 border-r border-slate-200 text-right align-middle font-mono-code">
                      <div className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded ${
                        isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {isPositive ? '+' : ''}{asset.changePercent.toFixed(2)}%
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {isPositive ? '+' : ''}{getCurrencySymbol(asset.currency)}{asset.change.toFixed(2)}
                      </div>
                    </td>

                    {/* Column 4: Asset Class */}
                    <td className="hidden lg:table-cell py-3.5 px-4 border-r border-slate-200 align-middle">
                      <span className="text-xs font-medium text-slate-700 block truncate">
                        {asset.assetClass}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-mono-code">
                        {asset.assetType}
                      </span>
                    </td>

                    {/* Column 5: Research Action */}
                    <td className="py-3.5 px-4 text-center align-middle">
                      {asset.quarterlyResult ? (
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {asset.quarterlyResult.analystOutlooks && asset.quarterlyResult.analystOutlooks.length > 0 && (
                            <button
                              onClick={() => onSelectResult(asset.quarterlyResult!)}
                              title="View Investment Bank Analyst Outlooks"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 hover:bg-[#005a9c] hover:text-white text-blue-700 text-xs font-semibold transition cursor-pointer border border-blue-200"
                            >
                              <TrendingUp className="w-3 h-3" />
                              <span>Outlook</span>
                            </button>
                          )}
                          {asset.quarterlyResult.isBankingIndex && (
                            <button
                              onClick={() => onSelectResult(asset.quarterlyResult!)}
                              title="View STOXX 600 Banks Macro Metrics"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-sky-50 hover:bg-sky-700 hover:text-white text-sky-800 text-xs font-semibold transition cursor-pointer border border-sky-200"
                            >
                              <span>Macro</span>
                            </button>
                          )}
                          <button
                            onClick={() => onGenerateAiMemo(asset.quarterlyResult!)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-[#005a9c] hover:text-white text-slate-700 text-xs font-semibold transition cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Memo</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => asset.commodityData && onSelectCommodity && onSelectCommodity(asset.commodityData.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-900 text-xs font-semibold transition cursor-pointer"
                        >
                          <span>Desk</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          )}

          {/* GROUP BY ASSET CLASS VIEW RENDERING */}
          {viewMode === 'grouped' && (
            <tbody className="divide-y divide-slate-200 bg-white">
              {(Object.entries(groupedAssets) as [string, UnifiedAsset[]][]).map(([groupName, items]) => {
                const isCollapsed = !!collapsedGroups[groupName];

                return (
                  <React.Fragment key={groupName}>
                    {/* Asset Class Group Header Bar */}
                    <tr className="bg-[#f0f4f8] border-t-2 border-b border-slate-300">
                      <td colSpan={6} className="py-2.5 px-4">
                        <button
                          onClick={() => toggleGroupCollapse(groupName)}
                          className="flex items-center justify-between w-full text-left cursor-pointer"
                        >
                          <div className="flex items-center space-x-2.5">
                            <Building2 className="w-4 h-4 text-[#005a9c]" />
                            <span className="font-bold text-sm text-slate-900 tracking-tight font-mono-code uppercase">
                              {groupName}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-700 border border-slate-300">
                              {items.length} Shareclasses
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-slate-500 font-medium">
                            <span className="mr-1">{isCollapsed ? 'Expand' : 'Collapse'}</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                          </div>
                        </button>
                      </td>
                    </tr>

                    {/* Group Items */}
                    {!isCollapsed && items.map((asset) => {
                      const isPositive = asset.change >= 0;
                      const isSubscribed = subscribedTickers.includes(asset.ticker);

                      return (
                        <tr key={asset.id} className="hover:bg-[#fbfcfd] transition-colors">
                          <td className="py-3.5 px-4 border-r border-slate-200 align-middle pl-6">
                            <div className="flex items-center gap-2 flex-wrap">
                              {asset.assetType === 'equity' && (
                                <StockLogo ticker={asset.ticker} size="sm" />
                              )}
                              <span className="font-mono-code font-bold text-sm text-slate-900">
                                {asset.ticker}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FDF3D8] text-[#855B00] border border-[#F3DE9D]">
                                {asset.noteBadge || 'NOTE'}
                              </span>
                              {asset.assetType === 'equity' && (
                                <button
                                  onClick={() => onToggleSubscription(asset.ticker)}
                                  className="text-slate-400 hover:text-emerald-700 p-0.5 cursor-pointer"
                                >
                                  {isSubscribed ? <Bell className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" /> : <BellOff className="w-3.5 h-3.5" />}
                                </button>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                if (asset.quarterlyResult) onSelectResult(asset.quarterlyResult);
                                else if (asset.commodityData && onSelectCommodity) onSelectCommodity(asset.commodityData.id);
                              }}
                              className="text-left font-medium text-sm text-[#0066CC] hover:underline mt-0.5 block truncate max-w-md cursor-pointer"
                            >
                              {asset.name}
                            </button>
                            <div className="text-[11px] text-slate-400">
                              {asset.exchange} • {asset.aumOrMarketCap}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 border-r border-slate-200 text-right align-middle font-mono-code">
                            <div className="text-sm font-bold text-slate-900">
                              {getCurrencySymbol(asset.currency)}{asset.price.toFixed(asset.price < 10 ? 2 : 2)}
                            </div>
                            <div className="text-[11px] text-slate-400 font-sans">
                              {asset.asOfDate}
                            </div>
                            {/* Mobile inline technical indicator */}
                            {(() => {
                              const tech = getStockTechnicalMetrics(asset.ticker, asset.price, quotes[asset.ticker]);
                              return (
                                <div className="sm:hidden text-[10px] mt-1 text-slate-500 font-sans">
                                  <div>200D: {getCurrencySymbol(asset.currency)}{tech.twoHundredDayAverage.toFixed(2)}</div>
                                  {tech.belowTwoHundredDayAverage && (
                                    <span className="text-amber-700 font-bold font-mono-code">&lt; 200 DMA</span>
                                  )}
                                </div>
                              );
                            })()}
                          </td>

                          {/* Column 3: 52-Week High / Low & 200-Day Moving Average */}
                          <td className="hidden sm:table-cell py-3.5 px-4 border-r border-slate-200 text-right align-middle font-mono-code">
                            {(() => {
                              const curSym = getCurrencySymbol(asset.currency);
                              const tech = getStockTechnicalMetrics(asset.ticker, asset.price, quotes[asset.ticker]);

                              return (
                                <div className="flex flex-col items-end">
                                  {/* 52W Range */}
                                  <div className="text-xs text-slate-800 flex items-center gap-1 font-medium">
                                    <span className="text-[10px] text-slate-400 uppercase font-sans">52W:</span>
                                    <span className="font-bold text-slate-900">{curSym}{tech.fiftyTwoWeekLow.toFixed(2)}</span>
                                    <span className="text-slate-300">-</span>
                                    <span className="font-bold text-slate-900">{curSym}{tech.fiftyTwoWeekHigh.toFixed(2)}</span>
                                  </div>

                                  {/* 200 DMA */}
                                  <div className="text-xs mt-0.5 text-slate-700 flex items-center gap-1">
                                    <span className="text-[10px] text-slate-400 uppercase font-sans">200 DMA:</span>
                                    <span className="font-bold text-slate-900">{curSym}{tech.twoHundredDayAverage.toFixed(2)}</span>
                                  </div>

                                  {/* Technical Status Button / Warning Alert */}
                                  <div className="mt-1">
                                    {tech.belowTwoHundredDayAverage ? (
                                      <button
                                        onClick={() => onTriggerTechnicalAlert?.(
                                          asset.ticker, 
                                          asset.price, 
                                          tech.twoHundredDayAverage, 
                                          tech.fiftyTwoWeekHigh, 
                                          tech.fiftyTwoWeekLow
                                        )}
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300 text-[10px] font-bold hover:bg-amber-100 transition cursor-pointer shadow-2xs"
                                        title={`Warning: ${asset.ticker} ($${asset.price.toFixed(2)}) is below its 200 DMA ($${tech.twoHundredDayAverage.toFixed(2)}). Click to trigger institutional alert.`}
                                      >
                                        <AlertTriangle className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                                        <span>BELOW 200 DMA ({tech.distanceFromTwoHundredDayPercent}%)</span>
                                      </button>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                                        <span>Above 200 DMA (+{tech.distanceFromTwoHundredDayPercent}%)</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </td>

                          <td className="hidden md:table-cell py-3.5 px-4 border-r border-slate-200 text-right align-middle font-mono-code">
                            <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded ${
                              isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {isPositive ? '+' : ''}{asset.changePercent.toFixed(2)}%
                            </span>
                          </td>

                          <td className="hidden lg:table-cell py-3.5 px-4 border-r border-slate-200 align-middle">
                            <span className="text-xs text-slate-600">
                              {asset.exchange}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center align-middle">
                            {asset.quarterlyResult ? (
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                {asset.quarterlyResult.analystOutlooks && asset.quarterlyResult.analystOutlooks.length > 0 && (
                                  <button
                                    onClick={() => onSelectResult(asset.quarterlyResult!)}
                                    title="View Investment Bank Analyst Outlooks"
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 hover:bg-[#005a9c] hover:text-white text-blue-700 text-xs font-semibold transition cursor-pointer border border-blue-200"
                                  >
                                    <TrendingUp className="w-3 h-3" />
                                    <span>Outlook</span>
                                  </button>
                                )}
                                {asset.quarterlyResult.isBankingIndex && (
                                  <button
                                    onClick={() => onSelectResult(asset.quarterlyResult!)}
                                    title="View STOXX 600 Banks Macro Metrics"
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-sky-50 hover:bg-sky-700 hover:text-white text-sky-800 text-xs font-semibold transition cursor-pointer border border-sky-200"
                                  >
                                    <span>Macro</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => onGenerateAiMemo(asset.quarterlyResult!)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-[#005a9c] hover:text-white text-slate-700 text-xs font-semibold transition cursor-pointer"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  <span>Memo</span>
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => asset.commodityData && onSelectCommodity && onSelectCommodity(asset.commodityData.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-900 text-xs font-semibold cursor-pointer"
                              >
                                <span>Desk</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          )}
        </table>
      </div>

      {/* J.P. Morgan Table Footer Note */}
      <div className="p-4 bg-[#fbfcfd] border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#005a9c] shrink-0" />
          <span>
            <strong>Institutional Disclosure:</strong> NAV and intraday quotes are updated continuously. Past performance does not guarantee future results.
          </span>
        </div>
        <div className="font-mono-code text-[11px] text-slate-400">
          POWERED BY J.P. MORGAN ASSET INTELLIGENCE SCHEMA
        </div>
      </div>
    </div>
  );
};
