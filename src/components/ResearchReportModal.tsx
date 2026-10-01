import React, { useEffect, useMemo } from 'react';
import { ResearchReport, ResearchSource } from '../types/marketResearch';
import { StockLogo } from './StockLogo';
import { ReportMacroChart } from './ReportMacroChart';
import { 
  X, 
  ExternalLink, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Clock, 
  Building2, 
  FileText, 
  Layers, 
  CheckCircle2, 
  Eye, 
  HelpCircle,
  Copy,
  Check,
  Compass,
  ArrowRight
} from 'lucide-react';

interface ResearchReportModalProps {
  report: ResearchReport | null;
  onClose: () => void;
}

export const ResearchReportModal: React.FC<ResearchReportModalProps> = ({
  report,
  onClose
}) => {
  const [copied, setCopied] = React.useState(false);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!report) return null;

  const changePercent = report.changePercent ?? report.change_percent ?? 0;
  const isNegative = changePercent < 0;
  const ticker = report.ticker;
  const assetName = report.assetName || report.asset || ticker;
  const assetClass = report.assetClass || report.asset_class || 'Asset';
  const period = report.period || report.movement_period || '1D';
  const timestamp = report.triggerTimestamp || report.trigger_timestamp || report.createdAt;

  // Format timestamp in European / Wall Street time
  const formattedTime = useMemo(() => {
    try {
      const d = new Date(timestamp);
      if (isNaN(d.getTime())) return timestamp;
      return new Intl.DateTimeFormat('nl-NL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Amsterdam'
      }).format(d) + ' CET';
    } catch {
      return timestamp;
    }
  }, [timestamp]);

  // Parse immediate catalyst into Facts, Claims, and Inference
  const catalystSections = useMemo(() => {
    const text = typeof report.immediateCatalyst === 'string' 
      ? report.immediateCatalyst 
      : report.immediate_catalyst 
        ? (typeof report.immediate_catalyst === 'string' ? report.immediate_catalyst : JSON.stringify(report.immediate_catalyst))
        : '';

    let facts: string[] = [];
    let claims: string[] = [];
    let inference: string[] = [];
    let general: string[] = [];

    if (text) {
      const factMatch = text.match(/CONFIRMED FACT[S]?:?([\s\S]*?)(?=REPORTED CLAIM|ANALYSIS \/ INFERENCE|$)/i);
      const claimMatch = text.match(/REPORTED CLAIM[S]?:?([\s\S]*?)(?=ANALYSIS \/ INFERENCE|CONFIRMED FACT|$)/i);
      const inferenceMatch = text.match(/(?:ANALYSIS \/ INFERENCE|INFERENCE):?([\s\S]*?)(?=CONFIRMED FACT|REPORTED CLAIM|$)/i);

      if (factMatch && factMatch[1]?.trim()) {
        facts = factMatch[1].trim().split('\n').map(s => s.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
      }
      if (claimMatch && claimMatch[1]?.trim()) {
        claims = claimMatch[1].trim().split('\n').map(s => s.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
      }
      if (inferenceMatch && inferenceMatch[1]?.trim()) {
        inference = inferenceMatch[1].trim().split('\n').map(s => s.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
      }

      if (facts.length === 0 && claims.length === 0 && inference.length === 0) {
        general = text.split('\n\n').filter(Boolean);
      }
    }

    return { facts, claims, inference, general };
  }, [report.immediateCatalyst, report.immediate_catalyst]);

  const handleCopySummary = () => {
    const textToCopy = `[GLOBAL MARKETS RESEARCH] ${ticker} (${assetName}) ${changePercent >= 0 ? '+' : ''}${changePercent}%\n\nExecutive Summary:\n${report.executiveSummary || report.executive_summary}\n\nConfidence: ${report.confidence}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSourceBadge = (cat?: string) => {
    const c = (cat || '').toUpperCase();
    if (c.includes('PRIMARY')) {
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">PRIMARY / OFFICIAL</span>;
    }
    if (c.includes('REAL_TIME') || c.includes('SIGNAL')) {
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-300">REAL-TIME SIGNAL</span>;
    }
    if (c.includes('SPECIALIST')) {
      return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-100 text-purple-800 border border-purple-300">SPECIALIST INTEL</span>;
    }
    return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 text-blue-800 border border-blue-300">FINANCIAL NEWS</span>;
  };

  const executiveSummary = report.executiveSummary || report.executive_summary || '';
  const directMarketImpact = report.directMarketImpact || report.direct_market_impact || '';
  const broaderContext = report.broaderContext || report.broader_context || '';
  const whatMarketIsReactingTo = report.whatMarketIsReactingTo || report.market_reaction || '';
  const whatToWatchNext = report.whatToWatchNext || report.what_to_watch_next || '';
  const confidence = report.confidence || 'MEDIUM';
  const confidenceExplanation = report.confidenceExplanation || report.confidence_explanation || '';
  const sources = report.sources || [];
  const visualPayload = report.visualPayload || report.visual_payload;
  const hero = visualPayload?.hero;
  const heroImageUrl = hero?.imageUrl || hero?.image_url;
  const heroCredit = hero?.photographerCredit || hero?.photographer_credit;
  const heroLocation = hero?.locationLabel || hero?.location_label;
  const macroChart = visualPayload?.macroChart || visualPayload?.macro_chart;
  const marketCapImpact = visualPayload?.marketCapImpactUsdBillions ?? visualPayload?.market_cap_impact_usd_billions;
  const transmissionSteps = visualPayload?.transmissionSteps || visualPayload?.transmission_steps || [];
  const rigorLabel = confidence === 'HIGH' ? 'HIGH' : confidence === 'LOW' ? 'LIMITED' : 'MEDIUM';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div 
        id="research-report-modal"
        className="bg-white border border-slate-300 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
      >
        {/* Institutional Document Header */}
        <div
          className="relative shrink-0 overflow-hidden border-b border-slate-800 bg-[#051c2c] text-white"
          style={heroImageUrl ? { backgroundImage: `url(${heroImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-900/65" />
          <div className="relative z-10 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 p-1.5 backdrop-blur-xs">
                {ticker && ticker.length <= 5 && !ticker.includes('^') ? (
                  <StockLogo ticker={ticker} className="w-9 h-9 object-contain rounded" />
                ) : (
                  <Building2 className="w-6 h-6 text-cyan-300" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono font-bold tracking-wider text-cyan-300 px-2 py-0.5 bg-cyan-950/60 border border-cyan-800 rounded">
                    {ticker}
                  </span>
                  <span className="text-slate-300 font-medium">{assetClass}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {formattedTime}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
                  {assetName}
                </h1>
                <p className="text-xs text-slate-300 font-sans">
                  Deep Market Research Document • Antigravity Autonomous Investigation
                </p>
              </div>
            </div>

            {/* Right: Market Move Badge & Close Button */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-base font-bold font-mono shadow-xs ${
                  isNegative 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {isNegative ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  <span>{changePercent > 0 ? `+${changePercent.toFixed(2)}` : changePercent.toFixed(2)}%</span>
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mt-0.5">
                  Period: {period}
                </div>
              </div>

              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded-xl transition cursor-pointer"
                title="Sluit rapport (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sub-header status bar */}
          <div className="mt-4 pt-4 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {report.status || 'COMPLETED'}
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                ID: {report.id}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySummary}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium transition cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Gekopieerd!' : 'Kopieer Samenvatting'}</span>
              </button>
            </div>
          </div>
          {hero && (
            <div className="mt-3 flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-[10px] font-mono text-slate-300/90">
              <span>{heroLocation || 'Editorial research image'}</span>
              <span className="text-slate-500">•</span>
              <span>{heroCredit || 'Source attribution retained in payload'}</span>
            </div>
          )}
          </div>
        </div>

        {/* Scrollable Report Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-7 text-slate-800">
          
          {/* Executive Summary Callout */}
          <div className="bg-slate-50 border-l-4 border-[#002d62] p-5 rounded-r-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#002d62] uppercase tracking-wider font-mono">
              <FileText className="w-4 h-4" />
              <span>Executive Summary</span>
            </div>
            <p className="text-sm text-slate-800 leading-relaxed font-sans font-medium">
              {executiveSummary}
            </p>
          </div>

          {/* Institutional KPI strip */}
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-3">
            <div className="bg-[#f8fafc] p-4">
              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">Movement</div>
              <div className={`mt-1 text-xl font-mono font-bold tabular-nums ${isNegative ? 'text-rose-700' : 'text-emerald-700'}`}>
                {changePercent > 0 ? '+' : ''}{changePercent.toFixed(2)}% <span className="text-xs font-normal text-slate-500">{period}</span>
              </div>
            </div>
            <div className="bg-[#f8fafc] p-4">
              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">Market-cap impact</div>
              <div className="mt-1 text-xl font-mono font-bold tabular-nums text-[#001f3f]">
                {typeof marketCapImpact === 'number' && Number.isFinite(marketCapImpact)
                  ? `${marketCapImpact >= 0 ? '+' : ''}$${marketCapImpact.toFixed(1)}B`
                  : 'Unavailable'}
              </div>
              <div className="mt-0.5 text-[10px] text-slate-500">
                {typeof marketCapImpact === 'number' && Number.isFinite(marketCapImpact) ? 'From verified market-cap input' : 'Verified market-cap input not supplied'}
              </div>
            </div>
            <div className="bg-[#f8fafc] p-4">
              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">Rigor rating</div>
              <div className="mt-1 text-xl font-mono font-bold text-[#001f3f]">{rigorLabel}</div>
              <div className="mt-0.5 line-clamp-2 text-[10px] text-slate-500">{confidenceExplanation || 'Evidence assessment retained in the confidence section.'}</div>
            </div>
          </div>

          {/* 1. Immediate Catalyst: Facts vs Claims vs Inference */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-[#002d62] text-xs font-mono font-bold flex items-center justify-center">1</span>
                <span>Immediate Catalyst</span>
              </h2>
              <span className="text-[11px] text-slate-500 font-mono">Feiten • Beweringen • Inferentie</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Confirmed Facts */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 uppercase font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Confirmed Facts</span>
                </div>
                {catalystSections.facts.length > 0 ? (
                  <ul className="text-xs text-emerald-950 space-y-1.5 list-disc list-inside leading-relaxed">
                    {catalystSections.facts.map((f, i) => (
                      <li key={i} className="pl-1">{f}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-emerald-900/80 leading-relaxed">
                    Geverifieerd op basis van primaire regelgeving en bedrijfsdeposito's.
                  </p>
                )}
              </div>

              {/* Reported Claims */}
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase font-mono">
                  <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Reported Claims</span>
                </div>
                {catalystSections.claims.length > 0 ? (
                  <ul className="text-xs text-amber-950 space-y-1.5 list-disc list-inside leading-relaxed">
                    {catalystSections.claims.map((c, i) => (
                      <li key={i} className="pl-1">{c}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-amber-900/80 leading-relaxed">
                    Gerapporteerd in marktschelpen en mediabronnen, zonder officiële registratie.
                  </p>
                )}
              </div>

              {/* Analysis / Inference */}
              <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 uppercase font-mono">
                  <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Analysis / Inference</span>
                </div>
                {catalystSections.inference.length > 0 ? (
                  <ul className="text-xs text-indigo-950 space-y-1.5 list-disc list-inside leading-relaxed">
                    {catalystSections.inference.map((inf, i) => (
                      <li key={i} className="pl-1">{inf}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-indigo-900/80 leading-relaxed">
                    Analytische afleiding van marktreacties en waarderingsmultiples.
                  </p>
                )}
              </div>
            </div>

            {/* General catalyst fallback text if not split */}
            {catalystSections.general.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 leading-relaxed space-y-2">
                {catalystSections.general.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
            )}
          </div>

          {/* Verified macro driver is intentionally placed between catalyst and impact. */}
          <ReportMacroChart payload={macroChart} />

          {/* Causal transmission flow */}
          <section className="space-y-3" aria-label="Causal transmission flow">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="flex items-center gap-2 font-serif text-base font-bold text-slate-900">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-mono font-bold text-amber-800">→</span>
                <span>Causal Transmission</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-500">Catalyst → Financial impact → Sector</span>
            </div>
            {transmissionSteps.length > 0 ? (
              <div className="flex flex-col gap-2 md:flex-row md:items-stretch">
                {transmissionSteps.map((node, index) => (
                  <React.Fragment key={`${node.step}-${node.label}`}>
                    <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#001f3f]">
                        {String(node.type).replace('_', ' ')} · {node.step}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-700">{node.label}</p>
                      {node.detail && <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{node.detail}</p>}
                    </div>
                    {index < transmissionSteps.length - 1 && <ArrowRight className="hidden shrink-0 self-center text-amber-600 md:block" size={16} aria-hidden="true" />}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                Causal transmission steps unavailable for this legacy report.
              </div>
            )}
          </section>

          {/* 2. Direct Market / Sector Impact */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-[#002d62] text-xs font-mono font-bold flex items-center justify-center">2</span>
                <span>Direct Market / Sector Impact</span>
              </h2>
              <span className="text-[11px] text-slate-500 font-mono">Transmissiemechanisme</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
              {directMarketImpact}
            </p>
          </div>

          {/* 3. Broader Context */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-[#002d62] text-xs font-mono font-bold flex items-center justify-center">3</span>
                <span>Broader Context</span>
              </h2>
              <span className="text-[11px] text-slate-500 font-mono">Macro • Geopolitiek • Keten</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
              {broaderContext}
            </p>
          </div>

          {/* 4. What the Market Is Reacting To */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-[#002d62] text-xs font-mono font-bold flex items-center justify-center">4</span>
                <span>What the Market Is Reacting To</span>
              </h2>
              <span className="text-[11px] text-slate-500 font-mono">Verwachtingsherziening</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
              {whatMarketIsReactingTo}
            </p>
          </div>

          {/* 5. What to Watch Next */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-[#002d62] text-xs font-mono font-bold flex items-center justify-center">5</span>
                <span>What to Watch Next</span>
              </h2>
              <span className="text-[11px] text-slate-500 font-mono">Katalysator Agenda</span>
            </div>
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-sans">
              {whatToWatchNext}
            </div>
          </div>

          {/* 6. Confidence Level */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-[#002d62] text-xs font-mono font-bold flex items-center justify-center">6</span>
                <span>Confidence Assessment</span>
              </h2>
              <span className="text-[11px] text-slate-500 font-mono">Onderzoeksbetrouwbaarheid</span>
            </div>
            <div className="p-4 rounded-xl border bg-slate-50 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="shrink-0">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono tracking-wider ${
                  confidence === 'HIGH' 
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : confidence === 'MEDIUM'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-slate-200 text-slate-800 border border-slate-300'
                }`}>
                  <ShieldCheck className="w-4 h-4" />
                  CONFIDENCE: {confidence}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                {confidenceExplanation || 'Geverifieerd op basis van institutionele marktrapporten en primaire bronregistraties.'}
              </p>
            </div>
          </div>

          {/* 7. Sources Registry */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-[#002d62] text-xs font-mono font-bold flex items-center justify-center">7</span>
                <span>Sources & Verification Registry</span>
              </h2>
              <span className="text-[11px] text-slate-500 font-mono">{sources.length} documenten geraadpleegd</span>
            </div>

            {sources.length > 0 ? (
              <div className="space-y-2.5">
                {sources.map((src, index) => {
                  const category = src.sourceCategory || src.category;
                  return (
                    <div 
                      key={index}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {getSourceBadge(category)}
                          <span className="text-xs font-bold text-slate-900">{src.publisher}</span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-800">
                          {src.title}
                        </h4>
                        {src.relevance && (
                          <p className="text-[11px] text-slate-500 leading-snug">
                            {src.relevance}
                          </p>
                        )}
                      </div>

                      {src.url && (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#002d62] hover:text-white text-slate-700 text-xs font-semibold transition cursor-pointer"
                        >
                          <span>Open Bron</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Geen externe bronnen geregistreerd.</p>
            )}
          </div>

          {/* Institutional Compliance Notice */}
          <div className="pt-4 border-t border-slate-200 text-center">
            <p className="text-[11px] text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Global Markets Deep Market Research • Dit document is samengesteld via autonome Gemini 3.8 Flash research zonder menselijke tussenkomst. Niet bedoeld als beleggingsadvies.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-mono">
            Status: {report.status} • {sources.length} geverifieerde bronnen
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};
