import { MarketNewsItem, NewsAgentStatus, NewsEdition } from '../types/marketNews';
import { INITIAL_MARKET_NEWS } from '../data/marketNewsData';

const BASE_URL = '';

export async function fetchNewsTimeline(params?: {
  edition?: string;
  stream?: string;
  category?: string;
  ticker?: string;
  sentiment?: string;
  impact?: string;
  limit?: number;
}): Promise<MarketNewsItem[]> {
  try {
    const query = new URLSearchParams();
    if (params?.edition && params.edition !== 'ALL') query.set('edition', params.edition);
    if (params?.stream && params.stream !== 'all') query.set('stream', params.stream);
    if (params?.category && params.category !== 'ALL') query.set('category', params.category);
    if (params?.ticker) query.set('ticker', params.ticker);
    if (params?.sentiment && params.sentiment !== 'ALL') query.set('sentiment', params.sentiment);
    if (params?.impact && params.impact !== 'ALL') query.set('impact', params.impact);
    if (params?.limit) query.set('limit', String(params.limit));

    const res = await fetch(`${BASE_URL}/api/v1/news/timeline?${query.toString()}`);
    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[MarketNewsService] Timeline fetch error, using local verified dataset:', err);
  }

  // Local filtering fallback
  let items = [...INITIAL_MARKET_NEWS];
  if (params?.edition && params.edition !== 'ALL') {
    items = items.filter(i => i.edition === params.edition);
  }
  if (params?.category && params.category !== 'ALL') {
    items = items.filter(i => i.category === params.category);
  } else if (params?.stream && params.stream !== 'all') {
    if (params.stream === 'macro') {
      items = items.filter(i => ['MACRO', 'CENTRAL_BANK', 'ECONOMIC_DATA', 'GEOPOLITICS', 'COMMODITIES'].includes(i.category));
    } else if (params.stream === 'earnings') {
      items = items.filter(i => i.category === 'EARNINGS');
    } else if (params.stream === 'companies') {
      items = items.filter(i => ['EQUITY', 'M&A', 'REGULATION'].includes(i.category));
    }
  }
  if (params?.ticker) {
    const t = params.ticker.toUpperCase();
    items = items.filter(i => i.ticker?.toUpperCase() === t);
  }
  if (params?.sentiment && params.sentiment !== 'ALL') {
    items = items.filter(i => i.sentiment === params.sentiment);
  }
  if (params?.impact && params.impact !== 'ALL') {
    items = items.filter(i => i.impact === params.impact);
  }
  return items;
}

export async function triggerAgentRun(edition?: NewsEdition, watchlist?: string[]): Promise<{
  success: boolean;
  inserted?: number;
  items?: MarketNewsItem[];
  error?: string;
}> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/agent/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        edition,
        watchlist: watchlist || ['ASML', 'NVDA', 'MSFT', 'AAPL', 'GOOGL', 'TSM', 'MU']
      })
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        inserted: data.inserted || (data.items ? data.items.length : 0),
        items: data.items || []
      };
    } else {
      const err = await res.json().catch(() => ({ error: 'Onbekende fout' }));
      return { success: false, error: err.error || err.message || 'Server reageerde met foutcode' };
    }
  } catch (err: any) {
    console.error('[MarketNewsService] Agent run call failed:', err);
    return { success: false, error: err.message || 'Netwerkverbinding met de agent mislukt' };
  }
}

export async function fetchAgentStatus(): Promise<NewsAgentStatus> {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/news/status`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // ignore
  }

  // Intelligent schedule time calculation
  const now = new Date();
  const amsterdamTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Amsterdam',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(now);

  const hour = Number(amsterdamTime.find(p => p.type === 'hour')?.value || 12);
  const minute = Number(amsterdamTime.find(p => p.type === 'minute')?.value || 0);
  const minutes = hour * 60 + minute;

  let currentEdition: NewsEdition = 'MORNING_EUROPE';
  let nextEdition: NewsEdition = 'US_OPEN';
  let nextScheduledTime = '15:30 CET';

  if (minutes < 7 * 60) {
    currentEdition = 'MARKET_CLOSE';
    nextEdition = 'MORNING_EUROPE';
    nextScheduledTime = '07:00 CET';
  } else if (minutes < 15 * 60 + 30) {
    currentEdition = 'MORNING_EUROPE';
    nextEdition = 'US_OPEN';
    nextScheduledTime = '15:30 CET';
  } else if (minutes < 21 * 60 + 30) {
    currentEdition = 'US_OPEN';
    nextEdition = 'MARKET_CLOSE';
    nextScheduledTime = '21:30 CET';
  } else {
    currentEdition = 'MARKET_CLOSE';
    nextEdition = 'MORNING_EUROPE';
    nextScheduledTime = '07:00 CET (volgende handelsdag)';
  }

  return {
    model: 'gemini-3.8-flash',
    thinkingLevel: 'MEDIUM',
    temperature: 0.1,
    timezone: 'Europe/Amsterdam',
    currentEdition,
    nextScheduledTime,
    nextEdition,
    activeAlertTickers: ['ASML', 'NVDA', 'MSFT', 'AAPL', 'GOOGL', 'TSM', 'MU'],
    totalNewsItems: INITIAL_MARKET_NEWS.length,
    postgresConnected: false
  };
}
