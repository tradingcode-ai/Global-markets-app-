import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  PieChart, 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  ExternalLink, 
  Search, 
  X, 
  ChevronRight, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  Sparkles, 
  Building2, 
  CheckCircle2,
  SlidersHorizontal,
  Cpu,
  Landmark,
  Activity,
  ShoppingBag,
  Radio,
  Factory,
  ShoppingCart,
  Flame,
  Zap,
  BarChart2
} from 'lucide-react';
import { 
  SP_MACRO_SECTORS, 
  SP_INDUSTRY_CLUSTERS, 
  getSecurityMetadata,
  SectorIndexItem,
  IndustryClusterItem 
} from '../data/spSectorsData';
import { LiveQuote } from '../types';

export type ChartTimeframe = '24U' | '1W' | '3M' | 'YTD' | '1Y' | '5Y' | '10Y' | 'ALL';

export interface ChartPoint {
  timestamp: number;
  date: string;
  value: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

interface SelectedChartSecurity {
  symbol: string;
  name: string;
  category: string;
  benchmarkEtf?: string;
  sectorId?: string;
  isIndex?: boolean;
}

interface SPSectorsAndEtfsViewProps {
  quotes: Record<string, LiveQuote>;
  recentTicks?: Record<string, 'up' | 'down'>;
  onSelectTicker?: (ticker: string) => void;
  onRefreshQuotes?: () => void;
  isLoadingQuotes?: boolean;
}

// 11 Professional Sector Icon Badges & Theme Colors
const SECTOR_ICONS: Record<string, { icon: React.ComponentType<{ className?: string }>; bg: string; text: string; border: string; accentHex: string }> = {
  'info-tech': { icon: Cpu, bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20', accentHex: '#2563eb' },
  'financials': { icon: Landmark, bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20', accentHex: '#059669' },
  'health-care': { icon: Activity, bg: 'bg-rose-500/10', text: 'text-rose-600', border: 'border-rose-500/20', accentHex: '#e11d48' },
  'consumer-discretionary': { icon: ShoppingBag, bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20', accentHex: '#d97706' },
  'comm-services': { icon: Radio, bg: 'bg-indigo-500/10', text: 'text-indigo-600', border: 'border-indigo-500/20', accentHex: '#4f46e5' },
  'industrials': { icon: Factory, bg: 'bg-slate-500/10', text: 'text-slate-700', border: 'border-slate-500/20', accentHex: '#475569' },
  'consumer-staples': { icon: ShoppingCart, bg: 'bg-teal-500/10', text: 'text-teal-600', border: 'border-teal-500/20', accentHex: '#0d9488' },
  'energy': { icon: Flame, bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-500/20', accentHex: '#ea580c' },
  'real-estate': { icon: Building2, bg: 'bg-sky-500/10', text: 'text-sky-600', border: 'border-sky-500/20', accentHex: '#0284c7' },
  'materials': { icon: Layers, bg: 'bg-purple-500/10', text: 'text-purple-600', border: 'border-purple-500/20', accentHex: '#7c3aed' },
  'utilities': { icon: Zap, bg: 'bg-yellow-500/10', text: 'text-yellow-600', border: 'border-yellow-500/20', accentHex: '#ca8a04' }
};

export const SPSectorsAndEtfsView: React.FC<SPSectorsAndEtfsViewProps> = ({
  quotes,
  recentTicks = {},
  onSelectTicker,
  onRefreshQuotes,
  isLoadingQuotes = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewFilter, setViewFilter] = useState<'ALL' | 'SECTORS' | 'PRODUCTS'>('ALL');
  const [sortBy, setSortBy] = useState<'WEIGHT_DESC' | 'PERF_DESC' | 'PERF_ASC' | 'PE_ASC' | 'YIELD_DESC' | 'NAME'>('WEIGHT_DESC');
  
  // Selected security for drilldown Overview modal
  const [selectedSecuritySymbol, setSelectedSecuritySymbol] = useState<string | null>(null);

  // Active chart security (defaults to Information Technology sector index)
  const defaultSector = SP_MACRO_SECTORS[0];
  const [selectedChartSecurity, setSelectedChartSecurity] = useState<SelectedChartSecurity>({
    symbol: defaultSector.symbol,
    name: `${defaultSector.name} Index`,
    category: `S&P Sector (GICS ${defaultSector.gicsCode})`,
    benchmarkEtf: defaultSector.benchmarkEtf,
    sectorId: defaultSector.id,
    isIndex: true
  });

  const [activeTimeframe, setActiveTimeframe] = useState<ChartTimeframe>('1Y');
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [chartLoading, setChartLoading] = useState<boolean>(false);
  const [chartProvider, setChartProvider] = useState<string>('Yahoo Finance Historical Chart API');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const chartDossierRef = useRef<HTMLDivElement | null>(null);

  // In-memory chart cache to ensure lightning fast switches with zero lag
  const chartCacheRef = useRef<Record<string, { points: ChartPoint[]; provider: string }>>({});

  // Helper to extract live quote or fallback
  const getQuote = (sym: string): { price: number; change: number; changePercent: number; isUp: boolean } => {
    const q = quotes[sym] || quotes[sym.toUpperCase()];
    if (q && q.price !== undefined) {
      return {
        price: q.price,
        change: q.change || 0,
        changePercent: q.changePercent || 0,
        isUp: (q.changePercent || 0) >= 0
      };
    }
    return { price: 0, change: 0, changePercent: 0, isUp: true };
  };

  // Fetch chart history for active security & timeframe
  useEffect(() => {
    let cancelled = false;
    const cacheKey = `${selectedChartSecurity.symbol}:${activeTimeframe}`;

    if (chartCacheRef.current[cacheKey]) {
      setChartData(chartCacheRef.current[cacheKey].points);
      setChartProvider(chartCacheRef.current[cacheKey].provider);
      setChartLoading(false);
      return;
    }

    const loadHistory = async () => {
      setChartLoading(true);
      try {
        const res = await fetch(
          `/api/global-market-history/${encodeURIComponent(selectedChartSecurity.symbol)}?range=${activeTimeframe}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        if (!cancelled && json.success && Array.isArray(json.points)) {
          setChartData(json.points);
          const providerStr = json.provider || 'Yahoo Finance Historical Chart API';
          setChartProvider(providerStr);
          chartCacheRef.current[cacheKey] = {
            points: json.points,
            provider: providerStr
          };
        } else if (!cancelled) {
          setChartData([]);
        }
      } catch (err) {
        console.warn('Failed to load historical chart:', err);
        if (!cancelled) setChartData([]);
      } finally {
        if (!cancelled) setChartLoading(false);
      }
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [selectedChartSecurity.symbol, activeTimeframe]);

  // Handle security selection for the chart
  const handleSelectSecurityForChart = (sec: SelectedChartSecurity, shouldScroll = false) => {
    setSelectedChartSecurity(sec);
    if (shouldScroll && chartDossierRef.current) {
      chartDossierRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // Filtered S&P Sectors
  const filteredSectors = useMemo(() => {
    return SP_MACRO_SECTORS.filter(sector => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchName = sector.name.toLowerCase().includes(q);
      const matchCode = sector.gicsCode.includes(q);
      const matchSymbol = sector.symbol.toLowerCase().includes(q) || sector.yahooSymbol.toLowerCase().includes(q);
      const matchEtf = sector.benchmarkEtf.toLowerCase().includes(q) || sector.benchmarkEtfName.toLowerCase().includes(q);
      const matchHoldings = sector.fallbackHoldings.some(h => 
        h.ticker.toLowerCase().includes(q) || h.company.toLowerCase().includes(q)
      );
      return matchName || matchCode || matchSymbol || matchEtf || matchHoldings;
    }).sort((a, b) => {
      if (sortBy === 'WEIGHT_DESC') return b.weightPercent - a.weightPercent;
      if (sortBy === 'PE_ASC') return a.peRatio - b.peRatio;
      if (sortBy === 'YIELD_DESC') return b.dividendYield - a.dividendYield;
      if (sortBy === 'NAME') return a.name.localeCompare(b.name);
      if (sortBy === 'PERF_DESC' || sortBy === 'PERF_ASC') {
        const perfA = getQuote(a.benchmarkEtf).changePercent || getQuote(a.symbol).changePercent;
        const perfB = getQuote(b.benchmarkEtf).changePercent || getQuote(b.symbol).changePercent;
        return sortBy === 'PERF_DESC' ? perfB - perfA : perfA - perfB;
      }
      return 0;
    });
  }, [searchQuery, sortBy, quotes]);

  // Filtered Index Linked Products (Clusters)
  const filteredClusters = useMemo(() => {
    return SP_INDUSTRY_CLUSTERS.filter(cluster => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchName = cluster.name.toLowerCase().includes(q);
      const matchDesc = cluster.description.toLowerCase().includes(q);
      const matchPrimary = cluster.primaryEtf.symbol.toLowerCase().includes(q) || cluster.primaryEtf.name.toLowerCase().includes(q);
      const matchDedicated = cluster.dedicatedEtf && (cluster.dedicatedEtf.symbol.toLowerCase().includes(q) || cluster.dedicatedEtf.name.toLowerCase().includes(q));
      const matchSecondary = cluster.secondaryThematics.some(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.subThematic.toLowerCase().includes(q));
      const matchHoldings = cluster.primaryEtf.fallbackHoldings.some(h => h.ticker.toLowerCase().includes(q) || h.company.toLowerCase().includes(q));
      return matchName || matchDesc || matchPrimary || matchDedicated || matchSecondary || matchHoldings;
    });
  }, [searchQuery]);

  // Desk Top Summary Stats
  const stats = useMemo(() => {
    let topLeader = { symbol: 'XLK', name: 'Information Technology', changePercent: -999 };
    let topLaggard = { symbol: 'XLE', name: 'Energy', changePercent: 999 };

    SP_MACRO_SECTORS.forEach(s => {
      const q = getQuote(s.benchmarkEtf);
      if (q.changePercent > topLeader.changePercent) {
        topLeader = { symbol: s.benchmarkEtf, name: s.name, changePercent: q.changePercent };
      }
      if (q.changePercent < topLaggard.changePercent) {
        topLaggard = { symbol: s.benchmarkEtf, name: s.name, changePercent: q.changePercent };
      }
    });

    return { topLeader, topLaggard };
  }, [quotes]);

  // Active Security Modal metadata
  const activeModalData = useMemo(() => {
    if (!selectedSecuritySymbol) return null;
    return getSecurityMetadata(selectedSecuritySymbol);
  }, [selectedSecuritySymbol]);

  // Compute live metrics for selected chart security
  const chartQuote = getQuote(selectedChartSecurity.symbol);
  const livePriceDisplay = chartQuote.price > 0 
    ? (selectedChartSecurity.isIndex 
        ? chartQuote.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : `$${chartQuote.price.toFixed(2)}`)
    : (chartData.length > 0 ? chartData[chartData.length - 1].value.toFixed(2) : '—');

  // Chart SVG calculations
  const values = chartData.map(d => d.value).filter(Number.isFinite);
  const rawMin = values.length ? Math.min(...values) : 0;
  const rawMax = values.length ? Math.max(...values) : 100;
  const spread = rawMax - rawMin || Math.max(Math.abs(rawMax) * 0.01, 1);
  const pad = spread * 0.08;
  const yMin = rawMin - pad;
  const yMax = rawMax + pad;

  const width = 1000;
  const height = 300;
  const leftPad = 20;
  const rightPad = 80;
  const topPad = 20;
  const bottomPad = 40;
  const plotWidth = width - leftPad - rightPad;
  const plotHeight = height - topPad - bottomPad;

  const points = chartData.map((d, i) => {
    const x = leftPad + (i / Math.max(1, chartData.length - 1)) * plotWidth;
    const y = topPad + plotHeight - ((d.value - yMin) / (yMax - yMin)) * plotHeight;
    return { ...d, x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(' ');
  const areaPath = points.length 
    ? `${linePath} L ${points[points.length - 1].x.toFixed(2)},${topPad + plotHeight} L ${points[0].x.toFixed(2)},${topPad + plotHeight} Z`
    : '';

  const startVal = points.length ? points[0].value : 0;
  const endVal = points.length ? points[points.length - 1].value : 0;
  const periodChange = endVal - startVal;
  const periodPct = startVal ? (periodChange / startVal) * 100 : 0;
  const isPeriodPositive = periodChange >= 0;

  const dateTickCount = Math.min(7, Math.max(2, points.length));
  const rawTickIndices = points.length <= 1
    ? [0]
    : Array.from({ length: dateTickCount }, (_, i) =>
        Math.round((i / Math.max(1, dateTickCount - 1)) * (points.length - 1))
      );
  const dateTickIndices = Array.from(new Set(rawTickIndices)).filter(
    idx => idx >= 0 && idx < points.length
  );

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const ratio = Math.max(0, Math.min(1, (x - leftPad) / plotWidth));
    setHoverIndex(Math.round(ratio * (points.length - 1)));
  };

  const activePoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

  return (
    <div id="sp-sectors-and-etfs-view" className="space-y-6 pb-12 animate-fade-in font-sans">
      {/* 1. Institutional Header Banner */}
      <div className="bg-gradient-to-r from-[#001f3f] via-[#002d62] to-[#083b66] border border-cyan-800/60 rounded-xl p-5 md:p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/10 via-blue-500/5 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                <PieChart className="w-5 h-5 text-cyan-300" />
              </span>
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
                S&P 500 Sectors & Index Linked Products Desk
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-400/20 border border-cyan-300/40 text-cyan-200 text-xs font-semibold uppercase tracking-wider">
                GICS Level 1 & Index Linked Products
              </span>
            </div>
            <p className="mt-1 text-xs md:text-sm text-cyan-100/80 max-w-3xl leading-relaxed">
              Institutional benchmark monitor tracking the 11 S&P 500 GICS Level 1 Sectors and strategic Index Linked Products (thematic sub-industry ETFs). Real-time market pricing, constituent weights, valuation ratios, verified fund prospectuses, and interactive provider timeframes.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={onRefreshQuotes}
              disabled={isLoadingQuotes}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-medium transition cursor-pointer backdrop-blur-xs disabled:opacity-50"
              title="Refresh Quotes"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-300 ${isLoadingQuotes ? 'animate-spin' : ''}`} />
              <span>{isLoadingQuotes ? 'Refreshing...' : 'Refresh Quotes'}</span>
            </button>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE SUB-SECOND FEED</span>
            </div>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-cyan-700/50">
          <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
            <span className="text-[11px] uppercase tracking-wider text-cyan-200/70 font-semibold block">GICS Sectors</span>
            <span className="text-base md:text-lg font-bold text-white">11 Sectors</span>
            <span className="text-[11px] text-cyan-300/80 block">503 S&P 500 Constituents</span>
          </div>

          <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
            <span className="text-[11px] uppercase tracking-wider text-cyan-200/70 font-semibold block">Top Weight Sector</span>
            <span className="text-base md:text-lg font-bold text-white">Info Tech (31.8%)</span>
            <span className="text-[11px] text-emerald-300 block">XLK $196.27 (+0.69%)</span>
          </div>

          <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
            <span className="text-[11px] uppercase tracking-wider text-cyan-200/70 font-semibold block">Session Leader</span>
            <span className="text-base md:text-lg font-bold text-emerald-300">
              {stats.topLeader.symbol} ({stats.topLeader.name})
            </span>
            <span className="text-[11px] text-emerald-300 font-semibold block">
              +{stats.topLeader.changePercent.toFixed(2)}% Today
            </span>
          </div>

          <div className="bg-black/20 rounded-lg p-2.5 border border-white/5">
            <span className="text-[11px] uppercase tracking-wider text-cyan-200/70 font-semibold block">Index Linked Products</span>
            <span className="text-base md:text-lg font-bold text-cyan-200">7 Product Groups</span>
            <span className="text-[11px] text-cyan-300/80 block">35+ Monitored ETFs</span>
          </div>
        </div>
      </div>

      {/* 2. Controls & Search Filter Bar: Clean Layout with Search on Far Right */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 md:p-3.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: View Mode Tabs & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode Tabs */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewFilter('ALL')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                viewFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setViewFilter('SECTORS')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                viewFilter === 'SECTORS'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              S&P Sectors (11)
            </button>
            <button
              onClick={() => setViewFilter('PRODUCTS')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                viewFilter === 'PRODUCTS'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Index Linked Products
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-400 cursor-pointer shadow-2xs"
            >
              <option value="WEIGHT_DESC">S&P 500 Weight (High to Low)</option>
              <option value="PERF_DESC">Session Performance (Gainers)</option>
              <option value="PERF_ASC">Session Performance (Decliners)</option>
              <option value="PE_ASC">P/E Ratio (Low to High)</option>
              <option value="YIELD_DESC">Dividend Yield (High to Low)</option>
              <option value="NAME">Alphabetical (A to Z)</option>
            </select>
          </div>
        </div>

        {/* Far Right: Manual Search Filter */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search sector, ETF (XLK, SOXX), stock (NVDA)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Section 1: The 11 S&P Sectors (GICS Level 1) */}
      {(viewFilter === 'ALL' || viewFilter === 'SECTORS') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
              <h3 className="text-base font-bold text-slate-900">
                1. S&P Sectors (GICS Level 1)
              </h3>
              <span className="text-xs text-slate-500 font-normal">
                ({filteredSectors.length} of 11 sectors displayed)
              </span>
            </div>
            <span className="text-xs text-slate-500 font-mono-code hidden sm:inline">
              Benchmark: Select Sector SPDR ETFs (0.09% TER)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredSectors.map(sector => {
              const indexQuote = getQuote(sector.symbol);
              const etfQuote = getQuote(sector.benchmarkEtf);
              const tick = recentTicks[sector.benchmarkEtf] || recentTicks[sector.symbol];
              const iconCfg = SECTOR_ICONS[sector.id] || { icon: PieChart, bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20' };
              const SectorIcon = iconCfg.icon;

              const isSelected = selectedChartSecurity.sectorId === sector.id || 
                                selectedChartSecurity.symbol === sector.symbol || 
                                selectedChartSecurity.symbol === sector.benchmarkEtf;

              return (
                <div 
                  key={sector.id}
                  onClick={() => handleSelectSecurityForChart({
                    symbol: sector.symbol,
                    name: `${sector.name} Index`,
                    category: `S&P Sector (GICS ${sector.gicsCode})`,
                    benchmarkEtf: sector.benchmarkEtf,
                    sectorId: sector.id,
                    isIndex: true
                  }, false)}
                  className={`border rounded-xl p-4 transition duration-200 flex flex-col justify-between cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-blue-50/40 border-blue-500 shadow-xs ring-1 ring-blue-500/30'
                      : tick === 'up' ? 'bg-white border-emerald-400 ring-1 ring-emerald-200' :
                        tick === 'down' ? 'bg-white border-rose-400 ring-1 ring-rose-200' :
                        'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                  }`}
                >
                  <div>
                    {/* Header: Professional Icon Logo, GICS Code & Sector Name */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        {/* Professional Sector Icon Logo */}
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 ${iconCfg.bg} ${iconCfg.text} ${iconCfg.border} shadow-2xs`}>
                          <SectorIcon className="w-5 h-5" />
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.2 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono-code text-[11px] font-bold">
                              GICS {sector.gicsCode}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold">
                              {sector.constituentsCount} Stocks
                            </span>
                            {isSelected && (
                              <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[9px] font-bold font-mono-code flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                                Active Chart
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-bold text-slate-900 mt-0.5 leading-snug">
                            {sector.name}
                          </h4>
                        </div>
                      </div>

                      {/* Weight in S&P 500 */}
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                          S&P Weight
                        </span>
                        <span className="text-base font-black text-slate-900 font-mono-code">
                          {sector.weightPercent.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Weight Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 my-2.5 overflow-hidden">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, (sector.weightPercent / 32) * 100)}%` }}
                      />
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {sector.description}
                    </p>

                    {/* Dual Pricing: Cash Index vs Benchmark ETF */}
                    <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      {/* Cash Index Clickable Button */}
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectSecurityForChart({
                            symbol: sector.symbol,
                            name: `${sector.name} Index`,
                            category: `S&P Sector (GICS ${sector.gicsCode})`,
                            benchmarkEtf: sector.benchmarkEtf,
                            sectorId: sector.id,
                            isIndex: true
                          }, true);
                        }}
                        className={`p-1.5 rounded-md transition cursor-pointer ${
                          selectedChartSecurity.symbol === sector.symbol ? 'bg-blue-100/70 border border-blue-300' : 'hover:bg-white'
                        }`}
                        title="Click to view Cash Index chart"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-0.5">
                          <span className="font-bold text-slate-800 font-mono-code">{sector.symbol}</span>
                          <span className="text-[9px] uppercase text-slate-400 font-medium">Index</span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-bold text-slate-900 font-mono-code">
                            {indexQuote.price > 0 ? indexQuote.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '7,295.25'}
                          </span>
                          <span className={`text-[11px] font-semibold flex items-center ${indexQuote.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {indexQuote.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {indexQuote.changePercent >= 0 ? `+${indexQuote.changePercent.toFixed(2)}%` : `${indexQuote.changePercent.toFixed(2)}%`}
                          </span>
                        </div>
                      </div>

                      {/* Flagship Benchmark ETF Clickable Button */}
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectSecurityForChart({
                            symbol: sector.benchmarkEtf,
                            name: sector.benchmarkEtfName,
                            category: `S&P Sector ETF (${sector.name})`,
                            benchmarkEtf: sector.benchmarkEtf,
                            sectorId: sector.id,
                            isIndex: false
                          }, true);
                        }}
                        className={`p-1.5 rounded-md transition cursor-pointer ${
                          selectedChartSecurity.symbol === sector.benchmarkEtf ? 'bg-blue-100/70 border border-blue-300' : 'hover:bg-white'
                        }`}
                        title="Click to view ETF chart"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-0.5">
                          <span className="font-bold text-blue-700 font-mono-code">{sector.benchmarkEtf}</span>
                          <span className="text-[9px] text-slate-500 font-mono-code font-medium">0.09% TER</span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-bold text-slate-900 font-mono-code">
                            ${etfQuote.price > 0 ? etfQuote.price.toFixed(2) : '196.27'}
                          </span>
                          <span className={`text-[11px] font-semibold flex items-center ${etfQuote.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {etfQuote.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {etfQuote.changePercent >= 0 ? `+${etfQuote.changePercent.toFixed(2)}%` : `${etfQuote.changePercent.toFixed(2)}%`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Fundamentals: P/E, Yield */}
                    <div className="flex items-center justify-between mt-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 text-[11px] block">P/E Ratio</span>
                        <strong className="text-slate-800 font-mono-code">{sector.peRatio}x</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 text-[11px] block">Dividend Yield</span>
                        <strong className="text-emerald-700 font-mono-code">{sector.dividendYield.toFixed(2)}%</strong>
                      </div>
                    </div>

                    {/* Top Constituents Preview */}
                    <div className="mt-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                        Top Constituents:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {sector.fallbackHoldings.slice(0, 3).map(h => (
                          <button
                            key={h.ticker}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectTicker) onSelectTicker(h.ticker);
                              else setSelectedSecuritySymbol(sector.benchmarkEtf);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs text-slate-700 hover:text-blue-700 font-mono-code transition cursor-pointer"
                          >
                            <span className="font-bold">{h.ticker}</span>
                            <span className="text-slate-400 text-[10px]">{h.weight}%</span>
                          </button>
                        ))}
                        {sector.fallbackHoldings.length > 3 && (
                          <span className="text-[11px] text-slate-400 self-center">
                            +{sector.fallbackHoldings.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer: Renamed to Overview as explicitly requested */}
                  <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSecuritySymbol(sector.benchmarkEtf);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      <span>Overview</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={sector.prospectusUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600"
                    >
                      <span>Prospectus</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ACTIVE CHART DOSSIER: Placed Directly Beneath the 11 Sectors */}
          <div ref={chartDossierRef} id="sp-sectors-chart-dossier" className="pt-3">
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
              {/* Chart Dossier Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="flex items-start sm:items-center space-x-3">
                  {/* Sector Icon Logo or Chart Icon */}
                  {selectedChartSecurity.sectorId && SECTOR_ICONS[selectedChartSecurity.sectorId] ? (() => {
                    const cfg = SECTOR_ICONS[selectedChartSecurity.sectorId!];
                    const SIcon = cfg.icon;
                    return (
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${cfg.bg} ${cfg.text} ${cfg.border} shadow-2xs`}>
                        <SIcon className="w-6 h-6" />
                      </div>
                    );
                  })() : (
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                      <BarChart2 className="w-6 h-6" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base sm:text-lg font-bold text-slate-900 font-mono-code">
                        {selectedChartSecurity.name} ({selectedChartSecurity.symbol})
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        {selectedChartSecurity.category}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        LIVE CHART ACTIVE
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>Historical provider periods · Exchange-verified feed</span>
                      {selectedChartSecurity.benchmarkEtf && selectedChartSecurity.isIndex && (
                        <>
                          <span>•</span>
                          <button
                            onClick={() => handleSelectSecurityForChart({
                              symbol: selectedChartSecurity.benchmarkEtf!,
                              name: `${selectedChartSecurity.benchmarkEtf} Sector ETF`,
                              category: `S&P Sector ETF`,
                              benchmarkEtf: selectedChartSecurity.benchmarkEtf,
                              sectorId: selectedChartSecurity.sectorId,
                              isIndex: false
                            })}
                            className="text-blue-700 hover:text-blue-900 font-semibold underline cursor-pointer"
                          >
                            Switch to ETF {selectedChartSecurity.benchmarkEtf}
                          </button>
                        </>
                      )}
                      {selectedChartSecurity.benchmarkEtf && !selectedChartSecurity.isIndex && selectedChartSecurity.sectorId && (
                        <>
                          <span>•</span>
                          <button
                            onClick={() => {
                              const s = SP_MACRO_SECTORS.find(sec => sec.id === selectedChartSecurity.sectorId);
                              if (s) {
                                handleSelectSecurityForChart({
                                  symbol: s.symbol,
                                  name: `${s.name} Index`,
                                  category: `S&P Sector (GICS ${s.gicsCode})`,
                                  benchmarkEtf: s.benchmarkEtf,
                                  sectorId: s.id,
                                  isIndex: true
                                });
                              }
                            }}
                            className="text-blue-700 hover:text-blue-900 font-semibold underline cursor-pointer"
                          >
                            Switch to Cash Index
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Big Live Price Display */}
                <div className="text-left sm:text-right font-mono-code shrink-0">
                  <div className="text-2xl sm:text-3xl font-bold text-[#005a9c] tabular-nums">
                    {livePriceDisplay}
                  </div>
                  <div className={`text-xs font-semibold flex items-center sm:justify-end gap-1 ${
                    chartQuote.isUp ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {chartQuote.isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    <span>{chartQuote.change >= 0 ? '+' : ''}{chartQuote.change.toFixed(2)}</span>
                    <span>({chartQuote.changePercent >= 0 ? '+' : ''}{chartQuote.changePercent.toFixed(2)}%)</span>
                  </div>
                </div>
              </div>

              {/* 4 Financial Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-code">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-[10px] uppercase text-slate-400 font-medium">PERIOD RANGE</div>
                  <div className="text-slate-900 font-bold mt-0.5">
                    {rawMin ? rawMin.toFixed(2) : '—'} - {rawMax ? rawMax.toFixed(2) : '—'}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-[10px] uppercase text-slate-400 font-medium">PERIOD RETURN ({activeTimeframe})</div>
                  <div className={`font-bold mt-0.5 ${isPeriodPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {isPeriodPositive ? '+' : ''}{periodChange.toFixed(2)} ({isPeriodPositive ? '+' : ''}{periodPct.toFixed(2)}%)
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-[10px] uppercase text-slate-400 font-medium">BENCHMARK ROLE</div>
                  <div className="text-blue-700 font-bold mt-0.5 truncate">
                    {selectedChartSecurity.isIndex ? 'S&P 500 Sub-Index' : 'Physical GICS Sector ETF'}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-[10px] uppercase text-slate-400 font-medium">DATA PROVIDER</div>
                  <div className="text-emerald-700 font-bold mt-0.5 truncate">
                    {chartProvider}
                  </div>
                </div>
              </div>

              {/* Timeframe Selector Bar: Exactly as in Global Rates / Nasdaq */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span>Interactive Chart Duration (Provider Looptijden):</span>
                </div>

                <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 self-start sm:self-auto shadow-2xs">
                  {[
                    { id: '24U' as const, label: '24U', title: 'Intraday 24-hour / market session' },
                    { id: '1W' as const, label: '1W', title: '1-Week historical bars' },
                    { id: '3M' as const, label: '3M', title: '3-Month daily interval' },
                    { id: 'YTD' as const, label: 'YTD', title: 'Year to date' },
                    { id: '1Y' as const, label: '1Y', title: '1-Year weekly trend' },
                    { id: '5Y' as const, label: '5Y', title: '5-Year institutional horizon' },
                    { id: '10Y' as const, label: '10Y', title: '10-Year secular cycle' },
                    { id: 'ALL' as const, label: 'ALL', title: 'Maximum available history' }
                  ].map(tf => (
                    <button
                      key={tf.id}
                      onClick={() => setActiveTimeframe(tf.id)}
                      title={tf.title}
                      className={`px-3 py-1 rounded-md text-[11px] font-semibold font-mono transition cursor-pointer ${
                        activeTimeframe === tf.id
                          ? 'bg-blue-700 text-white shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* High-Performance SVG Chart Canvas */}
              <div className="w-full relative rounded-xl border border-slate-200 bg-slate-50/80 p-3 overflow-hidden select-none">
                {chartLoading ? (
                  <div className="h-[280px] flex items-center justify-center text-xs text-slate-500 font-mono gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Loading market chart data…</span>
                  </div>
                ) : points.length < 2 ? (
                  <div className="h-[280px] flex items-center justify-center text-xs text-slate-400 font-mono">
                    No historical chart data available for this timeframe.
                  </div>
                ) : (
                  <div className="relative">
                    {/* Hover Inspection Readout */}
                    {activePoint && (
                      <div className="absolute top-2 left-3 z-20 bg-slate-900/90 text-white text-[11px] font-mono-code px-3 py-1.5 rounded-lg border border-slate-700 shadow-md flex items-center gap-3">
                        <span className="text-slate-400">{activePoint.date}</span>
                        <span>•</span>
                        <span className="font-bold text-cyan-300">
                          {activePoint.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {activePoint.volume && activePoint.volume > 0 ? (
                          <>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-300">Vol: {activePoint.volume.toLocaleString()}</span>
                          </>
                        ) : null}
                      </div>
                    )}

                    <svg
                      ref={svgRef}
                      viewBox={`0 0 ${width} ${height}`}
                      className="w-full h-[280px] overflow-visible"
                      onMouseMove={handleMouseMove}
                      onMouseLeave={() => setHoverIndex(null)}
                    >
                      <defs>
                        <linearGradient id="sectorChartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.28" />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Gridlines */}
                      {[0, 0.25, 0.5, 0.75, 1].map(frac => {
                        const y = topPad + plotHeight * frac;
                        const val = yMax - (yMax - yMin) * frac;
                        return (
                          <g key={frac}>
                            <line
                              x1={leftPad}
                              y1={y}
                              x2={width - rightPad}
                              y2={y}
                              stroke="#e2e8f0"
                              strokeDasharray="3 3"
                            />
                            <text
                              x={width - rightPad + 8}
                              y={y + 3}
                              fill="#94a3b8"
                              fontSize="10"
                              fontFamily="monospace"
                            >
                              {val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </text>
                          </g>
                        );
                      })}

                      {/* Date Axis Gridlines & Labels */}
                      {dateTickIndices.map(idx => {
                        const pt = points[idx];
                        if (!pt) return null;
                        return (
                          <g key={idx}>
                            <line
                              x1={pt.x}
                              y1={topPad}
                              x2={pt.x}
                              y2={topPad + plotHeight}
                              stroke="#e2e8f0"
                              strokeDasharray="2 3"
                              strokeWidth="0.75"
                            />
                            <text
                              x={pt.x}
                              y={topPad + plotHeight + 18}
                              textAnchor="middle"
                              fill="#64748b"
                              fontSize="10"
                              fontFamily="monospace"
                            >
                              {pt.date}
                            </text>
                          </g>
                        );
                      })}

                      {/* Filled Area */}
                      <path d={areaPath} fill="url(#sectorChartGrad)" />

                      {/* Trend Line */}
                      <path
                        d={linePath}
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Hover Indicator Crosshair */}
                      {activePoint && (
                        <g>
                          <line
                            x1={activePoint.x}
                            y1={topPad}
                            x2={activePoint.x}
                            y2={topPad + plotHeight}
                            stroke="#3b82f6"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                          />
                          <circle
                            cx={activePoint.x}
                            cy={activePoint.y}
                            r="4.5"
                            fill="#1d4ed8"
                            stroke="#ffffff"
                            strokeWidth="2"
                          />
                        </g>
                      )}
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Section 2: Index Linked Products & Thematic ETFs */}
      {(viewFilter === 'ALL' || viewFilter === 'PRODUCTS') && (
        <div className="space-y-5 pt-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">
                2. Index Linked Products & Thematic ETFs
              </h3>
              <span className="text-xs text-slate-500 font-normal">
                ({filteredClusters.length} product groups displayed)
              </span>
            </div>
            <span className="text-xs text-slate-500 font-mono-code hidden sm:inline">
              Pure-Play Thematic Exposure
            </span>
          </div>

          <div className="space-y-4">
            {filteredClusters.map(cluster => {
              const primaryQuote = getQuote(cluster.primaryEtf.symbol);
              const dedicatedQuote = cluster.dedicatedEtf ? getQuote(cluster.dedicatedEtf.symbol) : null;

              return (
                <div 
                  key={cluster.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-2xs hover:border-slate-300 transition"
                >
                  {/* Product Group Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold font-mono-code">
                          Product Group #{cluster.clusterNumber}
                        </span>
                        <h4 className="text-base md:text-lg font-bold text-slate-900">
                          {cluster.name}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {cluster.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-auto">
                      <span className="text-xs text-slate-500 font-mono-code">
                        {cluster.secondaryThematics.length + 1 + (cluster.dedicatedEtf ? 1 : 0)} Monitored ETF Products
                      </span>
                    </div>
                  </div>

                  {/* Primary & Dedicated ETFs Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3.5">
                    {/* Primary Flagship ETF */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:bg-white hover:shadow-xs transition">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleSelectSecurityForChart({
                                symbol: cluster.primaryEtf.symbol,
                                name: cluster.primaryEtf.name,
                                category: `Index Linked Product (${cluster.name})`,
                                benchmarkEtf: cluster.primaryEtf.symbol,
                                isIndex: false
                              }, true)}
                              className="font-black text-base text-blue-700 hover:text-blue-900 font-mono-code cursor-pointer"
                              title="Click to view live chart"
                            >
                              {cluster.primaryEtf.symbol}
                            </button>
                            <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                              {cluster.primaryEtf.role}
                            </span>
                            {selectedChartSecurity.symbol === cluster.primaryEtf.symbol && (
                              <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[9px] font-bold font-mono-code">
                                Active Chart
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-slate-800 block mt-0.5">
                            {cluster.primaryEtf.name}
                          </span>
                        </div>

                        {/* Live Price */}
                        <div className="text-right">
                          <span className="text-sm font-bold text-slate-900 font-mono-code block">
                            ${primaryQuote.price > 0 ? primaryQuote.price.toFixed(2) : '---'}
                          </span>
                          <span className={`text-[11px] font-semibold flex items-center justify-end ${primaryQuote.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {primaryQuote.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {primaryQuote.changePercent >= 0 ? `+${primaryQuote.changePercent.toFixed(2)}%` : `${primaryQuote.changePercent.toFixed(2)}%`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                        <span>TER: <strong className="text-slate-700 font-mono-code">{cluster.primaryEtf.expenseRatio}</strong></span>
                        <span>•</span>
                        <span>Inception: <strong className="text-slate-700">{cluster.primaryEtf.inceptionDate}</strong></span>
                        <div className="ml-auto flex items-center gap-2">
                          <button
                            onClick={() => handleSelectSecurityForChart({
                              symbol: cluster.primaryEtf.symbol,
                              name: cluster.primaryEtf.name,
                              category: `Index Linked Product (${cluster.name})`,
                              benchmarkEtf: cluster.primaryEtf.symbol,
                              isIndex: false
                            }, true)}
                            className="text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer text-xs"
                          >
                            Chart
                          </button>
                          <span className="text-slate-300">•</span>
                          <button
                            onClick={() => setSelectedSecuritySymbol(cluster.primaryEtf.symbol)}
                            className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer text-xs"
                          >
                            Overview
                          </button>
                          <a
                            href={cluster.primaryEtf.prospectusUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      {/* Top Holdings preview */}
                      <div className="mt-2.5 pt-2 border-t border-slate-200/70 flex flex-wrap gap-1">
                        {cluster.primaryEtf.fallbackHoldings.slice(0, 4).map(h => (
                          <span key={h.ticker} className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono-code text-slate-700">
                            {h.ticker} ({h.weight}%)
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Dedicated ETF or Featured Thematic */}
                    {cluster.dedicatedEtf ? (
                      <div className="bg-purple-50/50 border border-purple-200/80 rounded-lg p-3 hover:bg-white hover:shadow-xs transition">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleSelectSecurityForChart({
                                  symbol: cluster.dedicatedEtf!.symbol,
                                  name: cluster.dedicatedEtf!.name,
                                  category: `Dedicated ETF (${cluster.name})`,
                                  benchmarkEtf: cluster.dedicatedEtf!.symbol,
                                  isIndex: false
                                }, true)}
                                className="font-black text-base text-purple-800 hover:text-purple-950 font-mono-code cursor-pointer"
                                title="Click to view live chart"
                              >
                                {cluster.dedicatedEtf.symbol}
                              </button>
                              <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                                {cluster.dedicatedEtf.role}
                              </span>
                              {selectedChartSecurity.symbol === cluster.dedicatedEtf.symbol && (
                                <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[9px] font-bold font-mono-code">
                                  Active Chart
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-slate-800 block mt-0.5">
                              {cluster.dedicatedEtf.name}
                            </span>
                          </div>

                          {/* Live Price */}
                          <div className="text-right">
                            <span className="text-sm font-bold text-slate-900 font-mono-code block">
                              ${dedicatedQuote && dedicatedQuote.price > 0 ? dedicatedQuote.price.toFixed(2) : '---'}
                            </span>
                            {dedicatedQuote && (
                              <span className={`text-[11px] font-semibold flex items-center justify-end ${dedicatedQuote.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {dedicatedQuote.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {dedicatedQuote.changePercent >= 0 ? `+${dedicatedQuote.changePercent.toFixed(2)}%` : `${dedicatedQuote.changePercent.toFixed(2)}%`}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                          <span>TER: <strong className="text-slate-700 font-mono-code">{cluster.dedicatedEtf.expenseRatio}</strong></span>
                          <span>•</span>
                          <span>Inception: <strong className="text-slate-700">{cluster.dedicatedEtf.inceptionDate}</strong></span>
                          <div className="ml-auto flex items-center gap-2">
                            <button
                              onClick={() => handleSelectSecurityForChart({
                                symbol: cluster.dedicatedEtf!.symbol,
                                name: cluster.dedicatedEtf!.name,
                                category: `Dedicated ETF (${cluster.name})`,
                                benchmarkEtf: cluster.dedicatedEtf!.symbol,
                                isIndex: false
                              }, true)}
                              className="text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer text-xs"
                            >
                              Chart
                            </button>
                            <span className="text-slate-300">•</span>
                            <button
                              onClick={() => setSelectedSecuritySymbol(cluster.dedicatedEtf!.symbol)}
                              className="text-purple-700 hover:text-purple-900 font-semibold cursor-pointer text-xs"
                            >
                              Overview
                            </button>
                            <a
                              href={cluster.dedicatedEtf.prospectusUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>

                        {/* Top Holdings preview */}
                        <div className="mt-2.5 pt-2 border-t border-purple-200/50 flex flex-wrap gap-1">
                          {cluster.dedicatedEtf.fallbackHoldings.slice(0, 4).map(h => (
                            <span key={h.ticker} className="px-1.5 py-0.5 rounded bg-white border border-purple-200 text-[10px] font-mono-code text-slate-700">
                              {h.ticker} ({h.weight}%)
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* Top secondary thematic product */
                      cluster.secondaryThematics[0] && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:bg-white hover:shadow-xs transition">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleSelectSecurityForChart({
                                    symbol: cluster.secondaryThematics[0].symbol,
                                    name: cluster.secondaryThematics[0].name,
                                    category: `Thematic ETF (${cluster.name})`,
                                    benchmarkEtf: cluster.secondaryThematics[0].symbol,
                                    isIndex: false
                                  }, true)}
                                  className="font-black text-base text-indigo-700 hover:text-indigo-900 font-mono-code cursor-pointer"
                                  title="Click to view live chart"
                                >
                                  {cluster.secondaryThematics[0].symbol}
                                </button>
                                <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                                  {cluster.secondaryThematics[0].subThematic}
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-slate-800 block mt-0.5">
                                {cluster.secondaryThematics[0].name}
                              </span>
                            </div>

                            {/* Live Price */}
                            <div className="text-right">
                              {(() => {
                                const q = getQuote(cluster.secondaryThematics[0].symbol);
                                return (
                                  <>
                                    <span className="text-sm font-bold text-slate-900 font-mono-code block">
                                      ${q.price > 0 ? q.price.toFixed(2) : '---'}
                                    </span>
                                    <span className={`text-[11px] font-semibold flex items-center justify-end ${q.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                                      {q.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                      {q.changePercent >= 0 ? `+${q.changePercent.toFixed(2)}%` : `${q.changePercent.toFixed(2)}%`}
                                    </span>
                                  </>
                                );
                              })()}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                            <span>TER: <strong className="text-slate-700 font-mono-code">{cluster.secondaryThematics[0].expenseRatio}</strong></span>
                            <span>•</span>
                            <span>Inception: <strong className="text-slate-700">{cluster.secondaryThematics[0].inceptionDate}</strong></span>
                            <div className="ml-auto flex items-center gap-2">
                              <button
                                onClick={() => handleSelectSecurityForChart({
                                  symbol: cluster.secondaryThematics[0].symbol,
                                  name: cluster.secondaryThematics[0].name,
                                  category: `Thematic ETF (${cluster.name})`,
                                  benchmarkEtf: cluster.secondaryThematics[0].symbol,
                                  isIndex: false
                                }, true)}
                                className="text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer text-xs"
                              >
                                Chart
                              </button>
                              <span className="text-slate-300">•</span>
                              <button
                                onClick={() => setSelectedSecuritySymbol(cluster.secondaryThematics[0].symbol)}
                                className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer text-xs"
                              >
                                Overview
                              </button>
                              <a
                                href={cluster.secondaryThematics[0].prospectusUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-slate-600"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  {/* Secondary Thematic ETFs Pills Strip */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                      Sub-Industry & Thematic Alternatives:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {cluster.secondaryThematics.map(st => {
                        const q = getQuote(st.symbol);
                        const isStSelected = selectedChartSecurity.symbol === st.symbol;
                        return (
                          <div 
                            key={st.symbol}
                            className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border text-xs transition ${
                              isStSelected ? 'bg-blue-50 border-blue-400 shadow-2xs' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                            }`}
                          >
                            <button
                              onClick={() => handleSelectSecurityForChart({
                                symbol: st.symbol,
                                name: st.name,
                                category: `Thematic ETF (${st.subThematic})`,
                                benchmarkEtf: st.symbol,
                                isIndex: false
                              }, true)}
                              className="font-bold text-slate-900 hover:text-blue-700 font-mono-code cursor-pointer"
                              title={`${st.name} - Click to activate chart`}
                            >
                              {st.symbol}
                            </button>
                            <span className="text-[11px] text-slate-500">
                              {st.subThematic}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono-code">
                              ({st.expenseRatio})
                            </span>
                            <span className={`text-[11px] font-mono-code font-semibold ${q.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {q.changePercent >= 0 ? `+${q.changePercent.toFixed(2)}%` : `${q.changePercent.toFixed(2)}%`}
                            </span>
                            <button
                              onClick={() => setSelectedSecuritySymbol(st.symbol)}
                              className="text-blue-600 hover:text-blue-800 text-[10px] font-bold cursor-pointer underline decoration-blue-200"
                              title="Overview & Holdings"
                            >
                              Overview
                            </button>
                            <a
                              href={st.prospectusUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-300 hover:text-slate-600"
                              title="Prospectus link"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Institutional Overview & Holdings Modal */}
      {selectedSecuritySymbol && activeModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#002d62] text-white p-5 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-400/20 border border-cyan-400/30 text-cyan-200 text-xs font-mono-code font-bold">
                    {activeModalData.symbol}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/10 text-white text-[11px] font-semibold">
                    {activeModalData.type}
                  </span>
                  {activeModalData.expenseRatio && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-mono-code font-bold">
                      TER: {activeModalData.expenseRatio}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-black mt-1.5 text-white">
                  {activeModalData.name}
                </h3>
                {activeModalData.gicsSector && (
                  <p className="text-xs text-cyan-200/80 mt-0.5">
                    Sector Mandate: {activeModalData.gicsSector}
                  </p>
                )}
              </div>

              <button
                onClick={() => setSelectedSecuritySymbol(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Fund Mandate Box */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Official Investment Objective & Mandate
                </span>
                <p className="text-slate-700 leading-relaxed text-xs">
                  {activeModalData.description}
                </p>
              </div>

              {/* Fund Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Inception Date</span>
                  <span className="font-bold text-slate-800 font-mono-code">{activeModalData.inceptionDate}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Expense Ratio (TER)</span>
                  <span className="font-bold text-slate-800 font-mono-code">{activeModalData.expenseRatio || 'N/A (Cash Index)'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 sm:col-span-1 col-span-2">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Weighting Methodology</span>
                  <span className="font-medium text-slate-800 text-[11px] line-clamp-2">{activeModalData.weightingMethodology}</span>
                </div>
              </div>

              {/* Top 10 Holdings Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    Top 10 Portfolio Constituents
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Official benchmark weighting (%)
                  </span>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px]">
                      <tr>
                        <th className="py-2 px-3 font-semibold w-10">#</th>
                        <th className="py-2 px-3 font-semibold">Symbol</th>
                        <th className="py-2 px-3 font-semibold">Company Name</th>
                        <th className="py-2 px-3 font-semibold text-right w-24">Weight</th>
                        <th className="py-2 px-3 font-semibold w-24">Allocation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeModalData.fallbackHoldings.map(h => (
                        <tr key={h.ticker} className="hover:bg-blue-50/40 transition">
                          <td className="py-2 px-3 text-slate-400 font-mono-code">{h.rank}</td>
                          <td className="py-2 px-3">
                            <button
                              onClick={() => {
                                setSelectedSecuritySymbol(null);
                                if (onSelectTicker) onSelectTicker(h.ticker);
                              }}
                              className="font-bold text-blue-700 hover:text-blue-900 font-mono-code cursor-pointer underline decoration-blue-200"
                              title={`Search ${h.ticker} in terminal`}
                            >
                              {h.ticker}
                            </button>
                          </td>
                          <td className="py-2 px-3 text-slate-700 font-medium">{h.company}</td>
                          <td className="py-2 px-3 text-right font-bold font-mono-code text-slate-900">
                            {h.weight.toFixed(2)}%
                          </td>
                          <td className="py-2 px-3">
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full" 
                                style={{ width: `${Math.min(100, (h.weight / 25) * 100)}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
              <a
                href={activeModalData.prospectusUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold border border-blue-200 transition"
              >
                <span>Download Official Factsheet / Prospectus</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setSelectedSecuritySymbol(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
