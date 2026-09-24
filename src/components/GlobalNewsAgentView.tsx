import React, { useState, useEffect, useMemo } from 'react';
import { 
  MarketNewsItem, 
  NewsEdition, 
  NewsCategory, 
  NewsSentiment, 
  NewsImpact,
  NewsAgentStatus 
} from '../types/marketNews';
import { fetchNewsTimeline, triggerAgentRun, fetchAgentStatus } from '../services/marketNewsAgentService';
import { detectNewsAsset, DetectedAsset } from '../utils/newsAssetDetector';
import { StockLogo } from './StockLogo';
import { 
  Globe, 
  RefreshCw, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Calendar,
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Cpu, 
  Building2, 
  Landmark, 
  Sparkles,
  SlidersHorizontal,
  Bell,
  Check,
  ShieldCheck,
  ChevronRight,
  Flame
} from 'lucide-react';

interface GlobalNewsAgentViewProps {
  subscribedTickers: string[];
  onToggleSubscription?: (ticker: string) => void;
  onSelectTicker?: (ticker: string) => void;
  onNavigateToAsset?: (target: { type: 'equity' | 'commodity' | 'bond'; symbol: string; targetId?: string }) => void;
}

export function GlobalNewsAgentView({
  subscribedTickers,
  onToggleSubscription,
  onSelectTicker,
  onNavigateToAsset
}: GlobalNewsAgentViewProps) {
  // State
  const [items, setItems] = useState<MarketNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTriggering, setIsTriggering] = useState<boolean>(false);
  const [triggerMessage, setTriggerMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<NewsAgentStatus | null>(null);

  // Filters
  const [selectedEdition, setSelectedEdition] = useState<NewsEdition | 'ALL'>('ALL');
  const [selectedStream, setSelectedStream] = useState<'all' | 'macro' | 'earnings' | 'companies'>('all');
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | 'ALL'>('ALL');
  const [selectedSentiment, setSelectedSentiment] = useState<NewsSentiment | 'ALL'>('ALL');
  const [selectedImpact, setSelectedImpact] = useState<NewsImpact | 'ALL'>('ALL');
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Load news timeline & agent status
  const loadData = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      const [newsData, agentStatus] = await Promise.all([
        fetchNewsTimeline({
          edition: selectedEdition !== 'ALL' ? selectedEdition : undefined,
          stream: selectedStream !== 'all' ? selectedStream : undefined,
          category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
          ticker: selectedTicker || undefined,
          sentiment: selectedSentiment !== 'ALL' ? selectedSentiment : undefined,
          impact: selectedImpact !== 'ALL' ? selectedImpact : undefined
        }),
        fetchAgentStatus()
      ]);
      setItems(newsData);
      setStatus(agentStatus);
    } catch (err) {
      console.error('Fout bij het laden van het marktnieuws:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedEdition, selectedStream, selectedCategory, selectedSentiment, selectedImpact, selectedTicker]);

  // Handle manual trigger run
  const handleRunAgent = async () => {
    setIsTriggering(true);
    setTriggerMessage('Gemini 3.8 Flash activeert Medium Thinking en doorzoekt realtime bronnen via Google Search...');
    try {
      const targetEdition = selectedEdition !== 'ALL' ? selectedEdition : undefined;
      const res = await triggerAgentRun(targetEdition, subscribedTickers);
      if (res.success) {
        setTriggerMessage(`Cyclus succesvol afgerond: ${res.inserted || 0} actuele nieuwsfeiten geverifieerd en opgeslagen.`);
        await loadData(true);
        setTimeout(() => setTriggerMessage(null), 5000);
      } else {
        setTriggerMessage(`Let op: ${res.error || 'Er kon geen live verbinding worden gemaakt.'}`);
        setTimeout(() => setTriggerMessage(null), 6000);
      }
    } catch (err: any) {
      setTriggerMessage(`Fout tijdens uitvoering: ${err.message || 'Onbekende fout'}`);
      setTimeout(() => setTriggerMessage(null), 5000);
    } finally {
      setIsTriggering(false);
    }
  };

  // Filter items in memory based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(i => 
      i.headline.toLowerCase().includes(q) ||
      i.summary.toLowerCase().includes(q) ||
      i.fact.toLowerCase().includes(q) ||
      (i.company && i.company.toLowerCase().includes(q)) ||
      (i.ticker && i.ticker.toLowerCase().includes(q)) ||
      (i.analyst_interpretation && i.analyst_interpretation.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  // Available tickers in current results for quick-select
  const availableTickers = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => {
      if (i.ticker) set.add(i.ticker.toUpperCase());
    });
    return Array.from(set);
  }, [items]);

  // Helpers
  const formatEditionLabel = (ed: NewsEdition) => {
    switch (ed) {
      case 'ASIA_OPEN': return 'Asia Open (02:30 CET)';
      case 'MORNING_EUROPE': return 'Ochtend Europa (07:00 CET)';
      case 'US_OPEN': return 'US Market Open (15:30 CET)';
      case 'MARKET_CLOSE': return 'Beursafsluiting (21:30 CET)';
      default: return ed;
    }
  };

  const getCategoryLabel = (cat: NewsCategory) => {
    switch (cat) {
      case 'MACRO': return 'Macro-economie';
      case 'CENTRAL_BANK': return 'Centrale Bank & Rente';
      case 'ECONOMIC_DATA': return 'Economische Data & Inflatie';
      case 'EARNINGS': return 'Kwartaalcijfers & Guidance';
      case 'EQUITY': return 'Bedrijfsnieuws & Tech';
      case 'M&A': return 'Fusies & Overnames';
      case 'REGULATION': return 'Regelgeving & Toezicht';
      case 'GEOPOLITICS': return 'Geopolitiek';
      case 'COMMODITIES': return 'Grondstoffen & Energie';
      default: return cat;
    }
  };

  const formatNewsDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      
      const timeFormatted = new Intl.DateTimeFormat('nl-NL', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Amsterdam'
      }).format(d);
      
      if (isToday) {
        return `Vandaag om ${timeFormatted} CET`;
      }
      
      const dateFormatted = new Intl.DateTimeFormat('nl-NL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Europe/Amsterdam'
      }).format(d);
      
      return `${dateFormatted} om ${timeFormatted} CET`;
    } catch {
      return dateStr;
    }
  };

  const handleAssetClick = (asset: DetectedAsset) => {
    if (onNavigateToAsset) {
      onNavigateToAsset({
        type: asset.type,
        symbol: asset.symbol,
        targetId: asset.targetId
      });
    } else if (onSelectTicker) {
      onSelectTicker(asset.symbol);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Agent Protocol Banner */}
      <div className="bg-gradient-to-r from-[#002d62] via-[#051c2c] to-[#0a2540] text-white rounded-2xl p-6 lg:p-8 shadow-sm border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>AUTONOMOUS MARKETS INTELLIGENCE</span>
              <span aria-hidden="true">·</span>
              <span>GEMINI 3.8 FLASH</span>
              <span aria-hidden="true">·</span>
              <span>MEDIUM THINKING</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold tracking-tight text-white">
              Global News Agent
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Feitelijk geverifieerde marktberichten op basis van institutionele bronnen (Financial Times, Bloomberg, Reuters, CNBC). Automatisch getriggerd op de 4 vaste beurstijdstippen met Google Search Grounding en een temperatuur van 0.1 voor nul hallucinaties.
            </p>
          </div>

          {/* Trigger Button & Status Cluster */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleRunAgent}
              disabled={isTriggering}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition shadow-sm cursor-pointer ${
                isTriggering
                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 cursor-wait'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isTriggering ? 'animate-spin' : ''}`} />
              <span>{isTriggering ? 'Agent Analyseren...' : 'Run Agent Nu'}</span>
            </button>
            <button
              onClick={() => loadData(true)}
              title="Vernieuw actuele tijdlijn"
              className="p-3 bg-white/10 hover:bg-white/15 text-white rounded-xl transition border border-white/10 flex items-center justify-center cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Notification Feedback if Running */}
        {triggerMessage && (
          <div className="mt-4 p-3 bg-cyan-950/80 border border-cyan-800 text-cyan-200 text-xs rounded-xl flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{triggerMessage}</span>
          </div>
        )}

        {/* System Invariant Specs Strip */}
        <div className="mt-6 pt-5 border-t border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Gekozen Model</span>
            <span className="font-semibold text-white font-mono">gemini-3.8-flash</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Thinking Config</span>
            <span className="font-semibold text-white font-mono">MEDIUM (Reasoning)</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Temperatuur</span>
            <span className="font-semibold text-white font-mono">0.1 (Feitelijk)</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Volgende Wekker</span>
            <span className="font-semibold text-cyan-300 font-mono">
              {status?.nextScheduledTime || '15:30 CET (US Open)'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Control & Stream Navigation Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        {/* Edition Selector Segmented Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider mr-2 text-[10px]">
              Editie:
            </span>
            {[
              { id: 'ALL', label: 'Alle Edities' },
              { id: 'ASIA_OPEN', label: 'Asia Open (02:30)' },
              { id: 'MORNING_EUROPE', label: 'Ochtend Europa (07:00)' },
              { id: 'US_OPEN', label: 'US Open (15:30)' },
              { id: 'MARKET_CLOSE', label: 'Beursafsluiting (21:30)' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedEdition(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer shrink-0 ${
                  selectedEdition === tab.id
                    ? 'bg-[#002d62] text-white shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Connected Tickers Counter */}
          <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
            <Bell className="w-3.5 h-3.5 text-blue-600" />
            <span>Gekoppelde app-alerts:</span>
            <strong className="text-slate-900 font-mono">
              {subscribedTickers.length > 0 ? subscribedTickers.join(', ') : 'Standaard watchlist'}
            </strong>
          </div>
        </div>

        {/* Tri-Stream Selector (Macro, Earnings, Companies) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setSelectedStream('all')}
              className={`px-3 py-1.5 rounded-lg transition font-medium cursor-pointer ${
                selectedStream === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Alle Berichten ({items.length})
            </button>
            <button
              onClick={() => setSelectedStream('macro')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition font-medium cursor-pointer ${
                selectedStream === 'macro'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Landmark className="w-3.5 h-3.5 text-blue-600" />
              <span>Macro & Centrale Banken</span>
            </button>
            <button
              onClick={() => setSelectedStream('earnings')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition font-medium cursor-pointer ${
                selectedStream === 'earnings'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Earnings Intelligence</span>
            </button>
            <button
              onClick={() => setSelectedStream('companies')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition font-medium cursor-pointer ${
                selectedStream === 'companies'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Watchlist & M&A</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Zoek in feiten en nieuws..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filter Row: Category, Sentiment, Impact & Tickers */}
        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
          <span className="text-slate-400 text-[11px] font-medium mr-1">Filters:</span>

          {/* Categorie Filter (alle 9 individuele categorieën) */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value as any);
              if (e.target.value !== 'ALL') {
                setSelectedStream('all');
              }
            }}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none"
          >
            <option value="ALL">Categorie: Alle (9)</option>
            <option value="MACRO">Macro-economie</option>
            <option value="CENTRAL_BANK">Centrale Bank & Rente</option>
            <option value="ECONOMIC_DATA">Economische Data (CPI/PPI)</option>
            <option value="EARNINGS">Kwartaalcijfers & Guidance</option>
            <option value="EQUITY">Bedrijfsnieuws & Tech</option>
            <option value="M&A">Fusies & Overnames (M&A)</option>
            <option value="REGULATION">Regelgeving & Toezicht</option>
            <option value="GEOPOLITICS">Geopolitiek</option>
            <option value="COMMODITIES">Grondstoffen & Energie</option>
          </select>

          {/* Sentiment */}
          <select
            value={selectedSentiment}
            onChange={(e) => setSelectedSentiment(e.target.value as any)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none"
          >
            <option value="ALL">Sentiment: Alle</option>
            <option value="BULLISH">Bullish</option>
            <option value="BEARISH">Bearish</option>
            <option value="NEUTRAL">Neutraal</option>
          </select>

          {/* Impact */}
          <select
            value={selectedImpact}
            onChange={(e) => setSelectedImpact(e.target.value as any)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none"
          >
            <option value="ALL">Impact: Alle</option>
            <option value="HIGH">Hoge Impact</option>
            <option value="MEDIUM">Medium Impact</option>
            <option value="LOW">Lage Impact</option>
          </select>

          {/* Quick Ticker Chips */}
          <div className="flex flex-wrap items-center gap-1.5 ml-auto">
            {selectedTicker && (
              <button
                onClick={() => setSelectedTicker(null)}
                className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition text-[11px] font-bold"
              >
                Reset ({selectedTicker}) ✕
              </button>
            )}
            {availableTickers.map(tk => (
              <button
                key={tk}
                onClick={() => setSelectedTicker(selectedTicker === tk ? null : tk)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition cursor-pointer ${
                  selectedTicker === tk
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tk}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. News Feed Stream */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">Tijdlijn ophalen...</h3>
          <p className="text-xs text-slate-500 mt-1">Geverifieerde edities worden geladen</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <Globe className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">Geen berichten gevonden voor deze selectie</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Pas de filters aan of klik op "Run Agent Nu" om direct een nieuwe analysecyclus te starten met Gemini 3.8 Flash.
          </p>
          <button
            onClick={() => {
              setSelectedEdition('ALL');
              setSelectedStream('all');
              setSelectedSentiment('ALL');
              setSelectedImpact('ALL');
              setSelectedTicker(null);
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            Filters herstellen
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item, idx) => {
            const isExpanded = expandedItemId === item.id || expandedItemId === item.event_id;
            const sentimentColor = 
              item.sentiment === 'BULLISH' ? 'text-emerald-700' :
              item.sentiment === 'BEARISH' ? 'text-rose-700' : 'text-slate-600';
            
            const sentimentBg = 
              item.sentiment === 'BULLISH' ? 'bg-emerald-50 border-emerald-200' :
              item.sentiment === 'BEARISH' ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200';

            const detectedAsset = detectNewsAsset(item);
            const isSubscribed = detectedAsset?.type === 'equity' 
              ? subscribedTickers.includes(detectedAsset.symbol.toUpperCase()) 
              : item.ticker ? subscribedTickers.includes(item.ticker.toUpperCase()) : false;

            return (
              <article
                key={item.id || item.event_id || idx}
                className="bg-white rounded-2xl border border-slate-200 p-5 lg:p-6 shadow-xs hover:border-slate-300 transition"
              >
                {/* Clean Metadata Line (Zero-Pill Discipline) */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pb-2 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-800">
                      {formatEditionLabel(item.edition)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1 text-slate-700 font-mono text-[11px] font-medium bg-slate-100/90 px-2 py-0.5 rounded border border-slate-200">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{formatNewsDateTime(item.published_at || item.edition_at)}</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{getCategoryLabel(item.category)}</span>
                    {detectedAsset && (
                      <>
                        <span aria-hidden="true">·</span>
                        <button
                          onClick={() => handleAssetClick(detectedAsset)}
                          className={`inline-flex items-center gap-1.5 font-mono font-bold text-xs px-2 py-0.5 rounded cursor-pointer transition border shadow-2xs ${
                            detectedAsset.type === 'commodity'
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                              : detectedAsset.type === 'bond'
                              ? 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-300'
                              : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-200'
                          }`}
                          title={
                            detectedAsset.type === 'commodity'
                              ? `Open ${detectedAsset.symbol} (${detectedAsset.name}) in Commodities Desk`
                              : detectedAsset.type === 'bond'
                              ? `Open ${detectedAsset.symbol} (${detectedAsset.name}) in Treasury & Sovereign Bond Desk`
                              : `Bekijk ${detectedAsset.symbol} consensus & analistenoutlook`
                          }
                        >
                          {detectedAsset.type === 'commodity' && (
                            <Flame className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          )}
                          {detectedAsset.type === 'bond' && (
                            <Landmark className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          )}
                          {detectedAsset.type === 'equity' && (
                            <StockLogo ticker={detectedAsset.symbol} size="xs" />
                          )}
                          <span className="tracking-tight">{detectedAsset.symbol}</span>
                        </button>
                      </>
                    )}
                    {item.company && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-700">{item.company}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <span className={`font-bold ${sentimentColor}`}>
                      {item.sentiment}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-slate-600">
                      Impact {item.impact_score}/100
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Geverifieerd</span>
                    </span>
                  </div>
                </div>

                {/* Primary Headline */}
                <h2 className="text-lg lg:text-xl font-serif font-bold text-slate-900 mt-3 leading-snug">
                  {item.headline}
                </h2>

                {/* Summary */}
                <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                  {item.summary}
                </p>

                {/* Feitelijk Kernfeit Highlight Box */}
                <div className="mt-4 p-3.5 bg-slate-50/90 rounded-xl border-l-4 border-blue-600 text-xs">
                  <span className="font-bold text-blue-900 uppercase tracking-wide text-[10px] block mb-1">
                    Geverifieerd Kernfeit:
                  </span>
                  <p className="text-slate-800 font-medium leading-normal">
                    {item.fact}
                  </p>
                </div>

                {/* Expanded Details: Market Reaction & Analyst Take */}
                {(item.market_reaction || item.analyst_interpretation) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100 text-xs">
                    {item.market_reaction && (
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <span className="font-semibold text-slate-700 block mb-0.5">
                          Marktreactie:
                        </span>
                        <span className="text-slate-600">{item.market_reaction}</span>
                      </div>
                    )}
                    {item.analyst_interpretation && (
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <span className="font-semibold text-slate-700 block mb-0.5">
                          Analistenvisie:
                        </span>
                        <span className="text-slate-600">{item.analyst_interpretation}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Sources and Quick Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
                  {/* Sources */}
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="text-slate-400">Bron:</span>
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-slate-800 hover:text-blue-600 flex items-center gap-1 underline underline-offset-2"
                    >
                      <span>{item.source_name}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>

                    {item.supporting_sources && item.supporting_sources.length > 0 && (
                      <span className="text-slate-400 text-[11px]">
                        (+{item.supporting_sources.length} geverifieerde secundaire bronnen)
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    {detectedAsset?.type === 'equity' && onToggleSubscription && (
                      <button
                        onClick={() => onToggleSubscription(detectedAsset.symbol)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                          isSubscribed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>{isSubscribed ? 'Melding Actief' : `Volg ${detectedAsset.symbol}`}</span>
                      </button>
                    )}
                    {detectedAsset ? (
                      <button
                        onClick={() => handleAssetClick(detectedAsset)}
                        className={`flex items-center gap-1 font-semibold cursor-pointer text-xs transition hover:underline ${
                          detectedAsset.type === 'commodity'
                            ? 'text-amber-800'
                            : detectedAsset.type === 'bond'
                            ? 'text-purple-800'
                            : 'text-blue-700'
                        }`}
                      >
                        <span>
                          {detectedAsset.type === 'commodity'
                            ? `Open in Commodities Desk (${detectedAsset.symbol})`
                            : detectedAsset.type === 'bond'
                            ? `Open in Sovereign Bond Desk (${detectedAsset.symbol})`
                            : `Bekijk consensus (${detectedAsset.symbol})`}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : item.ticker && onSelectTicker ? (
                      <button
                        onClick={() => onSelectTicker(item.ticker!)}
                        className="text-blue-600 hover:underline flex items-center gap-1 font-medium cursor-pointer text-xs"
                      >
                        <span>Bekijk consensus</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
