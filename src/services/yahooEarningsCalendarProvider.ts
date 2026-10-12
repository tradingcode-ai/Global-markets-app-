import {
  createUnavailableEarningsCalendarData,
  parseYahooEarningsCalendarPayload,
  LiveEarningsDateData
} from './earningsCalendarRules';

export interface EarningsCalendarEquity {
  symbol: string;
  name: string;
}

interface YahooSession {
  cookie: string;
  crumb: string;
  expiresAt: number;
}

interface CacheEntry {
  data: LiveEarningsDateData;
  retrievedAt: number;
  ttlMs: number;
}

export interface YahooEarningsCalendarProviderOptions {
  mapSymbol: (symbol: string) => string;
  fetchImpl?: typeof fetch;
  maxConcurrent?: number;
  quoteTimeoutMs?: number;
  authTimeoutMs?: number;
  cacheTtlMs?: number;
  errorCacheTtlMs?: number;
  now?: () => number;
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

class YahooHttpError extends Error {
  constructor(readonly status: number) {
    super(`Yahoo returned HTTP ${status}`);
    this.name = 'YahooHttpError';
  }
}

export class YahooEarningsCalendarProvider {
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;
  private readonly maxConcurrent: number;
  private readonly quoteTimeoutMs: number;
  private readonly authTimeoutMs: number;
  private readonly cacheTtlMs: number;
  private readonly errorCacheTtlMs: number;
  private readonly cache = new Map<string, CacheEntry>();
  private readonly inFlight = new Map<string, Promise<LiveEarningsDateData>>();
  private readonly waiters: Array<() => void> = [];
  private activeRequests = 0;
  private session: YahooSession | undefined;
  private sessionFlight: Promise<YahooSession | undefined> | undefined;

  constructor(private readonly options: YahooEarningsCalendarProviderOptions) {
    this.fetchImpl = options.fetchImpl || fetch;
    this.now = options.now || Date.now;
    this.maxConcurrent = Math.max(1, options.maxConcurrent || 4);
    this.quoteTimeoutMs = options.quoteTimeoutMs || 8000;
    this.authTimeoutMs = options.authTimeoutMs || 5000;
    this.cacheTtlMs = options.cacheTtlMs || 30 * 60 * 1000;
    this.errorCacheTtlMs = options.errorCacheTtlMs || 60 * 1000;
  }

  async get(equity: EarningsCalendarEquity, forceRefresh = false): Promise<LiveEarningsDateData> {
    const symbol = equity.symbol.toUpperCase().trim();
    const providerSymbol = this.options.mapSymbol(symbol).toUpperCase().trim();
    const now = this.now();
    const checkedAt = new Date(now).toISOString();
    const cached = this.cache.get(symbol);
    if (!forceRefresh && cached && now - cached.retrievedAt < cached.ttlMs) {
      return { ...cached.data, lastCheckedAt: checkedAt, cached: true };
    }

    const existing = this.inFlight.get(symbol);
    if (existing) return existing;

    const request = this.fetchAndParse(equity, providerSymbol)
      .then(data => {
        const retrievedAt = this.now();
        const ttlMs = data.coverage === 'UNAVAILABLE' ? this.errorCacheTtlMs : this.cacheTtlMs;
        const checked = { ...data, checkedAt: new Date(retrievedAt).toISOString(), lastCheckedAt: new Date(retrievedAt).toISOString(), cached: false };
        this.cache.set(symbol, { data: checked, retrievedAt, ttlMs });
        return checked;
      })
      .finally(() => this.inFlight.delete(symbol));
    this.inFlight.set(symbol, request);
    return request;
  }

  private async fetchAndParse(equity: EarningsCalendarEquity, providerSymbol: string): Promise<LiveEarningsDateData> {
    const symbol = equity.symbol.toUpperCase().trim();
    let auth = await this.getSession();
    if (!auth) return createUnavailableEarningsCalendarData(symbol, 'Yahoo authentication could not be established within the request limit.', new Date(this.now()).toISOString());

    try {
      let payload: unknown;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          payload = await this.withSlot(() => this.fetchJson(
            `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(providerSymbol)}?modules=calendarEvents%2Cprice&crumb=${encodeURIComponent(auth!.crumb)}`,
            { headers: { 'User-Agent': USER_AGENT, Cookie: auth!.cookie } },
            this.quoteTimeoutMs
          ));
          break;
        } catch (error) {
          if (!(error instanceof YahooHttpError) || ![401, 403].includes(error.status) || attempt !== 0) throw error;
          if (this.session === auth) this.session = undefined;
          auth = await this.getSession();
          if (!auth) throw error;
        }
      }
      return parseYahooEarningsCalendarPayload({
        symbol,
        expectedProviderSymbol: providerSymbol,
        expectedCompanyName: equity.name,
        payload,
        checkedAt: new Date(this.now()).toISOString()
      });
    } catch (error) {
      const reason = error instanceof Error && error.name === 'AbortError'
        ? 'Yahoo did not answer before the calendar request timeout.'
        : 'Yahoo could not provide a calendar response for this ticker.';
      return createUnavailableEarningsCalendarData(symbol, reason, new Date(this.now()).toISOString());
    }
  }

  private async getSession(): Promise<YahooSession | undefined> {
    const now = this.now();
    if (this.session && this.session.expiresAt > now) return this.session;
    if (this.sessionFlight) return this.sessionFlight;

    const flight = (async () => {
      try {
        const cookieResponse = await this.fetchResponse('https://fc.yahoo.com', {
          headers: { 'User-Agent': USER_AGENT },
          redirect: 'manual'
        }, this.authTimeoutMs);
        const headers = cookieResponse.headers as Headers & { getSetCookie?: () => string[] };
        const setCookies = typeof headers.getSetCookie === 'function'
          ? headers.getSetCookie()
          : [cookieResponse.headers.get('set-cookie') || ''];
        const cookie = setCookies.map(value => value.split(';')[0].trim()).filter(Boolean).join('; ');
        if (!cookie) return undefined;

        const crumb = await this.fetchText('https://query2.finance.yahoo.com/v1/test/getcrumb', {
          headers: { 'User-Agent': USER_AGENT, Cookie: cookie }
        }, this.authTimeoutMs);
        if (!crumb || crumb.includes('{') || crumb.includes('<')) return undefined;

        this.session = { cookie, crumb, expiresAt: this.now() + 12 * 60 * 60 * 1000 };
        return this.session;
      } catch {
        return undefined;
      }
    })().finally(() => {
      this.sessionFlight = undefined;
    });
    this.sessionFlight = flight;
    return flight;
  }

  private async fetchResponse(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await this.fetchImpl(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }

  private async fetchText(url: string, init: RequestInit, timeoutMs: number): Promise<string | undefined> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await this.fetchImpl(url, { ...init, signal: controller.signal });
      if (!response.ok) return undefined;
      return (await response.text()).trim();
    } finally {
      clearTimeout(timeout);
    }
  }

  private async fetchJson(url: string, init: RequestInit, timeoutMs: number): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await this.fetchImpl(url, { ...init, signal: controller.signal });
      if (!response.ok) throw new YahooHttpError(response.status);
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  private async withSlot<T>(task: () => Promise<T>): Promise<T> {
    if (this.activeRequests >= this.maxConcurrent) {
      await new Promise<void>(resolve => this.waiters.push(resolve));
    } else {
      this.activeRequests += 1;
    }
    try {
      return await task();
    } finally {
      const next = this.waiters.shift();
      if (next) next();
      else this.activeRequests -= 1;
    }
  }
}
