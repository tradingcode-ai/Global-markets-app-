import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  QuarterlyResult, 
  AlertPreferences, 
  PushNotificationItem,
  NotificationEventType,
  LiveQuote,
  NotificationAssetCatalogItem
} from './types';
import { 
  INITIAL_EARNINGS_RESULTS, 
  TECH_COMPANIES 
} from './data/earningsData';
import { SHOVEL_SELLERS_COMPANIES } from './data/shovelSellersData';
import { HYPERSCALER_COMPANIES, HYPERSCALER_TICKERS } from './data/hyperscalersData';
import { FINANCIAL_COMPANIES, FINANCIAL_RESULTS } from './data/financialsData';
import { AEROSPACE_DEFENSE_RESULTS, AEROSPACE_DEFENSE_COMPANIES } from './data/aerospaceDefenseData';
import { COMMODITIES_DATA } from './data/commoditiesData';
import { SP_MACRO_SECTORS, SP_INDUSTRY_CLUSTERS } from './data/spSectorsData';
import { getStoredAnalystSnapshots, saveAnalystSnapshots, mergeAnalystSnapshots } from './services/marketDataService';
import { getCurrencySymbol } from './utils/formatters';
import { resolveLiveQuote } from './utils/marketSession';
import { 
  getStoredPreferences, 
  savePreferences, 
  getStoredNotifications, 
  saveNotifications, 
  requestBrowserPushPermission, 
  dispatchPushNotification, 
  playCorporateChime,
  hasAlertFired,
  recordAlertFired
} from './services/notificationService';
import {
  advanceQuoteObservation,
  getEligibleMarketQuote,
  getNewConfiguredThresholdCrossing,
  getNewMomentumCrossing,
  getQuoteObservation,
  isFreshSecAcceptance,
  saveQuoteObservation
} from './services/notificationRules';
import { fetchLiveMarketQuotes, fetchQuarterlyAnalystOutlook, fetchNotificationAssetCatalog, fetchNotificationAssetQuotes, fetchNotificationStockQuotes } from './services/marketDataService';
import { CorporateHeader } from './components/CorporateHeader';
import { RealTimeTrackerBar } from './components/RealTimeTrackerBar';
import { GlobalMarketsMap } from './components/GlobalMarketsMap';
import { EarningsTableView } from './components/EarningsTableView';
import { buildConsensusMatrixRows, CONSENSUS_MATRIX_SYMBOLS } from './utils/consensusMatrix';
import { EarningsCalendarView } from './components/EarningsCalendarView';
import { CompanyDetailModal } from './components/CompanyDetailModal';
import { ConsensusCompanyModal } from './components/ConsensusCompanyModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { AlertSettingsModal } from './components/AlertSettingsModal';
import { LivePushToast } from './components/LivePushToast';
import { CommoditiesSection } from './components/CommoditiesSection';
import { BondsSection } from './components/BondsSection';
import { JPMorganTableView } from './components/JPMorganTableView';
import { McKinseyExecutiveView } from './components/McKinseyExecutiveView';
import { GlobalNewsAgentView } from './components/GlobalNewsAgentView';
import { SPSectorsAndEtfsView } from './components/SPSectorsAndEtfsView';
import { FloatingAdvisoryBubble } from './components/FloatingAdvisoryBubble';
import { 
  LayoutGrid, 
  Calendar, 
  Sparkles, 
  Bell, 
  Radio,
  Fuel,
  Menu,
  Layers,
  BookOpen,
  Landmark,
  Globe,
  PieChart
} from 'lucide-react';

export default function App() {
  const [results, setResults] = useState<QuarterlyResult[]>(() => {
    const combined = [...INITIAL_EARNINGS_RESULTS, ...FINANCIAL_RESULTS, ...AEROSPACE_DEFENSE_RESULTS];
    return combined.map(item => {
      const base = HYPERSCALER_TICKERS.has(item.ticker)
        ? { ...item, sector: 'Hyperscalers & Neo Clouds' as any, subSector: item.subSector || (['GOOGL','MSFT','AMZN','ORCL','META'].includes(item.ticker) ? 'Hyperscalers' : 'Neo Clouds') }
        : item;
      return {
        ...base,
        quarterlyConsensus: undefined,
        analystOutlooks: undefined
      };
    });
  });
  const [quarterlyOutlookLoaded, setQuarterlyOutlookLoaded] = useState(false);
  const [quarterlySnapshots, setQuarterlySnapshots] = useState<Record<string, any>>({});
  const [isConsensusLoading, setIsConsensusLoading] = useState(false);
  const consensusInFlight = useRef(false);
  const consensusMounted = useRef(true);
  const matrixResults = useMemo(
    () => buildConsensusMatrixRows(results, quarterlySnapshots),
    [results, quarterlySnapshots]
  );

  const [notifications, setNotifications] = useState<PushNotificationItem[]>(() => {
    return getStoredNotifications();
  });
  const [preferences, setPreferences] = useState<AlertPreferences>(getStoredPreferences);
  const preferencesRef = useRef(preferences);
  preferencesRef.current = preferences;
  const preferencesVersionRef = useRef(0);
  const lastAlertObservationPreferencesVersionRef = useRef(0);
  const lastAssetObservationPreferencesVersionRef = useRef(0);
  const marketQuotesInFlightRef = useRef(false);
  const [secFeedStatus, setSecFeedStatus] = useState<string | null>(null);
  const [notificationAssetCatalog, setNotificationAssetCatalog] = useState<NotificationAssetCatalogItem[]>([]);
  const notificationAssetCatalogRef = useRef<NotificationAssetCatalogItem[]>([]);
  notificationAssetCatalogRef.current = notificationAssetCatalog;
  const [assetFeedStatus, setAssetFeedStatus] = useState<string | null>(null);
  const [stockQuoteFeedStatus, setStockQuoteFeedStatus] = useState<string | null>(null);
  const lastAssetQuotePollRef = useRef(0);
  const assetQuoteRequestInFlightRef = useRef(false);
  const lastStockQuotePollRef = useRef(0);
  const stockQuoteRequestInFlightRef = useRef(false);
  const lastAssetThresholdSignatureRef = useRef('');
  const assetCatalogRequestInFlightRef = useRef(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');

  // News Agent Linked Tickers State (Decoupled from Push Engine, coupled with PostgreSQL database)
  const [newsAgentTickers, setNewsAgentTickers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('veritas_news_agent_linked_tickers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return ['ASML', 'MSFT', 'NVDA', 'TSM'];
  });

  // On mount, synchronize News Agent tickers with PostgreSQL database
  useEffect(() => {
    fetch('/api/v1/alerts')
      .then(r => r.json())
      .then(data => {
        if (data?.status === 'success' && Array.isArray(data.tickers) && data.tickers.length > 0) {
          setNewsAgentTickers(data.tickers);
          localStorage.setItem('veritas_news_agent_linked_tickers', JSON.stringify(data.tickers));
        }
      })
      .catch(() => {});
  }, []);
  
  // Real-Time Stock Market Quotes State
  const [quotes, setQuotes] = useState<Record<string, LiveQuote>>({});
  const [isQuotesLoading, setIsQuotesLoading] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [lastQuotesUpdated, setLastQuotesUpdated] = useState<Date | null>(null);
  const [recentTicks, setRecentTicks] = useState<Record<string, 'up' | 'down'>>({});
  const prevQuotesRef = useRef<Record<string, LiveQuote>>({});

  // UI State
  const [activeTab, setActiveTab] = useState<'jpmorgan' | 'bonds' | 'matrix' | 'calendar' | 'commodities' | 'mckinsey' | 'globalnewsagent' | 'sectors'>('jpmorgan');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [selectedBondId, setSelectedBondId] = useState<string>('us-10y-treasury');
  const [selectedCommodityId, setSelectedCommodityId] = useState<string>('wti-crude');
  const [selectedGlobalMarketSymbol, setSelectedGlobalMarketSymbol] = useState<string | null>(null);
  const [globalMarketSelectionRequestId, setGlobalMarketSelectionRequestId] = useState(0);
  const [selectedSectorAssetSymbol, setSelectedSectorAssetSymbol] = useState<string | null>(null);
  const [sectorAssetSelectionRequestId, setSectorAssetSelectionRequestId] = useState(0);
  
  // Modals
  const [selectedResultForModal, setSelectedResultForModal] = useState<QuarterlyResult | null>(null);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [activeToast, setActiveToast] = useState<PushNotificationItem | null>(null);

  const quotesRef = useRef<Record<string, LiveQuote>>({});

  useEffect(() => {
    let active = true;
    const refreshCatalog = async () => {
      if (assetCatalogRequestInFlightRef.current || (typeof document !== 'undefined' && document.hidden)) return;
      assetCatalogRequestInFlightRef.current = true;
      try {
        const catalog = await fetchNotificationAssetCatalog();
        if (!active) return;
        setNotificationAssetCatalog(catalog);
        if (catalog.length === 0) setAssetFeedStatus('Global Markets alert catalog is unavailable; no non-equity assets can be monitored.');
      } finally {
        assetCatalogRequestInFlightRef.current = false;
      }
    };
    void refreshCatalog();
    const interval = window.setInterval(() => { void refreshCatalog(); }, 60000);
    const onVisibilityChange = () => { if (!document.hidden) void refreshCatalog(); };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      active = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  // Analyst consensus is live Yahoo Finance data. The client refreshes it periodically
  // instead of keeping a stale month-long localStorage snapshot.
  const ANALYST_REFRESH_MS = 6 * 60 * 60 * 1000;

  const applyQuarterlySnapshot = useCallback((snapshot: Record<string, any>) => {
    setQuarterlySnapshots(snapshot);
    setResults(prev => prev.map(item => {
      const snap = snapshot[item.ticker];
      if (!snap || snap.isLiveFeed !== true) {
        return {
          ...item,
          analystOutlooks: undefined,
          quarterlyConsensus: undefined
        };
      }

      const consensus = {
        ...snap,
        provider: snap.provider || 'Yahoo Finance Analyst Consensus',
        dataSource: snap.dataSource || 'Yahoo Finance',
        isCachedSnapshot: snap.isCachedSnapshot === true
      };

      return {
        ...item,
        analystOutlooks: Array.isArray(consensus.outlooks) && consensus.outlooks.length > 0
          ? consensus.outlooks
          : undefined,
        quarterlyConsensus: consensus
      };
    }));
  }, []);

  const loadQuarterlySnapshot = useCallback(async (forceRefresh = false) => {
      if (consensusInFlight.current) return;
      consensusInFlight.current = true;
      setIsConsensusLoading(true);
      try {
        const allSymbols = Array.from(new Set([
          ...CONSENSUS_MATRIX_SYMBOLS,
          ...INITIAL_EARNINGS_RESULTS.map(r => r.ticker),
          ...Object.keys(TECH_COMPANIES),
          ...Object.keys(SHOVEL_SELLERS_COMPANIES),
          ...Object.keys(HYPERSCALER_COMPANIES),
          ...Object.keys(FINANCIAL_COMPANIES),
          ...Object.keys(AEROSPACE_DEFENSE_COMPANIES)
        ]));
        const live: Record<string, any> = {};
        const publish = () => {
          if (!consensusMounted.current) return;
          const merged = mergeAnalystSnapshots(live, getStoredAnalystSnapshots());
          // Empty/expired responses also clear the last displayed snapshot.
          saveAnalystSnapshots(merged);
          applyQuarterlySnapshot(merged);
        };
        publish();
        // Publish each bounded batch as it arrives; one slow/missing listing
        // must not hold back consensus for the rest of the universe.
        const batches = Array.from({ length: Math.ceil(allSymbols.length / 20) }, (_, i) => allSymbols.slice(i * 20, (i + 1) * 20));
        let nextBatch = 0;
        await Promise.all(Array.from({ length: Math.min(2, batches.length) }, async () => {
          while (consensusMounted.current && nextBatch < batches.length) {
            const symbols = batches[nextBatch++];
            const response = await fetchQuarterlyAnalystOutlook(symbols, forceRefresh);
            Object.assign(live, response.data || {});
            publish();
          }
        }));
        if (consensusMounted.current) setQuarterlyOutlookLoaded(true);
      } catch (error) {
        console.warn('Live Yahoo analyst consensus could not be loaded:', error);
      } finally {
        consensusInFlight.current = false;
        if (consensusMounted.current) setIsConsensusLoading(false);
      }
  }, [applyQuarterlySnapshot]);

  useEffect(() => {
    consensusMounted.current = true;
    loadQuarterlySnapshot();
    const timer = window.setInterval(loadQuarterlySnapshot, ANALYST_REFRESH_MS);
    return () => {
      consensusMounted.current = false;
      window.clearInterval(timer);
    };
  }, [loadQuarterlySnapshot]);

  // Sync notification permission state
  useEffect(() => {
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  // Automatic equity alerts require a fresh provider trade inside its exact regular session.
  const checkMarketSessionAlerts = useCallback((liveData: Record<string, LiveQuote>) => {
    const activePreferences = preferencesRef.current;
    if (activePreferences.subscribedTickers.length === 0) return;
    const preferencesChanged = lastAlertObservationPreferencesVersionRef.current !== preferencesVersionRef.current;
    lastAlertObservationPreferencesVersionRef.current = preferencesVersionRef.current;
    const handledSymbols = new Set<string>();
    const nonEquitySymbols = new Set(notificationAssetCatalogRef.current.map(asset => asset.symbol.toUpperCase()));

    for (const subscribedTicker of activePreferences.subscribedTickers) {
      const sym = subscribedTicker.toUpperCase().trim();
      if (nonEquitySymbols.has(sym)) continue;
      const quote = resolveLiveQuote(sym, liveData);
      const eligible = getEligibleMarketQuote(quote);
      if (!quote || !eligible) continue;

      const eventSymbol = (quote.primaryListingSymbol || quote.symbol || sym).toUpperCase();
      if (handledSymbols.has(eventSymbol)) continue;
      handledSymbols.add(eventSymbol);

      if (preferencesChanged) {
        saveQuoteObservation(eventSymbol, {
          sessionDate: eligible.sessionDate,
          tradeTimeMs: eligible.tradeTimeMs,
          price: eligible.price,
          changePercent: eligible.changePercent,
          fiftyTwoWeekHigh: quote.is52WeekMetricsVerified ? quote.fiftyTwoWeekHigh : undefined,
          fiftyTwoWeekLow: quote.is52WeekMetricsVerified ? quote.fiftyTwoWeekLow : undefined
        });
        continue;
      }

      const previousObservation = getQuoteObservation(eventSymbol);
      if (previousObservation && previousObservation.sessionDate === eligible.sessionDate && eligible.tradeTimeMs <= previousObservation.tradeTimeMs) {
        continue;
      }
      const advanced = advanceQuoteObservation(previousObservation, eligible, quote);
      saveQuoteObservation(eventSymbol, advanced.observation);
      if (!advanced.mayTrigger || !advanced.previous) continue;

      const previous = advanced.previous;
      const companyName =
        TECH_COMPANIES[sym]?.name ||
        SHOVEL_SELLERS_COMPANIES[sym]?.name ||
        HYPERSCALER_COMPANIES[sym]?.name ||
        FINANCIAL_COMPANIES[sym]?.name ||
        AEROSPACE_DEFENSE_COMPANIES[sym]?.name ||
        quote.companyName ||
        sym;
      const curSym = getCurrencySymbol(quote.currency);
      const crossing = getNewMomentumCrossing(previous.changePercent, eligible.changePercent);

      if (crossing) {
        const thresholdKey = (symbol: string, threshold: number) => {
          const label = (threshold > 0 ? '+' : '') + threshold.toFixed(1) + '%';
          return 'MOMENTUM_' + crossing.direction.toUpperCase() + ':' + symbol + ':' + label + ':' + eligible.sessionDate;
        };
        const momentumEnabled = crossing.direction === 'up'
          ? activePreferences.alertOnMomentumUp ?? activePreferences.alertOnFivePercentMove ?? true
          : activePreferences.alertOnMomentumDown ?? activePreferences.alertOnFivePercentMove ?? true;
        if (momentumEnabled) {
          for (const crossedThreshold of crossing.crossedThresholds) {
            const canonicalKey = thresholdKey(eventSymbol, crossedThreshold);
            const legacySelectedKey = thresholdKey(sym, crossedThreshold);
            if (legacySelectedKey !== canonicalKey && hasAlertFired(legacySelectedKey)) recordAlertFired(canonicalKey);
            if (crossedThreshold !== crossing.threshold) recordAlertFired(canonicalKey);
          }

          const dedupeKey = thresholdKey(eventSymbol, crossing.threshold);
          const legacySelectedKey = thresholdKey(sym, crossing.threshold);
          if (legacySelectedKey !== dedupeKey && hasAlertFired(legacySelectedKey)) recordAlertFired(dedupeKey);
          const sign = crossing.direction === 'up' ? '+' : '';
          const moveText = sign + eligible.changePercent.toFixed(2) + '%';
          dispatchPushNotification({
            ticker: sym,
            companyName,
            title: sym + ' - Momentum ' + (crossing.direction === 'up' ? 'Up' : 'Down') + ' (' + moveText + ')',
            body: companyName + ' (' + sym + ') crossed the ' + sign + crossing.threshold.toFixed(1) + '% threshold during the regular session at ' + curSym + eligible.price.toFixed(2) + '. Move from the verified prior close: ' + moveText + '.',
            type: crossing.direction === 'up' ? 'momentum-up' : 'momentum-down',
            dedupeKey,
            eventOccurredAt: quote.providerTradeTimestamp,
            source: quote.provider || 'Yahoo Finance quote feed',
            tradingDate: eligible.sessionDate,
            metrics: { priceMove: eligible.changePercent },
            metadata: {
              currentPrice: eligible.price,
              percentageChange: eligible.changePercent,
              quoteTimestamp: quote.providerTradeTimestamp,
              previousClose: eligible.previousClose,
              source: quote.provider || 'Yahoo Finance quote feed'
            }
          }, activePreferences, (newNotif) => {
            setNotifications(prev => {
              const next = [newNotif, ...prev];
              saveNotifications(next);
              return next;
            });
            setActiveToast(newNotif);
          });
        }
      }

      if (quote.is52WeekMetricsVerified && (activePreferences.alertOnFiftyTwoWeekHighLow ?? true)) {
        const high = quote.fiftyTwoWeekHigh;
        const low = quote.fiftyTwoWeekLow;
        if (Number.isFinite(high) && (high as number) > 0 && previous.price < (high as number) && eligible.price >= (high as number)) {
          const dedupeKey = '52W_HIGH:' + eventSymbol + ':' + eligible.sessionDate;
          dispatchPushNotification({
            ticker: sym,
            companyName,
            title: sym + ' — Verified 52-Week High (' + curSym + eligible.price.toFixed(2) + ')',
            body: companyName + ' (' + sym + ') reached the provider-supplied 52-week high of ' + curSym + (high as number).toFixed(2) + ' during the regular session.',
            type: '52w-high',
            dedupeKey,
            eventOccurredAt: quote.providerTradeTimestamp,
            source: quote.provider || 'Yahoo Finance quote feed',
            tradingDate: eligible.sessionDate,
            metrics: { priceMove: eligible.changePercent },
            metadata: { currentPrice: eligible.price, quoteTimestamp: quote.providerTradeTimestamp, source: quote.provider || 'Yahoo Finance quote feed' }
          }, activePreferences, (newNotif) => {
            setNotifications(prev => {
              const next = [newNotif, ...prev];
              saveNotifications(next);
              return next;
            });
            setActiveToast(newNotif);
          });
        }
        if (Number.isFinite(low) && (low as number) > 0 && previous.price > (low as number) && eligible.price <= (low as number)) {
          const dedupeKey = '52W_LOW:' + eventSymbol + ':' + eligible.sessionDate;
          dispatchPushNotification({
            ticker: sym,
            companyName,
            title: sym + ' — Verified 52-Week Low (' + curSym + eligible.price.toFixed(2) + ')',
            body: companyName + ' (' + sym + ') reached the provider-supplied 52-week low of ' + curSym + (low as number).toFixed(2) + ' during the regular session.',
            type: '52w-low',
            dedupeKey,
            eventOccurredAt: quote.providerTradeTimestamp,
            source: quote.provider || 'Yahoo Finance quote feed',
            tradingDate: eligible.sessionDate,
            metrics: { priceMove: eligible.changePercent },
            metadata: { currentPrice: eligible.price, quoteTimestamp: quote.providerTradeTimestamp, source: quote.provider || 'Yahoo Finance quote feed' }
          }, activePreferences, (newNotif) => {
            setNotifications(prev => {
              const next = [newNotif, ...prev];
              saveNotifications(next);
              return next;
            });
            setActiveToast(newNotif);
          });
        }
      }
    }
  }, []);

  const checkNotificationAssetAlerts = useCallback((
    liveData: Record<string, LiveQuote>,
    catalog: NotificationAssetCatalogItem[],
    requestPreferencesVersion: number
  ) => {
    const activePreferences = preferencesRef.current;
    const selectedSymbols = Array.isArray(activePreferences.subscribedAssetSymbols)
      ? new Set(activePreferences.subscribedAssetSymbols.map(symbol => symbol.toUpperCase().trim()))
      : new Set<string>();
    if (selectedSymbols.size === 0) return;
    const thresholdSignature = catalog
      .filter(asset => selectedSymbols.has(asset.symbol.toUpperCase()) && asset.quoteAvailable && Number.isFinite(asset.thresholdPct))
      .map(asset => asset.symbol.toUpperCase() + ':' + asset.thresholdPct)
      .sort()
      .join('|');
    const thresholdsChanged = thresholdSignature !== lastAssetThresholdSignatureRef.current;
    lastAssetThresholdSignatureRef.current = thresholdSignature;
    const preferencesChanged = lastAssetObservationPreferencesVersionRef.current !== requestPreferencesVersion || requestPreferencesVersion !== preferencesVersionRef.current || thresholdsChanged;
    lastAssetObservationPreferencesVersionRef.current = preferencesVersionRef.current;
    const handledProviderSymbols = new Set<string>();

    for (const asset of catalog) {
      const displaySymbol = asset.symbol.toUpperCase().trim();
      if (!selectedSymbols.has(displaySymbol) || !asset.quoteAvailable || !Number.isFinite(asset.thresholdPct) || (asset.thresholdPct as number) <= 0) continue;
      const quote = liveData[displaySymbol];
      const eligible = getEligibleMarketQuote(quote);
      if (!quote || !eligible) continue;
      const providerSymbol = (quote.providerMarketSymbol || '').toUpperCase().trim();
      if (!providerSymbol || providerSymbol !== asset.providerSymbol?.toUpperCase() || handledProviderSymbols.has(providerSymbol)) continue;
      handledProviderSymbols.add(providerSymbol);

      const observationKey = 'ASSET:' + providerSymbol;
      if (preferencesChanged || activePreferences.alertOnAssetVolatility === false) {
        saveQuoteObservation(observationKey, {
          sessionDate: eligible.sessionDate,
          tradeTimeMs: eligible.tradeTimeMs,
          price: eligible.price,
          changePercent: eligible.changePercent
        });
        continue;
      }

      const previousObservation = getQuoteObservation(observationKey);
      if (previousObservation && previousObservation.sessionDate === eligible.sessionDate && eligible.tradeTimeMs <= previousObservation.tradeTimeMs) continue;
      const advanced = advanceQuoteObservation(previousObservation, eligible, quote);
      saveQuoteObservation(observationKey, advanced.observation);
      if (!advanced.mayTrigger || !advanced.previous) continue;

      const direction = getNewConfiguredThresholdCrossing(advanced.previous.changePercent, eligible.changePercent, asset.thresholdPct as number);
      if (!direction) continue;
      const thresholdText = (direction === 'up' ? '+' : '-') + (asset.thresholdPct as number).toFixed(2) + '%';
      const moveText = (eligible.changePercent > 0 ? '+' : '') + eligible.changePercent.toFixed(2) + '%';
      const sourceName = quote.providerName || quote.providerMarketSymbol || providerSymbol;
      const sourceKind = quote.providerInstrumentType ? ' ' + quote.providerInstrumentType.toLowerCase() : '';
      const priceText = asset.group === 'Sovereign yields'
        ? eligible.price.toFixed(3) + ' CBOE yield-index level'
        : asset.group === 'Global indices' || (asset.group === 'Sector indices & ETFs' && (quote.providerInstrumentType || '').toUpperCase() === 'INDEX') || /index|indices/i.test(asset.assetClass)
          ? eligible.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' index points'
          : asset.group === 'Commodities'
          ? (() => {
              const currency = asset.currency || quote.currency || '';
              const unit = asset.unit || '';
              const hasCurrencyInUnit = currency && unit.toUpperCase().includes(currency.toUpperCase());
              return (hasCurrencyInUnit ? '' : currency + ' ') + eligible.price.toFixed(2) + (unit ? ' ' + unit : '');
            })()
            : getCurrencySymbol(quote.currency) + eligible.price.toFixed(2) + ' per share';
      const label = asset.name + ' (' + displaySymbol + ')';
      const dedupeKey = 'ASSET_VOLATILITY:' + direction.toUpperCase() + ':' + providerSymbol + ':' + (asset.thresholdPct as number).toFixed(2) + ':' + eligible.sessionDate;
      dispatchPushNotification({
        ticker: displaySymbol,
        companyName: asset.name,
        title: label + ' ' + (direction === 'up' ? 'Up' : 'Down') + ' (' + moveText + ')',
        body: sourceName + ' (' + providerSymbol + sourceKind + ') crossed the ' + thresholdText + ' research threshold during its provider session. Verified source move: ' + moveText + ' from the prior session close; latest level: ' + priceText + '.',
        type: 'asset-volatility',
        dedupeKey,
        eventOccurredAt: quote.providerTradeTimestamp,
        source: quote.provider || 'Yahoo Finance',
        tradingDate: eligible.sessionDate,
        metrics: { priceMove: eligible.changePercent },
        metadata: {
          currentPrice: eligible.price,
          percentageChange: eligible.changePercent,
          quoteTimestamp: quote.providerTradeTimestamp,
          previousClose: eligible.previousClose,
          source: quote.provider || 'Yahoo Finance',
          assetClass: asset.assetClass,
          assetGroup: asset.group,
          assetCategoryKey: asset.categoryKey,
          thresholdPct: asset.thresholdPct,
          assetUnit: asset.unit,
          providerSymbol
        }
      }, activePreferences, (newNotif) => {
        setNotifications(prev => {
          const next = [newNotif, ...prev];
          saveNotifications(next);
          return next;
        });
        setActiveToast(newNotif);
      });
    }
  }, []);

  const dispatchSecFilings = useCallback((filings: any[], activePreferences: AlertPreferences): number => {
    let dispatchedCount = 0;
    for (const filing of filings) {
      const sym = typeof filing?.ticker === 'string' ? filing.ticker.toUpperCase().trim() : '';
      const accession = typeof filing?.accessionNumber === 'string' ? filing.accessionNumber : '';
      const acceptedAt = typeof filing?.acceptanceDateTime === 'string' ? filing.acceptanceDateTime : '';
      const isNonEquityAsset = notificationAssetCatalogRef.current.some(asset => asset.symbol.toUpperCase() === sym);
      const isSelected = !isNonEquityAsset && activePreferences.subscribedTickers.some(value => value.toUpperCase().trim() === sym);
      if (!sym || !accession || !isSelected || !isFreshSecAcceptance(acceptedAt)) continue;

      const isResultsRelease = filing.items?.includes('2.02') || filing.isItem202FinancialResults === true;
      const notificationType: NotificationEventType = isResultsRelease ? 'earnings-release' : 'sec-8k';
      const dedupeKey = 'SEC_8K:' + sym + ':' + accession;
      const releaseBody = sym + ' filed SEC Form 8-K Item 2.02 at ' + acceptedAt + '. This feed does not verify a same-period, same-basis EPS or revenue consensus comparison, so no beat/miss classification is available. Accession: ' + accession + '.';
      const acceptedNotification = dispatchPushNotification({
        ticker: sym,
        companyName: filing.companyName || sym,
        title: isResultsRelease ? sym + ' — Financial Results Filed (SEC Item 2.02)' : filing.title,
        body: isResultsRelease ? releaseBody : filing.body,
        type: notificationType,
        dedupeKey,
        eventOccurredAt: acceptedAt,
        source: 'SEC EDGAR Official Form 8-K',
        tradingDate: filing.filingDate,
        metadata: {
          filingAccession: accession,
          filingUrl: filing.docUrl,
          source: 'SEC EDGAR Form 8-K'
        }
      }, activePreferences, (newNotif) => {
        setNotifications(prev => {
          const next = [newNotif, ...prev];
          saveNotifications(next);
          return next;
        });
        setActiveToast(newNotif);
      });
      if (acceptedNotification) dispatchedCount++;
    }
    return dispatchedCount;
  }, []);

  // SEC acceptance times are source event times; historical submissions are ignored.
  const loadSec8kFilings = useCallback(async () => {
    const nonEquitySymbols = new Set(notificationAssetCatalogRef.current.map(asset => asset.symbol.toUpperCase()));
    const requestedTickers = preferencesRef.current.subscribedTickers.map(value => value.toUpperCase().trim()).filter(value => Boolean(value) && !nonEquitySymbols.has(value));
    if (requestedTickers.length === 0) {
      setSecFeedStatus('Automatic SEC monitoring is off because no stocks are selected.');
      return;
    }
    const preferenceVersion = preferencesVersionRef.current;
    try {
      const query = encodeURIComponent(requestedTickers.join(','));
      const response = await fetch('/api/sec-8k-filings?symbols=' + query);
      if (!response.ok) throw new Error('SEC request returned HTTP ' + response.status);
      const payload = await response.json();
      if (!payload?.success || !Array.isArray(payload.filings)) throw new Error('SEC response was unavailable');
      if (preferenceVersion !== preferencesVersionRef.current) return;

      const currentNonEquitySymbols = new Set(notificationAssetCatalogRef.current.map(asset => asset.symbol.toUpperCase()));
      const currentTickers = preferencesRef.current.subscribedTickers.map(value => value.toUpperCase().trim()).filter(value => Boolean(value) && !currentNonEquitySymbols.has(value));
      if (currentTickers.join(',') !== requestedTickers.join(',')) return;
      const unavailable = Array.isArray(payload.unavailableSymbols) ? payload.unavailableSymbols : [];
      const failed = Array.isArray(payload.failedSymbols) ? payload.failedSymbols : [];
      const unprocessed = Array.isArray(payload.unprocessedSymbols) ? payload.unprocessedSymbols : [];
      const coverageNotes = [];
      if (unavailable.length) coverageNotes.push('SEC company mapping unavailable: ' + unavailable.join(', '));
      if (failed.length) coverageNotes.push('SEC lookup failed: ' + failed.join(', '));
      if (unprocessed.length) coverageNotes.push('Not checked because of request limit: ' + unprocessed.join(', '));
      setSecFeedStatus(coverageNotes.length
        ? coverageNotes.join(' · ')
        : 'SEC EDGAR checks selected stocks for newly accepted Form 8-K filings. Only acceptances from the last 10 minutes can trigger.');
      dispatchSecFilings(payload.filings, preferencesRef.current);
    } catch (error) {
      setSecFeedStatus('SEC monitoring is temporarily unavailable: ' + (error instanceof Error ? error.message : 'request failed'));
      console.warn('Could not sync SEC 8-K filings:', error);
    }
  }, [dispatchSecFilings]);

  const loadNotificationAssetQuotes = useCallback(async (requestVersion = preferencesVersionRef.current) => {
    if (assetQuoteRequestInFlightRef.current || Date.now() - lastAssetQuotePollRef.current < 15000) return;
    const activePreferences = preferencesRef.current;
    const selectedAssetSymbols = Array.isArray(activePreferences.subscribedAssetSymbols)
      ? [...new Set(activePreferences.subscribedAssetSymbols.map(symbol => symbol.toUpperCase().trim()).filter(Boolean))]
      : [];
    if (selectedAssetSymbols.length === 0 || activePreferences.alertOnAssetVolatility === false) {
      setAssetFeedStatus(selectedAssetSymbols.length === 0
        ? 'No Global Markets assets are selected for automatic volatility alerts.'
        : 'Global Markets volatility alerts are disabled in settings.');
      return;
    }
    if (notificationAssetCatalog.length === 0) {
      setAssetFeedStatus('Global Markets asset catalog is loading or unavailable.');
      return;
    }
    const catalogBySymbol = new Map(notificationAssetCatalog.map(asset => [asset.symbol.toUpperCase(), asset]));
    const supported = selectedAssetSymbols.filter(symbol => {
      const asset = catalogBySymbol.get(symbol);
      return asset?.quoteAvailable && Number.isFinite(asset.thresholdPct) && (asset.thresholdPct as number) > 0;
    });
    const unsupported = selectedAssetSymbols.filter(symbol => !supported.includes(symbol));
    if (supported.length === 0) {
      setAssetFeedStatus('Selected Global Markets assets lack a mapped Yahoo instrument or active research threshold.');
      return;
    }

    lastAssetQuotePollRef.current = Date.now();
    assetQuoteRequestInFlightRef.current = true;
    try {
      const result = await fetchNotificationAssetQuotes(supported);
      if (requestVersion !== preferencesVersionRef.current) return;
      checkNotificationAssetAlerts(result.quotes, notificationAssetCatalog, requestVersion);
      const missing = [...new Set([...unsupported, ...result.unavailableSymbols])];
      setAssetFeedStatus(
        'Mapped-source quotes: ' + Object.keys(result.quotes).length + ' of ' + supported.length + ' selected instruments. ' +
        (missing.length ? 'Unavailable or unsupported: ' + missing.join(', ') + '. ' : '') +
        (result.unprocessedSymbols.length ? 'Not processed: ' + result.unprocessedSymbols.join(', ') + '. ' : '') +
        'Alerts require a source trade timestamp no more than 2 minutes old, no reported provider delay, and an open provider session.'
      );
    } catch {
      setAssetFeedStatus('Global Markets verified Yahoo quote feed is temporarily unavailable.');
    } finally {
      assetQuoteRequestInFlightRef.current = false;
    }
  }, [checkNotificationAssetAlerts, notificationAssetCatalog]);

  const loadNotificationStockQuotes = useCallback(async (requestVersion = preferencesVersionRef.current) => {
    if (stockQuoteRequestInFlightRef.current || Date.now() - lastStockQuotePollRef.current < 15000) return;
    const activePreferences = preferencesRef.current;
    const nonEquitySymbols = new Set(notificationAssetCatalogRef.current.map(asset => asset.symbol.toUpperCase()));
    const selectedTickers = [...new Set(activePreferences.subscribedTickers
      .map(symbol => symbol.toUpperCase().trim())
      .filter(symbol => symbol && !nonEquitySymbols.has(symbol)))];
    if (selectedTickers.length === 0) {
      setStockQuoteFeedStatus('No selected equity symbols need direct notification quotes.');
      return;
    }
    lastStockQuotePollRef.current = Date.now();
    stockQuoteRequestInFlightRef.current = true;
    try {
      const result = await fetchNotificationStockQuotes(selectedTickers);
      if (requestVersion !== preferencesVersionRef.current) return;
      if (Object.keys(result.quotes).length > 0) {
        checkMarketSessionAlerts(result.quotes);
      }
      setStockQuoteFeedStatus(
        'Direct Yahoo notification quotes: ' + Object.keys(result.quotes).length + ' of ' + selectedTickers.length + ' selected equities. ' +
        (result.unavailableSymbols.length ? 'Unavailable: ' + result.unavailableSymbols.join(', ') + '. ' : '') +
        (result.unprocessedSymbols.length ? 'Not processed: ' + result.unprocessedSymbols.join(', ') + '. ' : '') +
        'Events still require a source trade timestamp no more than 2 minutes old, no reported provider delay, and an open provider session.'
      );
    } catch {
      setStockQuoteFeedStatus('Direct selected-equity Yahoo quote feed is temporarily unavailable.');
    } finally {
      stockQuoteRequestInFlightRef.current = false;
    }
  }, [checkMarketSessionAlerts]);

  // Poll Real-Time Market Quotes
  const loadMarketQuotes = useCallback(async (isManual: boolean = false) => {
    if (marketQuotesInFlightRef.current) return;
    marketQuotesInFlightRef.current = true;
    const preferenceVersion = preferencesVersionRef.current;
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
          setTimeout(() => setRecentTicks({}), 850);
        }

        prevQuotesRef.current = liveData;
        quotesRef.current = liveData;
        setQuotes(liveData);
        setLastQuotesUpdated(new Date());

        // Scan quotes for 52-week High/Low and >5% session moves
        if (preferenceVersion === preferencesVersionRef.current) checkMarketSessionAlerts(liveData);

      }
    } catch (err) {
      console.warn('Could not fetch market quotes:', err);
    } finally {
      marketQuotesInFlightRef.current = false;
      if (isManual) setIsQuotesLoading(false);
    }
  }, [checkMarketSessionAlerts]);

  // Initial fetch on mount
  useEffect(() => {
    loadMarketQuotes(true);
    loadSec8kFilings();
  }, [loadMarketQuotes, loadSec8kFilings]);

  // Independent from the equity display feed so non-equity alerts still check when it fails.
  useEffect(() => {
    if (!isStreaming) return;
    const pollAssets = () => {
      if (!document.hidden) {
        void loadNotificationAssetQuotes();
        void loadNotificationStockQuotes();
      }
    };
    pollAssets();
    const interval = window.setInterval(pollAssets, 15000);
    const onVisibilityChange = () => { if (!document.hidden) pollAssets(); };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isStreaming, loadNotificationAssetQuotes, loadNotificationStockQuotes]);

  // Adaptive background-aware polling loop:
  // - Pauses when phone screen is locked or tab is hidden (saves battery & prevents crash queues)
  // - Calibrates interval: 5000ms on mobile devices to prevent thermal throttling, 1000ms on laptop/desktop
  useEffect(() => {
    if (!isStreaming) return;

    let intervalId: number | null = null;

    const getPollingDelay = () => {
      if (typeof window === 'undefined') return 1000;
      const isMobile = window.innerWidth < 768 && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      return isMobile ? 5000 : 1000;
    };

    const startPolling = () => {
      if (intervalId !== null) clearInterval(intervalId);
      intervalId = window.setInterval(() => {
        if (!document.hidden) {
          loadMarketQuotes(false);
        }
      }, getPollingDelay());
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (intervalId !== null) {
          clearInterval(intervalId);
          intervalId = null;
        }
      } else {
        // Returned to tab: clean immediate update, then resume timer
        loadMarketQuotes(false);
        startPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalId !== null) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isStreaming, loadMarketQuotes]);

  // SEC EDGAR 8-K Regulatory Filings Polling (every 60s, pauses if tab hidden)
  useEffect(() => {
    const secInterval = setInterval(() => {
      if (!document.hidden) {
        loadSec8kFilings();
      }
    }, 60000);
    return () => clearInterval(secInterval);
  }, [loadSec8kFilings]);

  // Persist preferences
  const handleUpdatePreferences = (newPrefs: AlertPreferences) => {
    preferencesVersionRef.current++;
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

  // Push Engine Subscriptions (For browser notifications: beats/misses, 52w high/low, >5% moves)
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

  const handleSetSubscriptions = (tickers: string[]) => {
    handleUpdatePreferences({
      ...preferences,
      subscribedTickers: tickers
    });
  };

  // News Agent Tickers (Synchronized with online PostgreSQL database)
  const handleToggleNewsAgentTicker = (ticker: string) => {
    const upper = ticker.toUpperCase().trim();
    const willEnable = !newsAgentTickers.includes(upper);
    const next = willEnable 
      ? [...newsAgentTickers, upper] 
      : newsAgentTickers.filter(t => t !== upper);
    
    setNewsAgentTickers(next);
    localStorage.setItem('veritas_news_agent_linked_tickers', JSON.stringify(next));

    // Synchronize alert toggle with backend PostgreSQL database for News Agent
    fetch('/api/v1/alerts/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker: upper, enabled: willEnable })
    }).catch(() => {});
  };

  const handleSetNewsAgentTickers = (tickers: string[]) => {
    setNewsAgentTickers(tickers);
    localStorage.setItem('veritas_news_agent_linked_tickers', JSON.stringify(tickers));
  };

  const handleCheckRecentSecFiling = useCallback(async (ticker: string): Promise<string> => {
    const sym = ticker.toUpperCase().trim();
    const activePreferences = preferencesRef.current;
    if (!activePreferences.subscribedTickers.some(value => value.toUpperCase().trim() === sym)) {
      return 'Select ' + sym + ' in alert settings before checking its SEC filings.';
    }
    if (!(activePreferences.alertOnSec8K ?? activePreferences.alertOnRelease ?? true) && !(activePreferences.alertOnRelease ?? true)) {
      return 'SEC and financial-results alerts are disabled in alert settings.';
    }
    const preferenceVersion = preferencesVersionRef.current;
    try {
      const response = await fetch('/api/sec-8k-filings?symbols=' + encodeURIComponent(sym));
      if (!response.ok) return 'SEC EDGAR request failed with HTTP ' + response.status + '.';
      const payload = await response.json();
      if (!payload?.success || !Array.isArray(payload.filings)) return 'SEC EDGAR could not return filings for ' + sym + '.';
      if (preferenceVersion !== preferencesVersionRef.current || !preferencesRef.current.subscribedTickers.some(value => value.toUpperCase().trim() === sym)) {
        return 'Alert settings changed during the check. Run it again with the current selection.';
      }
      if (Array.isArray(payload.unavailableSymbols) && payload.unavailableSymbols.includes(sym)) {
        return 'SEC company coverage is not configured for ' + sym + '.';
      }
      if (Array.isArray(payload.failedSymbols) && payload.failedSymbols.includes(sym)) {
        return 'SEC EDGAR could not be reached for ' + sym + '. Try again shortly.';
      }
      const freshFilings = payload.filings.filter((filing: any) => filing.ticker?.toUpperCase() === sym && isFreshSecAcceptance(filing.acceptanceDateTime));
      if (freshFilings.length === 0) return 'No Form 8-K has been accepted for ' + sym + ' in the last 10 minutes.';
      const count = dispatchSecFilings(freshFilings, preferencesRef.current);
      return count > 0
        ? 'A fresh SEC Form 8-K was added to notifications for ' + sym + '.'
        : 'The fresh SEC accession was already notified, or its alert preference is disabled.';
    } catch {
      return 'SEC EDGAR is temporarily unavailable. Try again shortly.';
    }
  }, [dispatchSecFilings]);

  const handleMarkAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    handleSaveNotifications(updated);
  };

  const handleClearNotifications = () => {
    handleSaveNotifications([]);
  };

  const handleSelectTickerFromPill = useCallback((sym: string) => {
    const rawSym = (sym || '').trim().toUpperCase();
    const commodityMap: Record<string, string> = {
      'WTI': 'wti-crude', 'CL': 'wti-crude',
      'BRENT': 'brent-crude', 'BZ': 'brent-crude',
      'TTF': 'dutch-ttf',
      'NG': 'henry-hub', 'HENRY-HUB': 'henry-hub',
      'JKM': 'jkm-lng',
      'MRBC': 'murban-crude',
      'OQD': 'oman-crude',
      'MURBAN': 'murban-crude',
      'GOLD': 'gold', 'GC': 'gold', 'XAU': 'gold',
      'SILVER': 'silver', 'SI': 'silver', 'XAG': 'silver',
      'COPPER': 'copper', 'HG': 'copper',
      'URANIUM': 'uranium',
      'LITHIUM': 'lithium',
      'WHEAT': 'milling-wheat',
      'CORN': 'corn',
      'INE-SC': 'shanghai-crude',
      'RBOB': 'rbob-gasoline',
      'HO': 'heating-oil'
    };

    if (commodityMap[rawSym]) {
      setSelectedCommodityId(commodityMap[rawSym]);
      setActiveTab('commodities');
      return;
    }

    const bondMap: Record<string, string> = {
      'US10Y': 'us-10y-treasury',
      'US2Y': 'us-2y-treasury',
      'US30Y': 'us-30y-treasury',
      'US30YMORT': 'us-30y-mortgage',
      'US30YFRM': 'us-30y-mortgage',
      'CN10Y': 'cn-10y-cgb',
      'CN30Y': 'cn-30y-cgb',
      'DE10Y': 'de-10y-bund',
      'DE30Y': 'de-30y-bund',
      'JP10Y': 'jp-10y-jgb',
      'JP30Y': 'jp-30y-jgb',
      'GB10Y': 'gb-10y-gilt',
      'GB30Y': 'gb-30y-gilt',
      'FR10Y': 'fr-10y-oat',
      'FR30Y': 'fr-30y-oat',
      'IT10Y': 'it-10y-btp',
      'IT30Y': 'it-30y-btp',
      'ES10Y': 'es-10y-bonos',
      'ES30Y': 'es-30y-bonos'
    };

    if (bondMap[rawSym]) {
      setSelectedBondId(bondMap[rawSym]);
      setActiveTab('bonds');
      return;
    }

    const matched = results.find(r => r.ticker === rawSym);
    if (matched) {
      setSelectedResultForModal(matched);
      return;
    }

    // If company exists in TECH_COMPANIES or SHOVEL_SELLERS_COMPANIES, generate modal view
    const meta = TECH_COMPANIES[rawSym] || (SHOVEL_SELLERS_COMPANIES as any)[rawSym] || (HYPERSCALER_COMPANIES as any)[rawSym];
    if (meta) {
      const q = quotes[rawSym];
      const livePrice = q ? q.price : meta.currentPrice;
      const syntheticResult: QuarterlyResult = {
        id: `shovel-selected-${rawSym}`,
        ticker: rawSym,
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
      };
      setSelectedResultForModal(syntheticResult);
    }
  }, [results, quotes]);

  const handleNavigateAsset = useCallback((target: { type: 'equity' | 'commodity' | 'bond'; symbol: string; targetId?: string }) => {
    if (target.type === 'bond') {
      if (target.targetId) {
        setSelectedBondId(target.targetId);
      }
      setActiveTab('bonds');
      return;
    }
    if (target.type === 'commodity') {
      if (target.targetId) {
        setSelectedCommodityId(target.targetId);
      }
      setActiveTab('commodities');
      return;
    }
    // Equity
    handleSelectTickerFromPill(target.symbol);
  }, [handleSelectTickerFromPill]);

  const handleOpenNotification = useCallback((ticker: string, notification?: PushNotificationItem) => {
    const symbol = ticker.toUpperCase().trim();
    const asset = notification?.type === 'asset-volatility'
      ? notificationAssetCatalog.find(item => item.symbol.toUpperCase() === symbol)
        || (notification.metadata?.providerSymbol
          ? notificationAssetCatalog.find(item => item.providerSymbol?.toUpperCase() === notification.metadata?.providerSymbol?.toUpperCase())
          : undefined)
      : undefined;
    if (asset) {
      if (asset.routeKind === 'global-index') {
        setSelectedGlobalMarketSymbol(asset.providerSymbol || asset.symbol);
        setGlobalMarketSelectionRequestId(value => value + 1);
        return;
      }
      if (asset.routeKind === 'sector') {
        setSelectedSectorAssetSymbol(asset.symbol);
        setSectorAssetSelectionRequestId(value => value + 1);
        setActiveTab('sectors');
        return;
      }
      if (asset.routeKind === 'commodity') {
        if (asset.targetId) setSelectedCommodityId(asset.targetId);
        setActiveTab('commodities');
        return;
      }
      if (asset.routeKind === 'bond') {
        if (asset.targetId) setSelectedBondId(asset.targetId);
        setActiveTab('bonds');
        return;
      }
    }
    const result = results.find(item => item.ticker.toUpperCase() === symbol);
    if (result) {
      setSelectedResultForModal(result);
      return;
    }
    setSearchQuery(symbol);
    setActiveTab('jpmorgan');
  }, [notificationAssetCatalog, results]);

  // Manual DMA notifications use only a selected stock's fresh quote and verified provider metric.
  const handleTriggerTechnicalAlert = useCallback((ticker: string): string => {
    const sym = ticker.toUpperCase().trim();
    const activePreferences = preferencesRef.current;
    if (!activePreferences.subscribedTickers.some(value => value.toUpperCase().trim() === sym)) return 'No alert: select this stock in alert settings first.';
    if (activePreferences.alertOnDmaBreakdown === false) return 'No alert: verified 200-day breakdown alerts are disabled.';
    const quote = resolveLiveQuote(sym, quotesRef.current);
    if (!quote) return 'No alert: there is no provider quote for ' + sym + '.';
    const eligible = getEligibleMarketQuote(quote);
    if (!eligible) return 'No alert: the source trade must be no more than 2 minutes old, report no provider delay, and fall inside the exact regular session.';
    const dma = quote.twoHundredDayAverage;
    if (quote.isTwoHundredDayAverageVerified !== true || !Number.isFinite(dma) || (dma as number) <= 0) return 'No alert: a sufficiently sourced 200-day average is unavailable.';
    if (eligible.price >= (dma as number)) return 'No alert: the fresh price is not below the verified 200-day average.';
    const diffPct = ((eligible.price - (dma as number)) / (dma as number)) * 100;
    const currency = getCurrencySymbol(quote.currency);
    const dedupeKey = 'DMA_BREAKDOWN:' + sym + ':' + eligible.sessionDate;
    const dispatched = dispatchPushNotification({
      ticker: sym,
      companyName: quote.companyName || TECH_COMPANIES[sym]?.name || sym,
      title: sym + ' - Verified 200-Day Moving Average Breakdown (' + diffPct.toFixed(2) + '%)',
      body: sym + ' is below its provider-verified 200-day average during the regular session. Live price: ' + currency + eligible.price.toFixed(2) + '; 200-day average: ' + currency + (dma as number).toFixed(2) + '.',
      type: 'dma-breakdown',
      dedupeKey,
      eventOccurredAt: quote.providerTradeTimestamp,
      source: quote.provider || 'Yahoo Finance quote feed',
      tradingDate: eligible.sessionDate,
      metrics: { priceMove: diffPct },
      metadata: { currentPrice: eligible.price, source: quote.provider || 'Yahoo Finance quote feed' }
    }, activePreferences, (newNotif) => {
      setNotifications(prev => {
        const next = [newNotif, ...prev];
        saveNotifications(next);
        return next;
      });
      setActiveToast(newNotif);
    });
    return dispatched ? 'Verified 200-day breakdown alert added.' : 'No alert: this exchange-day event was already notified.';
  }, []);

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
        onViewDetails={handleOpenNotification}
      />

      {/* Institutional Soft Corporate Header */}
      <CorporateHeader
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
        onRequestBrowserPermission={handleRequestBrowserPermission}
        browserPermission={browserPermission}
        notifications={notifications}
        onOpenNotifications={() => setIsNotificationCenterOpen(true)}
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
        {/* Global Markets Live World Map & Session Status Display */}
        <GlobalMarketsMap selectedTicker={selectedGlobalMarketSymbol} selectionRequestId={globalMarketSelectionRequestId} />

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

            {/* 6. Global Markets News Agent */}
            <button
              id="tab-globalnewsagent"
              onClick={() => setActiveTab('globalnewsagent')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer font-medium ${
                activeTab === 'globalnewsagent' 
                  ? 'bg-[#002d62] text-cyan-300 shadow-2xs font-bold border border-cyan-700' 
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white/60'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Global News Agent</span>
            </button>

            {/* 7. S&P Sectors & Thematic ETFs Desk */}
            <button
              id="tab-sectors"
              onClick={() => setActiveTab('sectors')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer font-medium ${
                activeTab === 'sectors' 
                  ? 'bg-[#002d62] text-cyan-300 shadow-2xs font-bold border border-cyan-700' 
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white/60'
              }`}
            >
              <PieChart className="w-3.5 h-3.5 text-cyan-400" />
              <span>S&P Sectors & ETFs</span>
            </button>
          </div>

          {/* Institutional Alert Protocol Status Banner */}
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-white border border-slate-200/90 px-3.5 py-1.5 rounded-xl shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-700 font-mono-code text-[11px]">PUSH ENGINE:</span>
            <strong className="text-slate-900 font-mono-code font-bold text-[11px]">
              {preferences.subscribedTickers.length} Tickers Subscribed
            </strong>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-slate-700 hover:text-slate-900 hover:underline flex items-center gap-1 cursor-pointer font-semibold text-[11px]"
            >
              <span>Notificatie Instellingen</span>
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
            selectedBondId={selectedBondId}
            onSelectBondId={setSelectedBondId}
          />
        )}

        {/* Tab 2: Classic Consensus vs Actual Matrix */}
        {activeTab === 'matrix' && (
          <EarningsTableView
            // The consensus matrix owns its search and sector filters so that
            // the shared desk header cannot hide covered companies.
            results={matrixResults}
            onRefresh={() => loadQuarterlySnapshot(true)}
            isLoading={isConsensusLoading}
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
            subscribedTickers={preferences.subscribedTickers}
            onToggleSubscription={handleToggleSubscription}
          />
        )}

        {/* Tab 4: Commodities & Energy Outlook */}
        {activeTab === 'commodities' && (
          <CommoditiesSection
            quotes={quotes}
            recentTicks={recentTicks}
            onRefreshQuotes={() => loadMarketQuotes(true)}
            isLoadingQuotes={isQuotesLoading}
            selectedCommodityId={selectedCommodityId}
            onSelectCommodityId={setSelectedCommodityId}
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

        {/* Tab 6: Autonomous Global Markets News Agent */}
        {activeTab === 'globalnewsagent' && (
          <GlobalNewsAgentView
            subscribedTickers={newsAgentTickers}
            onToggleSubscription={handleToggleNewsAgentTicker}
            onSetSubscriptions={handleSetNewsAgentTickers}
            onSelectTicker={handleSelectTickerFromPill}
            onNavigateToAsset={handleNavigateAsset}
          />
        )}

        {/* Tab 7: S&P 500 Macro Sectors & Thematic Industry ETFs Desk */}
        {activeTab === 'sectors' && (
          <SPSectorsAndEtfsView
            quotes={quotes}
            recentTicks={recentTicks}
            onSelectTicker={handleSelectTickerFromPill}
            onRefreshQuotes={() => loadMarketQuotes(true)}
            isLoadingQuotes={isQuotesLoading}
            selectedAssetSymbol={selectedSectorAssetSymbol}
            assetSelectionRequestId={sectorAssetSelectionRequestId}
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
          </div>
        </div>
      </footer>

      {/* Modals */}
      {selectedResultForModal?.consensusMatrix && (
        <ConsensusCompanyModal
          result={matrixResults.find(row => row.ticker === selectedResultForModal.ticker) || selectedResultForModal}
          quote={quotes[selectedResultForModal.ticker]}
          onClose={() => setSelectedResultForModal(null)}
        />
      )}
      {selectedResultForModal && !selectedResultForModal.consensusMatrix && (
        <CompanyDetailModal
          key={`company-modal-${selectedResultForModal.ticker}`}
          result={selectedResultForModal}
          quote={resolveLiveQuote(selectedResultForModal.ticker, quotes)}
          onClose={() => setSelectedResultForModal(null)}
          onCheckRecentSecFiling={handleCheckRecentSecFiling}
          preferences={preferences}
        />
      )}

      {isNotificationCenterOpen && (
        <NotificationCenterModal
          notifications={notifications}
          onClose={() => setIsNotificationCenterOpen(false)}
          onMarkAllAsRead={handleMarkAllAsRead}
          onClearNotifications={handleClearNotifications}
          onSelectTicker={handleOpenNotification}
        />
      )}

      {isSettingsOpen && (
        <AlertSettingsModal
          preferences={preferences}
          onUpdatePreferences={handleUpdatePreferences}
          browserPermission={browserPermission}
          onRequestBrowserPermission={handleRequestBrowserPermission}
          secFeedStatus={secFeedStatus}
          stockQuoteFeedStatus={stockQuoteFeedStatus}
          notificationAssets={notificationAssetCatalog}
          assetFeedStatus={assetFeedStatus}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* McKinsey Blue Consultation Bubble (Screenshot 2 Floating Action) */}
      <FloatingAdvisoryBubble />
    </div>
  );
}
