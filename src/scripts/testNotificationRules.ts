import assert from 'node:assert/strict';
import type { LiveQuote, AlertPreferences, PushNotificationItem } from '../types';
import {
  advanceQuoteObservation,
  formatNotificationEventTime,
  getEligibleMarketQuote,
  getNewConfiguredThresholdCrossing,
  getNewMomentumCrossing,
  getVerifiedAlertPreviousClose,
  isFreshSecAcceptance
} from '../services/notificationRules';
import {
  DEFAULT_PREFERENCES,
  dispatchPushNotification,
  getStoredNotifications,
  getStoredPreferences,
  hasAlertFired,
  recordAlertFired,
  saveNotifications
} from '../services/notificationService';

// Test-only provider-shaped fixture; no runtime fake quote or notification data is used.
class TestStorage {
  values = new Map<string, string>();
  failWrites = false;
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) {
    if (this.failWrites) throw new Error('quota');
    this.values.set(key, value);
  }
  removeItem(key: string) { this.values.delete(key); }
}

const storage = new TestStorage();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });

const sessionStartMs = Date.UTC(2026, 9, 12, 13, 30, 0);
const sessionEndMs = Date.UTC(2026, 9, 12, 20, 0, 0);
const nowMs = sessionStartMs + 120_000;
function quote(overrides: Partial<LiveQuote> = {}): LiveQuote {
  return {
    symbol: 'NVDA', price: 105, change: 5, changePercent: 5, dayHigh: 105, dayLow: 105,
    volume: 1, previousClose: 100, currency: 'USD', lastUpdated: new Date(nowMs).toISOString(),
    isLive: true, marketState: 'REGULAR', providerTradeTimestamp: new Date(sessionStartMs + 60_000).toISOString(),
    regularSessionStartMs: sessionStartMs, regularSessionEndMs: sessionEndMs,
    exchangeTimezoneName: 'America/New_York', alertCurrentPrice: 105, alertPreviousClose: 100,
    ...overrides
  };
}

assert.ok(getEligibleMarketQuote(quote(), nowMs), 'fresh source trade inside the provider regular session is eligible');
assert.equal(getEligibleMarketQuote(quote({ marketState: 'CLOSED' }), nowMs), null, 'closed state is ineligible');
assert.equal(getEligibleMarketQuote(quote({ regularSessionStartMs: undefined, regularSessionEndMs: undefined }), nowMs), null, 'missing actual session window fails closed, including holidays');
assert.equal(getEligibleMarketQuote(quote({ providerTradeTimestamp: undefined }), nowMs), null, 'missing provider trade timestamp fails closed');
assert.equal(getEligibleMarketQuote(quote({ alertPreviousClose: undefined }), nowMs), null, 'missing verified previous close fails closed');
assert.equal(getEligibleMarketQuote(quote({ providerTradeTimestamp: new Date(nowMs + 6_000).toISOString() }), nowMs), null, 'future provider trade is rejected');
assert.equal(getEligibleMarketQuote(quote({ providerTradeTimestamp: new Date(nowMs - 121_000).toISOString() }), nowMs), null, 'stale provider trade is rejected');
assert.equal(getEligibleMarketQuote(quote({ providerDelaySeconds: 15 }), nowMs), null, 'known delayed quote is rejected');
assert.equal(getEligibleMarketQuote(quote(), sessionEndMs), null, 'exact regular-session end is exclusive');
assert.equal(getEligibleMarketQuote(quote(), sessionStartMs - 1), null, 'pre-open is rejected even with REGULAR cached state');
assert.equal(getEligibleMarketQuote(quote({ regularSessionStartMs: sessionStartMs - 86400_000, regularSessionEndMs: sessionEndMs - 86400_000, providerTradeTimestamp: new Date(sessionEndMs - 86400_000).toISOString() }), sessionEndMs + 60_000), null, 'cached REGULAR quote after close is rejected');
const overnightEligible = getEligibleMarketQuote(quote({
  exchangeTimezoneName: 'Asia/Shanghai',
  regularSessionStartMs: Date.UTC(2026, 9, 12, 22),
  regularSessionEndMs: Date.UTC(2026, 9, 13, 6),
  providerTradeTimestamp: new Date(Date.UTC(2026, 9, 12, 22, 30)).toISOString()
}), Date.UTC(2026, 9, 12, 22, 31));
assert.equal(overnightEligible?.sessionDate, '2026-10-13', 'overnight dedupe identity uses provider session start date in exchange time');

const priorDay = Date.UTC(2026, 9, 9, 0, 0, 0) / 1000;
const startSeconds = sessionStartMs / 1000;
assert.equal(getVerifiedAlertPreviousClose({
  officialPreviousClose: undefined, chartPreviousClose: 777, chartRange: '1y', regularSessionStartSeconds: startSeconds,
  timestampsSeconds: [priorDay, startSeconds], closes: [100, 105]
}), 100, 'cold one-year chart uses the paired prior-session daily close, not chartPreviousClose');
assert.equal(getVerifiedAlertPreviousClose({
  chartPreviousClose: 100, chartRange: '1d', regularSessionStartSeconds: startSeconds,
  timestampsSeconds: [startSeconds], closes: [105]
}), 100, 'one-day chart previous close is accepted only with a current-session daily bar');
assert.equal(getVerifiedAlertPreviousClose({
  chartPreviousClose: 777, chartRange: '1d', regularSessionStartSeconds: startSeconds,
  timestampsSeconds: [startSeconds - 86_400], closes: [100]
}), 100, 'mismatched one-day chart falls back to its paired prior daily close');
assert.equal(getVerifiedAlertPreviousClose({
  chartPreviousClose: 777, chartRange: '1d', regularSessionStartSeconds: startSeconds,
  timestampsSeconds: [startSeconds], closes: [105]
}), 777, 'verified one-day previous close works on a fresh daily bar');
assert.equal(getVerifiedAlertPreviousClose({
  chartPreviousClose: 777, chartRange: '1y', regularSessionStartSeconds: startSeconds,
  timestampsSeconds: [Number.NaN, startSeconds - 86_400], closes: [999, 99]
}), 99, 'malformed timestamp is not paired to a different close');

const largeUp = getNewMomentumCrossing(4, 10);
assert.deepEqual(largeUp, { direction: 'up', threshold: 10, crossedThresholds: [5, 7.5, 10] }, 'large upward jump emits only its highest new tier and consumes lower tiers');
assert.deepEqual(getNewMomentumCrossing(5, 10), { direction: 'up', threshold: 10, crossedThresholds: [7.5, 10] }, 'a higher threshold remains eligible after the base tier');
assert.equal(getNewMomentumCrossing(4, 4.9), null, 'sub-threshold moves do not alert');
assert.deepEqual(getNewMomentumCrossing(-4, -10), { direction: 'down', threshold: -10, crossedThresholds: [-5, -7.5, -10] }, 'large downward jump emits only its highest-magnitude new tier');
assert.equal(getNewMomentumCrossing(10, 4), null, 'retracing does not create an opposite-direction event');
assert.deepEqual(getNewMomentumCrossing(-10, 5), { direction: 'up', threshold: 5, crossedThresholds: [5] }, 'up and down directions remain independent');
assert.equal(getNewConfiguredThresholdCrossing(3.9, 4.1, 4), 'up', 'configured asset threshold crossing is detected from fresh observations');
assert.equal(getNewConfiguredThresholdCrossing(4.1, 3.9, 4), null, 'a retrace below the configured threshold does not replay the event');
assert.equal(getNewConfiguredThresholdCrossing(-3.9, -4.1, 4), 'down', 'configured asset threshold works for negative moves');

const eligible = getEligibleMarketQuote(quote(), nowMs)!;
const first = advanceQuoteObservation(null, eligible, quote());
assert.equal(first.mayTrigger, false, 'initial snapshot never catches up historical movement');
const sameTimestamp = advanceQuoteObservation(first.observation, eligible, quote());
assert.equal(sameTimestamp.mayTrigger, false, 'duplicate source timestamp does not advance');
const laterEligible = { ...eligible, tradeTimeMs: eligible.tradeTimeMs + 30_000, price: 110, changePercent: 10 };
assert.equal(advanceQuoteObservation(first.observation, laterEligible, quote()).mayTrigger, true, 'monotonic fresh source time can trigger');
assert.equal(advanceQuoteObservation(first.observation, { ...laterEligible, tradeTimeMs: eligible.tradeTimeMs + 121_000 }, quote()).mayTrigger, false, 'long reconnect gap rebaselines without catch-up');
assert.equal(advanceQuoteObservation(first.observation, { ...laterEligible, sessionDate: '2026-10-13' }, quote()).mayTrigger, false, 'new exchange session starts with a baseline');
assert.equal(advanceQuoteObservation(first.observation, { ...laterEligible, tradeTimeMs: eligible.tradeTimeMs - 1 }, quote()).mayTrigger, false, 'nonmonotonic source time does not trigger');

const current = nowMs;
assert.equal(isFreshSecAcceptance(new Date(current - 11 * 60_000).toISOString(), current), false, 'old SEC acceptance is rejected');
assert.equal(isFreshSecAcceptance(new Date(current + 6_000).toISOString(), current), false, 'future SEC acceptance is rejected');
assert.equal(isFreshSecAcceptance(undefined, current), false, 'missing SEC acceptance is rejected');
assert.equal(isFreshSecAcceptance('2026-10-12', current), false, 'date-only SEC filing date is not treated as acceptance time');
assert.equal(isFreshSecAcceptance(new Date(current - 60_000).toISOString(), current), true, 'fresh after-hours acceptance is eligible independent of market hours');
assert.match(formatNotificationEventTime(new Date(current - 60_000).toISOString(), new Date(current).toISOString()), /2026/);
assert.equal(formatNotificationEventTime(undefined, undefined, '2026-10-12'), '2026-10-12', 'legacy history can display a truthful source date');

const prefs: AlertPreferences = { ...DEFAULT_PREFERENCES, subscribedTickers: [] };
let received: PushNotificationItem | undefined;
const event = {
  ticker: 'NVDA', companyName: 'NVIDIA', title: 'Fresh alert', body: 'Verified event', type: 'momentum-up' as const,
  dedupeKey: 'fixture:empty-subscription', eventOccurredAt: new Date(current).toISOString()
};
assert.equal(dispatchPushNotification(event, prefs, item => { received = item; }), false, 'empty ticker subscription produces no notification');
assert.equal(received, undefined);
assert.equal(dispatchPushNotification(event, { ...prefs, subscribedTickers: ['NVDA'], soundEnabled: false }, item => { received = item; }), true, 'selected ticker receives a real timestamped event');
assert.equal(received?.timestamp, event.eventOccurredAt, 'event timestamp remains source time');
assert.ok(received?.deliveredAt, 'delivery time is stored separately');
assert.equal(dispatchPushNotification(event, { ...prefs, subscribedTickers: ['NVDA'], soundEnabled: false }, () => assert.fail('duplicate dispatched')), false, 'same accession/event key is suppressed');

storage.values.set('veritas_earnings_alert_preferences', JSON.stringify({ subscribedTickers: [], alertOnMomentumDown: false }));
const migratedPrefs = getStoredPreferences();
assert.deepEqual(migratedPrefs.subscribedTickers, [], 'empty subscription survives preference migration');
assert.equal(migratedPrefs.alertOnMomentumDown, false, 'existing explicit preference survives migration');

const priorItem = { id: 'history-1', ticker: 'NVDA', companyName: 'NVIDIA', title: 'Old history', body: 'Stored event', timestamp: new Date(current - 86400_000).toISOString(), type: 'sec-8k', read: true, dedupeKey: 'fixture:old-real-notification' };
const duplicateItem = { ...priorItem, id: 'history-2' };
storage.values.set('veritas_earnings_push_notifications', JSON.stringify([
  { ...priorItem, id: 'notif_avgo_momentum_up_75' }, priorItem, duplicateItem
]));
storage.failWrites = true;
const retained = getStoredNotifications();
assert.equal(retained.length, 1, 'seed and duplicate rows are removed while remaining history is returned if migration storage fails');
assert.equal(retained[0].id, 'history-1');
recordAlertFired('fixture:cleared-log-still-deduped');
saveNotifications([]);
assert.equal(hasAlertFired('fixture:cleared-log-still-deduped'), true, 'clearing display history does not reset event dedupe');

console.log('notificationRules regression fixtures passed');
