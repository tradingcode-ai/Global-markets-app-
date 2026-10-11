import React, { useState, useMemo } from 'react';
import { AlertPreferences, NotificationAssetCatalogItem } from '../types';
import { 
  X, 
  Bell, 
  Volume2, 
  ShieldCheck, 
  Radio, 
  Check, 
  Sliders,
  Activity,
  Globe,
  Search,
  Filter
} from 'lucide-react';
import { NOTIFICATION_APP_STOCKS } from '../data/allAppStocks';
import { StockLogo } from './StockLogo';
import MomentumIcon from './MomentumIcon';
import { SystemStatusPanel } from './SystemStatusPanel';

interface AlertSettingsModalProps {
  preferences: AlertPreferences;
  onUpdatePreferences: (prefs: AlertPreferences) => void;
  browserPermission: NotificationPermission;
  onRequestBrowserPermission: () => void;
  secFeedStatus?: string | null;
  stockQuoteFeedStatus?: string | null;
  notificationAssets?: NotificationAssetCatalogItem[];
  assetFeedStatus?: string | null;
  onClose: () => void;
}

export const AlertSettingsModal: React.FC<AlertSettingsModalProps> = ({
  preferences,
  onUpdatePreferences,
  browserPermission,
  onRequestBrowserPermission,
  secFeedStatus,
  stockQuoteFeedStatus,
  notificationAssets = [],
  assetFeedStatus,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'assets' | 'system'>('alerts');
  const [tickerSearch, setTickerSearch] = useState('');
  const [tickerCategory, setTickerCategory] = useState<string>('ALL');
  const [assetSearch, setAssetSearch] = useState('');
  const [assetGroupFilter, setAssetGroupFilter] = useState<'ALL' | NotificationAssetCatalogItem['group']>('ALL');
  const [assetsSelectedOnly, setAssetsSelectedOnly] = useState(false);
  const nonEquitySymbols = useMemo(() => new Set(notificationAssets.map(asset => asset.symbol.toUpperCase())), [notificationAssets]);
  const stockUniverse = useMemo(() => NOTIFICATION_APP_STOCKS.filter(stock => !nonEquitySymbols.has(stock.ticker.toUpperCase())), [nonEquitySymbols]);

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
      subscribedTickers: stockUniverse.map(s => s.ticker)
    });
  };

  const deselectAllTickers = () => {
    onUpdatePreferences({
      ...preferences,
      subscribedTickers: []
    });
  };

  const toggleAsset = (symbol: string) => {
    const current = preferences.subscribedAssetSymbols || [];
    const hasSymbol = current.some(value => value.toUpperCase() === symbol.toUpperCase());
    const next = hasSymbol
      ? current.filter(value => value.toUpperCase() !== symbol.toUpperCase())
      : [...current, symbol.toUpperCase()];
    onUpdatePreferences({ ...preferences, subscribedAssetSymbols: next });
  };

  const selectSupportedAssets = (assets: NotificationAssetCatalogItem[]) => {
    const supported = assets.filter(asset => asset.quoteAvailable && Number.isFinite(asset.thresholdPct) && (asset.thresholdPct as number) > 0).map(asset => asset.symbol);
    onUpdatePreferences({ ...preferences, subscribedAssetSymbols: [...new Set([...(preferences.subscribedAssetSymbols || []), ...supported])] });
  };

  const filteredStocks = useMemo(() => {
    const q = tickerSearch.trim().toLowerCase();
    return stockUniverse.filter(stock => {
      if (tickerCategory === 'SUBSCRIBED' && !preferences.subscribedTickers.includes(stock.ticker)) {
        return false;
      }
      if (tickerCategory !== 'ALL' && tickerCategory !== 'SUBSCRIBED' && stock.category !== tickerCategory) {
        return false;
      }
      if (!q) return true;
      return (
        stock.ticker.toLowerCase().includes(q) ||
        stock.name.toLowerCase().includes(q) ||
        stock.categoryLabel.toLowerCase().includes(q) ||
        stock.exchange.toLowerCase().includes(q)
      );
    });
  }, [tickerSearch, tickerCategory, preferences.subscribedTickers, stockUniverse]);

  const filteredAssets = useMemo(() => {
    const query = assetSearch.trim().toLowerCase();
    return notificationAssets.filter(asset => {
      if (assetGroupFilter !== 'ALL' && asset.group !== assetGroupFilter) return false;
      if (assetsSelectedOnly && !(preferences.subscribedAssetSymbols || []).some(symbol => symbol.toUpperCase() === asset.symbol.toUpperCase())) return false;
      return !query || asset.symbol.toLowerCase().includes(query) || asset.name.toLowerCase().includes(query) || asset.group.toLowerCase().includes(query) || asset.assetClass.toLowerCase().includes(query);
    });
  }, [assetSearch, assetGroupFilter, assetsSelectedOnly, notificationAssets, preferences.subscribedAssetSymbols]);

  const assetGroups = useMemo(() => Array.from(new Set(filteredAssets.map(asset => asset.group))), [filteredAssets]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div 
        id="alert-settings-modal"
        className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Soft Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-mono-code uppercase">
                Instellingen & Systeemdiagnose
              </h3>
              <p className="text-xs text-slate-500">Beheer notificatie-regels, API-koppelingen en servergezondheid</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition p-1.5 rounded-lg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-4 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'alerts'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Meldingen & Protocol</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('assets')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'assets'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Global Markets</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'system'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>Systeem & API Status</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-6 overflow-y-auto">
          {activeTab === 'system' ? (
            <SystemStatusPanel />
          ) : activeTab === 'assets' ? (
            <div className="space-y-4 text-xs text-slate-600">
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900">Global Markets volatility alerts</h4>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-600">Uses mapped Yahoo instruments and the active research threshold for each asset category. Alerts require a source trade timestamp no more than 2 minutes old, no reported provider delay, and an open provider session. Checks run while this tab is open and active.</p>
                  </div>
                  <input
                    aria-label="Enable Global Markets volatility alerts"
                    type="checkbox"
                    checked={preferences.alertOnAssetVolatility ?? true}
                    onChange={(event) => onUpdatePreferences({ ...preferences, alertOnAssetVolatility: event.target.checked })}
                    className="h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-0"
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-blue-200/70 pt-3">
                  <span className="font-semibold text-blue-900">{(preferences.subscribedAssetSymbols || []).length} selected</span>
                  <span role="status" className="text-[10px] text-slate-600">{assetFeedStatus || 'Eligibility requires a fresh source timestamp, no reported delay, and an active provider session.'}</span>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={assetSearch}
                  onChange={(event) => setAssetSearch(event.target.value)}
                  placeholder="Search indices, sector ETFs, commodities, or yields"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {([
                  ['ALL', 'All'],
                  ['Global indices', 'Indices'],
                  ['Sector indices & ETFs', 'Sectors & ETFs'],
                  ['Commodities', 'Commodities'],
                  ['Sovereign yields', 'Yields']
                ] as const).map(([group, label]) => (
                  <button key={group} type="button" onClick={() => setAssetGroupFilter(group)} className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${assetGroupFilter === group ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                    {label}{group === 'ALL' ? ` (${notificationAssets.length})` : ` (${notificationAssets.filter(asset => asset.group === group).length})`}
                  </button>
                ))}
                <label className="ml-auto inline-flex items-center gap-1.5 px-1 text-[10px] text-slate-600">
                  <input type="checkbox" checked={assetsSelectedOnly} onChange={event => setAssetsSelectedOnly(event.target.checked)} className="h-3.5 w-3.5 rounded border-slate-300 text-slate-700 focus:ring-0" />
                  Selected only
                </label>
              </div>

              {assetGroups.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">No matching market assets are available in the current catalog.</div>
              ) : assetGroups.map(group => {
                const groupAssets = filteredAssets.filter(asset => asset.group === group);
                return (
                  <section key={group} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2">
                      <div>
                        <h5 className="font-bold text-slate-800">{group}</h5>
                        <p className="text-[10px] text-slate-500">{groupAssets.length} catalogued assets</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => selectSupportedAssets(groupAssets)}
                        className="rounded-md px-2 py-1 text-[10px] font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        Select mapped assets
                      </button>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {groupAssets.map(asset => {
                        const selected = (preferences.subscribedAssetSymbols || []).some(value => value.toUpperCase() === asset.symbol.toUpperCase());
                        const hasThreshold = Number.isFinite(asset.thresholdPct) && (asset.thresholdPct as number) > 0;
                        const supported = asset.quoteAvailable && hasThreshold;
                        const thresholdLabel = hasThreshold
                          ? `${asset.thresholdPct}%${asset.group === 'Sovereign yields' ? ' relative yield move' : ''}`
                          : 'Threshold unavailable';
                        return (
                          <label key={`${asset.group}:${asset.symbol}`} className={`flex items-start gap-3 px-3 py-2.5 ${supported || selected ? 'cursor-pointer hover:bg-slate-50' : 'cursor-not-allowed bg-slate-50/70'}`}>
                            <input
                              type="checkbox"
                              checked={selected}
                              disabled={!supported && !selected}
                              onChange={() => toggleAsset(asset.symbol)}
                              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-0 disabled:opacity-40"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-1.5">
                                <span className="font-mono-code font-bold text-slate-900">{asset.symbol}</span>
                                <span className="text-slate-600">{asset.name}</span>
                                <span className="rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-800">{thresholdLabel}</span>
                                {asset.unit && <span className="text-[9px] text-slate-500">{asset.unit}{asset.currency ? ` · ${asset.currency}` : ''}</span>}
                              </span>
                              <span className="mt-1 block text-[10px] text-slate-500">
                                {supported ? `Source mapped: ${asset.providerSymbol}` : asset.coverageReason || (hasThreshold ? 'A direct provider instrument is not mapped for this asset.' : 'No active research threshold is configured for this asset category.')}
                              </span>
                            </span>
                            <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${supported ? 'bg-slate-100 text-slate-700' : 'bg-rose-50 text-rose-700'}`}>{supported ? 'SOURCE MAPPED' : 'UNAVAILABLE'}</span>
                          </label>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="space-y-5 text-xs text-slate-600">
              {/* 1. Browser System Push Permission */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 uppercase text-[11px]">
                    <Bell className="w-3.5 h-3.5 text-blue-600" />
                    Browser Desktop Push Toestemming
                  </span>
                  {browserPermission === 'granted' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      GEOORLOOFD
                    </span>
                  ) : browserPermission === 'denied' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1">
                      <Radio className="w-3 h-3 text-rose-600" />
                      GEBLOKKEERD
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      NIET GEVRAAGD
                    </span>
                  )}
                </div>

                <p className="text-slate-500 text-[11px] leading-relaxed mb-3">
                  Systeemberichten verschijnen zolang Global Markets open en actief is. Markt- en SEC-controles pauzeren wanneer dit tabblad verborgen is.
                </p>

                {browserPermission !== 'granted' ? (
                  <button
                    id="btn-request-push-perm-settings"
                    onClick={onRequestBrowserPermission}
                    className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Toestemming nu aanvragen</span>
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
                    <span className="text-xs font-medium">Toon native desktop push banners</span>
                  </label>
                )}
              </div>

              {/* 2. Audio Chime */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Geluidssignaal bij Meldingen</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Hoorbaar geluidssignaal bij nieuwe materiële bedrijfs- of earnings-events
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.soundEnabled}
                  onChange={(e) => onUpdatePreferences({
                    ...preferences,
                    soundEnabled: e.target.checked
                  })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* 3. Surprise Threshold */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">Minimale Surprise Drempelwaarde</span>
                  <span className="font-mono-code font-bold text-blue-600 text-xs">
                    {preferences.minSurprisePercentage ?? 2.0}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={preferences.minSurprisePercentage ?? 2.0}
                  onChange={(e) => onUpdatePreferences({
                    ...preferences,
                    minSurprisePercentage: parseFloat(e.target.value)
                  })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono-code">
                  <span>0% (Alle resultaten)</span>
                  <span>5%</span>
                  <span>15% (Alleen extreme uitschieters)</span>
                </div>
              </div>

              {/* 4. Directional Alerts */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <span className="font-bold text-slate-900 block text-xs">Geactiveerde Alert Categorieën</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-white cursor-pointer hover:border-slate-300 transition">
                    <input
                      type="checkbox"
                      checked={preferences.alertOnEarningsBeat ?? preferences.alertOnBeat ?? true}
                      onChange={(e) => onUpdatePreferences({
                        ...preferences,
                        alertOnBeat: e.target.checked,
                        alertOnEarningsBeat: e.target.checked
                      })}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-0 w-4 h-4"
                    />
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs">
                      <MomentumIcon direction="up" size={14} />
                      <span>Earnings Beats</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-white cursor-pointer hover:border-slate-300 transition">
                    <input
                      type="checkbox"
                      checked={preferences.alertOnRelease ?? true}
                      onChange={(e) => onUpdatePreferences({ ...preferences, alertOnRelease: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-0 w-4 h-4"
                    />
                    <span className="font-semibold text-slate-800 text-xs">SEC Item 2.02 financial results</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-white cursor-pointer hover:border-slate-300 transition">
                    <input
                      type="checkbox"
                      checked={preferences.alertOnSec8K ?? true}
                      onChange={(e) => onUpdatePreferences({ ...preferences, alertOnSec8K: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-0 w-4 h-4"
                    />
                    <span className="font-semibold text-slate-800 text-xs">Other SEC Form 8-K filings</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-white cursor-pointer hover:border-slate-300 transition">
                    <input
                      type="checkbox"
                      checked={preferences.alertOnEarningsMiss ?? preferences.alertOnMiss ?? true}
                      onChange={(e) => onUpdatePreferences({
                        ...preferences,
                        alertOnMiss: e.target.checked,
                        alertOnEarningsMiss: e.target.checked
                      })}
                      className="rounded border-slate-300 text-rose-600 focus:ring-0 w-4 h-4"
                    />
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs">
                      <MomentumIcon direction="down" size={14} />
                      <span>Earnings Misses</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-white cursor-pointer hover:border-slate-300 transition">
                    <input
                      type="checkbox"
                      checked={preferences.alertOnDmaBreakdown ?? true}
                      onChange={(e) => onUpdatePreferences({ ...preferences, alertOnDmaBreakdown: e.target.checked })}
                      className="rounded border-slate-300 text-amber-600 focus:ring-0 w-4 h-4"
                    />
                    <span className="font-semibold text-slate-800 text-xs">Verified 200-day breakdown</span>
                  </label>
                </div>
                <p role="status" className="text-[10px] text-slate-600">Beat/miss comparison is unavailable until a feed supplies actual EPS and consensus for the same period and reporting basis. The current Yahoo company view does not establish that match.</p>
              </div>

              {/* 5. Ticker Subscriptions for Push Engine */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-blue-600" />
                      <span>Push Engine — Gevolgde Aandelen ({preferences.subscribedTickers.length})</span>
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Kies voor welke individuele aandelen je live prijsalerts en recente SEC-filings wilt ontvangen. Een lege selectie schakelt automatische meldingen uit. Staat los van de News Agent.
                    </p>
                    {secFeedStatus && <p role="status" className="text-[10px] text-slate-600 mt-2">SEC feed: {secFeedStatus}</p>}
                    {stockQuoteFeedStatus && <p role="status" className="text-[10px] text-slate-600 mt-1">Price feed: {stockQuoteFeedStatus}</p>}
                  </div>
                  <div className="space-x-2 text-[11px] shrink-0">
                    <button
                      type="button"
                      onClick={selectAllTickers}
                      className="text-blue-600 hover:underline cursor-pointer font-semibold"
                    >
                      Alles ({stockUniverse.length})
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={deselectAllTickers}
                      className="text-slate-500 hover:text-slate-800 cursor-pointer font-semibold"
                    >
                      Wissen
                    </button>
                  </div>
                </div>

                {/* Search & Category Filter */}
                <div className="space-y-2 pt-1">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={tickerSearch}
                      onChange={(e) => setTickerSearch(e.target.value)}
                      placeholder="Zoek in alle aandelen (bijv. ASML, Apple, Nvidia, Palantir, TSMC)..."
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                    {tickerSearch && (
                      <button
                        type="button"
                        onClick={() => setTickerSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
                    {[
                      { id: 'ALL', label: `Alles (${stockUniverse.length})` },
                      { id: 'SUBSCRIBED', label: `Actief (${preferences.subscribedTickers.length})` },
                      { id: 'mega_cap', label: 'Mega-Cap' },
                      { id: 'semiconductors', label: 'Chips' },
                      { id: 'software', label: 'Software' },
                      { id: 'europe', label: 'Europa' },
                      { id: 'financials', label: 'Financials' },
                      { id: 'aerospace', label: 'Defense' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setTickerCategory(tab.id)}
                        className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer shrink-0 ${
                          tickerCategory === tab.id
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stock Badges Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {filteredStocks.map((stock) => {
                    const isSelected = preferences.subscribedTickers.includes(stock.ticker);
                    return (
                      <button
                        key={stock.ticker}
                        type="button"
                        onClick={() => toggleTicker(stock.ticker)}
                        className={`p-1.5 rounded-lg border text-left transition cursor-pointer flex items-center justify-between gap-1.5 ${
                          isSelected 
                            ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-2xs ring-1 ring-blue-400/20' 
                            : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-5 h-5 rounded-md bg-white border border-slate-200/80 p-0.5 flex items-center justify-center shrink-0">
                            <StockLogo ticker={stock.ticker} className="w-full h-full object-contain" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-mono-code font-bold text-[11px] block leading-tight">
                              {stock.ticker}
                            </span>
                            <span className="text-[9px] text-slate-400 block truncate leading-tight">
                              {stock.name}
                            </span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                  {filteredStocks.length === 0 && (
                    <div className="col-span-full py-4 text-center text-slate-400 text-xs">
                      Geen aandelen gevonden voor &ldquo;{tickerSearch}&rdquo;
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          {activeTab === 'assets' ? (
            <>
              <span className="text-[11px] text-slate-500">{(preferences.subscribedAssetSymbols || []).length} assets selected · {assetFeedStatus || 'Alerts require a fresh source timestamp, no reported delay, and an active session'}</span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition cursor-pointer shadow-2xs"
              >
                Save settings
              </button>
            </>
          ) : activeTab === 'alerts' ? (
            <>
              <span className="text-[11px] text-slate-500 font-medium">
                {preferences.subscribedTickers.length} van {stockUniverse.length} tickers geselecteerd voor push-meldingen
              </span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition cursor-pointer shadow-2xs"
              >
                Instellingen Opslaan
              </button>
            </>
          ) : (
            <>
              <span className="text-[11px] text-slate-500 font-mono-code">
                Beveiligde SSL verbinding met Render Cloud
              </span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition cursor-pointer shadow-2xs"
              >
                Sluiten
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
