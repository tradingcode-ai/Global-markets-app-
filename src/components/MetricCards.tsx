import React from 'react';
import { QuarterlyResult } from '../types';
import { TrendingUp, Award, Activity, Calendar } from 'lucide-react';

interface MetricCardsProps {
  results: QuarterlyResult[];
  onSelectUpcoming: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ results, onSelectUpcoming }) => {
  const reportedResults = results.filter(r => r.status === 'reported' || r.status === 'reporting_today');
  const upcomingCount = results.filter(r => r.status === 'upcoming').length;
  
  const beatsCount = reportedResults.filter(r => (r.epsActual ?? 0) >= r.epsEstimate).length;
  const beatRate = reportedResults.length > 0 
    ? Math.round((beatsCount / reportedResults.length) * 100) 
    : 0;

  const revBeatsCount = reportedResults.filter(r => (r.revenueActual ?? 0) >= r.revenueEstimate).length;
  const revBeatRate = reportedResults.length > 0 
    ? Math.round((revBeatsCount / reportedResults.length) * 100) 
    : 0;

  const guidanceRaisedCount = reportedResults.filter(r => r.guidanceRating === 'raised').length;

  return (
    <div id="corporate-metric-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
      {/* Metric 1: EPS Beat Rate */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <span className="font-semibold uppercase tracking-wider text-[11px]">EPS Beat Rate</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono-code tabular-nums text-slate-900">{beatRate}%</span>
          <span className="text-xs text-slate-500 font-normal">
            ({beatsCount} of {reportedResults.length} beat cons.)
          </span>
        </div>
        <div className="mt-2.5 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
            style={{ width: `${beatRate}%` }}
          />
        </div>
      </div>

      {/* Metric 2: Revenue Beat Rate */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <span className="font-semibold uppercase tracking-wider text-[11px]">Revenue Beat Rate</span>
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono-code tabular-nums text-slate-900">{revBeatRate}%</span>
          <span className="text-xs text-slate-500 font-normal">
            ({revBeatsCount} of {reportedResults.length} beat rev.)
          </span>
        </div>
        <div className="mt-2.5 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-blue-500 h-full rounded-full transition-all duration-500" 
            style={{ width: `${revBeatRate}%` }}
          />
        </div>
      </div>

      {/* Metric 3: Guidance Raised */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <span className="font-semibold uppercase tracking-wider text-[11px]">Forward Guidance Upgrades</span>
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono-code tabular-nums text-slate-900">
            {guidanceRaisedCount} <span className="text-base text-slate-500 font-normal">Cos.</span>
          </span>
          <span className="text-xs text-slate-500 font-normal">
            Raised fiscal projections
          </span>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Strongest in AI Cloud & Chips</span>
        </div>
      </div>

      {/* Metric 4: Upcoming Pipeline */}
      <div 
        onClick={onSelectUpcoming}
        className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl p-4 shadow-2xs cursor-pointer transition group"
      >
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <span className="font-semibold uppercase tracking-wider text-[11px]">Upcoming Reports</span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center group-hover:bg-amber-100 transition">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono-code tabular-nums text-slate-900">{upcomingCount}</span>
          <span className="text-xs text-slate-500 font-normal">
            releases on tech calendar
          </span>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-blue-600 font-medium group-hover:underline">
          <span>View calendar timetable</span>
          <span>→</span>
        </div>
      </div>
    </div>
  );
};
