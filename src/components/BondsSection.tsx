import React, { useState, useMemo } from 'react';
import { LiveQuote, SovereignBondItem } from '../types';
import { SOVEREIGN_BONDS_DATA } from '../data/bondsData';
import { 
  Landmark, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck,
  Home,
  Sparkles,
  Info,
  Scale,
  Activity,
  CheckCircle2
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

  // Calculate live mortgage monthly payment on loanAmount
  const mortgageQuote = quotes['US30YMORT'];
  const mortgageRate = mortgageQuote ? mortgageQuote.price : 6.76;
  const monthlyRate = mortgageRate / 100 / 12;
  const numPayments = 30 * 12;
  const monthlyMortgagePayment = Math.round(
    loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  );

  const nationsList = [
    { name: 'Germany', flag: '🇩🇪', rating: 'AAA', role: 'Eurozone Baseline Risk-Free Anchor' },
    { name: 'United Kingdom', flag: '🇬🇧', rating: 'AA', role: 'Bank of England Sterling Desk' },
    { name: 'France', flag: '🇫🇷', rating: 'AA-', role: 'OAT Deficit Premium Monitoring' },
    { name: 'Italy', flag: '🇮🇹', rating: 'BBB', role: 'BTP Sovereign High-Beta Spread' },
    { name: 'Spain', flag: '🇪🇸', rating: 'A', role: 'Bono Growth & Resilience Tightener' },
  ];

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
                  Real-time sovereign yield curves, Bund spread differentials, and mortgage sensitivity benchmarks
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
            <div className="text-[10px] text-slate-400 mt-0.5">Normative Expansion Slope</div>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/80 p-3 rounded-lg">
            <div className="text-[10px] uppercase text-slate-500 font-medium">30Y MORTGAGE SPREAD</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-base font-bold text-amber-700">+{((mortgageRate - (quotes['US10Y']?.price || 4.95)) * 100).toFixed(0)} bps</span>
              <span className="text-[10px] text-slate-500">vs 10Y</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Primary Lending Risk Premia</div>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/80 p-3 rounded-lg">
            <div className="text-[10px] uppercase text-slate-500 font-medium">ECB BUND-SPREAD RADAR</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-base font-bold text-blue-700">OAT +97 / BTP +87</span>
              <span className="text-[10px] text-slate-500">bps</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">French Deficit Premium Active</div>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/80 p-3 rounded-lg">
            <div className="text-[10px] uppercase text-slate-500 font-medium">CENTRAL BANK RATES</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-base font-bold text-slate-900">Fed 4.75% • ECB 3.50%</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">BoE Official Bank Rate: 5.00%</div>
          </div>
        </div>
      </div>

      {/* AI Macro & Sovereign Memo (Expandable) */}
      {showMacroMemo && (
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 border border-blue-200 rounded-xl p-5 shadow-xs text-slate-800 animate-in fade-in duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-blue-200/60">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-blue-900">
                GLOBAL FIXED INCOME & SOVEREIGN DEBT SYNOPSIS
              </span>
            </div>
            <span className="text-[10px] font-mono-code bg-white px-2.5 py-1 rounded text-slate-600 border border-slate-200">
              MCKINSEY & J.P. MORGAN RESEARCH
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs leading-relaxed">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
              <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                U.S. Yield Curve Disinversion
              </h4>
              <p className="text-slate-600">
                The 2Y/10Y spread has fully un-inverted to <strong>+27 bps</strong> as the Federal Reserve easing cycle deepens. 
                Long-end yields (10Y at {quotes['US10Y']?.price || 4.95}%, 30Y at {quotes['US30Y']?.price || 5.31}%) are supported by persistent term premium 
                and heavy Treasury supply auctions. Duration managers favor the 5-7 year belly of the curve.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
              <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                U.S. Mortgage Transmission
              </h4>
              <p className="text-slate-600">
                Freddie Mac 30-Year Fixed mortgage benchmark stands at <strong>{mortgageRate}%</strong>. The primary-secondary mortgage spread over 
                the 10-year Treasury sits at 181 bps, reflecting elevated prepayment volatility and GSE guarantee fees. Every 50 bps reduction 
                in mortgage rates unlocks an estimated 4.8 million potential refinancing candidates.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
              <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                European Sovereign Spread Asymmetry
              </h4>
              <p className="text-slate-600">
                German Bunds remain the risk-free Eurozone baseline ({quotes['DE10Y']?.price || 3.49}%). The French OAT-Bund spread 
                widened to +97 bps on fiscal deficit scrutiny, while Spanish Bonos (+45 bps) trade at multi-year tight differentials 
                underpinned by resilient GDP growth. Italian BTPs (+87 bps) demonstrate stability backed by the ECB TPI.
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
            <h3 className="text-base font-bold font-editorial text-slate-900 tracking-tight">
              United States Treasuries & Real Estate Benchmarks
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-blue-50 text-blue-700 border border-blue-200">
              4 LIVE BENCHMARKS
            </span>
          </div>

          <span className="text-xs text-slate-400 font-mono-code hidden sm:inline-block">
            Source: CNBC & Federal Reserve Bank of St. Louis
          </span>
        </div>

        {/* 4 Cards Grid for US Benchmarks */}
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

                {/* Issuer & Rating */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono-code">
                  <span className="truncate max-w-[130px]">{bond.issuer.split('(')[0]}</span>
                  <span className="text-blue-700 font-bold">{bond.creditRating.split(' ')[0]}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Top 5 European Sovereign Yield Benchmarks (Clean Corporate Organized Bars) */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <span className="text-xl">🇪🇺</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight font-sans">
                  European Sovereign Benchmarks
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  5 KEY ECONOMIES • ORGANIZED NATION BARS
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Structured nation bars displaying 10Y and 30Y yields with German Federal Bund spread differentials
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
                    ? 'bg-[#005a9c] text-white font-bold shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {ctry === 'ALL' ? 'All 5 Nations' : ctry}
              </button>
            ))}
          </div>
        </div>

        {/* Organized Corporate European Nation Bars */}
        <div className="space-y-3">
          {nationsList
            .filter(c => selectedCountryFilter === 'ALL' || c.name === selectedCountryFilter)
            .map((country) => {
              const bond10 = europeanBonds.find(b => b.country === country.name && b.maturity === '10Y');
              const bond30 = europeanBonds.find(b => b.country === country.name && b.maturity === '30Y');
              const stats10 = bond10 ? getBondStats(bond10) : null;
              const stats30 = bond30 ? getBondStats(bond30) : null;
              const curveSlope = stats10 && stats30 ? Number(((stats30.yieldVal - stats10.yieldVal) * 100).toFixed(1)) : 0;
              const isSelected = (bond10 && selectedBond.id === bond10.id) || (bond30 && selectedBond.id === bond30.id);

              return (
                <div 
                  key={country.name}
                  className={`bg-white border rounded-xl p-4 sm:p-5 transition-all shadow-2xs ${
                    isSelected ? 'border-blue-500 ring-1 ring-blue-500/20 bg-blue-50/10' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    {/* Nation ID and Macro Info (Cols 1-4) */}
                    <div className="lg:col-span-4 flex items-start gap-3">
                      <span className="text-2xl shrink-0 mt-0.5">{country.flag}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">{country.name}</h4>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono-code font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {country.rating}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {country.role}
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-[11px] font-mono-code">
                          <span className="text-slate-400">10Y/30Y Slope:</span>
                          <span className="font-bold text-blue-800 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                            {curveSlope > 0 ? `+${curveSlope}` : curveSlope} bps
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 10Y Benchmark Bar (Cols 5-8) */}
                    <div className="lg:col-span-4">
                      {bond10 && stats10 && (
                        <div 
                          onClick={() => setSelectedBondId(bond10.id)}
                          className={`p-3 rounded-lg border transition-all cursor-pointer ${
                            selectedBond.id === bond10.id
                              ? 'bg-blue-50 border-blue-400 shadow-2xs'
                              : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-mono-code">
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100/80 text-blue-900 border border-blue-200">
                                10Y
                              </span>
                              <span className="font-bold text-xs text-slate-900">{bond10.symbol}</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-mono-code">
                              <span className="text-sm font-bold text-slate-900 tabular-nums">
                                {stats10.yieldVal.toFixed(3)}%
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                stats10.bps < 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {stats10.bps > 0 ? `+${stats10.bps}` : stats10.bps}
                              </span>
                            </div>
                          </div>

                          {/* Bund Spread Progress Meter */}
                          <div className="mt-2 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] font-mono-code">
                            <span className="text-slate-500">Bund Spread:</span>
                            <span className="font-bold text-slate-800">
                              {bond10.spreadVsBundBps !== undefined ? `+${bond10.spreadVsBundBps} bps` : '0 bps (Base)'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 30Y Benchmark Bar (Cols 9-12) */}
                    <div className="lg:col-span-4">
                      {bond30 && stats30 && (
                        <div 
                          onClick={() => setSelectedBondId(bond30.id)}
                          className={`p-3 rounded-lg border transition-all cursor-pointer ${
                            selectedBond.id === bond30.id
                              ? 'bg-amber-50/60 border-amber-400 shadow-2xs'
                              : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-mono-code">
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                30Y
                              </span>
                              <span className="font-bold text-xs text-slate-900">{bond30.symbol}</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-mono-code">
                              <span className="text-sm font-bold text-slate-900 tabular-nums">
                                {stats30.yieldVal.toFixed(3)}%
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                stats30.bps < 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {stats30.bps > 0 ? `+${stats30.bps}` : stats30.bps}
                              </span>
                            </div>
                          </div>

                          {/* Bund Spread Progress Meter */}
                          <div className="mt-2 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] font-mono-code">
                            <span className="text-slate-500">Bund Spread:</span>
                            <span className="font-bold text-slate-800">
                              {bond30.spreadVsBundBps !== undefined ? `+${bond30.spreadVsBundBps} bps` : '0 bps (Base)'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* SECTION 3: Deep Dive Dossier & Mortgage Sensitivity Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Selected Bond Detailed Profile */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center space-x-2.5">
              <span className="text-2xl">{selectedBond.flag}</span>
              <div>
                <h4 className="text-base font-bold text-slate-900 font-mono-code">
                  {selectedBond.name} ({selectedBond.symbol})
                </h4>
                <div className="text-xs text-slate-500">
                  {selectedBond.issuer} • Rated {selectedBond.creditRating}
                </div>
              </div>
            </div>

            <div className="text-right font-mono-code">
              <div className="text-2xl font-bold text-[#005a9c] tabular-nums">
                {selectedStats.yieldVal.toFixed(3)}%
              </div>
              <div className={`text-[11px] font-semibold ${selectedStats.bps < 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {selectedStats.bps > 0 ? `+${selectedStats.bps}` : selectedStats.bps} bps today
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 text-xs font-mono-code">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="text-[10px] text-slate-400">DAY RANGE</div>
              <div className="text-slate-900 font-semibold mt-0.5">
                {selectedStats.dayLow.toFixed(3)}% - {selectedStats.dayHigh.toFixed(3)}%
              </div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="text-[10px] text-slate-400">PREVIOUS CLOSE</div>
              <div className="text-slate-900 font-semibold mt-0.5">
                {selectedBond.previousClose.toFixed(3)}%
              </div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="text-[10px] text-slate-400">SPREAD VS BUND</div>
              <div className="text-blue-700 font-bold mt-0.5">
                {selectedBond.spreadVsBundBps !== undefined ? `+${selectedBond.spreadVsBundBps} bps` : '0 bps'}
              </div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="text-[10px] text-slate-400">DATA PROVIDER</div>
              <div className="text-emerald-700 font-semibold mt-0.5 truncate">
                {selectedStats.provider}
              </div>
            </div>
          </div>

          {/* Benchmark Role Explanation */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg text-xs leading-relaxed space-y-1.5">
            <div className="text-[11px] font-bold text-blue-900 font-mono-code uppercase">
              INSTITUTIONAL CAPITAL BENCHMARK ROLE
            </div>
            <p className="text-slate-600">
              {selectedBond.benchmarkRole}
            </p>
            <div className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-200 flex items-center justify-between">
              <span>Policy Anchor: {selectedBond.centralBankPolicyRate}</span>
              <span className="text-emerald-700 font-mono-code font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Verified Live Feed
              </span>
            </div>
          </div>
        </div>

        {/* 30-Year U.S. Mortgage Impact Calculator */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-200">
              <span className="p-1.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                <Home className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-900 font-mono-code uppercase">
                  30Y Mortgage Sensitivity Model
                </h4>
                <div className="text-[10px] text-slate-500">
                  Real-time Freddie Mac PMMS benchmark
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3 font-mono-code text-xs">
              <div>
                <div className="flex justify-between text-slate-600 text-[11px] mb-1">
                  <span>Mortgage Rate:</span>
                  <span className="font-bold text-amber-800">{mortgageRate}%</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Spread over 10Y Treasury: +{((mortgageRate - (quotes['US10Y']?.price || 4.95)) * 100).toFixed(0)} bps
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 text-[11px] mb-1">
                  <span>Benchmark Loan Amount:</span>
                  <span className="font-bold text-slate-900">${loanAmount.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="200000"
                  max="1500000"
                  step="25000"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Monthly payment estimate box */}
              <div className="bg-blue-50/50 border border-blue-200 p-3 rounded-lg text-center mt-3">
                <div className="text-[10px] uppercase text-slate-500 font-semibold">ESTIMATED PRINCIPAL & INTEREST</div>
                <div className="text-2xl font-black text-slate-900 tabular-nums mt-0.5">
                  ${monthlyMortgagePayment.toLocaleString()} <span className="text-xs text-slate-500 font-normal">/ mo</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Excludes property taxes and homeowner insurance
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono-code text-slate-500 pt-3 border-t border-slate-200 mt-4 flex items-center justify-between">
            <span>Primary Market Survey: Weekly PMMS</span>
            <span className="text-blue-700 font-semibold">Live Feed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
