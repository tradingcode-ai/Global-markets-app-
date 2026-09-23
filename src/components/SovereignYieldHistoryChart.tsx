import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Activity,
  Calendar,
  Layers,
  Info
} from 'lucide-react';
import { SovereignBondItem, LiveQuote } from '../types';

interface SovereignYieldHistoryChartProps {
  bond: SovereignBondItem;
  liveQuote?: LiveQuote;
}

interface HistoricalPoint {
  date: string;
  timestamp: number;
  yield: number;
  changeBps: number;
  high: number;
  low: number;
}

interface BondHistoryResponse {
  success: boolean;
  symbol: string;
  name: string;
  range: string;
  currentYield: number;
  previousClose: number;
  dayChangeBps: number;
  netBps: number;
  netPct: number;
  minYield: number;
  maxYield: number;
  avgYield: number;
  provider: string;
  lastUpdated: string;
  points: HistoricalPoint[];
}

const TIME_RANGES = [
  { id: '1D', label: '1D' },
  { id: '5D', label: '5D' },
  { id: '1M', label: '1M' },
  { id: '6M', label: '6M' },
  { id: '1Y', label: '1Y' },
  { id: '5Y', label: '5Y' },
  { id: '10Y', label: '10Y' },
  { id: '30Y', label: '30Y' }
] as const;

type TimeRangeId = typeof TIME_RANGES[number]['id'];

export const SovereignYieldHistoryChart: React.FC<SovereignYieldHistoryChartProps> = ({
  bond,
  liveQuote
}) => {
  const [selectedRange, setSelectedRange] = useState<TimeRangeId>('10Y');
  const [chartMode, setChartMode] = useState<'area' | 'line'>('area');
  const [data, setData] = useState<BondHistoryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Map bond symbol to normalized lookup key for historical backend
  const symbolKey = bond.symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');

  const fetchHistory = async (range: TimeRangeId, isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await fetch(`/api/bonds/history/${encodeURIComponent(symbolKey)}?range=${range}`);
      if (res.ok) {
        const json: BondHistoryResponse = await res.json();
        setData(json);
      }
    } catch (err) {
      console.warn('Failed to load bond historical rate:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory(selectedRange, false);
  }, [symbolKey, selectedRange]);

  const currentYield = liveQuote?.price ?? data?.currentYield ?? bond.currentYield;
  const netBps = data?.netBps ?? 0;
  const isPositiveBps = netBps >= 0;

  // Institutional styling: Classic sovereign debt navy
  const strokeColor = '#005a9c';
  const fillColor = '#005a9c';

  return (
    <div className="mt-5 border border-slate-200 rounded-xl bg-white shadow-2xs overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shadow-2xs shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                Historische Yield Curve & Real-Time Rente
              </h4>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE FEED • DAGELIJKS GEOUPDATE
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Historisch renteverloop van <strong>{bond.name}</strong> ({bond.country}) • Officiële Centrale Bank & Kapitaalmarkt Data
            </p>
          </div>
        </div>

        {/* Right side controls: Time ranges, Area/Line toggle, Sync */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time range buttons (1D, 5D, 1M, 6M, 1Y, 5Y, 10Y, 30Y) */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs overflow-x-auto">
            {TIME_RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRange(r.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer shrink-0 ${
                  selectedRange === r.id
                    ? 'bg-[#005a9c] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Chart visual toggle */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              onClick={() => setChartMode('area')}
              title="Area Curve"
              className={`p-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                chartMode === 'area'
                  ? 'bg-blue-50 text-[#005a9c]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartMode('line')}
              title="High Precision Line"
              className={`p-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                chartMode === 'line'
                  ? 'bg-blue-50 text-[#005a9c]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Refresh button */}
          <button
            onClick={() => fetchHistory(selectedRange, true)}
            disabled={refreshing}
            title="Update live feed"
            className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#005a9c]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-4 bg-slate-50/40 border-b border-slate-200 text-xs font-mono-code">
        <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] text-slate-500 block uppercase font-sans font-semibold">
            Actuele Rente (Live)
          </span>
          <span className="text-base font-bold text-slate-900">
            {currentYield.toFixed(3)}%
          </span>
        </div>

        <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] text-slate-500 block uppercase font-sans font-semibold">
            {selectedRange} Verandering
          </span>
          <span className={`text-base font-bold flex items-center gap-1 ${
            isPositiveBps ? 'text-amber-700' : 'text-emerald-700'
          }`}>
            {isPositiveBps ? '+' : ''}{netBps.toFixed(1)} bps
            <span className="text-xs font-normal text-slate-500">
              ({data?.netPct ? `${data.netPct > 0 ? '+' : ''}${data.netPct.toFixed(2)}%` : '—'})
            </span>
          </span>
        </div>

        <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] text-slate-500 block uppercase font-sans font-semibold">
            Periode Hoog
          </span>
          <span className="text-sm font-bold text-slate-800">
            {data?.maxYield !== undefined ? `${data.maxYield.toFixed(3)}%` : '—'}
          </span>
        </div>

        <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] text-slate-500 block uppercase font-sans font-semibold">
            Periode Laag
          </span>
          <span className="text-sm font-bold text-slate-800">
            {data?.minYield !== undefined ? `${data.minYield.toFixed(3)}%` : '—'}
          </span>
        </div>

        <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] text-slate-500 block uppercase font-sans font-semibold">
            Gemiddelde Rente
          </span>
          <span className="text-sm font-bold text-slate-800">
            {data?.avgYield !== undefined ? `${data.avgYield.toFixed(3)}%` : '—'}
          </span>
        </div>

        <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] text-slate-500 block uppercase font-sans font-semibold">
            Spread Bandbreedte
          </span>
          <span className="text-sm font-bold text-blue-700">
            {data?.maxYield !== undefined && data?.minYield !== undefined
              ? `${((data.maxYield - data.minYield) * 100).toFixed(1)} bps`
              : '—'}
          </span>
        </div>
      </div>

      {/* 3. Interactive Chart Canvas */}
      <div className="p-4 bg-white">
        {loading ? (
          <div className="h-80 flex flex-col items-center justify-center space-y-2 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-[#005a9c]" />
            <span className="text-xs font-medium">Officiële historische yield curve laden...</span>
          </div>
        ) : !data || data.points.length === 0 ? (
          <div className="h-80 flex items-center justify-center text-xs text-slate-500">
            Geen historische rentegegevens beschikbaar voor deze looptijd.
          </div>
        ) : (
          <div className="h-80 sm:h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'area' ? (
                <AreaChart data={data.points} margin={{ top: 12, right: 12, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sovereignYieldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={fillColor} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={fillColor} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickFormatter={(val) => `${val.toFixed(2)}%`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const pt = payload[0].payload as HistoricalPoint;
                        return (
                          <div className="bg-slate-900 text-white rounded-lg p-3 shadow-xl text-xs font-mono-code border border-slate-700">
                            <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold mb-1">
                              {pt.date} • OFFICIËLE RENTEDATA
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-300">Rente (Yield):</span>
                              <strong className="text-white font-bold text-sm">
                                {pt.yield.toFixed(3)}%
                              </strong>
                            </div>
                            <div className="flex items-center justify-between gap-4 mt-1 pt-1 border-t border-slate-800 text-[11px]">
                              <span className="text-slate-400">Verandering t.o.v. start:</span>
                              <span className={pt.changeBps >= 0 ? 'text-amber-400' : 'text-emerald-400'}>
                                {pt.changeBps >= 0 ? '+' : ''}{pt.changeBps.toFixed(1)} bps
                              </span>
                            </div>
                            <div className="mt-1.5 text-[9px] text-slate-500 font-sans">
                              Bron: Federal Reserve (FRED) & Centrale Banken
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {data.avgYield && (
                    <ReferenceLine
                      y={data.avgYield}
                      stroke="#94a3b8"
                      strokeDasharray="4 4"
                      label={{
                        value: `Gem: ${data.avgYield.toFixed(2)}%`,
                        fill: '#64748b',
                        fontSize: 10,
                        position: 'insideBottomRight'
                      }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="yield"
                    stroke={strokeColor}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#sovereignYieldGrad)"
                  />
                </AreaChart>
              ) : (
                <LineChart data={data.points} margin={{ top: 12, right: 12, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickFormatter={(val) => `${val.toFixed(2)}%`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const pt = payload[0].payload as HistoricalPoint;
                        return (
                          <div className="bg-slate-900 text-white rounded-lg p-3 shadow-xl text-xs font-mono-code border border-slate-700">
                            <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold mb-1">
                              {pt.date} • OFFICIËLE RENTEDATA
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-300">Rente (Yield):</span>
                              <strong className="text-white font-bold text-sm">
                                {pt.yield.toFixed(3)}%
                              </strong>
                            </div>
                            <div className="flex items-center justify-between gap-4 mt-1 pt-1 border-t border-slate-800 text-[11px]">
                              <span className="text-slate-400">Verandering t.o.v. start:</span>
                              <span className={pt.changeBps >= 0 ? 'text-amber-400' : 'text-emerald-400'}>
                                {pt.changeBps >= 0 ? '+' : ''}{pt.changeBps.toFixed(1)} bps
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {data.avgYield && (
                    <ReferenceLine
                      y={data.avgYield}
                      stroke="#94a3b8"
                      strokeDasharray="4 4"
                      label={{
                        value: `Gem: ${data.avgYield.toFixed(2)}%`,
                        fill: '#64748b',
                        fontSize: 10,
                        position: 'insideBottomRight'
                      }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="yield"
                    stroke={strokeColor}
                    strokeWidth={2.2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#005a9c' }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 4. Footnote & Data Integrity Bar */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-mono-code">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>
            Gegevensbron: <strong>{data?.provider || 'Federal Reserve (FRED) & Centrale Bank Marktfeeds'}</strong> • Looptijd: <strong>{selectedRange}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>Laatste live update: <strong>{data?.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString('nl-NL') : 'Continu'}</strong></span>
          <span>•</span>
          <span className="text-[#005a9c] font-semibold">Veritas Desk Engine</span>
        </div>
      </div>
    </div>
  );
};
