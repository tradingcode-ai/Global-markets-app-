import { LiveQuote } from '../types';

export interface MarketQuotesResponse {
  success: boolean;
  timestamp: string;
  quotes: Record<string, LiveQuote>;
  symbols: string[];
}

export async function fetchLiveMarketQuotes(symbols?: string[]): Promise<Record<string, LiveQuote>> {
  try {
    const url = symbols && symbols.length > 0 
      ? `/api/market-quotes?symbols=${encodeURIComponent(symbols.join(','))}`
      : '/api/market-quotes';

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Market quotes API returned status ${res.status}`);
    }
    const data: MarketQuotesResponse = await res.json();
    return data.quotes || {};
  } catch (err) {
    console.warn('Failed to fetch live market quotes from server, returning fallback:', err);
    return {};
  }
}

export async function fetchSingleQuote(symbol: string): Promise<LiveQuote | null> {
  try {
    const res = await fetch(`/api/market-quote/${encodeURIComponent(symbol)}`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return data.quote || null;
  } catch (err) {
    console.warn(`Failed to fetch quote for ${symbol}:`, err);
    return null;
  }
}
