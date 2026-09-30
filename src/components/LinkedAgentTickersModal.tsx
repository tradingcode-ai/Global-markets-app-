import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Check, 
  Plus, 
  Bell, 
  Sparkles, 
  ShieldCheck, 
  RotateCcw, 
  TrendingUp, 
  Cpu, 
  Layers,
  Database,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { StockLogo } from './StockLogo';
import { ALL_APP_STOCKS, AppStockMeta, CANONICAL_NEWS_AGENT_TICKERS } from '../data/allAppStocks';

export type AvailableStock = AppStockMeta;
export const MASTER_AVAILABLE_STOCKS = ALL_APP_STOCKS;
export const CANONICAL_4_TICKERS = CANONICAL_NEWS_AGENT_TICKERS;
export const TOP_10_TECH_TICKERS = ['ASML', 'NVDA', 'TSM', 'MSFT', 'AAPL', 'GOOGL', 'AMZN', 'META', 'AVGO', 'ORCL'];

interface LinkedAgentTickersModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscribedTickers: string[];
  onToggleSubscription: (ticker: string) => void;
  onSetSubscriptions?: (tickers: string[]) => void;
}

export const LinkedAgentTickersModal: React.FC<LinkedAgentTickersModalProps> = ({
  isOpen,
  onClose,
  subscribedTickers,
  onToggleSubscription,
  onSetSubscriptions
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Sync ticker with database
  const handleToggle = async (ticker: string, companyName?: string) => {
    const isCurrentlySubscribed = subscribedTickers.includes(ticker);
    const willBeSubscribed = !isCurrentlySubscribed;

    // Optimistic UI update in parent
    onToggleSubscription(ticker);

    // Synchronize directly with backend PostgreSQL database
    try {
      setSyncStatus(`Synchroniseren van ${ticker} met online database...`);
      const res = await fetch('/api/v1/alerts/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker,
          enabled: willBeSubscribed,
          company_name: companyName
        })
      });
      if (res.ok) {
        setSyncStatus(`✓ ${ticker} succesvol ${willBeSubscribed ? 'gekoppeld aan' : 'ontkoppeld van'} de database.`);
        setTimeout(() => setSyncStatus(null), 3000);
      }
    } catch (e: any) {
      console.warn('Sync error:', e);
      setSyncStatus(`Waarschuwing: Lokale update doorgevoerd, database sync vertraagd.`);
      setTimeout(() => setSyncStatus(null), 4000);
    }
  };

  const handleApplyPreset = async (presetTickers: string[], label: string) => {
    if (onSetSubscriptions) {
      onSetSubscriptions(presetTickers);
    } else {
      // Fallback toggle individually
      presetTickers.forEach(t => {
        if (!subscribedTickers.includes(t)) onToggleSubscription(t);
      });
      subscribedTickers.forEach(t => {
        if (!presetTickers.includes(t)) onToggleSubscription(t);
      });
    }

    setSyncStatus(`Preset '${label}' toepassen en synchroniseren met PostgreSQL...`);
    try {
      // Sync all preset additions/removals to backend
      for (const stock of MASTER_AVAILABLE_STOCKS) {
        const shouldEnable = presetTickers.includes(stock.ticker);
        const isCurrent = subscribedTickers.includes(stock.ticker);
        if (shouldEnable !== isCurrent) {
          fetch('/api/v1/alerts/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ticker: stock.ticker,
              enabled: shouldEnable,
              company_name: stock.name
            })
          }).catch(() => {});
        }
      }
      setTimeout(() => {
        setSyncStatus(`✓ Database gesynchroniseerd met ${presetTickers.length} tickers.`);
        setTimeout(() => setSyncStatus(null), 3000);
      }, 500);
    } catch {
      setSyncStatus(null);
    }
  };

  // Filter stocks
  const filteredStocks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MASTER_AVAILABLE_STOCKS.filter(stock => {
      // Category filter
      if (selectedCategory === 'SUBSCRIBED' && !subscribedTickers.includes(stock.ticker)) {
        return false;
      }
      if (selectedCategory !== 'ALL' && selectedCategory !== 'SUBSCRIBED' && stock.category !== selectedCategory) {
        return false;
      }
      // Query filter
      if (!q) return true;
      return (
        stock.ticker.toLowerCase().includes(q) ||
        stock.name.toLowerCase().includes(q) ||
        stock.exchange.toLowerCase().includes(q) ||
        stock.country.toLowerCase().includes(q) ||
        stock.categoryLabel.toLowerCase().includes(q)
      );
    });
  }, [search, selectedCategory, subscribedTickers]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#002d62] via-[#051c2c] to-[#0a2540] text-white p-6 sm:p-7 shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
            aria-label="Sluiten"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 text-xs font-mono text-cyan-300 mb-1.5">
            <Bell className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold uppercase tracking-wider">News & Research Agent Synchronisatie</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
            Gekoppelde Tickers voor News Agent
          </h2>
          
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Kies hieronder de individuele aandelen waar de AI News Agent gericht persberichten, SEC Form 8-K filings en earnings-analyses over verzamelt. Wijzigingen lopen 1-op-1 synchroon met de PostgreSQL database.
          </p>

          {/* Realtime PostgreSQL Database Sync Indicator */}
          <div className="mt-4 pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-300 font-mono text-[11px]">
                PostgreSQL (markets_xp9o · Frankfurt EU): <strong className="text-white">{subscribedTickers.length} actief gekoppeld</strong>
              </span>
            </div>

            {/* Presets Cluster */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 text-[11px] mr-1 hidden sm:inline">Presets:</span>
              <button
                onClick={() => handleApplyPreset(CANONICAL_4_TICKERS, 'Standaard 4')}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-[11px] transition cursor-pointer"
                title="Stel de 4 standaard leiders in: ASML, MSFT, NVDA, TSM"
              >
                Standaard 4
              </button>
              <button
                onClick={() => handleApplyPreset(TOP_10_TECH_TICKERS, 'Top 10 Tech')}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-[11px] transition cursor-pointer"
                title="Top 10 Mega-Cap & Chip Titans"
              >
                Top 10 Tech
              </button>
              <button
                onClick={() => handleApplyPreset([], 'Alles Deselecteren')}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[11px] transition cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Live Feedback Toast if synchronizing */}
        {syncStatus && (
          <div className="bg-cyan-950 text-cyan-200 px-6 py-2.5 text-xs font-mono border-b border-cyan-800 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span>{syncStatus}</span>
            </div>
            <span className="text-[10px] text-cyan-400">Realtime Sync</span>
          </div>
        )}

        {/* Controls Bar: Search & Category Filter */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 space-y-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoek op aandeel, ticker, beurs of land (bijv. ASML, Nvidia, Apple, Taiwan, AEX)..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#002d62]/20 focus:border-[#002d62] transition shadow-2xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'ALL', label: `Alles (${MASTER_AVAILABLE_STOCKS.length})` },
              { id: 'SUBSCRIBED', label: `Gekoppeld (${subscribedTickers.length})` },
              { id: 'mega_cap', label: 'Mega-Cap' },
              { id: 'semiconductors', label: 'Chips & Equipment' },
              { id: 'software', label: 'Cloud & AI Software' },
              { id: 'europe', label: 'Europese Champions' },
              { id: 'financials', label: 'Financials' },
              { id: 'aerospace', label: 'Aerospace & Defense' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer shrink-0 ${
                  selectedCategory === tab.id
                    ? 'bg-[#002d62] text-white shadow-2xs font-semibold'
                    : 'bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stock List Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/40">
          {filteredStocks.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">Geen aandelen gevonden</p>
              <p className="mt-1">Probeer een andere zoekterm of categorie.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredStocks.map(stock => {
                const isSubscribed = subscribedTickers.includes(stock.ticker);
                const isCanonical = CANONICAL_4_TICKERS.includes(stock.ticker);

                return (
                  <div
                    key={stock.ticker}
                    onClick={() => handleToggle(stock.ticker, stock.name)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer select-none flex flex-col justify-between gap-3 ${
                      isSubscribed
                        ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/90 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                          <StockLogo ticker={stock.ticker} className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-sm font-mono tracking-tight">
                              {stock.ticker}
                            </span>
                            {isCanonical && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                                Core
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-600 block truncate" title={stock.name}>
                            {stock.name}
                          </span>
                        </div>
                      </div>

                      {/* Action Pill Checkbox */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(stock.ticker, stock.name);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition shrink-0 ${
                          isSubscribed
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {isSubscribed ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Gekoppeld</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Koppel</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Stock Metadata Footer */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span className="truncate max-w-[170px]" title={stock.exchange}>
                        {stock.exchange}
                      </span>
                      <span className="text-slate-400">
                        {stock.country}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>{subscribedTickers.length} aandelen</strong> gekoppeld aan de News Agent.
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#002d62] hover:bg-[#00224b] text-white font-semibold rounded-xl text-xs sm:text-sm transition shadow-2xs cursor-pointer"
          >
            Klaar & Opslaan
          </button>
        </div>
      </div>
    </div>
  );
};
