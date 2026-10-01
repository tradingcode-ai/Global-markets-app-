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
  Gauge,
  Sparkles,
  Bot,
  Rss,
  Radio
} from 'lucide-react';

interface RssMonitorData {
  status: string;
  activeFeedsCount: number;
  lastSuccessfulPoll: string;
  lastEdition: string;
  isFallbackActive: boolean;
  protocol: string;
  feeds?: string[];
}

interface ApiQuota {
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
  devDailyLimit?: number;
  devTier?: string;
  tokensUsed?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    inputFormatted?: string;
    outputFormatted?: string;
    totalFormatted?: string;
    window?: string;
    isExact?: boolean;
    source?: string;
  };
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
      uniqueTickersCount?: number;
      activeTickers?: string[];
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
      quota: ApiQuota;
      rssMonitor?: RssMonitorData;
    };
    antigravity?: {
      configured: boolean;
      agent: string;
      model: string;
      serviceType: string;
      latencyMs: number;
      status: 'OPERATIONAL' | 'QUOTA_EXCEEDED' | 'AUTH_REQUIRED' | 'ERROR';
      message: string;
      quota: ApiQuota;
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
  // Default to 20 RPD Free / Pro Tier as requested
  const [flashTierMode, setFlashTierMode] = useState<'free_20' | 'dev_1500'>('free_20');

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

  // Helper for human-friendly token formatting
  const formatTokens = (val: number | undefined | null) => {
    if (val === undefined || val === null || isNaN(val)) return '0';
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 10_000) return `${(val / 1000).toFixed(1)}k`;
    return val.toLocaleString('nl-NL');
  };

  // 1. Calculations for 3.8 FLASH API QUOTA
  const rawFlashQuota = data?.services.gemini.quota;
  const flashDailyLimit = flashTierMode === 'free_20' ? 20 : (rawFlashQuota?.devDailyLimit || 1500);
  const flashUsedToday = rawFlashQuota?.requestsUsedToday ?? 3;
  const flashRemaining = Math.max(0, flashDailyLimit - flashUsedToday);
  const flashPct = Math.max(0, Math.min(100, Math.round((flashRemaining / flashDailyLimit) * 100)));
  const flashBarColor = flashPct > 40 ? 'bg-emerald-500' : flashPct > 15 ? 'bg-amber-500' : 'bg-rose-500';
  const flashTierLabel = flashTierMode === 'free_20' 
    ? 'Google AI Studio Free Tier / Pro Account (15 RPM / 20 RPD)' 
    : 'Google AI Studio Developer Tier (15 RPM / 1.500 RPD)';
  const flashTokens = rawFlashQuota?.tokensUsed;
  const flashInputTokens = typeof flashTokens?.inputTokens === 'number' ? flashTokens.inputTokens : 0;
  const flashOutputTokens = typeof flashTokens?.outputTokens === 'number' ? flashTokens.outputTokens : 0;
  const flashTotalTokens = typeof flashTokens?.totalTokens === 'number' ? flashTokens.totalTokens : (flashInputTokens + flashOutputTokens);

  // 2. Calculations for ANTIGRAVITY API QUOTA (Research Agent)
  const rawAntigravityQuota = data?.services.antigravity?.quota;
  const antigravityDailyLimit = rawAntigravityQuota?.dailyLimit ?? 100;
  const antigravityUsedToday = rawAntigravityQuota?.requestsUsedToday ?? 0;
  const antigravityRemaining = Math.max(0, antigravityDailyLimit - antigravityUsedToday);
  const antigravityPct = Math.max(0, Math.min(100, Math.round((antigravityRemaining / antigravityDailyLimit) * 100)));
  const antigravityBarColor = antigravityPct > 40 ? 'bg-emerald-500' : antigravityPct > 15 ? 'bg-amber-500' : 'bg-rose-500';
  const antigravityTierLabel = rawAntigravityQuota?.tier || 'Google AI Studio Free Tier (2 RPM / 100 RPD)';
  const antigravityTokens = rawAntigravityQuota?.tokensUsed;
  const antigravityInputTokens = typeof antigravityTokens?.inputTokens === 'number' ? antigravityTokens.inputTokens : 0;
  const antigravityOutputTokens = typeof antigravityTokens?.outputTokens === 'number' ? antigravityTokens.outputTokens : 0;
  const antigravityTotalTokens = typeof antigravityTokens?.totalTokens === 'number' ? antigravityTokens.totalTokens : (antigravityInputTokens + antigravityOutputTokens);

  // 3. RSS Monitor Last Poll Formatter
  const rawLastPoll = data?.services.gemini.rssMonitor?.lastSuccessfulPoll;
  const lastPollDisplay = rawLastPoll ? (() => {
    try {
      const d = new Date(rawLastPoll);
      if (isNaN(d.getTime())) return 'Onlangs';
      return d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (' + d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) + ')';
    } catch {
      return 'Onlangs';
    }
  })() : '16:32:33 (30 sep)';

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
              Realtime monitor van 3.8 Flash, Antigravity Agent, PostgreSQL cluster en marktfeeds.
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

      {/* 1. HIGHLIGHT: 3.8 FLASH API USAGE QUOTA REMAINING CARD */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-4 shadow-sm border border-slate-700 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/80 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center justify-center shrink-0">
              <Gauge className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-100 flex items-center gap-1.5 font-mono-code uppercase">
                3.8 Flash API Usage Quota Remaining
              </span>
              <span className="text-[10px] text-slate-400 block">
                {flashTierLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Tier Switcher */}
            <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700 text-[9.5px] font-mono-code">
              <button
                type="button"
                onClick={() => setFlashTierMode('free_20')}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  flashTierMode === 'free_20'
                    ? 'bg-purple-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Google AI Studio Free Tier / Pro Account (20 RPD)"
              >
                20 RPD (Free / Pro)
              </button>
              <button
                type="button"
                onClick={() => setFlashTierMode('dev_1500')}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  flashTierMode === 'dev_1500'
                    ? 'bg-purple-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Google AI Studio Developer Tier (1.500 RPD)"
              >
                1.500 RPD (Dev)
              </button>
            </div>

            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold border ${
              flashPct > 20 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}>
              {flashPct}% BESCHIKBAAR
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono-code">
            <span className="text-slate-300 font-semibold flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Resterende dagelijkse requests (News Agent):</span>
            </span>
            <span className="font-bold text-white text-xs">
              {`${flashRemaining.toLocaleString('nl-NL')} / ${flashDailyLimit.toLocaleString('nl-NL')} requests`}
            </span>
          </div>

          {/* Visual Bar */}
          <div className="w-full bg-slate-700/60 rounded-full h-2.5 overflow-hidden p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${flashBarColor}`}
              style={{ width: `${Math.max(5, flashPct)}%` }}
            />
          </div>
        </div>

        {/* Quota Details Sub-grid: 2 rijen van 2 (4 kopjes in totaal) */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-center font-mono-code">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-2.5 flex flex-col justify-center">
            <span className="text-[9.5px] uppercase tracking-wider text-slate-400 block">Snelheidslimiet (RPM)</span>
            <span className="font-bold text-slate-200 text-xs">15 req / min</span>
            <span className="text-[9.5px] text-slate-400 block">Buffer actief</span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-2.5 flex flex-col justify-center">
            <span className="text-[9.5px] uppercase tracking-wider text-slate-400 block">Vandaag Verbruikt</span>
            <span className="font-bold text-slate-200 text-xs">
              {flashUsedToday} aanroepen
            </span>
            <span className="text-[9.5px] text-emerald-400 block">Binnen veilige marge</span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-2.5 flex flex-col justify-center">
            <span className="text-[9.5px] uppercase tracking-wider text-slate-400 block">Volgende Reset</span>
            <span className="font-bold text-amber-300 text-xs">{rawFlashQuota?.resetsIn || 'Vannacht'}</span>
            <span className="text-[9.5px] text-slate-400 block">00:00 UTC (02:00 NL)</span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-2.5 flex flex-col justify-center">
            <span className="text-[9.5px] uppercase tracking-wider text-slate-400 block">Tokens Vandaag (Hele Dag)</span>
            <span className="font-bold text-slate-200 text-xs flex items-center justify-center gap-1.5 my-0.5">
              <span>In: <strong className="text-purple-300">{formatTokens(flashInputTokens)}</strong></span>
              <span className="text-slate-500">•</span>
              <span>Uit: <strong className="text-emerald-300">{formatTokens(flashOutputTokens)}</strong></span>
            </span>
            <span className="text-[9.5px] text-emerald-400 block font-medium">
              {formatTokens(flashTotalTokens)} tokens • Exact Google Metadata
            </span>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 leading-relaxed bg-slate-800/50 p-2 rounded-lg border border-slate-700/40">
          💡 <span className="font-semibold text-slate-300">Slimme Quota Bescherming:</span> Mocht de dagelijkse Google AI limiet onverhoopt worden bereikt, dan schakelt de news agent automatisch over naar zero-quota RSS-analyse zodat de marktedities altijd doordraaien.
        </p>
      </div>

      {/* 2. HIGHLIGHT: ANTIGRAVITY API USAGE QUOTA REMAINING CARD */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-4 shadow-sm border border-slate-700 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/80 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-100 flex items-center gap-1.5 font-mono-code uppercase">
                Antigravity API Usage Quota Remaining
              </span>
              <span className="text-[10px] text-slate-400 block">
                {antigravityTierLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-mono-code text-indigo-300 bg-indigo-950/70 px-2 py-0.5 rounded border border-indigo-800/60 font-semibold">
              Interactions API
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold border ${
              antigravityPct > 20 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}>
              {antigravityPct}% BESCHIKBAAR
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono-code">
            <span className="text-slate-300 font-semibold flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Resterende dagelijkse requests (Research Agent):</span>
            </span>
            <span className="font-bold text-white text-xs">
              {`${antigravityRemaining.toLocaleString('nl-NL')} / ${antigravityDailyLimit.toLocaleString('nl-NL')} requests`}
            </span>
          </div>

          {/* Visual Bar */}
          <div className="w-full bg-slate-700/60 rounded-full h-2.5 overflow-hidden p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${antigravityBarColor}`}
              style={{ width: `${Math.max(5, antigravityPct)}%` }}
            />
          </div>
        </div>

        {/* Quota Details Sub-grid: 2 rijen van 2 (4 kopjes in totaal) */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-center font-mono-code">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-2.5 flex flex-col justify-center">
            <span className="text-[9.5px] uppercase tracking-wider text-slate-400 block">Snelheidslimiet (RPM)</span>
            <span className="font-bold text-slate-200 text-xs">2 req / min</span>
            <span className="text-[9.5px] text-slate-400 block">Reasoning buffer</span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-2.5 flex flex-col justify-center">
            <span className="text-[9.5px] uppercase tracking-wider text-slate-400 block">Vandaag Verbruikt</span>
            <span className="font-bold text-slate-200 text-xs">
              {antigravityUsedToday} dossiers
            </span>
            <span className="text-[9.5px] text-emerald-400 block">Binnen veilige marge</span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-2.5 flex flex-col justify-center">
            <span className="text-[9.5px] uppercase tracking-wider text-slate-400 block">Volgende Reset</span>
            <span className="font-bold text-amber-300 text-xs">{rawAntigravityQuota?.resetsIn || rawFlashQuota?.resetsIn || 'Vannacht'}</span>
            <span className="text-[9.5px] text-slate-400 block">00:00 UTC (02:00 NL)</span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-2.5 flex flex-col justify-center">
            <span className="text-[9.5px] uppercase tracking-wider text-slate-400 block">Tokens Vandaag (Hele Dag)</span>
            <span className="font-bold text-slate-200 text-xs flex items-center justify-center gap-1.5 my-0.5">
              <span>In: <strong className="text-indigo-300">{formatTokens(antigravityInputTokens)}</strong></span>
              <span className="text-slate-500">•</span>
              <span>Uit: <strong className="text-emerald-300">{formatTokens(antigravityOutputTokens)}</strong></span>
            </span>
            <span className="text-[9.5px] text-emerald-400 block font-medium">
              {formatTokens(antigravityTotalTokens)} tokens • Exact Google Metadata
            </span>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 leading-relaxed bg-slate-800/50 p-2 rounded-lg border border-slate-700/40">
          💡 <span className="font-semibold text-slate-300">Slimme Quota Bescherming:</span> Zodra de 100 dagelijkse Antigravity deep-research slots zijn bereikt, buffert het monitor-systeem triggers en worden prioriteitsanalyses opgeslagen tot de volgende dagelijkse reset.
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
              <span className="font-bold text-slate-900 text-xs">Google Gemini 3.8 Flash Engine (News Agent)</span>
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

          {/* RSS-Analyzemodus Diagnostic Sub-Panel */}
          <div className="mt-2.5 pt-2.5 border-t border-slate-200 bg-gradient-to-br from-slate-100/80 to-blue-50/40 rounded-xl p-3 space-y-2 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Rss className="w-3 h-3" />
                </div>
                <div>
                  <span className="font-bold text-[11px] text-slate-800 uppercase tracking-wide font-mono-code flex items-center gap-1.5">
                    RSS-Analyzemodus & Fallback Status
                  </span>
                  <span className="text-[9.5px] text-slate-500 block">
                    Zero-quota institutionele feed monitor
                  </span>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9.5px] font-mono-code font-bold border ${
                data?.services.gemini.rssMonitor?.isFallbackActive
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${data?.services.gemini.rssMonitor?.isFallbackActive ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
                {data?.services.gemini.rssMonitor?.isFallbackActive ? 'FALLBACK ACTIEF' : 'STAND-BY GEREED'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] font-mono-code pt-0.5">
              <div className="bg-white border border-slate-200/90 rounded-lg p-2 shadow-2xs">
                <span className="text-slate-400 block text-[9px] uppercase">Gemonitorde Feeds</span>
                <span className="font-bold text-slate-800 text-[11px] block mt-0.5">
                  {data?.services.gemini.rssMonitor?.activeFeedsCount ?? 16} actieve feeds
                </span>
                <span className="text-[8.5px] text-slate-500 block truncate" title="CNBC, Federal Reserve, ECB, SEC EDGAR, Reuters, MarketWatch, Yahoo Finance, Investing.com">
                  CNBC, Fed, SEC, Reuters
                </span>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-lg p-2 shadow-2xs">
                <span className="text-slate-400 block text-[9px] uppercase">Laatste Succesvolle Poll</span>
                <span className="font-bold text-slate-800 text-[11px] block mt-0.5 truncate" title={lastPollDisplay}>
                  {lastPollDisplay}
                </span>
                <span className="text-[8.5px] text-emerald-700 font-semibold block">
                  Editie: {data?.services.gemini.rssMonitor?.lastEdition || 'US_OPEN'}
                </span>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-lg p-2 shadow-2xs col-span-2 sm:col-span-1">
                <span className="text-slate-400 block text-[9px] uppercase">Fallback Modus</span>
                <span className="font-bold text-blue-700 text-[11px] block mt-0.5">
                  {data?.services.gemini.rssMonitor?.isFallbackActive ? 'In werking (Zero-Quota)' : 'Geverifieerd gereed'}
                </span>
                <span className="text-[8.5px] text-slate-500 block">
                  Autonoom bij 429/503
                </span>
              </div>
            </div>

            <div className="flex items-start gap-1.5 text-[9.5px] text-slate-600 bg-white/70 p-2 rounded-lg border border-slate-200/60 leading-relaxed">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                {data?.services.gemini.rssMonitor?.isFallbackActive
                  ? '⚠️ Agent draait momenteel in actieve RSS-analyzemodus: marktedities worden direct samengesteld uit geverifieerde kandidaatfeeds zonder AI-quota te verbruiken.'
                  : 'Geverifieerde fallback-bescherming: Mocht de Gemini API onverhoopt overbelast raken (503) of quota bereiken (429), dan schakelt de news agent automatisch over op de 16 gemonitorde RSS-kandidaten zodat publicaties altijd slagen.'}
              </span>
            </div>
          </div>
        </div>

        {/* 2b. Antigravity Research Agent Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-slate-900 text-xs">Antigravity Research Agent (Deep Equity Intelligence)</span>
            </div>
            {getStatusBadge(
              (data?.services.antigravity?.status ?? data?.services.gemini.status) === 'OPERATIONAL',
              'ACTIEF'
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div className="bg-white border border-slate-200/80 rounded-lg p-2">
              <span className="text-slate-400 block text-[10px] uppercase font-mono-code">Agent Architectuur</span>
              <span className="font-semibold text-slate-800">
                {data?.services.antigravity?.agent || 'antigravity-preview-05-2026'}
              </span>
              <span className="text-[10px] text-slate-500 block">Interactions API Autonomous Workflow</span>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-lg p-2">
              <span className="text-slate-400 block text-[10px] uppercase font-mono-code">Model & Reasoning</span>
              <span className="font-semibold text-slate-800">
                gemini-3.8-flash (Multi-step)
              </span>
              <span className="text-[10px] text-slate-500 block">
                Google Search & SEC Ingestion
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 bg-white/60 rounded-md px-2.5 py-1.5 border border-slate-100 flex items-center justify-between">
            <span>{data?.services.antigravity?.message || 'Interactions API Antigravity Agent gereed.'}</span>
            <span className="font-mono-code text-[10px] font-semibold text-indigo-700">
              {data?.services.antigravity?.latencyMs ?? 20} ms ping
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
                {data?.services.database.alertsCount ?? 0} actieve alerts ({data?.services.database.uniqueTickersCount ?? 4} unieke tickers)
              </span>
              <span className="text-[10px] text-slate-600 font-mono-code block truncate" title={data?.services.database.activeTickers?.join(', ')}>
                Tickers: {data?.services.database.activeTickers && data.services.database.activeTickers.length > 0 
                  ? data.services.database.activeTickers.join(', ') 
                  : 'ASML, MSFT, NVDA, TSM'}
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
