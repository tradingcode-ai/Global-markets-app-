import React, { useState } from 'react';
import { QuarterlyResult, AlertPreferences } from '../types';
import { X, Zap, Volume2, Send } from 'lucide-react';
import { TECH_COMPANIES } from '../data/earningsData';

interface SimulateReleaseModalProps {
  results: QuarterlyResult[];
  preferences: AlertPreferences;
  onClose: () => void;
  onExecuteSimulation: (scenario: {
    ticker: string;
    scenarioType: 'beat' | 'miss' | 'breaking' | 'guidance';
    customTitle?: string;
    customBody?: string;
    updatedResult: Partial<QuarterlyResult>;
  }) => void;
}

export const SimulateReleaseModal: React.FC<SimulateReleaseModalProps> = ({
  results,
  preferences,
  onClose,
  onExecuteSimulation
}) => {
  const [selectedTicker, setSelectedTicker] = useState<string>('NVDA');
  const [scenarioType, setScenarioType] = useState<'beat' | 'miss' | 'guidance' | 'breaking'>('beat');
  const [previewHeadline, setPreviewHeadline] = useState<string>('');

  const company = TECH_COMPANIES[selectedTicker];
  const targetResult = results.find(r => r.ticker === selectedTicker);

  const handleTrigger = () => {
    let updatedResult: Partial<QuarterlyResult> = {};
    let title = '';
    let body = '';

    if (scenarioType === 'beat') {
      const actualEps = Number(((targetResult?.epsEstimate || 1.0) * 1.12).toFixed(2));
      const actualRev = Number(((targetResult?.revenueEstimate || 20.0) * 1.06).toFixed(2));
      const surprise = Number((((actualEps - (targetResult?.epsEstimate || 1.0)) / (targetResult?.epsEstimate || 1.0)) * 100).toFixed(1));
      
      title = `${selectedTicker} — Earnings Beat (Q3 Results)`;
      body = `${selectedTicker} beats consensus with actual EPS $${actualEps} vs $${targetResult?.epsEstimate} est (+${surprise}%). Revenue $${actualRev}B.`;
      
      updatedResult = {
        status: 'reported',
        epsActual: actualEps,
        epsSurprisePercent: surprise,
        revenueActual: actualRev,
        revenueSurprisePercent: 6.0,
        priceReactionPercent: 6.4,
        guidanceRating: 'raised',
        guidanceSummary: 'Management upgraded forward quarterly guidance above upper boundary of Wall Street consensus.'
      };
    } else if (scenarioType === 'miss') {
      const actualEps = Number(((targetResult?.epsEstimate || 1.0) * 0.93).toFixed(2));
      const actualRev = Number(((targetResult?.revenueEstimate || 20.0) * 0.98).toFixed(2));
      const surprise = Number((((actualEps - (targetResult?.epsEstimate || 1.0)) / (targetResult?.epsEstimate || 1.0)) * 100).toFixed(1));

      title = `${selectedTicker} — Earnings Miss (Q3 Results)`;
      body = `${selectedTicker} missed consensus with actual EPS $${actualEps} vs $${targetResult?.epsEstimate} est (${surprise}%). Revenue $${actualRev}B.`;

      updatedResult = {
        status: 'reported',
        epsActual: actualEps,
        epsSurprisePercent: surprise,
        revenueActual: actualRev,
        revenueSurprisePercent: -2.0,
        priceReactionPercent: -5.2,
        guidanceRating: 'lowered',
        guidanceSummary: 'Management introduced cautious commentary regarding discretionary enterprise spend and elongated sales cycles.'
      };
    } else if (scenarioType === 'guidance') {
      title = `${selectedTicker}: EMERGENCY CAPEX & GUIDANCE UPDATE`;
      body = `${selectedTicker} raises full-year AI infrastructure CapEx by $8B, projecting positive multi-year operating leverage.`;

      updatedResult = {
        guidanceRating: 'raised',
        aiCapexHighlight: 'CapEx raised significantly with management prioritizing high-bandwidth computing cluster buildouts.',
        priceReactionPercent: 3.8
      };
    } else {
      title = `BREAKING: ${selectedTicker} Files 8-K Early With Record Orders`;
      body = `${selectedTicker} reports unexpected surge in enterprise cloud commitments, booking $15B+ in commercial backlogs.`;

      updatedResult = {
        priceReactionPercent: 7.5,
        guidanceRating: 'raised'
      };
    }

    onExecuteSimulation({
      ticker: selectedTicker,
      scenarioType,
      customTitle: previewHeadline || title,
      customBody: body,
      updatedResult
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div 
        id="simulate-release-modal"
        className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden"
      >
        {/* Soft Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-mono-code uppercase">
                Simulate Live Earnings Release & Push Alert
              </h3>
              <p className="text-xs text-slate-500">Test the instant push notification flow</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs text-slate-600">
          <p className="text-slate-500 leading-relaxed">
            Select a target tech megacap and scenario to immediately test the end-to-end push notification flow (system desktop toast, corporate audio chime, and in-app alert log).
          </p>

          {/* Select Ticker */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5 uppercase text-[11px]">
              Select Tech Megacap
            </label>
            <select
              id="select-sim-ticker"
              value={selectedTicker}
              onChange={(e) => setSelectedTicker(e.target.value)}
              className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono-code transition cursor-pointer"
            >
              {Object.keys(TECH_COMPANIES).map((ticker) => (
                <option key={ticker} value={ticker}>
                  {ticker} — {TECH_COMPANIES[ticker].name} ({TECH_COMPANIES[ticker].sector})
                </option>
              ))}
            </select>
          </div>

          {/* Select Scenario */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5 uppercase text-[11px]">
              Earnings Outcome Scenario
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setScenarioType('beat')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  scenarioType === 'beat' 
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-950 ring-1 ring-emerald-300' 
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                <div className="font-bold font-mono-code text-xs text-slate-900">1. Resounding Beat</div>
                <div className="text-[10px] text-emerald-800 mt-0.5">EPS +12%, Guidance Raised, Price Jump</div>
              </button>

              <button
                type="button"
                onClick={() => setScenarioType('miss')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  scenarioType === 'miss' 
                    ? 'bg-rose-50 border-rose-400 text-rose-950 ring-1 ring-rose-300' 
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                <div className="font-bold font-mono-code text-xs text-slate-900">2. Consensus Miss</div>
                <div className="text-[10px] text-rose-800 mt-0.5">EPS -7%, Lowered Guidance, Selloff</div>
              </button>

              <button
                type="button"
                onClick={() => setScenarioType('guidance')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  scenarioType === 'guidance' 
                    ? 'bg-blue-50 border-blue-400 text-blue-950 ring-1 ring-blue-300' 
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                <div className="font-bold font-mono-code text-xs text-slate-900">3. CapEx Surge</div>
                <div className="text-[10px] text-blue-800 mt-0.5">AI compute spend lifted, margin watch</div>
              </button>

              <button
                type="button"
                onClick={() => setScenarioType('breaking')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  scenarioType === 'breaking' 
                    ? 'bg-amber-50 border-amber-400 text-amber-950 ring-1 ring-amber-300' 
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                <div className="font-bold font-mono-code text-xs text-slate-900">4. Breaking 8-K</div>
                <div className="text-[10px] text-amber-800 mt-0.5">Sudden early release, major contract</div>
              </button>
            </div>
          </div>

          {/* Notification delivery preview */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
              <span className="font-semibold uppercase tracking-wider text-slate-700">Push Payload Preview</span>
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <Volume2 className="w-3.5 h-3.5" />
                {preferences.soundEnabled ? 'Corporate Chime Active' : 'Muted'}
              </span>
            </div>
            <div className="text-slate-900 font-mono-code font-bold mt-1">
              [TECH EARNINGS] {selectedTicker} Q3 Earnings: {scenarioType === 'beat' ? 'BEAT & GUIDANCE RAISED' : scenarioType === 'miss' ? 'TOP-LINE MISS' : 'BREAKING FILING'}
            </div>
            <div className="text-slate-500 text-[11px] mt-1 leading-relaxed">
              Consensus comparison and verified SEC figures will be broadcast to the notification tray and logged in the institutional feed.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="btn-confirm-simulate-push"
            onClick={handleTrigger}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Broadcast Push Notification</span>
          </button>
        </div>
      </div>
    </div>
  );
};
