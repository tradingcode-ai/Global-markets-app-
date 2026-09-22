import React, { useState } from 'react';
import { QuarterlyResult, AiEarningsAnalysis, AlertPreferences, LiveQuote } from '../types';
import { 
  X, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Cpu, 
  Send, 
  CheckCircle2, 
  Loader2, 
  FileText,
  AlertCircle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Radio
} from 'lucide-react';
import { TECH_COMPANIES } from '../data/earningsData';
import { StockLogo } from './StockLogo';
import { FinancialHistoryChart } from './FinancialHistoryChart';

interface CompanyDetailModalProps {
  result: QuarterlyResult | null;
  quote?: LiveQuote | null;
  onClose: () => void;
  onTriggerTestPush: (result: QuarterlyResult) => void;
  preferences: AlertPreferences;
}

export const CompanyDetailModal: React.FC<CompanyDetailModalProps> = ({
  result,
  quote,
  onClose,
  onTriggerTestPush,
  preferences
}) => {
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<AiEarningsAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!result) return null;

  const meta = TECH_COMPANIES[result.ticker];
  const isReported = result.status === 'reported' || result.status === 'reporting_today';
  const epsBeaten = isReported && (result.epsActual ?? 0) >= result.epsEstimate;
  const revBeaten = isReported && (result.revenueActual ?? 0) >= result.revenueEstimate;

  const currentPrice = quote?.price || meta?.currentPrice || 0;
  const cur = (quote?.currency === 'EUR' || result.currency === 'EUR' || ['ASML', 'SAP', 'PRX', 'SU', 'SIE', 'ADYEN', 'IFX', 'STM'].includes(result.ticker)) ? '€' : '$';
  const changeVal = quote?.change !== undefined ? quote.change : ((currentPrice * (meta?.dayChangePercent || 0)) / 100);
  const changePct = quote?.changePercent !== undefined ? quote.changePercent : (meta?.dayChangePercent || 0);
  const isPricePositive = changePct >= 0;

  const handleFetchAiMemo = async () => {
    setLoadingAi(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/analyze-earnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: meta || { ticker: result.ticker, name: result.companyName },
          quarter: result.quarter,
          epsEstimate: result.epsEstimate,
          epsActual: result.epsActual,
          revenueEstimate: result.revenueEstimate,
          revenueActual: result.revenueActual,
          guidance: result.guidanceSummary,
          highlights: result.keyHighlights,
          segments: result.segments,
          aiCapex: result.aiCapexHighlight
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      if (data.analysis) {
        setAiAnalysis(data.analysis);
      }
    } catch (err: any) {
      console.error('Error in AI analysis:', err);
      setErrorMsg('Failed to generate institutional memo. Please retry.');
    } finally {
      setLoadingAi(false);
    }
  };

  // Render SVG mini sparkline from live data
  const sparklineData = quote?.sparkline || [currentPrice * 0.992, currentPrice * 0.996, currentPrice * 1.002, currentPrice];
  const minVal = Math.min(...sparklineData);
  const maxVal = Math.max(...sparklineData);
  const range = maxVal - minVal || 1;
  const sparklinePoints = sparklineData.map((val, idx) => {
    const x = (idx / (sparklineData.length - 1)) * 140;
    const y = 35 - ((val - minVal) / range) * 28;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div 
        id="company-detail-modal"
        className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Soft Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StockLogo ticker={result.ticker} size="lg" className="w-10 h-10 rounded-xl" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 font-mono-code">
                  {result.ticker} • {result.companyName}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {result.quarter}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {meta?.description || 'Leading enterprise technology ecosystem and computing platform.'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition p-2 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* REAL-TIME MARKET PRICE TRACKER CARD */}
          <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            {/* J.P. Morgan & McKinsey Institutional Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-200/80 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FDF3D8] text-[#855B00] border border-[#F3DE9D]">
                  NOTE
                </span>
                <span className="font-semibold text-[#005a9c]">
                  J.P. Morgan Asset Class: {meta?.sector || 'Global Mega-Cap Technology'}
                </span>
              </div>
              <div className="text-slate-500 font-mono-code">
                SHARECLASS EXCHANGE: <strong className="text-slate-800">{meta?.exchange || 'NASDAQ'}</strong>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500 font-mono-code">
                    CONNECTED REAL-TIME MARKET TRACKER
                  </span>
                  {quote?.isLive && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      LIVE TICK
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold font-mono-code tabular-nums text-slate-900">
                    {cur}{currentPrice.toFixed(2)}
                  </span>
                  <span className={`inline-flex items-center font-mono-code font-bold text-xs px-2 py-0.5 rounded-full ${
                    isPricePositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {isPricePositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                    {isPricePositive ? '+' : ''}{cur}{Math.abs(changeVal).toFixed(2)} ({isPricePositive ? '+' : ''}{changePct.toFixed(2)}%)
                  </span>
                </div>
              </div>

              {/* Sparkline & Intraday Stats */}
              <div className="flex items-center gap-4">
                <div className="hidden sm:block">
                  <div className="text-[10px] text-slate-400 font-mono-code mb-1 text-right">INTRADAY TREND</div>
                  <svg width="140" height="40" className="overflow-visible">
                    <polyline
                      fill="none"
                      stroke={isPricePositive ? '#059669' : '#e11d48'}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={sparklinePoints}
                    />
                  </svg>
                </div>

                <div className="border-l border-slate-200 pl-4 space-y-1 font-mono-code text-[11px] text-slate-600">
                  <div>Day Range: <strong className="text-slate-800">{cur}{(quote?.dayLow || currentPrice * 0.99).toFixed(2)} - {cur}{(quote?.dayHigh || currentPrice * 1.01).toFixed(2)}</strong></div>
                  <div>Prev Close: <strong className="text-slate-800">{cur}{(quote?.previousClose || currentPrice - changeVal).toFixed(2)}</strong></div>
                  <div>Volume: <strong className="text-slate-800">{((quote?.volume || 15000000) / 1000000).toFixed(1)}M</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* Core Scorecard: EPS & Revenue */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-slate-400 block uppercase text-[10px] font-semibold">Reported EPS</span>
              <div className="text-lg font-bold font-mono-code text-slate-900 mt-0.5">
                {result.epsActual !== undefined ? `${cur}${result.epsActual.toFixed(2)}` : 'Est. ' + cur + result.epsEstimate.toFixed(2)}
              </div>
              <span className={`text-[10px] font-semibold ${epsBeaten ? 'text-emerald-700' : 'text-slate-500'}`}>
                Consensus: {cur}{result.epsEstimate.toFixed(2)}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-slate-400 block uppercase text-[10px] font-semibold">Reported Revenue</span>
              <div className="text-lg font-bold font-mono-code text-slate-900 mt-0.5">
                {result.revenueActual !== undefined ? `${cur}${result.revenueActual.toFixed(2)}B` : 'Est. ' + cur + result.revenueEstimate.toFixed(2) + 'B'}
              </div>
              <span className={`text-[10px] font-semibold ${revBeaten ? 'text-emerald-700' : 'text-slate-500'}`}>
                Consensus: {cur}{result.revenueEstimate.toFixed(2)}B
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-slate-400 block uppercase text-[10px] font-semibold">YoY Growth</span>
              <div className="text-lg font-bold font-mono-code text-emerald-700 mt-0.5">
                {result.revenueYoY !== undefined ? `+${result.revenueYoY}%` : '—'}
              </div>
              <span className="text-[10px] text-slate-500">
                Top-line expansion
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-slate-400 block uppercase text-[10px] font-semibold">Post Market Move</span>
              <div className="text-lg font-bold font-mono-code text-slate-900 mt-0.5">
                {result.priceReactionPercent !== undefined ? (
                  <span className={result.priceReactionPercent >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                    {result.priceReactionPercent >= 0 ? '+' : ''}{result.priceReactionPercent}%
                  </span>
                ) : 'Pending'}
              </div>
              <span className="text-[10px] text-slate-500">
                Immediate 8-K reaction
              </span>
            </div>
          </div>

          {/* Key Segments */}
          {result.segments && result.segments.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 font-mono-code">
                Business Unit & Segment Performance
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {result.segments.map((seg, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{seg.name}</span>
                      <span className="font-bold font-mono-code text-slate-900">{seg.revenue}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span>YoY: <strong className="text-emerald-700 font-semibold">{seg.growthYoY}</strong></span>
                      {seg.notes && <span className="text-slate-500 truncate max-w-[150px]">{seg.notes}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quarterly Analyst Consensus Snapshot */}
          {result.quarterlyConsensus && (
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-700" />
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] font-mono-code">
                    Quarterly Analyst Consensus
                  </h4>
                </div>
                <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono-code">
                  {result.quarterlyConsensus.quarterKey}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                  <span className="text-[10px] text-slate-400 block uppercase">Consensus</span>
                  <strong className="text-sm text-indigo-700">{result.quarterlyConsensus.consensusRating || 'N/A'}</strong>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                  <span className="text-[10px] text-slate-400 block uppercase">Avg. Target</span>
                  <strong className="text-sm text-slate-900">
                    {result.quarterlyConsensus.averagePriceTarget !== undefined ? `${result.quarterlyConsensus.targetCurrency || ''}${result.quarterlyConsensus.averagePriceTarget.toFixed(2)}` : 'N/A'}
                  </strong>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                  <span className="text-[10px] text-slate-400 block uppercase">Next Q EPS</span>
                  <strong className="text-sm text-blue-700">{result.quarterlyConsensus.nextQuarterEps !== undefined ? result.quarterlyConsensus.nextQuarterEps.toFixed(2) : 'N/A'}</strong>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                  <span className="text-[10px] text-slate-400 block uppercase">Next Q Revenue</span>
                  <strong className="text-sm text-slate-900">{result.quarterlyConsensus.nextQuarterRevenue !== undefined ? `${result.quarterlyConsensus.nextQuarterRevenue.toFixed(2)}B` : 'N/A'}</strong>
                </div>
              </div>
              {result.quarterlyConsensus.recommendationCounts && (
                <div className="flex flex-wrap gap-2 mt-2.5 text-[10px] font-mono-code">
                  <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Strong Buy {result.quarterlyConsensus.recommendationCounts.strongBuy}</span>
                  <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Buy {result.quarterlyConsensus.recommendationCounts.buy}</span>
                  <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">Hold {result.quarterlyConsensus.recommendationCounts.hold}</span>
                  <span className="px-2 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200">Sell {result.quarterlyConsensus.recommendationCounts.sell}</span>
                  <span className="px-2 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200">Strong Sell {result.quarterlyConsensus.recommendationCounts.strongSell}</span>
                </div>
              )}
              <p className="mt-2 text-[10px] text-slate-500">
                Yahoo Finance analyst snapshot • max. 3 latest distinct banks/brokers • individual analyst names are not displayed.
              </p>
            </div>
          )}

          {/* 5-Year Quarterly Financial History (Revenue, FCF, EPS, Net Income) with Single-Metric Option Bar */}
          <div className="border-t border-slate-200 pt-4">
            <FinancialHistoryChart 
              ticker={result.ticker} 
              companyName={result.companyName} 
              currency={cur} 
            />
          </div>

          {/* Investment Bank Analyst Outlooks (User-Requested Financial Feature) */}
          {result.analystOutlooks && result.analystOutlooks.length > 0 && (
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-700" />
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] font-mono-code">
                    Investment Bank Analyst Outlook (Next Quarter & 12M Horizon)
                  </h4>
                </div>
                <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono-code">
                  Wall Street Consensus
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {result.analystOutlooks.map((outlook, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-2.5 h-2.5 rounded-full" 
                          style={{ backgroundColor: outlook.logoColor || '#005a9c' }} 
                        />
                        <strong className="text-xs font-bold text-slate-900 font-mono-code">
                          {outlook.bankName}
                        </strong>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          outlook.rating.toLowerCase().includes('buy') || outlook.rating.toLowerCase().includes('outperform') || outlook.rating.toLowerCase().includes('overweight')
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {outlook.rating}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 font-mono-code text-xs">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Target Price</span>
                          <strong className="text-slate-900 font-bold">{outlook.targetPrice}</strong>
                        </div>
                        {outlook.nextQuarterEpsEst && (
                          <div className="text-right border-l border-slate-200 pl-3">
                            <span className="text-[10px] text-slate-400 block">Next Qtr EPS</span>
                            <strong className="text-blue-700">{outlook.nextQuarterEpsEst}</strong>
                          </div>
                        )}
                        {outlook.nextQuarterRevEst && (
                          <div className="text-right border-l border-slate-200 pl-3">
                            <span className="text-[10px] text-slate-400 block">Next Qtr Rev</span>
                            <strong className="text-slate-800">{outlook.nextQuarterRevEst}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed mb-2">
                      <span className="font-semibold text-slate-800">Investment Thesis:</span> {outlook.thesis}
                    </p>

                    {outlook.catalysts && outlook.catalysts.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Catalysts:</span>
                        {outlook.catalysts.map((cat, cIdx) => (
                          <span key={cIdx} className="text-[10px] bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                            • {cat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STOXX Benchmark Note (Explicitly requested: no single-stock bank outlooks for STOXX Europe 600 Banks Index) */}
          {result.isBankingIndex && (
            <div className="border-t border-slate-200 pt-3">
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 text-xs text-sky-900">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <Activity className="w-4 h-4 text-sky-700" />
                  <span>STOXX Europe 600 Banks Benchmark Index Specifications</span>
                </div>
                <p className="text-sky-800 leading-relaxed">
                  As the primary European banking sector benchmark index covering 44 institutions across 17 nations, 
                  individual single-stock bank target prices are omitted. The aggregate index trades at 
                  <strong> 7.6x forward earnings</strong> with an average constituent dividend yield of 
                  <strong> 6.7%</strong> and average CET1 solvency ratio of <strong>15.6%</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Guidance & AI CapEx */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <span className="font-bold text-slate-800 uppercase text-[11px] block mb-1">
                Forward Guidance Summary
              </span>
              <p className="text-slate-600 leading-relaxed">
                {result.guidanceSummary}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <span className="font-bold text-slate-800 uppercase text-[11px] block mb-1 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                <span>AI Infrastructure & CapEx</span>
              </span>
              <p className="text-slate-600 leading-relaxed">
                {result.aiCapexHighlight || 'CapEx prioritized toward compute expansion and data center buildouts.'}
              </p>
            </div>
          </div>

          {/* AI Executive Memo Section */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-900 uppercase text-[11px] font-mono-code">
                  Executive AI Earnings Memo (Gemini Model)
                </h4>
              </div>
              {!aiAnalysis && (
                <button
                  id="btn-generate-memo-modal"
                  onClick={handleFetchAiMemo}
                  disabled={loadingAi}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  {loadingAi ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing Memo...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Institutional Memo</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {aiAnalysis && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5 text-xs">
                <div>
                  <span className="font-bold text-slate-900 block mb-1 uppercase text-[10px] text-blue-700 font-mono-code">
                    Executive Verdict
                  </span>
                  <p className="text-slate-700 leading-relaxed bg-white border border-slate-200 rounded-lg p-3">
                    {aiAnalysis.summaryVerdict}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white border border-slate-200 rounded-lg p-3">
                    <span className="font-bold text-slate-900 block text-[10px] uppercase mb-1">Financial Health & Margins</span>
                    <p className="text-slate-600 leading-relaxed">
                      {aiAnalysis.financialScorecard?.marginTrends}
                    </p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-3">
                    <span className="font-bold text-slate-900 block text-[10px] uppercase mb-1">AI CapEx Takeaway</span>
                    <p className="text-slate-600 leading-relaxed">
                      {aiAnalysis.aiAndCapexTakeaway}
                    </p>
                  </div>
                </div>

                {aiAnalysis.bullCase && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3">
                      <span className="font-bold text-emerald-800 block text-[10px] uppercase mb-1">Bull Catalyst</span>
                      <p className="text-emerald-900 leading-relaxed">{aiAnalysis.bullCase}</p>
                    </div>
                    <div className="bg-rose-50/70 border border-rose-200 rounded-lg p-3">
                      <span className="font-bold text-rose-800 block text-[10px] uppercase mb-1">Bear Risk</span>
                      <p className="text-rose-900 leading-relaxed">{aiAnalysis.bearCase}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <button
            id="btn-test-push-company"
            onClick={() => onTriggerTestPush(result)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-semibold text-xs transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-emerald-600" />
            <span>Broadcast Push Notification</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition cursor-pointer"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
