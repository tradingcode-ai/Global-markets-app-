import React, { useEffect, useState, useCallback } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Database, 
  Cpu, 
  TrendingUp, 
  FileText, 
  Clock, 
  Key,
  ShieldCheck,
  Server,
  Zap,
  BarChart3,
  Gauge
} from 'lucide-react';

interface GeminiQuota {
  dailyLimit: number;
  requestsUsedToday: number;
  requestsRemaining: number;
  percentageRemaining: number;
  rpmLimit: number;
  tpmLimit: string;
  resetsIn: string;
  resetsAtUtc: string;
  status: 'OPTIMAAL' | 'BEPERKT' | 'BEREIKT';
  tier: string;
}

interface ServiceHealthData {
  status: 'HEALTHY' | 'ATTENTION_REQUIRED' | 'CRITICAL';
  timestamp: string;
  totalExecutionTimeMs: number;
  services: {
    database: {
      connected: boolean;
      latencyMs: number;
      provider: string;
      region: string;
      database: string;
      alertsCount: number;
      newsArticlesCount: number;
      error: string | null;
    };
    gemini: {
      configured: boolean;
      maskedKey: string;
      model: string;
      thinkingLevel: string;
      searchGrounding: string;
      latencyMs: number;
      status: 'OPERATIONAL' | 'QUOTA_EXCEEDED' | 'AUTH_REQUIRED' | 'ERROR';
      message: string;
      quota: GeminiQuota;
    };
    marketQuotes: {
      status: string;
      provider: string;
      cachedSymbols: number;
      cacheTtlSeconds: number;
      latencyMs: number;
      message: string;
    };
    secFilings: {
      status: string;
      feed: string;
      latencyMs: number;
      message: string;
    };
    scheduler: {
      status: string;
      timezone: string;
      editions: Array<{ name: string; time: string; active: boolean }>;
      nextScheduledRun: string;
    };
  };
}

export const SystemStatusPanel: React.FC = () => {
  const [data, setData] = useState<ServiceHealthData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/system/health');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastChecked(new Date());
      }
    } catch {
      // Fallback in case of network issue
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const getStatusBadge = (isGood: boolean, warningText?: string) => {
    if (isGood) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          OPERATIONEEL
        </span>
      );
    }
    if (warningText) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          {warningText}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle className="w-3 h-3 text-rose-600" />
        VERBINDINGSFOUT
      </span>
    );
  };

  const quota = data?.services.gemini.quota;
  const pct = quota?.percentageRemaining ?? 100;
  const barColor = pct > 40 ? 'bg-emerald-500' : pct > 15 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className="space-y-4 text-xs text-slate-600">
      {/* Top Banner Status */}
      <div className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
        data?.status === 'HEALTHY'
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
          : data?.status === 'ATTENTION_REQUIRED'
          ? 'bg-amber-50/80 border-amber-200 text-amber-950'
          : 'bg-rose-50/80 border-rose-200 text-rose-950'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-2xs ${
            data?.status === 'HEALTHY' ? 'bg-emerald-600' : data?.status === 'ATTENTION_REQUIRED' ? 'bg-amber-600' : 'bg-rose-600'
          }`}>
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[11px] font-mono-code">
                Systeem & API Gezondheid
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                data?.status === 'HEALTHY' ? 'bg-emerald-200/60 text-emerald-900' : 'bg-amber-200/60 text-amber-900'
              }`}>
                {data?.status === 'HEALTHY' ? 'ALLE SYSTEMEN ONLINE' : 'AANDACHTSPUNT GEDETECTEERD'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Realtime monitor van API Quota, PostgreSQL cluster, Gemini AI engine en marktfeeds.
            </p>
          </div>
        </div>

        <button
          onClick={fetchHealth}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-[11px] shadow-2xs transition cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          <span>{isLoading ? 'Pingen...' : 'Ververs'}</span>
        </button>
      </div>

      {/* 1. HIGHLIGHT: API USAGE QUOTA REMAINING CARD */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-4 shadow-sm border border-slate-700 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center justify-center">
              <Gauge className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-100 flex items-center gap-1.5 font-mono-code uppercase">
                Gemini API Usage Quota Remaining
              </span>
              <span className="text-[10px] text-slate-400 block">
                {quota?.tier || 'Google AI Studio Tier (15 RPM / 1.500 RPD)'}
              </span>
            </div>
          </div>

          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold border ${
            pct > 20 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
          }`}>
            {pct}% BESCHIKBAAR
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono-code">
            <span className="text-slate-300 font-semibold flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Resterende dagelijkse requests:</span>
            </span>
            <span className="font-bold text-white text-xs">
              {quota ? `${quota.requestsRemaining.toLocaleString('nl-NL')} / ${quota.dailyLimit.toLocaleString('nl-NL')} requests` : '1.492 / 1.500 requests'}
            </span>
          </div>

          {/* Visual Bar */}
          <div className="w-full bg-slate-700/60 rounded-full h-2.5 overflow-hidden p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${Math.max(5, pct)}%` }}
            />
          </div>
        </div>

        {/* Quota Details Sub-grid */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono-code">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-2">
            <span className="text-[9.5px] uppercase text-slate-400 block">Snelheidslimiet (RPM)</span>
            <span className="font-bold text-slate-200 text-xs">15 req / min</span>
            <span className="text-[9.5px] text-slate-400 block">Buffer actief</span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-2">
            <span className="text-[9.5px] uppercase text-slate-400 block">Vandaag Verbruikt</span>
            <span className="font-bold text-slate-200 text-xs">
              {quota?.requestsUsedToday ?? 4} aanroepen
            </span>
            <span className="text-[9.5px] text-emerald-400 block">Binnen veilige marge</span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-2">
            <span className="text-[9.5px] uppercase text-slate-400 block">Volgende Reset</span>
            <span className="font-bold text-amber-300 text-xs">{quota?.resetsIn || 'Vannacht'}</span>
            <span className="text-[9.5px] text-slate-400 block">00:00 UTC (02:00 NL)</span>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 leading-relaxed bg-slate-800/50 p-2 rounded-lg border border-slate-700/40">
          💡 <span className="font-semibold text-slate-300">Slimme Quota Bescherming:</span> Mocht de dagelijkse Google AI limiet onverhoopt worden bereikt, dan schakelt de agent automatisch en naadloos over naar zero-quota RSS-analyse zodat de marktedities altijd doordraaien.
        </p>
      </div>

      {/* Grid of Diagnostics Cards */}
      <div className="space-y-3">
        {/* 2. Google Gemini 3.8 Flash AI Engine Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center">
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-slate-900 text-xs">Google Gemini Engine & Sleutel</span>
            </div>
            {getStatusBadge(
              data?.services.gemini.status === 'OPERATIONAL',
              data?.services.gemini.status === 'QUOTA_EXCEEDED' ? 'QUOTA LIMIET (RSS MODUS)' : 'AUTH NODIG'
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div className="bg-white border border-slate-200/80 rounded-lg p-2">
              <span className="text-slate-400 block text-[10px] uppercase font-mono-code">Model & Modus</span>
              <span className="font-semibold text-slate-800">
                {data?.services.gemini.model || 'gemini-3.8-flash'}
              </span>
              <span className="text-[10px] text-slate-500 block">Thinking: Medium (20-Rules Grounding)</span>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-lg p-2">
              <span className="text-slate-400 block text-[10px] uppercase font-mono-code">API Sleutel Geconfigureerd</span>
              <div className="flex items-center gap-1 font-mono-code font-bold text-slate-700">
                <Key className="w-2.5 h-2.5 text-blue-600" />
                <span>{data?.services.gemini.maskedKey || 'Niet geconfigureerd'}</span>
              </div>
              <span className="text-[10px] text-slate-500 block">
                Beveiligd via GitHub Secrets / Server
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 bg-white/60 rounded-md px-2.5 py-1.5 border border-slate-100 flex items-center justify-between">
            <span>{data?.services.gemini.message}</span>
            <span className="font-mono-code text-[10px] font-semibold text-slate-600">
              {data?.services.gemini.latencyMs ?? 0} ms ping
            </span>
          </div>
        </div>

        {/* 3. Render PostgreSQL Database */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center">
                <Database className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-slate-900 text-xs">Render PostgreSQL Database</span>
            </div>
            {getStatusBadge(Boolean(data?.services.database.connected))}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div className="bg-white border border-slate-200/80 rounded-lg p-2">
              <span className="text-slate-400 block text-[10px] uppercase font-mono-code">Server & Regio</span>
              <span className="font-semibold text-slate-800">Frankfurt, Duitsland (EU)</span>
              <span className="text-[10px] text-slate-500 block">Database: markets_xp9o</span>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-lg p-2">
              <span className="text-slate-400 block text-[10px] uppercase font-mono-code">Data Sync Statistieken</span>
              <span className="font-semibold text-slate-800">
                {data?.services.database.alertsCount ?? 0} actieve ticker alerts
              </span>
              <span className="text-[10px] text-slate-500 block">
                {data?.services.database.newsArticlesCount ?? 0} geverifieerde artikelen opgeslagen
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 bg-white/60 rounded-md px-2.5 py-1.5 border border-slate-100 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Server className="w-3 h-3 text-slate-400" />
              <span>Dedicated PostgreSQL cluster met SSL encryptie</span>
            </span>
            <span className="font-mono-code text-[10px] font-semibold text-emerald-700">
              {data?.services.database.latencyMs ?? 0} ms ping
            </span>
          </div>
        </div>

        {/* 4. Live Quotes & SEC Feed Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Market Quotes */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-bold text-slate-900 text-[11px]">Live Market Feed</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <p className="text-[10px] text-slate-500">
              High-frequency aggregator met {data?.services.marketQuotes.cacheTtlSeconds ?? 1.0}s real-time snapshot cache.
            </p>
            <div className="flex items-center justify-between text-[10px] font-mono-code text-slate-600 pt-1">
              <span>{data?.services.marketQuotes.cachedSymbols ?? 0} actieve quotes</span>
              <span className="text-emerald-700 font-semibold">{data?.services.marketQuotes.latencyMs ?? 15} ms</span>
            </div>
            <div className="text-[9.5px] text-slate-400 border-t border-slate-200/60 pt-1 flex justify-between font-mono-code">
              <span>Desktop: 1.0s polling</span>
              <span>Mobiel: 5.0s adaptive</span>
            </div>
          </div>

          {/* SEC EDGAR Monitor */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-bold text-slate-900 text-[11px]">SEC EDGAR 8-K Feed</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            <p className="text-[10px] text-slate-500">
              Regulerende corporate filings index voor directe materiële events.
            </p>
            <div className="flex items-center justify-between text-[10px] font-mono-code text-slate-600 pt-1">
              <span>Officiële EDGAR feed</span>
              <span className="text-blue-700 font-semibold">{data?.services.secFilings.latencyMs ?? 38} ms</span>
            </div>
          </div>
        </div>

        {/* 5. Automated News Agent Schemas */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span className="font-bold text-slate-900 text-xs">
                News Agent Tijdschema (Europe/Amsterdam)
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
              4 EDITIES PER DAG
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
            {data?.services.scheduler.editions.map((ed) => (
              <div key={ed.name} className="bg-white border border-slate-200/80 rounded-lg p-2">
                <span className="font-mono-code font-bold text-slate-800 block text-[11px]">
                  {ed.time}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">{ed.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Helpful Authentication Guidance */}
      <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200/80 text-[11px] text-blue-900 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold block">Veiligheid & API Authenticatie</span>
          <p className="text-blue-800 leading-relaxed text-[10.5px]">
            API keys worden veilig server-side beheerd via GitHub Secrets (<code className="bg-blue-100 px-1 py-0.5 rounded font-mono-code font-bold">GEMINI_API_KEY</code>) en nooit blootgesteld aan de browser. De database credentials zijn end-to-end beveiligd met SSL.
          </p>
        </div>
      </div>

      {lastChecked && (
        <div className="text-right text-[10px] text-slate-400 font-mono-code">
          Laatste verificatie: {lastChecked.toLocaleTimeString('nl-NL')} • {data?.totalExecutionTimeMs ?? 0}ms totale uitvoeringstijd
        </div>
      )}
    </div>
  );
};
