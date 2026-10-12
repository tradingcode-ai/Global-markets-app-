import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Bell, BellOff, CalendarDays, CalendarRange, Check, ChevronLeft, ChevronRight, Clock3, LoaderCircle, RefreshCw, Search } from 'lucide-react';
import { NOTIFICATION_APP_STOCKS, AppStockMeta } from '../data/allAppStocks';
import { StockLogo } from './StockLogo';
import { fetchLiveEarningsCalendar } from '../services/marketDataService';
import {
  addDaysToDateKey,
  EarningsCalendarSession,
  EarningsDateConfidence,
  addMonthsToDateKey,
  getMonthGridDateKeys,
  getMonthStartForDateKey,
  getLocalDateKey,
  getUpcomingWeekStart,
  getWeekStartForDateKey,
  getWeekdayDateKeys,
  isCalendarDateKey,
  LiveEarningsDateData,
  providerDatesOverlapRange,
  providerDatesOverlapWeek
} from '../services/earningsCalendarRules';

interface EarningsCalendarViewProps {
  subscribedTickers: string[];
  onToggleSubscription: (ticker: string) => void;
}

interface CalendarLoadProgress {
  completed: number;
  total: number;
}

interface ScheduleGroup {
  key: string;
  providerSymbol: string;
  providerName: string;
  providerDates: string[];
  dateConfidence: EarningsDateConfidence;
  reportTime: EarningsCalendarSession;
  timeZone?: string;
  checkedAt?: string;
  lastCheckedAt?: string;
  cached?: boolean;
  stocks: AppStockMeta[];
}

type CalendarViewMode = 'MONTH' | 'WEEK';
type PageDirection = 'previous' | 'next' | 'none';
const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SESSION_ORDER: EarningsCalendarSession[] = ['BMO', 'AMC', 'UNKNOWN'];
const SESSION_LABEL: Record<EarningsCalendarSession, string> = {
  BMO: 'Before market open',
  AMC: 'After market close',
  UNKNOWN: 'Report time not provided'
};

function dateFromKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function formatDate(dateKey: string, options: Intl.DateTimeFormatOptions): string {
  return dateFromKey(dateKey).toLocaleDateString(undefined, options);
}

function formatCheckedAt(value?: string): string | undefined {
  if (!value) return undefined;
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return undefined;
  return new Date(time).toLocaleString();
}

function confidenceLabel(confidence: EarningsDateConfidence, dateCount: number): string {
  if (confidence === 'CONFIRMED') return 'Yahoo marks date as confirmed';
  if (confidence === 'ESTIMATED') return dateCount > 1 ? 'Yahoo estimated date window' : 'Yahoo marks date as estimated';
  return 'Yahoo did not provide date confidence';
}

function groupScheduledStocks(stocks: AppStockMeta[], calendar: Record<string, LiveEarningsDateData>): ScheduleGroup[] {
  const groups = new Map<string, ScheduleGroup>();
  for (const stock of stocks) {
    const item = calendar[stock.ticker];
    if (!item || item.coverage !== 'SCHEDULED' || !item.providerDates.length) continue;
    const providerSymbol = item.providerSymbol || stock.ticker;
    const key = [providerSymbol, item.providerDates.join(','), item.reportTime].join('|');
    const group = groups.get(key);
    if (group) {
      group.stocks.push(stock);
      continue;
    }
    groups.set(key, {
      key,
      providerSymbol,
      providerName: item.providerName || stock.name,
      providerDates: item.providerDates,
      dateConfidence: item.dateConfidence,
      reportTime: item.reportTime,
      timeZone: item.timeZone,
      checkedAt: item.checkedAt,
      lastCheckedAt: item.lastCheckedAt,
      cached: item.cached,
      stocks: [stock]
    });
  }
  return [...groups.values()].sort((left, right) => left.providerDates[0].localeCompare(right.providerDates[0]) || left.providerSymbol.localeCompare(right.providerSymbol));
}

export const EarningsCalendarView: React.FC<EarningsCalendarViewProps> = ({ subscribedTickers, onToggleSubscription }) => {
  const [calendar, setCalendar] = useState<Record<string, LiveEarningsDateData>>({});
  const [progress, setProgress] = useState<CalendarLoadProgress>({ completed: 0, total: NOTIFICATION_APP_STOCKS.length });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<CalendarViewMode>('MONTH');
  const [monthStart, setMonthStart] = useState(() => getMonthStartForDateKey(getLocalDateKey(new Date())));
  const [weekStart, setWeekStart] = useState(() => getUpcomingWeekStart(new Date()));
  const [pageDirection, setPageDirection] = useState<PageDirection>('none');
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [expandedMonthDate, setExpandedMonthDate] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All stocks');
  const [lastCalendarCheck, setLastCalendarCheck] = useState<string | undefined>();
  const requestRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const inFlightRef = useRef(false);
  const hasCalendarRef = useRef(false);
  const lastCheckMsRef = useRef(0);

  const loadCalendar = useCallback(async (forceRefresh = false) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    requestRef.current = controller;
    setIsLoading(!hasCalendarRef.current && !forceRefresh);
    setIsRefreshing(forceRefresh);
    setIsChecking(true);
    setLoadError(undefined);
    setProgress({ completed: 0, total: NOTIFICATION_APP_STOCKS.length });

    try {
      const symbols = NOTIFICATION_APP_STOCKS.map(stock => stock.ticker);
      const result = await fetchLiveEarningsCalendar(symbols, {
        forceRefresh,
        signal: controller.signal,
        onBatch: batch => {
          if (requestIdRef.current !== requestId) return;
          setCalendar(previous => ({ ...previous, ...batch }));
          hasCalendarRef.current = true;
          lastCheckMsRef.current = Date.now();
          setProgress(previous => ({ completed: Math.min(previous.total, previous.completed + Object.keys(batch).length), total: previous.total }));
          setLastCalendarCheck(new Date().toISOString());
        }
      });
      if (requestIdRef.current === requestId && !controller.signal.aborted) {
        setCalendar(previous => ({ ...previous, ...result }));
        if (Object.keys(result).length < symbols.length) {
          setLoadError('Calendar loading stopped before all app equities were checked. Retry to continue.');
        }
      }
    } catch {
      if (requestIdRef.current === requestId && !controller.signal.aborted) {
        setLoadError('The Yahoo calendar could not be reached. Existing provider results are still shown.');
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsChecking(false);
        lastCheckMsRef.current = Date.now();
        setLastCalendarCheck(new Date().toISOString());
      }
      if (requestRef.current === controller) {
        requestRef.current = null;
        inFlightRef.current = false;
      }
    }
  }, []);

  useEffect(() => {
    if (!document.hidden) void loadCalendar(false);
    const interval = window.setInterval(() => {
      if (!document.hidden) void loadCalendar(false);
    }, 30 * 60 * 1000);
    const onVisibilityChange = () => {
      if (!document.hidden && (!hasCalendarRef.current || Date.now() - lastCheckMsRef.current >= 25 * 60 * 1000)) {
        void loadCalendar(false);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      requestIdRef.current += 1;
      requestRef.current?.abort();
      requestRef.current = null;
      inFlightRef.current = false;
    };
  }, [loadCalendar]);

  const categories = useMemo(() => ['All stocks', ...new Set(NOTIFICATION_APP_STOCKS.map(stock => stock.categoryLabel).sort((a, b) => a.localeCompare(b)))], []);
  const visibleStocks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return NOTIFICATION_APP_STOCKS.filter(stock => {
      if (categoryFilter !== 'All stocks' && stock.categoryLabel !== categoryFilter) return false;
      if (!normalizedSearch) return true;
      return `${stock.ticker} ${stock.name} ${stock.categoryLabel}`.toLowerCase().includes(normalizedSearch);
    });
  }, [categoryFilter, search]);

  const weekDates = useMemo(() => getWeekdayDateKeys(weekStart), [weekStart]);
  const monthGridDates = useMemo(() => getMonthGridDateKeys(monthStart), [monthStart]);
  const monthGridStart = monthGridDates[0];
  const monthGridEnd = monthGridDates[monthGridDates.length - 1];
  const scheduleGroups = useMemo(() => groupScheduledStocks(visibleStocks, calendar), [calendar, visibleStocks]);
  const windowGroups = scheduleGroups.filter(group => group.providerDates.length > 1 && providerDatesOverlapWeek(group.providerDates, weekStart));
  const monthWindowGroups = scheduleGroups.filter(group => group.providerDates.length > 1 && providerDatesOverlapRange(group.providerDates, monthGridStart, monthGridEnd));
  const monthDayGroups = scheduleGroups.filter(group => group.providerDates.length === 1 && group.providerDates[0] >= monthGridStart && group.providerDates[0] <= monthGridEnd);
  const dayGroups = scheduleGroups.filter(group => group.providerDates.length === 1 && group.providerDates[0] >= weekDates[0] && group.providerDates[0] <= weekDates[4]);
  const weekendDateKeys = [addDaysToDateKey(weekStart, 5), addDaysToDateKey(weekStart, 6)];
  const weekendGroups = scheduleGroups.filter(group => group.providerDates.length === 1 && weekendDateKeys.includes(group.providerDates[0]));
  const todayKey = getLocalDateKey(new Date());
  const nextScheduledWeek = scheduleGroups
    .flatMap(group => group.providerDates)
    .filter(date => isCalendarDateKey(date) && date >= todayKey)
    .sort((left, right) => left.localeCompare(right))[0];
  const currentPageStart = viewMode === 'MONTH' ? monthStart : weekStart;
  const nextScheduledPageStart = nextScheduledWeek
    ? viewMode === 'MONTH' ? getMonthStartForDateKey(nextScheduledWeek) : getWeekStartForDateKey(nextScheduledWeek)
    : undefined;
  const shownDayGroups = viewMode === 'MONTH' ? monthDayGroups : dayGroups;
  const shownWindowGroups = viewMode === 'MONTH' ? monthWindowGroups : windowGroups;
  const currentPageHasEvents = shownDayGroups.length > 0 || shownWindowGroups.length > 0 || (viewMode === 'WEEK' && weekendGroups.length > 0);
  const currentMonthKey = getMonthStartForDateKey(getLocalDateKey(new Date()));
  const checkedAtValues = Object.values(calendar).map(item => item.lastCheckedAt || item.checkedAt).filter(Boolean).sort();
  const newestCheck = checkedAtValues[checkedAtValues.length - 1] || lastCalendarCheck;
  const sourceRetrievalValues = Object.values(calendar)
    .filter(item => item.coverage !== 'UNAVAILABLE' && item.coverage !== 'UNSUPPORTED')
    .map(item => item.checkedAt).filter(Boolean).sort();
  const newestRetrieval = sourceRetrievalValues[sourceRetrievalValues.length - 1];
  const completedCount = Object.keys(calendar).length;
  const visibleCheckedCount = visibleStocks.filter(stock => Boolean(calendar[stock.ticker])).length;
  const coverageCounts = useMemo(() => {
    const counts = { scheduled: 0, noDate: 0, unavailable: 0, unsupported: 0, identityMismatch: 0 };
    for (const stock of visibleStocks) {
      const item = calendar[stock.ticker];
      if (!item) continue;
      if (item.coverage === 'SCHEDULED') counts.scheduled += 1;
      else if (item.coverage === 'NO_DATE') counts.noDate += 1;
      else if (item.coverage === 'UNSUPPORTED') counts.unsupported += 1;
      else if (item.coverage === 'IDENTITY_MISMATCH') counts.identityMismatch += 1;
      else counts.unavailable += 1;
    }
    return counts;
  }, [calendar, visibleStocks]);

  const renderStockChips = (group: ScheduleGroup) => (
    <div className="mt-3 flex flex-wrap gap-2">
      {group.stocks.map(stock => {
        const subscribed = subscribedTickers.includes(stock.ticker);
        return (
          <div key={stock.ticker} className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-1.5">
            <StockLogo ticker={stock.ticker} size="sm" className="shrink-0" />
            <div className="min-w-0">
              <div className="font-mono text-xs font-bold text-slate-100">{stock.ticker}</div>
              <div className="max-w-32 truncate text-[10px] text-slate-400">{stock.name}</div>
            </div>
            <button
              type="button"
              onClick={() => onToggleSubscription(stock.ticker)}
              aria-label={`${subscribed ? 'Remove' : 'Add'} ${stock.ticker} ${subscribed ? 'from' : 'to'} the alert watchlist`}
              title={subscribed ? 'Remove from alert watchlist' : 'Add to alert watchlist'}
              className={`rounded-md border p-1.5 transition ${subscribed ? 'border-emerald-600/70 bg-emerald-950/70 text-emerald-300 hover:bg-emerald-900' : 'border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-500 hover:text-slate-100'}`}
            >
              {subscribed ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
            </button>
          </div>
        );
      })}
    </div>
  );

  const renderEventCard = (group: ScheduleGroup, windowed = false) => {
    const firstDate = group.providerDates[0];
    const lastDate = group.providerDates[group.providerDates.length - 1];
    const past = lastDate < todayKey;
    return (
      <article key={group.key} className="rounded-xl border border-slate-700 bg-slate-900/90 p-3 shadow-lg shadow-black/10">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold text-slate-100">{group.providerName}</div>
            <div className="mt-1 font-mono text-[10px] text-slate-400">Yahoo listing {group.providerSymbol}</div>
          </div>
          <span className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-bold ${group.reportTime === 'BMO' ? 'border-sky-800 bg-sky-950/70 text-sky-200' : group.reportTime === 'AMC' ? 'border-amber-800 bg-amber-950/60 text-amber-200' : 'border-slate-700 bg-slate-800 text-slate-300'}`}>
            {group.reportTime}
          </span>
        </div>
        <div className="mt-3 flex items-start gap-2 text-xs text-slate-200">
          {windowed ? <CalendarRange className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" /> : <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />}
          <div>
            {windowed
              ? <div className="font-semibold">{firstDate} - {lastDate}</div>
              : <div className="font-semibold">{formatDate(firstDate, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>}
            <div className="mt-1 text-[10px] text-slate-400">{confidenceLabel(group.dateConfidence, group.providerDates.length)}</div>
            {past && <div className="mt-1 text-[10px] text-amber-300">Past date supplied by Yahoo; no future date is available in this response.</div>}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
          <Clock3 className="h-3 w-3" />
          <span>{SESSION_LABEL[group.reportTime]}</span>
          {group.timeZone && <span className="truncate">| {group.timeZone}</span>}
        </div>
        {renderStockChips(group)}
        <details className="mt-3 border-t border-slate-800 pt-2 text-[10px] text-slate-500">
          <summary className="cursor-pointer select-none text-slate-400 hover:text-slate-200">Yahoo source details</summary>
          <div className="mt-2 space-y-1.5">
            <div>Provider dates: {group.providerDates.join(', ')}</div>
            <div>Date confidence: {group.dateConfidence.toLowerCase()}{group.cached ? ' (cached response)' : ''}</div>
            {group.checkedAt && <div>Yahoo response retrieved: {formatCheckedAt(group.checkedAt)}</div>}
            {group.lastCheckedAt && <div>Last source check: {formatCheckedAt(group.lastCheckedAt)}</div>}
            <a className="inline-flex text-sky-300 hover:text-sky-200" href={`https://finance.yahoo.com/quote/${encodeURIComponent(group.providerSymbol)}/`} target="_blank" rel="noreferrer">Open Yahoo listing</a>
          </div>
        </details>
      </article>
    );
  };

  const unavailableStocks = visibleStocks.filter(stock => {
    const coverage = calendar[stock.ticker]?.coverage;
    return coverage === 'NO_DATE' || coverage === 'UNAVAILABLE' || coverage === 'UNSUPPORTED' || coverage === 'IDENTITY_MISMATCH';
  });
  const movePage = (offset: number) => {
    setPageDirection(offset < 0 ? 'previous' : 'next');
    setSelectedDate(undefined);
    setExpandedMonthDate(undefined);
    if (viewMode === 'MONTH') setMonthStart(date => addMonthsToDateKey(date, offset));
    else setWeekStart(date => addDaysToDateKey(date, offset * 7));
  };
  const goToCurrentPeriod = () => {
    setPageDirection('none');
    setSelectedDate(undefined);
    setExpandedMonthDate(undefined);
    if (viewMode === 'MONTH') setMonthStart(currentMonthKey);
    else setWeekStart(getUpcomingWeekStart(new Date()));
  };
  const goToNextScheduledPeriod = () => {
    if (!nextScheduledPageStart) return;
    setPageDirection(nextScheduledPageStart < currentPageStart ? 'previous' : 'next');
    setSelectedDate(undefined);
    setExpandedMonthDate(undefined);
    if (viewMode === 'MONTH') setMonthStart(nextScheduledPageStart);
    else setWeekStart(nextScheduledPageStart);
  };
  const changeViewMode = (mode: CalendarViewMode) => {
    const contextDate = selectedDate || (viewMode === 'MONTH' ? monthStart : weekStart);
    if (mode === 'WEEK') setWeekStart(getWeekStartForDateKey(contextDate));
    else setMonthStart(getMonthStartForDateKey(contextDate));
    setPageDirection('none');
    setSelectedDate(undefined);
    setExpandedMonthDate(undefined);
    setViewMode(mode);
  };

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1220] text-slate-100 shadow-xl shadow-slate-950/20" aria-labelledby="earnings-calendar-title">
      <header className="border-b border-slate-800 bg-gradient-to-r from-[#101b2d] via-[#111b2b] to-[#0d1726] px-5 py-5 md:px-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300">
              <CalendarDays className="h-4 w-4" />
              Yahoo Finance calendar source
            </div>
            <h2 id="earnings-calendar-title" className="text-xl font-semibold tracking-tight text-white md:text-2xl">Earnings calendar</h2>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-400">Provider-dated events for the {NOTIFICATION_APP_STOCKS.length} equities represented in Global Markets. Dates, estimate status, and report session are shown only when Yahoo supplies them.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Calendar view" className="flex rounded-lg border border-slate-700 bg-slate-950 p-1">
              {(['MONTH', 'WEEK'] as const).map(mode => <button key={mode} type="button" aria-pressed={viewMode === mode} onClick={() => changeViewMode(mode)} className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold ${viewMode === mode ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-100'}`}>{mode === 'MONTH' ? 'Month' : 'Week'}</button>)}
            </div>
            <button type="button" onClick={goToCurrentPeriod} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800">Today / current {viewMode === 'MONTH' ? 'month' : 'week'}</button>
            <button type="button" onClick={() => void loadCalendar(true)} disabled={isChecking} className="inline-flex items-center gap-2 rounded-lg border border-sky-700/80 bg-sky-950/60 px-3 py-2 text-xs font-semibold text-sky-100 transition hover:bg-sky-900/70 disabled:cursor-wait disabled:opacity-60">
              {isChecking ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {isRefreshing ? 'Refreshing Yahoo...' : isChecking ? 'Checking Yahoo...' : 'Refresh from Yahoo'}
            </button>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" aria-label={`Previous ${viewMode.toLowerCase()}`} onClick={() => movePage(-1)} className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-300 hover:bg-slate-800"><ChevronLeft className="h-4 w-4" /></button>
            <div className="min-w-48 text-center text-sm font-semibold text-slate-100">
              {viewMode === 'MONTH'
                ? formatDate(monthStart, { month: 'long', year: 'numeric' })
                : `${formatDate(weekDates[0], { month: 'short', day: 'numeric' })} - ${formatDate(weekDates[4], { month: 'short', day: 'numeric', year: 'numeric' })}`}
            </div>
            <button type="button" aria-label={`Next ${viewMode.toLowerCase()}`} onClick={() => movePage(1)} className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-300 hover:bg-slate-800"><ChevronRight className="h-4 w-4" /></button>
            {nextScheduledPageStart && nextScheduledPageStart !== currentPageStart && <button type="button" onClick={goToNextScheduledPeriod} className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-[10px] font-semibold text-sky-200 hover:bg-slate-800">Next scheduled {viewMode.toLowerCase()}</button>}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search ticker or company" aria-label="Search calendar stocks" className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-700 sm:w-56" />
            </label>
            <select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)} aria-label="Filter calendar by stock category" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-700">
              {categories.map(category => <option key={category}>{category}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-800/80 pt-3 text-[10px] text-slate-400">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />{coverageCounts.scheduled} with provider dates</span>
          <span>{coverageCounts.noDate} checked with no Yahoo date</span>
          <span>{coverageCounts.unavailable + coverageCounts.identityMismatch + coverageCounts.unsupported} unavailable or unsupported</span>
          <span>{visibleCheckedCount}/{visibleStocks.length} checked in current filter</span>
          {newestRetrieval && <span>Yahoo response retrieved {formatCheckedAt(newestRetrieval)}</span>}
          {newestCheck && <span>Last checked {formatCheckedAt(newestCheck)}</span>}
          {isRefreshing && <span className="text-sky-300">Yahoo refresh requested.</span>}
        </div>
      </header>

      <div className="space-y-5 p-4 md:p-6">
        <style>{`@keyframes earnings-calendar-next { from { opacity: .7; transform: translateX(14px); } to { opacity: 1; transform: translateX(0); } } @keyframes earnings-calendar-previous { from { opacity: .7; transform: translateX(-14px); } to { opacity: 1; transform: translateX(0); } } .earnings-calendar-page-next { animation: earnings-calendar-next 150ms ease-out both; } .earnings-calendar-page-previous { animation: earnings-calendar-previous 150ms ease-out both; } @media (prefers-reduced-motion: reduce) { .earnings-calendar-page-next, .earnings-calendar-page-previous { animation: none !important; } }`}</style>
        {loadError && <div role="alert" className="flex items-start gap-2 rounded-lg border border-amber-800/70 bg-amber-950/35 px-3 py-2.5 text-xs text-amber-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{loadError}</div>}
        {isChecking && (
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs text-slate-300" role="status">
            <LoaderCircle className="h-4 w-4 animate-spin text-sky-300" />
            Updating {progress.completed} of {NOTIFICATION_APP_STOCKS.length} companies. Results appear as Yahoo responds.
          </div>
        )}

        <div key={`${viewMode}-${currentPageStart}`} className={pageDirection === 'none' ? '' : `earnings-calendar-page-${pageDirection}`}>
        {shownWindowGroups.length > 0 && (
          <section aria-label="Yahoo earnings date windows">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-200"><CalendarRange className="h-4 w-4" />Date windows and multiple provider dates</div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{shownWindowGroups.map(group => renderEventCard(group, true))}</div>
          </section>
        )}

        {viewMode === 'MONTH' && (
          <section aria-label={`${formatDate(monthStart, { month: 'long', year: 'numeric' })} earnings calendar`} className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/45 p-2 md:p-3">
            <div className="mb-2 grid min-w-[800px] grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {WEEKDAY_HEADERS.map(day => <div key={day} className="py-2">{day}</div>)}
            </div>
            <div className="grid min-w-[800px] grid-cols-7 gap-1" key={`${monthStart}-${pageDirection}`}>
              {monthGridDates.map(dateKey => {
                const events = scheduleGroups.filter(group => group.providerDates.length === 1 && group.providerDates[0] === dateKey);
                const inCurrentMonth = getMonthStartForDateKey(dateKey) === monthStart;
                const expanded = expandedMonthDate === dateKey;
                const visibleEvents = expanded ? events : events.slice(0, 3);
                return (
                  <div key={dateKey} className={`flex h-40 min-h-0 flex-col overflow-hidden rounded-lg border p-1.5 transition-colors ${selectedDate === dateKey ? 'border-sky-600 bg-sky-950/30' : inCurrentMonth ? 'border-slate-800 bg-slate-900/70' : 'border-slate-900 bg-slate-950/40'} ${dateKey === todayKey ? 'ring-1 ring-inset ring-sky-700/80' : ''}`}>
                    <button type="button" onClick={() => setSelectedDate(dateKey)} aria-label={`Show events for ${formatDate(dateKey, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`} className={`mb-1 flex w-full items-center justify-between rounded px-1 py-0.5 text-left text-[10px] font-semibold ${inCurrentMonth ? 'text-slate-200' : 'text-slate-600'} hover:bg-slate-800`}>
                      <span>{formatDate(dateKey, { day: 'numeric' })}</span>
                      {events.length > 0 && <span className="text-[9px] font-normal text-slate-500">{events.length}</span>}
                    </button>
                    <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-0.5">
                      {visibleEvents.map(group => {
                        const primary = group.stocks[0];
                        return (
                          <button key={group.key} type="button" title={`${group.providerName} (${group.reportTime})`} onClick={() => setSelectedDate(dateKey)} className="flex w-full items-center gap-1 rounded border border-slate-800 bg-slate-950/80 px-1 py-1 text-left hover:border-sky-800 hover:bg-slate-900">
                            <StockLogo ticker={primary.ticker} size="xs" className="shrink-0" />
                            <span className="min-w-0 flex-1 truncate font-mono text-[9px] font-semibold text-slate-200">{primary.ticker}{group.stocks.length > 1 ? ` +${group.stocks.length - 1}` : ''}</span>
                            <span className={`shrink-0 rounded px-1 text-[8px] font-bold ${group.reportTime === 'BMO' ? 'text-sky-300' : group.reportTime === 'AMC' ? 'text-amber-300' : 'text-slate-500'}`}>{group.reportTime}</span>
                          </button>
                        );
                      })}
                      {events.length > 3 && <button type="button" onClick={() => setExpandedMonthDate(expanded ? undefined : dateKey)} className="w-full px-1 text-left text-[9px] font-semibold text-sky-300 hover:text-sky-200">{expanded ? 'Show fewer' : `+${events.length - 3} more`}</button>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 overflow-x-auto text-[9px] text-slate-500">Dates outside {formatDate(monthStart, { month: 'long' })} are shown in muted cells to keep the six-week grid stable.</div>
          </section>
        )}

        {viewMode === 'WEEK' && <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          {weekDates.map(dateKey => {
            const dateGroups = scheduleGroups.filter(group => group.providerDates.length === 1 && group.providerDates[0] === dateKey);
            return (
              <section key={dateKey} className={`min-h-64 rounded-xl border ${dateKey === todayKey ? 'border-sky-700/80 bg-sky-950/15' : 'border-slate-800 bg-slate-950/45'}`} aria-label={`Earnings for ${formatDate(dateKey, { weekday: 'long', month: 'long', day: 'numeric' })}`}>
                <header className="border-b border-slate-800 px-3 py-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-100">{formatDate(dateKey, { weekday: 'long' })}</h3>
                    {dateKey === todayKey && <span className="rounded-full bg-sky-900/70 px-2 py-0.5 text-[9px] font-semibold uppercase text-sky-200">Today</span>}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">{formatDate(dateKey, { month: 'short', day: 'numeric' })}</div>
                </header>
                <div className="space-y-3 p-2">
                  {SESSION_ORDER.map(session => {
                    const events = dateGroups.filter(group => group.reportTime === session);
                    if (!events.length) return null;
                    return (
                      <div key={session}>
                        <div className="mb-1.5 flex items-center justify-between px-1 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                          <span>{session === 'UNKNOWN' ? 'Time unknown' : session}</span><span>{events.length}</span>
                        </div>
                        <div className="space-y-2">{events.map(group => renderEventCard(group))}</div>
                      </div>
                    );
                  })}
                  {!dateGroups.length && <p className="px-1 py-2 text-[10px] leading-4 text-slate-600">No Yahoo date in this weekday for the current filters.</p>}
                </div>
              </section>
            );
          })}
        </div>}

        {viewMode === 'MONTH' && selectedDate && (
          <section id="calendar-selected-date-details" className="rounded-xl border border-sky-900/70 bg-slate-900/70 p-4" aria-live="polite">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold text-slate-200">{formatDate(selectedDate, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h3>
              <button type="button" onClick={() => setSelectedDate(undefined)} className="rounded border border-slate-700 px-2 py-1 text-[10px] text-slate-400 hover:text-slate-100">Close</button>
            </div>
            {(() => {
              const selectedEvents = scheduleGroups.filter(group => group.providerDates.length === 1 && group.providerDates[0] === selectedDate);
              const selectedWindows = scheduleGroups.filter(group => group.providerDates.length > 1 && providerDatesOverlapRange(group.providerDates, selectedDate, selectedDate));
              if (!selectedEvents.length && !selectedWindows.length) return <p className="text-xs text-slate-500">Yahoo has no provider-dated event for this date in the current results.</p>;
              return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{[...selectedEvents.map(group => renderEventCard(group)), ...selectedWindows.map(group => renderEventCard(group, true))]}</div>;
            })()}
          </section>
        )}

        {viewMode === 'WEEK' && weekendGroups.length > 0 && (
          <section aria-label="Weekend dates in this calendar week" className="rounded-xl border border-slate-800 bg-slate-950/45 p-3">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-300">Weekend dates in this week</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {weekendDateKeys.map(dateKey => {
                const events = weekendGroups.filter(group => group.providerDates[0] === dateKey);
                if (!events.length) return null;
                return <div key={dateKey} className="space-y-2">
                  <div className="text-[11px] font-medium text-slate-400">{formatDate(dateKey, { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                  {events.map(group => renderEventCard(group))}
                </div>;
              })}
            </div>
          </section>
        )}

        {!currentPageHasEvents && completedCount > 0 && !isLoading && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-5 text-center">
            <div className="text-sm font-medium text-slate-200">No Yahoo earnings dates fall in this {viewMode.toLowerCase()} for the current filters.</div>
            <div className="mt-1 text-xs text-slate-500">This view contains provider-supplied calendar dates, not a historical release archive.</div>
            {nextScheduledPageStart && nextScheduledPageStart !== currentPageStart && <button type="button" onClick={goToNextScheduledPeriod} className="mt-3 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-sky-200 hover:bg-slate-800">Go to next provider-scheduled {viewMode.toLowerCase()}</button>}
          </div>
        )}
        </div>

        <section className="rounded-xl border border-slate-800 bg-slate-900/40" aria-labelledby="calendar-coverage-title">
          <div className="flex flex-col gap-1 border-b border-slate-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 id="calendar-coverage-title" className="text-xs font-semibold text-slate-200">Source coverage</h3>
              <p className="mt-1 text-[10px] text-slate-500">A ticker with no date stays visible here; a SEC filing is not treated as an earnings schedule.</p>
            </div>
            <span className="text-[10px] text-slate-500">{coverageCounts.scheduled} dated | {coverageCounts.noDate} no date | {coverageCounts.unavailable + coverageCounts.identityMismatch + coverageCounts.unsupported} unavailable / unsupported</span>
          </div>
          {unavailableStocks.length > 0 ? (
            <div className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-4">
              {unavailableStocks.map(stock => {
                const item = calendar[stock.ticker];
                const reason = item?.reason || (item?.coverage === 'NO_DATE' ? 'Yahoo returned no earnings date.' : 'Waiting for the source check.');
                const subscribed = subscribedTickers.includes(stock.ticker);
                return (
                  <div key={stock.ticker} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-2.5 py-2">
                    <StockLogo ticker={stock.ticker} size="sm" className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-200"><span>{stock.ticker}</span><span className="truncate text-[10px] font-normal text-slate-500">{stock.name}</span></div>
                      <div className="truncate text-[9px] text-slate-500" title={reason}>{reason}</div>
                    </div>
                    <span className={`rounded px-1.5 py-1 text-[8px] font-bold uppercase ${item?.coverage === 'NO_DATE' ? 'bg-slate-800 text-slate-300' : 'bg-amber-950/50 text-amber-300'}`}>{item?.coverage === 'NO_DATE' ? 'No date' : item?.coverage === 'IDENTITY_MISMATCH' ? 'Identity' : item?.coverage === 'UNSUPPORTED' ? 'Unsupported' : item?.coverage === 'UNAVAILABLE' ? 'Unavailable' : 'Pending'}</span>
                    <button type="button" onClick={() => onToggleSubscription(stock.ticker)} aria-label={`${subscribed ? 'Remove' : 'Add'} ${stock.ticker} ${subscribed ? 'from' : 'to'} the alert watchlist`} title={subscribed ? 'Remove from alert watchlist' : 'Add to alert watchlist'} className="rounded border border-slate-700 p-1.5 text-slate-400 hover:text-slate-100">
                      {subscribed ? <Check className="h-3 w-3 text-emerald-300" /> : <Bell className="h-3 w-3" />}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="px-4 py-3 text-[10px] text-slate-500">{visibleCheckedCount < visibleStocks.length ? 'Coverage results will appear here as source batches return.' : 'Every ticker in the current filter returned a provider date.'}</p>
          )}
        </section>
      </div>
    </section>
  );
};
