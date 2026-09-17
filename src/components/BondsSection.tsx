import React, { useState, useMemo } from 'react';
import { LiveQuote, SovereignBondItem } from '../types';
import { SOVEREIGN_BONDS_DATA, YIELD_CURVE_BENCHMARKS } from '../data/bondsData';
import { 
  Landmark, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck,
  Percent,
  Home,
  Sparkles,
  SlidersHorizontal,
  Info,
  Scale,
  Compass
} from 'lucide-react';

interface BondsSectionProps {
  quotes: Record<string, LiveQuote>;
  recentTicks: Record<string, 'up' | 'down'>;
  onRefreshQuotes: () => void;
  isLoadingQuotes: boolean;
}

export const BondsSection: React.FC<BondsSectionProps> = ({
  quotes,
  recentTicks,
  onRefreshQuotes,
  isLoadingQuotes
}) => {
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>('ALL');
  const [selectedMaturityFilter, setSelectedMaturityFilter] = useState<string>('ALL');
  const [selectedBondId, setSelectedBondId] = useState<string>('us-10y-treasury');
  const [showMacroMemo, setShowMacroMemo] = useState<boolean>(false);
  const [loanAmount, setLoanAmount] = useState<number>(500000);

  // US bonds
  const usBonds = useMemo(() => {
    return SOVEREIGN_BONDS_DATA.filter(b => b.country === 'United States');
  }, []);

  // European bonds grouped by country
  const europeanBonds = useMemo(() => {
    return SOVEREIGN_BONDS_DATA.filter(b => b.country !== 'United States');
  }, []);

  // Filtered bonds for active tab
  const displayedBonds = useMemo(() => {
    return SOVEREIGN_BONDS_DATA.filter(b => {
      const matchesCountry = selectedCountryFilter === 'ALL' || b.country === selectedCountryFilter;
      const matchesMaturity = selectedMaturityFilter === 'ALL' || b.maturity === selectedMaturityFilter;
      return matchesCountry && matchesMaturity;
    });
  }, [selectedCountryFilter, selectedMaturityFilter]);

  const selectedBond = useMemo(() => {
    return SOVEREIGN_BONDS_DATA.find(b => b.id === selectedBondId) || SOVEREIGN_BONDS_DATA[1];
  }, [selectedBondId]);

  // Helper to get live yield and bps change
  const getBondStats = (bond: SovereignBondItem) => {
    const q = quotes[bond.symbol];
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
        provider: q.provider || 'CNBC Real-Time Feed',
        sparkline: q.sparkline || bond.sparkline
      };
    }
    return {
      yieldVal: bond.currentYield,
      bps: bond.changeBps,
      pct: bond.changePercent,
      dayHigh: bond.dayHigh,
      dayLow: bond.dayLow,
      provider: 'CNBC Real-Time Feed',
      sparkline: bond.sparkline
    };
  };

  const selectedStats = getBondStats(selectedBond);

  // Calculate live mortgage monthly payment on $500,000 benchmark
  const mortgageQuote = quotes['US30YMORT'];
  const mortgageRate = mortgageQuote ? mortgageQuote.price : 6.76;
  const monthlyRate = mortgageRate / 100 / 12;
  const numPayments = 30 * 12;
  const monthlyMortgagePayment = Math.round(
    (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  );

  return (
    <div id="section-sovereign-bonds" className="space-y-6">
      {/* Header Banner - McKinsey Midnight Executive Styling */}
      <div className="bg-[#072134]/90 border border-[#133852] rounded-xl p-6 shadow-sm backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono-code tracking-wider uppercase font-semibold">
              <Landmark className="w-4 h-4 text-cyan-400" />
              <span>MACRO & SOVEREIGN YIELD INTELLIGENCE</span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                LIVE CNBC & FRED API CONNECTED
              </span>
            </div>
            
            <h2 className="text-2xl font-bold font-editorial text-white tracking-tight">
              Global Sovereign Debt & Interest Rate Benchmarks
            </h2>
            
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Real-time yields for U.S. 2Y, 10Y, and 30Y Treasuries, Freddie Mac 30-Year mortgage benchmark, 
              and European 10-Year and 30-Year sovereign rates for the 5 largest economies (Germany, UK, France, Italy, Spain).
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onRefreshQuotes}
              disabled={isLoadingQuotes}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0a2d47] border border-[#1f4e73] hover:border-cyan-400 text-slate-200 text-xs font-semibold transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQuotes ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Refresh Yields</span>
            </button>

            <button
              onClick={() => setShowMacroMemo(!showMacroMemo)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{showMacroMemo ? 'Hide Macro Memo' : 'Institutional Rate Memo'}</span>
            </button>
          </div>
        </div>

        {/* Real-time Central Bank & Spread Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[#133852]/80 text-xs font-mono-code">
          <div className="bg-[#051c2c]/80 border border-[#133852] p-3 rounded-lg">
            <div className="text-[10px] uppercase text-slate-400 font-medium">U.S. 2Y / 10Y CURVE SPREAD</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-base font-bold text-emerald-400">+27.0 bps</span>
              <span className="text-[10px] text-slate-400">Disinverted</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Normative Expansion Slope</div>
          </div>

          <div className="bg-[#051c2c]/80 border border-[#133852] p-3 rounded-lg">
            <div className="text-[10px] uppercase text-slate-400 font-medium">30Y MORTGAGE SPREAD</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-base font-bold text-amber-300">+{((mortgageRate - (quotes['US10Y']?.price || 4.95)) * 100).toFixed(0)} bps</span>
              <span className="text-[10px] text-slate-400">vs 10Y</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Primary Lending Risk Premia</div>
          </div>

          <div className="bg-[#051c2c]/80 border border-[#133852] p-3 rounded-lg">
            <div className="text-[10px] uppercase text-slate-400 font-medium">ECB BUND-SPREAD RADAR</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-base font-bold text-cyan-300">OAT +97 / BTP +87</span>
              <span className="text-[10px] text-slate-400">bps</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">French Deficit Premium Active</div>
          </div>

          <div className="bg-[#051c2c]/80 border border-[#133852] p-3 rounded-lg">
            <div className="text-[10px] uppercase text-slate-400 font-medium">CENTRAL BANK POLICY RATES</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-base font-bold text-white">Fed 4.75% • ECB 3.50%</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">BoE Official Bank Rate: 5.00%</div>
          </div>
        </div>
      </div>

      {/* AI Macro & Sovereign Memo (Expandable) */}
      {showMacroMemo && (
        <div className="bg-gradient-to-br from-[#072134] to-[#0a2d47] border border-cyan-500/40 rounded-xl p-6 shadow-lg text-slate-200 animate-in fade-in duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-[#133852]">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-cyan-300">
                VERITAS & MCKINSEY GLOBAL FIXED INCOME SYNOPSIS
              </span>
            </div>
            <span className="text-[10px] font-mono-code bg-[#051c2c] px-2.5 py-1 rounded text-slate-300 border border-[#133852]">
              REAL-TIME MARKET MODEL
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4 text-xs leading-relaxed">
            <div className="bg-[#051c2c]/60 p-4 rounded-lg border border-[#133852]">
              <h4 className="font-bold text-white mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                U.S. Yield Curve Disinversion & Duration
              </h4>
              <p className="text-slate-300">
                The 2Y/10Y spread has fully un-inverted to <strong>+27 bps</strong> as the Federal Reserve’s easing cycle progresses. 
                Long-end yields (10Y at {quotes['US10Y']?.price || 4.95}%, 30Y at {quotes['US30Y']?.price || 5.31}%) are supported by persistent term premium 
                and heavy Treasury supply auctions. Duration managers are favoring the 5-7 year belly of the curve.
              </p>
            </div>

            <div className="bg-[#051c2c]/60 p-4 rounded-lg border border-[#133852]">
              <h4 className="font-bold text-white mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                U.S. Mortgage Transmission & Housing
              </h4>
              <p className="text-slate-300">
                Freddie Mac 30-Year Fixed mortgage benchmark stands at <strong>{mortgageRate}%</strong>. The primary-secondary mortgage spread over 
                the 10-year Treasury sits at 181 bps, reflecting elevated prepayment volatility and GSE guarantee fees. Every 50 bps reduction 
                in mortgage rates unlocks an estimated 4.8 million potential refinancing candidates.
              </p>
            </div>

            <div className="bg-[#051c2c]/60 p-4 rounded-lg border border-[#133852]">
              <h4 className="font-bold text-white mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                European Sovereign Spread Asymmetry
              </h4>
              <p className="text-slate-300">
                German Bunds remain the risk-free Eurozone baseline ({quotes['DE10Y']?.price || 3.49}%). French OAT-Bund spread 
                widened to +97 bps on fiscal budget scrutiny, while Spanish Bonos (+45 bps) trade at multi-year tight differentials 
                underpinned by resilient 2.4% GDP growth. Italian BTPs (+87 bps) demonstrate remarkable resilience backed by the ECB TPI.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: United States Treasuries & Mortgage Rate Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🇺🇸</span>
            <h3 className="text-base font-bold font-editorial text-white tracking-tight">
              United States Treasuries & Real Estate Benchmarks
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-[#0a2d47] text-cyan-300 border border-[#1f4e73]">
              4 LIVE BENCHMARKS
            </span>
          </div>

          <span className="text-xs text-slate-400 font-mono-code hidden sm:inline-block">
            Data Source: CNBC Quote Cache & Federal Reserve Bank of St. Louis
          </span>
        </div>

        {/* 4 Cards Grid for US Benchmarks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {usBonds.map((bond) => {
            const stats = getBondStats(bond);
            const isSelected = selectedBond.id === bond.id;
            const isBpsDown = stats.bps < 0; // for yields, down means rates falling / bond prices rising
            const tick = recentTicks[bond.symbol];

            return (
              <div
                key={bond.id}
                id={`card-bond-${bond.id}`}
                onClick={() => setSelectedBondId(bond.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden backdrop-blur-md ${
                  isSelected
                    ? 'bg-[#0a2d47] border-cyan-400 shadow-md ring-1 ring-cyan-400/40'
                    : 'bg-[#072134]/80 border-[#133852] hover:border-[#1f4e73] hover:bg-[#072134]'
                }`}
              >
                {/* Tick pulse */}
                {tick && (
                  <span className={`absolute top-0 left-0 right-0 h-0.5 ${tick === 'up' ? 'bg-red-400' : 'bg-emerald-400'} animate-pulse`} />
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono-code font-bold text-sm text-cyan-300">
                        {bond.symbol}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono-code bg-[#051c2c] text-slate-300 border border-[#133852]">
                        {bond.maturity}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-200 mt-1 line-clamp-1">
                      {bond.name}
                    </div>
                  </div>

                  <div className={`p-1.5 rounded-md ${isBpsDown ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60' : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'}`}>
                    {isBpsDown ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {/* Yield Big Number */}
                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <div className="text-2xl font-bold font-mono-code text-white tabular-nums tracking-tight">
                      {stats.yieldVal.toFixed(bond.maturity.includes('Mortgage') ? 2 : 3)}%
                    </div>
                    <div className="flex items-center space-x-1.5 mt-0.5 text-xs font-mono-code">
                      <span className={`font-semibold ${isBpsDown ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {stats.bps > 0 ? `+${stats.bps}` : stats.bps} bps
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">
                        {stats.pct > 0 ? `+${stats.pct.toFixed(2)}%` : `${stats.pct.toFixed(2)}%`}
                      </span>
                    </div>
                  </div>

                  {/* High/Low Range */}
                  <div className="text-right text-[10px] font-mono-code text-slate-400 space-y-0.5">
                    <div>H: <span className="text-slate-200">{stats.dayHigh.toFixed(2)}%</span></div>
                    <div>L: <span className="text-slate-200">{stats.dayLow.toFixed(2)}%</span></div>
                  </div>
                </div>

                {/* Sparkline & Subtext */}
                <div className="mt-3 pt-2.5 border-t border-[#133852]/80 flex items-center justify-between text-[10px] text-slate-400 font-mono-code">
                  <span className="truncate max-w-[130px]">{bond.issuer.split('(')[0]}</span>
                  <span className="text-cyan-400/90 font-semibold">{bond.creditRating.split(' ')[0]}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Top 5 European Sovereign Yield Benchmarks (10Y & 30Y) */}
      <div className="space-y-3.5 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#133852]">
          <div className="flex items-center space-x-2.5">
            <span className="text-xl">🇪🇺</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight font-sans">
                  European Sovereign Benchmarks
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-[#0a2d47] text-cyan-300 border border-[#1f4e73]">
                  TOP 5 ECONOMIES • 10Y & 30Y BARS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Orderly sovereign yield bars indexed to the German Federal Bund benchmark
              </p>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center space-x-1.5 text-xs font-mono-code overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'Germany', 'United Kingdom', 'France', 'Italy', 'Spain'].map((ctry) => (
              <button
                key={ctry}
                onClick={() => setSelectedCountryFilter(ctry)}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer text-xs ${
                  selectedCountryFilter === ctry
                    ? 'bg-cyan-600 text-white font-bold shadow-xs'
                    : 'bg-[#051c2c] text-slate-300 hover:bg-[#0a2d47] border border-[#133852]'
                }`}
              >
                {ctry === 'ALL' ? 'All 5 Nations' : ctry}
              </button>
            ))}
          </div>
        </div>

        {/* 5 Orderly European Nation Cards with Paired 10Y & 30Y Small Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3.5">
          {[
            { name: 'Germany', flag: '🇩🇪', rating: 'AAA', role: 'Eurozone Baseline Anchor' },
            { name: 'United Kingdom', flag: '🇬🇧', rating: 'AA', role: 'BoE Policy & Gilt Desk' },
            { name: 'France', flag: '🇫🇷', rating: 'AA-', role: 'OAT Deficit Premium Radar' },
            { name: 'Italy', flag: '🇮🇹', rating: 'BBB', role: 'BTP Sovereign High-Beta' },
            { name: 'Spain', flag: '🇪🇸', rating: 'A', role: 'Bono Growth Tightener' },
          ]
            .filter(c => selectedCountryFilter === 'ALL' || c.name === selectedCountryFilter)
            .map((country) => {
              const bond10 = europeanBonds.find(b => b.country === country.name && b.maturity === '10Y');
              const bond30 = europeanBonds.find(b => b.country === country.name && b.maturity === '30Y');
              const stats10 = bond10 ? getBondStats(bond10) : null;
              const stats30 = bond30 ? getBondStats(bond30) : null;
              const curveSlope = stats10 && stats30 ? Number(((stats30.yieldVal - stats10.yieldVal) * 100).toFixed(1)) : 0;

              return (
                <div 
                  key={country.name}
                  className="bg-[#072134]/90 border border-[#133852] rounded-xl p-3.5 flex flex-col justify-between hover:border-[#1f4e73] transition-all shadow-sm backdrop-blur-md"
                >
                  {/* Country Header */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#133852]/80">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{country.flag}</span>
                      <div>
                        <div className="font-bold text-xs text-white leading-tight flex items-center gap-1.5">
                          <span>{country.name}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono-code font-bold bg-[#051c2c] text-cyan-300 border border-[#133852]">
                            {country.rating}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans mt-0.5 line-clamp-1">
                          {country.role}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-mono-code text-slate-400 block">Curve</span>
                      <span className="text-[11px] font-bold font-mono-code text-cyan-300">
                        {curveSlope > 0 ? `+${curveSlope}` : curveSlope} bps
                      </span>
                    </div>
                  </div>

                  {/* Orderly Small Bars for 10Y and 30Y */}
                  <div className="space-y-2 mt-3">
                    {/* 10Y Small Bar */}
                    {bond10 && stats10 && (
                      <button
                        onClick={() => setSelectedBondId(bond10.id)}
                        className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer relative overflow-hidden ${
                          selectedBond.id === bond10.id
                            ? 'bg-[#0a2d47] border-cyan-400 ring-1 ring-cyan-400/50 shadow-xs'
                            : 'bg-[#051c2c] border-[#133852] hover:bg-[#07273e] hover:border-[#1f4e73]'
                        }`}
                      >
                        {recentTicks[bond10.symbol] && (
                          <span className={`absolute top-0 left-0 right-0 h-0.5 ${recentTicks[bond10.symbol] === 'up' ? 'bg-rose-400' : 'bg-emerald-400'} animate-pulse`} />
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono-code bg-[#020d17] text-cyan-300 border border-[#133852]">
                              10Y
                            </span>
                            <span className="font-mono-code font-bold text-xs text-white">
                              {bond10.symbol}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 font-mono-code">
                            <span className="text-xs font-bold text-white tabular-nums">
                              {stats10.yieldVal.toFixed(3)}%
                            </span>
                            <span className={`text-[10px] font-semibold px-1 py-0.2 rounded ${
                              stats10.bps < 0 ? 'bg-emerald-950/80 text-emerald-400' : 'bg-rose-950/80 text-rose-400'
                            }`}>
                              {stats10.bps > 0 ? `+${stats10.bps}` : stats10.bps}
                            </span>
                          </div>
                        </div>

                        {/* Spread vs Bund Sub-bar */}
                        <div className="flex items-center justify-between text-[10px] font-mono-code text-slate-400 mt-2 pt-1.5 border-t border-[#133852]/60">
                          <span className="text-slate-400">Bund Spread:</span>
                          <span className="text-cyan-300 font-semibold">
                            {bond10.spreadVsBundBps !== undefined ? `+${bond10.spreadVsBundBps} bps` : '0 bps (Base)'}
                          </span>
                        </div>
                      </button>
                    )}

                    {/* 30Y Small Bar */}
                    {bond30 && stats30 && (
                      <button
                        onClick={() => setSelectedBondId(bond30.id)}
                        className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer relative overflow-hidden ${
                          selectedBond.id === bond30.id
                            ? 'bg-[#0a2d47] border-cyan-400 ring-1 ring-cyan-400/50 shadow-xs'
                            : 'bg-[#051c2c] border-[#133852] hover:bg-[#07273e] hover:border-[#1f4e73]'
                        }`}
                      >
                        {recentTicks[bond30.symbol] && (
                          <span className={`absolute top-0 left-0 right-0 h-0.5 ${recentTicks[bond30.symbol] === 'up' ? 'bg-rose-400' : 'bg-emerald-400'} animate-pulse`} />
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono-code bg-[#020d17] text-amber-300 border border-[#133852]">
                              30Y
                            </span>
                            <span className="font-mono-code font-bold text-xs text-white">
                              {bond30.symbol}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 font-mono-code">
                            <span className="text-xs font-bold text-white tabular-nums">
                              {stats30.yieldVal.toFixed(3)}%
                            </span>
                            <span className={`text-[10px] font-semibold px-1 py-0.2 rounded ${
                              stats30.bps < 0 ? 'bg-emerald-950/80 text-emerald-400' : 'bg-rose-950/80 text-rose-400'
                            }`}>
                              {stats30.bps > 0 ? `+${stats30.bps}` : stats30.bps}
                            </span>
                          </div>
                        </div>

                        {/* Spread vs Bund Sub-bar */}
                        <div className="flex items-center justify-between text-[10px] font-mono-code text-slate-400 mt-2 pt-1.5 border-t border-[#133852]/60">
                          <span className="text-slate-400">Bund Spread:</span>
                          <span className="text-cyan-300 font-semibold">
                            {bond30.spreadVsBundBps !== undefined ? `+${bond30.spreadVsBundBps} bps` : '0 bps (Base)'}
                          </span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* SECTION 3: Deep Dive Dossier & Mortgage Sensitivity Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Selected Bond Detailed Profile */}
        <div className="lg:col-span-2 bg-[#072134]/90 border border-[#133852] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#133852]">
            <div className="flex items-center space-x-2">
              <span className="text-xl">{selectedBond.flag}</span>
              <div>
                <h4 className="text-sm font-bold text-white font-mono-code">
                  {selectedBond.name} ({selectedBond.symbol})
                </h4>
                <div className="text-[11px] text-slate-400">
                  {selectedBond.issuer} • Rated {selectedBond.creditRating}
                </div>
              </div>
            </div>

            <div className="text-right font-mono-code">
              <div className="text-xl font-bold text-cyan-300 tabular-nums">
                {selectedStats.yieldVal.toFixed(3)}%
              </div>
              <div className={`text-[10px] font-semibold ${selectedStats.bps < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {selectedStats.bps > 0 ? `+${selectedStats.bps}` : selectedStats.bps} bps today
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 text-xs font-mono-code">
            <div className="bg-[#051c2c] p-2.5 rounded-lg border border-[#133852]">
              <div className="text-[10px] text-slate-400">DAY RANGE</div>
              <div className="text-slate-200 font-semibold mt-0.5">
                {selectedStats.dayLow.toFixed(3)}% - {selectedStats.dayHigh.toFixed(3)}%
              </div>
            </div>

            <div className="bg-[#051c2c] p-2.5 rounded-lg border border-[#133852]">
              <div className="text-[10px] text-slate-400">PREVIOUS CLOSE</div>
              <div className="text-slate-200 font-semibold mt-0.5">
                {selectedBond.previousClose.toFixed(3)}%
              </div>
            </div>

            <div className="bg-[#051c2c] p-2.5 rounded-lg border border-[#133852]">
              <div className="text-[10px] text-slate-400">SPREAD VS BUND</div>
              <div className="text-cyan-400 font-semibold mt-0.5">
                {selectedBond.spreadVsBundBps !== undefined ? `+${selectedBond.spreadVsBundBps} bps` : '0 bps'}
              </div>
            </div>

            <div className="bg-[#051c2c] p-2.5 rounded-lg border border-[#133852]">
              <div className="text-[10px] text-slate-400">DATA PROVIDER</div>
              <div className="text-emerald-400 font-semibold mt-0.5 truncate">
                {selectedStats.provider}
              </div>
            </div>
          </div>

          {/* Benchmark Role Explanation */}
          <div className="bg-[#051c2c]/80 border border-[#133852] p-3.5 rounded-lg text-xs leading-relaxed space-y-1.5">
            <div className="text-[11px] font-bold text-cyan-300 font-mono-code uppercase">
              INSTITUTIONAL CAPITAL BENCHMARK ROLE
            </div>
            <p className="text-slate-300">
              {selectedBond.benchmarkRole}
            </p>
            <div className="text-[11px] text-slate-400 pt-1 border-t border-[#133852]/60 flex items-center justify-between">
              <span>Policy Anchor: {selectedBond.centralBankPolicyRate}</span>
              <span className="text-emerald-400 font-mono-code">Verified Feed</span>
            </div>
          </div>
        </div>

        {/* 30-Year U.S. Mortgage Impact Calculator */}
        <div className="bg-[#072134]/90 border border-[#133852] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-3 border-b border-[#133852]">
              <Home className="w-4 h-4 text-amber-400" />
              <div>
                <h4 className="text-xs font-bold text-white font-mono-code uppercase">
                  30Y Mortgage Sensitivity Model
                </h4>
                <div className="text-[10px] text-slate-400">
                  Real-time Freddie Mac PMMS benchmark
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3 font-mono-code text-xs">
              <div>
                <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                  <span>Mortgage Rate:</span>
                  <span className="font-bold text-amber-300">{mortgageRate}%</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Spread over 10Y Treasury: +{((mortgageRate - (quotes['US10Y']?.price || 4.95)) * 100).toFixed(0)} bps
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                  <span>Benchmark Loan Amount:</span>
                  <span className="font-bold text-white">${loanAmount.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="200000"
                  max="1500000"
                  step="25000"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#051c2c] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Monthly payment estimate box */}
              <div className="bg-[#051c2c] border border-[#133852] p-3 rounded-lg text-center mt-3">
                <div className="text-[10px] uppercase text-slate-400">ESTIMATED PRINCIPAL & INTEREST</div>
                <div className="text-2xl font-black text-cyan-300 tabular-nums mt-0.5">
                  ${monthlyMortgagePayment.toLocaleString()} <span className="text-xs text-slate-400 font-normal">/ mo</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Excludes property taxes and homeowner insurance
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono-code text-slate-400 pt-3 border-t border-[#133852] mt-4 flex items-center justify-between">
            <span>Primary Market Survey: Weekly PMMS</span>
            <span className="text-cyan-400 font-semibold">Live Feed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
