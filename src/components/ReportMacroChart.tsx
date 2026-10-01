import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { MacroChartDatapoint, MacroChartPayload, MacroChartType } from '../types/marketResearch';

interface ReportMacroChartProps {
  payload?: MacroChartPayload | null;
}

interface NormalizedMacroChart {
  chartType: MacroChartType;
  title: string;
  subtitle?: string;
  unit: string;
  source: string;
  sourceUrl?: string;
  data: MacroChartDatapoint[];
}

function normalizePayload(payload?: MacroChartPayload | null): NormalizedMacroChart | null {
  if (!payload) return null;
  const rawData = Array.isArray(payload.data)
    ? payload.data
    : Array.isArray(payload.data_points)
      ? payload.data_points
      : [];
  const data = rawData
    .map(row => {
      const value = typeof row.value === 'number' ? row.value : Number(row.value);
      const benchmarkRaw = row.benchmark ?? row.benchmark_value;
      const benchmark = benchmarkRaw === undefined ? undefined : Number(benchmarkRaw);
      if (!row.label || !Number.isFinite(value) || (benchmark !== undefined && !Number.isFinite(benchmark))) {
        return null;
      }
      return {
        label: String(row.label),
        value,
        ...(benchmark !== undefined ? { benchmark, benchmark_value: benchmark } : {}),
        ...(row.highlight === true || row.is_highlighted === true ? { highlight: true, is_highlighted: true } : {})
      };
    })
    .filter((row): row is MacroChartDatapoint => row !== null);

  const chartType = payload.chartType || payload.chart_type;
  if (!chartType || !['BAR', 'LINE', 'BREAKDOWN', 'YIELD_CURVE'].includes(chartType)) return null;
  return {
    chartType,
    title: payload.title || 'Underlying driver data',
    subtitle: payload.subtitle,
    unit: payload.unit || 'Reported units',
    source: payload.source || 'Source unavailable',
    sourceUrl: payload.sourceUrl || payload.source_url,
    data
  };
}

const chartMargin = { top: 8, right: 12, left: -18, bottom: 4 };
const axisStyle = { fill: '#94a3b8', fontSize: 10 };

export const ReportMacroChart: React.FC<ReportMacroChartProps> = ({ payload }) => {
  const chart = normalizePayload(payload);

  if (!chart || chart.data.length === 0) {
    return (
      <section className="my-6 rounded-xl border border-slate-700/80 bg-[#071b2e] p-5 text-slate-200 shadow-lg" aria-label="Macro data unavailable">
        <div className="flex items-center gap-2 text-[10px] font-mono font-semibold uppercase tracking-[0.18em] text-amber-300">
          <span className="h-2 w-2 rounded-full bg-amber-300" />
          Underlying driver data
        </div>
        <p className="mt-3 font-serif text-base text-white">Verified macro series unavailable</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          No attributed, finite data series was available for this report. The visual layer does not substitute estimates or placeholder values.
        </p>
      </section>
    );
  }

  const barColor = (highlight?: boolean) => highlight ? '#d49a3a' : '#527da8';

  const chartBody = chart.chartType === 'BREAKDOWN' ? (
    <BarChart data={chart.data} layout="vertical" margin={{ top: 8, right: 18, left: 18, bottom: 4 }}>
      <CartesianGrid stroke="#334155" strokeDasharray="3 3" horizontal={false} opacity={0.65} />
      <XAxis type="number" stroke="#64748b" tick={axisStyle} tickLine={false} axisLine={{ stroke: '#475569' }} />
      <YAxis type="category" dataKey="label" width={92} stroke="#94a3b8" tick={axisStyle} tickLine={false} axisLine={false} />
      <Tooltip
        contentStyle={{ background: '#0f172a', border: '1px solid #475569', color: '#f8fafc', fontSize: 11 }}
        formatter={(value: number | string) => [`${value} ${chart.unit}`, 'Value']}
      />
      <Bar dataKey="value" radius={[0, 3, 3, 0]}>
        {chart.data.map((entry, index) => <Cell key={`breakdown-cell-${index}`} fill={barColor(entry.highlight)} />)}
      </Bar>
    </BarChart>
  ) : chart.chartType === 'LINE' || chart.chartType === 'YIELD_CURVE' ? (
    <LineChart data={chart.data} margin={chartMargin}>
      <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} opacity={0.65} />
      <XAxis dataKey="label" stroke="#64748b" tick={axisStyle} tickLine={false} axisLine={{ stroke: '#475569' }} />
      <YAxis stroke="#64748b" tick={axisStyle} tickLine={false} axisLine={{ stroke: '#475569' }} />
      <Tooltip
        contentStyle={{ background: '#0f172a', border: '1px solid #475569', color: '#f8fafc', fontSize: 11 }}
        formatter={(value: number | string) => [`${value} ${chart.unit}`, 'Value']}
      />
      <Line type="monotone" dataKey="value" stroke="#d49a3a" strokeWidth={2.5} dot={{ r: 3, fill: '#d49a3a', stroke: '#071b2e', strokeWidth: 1 }} activeDot={{ r: 5 }} />
      {chart.data.some(entry => entry.benchmark !== undefined) && (
        <Line type="monotone" dataKey="benchmark" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
      )}
    </LineChart>
  ) : (
    <BarChart data={chart.data} margin={chartMargin}>
      <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} opacity={0.65} />
      <XAxis dataKey="label" stroke="#64748b" tick={axisStyle} tickLine={false} axisLine={{ stroke: '#475569' }} />
      <YAxis stroke="#64748b" tick={axisStyle} tickLine={false} axisLine={{ stroke: '#475569' }} />
      <Tooltip
        contentStyle={{ background: '#0f172a', border: '1px solid #475569', color: '#f8fafc', fontSize: 11 }}
        formatter={(value: number | string) => [`${value} ${chart.unit}`, 'Value']}
      />
      <Bar dataKey="value" radius={[3, 3, 0, 0]}>
        {chart.data.map((entry, index) => <Cell key={`bar-cell-${index}`} fill={barColor(entry.highlight)} />)}
      </Bar>
    </BarChart>
  );

  return (
    <section className="my-6 rounded-xl border border-slate-700/80 bg-[#071b2e] p-5 text-slate-200 shadow-lg" aria-label="Institutional macro data driver">
      <div className="flex items-start justify-between gap-4 border-b border-slate-700/70 pb-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono font-semibold uppercase tracking-[0.18em] text-amber-300">
            <span className="h-2 w-2 rounded-full bg-amber-300" />
            Institutional macro data driver
          </div>
          <h3 className="mt-1 font-serif text-base font-bold text-white">{chart.title}</h3>
          {chart.subtitle && <p className="mt-0.5 text-xs text-slate-400">{chart.subtitle}</p>}
        </div>
        <span className="shrink-0 rounded border border-slate-600 bg-slate-800/80 px-2 py-1 text-[10px] font-mono text-slate-300">{chart.unit}</span>
      </div>

      <div className="h-56 w-full pt-3">
        <ResponsiveContainer width="100%" height="100%">{chartBody}</ResponsiveContainer>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-700/70 pt-3 text-[10px] font-mono text-slate-400">
        <span>Source: {chart.source}</span>
        {chart.sourceUrl && /^https?:\/\//i.test(chart.sourceUrl) ? (
          <a href={chart.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-amber-300 underline decoration-amber-300/50 underline-offset-2 hover:text-amber-200">
            Verify data ↗
          </a>
        ) : null}
      </div>
    </section>
  );
};
