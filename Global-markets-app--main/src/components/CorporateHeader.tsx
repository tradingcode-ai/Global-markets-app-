import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  Zap, 
  Settings, 
  Search, 
  ShieldCheck, 
  Radio,
  Clock,
  Sparkles
} from 'lucide-react';
import { AlertPreferences, PushNotificationItem } from '../types';

interface CorporateHeaderProps {
  preferences: AlertPreferences;
  onUpdatePreferences: (prefs: AlertPreferences) => void;
  onRequestBrowserPermission: () => void;
  browserPermission: NotificationPermission;
  notifications: PushNotificationItem[];
  onOpenNotifications: () => void;
  onOpenSimulator: () => void;
  onOpenSettings: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedSector: string;
  onSectorChange: (sector: string) => void;
}

export const CorporateHeader: React.FC<CorporateHeaderProps> = ({
  preferences,
  onUpdatePreferences,
  onRequestBrowserPermission,
  browserPermission,
  notifications,
  onOpenNotifications,
  onOpenSimulator,
  onOpenSettings,
  searchQuery,
  onSearchChange,
  selectedSector,
  onSectorChange
}) => {
  const [currentTimeET, setCurrentTimeET] = useState<string>('');
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'America/New_York',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      };
      setCurrentTimeET(now.toLocaleTimeString('en-US', options) + ' ET');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    onUpdatePreferences({
      ...preferences,
      soundEnabled: !preferences.soundEnabled
    });
  };

  return (
    <header id="corporate-header" className="bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 sticky top-0 z-30 shadow-2xs">
      {/* Top Soft Corporate Bar */}
      <div className="border-b border-slate-100 bg-slate-50/70 px-4 lg:px-8 py-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-6 text-slate-600">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-700 tracking-tight">NYSE / NASDAQ TERMINAL FEED</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600 font-mono-code tabular-nums flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {currentTimeET || '04:05:00 PM ET'}
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-3 text-slate-500 text-[11px]">
            <span>EARNINGS SEASON: <strong className="text-slate-700 font-semibold">Q2/Q3 2026 EARNINGS & MACRO</strong></span>
            <span>•</span>
            <span>MONITORED: <strong className="text-emerald-700 font-semibold">47 GLOBAL EQUITIES (TECH, HYPERSCALERS & FINANCIALS) • 16 COMMODITIES • 9 RATES</strong></span>
          </div>
        </div>

        {/* Status of Push & System Alerts */}
        <div className="flex items-center space-x-2.5">
          {browserPermission === 'granted' && preferences.browserNotificationsEnabled ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              PUSH ACTIVE
            </span>
          ) : browserPermission === 'denied' ? (
            <button 
              id="btn-fix-push-denied"
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] hover:bg-amber-100 transition cursor-pointer"
              title="Browser notifications blocked in site settings"
            >
              <Radio className="w-3 h-3 text-amber-600" />
              PUSH BLOCKED (CLICK TO FIX)
            </button>
          ) : (
            <button
              id="btn-enable-browser-push"
              onClick={onRequestBrowserPermission}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-[11px] shadow-2xs transition cursor-pointer"
            >
              <Bell className="w-3 h-3" />
              <span>ENABLE PUSH ALERTS</span>
            </button>
          )}

          <button
            id="btn-toggle-sound"
            onClick={toggleSound}
            className={`p-1.5 rounded-md text-xs transition cursor-pointer ${
              preferences.soundEnabled 
                ? 'text-emerald-700 hover:bg-emerald-50 bg-slate-100/80' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
            title={preferences.soundEnabled ? 'Audio chime enabled (Click to mute)' : 'Audio chime muted (Click to unmute)'}
          >
            {preferences.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Soft Corporate Navigation & Controls */}
      <div className="px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center font-bold font-mono-code text-sm shadow-xs">
            <span className="text-emerald-400 font-extrabold">V</span>T
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-slate-900 uppercase font-mono-code">
                Tech Earnings Pulse
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                INSTITUTIONAL
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              Consensus Estimates, Real-Time Market Tracker & Push Dispatches
            </p>
          </div>
        </div>

        {/* Search & Sector Filters */}
        <div className="flex items-center gap-2 flex-1 max-w-md min-w-[240px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-ticker"
              type="text"
              placeholder="Search ticker (e.g. NVDA, MSFT), company, or segment..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          <select
            id="select-sector-filter"
            value={selectedSector}
            onChange={(e) => onSectorChange(e.target.value)}
            className="bg-slate-50 hover:bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition cursor-pointer font-medium"
          >
            <option value="ALL">All Sectors & Asset Classes</option>
            <option value="The Shovel Sellers">⛏️ The Shovel Sellers (AI Hardware, Equipment, Comms)</option>
            <option value="Hyperscalers & Neo Clouds">☁️ Hyperscalers & Neo Clouds</option>
            <option value="U.S. Financials">U.S. Financials (Big 6 & Alts)</option>
            <option value="European Financials">European Financials & STOXX</option>
            <option value="Semiconductors & AI">Semiconductors & AI</option>
            <option value="Cloud & Enterprise">Cloud & Enterprise</option>
            <option value="Big Tech Megacap">Big Tech Megacap</option>
            <option value="Consumer & Media">Consumer & Media</option>
            <option value="Industrial Tech & Energy">Industrial Tech & Energy</option>
            <option value="Fintech & Digital Payments">Fintech & Digital Payments</option>
          </select>
        </div>

        {/* Actions: Simulate, Alerts, Settings */}
        <div className="flex items-center gap-2">
          {/* Simulate Live Release button */}
          <button
            id="btn-simulate-release"
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200 text-emerald-800 text-xs font-semibold tracking-wide transition shadow-2xs cursor-pointer"
            title="Simulate breaking quarterly results to trigger an instant real push notification"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20" />
            <span>SIMULATE BREAKING RELEASE</span>
          </button>

          {/* Push Alert Notification Bell with Counter */}
          <button
            id="btn-open-notifications-feed"
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition cursor-pointer"
            title="View Pushed Results Feed"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-rose-600 border border-white text-white text-[10px] font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Preferences Settings Modal */}
          <button
            id="btn-open-settings-modal"
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition cursor-pointer"
            title="Configure Push Notification Rules"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
