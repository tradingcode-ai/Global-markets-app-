import { PushNotificationItem, AlertPreferences, NotificationEventType } from '../types';

const STORAGE_KEY_NOTIFS = 'veritas_earnings_push_notifications';
const STORAGE_KEY_PREFS = 'veritas_earnings_alert_preferences';
const STORAGE_KEY_FIRED_ALERTS = 'veritas_institutional_fired_alerts_v2';

export const DEFAULT_PREFERENCES: AlertPreferences = {
  browserNotificationsEnabled: false,
  soundEnabled: true,
  subscribedTickers: ['NVDA', 'MSFT', 'AAPL', 'GOOGL', 'AMZN', 'META', 'TSM', 'AVGO', 'ORCL', 'AMD', 'CRM', 'NFLX'],
  alertOnEarningsBeat: true,
  alertOnEarningsMiss: true,
  alertOnSec8K: true,
  alertOnMomentumUp: true,
  alertOnMomentumDown: true,
  alertOnFiftyTwoWeekHighLow: true,
  // Backwards compatibility defaults
  alertOnRelease: true,
  alertOnMajorSurprise: true,
  alertOnGuidanceChange: true,
  alertOnAiCapex: true,
  reminderBeforeCall: true,
  alertOnFivePercentMove: true,
};

/**
 * Returns the current calendar trading day in America/New_York (Eastern Time).
 * Format: YYYY-MM-DD
 * This calendar day stays constant across PRE-MARKET, REGULAR, and AFTER-HOURS sessions.
 */
export function getTradingDayKey(date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(date);
  } catch {
    return date.toISOString().split('T')[0];
  }
}

/**
 * Backward compatibility session ID function.
 * Note: For robust once-per-day deduplication, use getTradingDayKey() or dedupe keys instead.
 */
export function getMarketSessionId(): string {
  const dateStr = getTradingDayKey();
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    });
    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    const totalMinutes = hour * 60 + minute;

    let session = 'REGULAR';
    if (totalMinutes < 9 * 60 + 30) {
      session = 'PRE';
    } else if (totalMinutes >= 16 * 60) {
      session = 'POST';
    }
    return `${dateStr}-${session}`;
  } catch {
    return dateStr;
  }
}

/**
 * Checks whether an alert deduplication key has already been dispatched.
 * Persisted in localStorage so it survives polling cycles, session changes, and page refreshes.
 */
export function hasAlertFired(dedupeKey: string): boolean {
  if (!dedupeKey) return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FIRED_ALERTS);
    if (!raw) return false;
    const map: Record<string, number> = JSON.parse(raw);
    return Boolean(map[dedupeKey]);
  } catch {
    return false;
  }
}

/**
 * Records that an alert deduplication key has been fired.
 * Prunes records older than 14 days to keep storage clean.
 */
export function recordAlertFired(dedupeKey: string): void {
  if (!dedupeKey) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FIRED_ALERTS);
    const map: Record<string, number> = raw ? JSON.parse(raw) : {};
    const now = Date.now();
    map[dedupeKey] = now;

    const cutoff = now - 14 * 86400 * 1000;
    for (const key of Object.keys(map)) {
      if (map[key] < cutoff) {
        delete map[key];
      }
    }
    localStorage.setItem(STORAGE_KEY_FIRED_ALERTS, JSON.stringify(map));
  } catch (e) {
    console.warn('Failed to record fired alert key', e);
  }
}

/**
 * Backward compatibility helpers using persistent store
 */
export function hasAlertFiredInSession(sessionId: string, alertKey: string): boolean {
  return hasAlertFired(`${sessionId}:${alertKey}`);
}

export function recordAlertFiredInSession(sessionId: string, alertKey: string): void {
  recordAlertFired(`${sessionId}:${alertKey}`);
}

// Play discreet corporate audio chime via Web Audio API
export function playCorporateChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // First harmonic
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
    osc1.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.12); // A5
    
    gain1.gain.setValueAtTime(0.08, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    // Second harmonic for crisp institutional bell
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.08); // E6
    gain2.gain.setValueAtTime(0.04, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
    
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.4);
    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.48);
  } catch {
    // Audio might be blocked until user gesture, ignore silently
  }
}

export async function requestBrowserPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'denied';
  }
}

export function getStoredNotifications(): PushNotificationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFS);
    if (raw) {
      const items: PushNotificationItem[] = JSON.parse(raw);
      return items.map(item => {
        let type = item.type;
        // Normalize any legacy types stored before the new taxonomy
        if (type === ('miss' as any) || type === ('beat' as any)) {
          if (item.metrics?.priceMove !== undefined) {
            type = item.metrics.priceMove >= 0 ? 'momentum-up' : 'momentum-down';
          } else if (item.title?.toLowerCase().includes('momentum') || item.title?.toLowerCase().includes('average') || item.title?.toLowerCase().includes('breakdown')) {
            type = item.title?.includes('-') || item.body?.includes('-') ? 'momentum-down' : 'momentum-up';
          } else if (type === ('beat' as any)) {
            type = 'earnings-beat';
          } else if (type === ('miss' as any)) {
            type = 'earnings-miss';
          }
        }
        return {
          ...item,
          type
        };
      });
    }
  } catch (e) {
    console.error('Failed to parse notifications', e);
  }
  return [];
}

export function saveNotifications(notifications: PushNotificationItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
  } catch (e) {
    console.error('Failed to save notifications', e);
  }
}

export function getStoredPreferences(): AlertPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_PREFERENCES,
        ...parsed,
        // Map legacy keys to new taxonomy if missing
        alertOnEarningsBeat: parsed.alertOnEarningsBeat ?? parsed.alertOnRelease ?? true,
        alertOnEarningsMiss: parsed.alertOnEarningsMiss ?? parsed.alertOnRelease ?? true,
        alertOnSec8K: parsed.alertOnSec8K ?? parsed.alertOnRelease ?? true,
        alertOnMomentumUp: parsed.alertOnMomentumUp ?? parsed.alertOnFivePercentMove ?? true,
        alertOnMomentumDown: parsed.alertOnMomentumDown ?? parsed.alertOnFivePercentMove ?? true,
        alertOnFiftyTwoWeekHighLow: parsed.alertOnFiftyTwoWeekHighLow ?? true,
      };
    }
  } catch (e) {
    console.error('Failed to parse preferences', e);
  }
  return DEFAULT_PREFERENCES;
}

export function savePreferences(prefs: AlertPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(prefs));
  } catch (e) {
    console.error('Failed to save alert preferences', e);
  }
}

/**
 * Dispatches a push notification with deterministic event ID and strict deduplication.
 * Returns true if dispatched, false if suppressed as a duplicate.
 */
export function dispatchPushNotification(
  item: Omit<PushNotificationItem, 'id' | 'timestamp' | 'read'>,
  prefs: AlertPreferences,
  onNewNotification: (notif: PushNotificationItem) => void
): boolean {
  const tradingDay = item.tradingDate || getTradingDayKey();

  // 1. Strict deduplication check
  if (item.dedupeKey && hasAlertFired(item.dedupeKey)) {
    return false; // Suppress duplicate!
  }

  // 2. Mark as fired in persistent storage
  if (item.dedupeKey) {
    recordAlertFired(item.dedupeKey);
  }

  // 3. Generate deterministic ID (no Math.random)
  const cleanKey = item.dedupeKey
    ? item.dedupeKey.toLowerCase().replace(/[^a-z0-9_-]/g, '_')
    : `${item.ticker.toLowerCase()}_${item.type}_${Date.now()}`;
  const deterministicId = `notif_${cleanKey}`;

  const newNotif: PushNotificationItem = {
    ...item,
    id: deterministicId,
    tradingDate: tradingDay,
    timestamp: 'Just now',
    read: false,
  };

  // Play corporate chime if sound is enabled
  if (prefs.soundEnabled) {
    playCorporateChime();
  }

  // Trigger browser system notification if granted
  if (
    'Notification' in window &&
    Notification.permission === 'granted' &&
    prefs.browserNotificationsEnabled
  ) {
    try {
      new Notification(`[GLOBAL MARKETS] ${newNotif.title}`, {
        body: newNotif.body,
        icon: '/favicon.ico',
        tag: newNotif.dedupeKey || newNotif.ticker,
        silent: !prefs.soundEnabled
      });
    } catch (err) {
      console.warn('System push notification could not be shown:', err);
    }
  }

  onNewNotification(newNotif);
  return true;
}
