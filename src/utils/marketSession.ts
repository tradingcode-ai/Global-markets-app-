import { LiveQuote } from '../types';

export interface MarketSessionInfo {
  isMarketOpen: boolean;
  sessionLabel: string;
  prePostChangePercent?: number;
  prePostPrice?: number;
}

export function getMarketSessionInfo(ticker: string, quote?: LiveQuote | null): MarketSessionInfo {
  if (!quote) {
    return {
      isMarketOpen: false,
      sessionLabel: 'Closed'
    };
  }

  // If live quote explicitly specifies marketState from Yahoo Finance
  if (quote.marketState === 'REGULAR') {
    return {
      isMarketOpen: true,
      sessionLabel: 'Regular Hours'
    };
  }

  if (quote.marketState === 'PRE' || (quote.preMarketChangePercent !== undefined && quote.marketState !== 'POST')) {
    return {
      isMarketOpen: false,
      sessionLabel: 'Pre-Market',
      prePostChangePercent: quote.preMarketChangePercent,
      prePostPrice: quote.preMarketPrice
    };
  }

  if (quote.marketState === 'POST' || quote.postMarketChangePercent !== undefined) {
    return {
      isMarketOpen: false,
      sessionLabel: 'After-Hours',
      prePostChangePercent: quote.postMarketChangePercent,
      prePostPrice: quote.postMarketPrice
    };
  }

  // Fallback to checking US Eastern time
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      weekday: 'short'
    });
    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    const weekday = parts.find(p => p.type === 'weekday')?.value || '';

    const isWeekend = weekday === 'Sat' || weekday === 'Sun';
    const timeMinutes = hour * 60 + minute;

    if (isWeekend) {
      return { isMarketOpen: false, sessionLabel: 'Weekend Closed' };
    }

    if (timeMinutes >= 570 && timeMinutes < 960) { // 9:30 AM to 4:00 PM ET
      return { isMarketOpen: true, sessionLabel: 'Regular Hours' };
    } else if (timeMinutes >= 240 && timeMinutes < 570) { // 4:00 AM to 9:30 AM ET
      return {
        isMarketOpen: false,
        sessionLabel: 'Pre-Market',
        prePostChangePercent: quote.preMarketChangePercent,
        prePostPrice: quote.preMarketPrice
      };
    } else if (timeMinutes >= 960 && timeMinutes < 1200) { // 4:00 PM to 8:00 PM ET
      return {
        isMarketOpen: false,
        sessionLabel: 'After-Hours',
        prePostChangePercent: quote.postMarketChangePercent,
        prePostPrice: quote.postMarketPrice
      };
    }
  } catch (e) {
    // Ignore timezone parse errors
  }

  return {
    isMarketOpen: false,
    sessionLabel: 'Closed',
    prePostChangePercent: quote.postMarketChangePercent || quote.preMarketChangePercent,
    prePostPrice: quote.postMarketPrice || quote.preMarketPrice
  };
}
