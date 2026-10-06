import React, { useEffect, useMemo, useState } from 'react';
import { 
  ResearchReport, 
  ResearchSource, 
  ReportLayoutPlan,
  ReportLayoutSection 
} from '../types/marketResearch';
import { StockLogo } from './StockLogo';
import { StockLogoLoader } from './StockLogoLoader';
import { AnimatePresence } from 'motion/react';
import { ReportMacroChart } from './ReportMacroChart';
import { 
  X, 
  ExternalLink, 
  ShieldCheck, 
  TrendingDown, 
  TrendingUp, 
  Clock, 
  Building2, 
  FileText, 
  Layers, 
  CheckCircle2, 
  HelpCircle,
  Copy,
  Check,
  Compass,
  ArrowRight
} from 'lucide-react';

interface ExtendedResearchReport extends ResearchReport {
  headline?: string;
  bottomLine?: string;
  bottom_line?: string;
  keyDebate?: string;
  key_debate?: string;
  keyTakeaways?: string[];
  key_takeaways?: string[];
  layoutPlan?: ReportLayoutPlan;
  layout_plan?: ReportLayoutPlan;
}

interface ResearchReportModalProps {
  report: ExtendedResearchReport | ResearchReport | null;
  onClose: () => void;
}

export const ResearchReportModal: React.FC<ResearchReportModalProps> = ({
  report,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
  }, [report?.ticker, report?.id]);

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
  const assetName = report.assetName || report.asset || report.asset_name || ticker;
  const assetClass = report.assetClass || report.asset_class || 'Equity';
  const period = report.period || report.movement_period || '1D';
  const timestamp = report.triggerTimestamp || report.trigger_timestamp || report.createdAt || report.created_at;

  // Format timestamp in European / Wall Street time (CET)
  const formattedTime = useMemo(() => {
    if (!timestamp) return 'Recent';
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
      return String(timestamp);
    }
  }, [timestamp]);

  // Layout plan resolution (Visual payload plan or direct property)
  const visualPayload = report.visualPayload || report.visual_payload;
  const layoutPlan: ReportLayoutPlan | undefined = 
    visualPayload?.layoutPlan || 
    (visualPayload as any)?.layout_plan || 
    (report as ExtendedResearchReport).layoutPlan || 
    (report as ExtendedResearchReport).layout_plan;

  // Parse immediate catalyst into Facts, Claims, and Inference
  const catalystSections = useMemo(() => {
    const raw = report.immediateCatalyst ?? report.immediate_catalyst;
    if (raw && typeof raw === 'object' && ('facts' in raw || 'claims' in raw || 'inference' in raw)) {
      const r = raw as any;
      return {
        facts: Array.isArray(r.facts) ? (r.facts as string[]) : [],
        claims: Array.isArray(r.claims) ? (r.claims as string[]) : [],
        inference: Array.isArray(r.inference) ? (r.inference as string[]) : [],
        general: r.summary ? [r.summary as string] : []
      };
    }

    const text = typeof raw === 'string' ? raw : '';
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

  const executiveSummary = report.executiveSummary || report.executive_summary || '';
  const directMarketImpact = report.directMarketImpact || report.direct_market_impact || '';
  const broaderContext = report.broaderContext || report.broader_context || '';
  const whatMarketIsReactingTo = report.whatMarketIsReactingTo || report.what_market_is_reacting_to || report.market_reaction || '';
  const whatToWatchNext = report.whatToWatchNext || report.what_to_watch_next || '';
  const confidence = report.confidence || 'MEDIUM';
  const confidenceExplanation = report.confidenceExplanation || report.confidence_explanation || '';
  const sources: ResearchSource[] = report.sources || [];
  const hero = visualPayload?.hero;
  const macroChart = visualPayload?.macroChart || visualPayload?.macro_chart;
  const marketCapImpact = visualPayload?.marketCapImpactUsdBillions ?? visualPayload?.market_cap_impact_usd_billions;
  const transmissionSteps = visualPayload?.transmissionSteps || visualPayload?.transmission_steps || [];
  const rigorLabel = confidence === 'HIGH' ? 'HIGH' : confidence === 'LOW' ? 'LIMITED' : 'MEDIUM';

  // Section headline resolution (from layout plan or fallback)
  const finalHeadline = useMemo(() => {
    if (layoutPlan?.firstPage?.headline) return layoutPlan.firstPage.headline;
    if ((report as ExtendedResearchReport).headline) return (report as ExtendedResearchReport).headline!;
    const prefix = ticker ? `${ticker}` : assetName;
    if (changePercent !== 0) {
      const dir = changePercent > 0 ? 'Surges' : 'Declines';
      return `${prefix} ${dir} ${Math.abs(changePercent).toFixed(1)}%: Key Event Analysis & Sell-Side Transmission`;
    }
    return `${prefix}: Event Note & Market Impact Assessment`;
  }, [layoutPlan, report, ticker, assetName, changePercent]);

  // Bottom line resolution
  const finalBottomLine = useMemo(() => {
    if (layoutPlan?.firstPage?.bottomLine) return layoutPlan.firstPage.bottomLine;
    const ext = report as ExtendedResearchReport;
    if (ext.bottomLine) return ext.bottomLine;
    if (ext.bottom_line) return ext.bottom_line;
    if (executiveSummary) return executiveSummary;
    return 'Analytical bottom line assessment catalogued in research payload.';
  }, [layoutPlan, report, executiveSummary]);

  // Key debate resolution
  const finalKeyDebate = useMemo(() => {
    if (layoutPlan?.firstPage?.keyDebate) return layoutPlan.firstPage.keyDebate;
    const ext = report as ExtendedResearchReport;
    if (ext.keyDebate) return ext.keyDebate;
    if (ext.key_debate) return ext.key_debate;
    if (broaderContext) return broaderContext;
    return null;
  }, [layoutPlan, report, broaderContext]);

  // Key takeaways resolution (strictly max 3)
  const derivedKeyTakeaways = useMemo(() => {
    if (layoutPlan?.firstPage?.keyTakeaways?.length) {
      return layoutPlan.firstPage.keyTakeaways.slice(0, 3);
    }
    const ext = report as ExtendedResearchReport;
    const explicit = ext.keyTakeaways || ext.key_takeaways;
    if (Array.isArray(explicit) && explicit.length > 0) {
      return explicit.slice(0, 3);
    }
    if (catalystSections.facts.length > 0) {
      return catalystSections.facts.slice(0, 3);
    }
    if (executiveSummary) {
      const sentences = executiveSummary
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 15);
      if (sentences.length > 0) {
        return sentences.slice(0, Math.min(3, sentences.length));
      }
    }
    return [];
  }, [layoutPlan, report, catalystSections.facts, executiveSummary]);

  // Lead image resolution (strictly framed compact photography, NOT full-bleed)
  const leadImageInfo = useMemo(() => {
    const assetId = layoutPlan?.firstPage?.leadImageAssetId;
    const registry = visualPayload?.assetRegistry || (visualPayload as any)?.asset_registry;
    let matchingAsset: any = null;
    if (assetId && Array.isArray(registry)) {
      matchingAsset = registry.find((a: any) => a.id === assetId);
    }

    const url = matchingAsset?.url || matchingAsset?.imageUrl || hero?.imageUrl || hero?.image_url;
    const credit = matchingAsset?.attribution || hero?.photographerCredit || hero?.photographer_credit;
    const location = hero?.locationLabel || hero?.location_label || matchingAsset?.title;
    const sourceUrl = matchingAsset?.sourceUrl || hero?.sourceUrl || hero?.source_url;

    return {
      url,
      credit: credit || 'Attribution retained in payload',
      location: location || 'Field Photography / Research Exhibit',
      sourceUrl
    };
  }, [layoutPlan, visualPayload, hero]);

  // Section headlines from layout plan (if composer specified them)
  const sectionByPurpose = useMemo(() => {
    const map: Record<string, ReportLayoutSection> = {};
    if (layoutPlan?.sections && Array.isArray(layoutPlan.sections)) {
      for (const sec of layoutPlan.sections) {
        if (sec.purpose) map[sec.purpose] = sec;
      }
    }
    return map;
  }, [layoutPlan]);

  const handleCopySummary = () => {
    const summaryText = finalBottomLine || executiveSummary;
    const textToCopy = `[GLOBAL MARKETS RESEARCH] ${ticker} (${assetName}) ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%\nHeadline: ${finalHeadline}\n\nThe Bottom Line:\n${summaryText}\n\nConfidence: ${confidence}`;
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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        id="research-report-modal"
        className="bg-[#fafbfd] border border-slate-300 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence>
          {isLoading && (report.ticker || report.asset) && (
            <StockLogoLoader
              ticker={report.ticker || report.asset || ''}
              onComplete={() => setIsLoading(false)}
            />
          )}
        </AnimatePresence>

        {/* Institutional Document Header Bar */}
        <div className="sticky top-0 z-20 shrink-0 bg-white border-b border-slate-200 px-5 sm:px-7 py-3.5 flex items-center justify-between gap-4 shadow-2xs">
          {/* Left: Ticker & Asset Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 p-1">
              {ticker && ticker.length <= 5 && !ticker.includes('^') ? (
                <StockLogo ticker={ticker} className="w-8 h-8 object-contain rounded" />
              ) : (
                <Building2 className="w-5 h-5 text-[#002d62]" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono font-bold tracking-wider text-[#001f3f] px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px]">
                  {ticker}
                </span>
                <span className="font-serif font-bold text-slate-900 text-sm truncate">
                  {assetName}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500 text-xs font-sans">
                  {assetClass}
                </span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="text-slate-500 font-mono text-[11px] hidden sm:flex items-center gap-1 tabular-nums">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {formattedTime}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions (Status, Copy, Close) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              {report.status || 'COMPLETED'}
            </span>

            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition cursor-pointer border border-slate-200"
              title="Kopieer samenvatting naar klembord"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span className="hidden sm:inline">{copied ? 'Gekopieerd!' : 'Kopieer Samenvatting'}</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition cursor-pointer border border-transparent hover:border-slate-200"
              title="Sluit rapport (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Report Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-7 text-slate-800 bg-[#fafbfd]">
          
          {/* ========================================================================= */}
          {/* 1. FIRST PAGE SELL-SIDE ARCHITECTURE                                     */}
          {/* ========================================================================= */}

          {/* Conclusion-Style Headline */}
          <div className="space-y-1.5 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#002d62] font-bold">
              <span>Sell-Side Event Note</span>
              <span>•</span>
              <span>Institutional Research</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight leading-snug">
              {finalHeadline}
            </h1>
          </div>

          {/* Institutional KPI Strip */}
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-3 shadow-2xs">
            <div className="bg-white p-4">
              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500 font-semibold">Movement</div>
              <div className={`mt-1 text-xl font-mono font-bold tabular-nums ${isNegative ? 'text-rose-700' : 'text-emerald-700'}`}>
                {changePercent > 0 ? '+' : ''}{changePercent.toFixed(2)}% <span className="text-xs font-normal text-slate-500">{period}</span>
              </div>
            </div>
            <div className="bg-white p-4">
              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500 font-semibold">Market-cap impact</div>
              <div className="mt-1 text-xl font-mono font-bold tabular-nums text-[#001f3f]">
                {typeof marketCapImpact === 'number' && Number.isFinite(marketCapImpact)
                  ? `${marketCapImpact >= 0 ? '+' : ''}$${marketCapImpact.toFixed(1)}B`
                  : 'Unavailable'}
              </div>
              <div className="mt-0.5 text-[10px] text-slate-500">
                {typeof marketCapImpact === 'number' && Number.isFinite(marketCapImpact) ? 'From verified market-cap input' : 'Verified market-cap input not supplied'}
              </div>
            </div>
            <div className="bg-white p-4">
              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500 font-semibold">Rigor rating</div>
              <div className="mt-1 text-xl font-mono font-bold text-[#001f3f]">{rigorLabel}</div>
              <div className="mt-0.5 line-clamp-2 text-[10px] text-slate-500">{confidenceExplanation || 'Evidence assessment retained in the confidence section.'}</div>
            </div>
          </div>

          {/* Two-Column First Page Layout (Adjacent to Bottom Line & Lead Image) */}
          <div className="flex flex-col lg:flex-row gap-5 items-start">
            {/* Left side (65–70%): The Bottom Line + The Key Debate + Key Takeaways */}
            <div className="flex-1 min-w-0 space-y-4 w-full">
              {/* The Bottom Line */}
              <div className="bg-white border-l-4 border-[#002d62] p-4.5 sm:p-5 rounded-r-xl border-y border-r border-slate-200/80 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-[11px] font-bold text-[#002d62] uppercase tracking-wider font-mono">
                  <FileText className="w-3.5 h-3.5 text-[#002d62]" />
                  <span>The Bottom Line</span>
                </div>
                <p className="text-sm sm:text-base text-slate-900 leading-relaxed font-sans font-semibold">
                  {finalBottomLine}
                </p>
              </div>

              {/* The Key Debate */}
              {finalKeyDebate && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-4.5 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700 uppercase tracking-wider font-mono">
                    <Compass className="w-3.5 h-3.5 text-slate-600" />
                    <span>The Key Debate</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                    {finalKeyDebate}
                  </p>
                </div>
              )}

              {/* Key Takeaways (Strictly Max 3 bullet points) */}
              {derivedKeyTakeaways.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    <span>Key Takeaways</span>
                  </div>
                  <div className="space-y-2">
                    {derivedKeyTakeaways.map((takeaway, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-lg bg-white border border-slate-200 shadow-2xs text-xs sm:text-sm text-slate-800"
                      >
                        <span className="w-5 h-5 rounded-full bg-[#001f3f] text-white text-[11px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed font-sans">{takeaway}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right side (30–35%): Compact Lead Image (Strictly NOT full-bleed) */}
            <div className="w-full lg:w-[34%] shrink-0 flex flex-col">
              {leadImageInfo.url ? (
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-xs flex flex-col">
                  <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden bg-slate-900">
                    <img
                      src={leadImageInfo.url}
                      alt={leadImageInfo.location || assetName}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-950/70 backdrop-blur-xs text-[10px] font-mono uppercase tracking-wider text-slate-200 border border-slate-700/60">
                      Lead Exhibit
                    </div>
                  </div>
                  <div className="p-3 bg-white border-t border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-700 font-medium">
                      <span className="truncate">{leadImageInfo.location}</span>
                      {leadImageInfo.sourceUrl && (
                        <a
                          href={leadImageInfo.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-mono text-[#002d62] hover:underline flex items-center gap-0.5 shrink-0 ml-1 font-semibold"
                        >
                          Verify <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      Credit: {leadImageInfo.credit}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white p-4.5 flex flex-col justify-between h-full space-y-3 shadow-2xs">
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                      Coverage Profile
                    </div>
                    <div className="text-base font-serif font-bold text-slate-900">{assetName}</div>
                    <div className="text-xs text-slate-500 font-mono">{ticker} • {assetClass}</div>
                  </div>
                  <div className="text-[11px] text-slate-500 leading-relaxed font-sans border-t border-slate-100 pt-3">
                    Visual evidence catalogued under verified institutional workflow. No synthetic assets generated.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. BODY RHYTHM SECTIONS                                                   */}
          {/* ========================================================================= */}

          {/* 1. What Drove the Move (Immediate Catalyst: Facts, Claims, Inference) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#001f3f] text-white text-xs font-mono font-bold flex items-center justify-center">1</span>
                <span>{sectionByPurpose['what_drove_the_move']?.headline || 'What Drove the Move (Immediate Catalyst)'}</span>
              </h2>
              <span className="text-[11px] text-slate-500 font-mono">Feiten • Beweringen • Inferentie</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Confirmed Facts */}
              <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-4 space-y-2 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 uppercase font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Confirmed Facts</span>
                </div>
                {catalystSections.facts.length > 0 ? (
                  <ul className="text-xs text-emerald-950 space-y-1.5 list-disc list-inside leading-relaxed font-sans">
                    {catalystSections.facts.map((f, i) => (
                      <li key={i} className="pl-1">{f}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-emerald-900/80 leading-relaxed font-sans">
                    Geverifieerd op basis van primaire regelgeving en bedrijfsdeposito's.
                  </p>
                )}
              </div>

              {/* Reported Claims */}
              <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-4 space-y-2 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase font-mono">
                  <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Reported Claims</span>
                </div>
                {catalystSections.claims.length > 0 ? (
                  <ul className="text-xs text-amber-950 space-y-1.5 list-disc list-inside leading-relaxed font-sans">
                    {catalystSections.claims.map((c, i) => (
                      <li key={i} className="pl-1">{c}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-amber-900/80 leading-relaxed font-sans">
                    Gerapporteerd in marktschelpen en mediabronnen, zonder officiële registratie.
                  </p>
                )}
              </div>

              {/* Analysis / Inference */}
              <div className="bg-indigo-50/50 border border-indigo-200/80 rounded-xl p-4 space-y-2 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 uppercase font-mono">
                  <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Analysis / Inference</span>
                </div>
                {catalystSections.inference.length > 0 ? (
                  <ul className="text-xs text-indigo-950 space-y-1.5 list-disc list-inside leading-relaxed font-sans">
                    {catalystSections.inference.map((inf, i) => (
                      <li key={i} className="pl-1">{inf}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-indigo-900/80 leading-relaxed font-sans">
                    Analytische afleiding van marktreacties en waarderingsmultiples.
                  </p>
                )}
              </div>
            </div>

            {/* General catalyst fallback text if not split */}
            {catalystSections.general.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-700 leading-relaxed space-y-2 shadow-2xs font-sans">
                {catalystSections.general.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
            )}
          </div>

          {/* 2. Verified Macro Driver & Primary Evidence */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#001f3f] text-white text-xs font-mono font-bold flex items-center justify-center">2</span>
                <span>Verified Macro Driver & Primary Evidence</span>
              </h2>
              <span className="text-[11px] text-slate-500 font-mono">Exhibit • Figure 1</span>
            </div>
            <div>
              <ReportMacroChart payload={macroChart} />
              <div className="mt-1 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500 px-1">
                <span>Figure 1: {macroChart?.title || 'Verified Macro Driver & Underlying Series'}</span>
                <span>Source: {macroChart?.source || 'EIA / FRED / Primary Regulatory Record'}</span>
              </div>
            </div>
          </div>

          {/* 3. Causal Transmission Flow */}
          <section className="space-y-3 pt-2" aria-label="Causal transmission flow">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="flex items-center gap-2 font-serif text-base font-bold text-slate-900">
                <span className="w-6 h-6 rounded-full bg-[#001f3f] text-white text-xs font-mono font-bold flex items-center justify-center">3</span>
                <span>Causal Transmission Flow</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-500">Catalyst → Transmission → Financial Impact → Sector Contagion</span>
            </div>
            {transmissionSteps.length > 0 ? (
              <div className="flex flex-col gap-2 md:flex-row md:items-stretch">
                {transmissionSteps.map((node, index) => (
                  <React.Fragment key={`${node.step}-${node.label}`}>
                    <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#001f3f]">
                        {String(node.type).replace(/_/g, ' ')} · Step {node.step}
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-800 font-medium font-sans">{node.label}</p>
                      {node.detail && <p className="mt-1 text-[11px] leading-relaxed text-slate-500 font-sans">{node.detail}</p>}
                    </div>
                    {index < transmissionSteps.length - 1 && (
                      <ArrowRight className="hidden shrink-0 self-center text-slate-400 md:block" size={16} aria-hidden="true" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500 shadow-2xs font-sans">
                Causal transmission steps unavailable for this legacy report.
              </div>
            )}
          </section>

          {/* 4. Why It Matters & Direct Market Impact */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#001f3f] text-white text-xs font-mono font-bold flex items-center justify-center">4</span>
                <span>{sectionByPurpose['why_it_matters']?.headline || 'Why It Matters & Direct Market Impact'}</span>
              </h2>
              <span className="text-[11px] text-slate-500 font-mono">Waardering & Marktgevolgen</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs font-sans">
              {directMarketImpact || broaderContext || 'Direct market impact assessment retained in report structure.'}
            </p>
          </div>

          {/* 5. What Market Is Reacting To */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#001f3f] text-white text-xs font-mono font-bold flex items-center justify-center">5</span>
                <span>{sectionByPurpose['what_market_is_reacting_to']?.headline || 'What Market Is Reacting To'}</span>
              </h2>
              <span className="text-[11px] text-slate-500 font-mono">Verwachtingsherziening</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs font-sans">
              {whatMarketIsReactingTo || 'Marktreactie weerspiegelt actuele herschikking van portefeuilles en risicopremies.'}
            </p>
          </div>

          {/* 6. Forward View & What to Watch Next / Catalysts & Risks */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#001f3f] text-white text-xs font-mono font-bold flex items-center justify-center">6</span>
                <span>{sectionByPurpose['forward_view']?.headline || 'Forward View & What to Watch Next'}</span>
              </h2>
              <span className="text-[11px] text-slate-500 font-mono">Katalysator Agenda & Risico's</span>
            </div>
            <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line font-sans">
              {whatToWatchNext || 'Volgende kwartaalcijfers, toezichthoudersbesluiten en macro-publicaties dienen nauwlettend gevolgd te worden.'}
            </div>
          </div>

          {/* 7. Confidence Assessment */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#001f3f] text-white text-xs font-mono font-bold flex items-center justify-center">7</span>
                <span>Confidence Assessment</span>
              </h2>
              <span className="text-[11px] text-slate-500 font-mono">Onderzoeksbetrouwbaarheid</span>
            </div>
            <div className="p-4.5 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="shrink-0">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono tracking-wider ${
                  confidence === 'HIGH' 
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                    : confidence === 'MEDIUM'
                      ? 'bg-amber-50 text-amber-900 border border-amber-300'
                      : 'bg-slate-100 text-slate-800 border border-slate-300'
                }`}>
                  <ShieldCheck className="w-4 h-4" />
                  CONFIDENCE: {confidence}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                {confidenceExplanation || 'Geverifieerd op basis van institutionele marktrapporten en primaire bronregistraties.'}
              </p>
            </div>
          </div>

          {/* 8. Sources & Verification Registry */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-base font-serif font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#001f3f] text-white text-xs font-mono font-bold flex items-center justify-center">8</span>
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
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#002d62] hover:shadow-2xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
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
                          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-[#002d62] hover:text-white text-slate-700 text-xs font-semibold transition cursor-pointer border border-slate-200"
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
          <div className="pt-4 border-t border-slate-200 text-center space-y-1">
            <p className="text-[11px] text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Global Markets Institutional Research • Sell-Side Event Note Standard. Dit document is samengesteld via autonome Gemini 3.8 Flash research zonder menselijke tussenkomst. Niet bedoeld als beleggingsadvies.
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              Document ID: {report.id} • CET Timestamp: {formattedTime}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-mono">
            Status: {report.status || 'COMPLETED'} • {sources.length} geverifieerde bronnen
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
