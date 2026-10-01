import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ResearchDashboardData, 
  ResearchReport, 
  ResearchEvent, 
  ResearchConfig,
  AssetResearchConfig
} from '../types/marketResearch';
import { 
  fetchResearchDashboard, 
  triggerMarketScan, 
  updateResearchConfig,
  fetchResearchReportById
} from '../services/marketResearchService';
import { ResearchReportModal } from './ResearchReportModal';
import { ResearchConfigModal } from './ResearchConfigModal';
import { StockLogo } from './StockLogo';
import { 
  Activity, 
  Search, 
  RefreshCw, 
  Sliders, 
  FileText, 
  ShieldCheck, 
  TrendingDown, 
  TrendingUp, 
  Clock, 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink, 
  Sparkles, 
  Zap, 
  Radar, 
  Layers, 
  Radio, 
  ChevronRight,
  Flame,
  ArrowUpRight
} from 'lucide-react';

interface ResearchDashboardProps {
  onSelectTicker?: (ticker: string) => void;
}

export const ResearchDashboard: React.FC<ResearchDashboardProps> = ({
  onSelectTicker
}) => {
  // State
  const [data, setData] = useState<ResearchDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  
  // Modals
  const [selectedReport, setSelectedReport] = useState<ResearchReport | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'reports' | 'events'>('all');

  // Load dashboard data
  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetchResearchDashboard();
      setData(res);
    } catch (err) {
      console.error('[ResearchDashboard] Fout bij laden dashboard:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    // Poll every 20 seconds to keep data fresh without overloading Frankfurt PostgreSQL connection
    const interval = setInterval(() => {
      loadDashboard(true);
    }, 20000);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  // Handle manual market scan trigger
  const handleScanNow = async () => {
    setIsScanning(true);
    setScanMessage('Market Monitor scant actuele koersen tegen deterministische drempelwaarden...');
    try {
      const res = await triggerMarketScan();
      if (res.success) {
        setScanMessage(res.message || 'Marktscan succesvol voltooid.');
        await loadDashboard();
        setTimeout(() => setScanMessage(null), 5000);
      } else {
        setScanMessage(res.message || 'Scan uitgevoerd met melding.');
        setTimeout(() => setScanMessage(null), 5000);
      }
    } catch (err: any) {
      setScanMessage(`Scan fout: ${err.message || 'Netwerkverbinding verbroken'}`);
      setTimeout(() => setScanMessage(null), 5000);
    } finally {
      setIsScanning(false);
    }
  };

  // Handle config update
  const handleSaveConfig = async (newConfig: ResearchConfig) => {
    const res = await updateResearchConfig(newConfig);
    if (res.success) {
      setData(prev => prev ? { ...prev, config: res.config } : null);
      await loadDashboard();
    }
  };

  // Open report modal by report ID or report object
  const handleOpenReport = async (reportOrId: ResearchReport | string) => {
    if (typeof reportOrId === 'string') {
      const found = await fetchResearchReportById(reportOrId);
      if (found) setSelectedReport(found);
    } else {
      setSelectedReport(reportOrId);
    }
  };

  // Derived KPI metrics
  const kpi = useMemo(() => {
    if (!data) {
      return { active: 0, completed: 0, events: 0, monitored: 0 };
    }
    const assetsList = Object.values(data.config?.assets || {}) as AssetResearchConfig[];
    const monitored = assetsList.filter(a => a?.enabled).length;
    const active = data.activeEvents?.length ?? data.stats?.activeCount ?? 0;
    const completed = data.recentReports?.length ?? data.stats?.totalReports ?? 0;
    const events = data.recentEvents?.length ?? data.stats?.totalEvents ?? 0;
    return { active, completed, events, monitored };
  }, [data]);

  // Genuine in-progress research events (status NEW or RESEARCHING)
  const inProgressEvents = useMemo(() => {
    return (data?.activeEvents || []).filter(e => e.status === 'RESEARCHING' || e.status === 'NEW');
  }, [data?.activeEvents]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    if (!data?.recentReports) return [];
    if (!searchQuery.trim()) return data.recentReports;
    const q = searchQuery.toLowerCase();
    return data.recentReports.filter(r => 
      r.ticker.toLowerCase().includes(q) ||
      (r.assetName && r.assetName.toLowerCase().includes(q)) ||
      (r.asset && r.asset.toLowerCase().includes(q)) ||
      r.executiveSummary?.toLowerCase().includes(q) ||
      r.executive_summary?.toLowerCase().includes(q)
    );
  }, [data?.recentReports, searchQuery]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    if (!data?.recentEvents) return [];
    if (!searchQuery.trim()) return data.recentEvents;
    const q = searchQuery.toLowerCase();
    return data.recentEvents.filter(e => 
      e.ticker.toLowerCase().includes(q) ||
      (e.assetName && e.assetName.toLowerCase().includes(q)) ||
      (e.asset_name && e.asset_name.toLowerCase().includes(q)) ||
      (e.catalystSummary && e.catalystSummary.toLowerCase().includes(q))
    );
  }, [data?.recentEvents, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* 1. Command Header */}
      <div className="bg-gradient-to-r from-[#002d62] via-[#051c2c] to-[#0a2540] text-white rounded-2xl p-6 lg:p-8 shadow-sm border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-cyan-300">
              <Radar className="w-4 h-4 text-cyan-400" />
              <span>EVENT-DRIVEN MARKET INTELLIGENCE</span>
              <span aria-hidden="true">·</span>
              <span>DETERMINISTIC MONITOR</span>
              <span aria-hidden="true">·</span>
              <span>GEMINI 3.8 FLASH</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold tracking-tight text-white">
              Deep Market Research
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Autonome diepte-onderzoeken bij materiële koersuitslagen (zoals RTX -6.4% of Brent +4.2%). Getriggerd door deterministische drempelwaarden met Google Search Grounding en URL context zonder menselijke vooringenomenheid.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleScanNow}
              disabled={isScanning}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition shadow-sm cursor-pointer ${
                isScanning
                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 cursor-wait'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold'
              }`}
            >
              <Zap className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Markt Scannen...' : 'Scan Markets Nu'}</span>
            </button>

            <button
              onClick={() => setIsConfigOpen(true)}
              className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl transition border border-white/10 text-sm font-semibold cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-cyan-300" />
              <span>Configuratie</span>
            </button>

            <button
              onClick={loadDashboard}
              title="Vernieuw overzicht"
              className="p-3 bg-white/10 hover:bg-white/15 text-white rounded-xl transition border border-white/10 flex items-center justify-center cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Live Feedback Toast Banner */}
        {scanMessage && (
          <div className="mt-4 p-3 bg-cyan-950/80 border border-cyan-800 text-cyan-200 text-xs rounded-xl flex items-center gap-2 animate-in fade-in duration-300">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{scanMessage}</span>
          </div>
        )}

        {/* Invariant System Status Strip */}
        <div className="mt-6 pt-5 border-t border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-400 block text-[11px] font-sans">Trigger Protocol</span>
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              DETERMINISTISCH
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-sans">Monitor Interval</span>
            <span className="font-semibold text-white">
              {data?.config?.schedulerIntervalMin || 5} minuut cyclus
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-sans">Deduplicatie</span>
            <span className="font-semibold text-white">
              {data?.config?.dedupWindowHours || 24}u fingerprint venster
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-sans">Laatste Scan</span>
            <span className="font-semibold text-cyan-300">
              {data?.stats?.lastRunAt ? 'Zojuist actief' : 'Actief op schema'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Overview KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Research KPI */}
        <div className={`p-5 rounded-2xl border transition shadow-xs ${
          inProgressEvents.length > 0 
            ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
            <span className="uppercase tracking-wider">
              {inProgressEvents.length > 0 ? 'Lopend Onderzoek' : 'Actieve Katalysatoren'}
            </span>
            {inProgressEvents.length > 0 ? (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
              </span>
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}
          </div>
          <div className="text-2xl lg:text-3xl font-bold font-mono text-slate-900">
            {inProgressEvents.length > 0 ? inProgressEvents.length : kpi.active}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {inProgressEvents.length > 0 
              ? `${inProgressEvents.length} onderzoek(en) nu actief bezig...` 
              : `${kpi.active} marktbewegingen gemonitord (rapporten gereed)`}
          </p>
        </div>

        {/* Completed Reports KPI */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
            <span className="uppercase tracking-wider">Voltooide Rapporten</span>
            <FileText className="w-4 h-4 text-[#002d62]" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold font-mono text-[#002d62]">
            {kpi.completed}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Volledige 7-delige onderzoeksrapporten
          </p>
        </div>

        {/* Triggered Events KPI */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
            <span className="uppercase tracking-wider">Getriggerde Events</span>
            <Activity className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold font-mono text-slate-900">
            {kpi.events}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Drempeldoorbraken geregistreerd
          </p>
        </div>

        {/* Monitored Assets KPI */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
            <span className="uppercase tracking-wider">Monitored Activa</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl lg:text-3xl font-bold font-mono text-slate-900">
            {kpi.monitored}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Effecten, grondstoffen & rentes actief
          </p>
        </div>
      </div>

      {/* 3. Live Active Research Card (pulsing animation only when genuinely researching) */}
      {inProgressEvents.length > 0 && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-5 border border-blue-700 shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400"></span>
            </span>
            <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-cyan-200">
              Live Onderzoek in Uitvoering ({inProgressEvents.length})
            </h3>
          </div>
          <div className="space-y-3">
            {inProgressEvents.map(evt => (
              <div 
                key={evt.id}
                className="bg-white/10 rounded-xl p-4 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-400/20 text-cyan-300 font-mono font-bold text-xs">
                      {evt.ticker}
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {evt.assetName || evt.asset_name || evt.ticker}
                    </span>
                    <span className="text-xs text-rose-400 font-mono font-bold">
                      {evt.changePercent > 0 ? `+${evt.changePercent}%` : `${evt.changePercent}%`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {evt.catalystSummary || 'Deep Market Research protocol doorzoekt primaire bronnen en filings...'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-cyan-950 text-cyan-300 border border-cyan-700 animate-pulse">
                    Onderzoeken...
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Controls, Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Sub-tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Alles
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rapporten ({filteredReports.length})
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'events'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Events ({filteredEvents.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Zoek in rapporten (RTX, Brent, NVDA, FAA)..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {/* 5. Recent Completed Research Reports Section */}
      {(activeTab === 'all' || activeTab === 'reports') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#002d62]" />
              <h2 className="text-lg font-serif font-bold text-slate-900">
                Gevalideerde Onderzoeksrapporten
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {filteredReports.length} rapporten beschikbaar
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReports.map(report => {
              const change = report.changePercent ?? report.change_percent ?? 0;
              const isNegative = change < 0;
              const assetName = report.assetName || report.asset || report.ticker;
              const assetClass = report.assetClass || report.asset_class || 'Asset';

              return (
                <div
                  key={report.id}
                  onClick={() => handleOpenReport(report)}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition p-5 cursor-pointer flex flex-col justify-between group space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header line */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 p-1">
                          {report.ticker && report.ticker.length <= 5 && !report.ticker.includes('^') ? (
                            <StockLogo ticker={report.ticker} className="w-8 h-8 object-contain" />
                          ) : (
                            <Building2 className="w-5 h-5 text-slate-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-slate-900 group-hover:text-blue-700 transition">
                              {report.ticker}
                            </span>
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                              {assetClass}
                            </span>
                          </div>
                          <h3 className="text-xs font-semibold text-slate-600 truncate max-w-[220px]">
                            {assetName}
                          </h3>
                        </div>
                      </div>

                      {/* Movement badge */}
                      <div className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1 shrink-0 ${
                        isNegative
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {isNegative ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                        <span>{change > 0 ? `+${change.toFixed(2)}` : change.toFixed(2)}%</span>
                      </div>
                    </div>

                    {/* Executive summary teaser */}
                    <p className="text-xs text-slate-700 line-clamp-3 leading-relaxed">
                      {report.executiveSummary || report.executive_summary}
                    </p>
                  </div>

                  {/* Footer metadata */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono">
                        {report.confidence} CONFIDENCE
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {report.sources?.length || 0} bronnen
                      </span>
                    </div>

                    <div className="text-blue-600 group-hover:translate-x-0.5 transition flex items-center gap-1 font-semibold text-xs">
                      <span>Open Rapport</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Triggered Events History */}
      {(activeTab === 'all' || activeTab === 'events') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-serif font-bold text-slate-900">
                Triggered Events Geschiedenis
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {filteredEvents.length} geregistreerde marktgebeurtenissen
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Actief / Ticker</th>
                    <th className="py-3 px-4">Categorie</th>
                    <th className="py-3 px-4">Koersbeweging</th>
                    <th className="py-3 px-4">Trigger Reden</th>
                    <th className="py-3 px-4">Tijdstip</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Rapport</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEvents.map(evt => {
                    const change = evt.changePercent ?? evt.change_percent ?? 0;
                    const isNegative = change < 0;
                    const reportId = evt.reportId || evt.report_id;

                    // Check if event is from today's active session
                    const evtDate = evt.triggeredAt ? new Date(evt.triggeredAt) : null;
                    const today = new Date();
                    const isTodaySession = evtDate
                      ? evtDate.getUTCFullYear() === today.getUTCFullYear() &&
                        evtDate.getUTCMonth() === today.getUTCMonth() &&
                        evtDate.getUTCDate() === today.getUTCDate()
                      : false;

                    const formattedTime = evtDate
                      ? evtDate.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) + ' CET'
                      : 'Vandaag';
                    const formattedDate = evtDate
                      ? evtDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
                      : '';

                    return (
                      <tr key={evt.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{evt.ticker}</span>
                            <span className="text-slate-500 truncate max-w-[140px] font-sans">
                              {evt.assetName || evt.asset_name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                          {evt.assetClass || evt.asset_class}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold">
                          <div className="flex flex-col">
                            <span className={`text-sm ${isNegative ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {change > 0 ? `+${change}%` : `${change}%`}
                            </span>
                            {isTodaySession ? (
                              <span className="text-[10px] text-cyan-700 font-mono flex items-center gap-1 font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                                Live sessie
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono font-normal">
                                Eindstand sessie
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                          {evt.catalystSummary || evt.trigger_reason || 'Drempelwaarde overschreden'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          <div className="flex flex-col">
                            <span className="text-slate-700 font-medium">
                              {isTodaySession ? `Vandaag, ${formattedTime}` : `${formattedDate}, ${formattedTime}`}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {isTodaySession ? 'Huidige sessie' : 'Afgesloten sessie'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {isTodaySession && evt.status === 'ACTIVE' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              LIVE ACTIEF
                            </span>
                          ) : isTodaySession && evt.status === 'RESEARCHING' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-cyan-50 text-cyan-800 border border-cyan-200 inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                              ONDERZOEKEN...
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-100 text-slate-600 border border-slate-200">
                              {evt.status === 'COOLED_DOWN' ? 'SESSIE AFGEROND' : evt.status}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {reportId ? (
                            <button
                              onClick={() => handleOpenReport(reportId)}
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                            >
                              <span>Bekijk</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-slate-300 font-mono">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {selectedReport && (
        <ResearchReportModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}

      {/* Config Modal */}
      {isConfigOpen && data?.config && (
        <ResearchConfigModal
          config={data.config}
          onSave={handleSaveConfig}
          onClose={() => setIsConfigOpen(false)}
        />
      )}

    </div>
  );
};
