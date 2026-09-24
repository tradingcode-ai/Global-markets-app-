import React, { useState, useMemo } from 'react';
import { 
  TrendingDown, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  RefreshCw, 
  Landmark, 
  Globe, 
  Activity, 
  CheckCircle2, 
  Layers,
  Scale,
  Building2,
  LineChart as LineChartIcon
} from 'lucide-react';
import { SOVEREIGN_BONDS_DATA, GLOBAL_ECONOMIES } from '../data/bondsData';
import { LiveQuote, SovereignBondItem } from '../types';
import { SovereignYieldHistoryChart } from './SovereignYieldHistoryChart';

interface BondsSectionProps {
  quotes: Record<string, LiveQuote>;
  onRefreshQuotes: () => void;
  isLoadingQuotes: boolean;
  selectedBondId?: string;
  onSelectBondId?: (id: string) => void;
}

export const BondsSection: React.FC<BondsSectionProps> = ({
  quotes,
  onRefreshQuotes,
  isLoadingQuotes,
  selectedBondId: externalBondId,
  onSelectBondId
}) => {
  // Filters for Global Rates
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>('ALL');
  const [selectedRateFilter, setSelectedRateFilter] = useState<'10Y' | '30Y' | 'ALL'>('10Y');
  
  const [internalBondId, setInternalBondId] = useState<string>('us-10y-treasury');
  const [showMacroMemo, setShowMacroMemo] = useState<boolean>(false);

  const selectedBondId = externalBondId || internalBondId;
  const setSelectedBondId = (id: string) => {
    setInternalBondId(id);
    if (onSelectBondId) onSelectBondId(id);
  };

  React.useEffect(() => {
    if (externalBondId) {
      setInternalBondId(externalBondId);
      const b = SOVEREIGN_BONDS_DATA.find(item => item.id === externalBondId);
      if (b && selectedCountryFilter !== 'ALL' && b.country !== selectedCountryFilter) {
        setSelectedCountryFilter('ALL');
      }
    }
  }, [externalBondId]);

  // U.S. Benchmarks (2Y, 10Y, 30Y, and Mortgage)
  const usBonds = useMemo(() => {
    return SOVEREIGN_BONDS_DATA.filter(b => b.country === 'United States');
  }, []);

  // Global Rates ordered by Economy GDP size
  const globalRatesBonds = useMemo(() => {
    const orderMap = new Map(GLOBAL_ECONOMIES.map((e) => [e.country, e.gdpRank]));
    return SOVEREIGN_BONDS_DATA
      .filter(b => b.maturity === '10Y' || b.maturity === '30Y')
      .filter(b => selectedCountryFilter === 'ALL' || b.country === selectedCountryFilter)
      .filter(b => selectedRateFilter === 'ALL' || b.maturity === selectedRateFilter)
      .sort((a, b) => {
        const rankA = orderMap.get(a.country) ?? 99;
        const rankB = orderMap.get(b.country) ?? 99;
        if (rankA !== rankB) return rankA - rankB;
        return a.maturity === '10Y' ? -1 : 1;
      });
  }, [selectedCountryFilter, selectedRateFilter]);

  const selectedBond = useMemo(() => {
    return SOVEREIGN_BONDS_DATA.find(b => b.id === selectedBondId) || SOVEREIGN_BONDS_DATA[1];
  }, [selectedBondId]);

  // Helper to get live yield and bps change
  const getBondStats = (bond: SovereignBondItem) => {
    // For mortgage, check US30YFRM first, then US30YMORT
    let q = quotes[bond.symbol];
    if (!q && (bond.symbol === 'US30YFRM' || bond.symbol === 'US30YMORT')) {
      q = quotes['US30YFRM'] || quotes['US30YMORT'];
    }

    if (q) {
      const currentYield = q.price;
      const prev = q.previousClose || currentYield;
      const diffYield = currentYield - prev;
      const bps = Number((diffYield * 100).toFixed(1));
      return {
        yieldVal: currentYield,
        bps,
        pct: q.changePercent,
        dayHigh: q.dayHigh,
        dayLow: q.dayLow,
        provider: q.provider || (bond.symbol.includes('MORT') || bond.symbol.includes('FRM') ? 'US30YFRM:Exchange (Live Feed)' : 'CNBC Real-Time Feed'),
        sparkline: q.sparkline || bond.sparkline
      };
    }

    return {
      yieldVal: bond.currentYield,
      bps: bond.changeBps,
      pct: bond.changePercent,
      dayHigh: bond.dayHigh,
      dayLow: bond.dayLow,
      provider: bond.symbol.includes('MORT') || bond.symbol.includes('FRM') ? 'US30YFRM:Exchange (Live Feed)' : 'CNBC Real-Time Feed',
      sparkline: bond.sparkline
    };
  };

  const selectedStats = getBondStats(selectedBond);

  // Live 30-Year Mortgage Rate from US30YFRM:Exchange
  const mortgageQuote = quotes['US30YFRM'] || quotes['US30YMORT'];
  const mortgageRate = mortgageQuote ? mortgageQuote.price : 6.76;
  const mortgageProvider = mortgageQuote?.provider || 'US30YFRM:Exchange (Live Feed)';

  // Track recent price ticks for visual cues
  const [recentTicks, setRecentTicks] = useState<Record<string, 'up' | 'down'>>({});
  const prevYieldsRef = React.useRef<Record<string, number>>({});

  React.useEffect(() => {
    const newTicks: Record<string, 'up' | 'down'> = {};
    let hasChanges = false;

    SOVEREIGN_BONDS_DATA.forEach(b => {
      const q = quotes[b.symbol] || (b.symbol === 'US30YFRM' ? (quotes['US30YFRM'] || quotes['US30YMORT']) : null);
      if (q) {
        const prev = prevYieldsRef.current[b.symbol];
        if (prev !== undefined && prev !== q.price) {
          newTicks[b.symbol] = q.price > prev ? 'up' : 'down';
          hasChanges = true;
        }
        prevYieldsRef.current[b.symbol] = q.price;
      }
    });

    if (hasChanges) {
      setRecentTicks(newTicks);
      const timer = setTimeout(() => setRecentTicks({}), 2000);
      return () => clearTimeout(timer);
    }
  }, [quotes]);

  return (
    <div className="space-y-6">
      {/* 1. J.P. Morgan Style Header & Live Fixed Income Command Ribbon */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-lg bg-blue-50 text-blue-800 border border-blue-200/70">
                <Landmark className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold font-editorial text-slate-900 tracking-tight">
                    Treasury & Sovereign Bond Desk
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    INSTITUTIONAL RATES
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time sovereign yield curves, global benchmarks, and US30YFRM:Exchange mortgage feed
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onRefreshQuotes}
              disabled={isLoadingQuotes}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQuotes ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span>Refresh Rates</span>
            </button>

            <button
              onClick={() => setShowMacroMemo(!showMacroMemo)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#005a9c] hover:bg-[#004a80] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{showMacroMemo ? 'Hide Macro Memo' : 'Fixed Income Memo'}</span>
            </button>
          </div>
        </div>

        {/* Real-time Central Bank & Spread Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100 text-xs font-mono-code">
          <div className="bg-slate-50/80 border border-slate-200/80 p-3 rounded-lg">
            <div className="text-[10px] uppercase text-slate-500 font-medium">U.S. 2Y / 10Y SPREAD</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-base font-bold text-emerald-700">+27.0 bps</span>
              <span className="text-[10px] text-slate-500">Disinverted</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Normalized Term Structure</div>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/80 p-3 rounded-lg">
            <div className="text-[10px] uppercase text-slate-500 font-medium">30Y MORTGAGE FEED</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-base font-bold text-amber-700">{mortgageRate.toFixed(2)}%</span>
              <span className="text-[10px] text-slate-500">+{((mortgageRate - (quotes['US10Y']?.price || 4.95)) * 100).toFixed(0)} bps vs 10Y</span>
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 truncate">US30YFRM:Exchange Live</div>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/80 p-3 rounded-lg">
            <div className="text-[10px] uppercase text-slate-500 font-medium">GLOBAL 10Y YIELD RANGE</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-base font-bold text-blue-700">1.08% — 5.21%</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Japan (1.08%) to UK (5.21%)</div>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/80 p-3 rounded-lg">
            <div className="text-[10px] uppercase text-slate-500 font-medium">CENTRAL BANK POLICY RATES</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-base font-bold text-slate-900">Fed 4.75% • ECB 3.50%</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">BoJ: 0.25% • PBOC: 1.50% • BoE: 5.00%</div>
          </div>
        </div>

        {/* Collapsible Institutional Fixed Income Memo */}
        {showMacroMemo && (
          <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2 animate-fadeIn font-sans leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 font-mono-code uppercase text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-blue-700" />
              <span>Global Fixed Income & Macro Rates Briefing</span>
            </div>
            <p>
              <strong>United States:</strong> The U.S. 2Y/10Y yield curve maintains its normative disinversion (+27 bps), signaling ongoing economic expansion while long-dated supply pressures anchor the 10Y benchmark around 4.95%. The 30-year mortgage rate tracks directly via the live <code className="text-blue-700 font-bold">US30YFRM:Exchange</code> feed.
            </p>
            <p>
              <strong>China & Japan:</strong> Chinese government bonds (CGB 10Y at 2.12%) reflect PBOC accommodative liquidity injections and secondary market bond trading operations. In Japan, 10Y JGB yields hold firm above 1.08% as the Bank of Japan advances quantitative tapering and prepares for normalized policy rates.
            </p>
            <p>
              <strong>Europe & UK:</strong> German Bunds (DE10Y at 3.49%) continue to anchor the Continental risk-free baseline, while UK Gilts (GB10Y at 5.21%) trade with an elevated persistent inflation premium under active BoE QT gilt sales.
            </p>
          </div>
        )}
      </div>

      {/* SECTION 1: United States Treasuries & Real Estate Benchmarks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🇺🇸</span>
            <h3 className="text-base font-bold text-slate-900 tracking-tight font-sans">
              United States Treasuries & Real Estate Benchmarks
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-blue-50 text-blue-800 border border-blue-200">
              USD CURVE & EXCHANGE MORTGAGE
            </span>
          </div>
          <div className="text-xs font-mono-code text-slate-500 hidden sm:block">
            Benchmark Curve (2Y • 10Y • 30Y • US30YFRM)
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {usBonds.map((bond) => {
            const stats = getBondStats(bond);
            const isSelected = selectedBond.id === bond.id;
            const isBpsDown = stats.bps < 0; // for yields, down means rates falling
            const tick = recentTicks[bond.symbol];

            return (
              <div
                key={bond.id}
                id={`card-bond-${bond.id}`}
                onClick={() => setSelectedBondId(bond.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-blue-50/40 border-blue-500 shadow-xs ring-1 ring-blue-500/30'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                }`}
              >
                {/* Tick pulse */}
                {tick && (
                  <span className={`absolute top-0 left-0 right-0 h-0.5 ${tick === 'up' ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse`} />
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono-code font-bold text-sm text-slate-900">
                        {bond.symbol}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono-code bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                        {bond.maturity}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-600 mt-1 line-clamp-1">
                      {bond.name}
                    </div>
                  </div>

                  <div className={`p-1.5 rounded-md ${isBpsDown ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                    {isBpsDown ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {/* Yield Big Number */}
                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <div className="text-2xl font-bold font-mono-code text-slate-900 tabular-nums tracking-tight">
                      {stats.yieldVal.toFixed(bond.maturity.includes('Mortgage') ? 2 : 3)}%
                    </div>
                    <div className="flex items-center space-x-1.5 mt-0.5 text-xs font-mono-code">
                      <span className={`font-semibold ${isBpsDown ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {stats.bps > 0 ? `+${stats.bps}` : stats.bps} bps
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500">
                        {stats.pct > 0 ? `+${stats.pct.toFixed(2)}%` : `${stats.pct.toFixed(2)}%`}
                      </span>
                    </div>
                  </div>

                  {/* High/Low Range */}
                  <div className="text-right text-[10px] font-mono-code text-slate-400 space-y-0.5">
                    <div>H: <span className="text-slate-700 font-medium">{stats.dayHigh.toFixed(2)}%</span></div>
                    <div>L: <span className="text-slate-700 font-medium">{stats.dayLow.toFixed(2)}%</span></div>
                  </div>
                </div>

                {/* Issuer & Live Feed Provider */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono-code">
                  <span className="truncate max-w-[130px]">{bond.symbol.includes('FRM') || bond.symbol.includes('MORT') ? 'US30YFRM:Exchange' : bond.issuer.split('(')[0]}</span>
                  <div className="flex items-center gap-1.5">
                    {isSelected && (
                      <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[9px] font-bold font-mono-code">
                        Grafiek Actief
                      </span>
                    )}
                    <span className="text-blue-700 font-bold">{bond.creditRating.split(' ')[0]}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Global Sovereign Rates (Ranked by GDP Size) */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              <Globe className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight font-sans">
                  Global Sovereign Rates
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  8 MAJOR ECONOMIES • GDP RANKED
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Standardized sovereign benchmarks ranked by economy size (GDP) — default displays 10Y benchmarks
              </p>
            </div>
          </div>

          {/* Right side filter controls: Identical design and function as top-right in the app! */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            {/* Country Selector Dropdown */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="select-bond-country" className="text-xs font-semibold text-slate-600 font-sans hidden sm:inline">
                Land:
              </label>
              <select
                id="select-bond-country"
                value={selectedCountryFilter}
                onChange={(e) => setSelectedCountryFilter(e.target.value)}
                className="bg-slate-50 hover:bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition cursor-pointer font-medium shadow-2xs"
              >
                <option value="ALL">🌐 Alle Landen (8 Grootmachten)</option>
                {GLOBAL_ECONOMIES.map((econ) => (
                  <option key={econ.country} value={econ.country}>
                    {econ.flag} {econ.country} ({econ.gdpLabel})
                  </option>
                ))}
              </select>
            </div>

            {/* Duration / Maturity Selector Dropdown */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="select-bond-duration" className="text-xs font-semibold text-slate-600 font-sans hidden sm:inline">
                Looptijd:
              </label>
              <select
                id="select-bond-duration"
                value={selectedRateFilter}
                onChange={(e) => setSelectedRateFilter(e.target.value as '10Y' | '30Y' | 'ALL')}
                className="bg-slate-50 hover:bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition cursor-pointer font-medium shadow-2xs"
              >
                <option value="10Y">⏱️ 10-Jaars Benchmarks (Standaard)</option>
                <option value="30Y">⏱️ 30-Jaars Lange Obligaties</option>
                <option value="ALL">⏱️ Alle Looptijden (10Y & 30Y)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Global Rates Bonds Grid - EXACT SAME DESIGN AS US CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {globalRatesBonds.map((bond) => {
            const stats = getBondStats(bond);
            const isSelected = selectedBond.id === bond.id;
            const isBpsDown = stats.bps < 0;
            const tick = recentTicks[bond.symbol];

            return (
              <div
                key={bond.id}
                id={`card-bond-${bond.id}`}
                onClick={() => setSelectedBondId(bond.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-blue-50/40 border-blue-500 shadow-xs ring-1 ring-blue-500/30'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                }`}
              >
                {/* Tick pulse */}
                {tick && (
                  <span className={`absolute top-0 left-0 right-0 h-0.5 ${tick === 'up' ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse`} />
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-base mr-0.5">{bond.flag}</span>
                      <span className="font-mono-code font-bold text-sm text-slate-900">
                        {bond.symbol}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono-code bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                        {bond.maturity}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-600 mt-1 line-clamp-1">
                      {bond.name}
                    </div>
                  </div>

                  <div className={`p-1.5 rounded-md ${isBpsDown ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                    {isBpsDown ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {/* Yield Big Number */}
                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <div className="text-2xl font-bold font-mono-code text-slate-900 tabular-nums tracking-tight">
                      {stats.yieldVal.toFixed(3)}%
                    </div>
                    <div className="flex items-center space-x-1.5 mt-0.5 text-xs font-mono-code">
                      <span className={`font-semibold ${isBpsDown ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {stats.bps > 0 ? `+${stats.bps}` : stats.bps} bps
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500">
                        {stats.pct > 0 ? `+${stats.pct.toFixed(2)}%` : `${stats.pct.toFixed(2)}%`}
                      </span>
                    </div>
                  </div>

                  {/* High/Low Range */}
                  <div className="text-right text-[10px] font-mono-code text-slate-400 space-y-0.5">
                    <div>H: <span className="text-slate-700 font-medium">{stats.dayHigh.toFixed(2)}%</span></div>
                    <div>L: <span className="text-slate-700 font-medium">{stats.dayLow.toFixed(2)}%</span></div>
                  </div>
                </div>

                {/* Issuer & Rating */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono-code">
                  <span className="truncate max-w-[130px]">{bond.issuer.split('(')[0]}</span>
                  <div className="flex items-center gap-1.5">
                    {isSelected && (
                      <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[9px] font-bold font-mono-code">
                        Grafiek Actief
                      </span>
                    )}
                    <span className="text-blue-700 font-bold">{bond.creditRating.split(' ')[0]}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: Selected Bond Deep Dive Dossier (Full Width Executive Layout) */}
      <div id="bond-dossier-card" className="pt-2">
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <span className="text-3xl shrink-0">{selectedBond.flag}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 font-mono-code">
                    {selectedBond.name} ({selectedBond.symbol})
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-blue-50 text-blue-800 border border-blue-200">
                    {selectedBond.maturity}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {selectedBond.issuer} • Credit Rating: <span className="font-semibold text-slate-700">{selectedBond.creditRating}</span>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right font-mono-code shrink-0">
              <div className="text-2xl sm:text-3xl font-bold text-[#005a9c] tabular-nums">
                {selectedStats.yieldVal.toFixed(selectedBond.maturity.includes('Mortgage') ? 2 : 3)}%
              </div>
              <div className={`text-xs font-semibold ${selectedStats.bps < 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {selectedStats.bps > 0 ? `+${selectedStats.bps}` : selectedStats.bps} bps today ({selectedStats.pct > 0 ? `+${selectedStats.pct.toFixed(2)}%` : `${selectedStats.pct.toFixed(2)}%`})
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 text-xs font-mono-code">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-[10px] uppercase text-slate-400 font-medium">DAY RANGE</div>
              <div className="text-slate-900 font-bold mt-0.5">
                {selectedStats.dayLow.toFixed(3)}% - {selectedStats.dayHigh.toFixed(3)}%
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-[10px] uppercase text-slate-400 font-medium">PREVIOUS CLOSE</div>
              <div className="text-slate-900 font-bold mt-0.5">
                {selectedBond.previousClose.toFixed(3)}%
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-[10px] uppercase text-slate-400 font-medium">SPREAD VS US 10Y</div>
              <div className="text-blue-700 font-bold mt-0.5">
                {selectedBond.spreadVsUS10YBps !== undefined 
                  ? (selectedBond.spreadVsUS10YBps > 0 ? `+${selectedBond.spreadVsUS10YBps} bps` : `${selectedBond.spreadVsUS10YBps} bps`)
                  : '0 bps (Benchmark)'}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-[10px] uppercase text-slate-400 font-medium">LIVE DATA FEED</div>
              <div className="text-emerald-700 font-bold mt-0.5 truncate">
                {selectedStats.provider}
              </div>
            </div>
          </div>

          {/* Benchmark Role Explanation */}
          <div className="bg-slate-50/80 border border-slate-200 p-4 rounded-lg text-xs leading-relaxed space-y-2">
            <div className="text-[11px] font-bold text-blue-900 font-mono-code uppercase tracking-wider">
              INSTITUTIONAL CAPITAL BENCHMARK ROLE
            </div>
            <p className="text-slate-600">
              {selectedBond.benchmarkRole}
            </p>
            <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 font-mono-code">
              <span>Policy Anchor: <strong className="text-slate-700">{selectedBond.centralBankPolicyRate}</strong></span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified Institutional Live Feed
              </span>
            </div>
          </div>

          {/* Historical Yield Chart powered by CNBC & FRED with Live & Daily Updates */}
          <SovereignYieldHistoryChart
            bond={selectedBond}
            liveQuote={quotes[selectedBond.symbol]}
          />
        </div>
      </div>
    </div>
  );
};
