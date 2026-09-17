import React, { useState, useMemo } from 'react';
import { CommodityItem, BankOutlook, LiveQuote, CommodityCategory } from '../types';
import { COMMODITIES_DATA } from '../data/commoditiesData';
import { 
  Fuel, 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight, 
  BarChart3, 
  RefreshCw,
  Globe2,
  Info,
  SlidersHorizontal,
  Flame,
  Zap,
  Coins,
  Cpu,
  Wheat,
  Search,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

interface CommoditiesSectionProps {
  quotes: Record<string, LiveQuote>;
  recentTicks: Record<string, 'up' | 'down'>;
  onRefreshQuotes: () => void;
  isLoadingQuotes: boolean;
}

const CATEGORY_ICONS: Record<CommodityCategory, React.ReactNode> = {
  'Energy & Natural Gas': <Flame className="w-3.5 h-3.5 text-amber-500" />,
  'Crude Oil & Refined': <Fuel className="w-3.5 h-3.5 text-orange-500" />,
  'Precious Metals': <Coins className="w-3.5 h-3.5 text-yellow-500" />,
  'Industrial & Battery Metals': <Cpu className="w-3.5 h-3.5 text-blue-500" />,
  'Agricultural & Softs': <Wheat className="w-3.5 h-3.5 text-emerald-500" />
};

export const CommoditiesSection: React.FC<CommoditiesSectionProps> = ({
  quotes,
  recentTicks,
  onRefreshQuotes,
  isLoadingQuotes
}) => {
  const [selectedCommodityId, setSelectedCommodityId] = useState<string>('dutch-ttf');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBankFilter, setSelectedBankFilter] = useState<string>('ALL');
  const [selectedStanceFilter, setSelectedStanceFilter] = useState<string>('ALL');
  const [showSynthesisModal, setShowSynthesisModal] = useState<boolean>(false);
  const [synthesisReport, setSynthesisReport] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);

  // Filtered commodities list based on search and category
  const filteredCommodities = useMemo(() => {
    return COMMODITIES_DATA.filter(item => {
      const matchesCategory = activeCategoryFilter === 'ALL' || item.category === activeCategoryFilter;
      const matchesSearch = searchQuery === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.marketCode.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategoryFilter, searchQuery]);

  const selectedCommodity = useMemo(() => {
    return COMMODITIES_DATA.find(c => c.id === selectedCommodityId) || filteredCommodities[0] || COMMODITIES_DATA[0];
  }, [selectedCommodityId, filteredCommodities]);

  // Map commodity symbol to live quote key if present
  const quoteKey = selectedCommodity.symbol;
  const liveQuote = quotes[quoteKey] || quotes[selectedCommodity.id.toUpperCase()];
  
  // Real-time or updated price
  const displayPrice = liveQuote ? liveQuote.price : selectedCommodity.currentPrice;
  const displayChange = liveQuote ? liveQuote.change : selectedCommodity.change;
  const displayChangePct = liveQuote ? liveQuote.changePercent : selectedCommodity.changePercent;
  const isPositive = displayChange >= 0;
  const tick = recentTicks[quoteKey];

  // Filtered bank outlooks for selected commodity
  const filteredOutlooks = selectedCommodity.analystOutlooks.filter(outlook => {
    const matchesBank = selectedBankFilter === 'ALL' || outlook.bankName.toLowerCase().includes(selectedBankFilter.toLowerCase());
    const matchesStance = selectedStanceFilter === 'ALL' || outlook.stance.toLowerCase() === selectedStanceFilter.toLowerCase();
    return matchesBank && matchesStance;
  });

  // Unique list of banks for filter
  const allBanks = Array.from(new Set(selectedCommodity.analystOutlooks.map(o => o.bankName)));

  // Generate Institutional Cross-Commodity Synthesis
  const handleGenerateSynthesis = () => {
    setIsSynthesizing(true);
    setShowSynthesisModal(true);

    setTimeout(() => {
      setSynthesisReport(`
### Institutional Macro Commodities & Energy Intelligence Briefing
**Cross-Asset Overview: Energy, Precious Metals, Industrial Transition Metals & Agriculture**

#### 1. Energy & Natural Gas (Dutch TTF, Henry Hub, JKM)
- **Dutch TTF**: European natural gas balances remain vulnerable to sudden supply disruptions despite storage exceeding 92%. **Goldman Sachs** and **J.P. Morgan** model persistent upside tail risk (€38-€41.50/MWh) due to the expiration of the Russia-Ukraine transit accord and global competition for flexible LNG cargoes with Asia.
- **Henry Hub ($2.85/MMBtu)**: Transitioning from domestic surplus into an export-led demand boom (+3.5 Bcf/d in new Gulf Coast liquefaction) and massive electricity demand from AI data centers, supporting a consensus recovery to **$3.30-$3.60/MMBtu**.
- **Platts JKM LNG ($13.40/MMBtu)**: Asian spot buyers continue paying a +$1.85/MMBtu premium over European hub prices to lock in winter peaking cargoes.

#### 2. Crude Oil & Distillates (Brent, WTI, Murban, INE-SC, RBOB, ULSD)
- **Crude Benchmarks ($74-$78/bbl)**: Anchored in a bounded range ($75-$85) defended by OPEC+ voluntary cuts. **Citi** projects downside to $68 by 2027 as deepwater offshore output from Guyana and Brazil scales, while **Standard Chartered** notes extreme speculative short positioning that risks violent short-squeezes.
- **Murban Crude**: Commands expanding adoption among East Asian refiners due to direct Fujairah pipeline bypass around the Strait of Hormuz.
- **Refined Cracks**: Distillate and diesel cracks remain historically robust (~$27/bbl) on Atlantic basin refinery capacity constraints.

#### 3. Precious Metals (Gold & Silver)
- **Gold ($2,548/oz)**: Premier macro conviction asset across **Goldman Sachs** and **J.P. Morgan** ($2,700-$2,850/oz targets). Driven by historic central bank net sovereign accumulation (>1,000 tonnes/yr) and Western ETF inflows in response to global monetary easing cycles.
- **Silver ($30.15/oz)**: Structural multi-year deficit fueled by record solar photovoltaic paste consumption (N-type TOPCon cells), with **UBS** targeting $36.00/oz as the gold/silver ratio compresses toward 70x.

#### 4. Industrial Transition Metals (Copper, Uranium, Lithium)
- **Copper ($4.38/lb / ~$9,650/t)**: "Doctor Copper" faces unprecedented physical deficit drivers: zero smelter treatment charges (TC/RCs), severe mine disruptions, and compounding grid/AI data center electrical wiring requirements. Target: **$4.85-$5.20/lb ($10,700-$11,500/t)**.
- **Uranium Yellowcake ($84.50/lb U3O8)**: Structural nuclear renaissance fueled by Big Tech direct clean power purchase agreements (Microsoft, Amazon) and supply cuts from Kazatomprom. Target: **$98-$105/lb**.
- **Lithium Carbonate ($11,800/t)**: Prices have bottomed near the 80th cash cost percentile; supply cuts in China and Australia will tighten balances as grid battery energy storage systems (BESS) surge +45% YoY.

#### 5. Agricultural Softs (Chicago Wheat & Corn)
- **Wheat ($5.82/bu) & Corn ($4.18/bu)**: Global stocks-to-use ratios are at multi-year lows outside China; European wet weather damage provides price support against seasonal US harvest pressure.
      `);
      setIsSynthesizing(false);
    }, 700);
  };

  const getCurrencySymbol = (currency: string) => {
    if (currency === 'EUR') return '€';
    if (currency === 'CNY') return '¥';
    return '$';
  };

  return (
    <div id="commodities-section-container" className="space-y-6">
      {/* Top Banner: Commodities & Energy Benchmarks */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight font-mono-code uppercase">
                  Institutional Commodities & Macro Live Desk
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  {COMMODITIES_DATA.length} BENCHMARKS
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                  5 ASSET CLASSES
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Live tick-by-tick pricing, futures curve spreads, inventory data, and bank consensus outlooks (Goldman, J.P. Morgan, Morgan Stanley, Citi, UBS, BofA)
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="btn-refresh-commodities"
              onClick={onRefreshQuotes}
              disabled={isLoadingQuotes}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQuotes ? 'animate-spin text-blue-600' : ''}`} />
              <span>Refresh Quotes</span>
            </button>

            <button
              id="btn-ai-commodity-synthesis"
              onClick={handleGenerateSynthesis}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Institutional Bank Memo</span>
            </button>
          </div>
        </div>

        {/* Category Filter and Search Toolbar */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono-code">
            <button
              onClick={() => setActiveCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-medium ${
                activeCategoryFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-2xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              ALL ({COMMODITIES_DATA.length})
            </button>

            {(['Energy & Natural Gas', 'Crude Oil & Refined', 'Precious Metals', 'Industrial & Battery Metals', 'Agricultural & Softs'] as CommodityCategory[]).map(cat => {
              const count = COMMODITIES_DATA.filter(c => c.category === cat).length;
              const isCatActive = activeCategoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition cursor-pointer font-medium ${
                    isCatActive
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80 hover:text-slate-900'
                  }`}
                >
                  {CATEGORY_ICONS[cat]}
                  <span>{cat.split(' ')[0]}</span>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search commodity or symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-500 font-mono-code"
            />
          </div>
        </div>

        {/* Commodity Selector Ribbon / Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2 mt-4 pt-3 border-t border-slate-100">
          {filteredCommodities.map((item) => {
            const isSelected = item.id === selectedCommodity.id;
            const itemQuote = quotes[item.symbol] || quotes[item.id.toUpperCase()];
            const p = itemQuote ? itemQuote.price : item.currentPrice;
            const chg = itemQuote ? itemQuote.change : item.change;
            const pct = itemQuote ? itemQuote.changePercent : item.changePercent;
            const isUp = chg >= 0;
            const itemTick = recentTicks[item.symbol];

            return (
              <button
                key={item.id}
                id={`btn-commodity-${item.id}`}
                onClick={() => setSelectedCommodityId(item.id)}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer relative ${
                  isSelected 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                    : itemTick === 'up'
                    ? 'bg-emerald-50/80 border-emerald-300 text-slate-900'
                    : itemTick === 'down'
                    ? 'bg-rose-50/80 border-rose-300 text-slate-900'
                    : 'bg-slate-50/80 hover:bg-white border-slate-200/90 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-mono-code font-bold uppercase tracking-wider ${
                    isSelected ? 'text-amber-400' : 'text-slate-500'
                  }`}>
                    {item.symbol}
                  </span>
                  <span className={`inline-flex items-center text-[10px] font-mono-code font-semibold ${
                    isSelected 
                      ? (isUp ? 'text-emerald-300' : 'text-rose-300')
                      : (isUp ? 'text-emerald-700' : 'text-rose-700')
                  }`}>
                    {isUp ? '+' : ''}{pct.toFixed(2)}%
                  </span>
                </div>
                <div className={`text-[11px] font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  {item.name}
                </div>
                <div className="mt-1.5 flex items-baseline justify-between">
                  <span className={`text-xs font-mono-code font-extrabold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {getCurrencySymbol(item.currency)}{p.toFixed(item.currentPrice < 10 ? 2 : 2)}
                  </span>
                  <span className={`text-[9px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                    {item.unit.split('/')[1] || item.unit}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Commodity Deep-Dive Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Benchmark Details, Live Price & Curve Metrics */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono-code uppercase font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {selectedCommodity.marketCode}
                  </span>
                  <span className="text-[10px] font-mono-code uppercase font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    {selectedCommodity.category}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-1.5">
                  {selectedCommodity.name}
                </h3>
              </div>
            </div>

            {/* Real-time Pricing Box */}
            <div className={`p-4 rounded-xl border ${
              tick === 'up' 
                ? 'bg-emerald-50 border-emerald-300 transition-colors duration-500' 
                : tick === 'down' 
                ? 'bg-rose-50 border-rose-300 transition-colors duration-500' 
                : 'bg-slate-50/80 border-slate-200/90'
            }`}>
              <div className="text-[11px] text-slate-500 font-medium">LIVE BENCHMARK PRICE ({selectedCommodity.unit})</div>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl font-extrabold font-mono-code text-slate-900 tracking-tight">
                  {getCurrencySymbol(selectedCommodity.currency)}
                  {displayPrice.toFixed(selectedCommodity.currentPrice < 10 ? 2 : 2)}
                </span>
                <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isPositive 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                  {isPositive ? '+' : ''}{displayChange.toFixed(2)} ({isPositive ? '+' : ''}{displayChangePct.toFixed(2)}%)
                </span>
              </div>

              {/* Day High / Low / Volume */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-200/70 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-mono-code">Day High</span>
                  <span className="font-mono-code font-semibold text-slate-700">{selectedCommodity.dayHigh.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-mono-code">Day Low</span>
                  <span className="font-mono-code font-semibold text-slate-700">{selectedCommodity.dayLow.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-mono-code">Volume</span>
                  <span className="font-mono-code font-semibold text-slate-700">{selectedCommodity.volume}</span>
                </div>
              </div>

              {/* Curve Structure & Spreads (Professional Commodity Metrics) */}
              <div className="mt-3 pt-3 border-t border-slate-200/70 space-y-1.5 text-[11px] font-mono-code">
                {selectedCommodity.curveStructure && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Term Structure:</span>
                    <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                      selectedCommodity.curveStructure === 'Backwardation' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedCommodity.curveStructure} (Prompt Premium)
                    </span>
                  </div>
                )}
                {selectedCommodity.inventoryStatus && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Inventory:</span>
                    <span className="font-medium text-slate-800 text-right truncate max-w-[200px]" title={selectedCommodity.inventoryStatus}>
                      {selectedCommodity.inventoryStatus}
                    </span>
                  </div>
                )}
                {selectedCommodity.crackSpreadOrMargin && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Arb / Margin:</span>
                    <span className="font-semibold text-amber-800 text-right truncate max-w-[200px]">
                      {selectedCommodity.crackSpreadOrMargin}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200/70 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                {selectedCommodity.primaryBenchmarkRole}
              </p>
            </div>
          </div>

          {/* Middle & Right Column: Consensus Range & Bank Targets Visualizer */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900 font-mono-code uppercase">
                  Wall Street & European Bank Forecast Corridor
                </h4>
              </div>
              <div className="text-xs text-slate-500 font-mono-code">
                Consensus Target: <strong className="text-slate-900 font-bold">{selectedCommodity.consensusTarget}</strong>
              </div>
            </div>

            {/* Visual Spread Bar */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-mono-code">
                <span>Bear Low: <strong>{getCurrencySymbol(selectedCommodity.currency)}{selectedCommodity.consensusRange.low.toFixed(2)}</strong></span>
                <span>Consensus Mean: <strong>{getCurrencySymbol(selectedCommodity.currency)}{selectedCommodity.consensusRange.avg.toFixed(2)}</strong></span>
                <span>Bull High: <strong>{getCurrencySymbol(selectedCommodity.currency)}{selectedCommodity.consensusRange.high.toFixed(2)}</strong></span>
              </div>

              {/* Progress track visual */}
              <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 bottom-0 bg-blue-500/80 rounded-full"
                  style={{
                    left: '15%',
                    right: '15%'
                  }}
                />
              </div>

              {/* Bank Target Bars */}
              <div className="mt-4 space-y-2">
                {selectedCommodity.analystOutlooks.map((b) => {
                  const diff = b.targetPriceNumeric - displayPrice;
                  const diffPct = (diff / displayPrice) * 100;
                  const isUpTarget = diff >= 0;

                  return (
                    <div key={b.bankName} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-md hover:bg-white transition border border-transparent hover:border-slate-200">
                      <div className="flex items-center space-x-2.5 min-w-[150px]">
                        <span className="font-semibold text-slate-800">{b.bankName}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                          b.stance === 'Bullish' ? 'bg-emerald-100 text-emerald-800' :
                          b.stance === 'Bearish' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {b.stance}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] font-mono-code">{b.timeHorizon}</div>
                      <div className="flex items-center space-x-3 min-w-[150px] justify-end font-mono-code">
                        <strong className="text-slate-900 font-bold">{b.targetPrice}</strong>
                        <span className={`text-[11px] font-semibold ${isUpTarget ? 'text-emerald-600' : 'text-rose-600'}`}>
                          ({isUpTarget ? '+' : ''}{diffPct.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Macro Catalysts Pills */}
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Macro Drivers & Supply Fundamentals ({selectedCommodity.symbol})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedCommodity.macroFactors.map((factor, idx) => (
                  <div key={idx} className="flex items-start space-x-2 bg-slate-50/90 border border-slate-200/70 p-2.5 rounded-lg text-xs text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5"></span>
                    <span className="text-[11px] leading-tight">{factor}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Bank Outlooks Grid Header & Filters */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-blue-700" />
            <h3 className="text-sm font-bold text-slate-900 font-mono-code uppercase">
              Investment Bank Equity & Commodity Research Desks ({filteredOutlooks.length} Reports)
            </h3>
          </div>

          {/* Stance and Bank Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-slate-600">
              <span className="px-2 text-[11px] font-medium text-slate-500">Stance:</span>
              {(['ALL', 'Bullish', 'Neutral', 'Bearish'] as const).map((stance) => (
                <button
                  key={stance}
                  onClick={() => setSelectedStanceFilter(stance)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    selectedStanceFilter === stance 
                      ? 'bg-white text-slate-900 font-bold shadow-2xs' 
                      : 'hover:text-slate-900 text-slate-600'
                  }`}
                >
                  {stance === 'ALL' ? 'All' : stance}
                </button>
              ))}
            </div>

            <select
              value={selectedBankFilter}
              onChange={(e) => setSelectedBankFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-400 transition cursor-pointer"
            >
              <option value="ALL">All Banks</option>
              {allBanks.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Outlook Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOutlooks.map((outlook) => (
            <div 
              key={outlook.bankName}
              className="bg-slate-50/70 hover:bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl p-4 transition shadow-2xs hover:shadow-xs flex flex-col justify-between"
            >
              <div>
                {/* Header: Bank & Stance */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${outlook.logoColor}`}>
                    {outlook.bankName}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                    outlook.stance === 'Bullish' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    outlook.stance === 'Bearish' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                    'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {outlook.stance === 'Bullish' && <TrendingUp className="w-3 h-3 text-emerald-600" />}
                    {outlook.stance === 'Bearish' && <TrendingDown className="w-3 h-3 text-rose-600" />}
                    {outlook.stance}
                  </span>
                </div>

                {/* Target Price & Horizon */}
                <div className="mb-3">
                  <div className="text-[10px] text-slate-400 uppercase font-mono-code">Target Price</div>
                  <div className="text-xl font-bold font-mono-code text-slate-900 tracking-tight">
                    {outlook.targetPrice}
                  </div>
                  <div className="text-xs text-blue-700 font-medium">
                    {outlook.timeHorizon}
                  </div>
                </div>

                {/* Research Thesis */}
                <div className="text-xs text-slate-600 leading-relaxed bg-white/80 p-3 rounded-lg border border-slate-200/70 mb-3">
                  <p>{outlook.thesis}</p>
                </div>

                {/* Catalysts */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Key Market Catalysts
                  </div>
                  <ul className="space-y-1 text-[11px] text-slate-600">
                    {outlook.catalysts.map((cat, cIdx) => (
                      <li key={cIdx} className="flex items-start gap-1.5">
                        <span className="text-blue-500 font-bold">•</span>
                        <span>{cat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400 font-mono-code">
                <span>Desk Report</span>
                <span>{outlook.lastUpdated}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Synthesis Modal */}
      {showSynthesisModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-slate-200 shadow-xl p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900 font-mono-code">
                  Institutional Cross-Commodities Synthesis
                </h3>
              </div>
              <button
                onClick={() => setShowSynthesisModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {isSynthesizing ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-amber-600 animate-spin" />
                <p className="text-xs text-slate-600 font-medium">
                  Synthesizing investment bank equity & commodity research desks...
                </p>
              </div>
            ) : (
              <div className="prose prose-slate max-w-none text-xs leading-relaxed space-y-4">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                  <strong>Consensus Takeaway:</strong> Energy desks at Goldman Sachs, Morgan Stanley, J.P. Morgan, and Citi converge on tight physical balances for European Gas (TTF) and Doctor Copper, while Gold continues to push higher driven by structural central bank reserve accumulation and monetary easing.
                </div>
                <div className="whitespace-pre-line text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans text-xs">
                  {synthesisReport}
                </div>
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowSynthesisModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Memo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
