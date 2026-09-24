import { LiveQuote } from '../types';

export interface LiveEarningsDateData {
  symbol: string;
  reportDate?: string;
  reportTime?: 'BMO' | 'AMC';
  isConfirmed?: boolean;
  provider?: string;
  epsEstimate?: number;
  revenueEstimate?: number;
}

export async function fetchLiveMarketQuotes(symbols?: string[]): Promise<Record<string, LiveQuote>> {
  try {
    const url = symbols && symbols.length > 0
      ? `/api/market-quotes?symbols=${encodeURIComponent(symbols.join(','))}`
      : '/api/market-quotes';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.quotes || {};
  } catch (err) {
    console.warn('Failed to fetch live market quotes:', err);
    return {};
  }
}

export async function fetchLiveEarningsCalendar(symbols?: string[]): Promise<Record<string, LiveEarningsDateData>> {
  try {
    const url = symbols && symbols.length > 0
      ? `/api/earnings-calendar?symbols=${encodeURIComponent(symbols.join(','))}`
      : '/api/earnings-calendar';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.calendar || {};
  } catch (err) {
    console.warn('Failed to fetch live earnings calendar:', err);
    return {};
  }
}

export async function fetchQuarterlyAnalystOutlook(symbols?: string[]): Promise<{ data: Record<string, any>; provider?: string }> {
  try {
    const url = symbols && symbols.length > 0
      ? `/api/quarterly-analyst-outlook?symbols=${encodeURIComponent(symbols.join(','))}`
      : '/api/quarterly-analyst-outlook';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return {
      data: json.data || {},
      provider: json.provider
    };
  } catch (err) {
    console.warn('Failed to fetch quarterly analyst outlook:', err);
    return { data: {} };
  }
}
