import React, { useState, useMemo } from 'react';
import { ResearchConfig, AssetResearchConfig, CategoryThreshold } from '../types/marketResearch';
import { getDefaultResearchConfig } from '../services/marketResearchConfig';
import { StockLogo } from './StockLogo';
import { 
  X, 
  Sliders, 
  Clock, 
  Layers, 
  Check, 
  Search, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  Filter,
  ShieldAlert,
  Building2,
  TrendingUp,
  Cpu,
  Flame,
  Landmark,
  Percent
} from 'lucide-react';

interface ResearchConfigModalProps {
  config: ResearchConfig;
  onSave: (config: ResearchConfig) => Promise<void> | void;
  onClose: () => void;
}

export const ResearchConfigModal: React.FC<ResearchConfigModalProps> = ({
  config: initialConfig,
  onSave,
  onClose
}) => {
  const [config, setConfig] = useState<ResearchConfig>(() => ({
    ...getDefaultResearchConfig(),
    ...initialConfig,
    assets: { ...initialConfig.assets },
    categories: { ...initialConfig.categories }
  }));

  const [activeTab, setActiveTab] = useState<'securities' | 'categories' | 'scheduler'>('securities');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Group assets for clean organized listing
  const assetsList = useMemo(() => {
    return Object.values(config.assets || {}) as AssetResearchConfig[];
  }, [config.assets]);

  const categoriesList = useMemo(() => {
    return Object.values(config.categories || {}) as CategoryThreshold[];
  }, [config.categories]);

  // Group assets for clean organized listing
  const assetGroups = useMemo(() => {
    const groups: Record<string, AssetResearchConfig[]> = {};
    assetsList.forEach(asset => {
      const g = asset.assetClass || 'Overig';
      if (!groups[g]) groups[g] = [];
      groups[g].push(asset);
    });
    return groups;
  }, [assetsList]);

  const availableGroups = useMemo(() => {
    return Object.keys(assetGroups).sort();
  }, [assetGroups]);

  // Filter assets based on search query and selected group
  const filteredAssets = useMemo(() => {
    return assetsList.filter(asset => {
      if (selectedGroup !== 'ALL' && asset.assetClass !== selectedGroup) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          asset.symbol.toLowerCase().includes(q) ||
          asset.name.toLowerCase().includes(q) ||
          asset.assetClass.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [assetsList, selectedGroup, searchQuery]);

  // Toggle individual asset
  const handleToggleAsset = (symbol: string) => {
    setConfig(prev => ({
      ...prev,
      assets: {
        ...prev.assets,
        [symbol]: {
          ...prev.assets[symbol],
          enabled: !prev.assets[symbol]?.enabled
        }
      }
    }));
  };

  // Toggle all assets in current view
  const handleToggleAllVisible = (enable: boolean) => {
    setConfig(prev => {
      const nextAssets = { ...prev.assets };
      filteredAssets.forEach(a => {
        if (nextAssets[a.symbol]) {
          nextAssets[a.symbol] = { ...nextAssets[a.symbol], enabled: enable };
        }
      });
      return { ...prev, assets: nextAssets };
    });
  };

  // Update threshold for a category
  const handleUpdateCategoryThreshold = (categoryKey: string, newThreshold: number) => {
    if (isNaN(newThreshold) || newThreshold <= 0) return;
    setConfig(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [categoryKey]: {
          ...prev.categories[categoryKey],
          thresholdPct: newThreshold
        }
      }
    }));
  };

  // Change scheduler interval
  const handleSetSchedulerInterval = (interval: 5 | 10) => {
    setConfig(prev => ({
      ...prev,
      schedulerIntervalMin: interval,
      scheduler_interval_minutes: interval
    }));
  };

  // Reset to system defaults
  const handleResetDefaults = () => {
    if (window.confirm('Weet u zeker dat u alle configuraties wilt herstellen naar de officiële drempelwaarden?')) {
      setConfig(getDefaultResearchConfig());
    }
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(config);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Fout bij opslaan configuratie:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const totalEnabled = assetsList.filter(a => a?.enabled).length;
  const totalAssets = assetsList.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div 
        id="research-config-modal"
        className="bg-white border border-slate-300 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#002d62] text-white flex items-center justify-center shadow-xs">
              <Sliders className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 font-mono">
                  Deep Market Research Configuratie
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold font-mono">
                  {totalEnabled}/{totalAssets} Actief
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Beheer deterministische triggers, individuele effecten (RTX, LMT, BA) en monitor-frequentie
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 p-2 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 px-4 pt-2 gap-2 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('securities')}
            className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition cursor-pointer ${
              activeTab === 'securities'
                ? 'border-[#002d62] text-[#002d62] bg-white rounded-t-lg shadow-2xs font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Individuele Effecten & Activa ({totalEnabled})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition cursor-pointer ${
              activeTab === 'categories'
                ? 'border-[#002d62] text-[#002d62] bg-white rounded-t-lg shadow-2xs font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span>Categorie Drempelwaarden (±%)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scheduler')}
            className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition cursor-pointer ${
              activeTab === 'scheduler'
                ? 'border-[#002d62] text-[#002d62] bg-white rounded-t-lg shadow-2xs font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Scheduler Frequentie ({config.schedulerIntervalMin}m)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* TAB 1: Securities / Assets Toggle Controls */}
          {activeTab === 'securities' && (
            <div className="space-y-4">
              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Zoek op ticker (RTX, LMT, BA) of naam..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedGroup}
                    onChange={e => setSelectedGroup(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">Alle Groepen ({availableGroups.length})</option>
                    {availableGroups.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleToggleAllVisible(true)}
                    className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-blue-50 text-[#002d62] hover:bg-blue-100 transition cursor-pointer"
                  >
                    Alles Aan
                  </button>
                  <button
                    onClick={() => handleToggleAllVisible(false)}
                    className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                  >
                    Alles Uit
                  </button>
                </div>
              </div>

              {/* Securities List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredAssets.map(asset => {
                  const isEnabled = asset.enabled;
                  const cat = config.categories[asset.categoryKey];
                  const threshold = cat ? `±${cat.thresholdPct}%` : '±4%';

                  return (
                    <div
                      key={asset.symbol}
                      onClick={() => handleToggleAsset(asset.symbol)}
                      className={`p-3 rounded-xl border transition flex items-center justify-between cursor-pointer select-none ${
                        isEnabled
                          ? 'bg-blue-50/50 border-blue-200 hover:border-blue-400'
                          : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center p-1 shrink-0 shadow-2xs">
                          {asset.symbol.length <= 5 && !asset.symbol.includes('^') ? (
                            <StockLogo ticker={asset.symbol} className="w-6 h-6 object-contain" />
                          ) : (
                            <Building2 className="w-4 h-4 text-slate-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900">
                              {asset.symbol}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                              {threshold}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 truncate max-w-[190px]">
                            {asset.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          isEnabled
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {isEnabled ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Category Threshold Values */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 leading-relaxed">
                <strong>Deterministische drempelarchitectuur:</strong> De Market Monitor gebruikt deze minimum-bewegingspercentages voordat de Gemini 3.8 Flash Deep Research Agent wordt ingeschakeld.
              </div>

              <div className="space-y-3">
                {categoriesList.map(cat => (
                  <div 
                    key={cat.key}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-900 font-mono">
                        {cat.label}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-snug max-w-md">
                        {cat.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono text-slate-500">±</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="20"
                        value={cat.thresholdPct}
                        onChange={e => handleUpdateCategoryThreshold(cat.key, parseFloat(e.target.value))}
                        className="w-16 px-2 py-1 text-xs font-mono font-bold text-center bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-xs font-mono font-bold text-slate-700">
                        {cat.key === 'global_rates' ? 'bps' : '%'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Scheduler Frequency Settings */}
          {activeTab === 'scheduler' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase font-mono">
                  Market Monitor Wekinterval
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  De Market Monitor ontwaakt autonoom via de achtergrond-scheduler, verifieert actuele koersdata tegen de drempelwaarden, en roept de Deep Research Agent uitsluitend aan bij gekwalificeerde nieuwe gebeurtenissen.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => handleSetSchedulerInterval(5)}
                  className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                    config.schedulerIntervalMin === 5
                      ? 'border-[#002d62] bg-blue-50/50 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900 font-mono">
                        Elke 5 Minuten
                      </span>
                      {config.schedulerIntervalMin === 5 && (
                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Aanbevolen voor actieve beurssessies (US Open en Europa sluiting).
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/80 text-[11px] font-mono text-blue-900 font-semibold">
                    12 scans per uur
                  </div>
                </div>

                <div
                  onClick={() => handleSetSchedulerInterval(10)}
                  className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                    config.schedulerIntervalMin === 10
                      ? 'border-[#002d62] bg-blue-50/50 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900 font-mono">
                        Elke 10 Minuten
                      </span>
                      {config.schedulerIntervalMin === 10 && (
                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Efficiënte modus voor rustige marktomstandigheden en pre-market.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/80 text-[11px] font-mono text-slate-700 font-semibold">
                    6 scans per uur
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            onClick={handleResetDefaults}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Herstel Standaardwaarden</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
            >
              Annuleren
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              type="button"
              className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                savedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#002d62] hover:bg-[#001f44] text-white'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Opgeslagen!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Opslaan...' : 'Configuratie Toepassen'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
