import { LiveQuote } from '../types';

export interface MarketSessionInfo {
  isMarketOpen: boolean;
  sessionLabel: string;
  prePostChangePercent?: number;
  prePostPrice?: number;
  marketState?: 'PRE' | 'REGULAR' | 'POST' | 'CLOSED';
  isActiveSession: boolean; // true if Regular (Open), Pre-Market, or After-Hours
}

const COMMODITY_SYMBOLS = new Set([
  'TTF', 'NG', 'JKM', 'WTI', 'BRENT', 'MURBAN', 'INE-SC',
  'RBOB', 'HO', 'GOLD', 'SILVER', 'COPPER', 'URANIUM', 'LITHIUM', 'WHEAT', 'CORN'
]);

const BOND_SYMBOLS = new Set([
  'US2Y', 'US10Y', 'US30Y', 'US30YMORT', 'US30YFRM',
  'CN10Y', 'CN30Y', 'DE10Y', 'DE30Y', 'JP10Y', 'JP30Y',
  'GB10Y', 'GB30Y', 'FR10Y', 'FR30Y', 'IT10Y', 'IT30Y', 'ES10Y', 'ES30Y'
]);

const EUROPEAN_EQUITY_SYMBOLS = new Set([
  'ASML', 'ASML.AS', 'SAP', 'SAP.DE', 'ARM', 'SPOT', 'PRX', 'PRX.AS',
  'SU', 'SU.PA', 'SIE', 'SIE.DE', 'ADYEN', 'ADYEN.AS', 'IFX', 'IFX.DE',
  'STM', 'STM.PA', 'STMPA.PA', 'BCS', 'BARC', 'HSBC', 'ABN', 'ING',
  'RABO', 'BNP', 'GLE', 'UBS', 'SAN', 'BBVA', 'SX7P'
]);

const ASIAN_EQUITY_SYMBOLS = new Set([
  '2330.TW', '2330', 'TSM', '8035.T', '8035', 'TOELY', '6857.T', '6857', 'ATEYY',
  '005930.KS', 'SSNLF', '000660.KS', 'HXSCF', '0981.HK', '0981', 'SMIC', 'SMICY',
  '285A.T', '285A', 'KIOXIA', '0700.HK', '0700', 'TCEHY', '7974.T', '7974', 'NTDOY',
  'CXMT'
]);

export function getMarketSessionInfo(ticker: string, quote?: LiveQuote | null): MarketSessionInfo {
  const normSym = ticker.toUpperCase();

  // 1. COMMODITIES (Global futures trade ~23 hours/day, Sun 18:00 ET - Fri 17:00 ET)
  if (COMMODITY_SYMBOLS.has(normSym)) {
    const isCommActive = isCommoditiesMarketOpen();
    return {
      isMarketOpen: isCommActive,
      sessionLabel: isCommActive ? 'Regular Hours' : 'Weekend Closed',
      marketState: isCommActive ? 'REGULAR' : 'CLOSED',
      isActiveSession: isCommActive
    };
  }

  // 2. SOVEREIGN BONDS (Trade weekdays during global rate desk hours)
  if (BOND_SYMBOLS.has(normSym) || normSym.includes('10Y') || normSym.includes('30Y') || normSym.includes('2Y') || normSym.includes('MORT')) {
    const isBondActive = isBondsMarketOpen();
    return {
      isMarketOpen: isBondActive,
      sessionLabel: isBondActive ? 'Regular Hours' : 'Market Closed',
      marketState: isBondActive ? 'REGULAR' : 'CLOSED',
      isActiveSession: isBondActive
    };
  }

  // 3. EXPLICIT SERVER MARKET STATE (Yahoo Finance or exchange meta)
  if (quote?.marketState) {
    if (quote.marketState === 'REGULAR') {
      return {
        isMarketOpen: true,
        sessionLabel: 'Regular Hours',
        marketState: 'REGULAR',
        isActiveSession: true
        // Note: prePostChangePercent is intentionally undefined when market is open
        // so it disappears as requested!
      };
    }
    if (quote.marketState === 'PRE') {
      return {
        isMarketOpen: false,
        sessionLabel: 'Pre-Market',
        marketState: 'PRE',
        isActiveSession: true,
        prePostChangePercent: quote.preMarketChangePercent,
        prePostPrice: quote.preMarketPrice
      };
    }
    if (quote.marketState === 'POST') {
      return {
        isMarketOpen: false,
        sessionLabel: 'After-Hours',
        marketState: 'POST',
        isActiveSession: true,
        prePostChangePercent: quote.postMarketChangePercent,
        prePostPrice: quote.postMarketPrice
      };
    }
    if (quote.marketState === 'CLOSED') {
      return {
        isMarketOpen: false,
        sessionLabel: 'Closed',
        marketState: 'CLOSED',
        isActiveSession: false,
        prePostChangePercent: quote.postMarketChangePercent || quote.preMarketChangePercent,
        prePostPrice: quote.postMarketPrice || quote.preMarketPrice
      };
    }
  }

  // 4. REGIONAL MARKET TIME-BASED FALLBACK
  const now = new Date();

  // 4A. European Equities (Euronext, Xetra, LSE: 09:00 - 17:30 CET / 03:00 - 11:30 ET)
  if (EUROPEAN_EQUITY_SYMBOLS.has(normSym)) {
    try {
      const euParts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Amsterdam',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
        weekday: 'short'
      }).formatToParts(now);

      const euHour = parseInt(euParts.find(p => p.type === 'hour')?.value || '0', 10);
      const euMinute = parseInt(euParts.find(p => p.type === 'minute')?.value || '0', 10);
      const euWeekday = euParts.find(p => p.type === 'weekday')?.value || '';
      const isEuWeekend = euWeekday === 'Sat' || euWeekday === 'Sun';
      const euMins = euHour * 60 + euMinute;

      if (isEuWeekend) {
        return { isMarketOpen: false, sessionLabel: 'Weekend Closed', marketState: 'CLOSED', isActiveSession: false };
      }

      if (euMins >= 540 && euMins < 1050) { // 09:00 - 17:30 CET
        return { isMarketOpen: true, sessionLabel: 'Regular Hours', marketState: 'REGULAR', isActiveSession: true };
      }
      if (euMins >= 480 && euMins < 540) { // 08:00 - 09:00 CET
        return {
          isMarketOpen: false,
          sessionLabel: 'Pre-Market',
          marketState: 'PRE',
          isActiveSession: true,
          prePostChangePercent: quote?.preMarketChangePercent,
          prePostPrice: quote?.preMarketPrice
        };
      }
      if (euMins >= 1050 && euMins < 1110) { // 17:30 - 18:30 CET
        return {
          isMarketOpen: false,
          sessionLabel: 'After-Hours',
          marketState: 'POST',
          isActiveSession: true,
          prePostChangePercent: quote?.postMarketChangePercent,
          prePostPrice: quote?.postMarketPrice
        };
      }
      return {
        isMarketOpen: false,
        sessionLabel: 'Closed',
        marketState: 'CLOSED',
        isActiveSession: false,
        prePostChangePercent: quote?.postMarketChangePercent || quote?.preMarketChangePercent,
        prePostPrice: quote?.postMarketPrice || quote?.preMarketPrice
      };
    } catch {
      // fallback to US below
    }
  }

  // 4B. Asian Equities (TSE, TWSE, HKEX: 20:00 - 03:00 ET)
  if (ASIAN_EQUITY_SYMBOLS.has(normSym)) {
    const isAsiaActive = isAsianMarketOpen();
    if (isAsiaActive) {
      return { isMarketOpen: true, sessionLabel: 'Regular Hours', marketState: 'REGULAR', isActiveSession: true };
    }
  }

  // 4C. US Equities (NYSE / NASDAQ)
  try {
    const usParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      weekday: 'short'
    }).formatToParts(now);

    const usHour = parseInt(usParts.find(p => p.type === 'hour')?.value || '0', 10);
    const usMinute = parseInt(usParts.find(p => p.type === 'minute')?.value || '0', 10);
    const usWeekday = usParts.find(p => p.type === 'weekday')?.value || '';
    const isUsWeekend = usWeekday === 'Sat' || usWeekday === 'Sun';
    const usMins = usHour * 60 + usMinute;

    if (isUsWeekend) {
      return { isMarketOpen: false, sessionLabel: 'Weekend Closed', marketState: 'CLOSED', isActiveSession: false };
    }

    if (usMins >= 570 && usMins < 960) { // 9:30 AM to 4:00 PM ET
      return { isMarketOpen: true, sessionLabel: 'Regular Hours', marketState: 'REGULAR', isActiveSession: true };
    }
    if (usMins >= 240 && usMins < 570) { // 4:00 AM to 9:30 AM ET
      return {
        isMarketOpen: false,
        sessionLabel: 'Pre-Market',
        marketState: 'PRE',
        isActiveSession: true,
        prePostChangePercent: quote?.preMarketChangePercent,
        prePostPrice: quote?.preMarketPrice
      };
    }
    if (usMins >= 960 && usMins < 1200) { // 4:00 PM to 8:00 PM ET
      return {
        isMarketOpen: false,
        sessionLabel: 'After-Hours',
        marketState: 'POST',
        isActiveSession: true,
        prePostChangePercent: quote?.postMarketChangePercent,
        prePostPrice: quote?.postMarketPrice
      };
    }
  } catch {
    // Ignore timezone parse errors
  }

  return {
    isMarketOpen: false,
    sessionLabel: 'Closed',
    marketState: 'CLOSED',
    isActiveSession: false,
    prePostChangePercent: quote?.postMarketChangePercent || quote?.preMarketChangePercent,
    prePostPrice: quote?.postMarketPrice || quote?.preMarketPrice
  };
}

/**
 * Returns true if the asset's market is actively trading (Regular Open, Pre-Market, or After-Hours).
 * Used when filtering the Live Ticker Bar under the "ALL" view.
 */
export function isAssetSessionActive(ticker: string, quote?: LiveQuote | null): boolean {
  const session = getMarketSessionInfo(ticker, quote);
  return session.isActiveSession;
}

function isCommoditiesMarketOpen(): boolean {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      weekday: 'short'
    }).formatToParts(new Date());

    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    const weekday = parts.find(p => p.type === 'weekday')?.value || '';
    const mins = hour * 60 + minute;

    // CME / ICE trades Sunday 18:00 ET to Friday 17:00 ET
    if (weekday === 'Sat') return false;
    if (weekday === 'Sun') return mins >= 1080; // After 6:00 PM ET
    if (weekday === 'Fri') return mins < 1020;  // Before 5:00 PM ET
    // Mon-Thu: 1-hour maintenance break between 17:00 and 18:00 ET
    if (mins >= 1020 && mins < 1080) return false;
    return true;
  } catch {
    return true;
  }
}

function isBondsMarketOpen(): boolean {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      weekday: 'short'
    }).formatToParts(new Date());

    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    const weekday = parts.find(p => p.type === 'weekday')?.value || '';
    if (weekday === 'Sat' || weekday === 'Sun') return false;
    const mins = hour * 60 + minute;
    // Sovereign rate cash & futures trade from London opening through NY close (02:00 - 17:30 ET)
    return mins >= 120 && mins < 1050;
  } catch {
    return true;
  }
}

function isAsianMarketOpen(): boolean {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      weekday: 'short'
    }).formatToParts(new Date());

    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    const weekday = parts.find(p => p.type === 'weekday')?.value || '';
    if (weekday === 'Sat' || weekday === 'Sun') return false;
    const mins = hour * 60 + minute;
    // Tokyo / HK / Taipei sessions in ET (approx 20:00 to 03:00 ET)
    return mins >= 1200 || mins < 180;
  } catch {
    return false;
  }
}

export const TICKER_ALIASES: Record<string, string[]> = {
  'TSM': ['TSM', '2330.TW', '2330'],
  '2330': ['2330.TW', 'TSM', '2330'],
  '2330.TW': ['2330.TW', 'TSM', '2330'],
  'ASML': ['ASML', 'ASML.AS'],
  'SAP': ['SAP', 'SAP.DE'],
  'ARM': ['ARM'],
  'PRX': ['PRX', 'PRX.AS'],
  'SU': ['SU', 'SU.PA'],
  'SIE': ['SIE', 'SIE.DE'],
  'ADYEN': ['ADYEN', 'ADYEN.AS'],
  'IFX': ['IFX', 'IFX.DE'],
  'STM': ['STM', 'STM.PA', 'STMPA.PA'],
  'TOELY': ['TOELY', '8035.T', '8035'],
  '8035': ['8035.T', 'TOELY', '8035'],
  '8035.T': ['8035.T', 'TOELY', '8035'],
  'ATEYY': ['ATEYY', '6857.T', '6857'],
  '6857': ['6857.T', 'ATEYY', '6857'],
  '6857.T': ['6857.T', 'ATEYY', '6857'],
  'SSNLF': ['SSNLF', '005930.KS', '005930'],
  'HXSCF': ['HXSCF', '000660.KS', '000660'],
  'SMICY': ['SMICY', '0981.HK', 'SMIC', '0981'],
  'SMIC': ['SMIC', 'SMICY', '0981.HK', '0981'],
  'KIOXIA': ['KIOXIA', '285A.T', '285A'],
  'TCEHY': ['TCEHY', '0700.HK', '0700'],
  'NTDOY': ['NTDOY', '7974.T', '7974'],
  'US30YMORT': ['US30YMORT', 'US30YFRM'],
  'US30YFRM': ['US30YFRM', 'US30YMORT'],
  'WTI': ['WTI', 'CL.1', 'CL=F'],
  'BRENT': ['BRENT', 'LCO.1', 'BZ=F'],
  'NG': ['NG', 'NG.1', 'NG=F'],
  'GOLD': ['GOLD', 'GC.1', 'GC=F'],
  'SILVER': ['SILVER', 'SI.1', 'SI=F'],
  'COPPER': ['COPPER', 'HG.1', 'HG=F'],
  'WHEAT': ['WHEAT', 'W.1', 'ZW=F'],
  'CORN': ['CORN', 'C.1', 'ZC=F'],
  'RBOB': ['RBOB', 'RB.1', 'RB=F'],
  'HO': ['HO', 'HO.1', 'HO=F'],
};

/**
 * Universal Quote Resolver: ensures 100% synchronization across all asset classes,
 * tickers, aliases, and ticker bar items.
 */
export function resolveLiveQuote(ticker: string, quotes: Record<string, LiveQuote>): LiveQuote | null {
  if (!quotes || typeof quotes !== 'object') return null;
  if (quotes[ticker]) return quotes[ticker];
  const upper = ticker.toUpperCase();
  if (quotes[upper]) return quotes[upper];

  const candidates = TICKER_ALIASES[upper] || TICKER_ALIASES[ticker];
  if (candidates) {
    for (const c of candidates) {
      if (quotes[c]) return quotes[c];
      if (quotes[c.toUpperCase()]) return quotes[c.toUpperCase()];
    }
  }

  const foundKey = Object.keys(quotes).find(k => k.toUpperCase() === upper);
  if (foundKey) return quotes[foundKey];

  return null;
}
