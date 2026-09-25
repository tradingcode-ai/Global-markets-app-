import React from 'react';
import { AlertPreferences } from '../types';
import { 
  X, 
  Bell, 
  Volume2, 
  ShieldCheck, 
  Radio, 
  Check, 
  Sliders
} from 'lucide-react';
import { TECH_COMPANIES } from '../data/earningsData';
import MomentumIcon from './MomentumIcon';

interface AlertSettingsModalProps {
  preferences: AlertPreferences;
  onUpdatePreferences: (prefs: AlertPreferences) => void;
  browserPermission: NotificationPermission;
  onRequestBrowserPermission: () => void;
  onClose: () => void;
}

export const AlertSettingsModal: React.FC<AlertSettingsModalProps> = ({
  preferences,
  onUpdatePreferences,
  browserPermission,
  onRequestBrowserPermission,
  onClose
}) => {
  const toggleTicker = (ticker: string) => {
    let nextList = [...preferences.subscribedTickers];
    if (nextList.includes(ticker)) {
      nextList = nextList.filter(t => t !== ticker);
    } else {
      nextList.push(ticker);
    }
    onUpdatePreferences({
      ...preferences,
      subscribedTickers: nextList
    });
  };

  const selectAllTickers = () => {
    onUpdatePreferences({
      ...preferences,
      subscribedTickers: Object.keys(TECH_COMPANIES)
    });
  };

  const deselectAllTickers = () => {
    onUpdatePreferences({
      ...preferences,
      subscribedTickers: []
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div 
        id="alert-settings-modal"
        className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Soft Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-mono-code uppercase">
                Push Notification Protocol & Rules
              </h3>
              <p className="text-xs text-slate-500">Configure alert channels and surprise thresholds</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition p-1.5 rounded-lg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600">
          {/* 1. Browser System Push Permission */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 uppercase text-[11px]">
                <Bell className="w-3.5 h-3.5 text-blue-600" />
                Browser Desktop Push Permission
              </span>
              {browserPermission === 'granted' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  AUTHORIZED
                </span>
              ) : browserPermission === 'denied' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1">
                  <Radio className="w-3 h-3 text-rose-600" />
                  BLOCKED IN BROWSER
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  NOT PROMPTED
                </span>
              )}
            </div>

            <p className="text-slate-500 text-[11px] leading-relaxed mb-3">
              Sends native system notification banners even when this browser tab is running in the background.
            </p>

            {browserPermission !== 'granted' ? (
              <button
                id="btn-request-push-perm-settings"
                onClick={onRequestBrowserPermission}
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Request Push Permission Now</span>
              </button>
            ) : (
              <label className="flex items-center gap-2.5 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={preferences.browserNotificationsEnabled}
                  onChange={(e) => onUpdatePreferences({
                    ...preferences,
                    browserNotificationsEnabled: e.target.checked
                  })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-medium">Show native operating system push banners</span>
              </label>
            )}
          </div>

          {/* 2. Audio Chime */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Audio Alert Chime</span>
              </div>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Crisp institutional dual-tone audio chime on new earnings release
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.soundEnabled}
              onChange={(e) => onUpdatePreferences({
                ...preferences,
                soundEnabled: e.target.checked
              })}
              className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer h-4 w-4"
            />
          </div>

          {/* 3. Notification Triggers & Filter Rules */}
          <div>
            <h4 className="font-bold text-slate-800 uppercase text-[11px] tracking-wider mb-2 font-mono-code">
              Verified Alert Rules & Triggers
            </h4>

            {/* Earnings Category */}
            <div className="mb-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">
                A. Verified Corporate Earnings Results
              </div>
              <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <label className="flex items-center justify-between cursor-pointer py-1">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Earnings Beat</span>
                    <span className="text-[11px] text-slate-500">Only on reported quarterly results that beat analyst consensus</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.alertOnEarningsBeat}
                    onChange={(e) => onUpdatePreferences({
                      ...preferences,
                      alertOnEarningsBeat: e.target.checked
                    })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0 h-4 w-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer py-1.5 border-t border-slate-200">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Earnings Miss</span>
                    <span className="text-[11px] text-slate-500">Only on reported quarterly results that miss analyst consensus</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.alertOnEarningsMiss}
                    onChange={(e) => onUpdatePreferences({
                      ...preferences,
                      alertOnEarningsMiss: e.target.checked
                    })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0 h-4 w-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer py-1.5 border-t border-slate-200">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Official SEC Form 8-K Filings</span>
                    <span className="text-[11px] text-slate-500">Verified SEC EDGAR Item 2.02 earnings releases and material filings</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.alertOnSec8K}
                    onChange={(e) => onUpdatePreferences({
                      ...preferences,
                      alertOnSec8K: e.target.checked
                    })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0 h-4 w-4 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Market Momentum Category */}
            <div className="mb-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">
                B. Market & Price Momentum (Tiered Thresholds: 1x per threshold per day)
              </div>
              <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <label className="flex items-center justify-between cursor-pointer py-1">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <MomentumIcon direction="up" size={16} strokeWidth={2.5} />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">Momentum Up (+5.0%, then every +2.5%)</span>
                      <span className="text-[11px] text-slate-500">Triggers 1x per threshold (+5.0%, +7.5%, +10.0%, +12.5%, etc.) per trading day for active equities</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.alertOnMomentumUp}
                    onChange={(e) => onUpdatePreferences({
                      ...preferences,
                      alertOnMomentumUp: e.target.checked
                    })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0 h-4 w-4 cursor-pointer ml-3"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer py-1.5 border-t border-slate-200">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-300 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <MomentumIcon direction="down" size={16} strokeWidth={2.5} />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">Momentum Down (-5.0%, then every -2.5%)</span>
                      <span className="text-[11px] text-slate-500">Triggers 1x per threshold (-5.0%, -7.5%, -10.0%, -12.5%, etc.) per trading day for active equities</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.alertOnMomentumDown}
                    onChange={(e) => onUpdatePreferences({
                      ...preferences,
                      alertOnMomentumDown: e.target.checked
                    })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0 h-4 w-4 cursor-pointer ml-3"
                  />
                </label>
              </div>
            </div>

            {/* Technical Category */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">
                C. Technical Price Extremes
              </div>
              <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <label className="flex items-center justify-between cursor-pointer py-1">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">52-Week High & Low Alerts</span>
                    <span className="text-[11px] text-slate-500">New 52-week high or low reached (max 1x per trading day per ticker)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.alertOnFiftyTwoWeekHighLow ?? true}
                    onChange={(e) => onUpdatePreferences({
                      ...preferences,
                      alertOnFiftyTwoWeekHighLow: e.target.checked
                    })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0 h-4 w-4 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* 4. Subscribed Ticker Matrix */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-800 uppercase text-[11px] tracking-wider font-mono-code">
                Subscribed Tickers ({preferences.subscribedTickers.length} of {Object.keys(TECH_COMPANIES).length})
              </h4>
              <div className="space-x-2 text-[11px]">
                <button
                  type="button"
                  onClick={selectAllTickers}
                  className="text-blue-600 hover:underline cursor-pointer font-semibold"
                >
                  Select All
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={deselectAllTickers}
                  className="text-slate-500 hover:text-slate-800 cursor-pointer font-semibold"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {Object.keys(TECH_COMPANIES).map((ticker) => {
                const isSelected = preferences.subscribedTickers.includes(ticker);
                return (
                  <button
                    key={ticker}
                    type="button"
                    onClick={() => toggleTicker(ticker)}
                    className={`p-2.5 rounded-lg border text-center transition cursor-pointer font-mono-code text-xs font-bold flex items-center justify-center gap-1.5 ${
                      isSelected 
                        ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-2xs' 
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-blue-600" />}
                    <span>{ticker}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition cursor-pointer shadow-2xs"
          >
            Save Protocol Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
