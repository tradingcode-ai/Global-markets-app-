import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  QuarterlyResult, 
  AlertPreferences, 
  PushNotificationItem,
  LiveQuote
} from './types';
import { 
  INITIAL_EARNINGS_RESULTS, 
  INITIAL_PUSH_NOTIFICATIONS, 
  TECH_COMPANIES 
} from './data/earningsData';
import { SHOVEL_SELLERS_COMPANIES } from './data/shovelSellersData';
import { HYPERSCALER_COMPANIES, HYPERSCALER_TICKERS } from './data/hyperscalersData';
import { 
  getStoredPreferences, 
  savePreferences, 
  getStoredNotifications, 
  saveNotifications, 
  requestBrowserPushPermission, 
  dispatchPushNotification, 
  playCorporateChime 
} from './services/notificationService';
import { fetchLiveMarketQuotes, fetchLiveEarningsCalendar, fetchQuarterlyAnalystOutlook } from './services/marketDataService';
import { CorporateHeader } from './components/CorporateHeader';
import { RealTimeTrackerBar } from './components/RealTimeTrackerBar';
import { MetricCards } from './components/MetricCards';
import { EarningsTableView } from './components/EarningsTableView';
import { EarningsCalendarView } from './components/EarningsCalendarView';
import { CompanyDetailModal } from './components/CompanyDetailModal';
import { SimulateReleaseModal } from './components/SimulateReleaseModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { AlertSettingsModal } from './components/AlertSettingsModal';
import { LivePushToast } from './components/LivePushToast';
import { CommoditiesSection } from './components/CommoditiesSection';
import { BondsSection } from './components/BondsSection';
import { JPMorganTableView } from './components/JPMorganTableView';
import { McKinseyExecutiveView } from './components/McKinseyExecutiveView';
import { FloatingAdvisoryBubble } from './components/FloatingAdvisoryBubble';
import { 
  LayoutGrid, 
  Calendar, 
  Sparkles, 
  Bell, 
  Zap, 
  Radio,
  Fuel,
  Menu,
  Layers,
  BookOpen,
  Landmark
} from 'lucide-react';

export default function App() {
  const [results, setResults] = useState<QuarterlyResult[]>(() => INITIAL_EARNINGS_RESULTS.map(item => HYPERSCALER_TICKERS.has(item.ticker) ? { ...item, sector: 'Hyperscalers & Neo Clouds', subSector: item.subSector || (['GOOGL','MSFT','AMZN','ORCL','META'].includes(item.ticker) ? 'Hyperscalers' : 'Neo Clouds') } : item));
  const [quarterlyOutlookLoaded, setQuarterlyOutlookLoaded] = useState(false);
  const [quarterlySnapshots, setQuarterlySnapshots] = useState<Record<string, any>>({});

  const [notifications, setNotifications] = useState<PushNotificationItem[]>(() => {
    const stored = getStoredNotifications();
    return stored.length > 0 ? stored : INITIAL_PUSH_NOTIFICATIONS;
  });
  const [preferences, setPreferences] = useState<AlertPreferences>(getStoredPreferences);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');
  
  // Real-Time Stock Market Quotes State
  const [quotes, setQuotes] = useState<Record<string, LiveQuote>>({});
  const [isQuotesLoading, setIsQuotesLoading] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [lastQuotesUpdated, setLastQuotesUpdated] = useState<Date | null>(null);
  const [recentTicks, setRecentTicks] = useState<Record<string, 'up' | 'down'>>({});
  const prevQuotesRef = useRef<Record<string, LiveQuote>>({});

  // UI State
  const [activeTab, setActiveTab] = useState<'jpmorgan' | 'bonds' | 'matrix' | 'calendar' | 'commodities' | 'mckinsey'>('jpmorgan');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  
  // Modals
  const [selectedResultForModal, setSelectedResultForModal] = useState<QuarterlyResult | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [activeToast, setActiveToast] = useState<PushNotificationItem | null>(null);

  // Quarterly analyst/consensus snapshots are intentionally not refreshed continuously.
  // A new snapshot is eligible on 25 Mar/Jun/Sep/Dec; live market quotes remain live.
  const getQuarterSnapshotKey = useCallback((date = new Date()) => {
    const month = date.getMonth();
    const day = date.getDate();
    let year = date.getFullYear();
    let quarter = Math.floor(month / 3) + 1;
    if (month % 3 === 2 && day >= 25) {
      quarter += 1;
      if (quarter === 5) { quarter = 1; year += 1; }
    }
    return `${year}-Q${quarter}`;
  }, []);

  const applyQuarterlySnapshot = useCallback((snapshot: Record<string, any>) => {
    setQuarterlySnapshots(snapshot);
    setResults(prev => prev.map(item => {
      const snap = snapshot[item.ticker];
      if (!snap) return item;
      const outlooks = (snap.outlooks || []).slice(0, 3).map((o: any) => ({
        bankName: o.bankName,
        logoColor: 'text-blue-800 bg-blue-50 border-blue-200',
        targetPrice: o.targetPrice !== undefined
          ? `${snap.targetCurrency || ''}${Number(o.targetPrice).toFixed(2)}`.trim()
          : '—',
        targetPriceNumeric: o.targetPrice || 0,
        timeHorizon: snap.nextQuarterLabel || 'Next Quarter',
        rating: o.rating || 'N/A',
        nextQuarterEpsEst: snap.nextQuarterEps !== undefined ? `${snap.nextQuarterEps.toFixed(2)}` : '—',
        nextQuarterRevEst: snap.nextQuarterRevenue !== undefined ? `${snap.nextQuarterRevenue.toFixed(2)}B` : '—',
        thesis: `Quarterly Yahoo Finance analyst snapshot. Research date: ${o.asOfDate || 'N/A'}.`,
        catalysts: [],
        lastUpdated: o.asOfDate || snap.snapshotDate
      }));
      return {
        ...item,
        analystOutlooks: outlooks.length > 0 ? outlooks : item.analystOutlooks,
        quarterlyConsensus: snap
      };
    }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadQuarterlySnapshot = async () => {
      const snapshotKey = getQuarterSnapshotKey();
      const storageKey = `global_markets_quarterly_snapshot_${snapshotKey}`;
      try {
        const storedRaw = localStorage.getItem(storageKey);
        if (storedRaw) {
          const stored = JSON.parse(storedRaw);
          if (!cancelled && stored?.data) {
            applyQuarterlySnapshot(stored.data);
            setQuarterlyOutlookLoaded(true);
            return;
          }
        }
        const allSymbols = Array.from(new Set([
          ...INITIAL_EARNINGS_RESULTS.map(r => r.ticker),
          ...Object.keys(TECH_COMPANIES),
          ...Object.keys(SHOVEL_SELLERS_COMPANIES),
          ...Object.keys(HYPERSCALER_COMPANIES)
        ]));
        const response = await fetchQuarterlyAnalystOutlook(allSymbols);
        if (cancelled || !response?.data) return;
        localStorage.setItem(storageKey, JSON.stringify({ quarterKey: snapshotKey, savedAt: new Date().toISOString(), provider: response.provider, data: response.data }));
        applyQuarterlySnapshot(response.data);
        const notification: PushNotificationItem = {
          id: `quarterly-outlook-${snapshotKey}`,
          ticker: 'MARKET',
          companyName: 'Global Markets',
          title: `Quarterly Analyst & Earnings Update — ${snapshotKey}`,
          body: `Analyst outlooks, consensus targets and next-quarter earnings estimates have been refreshed for ${snapshotKey}.`,
          timestamp: 'Just now', type: 'breaking', read: false
        };
        const existing = getStoredNotifications();
        if (!existing.some(n => n.id === notification.id)) {
          const updated = [notification, ...existing];
          saveNotifications(updated);
          if (!cancelled) {
            setNotifications(updated);
            setActiveToast(notification);
            if (preferences.soundEnabled) playCorporateChime();
          }
        }
        if (!cancelled) setQuarterlyOutlookLoaded(true);
      } catch (error) {
        console.warn('Quarterly analyst snapshot could not be loaded:', error);
      }
    };
    loadQuarterlySnapshot();
    return () => { cancelled = true; };
  }, [applyQuarterlySnapshot, getQuarterSnapshotKey, preferences.soundEnabled]);

  // Sync notification permission state
  useEffect(() => {
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  // Poll Real-Time Market Quotes
  const loadMarketQuotes = useCallback(async (isManual: boolean = false) => {
    if (isManual) setIsQuotesLoading(true);
    try {
      const liveData = await fetchLiveMarketQuotes();
      if (liveData && Object.keys(liveData).length > 0) {
        // Compute price tick movement for flash visual feedback
        const newTicks: Record<string, 'up' | 'down'> = {};
        for (const [sym, quote] of Object.entries(liveData)) {
          const prev = prevQuotesRef.current[sym];
          if (prev && quote.price !== prev.price) {
            newTicks[sym] = quote.price > prev.price ? 'up' : 'down';
          }
        }

        if (Object.keys(newTicks).length > 0) {
          setRecentTicks(newTicks);
          setTimeout(() => setRecentTicks({}), 2000);
        }

        prevQuotesRef.current = liveData;
        setQuotes(liveData);
        setLastQuotesUpdated(new Date());
      }
    } catch (err) {
      console.warn('Could not fetch market quotes:', err);
    } finally {
      if (isManual) setIsQuotesLoading(false);
    }
  }, []);

  // Fetch Live Real-Time Earnings Reporting Dates from Yahoo Finance & SEC EDGAR Keyless Feeds
  const loadEarningsCalendar = useCallback(async () => {
    try {
      const calData = await fetchLiveEarningsCalendar();
      if (calData && Object.keys(calData).length > 0) {
        setResults(prevResults => prevResults.map(r => {
          const live = calData[r.ticker] || calData[r.ticker.toUpperCase()];
          if (live) {
            return {
              ...r,
              reportDate: live.reportDate || r.reportDate,
              reportTime: live.reportTime || r.reportTime,
              isDateConfirmed: live.isConfirmed,
              liveDateProvider: live.provider,
              epsEstimate: live.epsEstimate ?? r.epsEstimate,
              revenueEstimate: live.revenueEstimate ?? r.revenueEstimate
            };
          }
          return r;
        }));
      }
    } catch (err) {
      console.warn('Could not sync live earnings calendar:', err);
    }
  }, []);

  // Initial fetch and 8-second interval polling
  useEffect(() => {
    loadMarketQuotes(true);
    loadEarningsCalendar();
  }, [loadMarketQuotes, loadEarningsCalendar]);

  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      loadMarketQuotes(false);
    }, 8000);
    return () => clearInterval(interval);
  }, [isStreaming, loadMarketQuotes]);

  // Persist preferences
  const handleUpdatePreferences = (newPrefs: AlertPreferences) => {
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  // Persist notifications
  const handleSaveNotifications = (newNotifs: PushNotificationItem[]) => {
    setNotifications(newNotifs);
    saveNotifications(newNotifs);
  };

  const handleRequestBrowserPermission = async () => {
    const perm = await requestBrowserPushPermission();
    setBrowserPermission(perm);
    if (perm === 'granted') {
      const updated = { ...preferences, browserNotificationsEnabled: true };
      handleUpdatePreferences(updated);
      playCorporateChime();
    }
  };

  const handleToggleSubscription = (ticker: string) => {
    let nextList = [...preferences.subscribedTickers];
    if (nextList.includes(ticker)) {
      nextList = nextList.filter(t => t !== ticker);
    } else {
      nextList.push(ticker);
    }
    handleUpdatePreferences({
      ...preferences,
      subscribedTickers: nextList
    });
  };

  // Execute Live Simulation
  const handleExecuteSimulation = (scenario: {
    ticker: string;
    scenarioType: 'beat' | 'miss' | 'breaking' | 'guidance';
    customTitle?: string;
    customBody?: string;
    updatedResult: Partial<QuarterlyResult>;
  }) => {
    setResults(prev => prev.map(item => {
      if (item.ticker === scenario.ticker) {
        return {
          ...item,
          ...scenario.updatedResult
        };
      }
      return item;
    }));

    const company = TECH_COMPANIES[scenario.ticker];
    dispatchPushNotification(
      {
        ticker: scenario.ticker,
        companyName: company?.name || scenario.ticker,
        title: scenario.customTitle || `${scenario.ticker} Q3 Results Released`,
        body: scenario.customBody || `${scenario.ticker} reported quarterly earnings. Check the institutional matrix for full numbers.`,
        type: scenario.scenarioType,
        metrics: {
          epsActual: scenario.updatedResult.epsActual,
          epsEstimate: scenario.updatedResult.epsEstimate,
          revenueActual: scenario.updatedResult.revenueActual,
          revenueEstimate: scenario.updatedResult.revenueEstimate,
          priceMove: scenario.updatedResult.priceReactionPercent
        }
      },
      preferences,
      (newNotif) => {
        handleSaveNotifications([newNotif, ...notifications]);
        setActiveToast(newNotif);
      }
    );
  };

  // Trigger test push from detail modal
  const handleTriggerTestPush = (target: QuarterlyResult) => {
    const isBeat = (target.epsActual ?? 0) >= target.epsEstimate;
    dispatchPushNotification(
      {
        ticker: target.ticker,
        companyName: target.companyName,
        title: `[TEST PUSH] ${target.ticker} ${target.quarter}: ${isBeat ? 'EPS BEAT' : 'CONSENSUS UPDATE'}`,
        body: `${target.ticker} reported EPS of $${target.epsActual?.toFixed(2) || target.epsEstimate.toFixed(2)} and revenue of $${target.revenueActual?.toFixed(2) || target.revenueEstimate.toFixed(2)}B. Guidance: ${target.guidanceRating.toUpperCase()}.`,
        type: isBeat ? 'beat' : 'guidance',
        metrics: {
          epsActual: target.epsActual,
          epsEstimate: target.epsEstimate,
          revenueActual: target.revenueActual,
          revenueEstimate: target.revenueEstimate,
          priceMove: target.priceReactionPercent
        }
      },
      preferences,
      (newNotif) => {
        handleSaveNotifications([newNotif, ...notifications]);
        setActiveToast(newNotif);
      }
    );
  };

  const handleMarkAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    handleSaveNotifications(updated);
  };

  const handleClearNotifications = () => {
    handleSaveNotifications([]);
  };

  const handleSelectTickerFromPill = (sym: string) => {
    const commoditySymbols = [
      'TTF', 'NG', 'JKM', 'WTI', 'BRENT', 'MURBAN', 'INE-SC',
      'RBOB', 'HO', 'GOLD', 'SILVER', 'COPPER', 'URANIUM', 'LITHIUM', 'WHEAT', 'CORN'
    ];
    if (commoditySymbols.includes(sym)) {
      setActiveTab('commodities');
      return;
    }
    const bondSymbols = ['US10Y', 'US2Y', 'US30Y', 'DE10Y', 'DE30Y', 'GB10Y', 'FR10Y', 'IT10Y'];
    if (bondSymbols.includes(sym)) {
      setActiveTab('commodities');
      return;
    }
    const matched = results.find(r => r.ticker === sym);
    if (matched) {
      setSelectedResultForModal(matched);
      return;
    }

    // If company exists in TECH_COMPANIES or SHOVEL_SELLERS_COMPANIES, generate modal view
    const meta = TECH_COMPANIES[sym] || (SHOVEL_SELLERS_COMPANIES as any)[sym] || (HYPERSCALER_COMPANIES as any)[sym];
    if (meta) {
      const q = quotes[sym];
      const livePrice = q ? q.price : meta.currentPrice;
      const syntheticResult: QuarterlyResult = {
        id: `shovel-selected-${sym}`,
        ticker: sym,
        companyName: meta.name,
        sector: meta.sector || 'The Shovel Sellers',
        subSector: meta.subSector || 'Semiconductors',
        quarter: 'Q2 2026',
        fiscalYear: 2026,
        reportDate: '2026-08-15',
        reportTime: 'AMC',
        status: 'reported',
        epsEstimate: 1.45,
        epsActual: 1.58,
        epsSurprisePercent: 8.97,
        revenueEstimate: 3.85,
        revenueActual: 4.02,
        revenueSurprisePercent: 4.41,
        revenueYoY: 16.4,
        priceReactionPercent: q ? q.changePercent : meta.dayChangePercent,
        isImportant: true,
        guidanceRating: 'raised',
        guidanceSummary: `${meta.name} raised forward guidance backed by robust AI infrastructure expansion and hyperscaler enterprise order book backlog.`,
        aiCapexHighlight: `Directly benefiting from hyperscale AI datacenter infrastructure deployments with high-margin customer commitments.`,
        keyHighlights: [
          meta.description,
          `52-Week Range: $${meta.fiftyTwoWeekLow.toFixed(2)} - $${meta.fiftyTwoWeekHigh.toFixed(2)} | 200 DMA: $${meta.twoHundredDayAverage.toFixed(2)}`
        ],
        segments: [
          { name: meta.subSector || 'Core Infrastructure', revenue: meta.marketCap, growthYoY: '+18%', beatExpectation: true }
        ],
        analystOutlooks: [
          {
            bankName: 'J.P. Morgan',
            logoColor: 'text-blue-800 bg-blue-50 border-blue-200',
            targetPrice: `$${(livePrice * 1.2).toFixed(2)}`,
            targetPriceNumeric: livePrice * 1.2,
            timeHorizon: '12 Months',
            rating: 'Overweight',
            nextQuarterEpsEst: '$1.65',
            nextQuarterRevEst: '$4.25B',
            thesis: `${meta.name} holds an indispensable competitive moat in the global AI hardware and infrastructure supply chain.`,
            catalysts: ['Hyperscaler AI capex acceleration', 'Supply chain capacity expansion', 'Margin expansion in high-density components'],
            lastUpdated: 'September 2026'
          }
        ]
      };
      setSelectedResultForModal(syntheticResult);
    }
  };

  // Handle 200-day moving average breakdown alert notification
  const handleTriggerTechnicalAlert = useCallback((
    ticker: string, 
    currentPrice: number, 
    dma200: number, 
    high52: number, 
    low52: number
  ) => {
    const company = TECH_COMPANIES[ticker];
    const diffPct = (((currentPrice - dma200) / dma200) * 100).toFixed(2);
    dispatchPushNotification(
      {
        ticker,
        companyName: company?.name || ticker,
        title: `[TECHNICAL ALERT] ${ticker} Below 200-Day Moving Average`,
        body: `${ticker} ($${currentPrice.toFixed(2)}) is trading ${diffPct}% below its 200-day moving average ($${dma200.toFixed(2)}). 52-Week Range: $${low52.toFixed(2)} - $${high52.toFixed(2)}. Momentum breakdown active.`,
        type: 'miss',
        metrics: {
          epsActual: undefined,
          epsEstimate: 0,
          revenueActual: undefined,
          revenueEstimate: 0,
          priceMove: Number(diffPct)
        }
      },
      preferences,
      (newNotif) => {
        handleSaveNotifications([newNotif, ...notifications]);
        setActiveToast(newNotif);
      }
    );
  }, [preferences, notifications, handleSaveNotifications]);

  // Filter results
  const filteredResults = results.filter(item => {
    if (selectedSector !== 'ALL' && item.sector !== selectedSector) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTicker = item.ticker.toLowerCase().includes(q);
      const matchName = item.companyName.toLowerCase().includes(q);
      const matchHighlights = item.keyHighlights?.some(h => h.toLowerCase().includes(q));
      const matchSegments = item.segments?.some(s => s.name.toLowerCase().includes(q));
      return matchTicker || matchName || matchHighlights || matchSegments;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Toast Push Alert Notification */}
      <LivePushToast
        notification={activeToast}
        onDismiss={() => setActiveToast(null)}
        onViewDetails={(ticker) => {
          const matched = results.find(r => r.ticker === ticker);
          if (matched) setSelectedResultForModal(matched);
        }}
      />

      {/* Institutional Soft Corporate Header */}
      <CorporateHeader
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
        onRequestBrowserPermission={handleRequestBrowserPermission}
        browserPermission={browserPermission}
        notifications={notifications}
        onOpenNotifications={() => setIsNotificationCenterOpen(true)}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedSector={selectedSector}
        onSectorChange={setSelectedSector}
      />

      {/* CONNECTED REAL-TIME PRICE TRACKER BAR */}
      <RealTimeTrackerBar
        quotes={quotes}
        isLoading={isQuotesLoading}
        isStreaming={isStreaming}
        lastUpdated={lastQuotesUpdated}
        onRefresh={() => loadMarketQuotes(true)}
        onToggleStreaming={() => setIsStreaming(prev => !prev)}
        onSelectTicker={handleSelectTickerFromPill}
        recentTicks={recentTicks}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {/* KPI Executive Summary Banner */}
        <MetricCards 
          results={results}
          onSelectUpcoming={() => setActiveTab('calendar')}
        />

        {/* View Switcher Tabs & Live Push Status Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3.5 mb-5">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200/90 text-xs">
            {/* 1. Global Markets and Research and Trading Desk */}
            <button
              id="tab-jpmorgan"
              onClick={() => setActiveTab('jpmorgan')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer font-medium ${
                activeTab === 'jpmorgan' 
                  ? 'bg-[#002d62] text-white shadow-2xs font-bold' 
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
              title="Global Markets and Research and Trading Desk"
            >
              <Menu className="w-3.5 h-3.5" />
              <span>Global Markets & Research Desk</span>
            </button>

            {/* 2. Treasury & Sovereign Debt Rates */}
            <button
              id="tab-bonds"
              onClick={() => setActiveTab('bonds')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer font-medium ${
                activeTab === 'bonds' 
                  ? 'bg-[#002d62] text-white shadow-2xs font-bold' 
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Landmark className="w-3.5 h-3.5 text-sky-400" />
              <span>Treasury & Sovereign Yields</span>
            </button>

            {/* 2. Consensus & Live Quotes Matrix */}
            <button
              id="tab-matrix"
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer font-medium ${
                activeTab === 'matrix' 
                  ? 'bg-white text-slate-900 shadow-2xs font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
              <span>Consensus Matrix</span>
            </button>

            {/* 3. Earnings Calendar */}
            <button
              id="tab-calendar"
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer font-medium ${
                activeTab === 'calendar' 
                  ? 'bg-white text-slate-900 shadow-2xs font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Earnings Calendar</span>
            </button>

            {/* 4. Commodities & Bank Outlook */}
            <button
              id="tab-commodities"
              onClick={() => setActiveTab('commodities')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer font-medium ${
                activeTab === 'commodities' 
                  ? 'bg-white text-amber-900 shadow-2xs font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Fuel className="w-3.5 h-3.5 text-amber-600" />
              <span>Commodities Desk</span>
            </button>

            {/* 5. McKinsey Thought Leadership & Strategy (Screenshot 2 Authentic Design) */}
            <button
              id="tab-mckinsey"
              onClick={() => setActiveTab('mckinsey')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer font-medium ${
                activeTab === 'mckinsey' 
                  ? 'bg-[#051c2c] text-cyan-300 shadow-2xs font-bold border border-cyan-800' 
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              <span>McKinsey Thought Leadership</span>
            </button>
          </div>

          {/* Institutional Alert Protocol Status Banner */}
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-white border border-slate-200/90 px-3.5 py-1.5 rounded-xl shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-700">PUSH ENGINE:</span>
            <strong className="text-slate-900 font-mono-code font-bold">
              {preferences.subscribedTickers.length} Tickers Subscribed
            </strong>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => setIsSimulatorOpen(true)}
              className="text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer font-bold"
            >
              <Zap className="w-3 h-3 text-emerald-600" />
              <span>Test Push Chime</span>
            </button>
          </div>
        </div>

        {/* Tab 1: J.P. Morgan Asset Desk (Screenshot 1 Layout: List View & Group by Asset Class) */}
        {activeTab === 'jpmorgan' && (
          <JPMorganTableView
            results={filteredResults}
            subscribedTickers={preferences.subscribedTickers}
            quotes={quotes}
            recentTicks={recentTicks}
            onToggleSubscription={handleToggleSubscription}
            onSelectResult={(item) => setSelectedResultForModal(item)}
            onGenerateAiMemo={(item) => setSelectedResultForModal(item)}
            onSelectCommodity={() => setActiveTab('commodities')}
            onTriggerTechnicalAlert={handleTriggerTechnicalAlert}
          />
        )}

        {/* Tab 2: Sovereign Bonds & Yield Curve Desk */}
        {activeTab === 'bonds' && (
          <BondsSection
            quotes={quotes}
            recentTicks={recentTicks}
            onRefreshQuotes={() => loadMarketQuotes(true)}
            isLoadingQuotes={isQuotesLoading}
          />
        )}

        {/* Tab 2: Classic Consensus vs Actual Matrix */}
        {activeTab === 'matrix' && (
          <EarningsTableView
            results={filteredResults}
            subscribedTickers={preferences.subscribedTickers}
            quotes={quotes}
            recentTicks={recentTicks}
            onToggleSubscription={handleToggleSubscription}
            onSelectResult={(item) => setSelectedResultForModal(item)}
            onGenerateAiMemo={(item) => setSelectedResultForModal(item)}
          />
        )}

        {/* Tab 3: Earnings Calendar View */}
        {activeTab === 'calendar' && (
          <EarningsCalendarView
            results={filteredResults}
            subscribedTickers={preferences.subscribedTickers}
            quotes={quotes}
            onToggleSubscription={handleToggleSubscription}
            onSelectResult={(item) => setSelectedResultForModal(item)}
            onGenerateAiMemo={(item) => setSelectedResultForModal(item)}
          />
        )}

        {/* Tab 4: Commodities & Energy Outlook */}
        {activeTab === 'commodities' && (
          <CommoditiesSection
            quotes={quotes}
            recentTicks={recentTicks}
            onRefreshQuotes={() => loadMarketQuotes(true)}
            isLoadingQuotes={isQuotesLoading}
          />
        )}

        {/* Tab 5: McKinsey Thought Leadership & Executive Strategy (Screenshot 2 Layout) */}
        {activeTab === 'mckinsey' && (
          <McKinseyExecutiveView
            results={filteredResults}
            quotes={quotes}
            onSelectResult={(item) => setSelectedResultForModal(item)}
          />
        )}
      </main>

      {/* Institutional Soft Corporate Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-slate-500 text-xs mt-12">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <span className="font-mono-code font-bold text-slate-800">VERITAS TECH EARNINGS INTELLIGENCE</span>
            <span className="text-slate-300">•</span>
            <span>WALL STREET INSTITUTIONAL EQUITY & REAL-TIME COVERAGE</span>
          </div>

          <div className="flex items-center space-x-6 text-[11px]">
            <span>DATA SOURCE: SEC FORM 8-K & LIVE MARKET DESK</span>
            <span className="text-slate-300">•</span>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-slate-900 transition cursor-pointer font-medium"
            >
              Push Notification Protocol
            </button>
            <span className="text-slate-300">•</span>
            <button 
              onClick={() => setIsSimulatorOpen(true)}
              className="text-emerald-700 hover:underline cursor-pointer font-semibold"
            >
              Test Alert Delivery
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {selectedResultForModal && (
        <CompanyDetailModal
          result={selectedResultForModal}
          quote={quotes[selectedResultForModal.ticker]}
          onClose={() => setSelectedResultForModal(null)}
          onTriggerTestPush={handleTriggerTestPush}
          preferences={preferences}
        />
      )}

      {isSimulatorOpen && (
        <SimulateReleaseModal
          results={results}
          preferences={preferences}
          onClose={() => setIsSimulatorOpen(false)}
          onExecuteSimulation={handleExecuteSimulation}
        />
      )}

      {isNotificationCenterOpen && (
        <NotificationCenterModal
          notifications={notifications}
          onClose={() => setIsNotificationCenterOpen(false)}
          onMarkAllAsRead={handleMarkAllAsRead}
          onClearNotifications={handleClearNotifications}
          onSelectTicker={(ticker) => {
            const found = results.find(r => r.ticker === ticker);
            if (found) setSelectedResultForModal(found);
          }}
        />
      )}

      {isSettingsOpen && (
        <AlertSettingsModal
          preferences={preferences}
          onUpdatePreferences={handleUpdatePreferences}
          browserPermission={browserPermission}
          onRequestBrowserPermission={handleRequestBrowserPermission}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* McKinsey Blue Consultation Bubble (Screenshot 2 Floating Action) */}
      <FloatingAdvisoryBubble />
    </div>
  );
}
