import { PushNotificationItem, AlertPreferences } from '../types';

const STORAGE_KEY_NOTIFS = 'veritas_earnings_push_notifications';
const STORAGE_KEY_PREFS = 'veritas_earnings_alert_preferences';

export const DEFAULT_PREFERENCES: AlertPreferences = {
  browserNotificationsEnabled: false,
  soundEnabled: true,
  subscribedTickers: ['NVDA', 'MSFT', 'AAPL', 'GOOGL', 'AMZN', 'META', 'TSM', 'AVGO', 'ORCL', 'AMD', 'CRM', 'NFLX'],
  alertOnRelease: true,
  alertOnMajorSurprise: true,
  alertOnGuidanceChange: true,
  alertOnAiCapex: true,
  reminderBeforeCall: true,
  alertOnFiftyTwoWeekHighLow: true,
  alertOnFivePercentMove: true,
};

const SESSION_ALERT_STORAGE_PREFIX = 'veritas_market_session_alerts_';

export function getMarketSessionId(): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  try {
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

export function hasAlertFiredInSession(sessionId: string, alertKey: string): boolean {
  try {
    const raw = sessionStorage.getItem(`${SESSION_ALERT_STORAGE_PREFIX}${sessionId}`);
    if (!raw) return false;
    const list: string[] = JSON.parse(raw);
    return list.includes(alertKey);
  } catch {
    return false;
  }
}

export function recordAlertFiredInSession(sessionId: string, alertKey: string): void {
  try {
    const key = `${SESSION_ALERT_STORAGE_PREFIX}${sessionId}`;
    const raw = sessionStorage.getItem(key);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(alertKey)) {
      list.push(alertKey);
      sessionStorage.setItem(key, JSON.stringify(list));
    }
  } catch (e) {
    console.error('Failed to record session alert', e);
  }
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
  } catch (err) {
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
  } catch (e) {
    return 'denied';
  }
}

export function getStoredNotifications(): PushNotificationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFS);
    if (raw) {
      return JSON.parse(raw);
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
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
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

export function dispatchPushNotification(
  item: Omit<PushNotificationItem, 'id' | 'timestamp' | 'read'>,
  prefs: AlertPreferences,
  onNewNotification: (notif: PushNotificationItem) => void
) {
  const newNotif: PushNotificationItem = {
    ...item,
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
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
      new Notification(`[TECH EARNINGS] ${newNotif.title}`, {
        body: newNotif.body,
        icon: '/favicon.ico',
        tag: newNotif.ticker,
        silent: !prefs.soundEnabled
      });
    } catch (err) {
      console.warn('System push notification could not be shown:', err);
    }
  }

  onNewNotification(newNotif);
}
