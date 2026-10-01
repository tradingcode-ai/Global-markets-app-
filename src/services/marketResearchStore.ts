import pg from 'pg';
import {
  ResearchEvent,
  ResearchReport,
  ResearchConfig,
  ResearchDashboardData,
  VisualEnrichmentPayload
} from '../types/marketResearch';
import { getDefaultResearchConfig } from './marketResearchConfig';

// In-Memory Fallback Store
interface InMemoryResearchStore {
  events: ResearchEvent[];
  reports: ResearchReport[];
  config: ResearchConfig;
  lastRunAt: string | null;
}

// Initial realistic seed items matching the master prompt specification
const SEED_EVENT_RTX: ResearchEvent = {
  id: 'evt_rtx_2026_09_pratt_pw1100g_inspection',
  ticker: 'RTX',
  assetName: 'RTX Corporation',
  assetClass: 'Aerospace & Defense',
  changePercent: -6.4,
  currentPrice: 114.20,
  previousClose: 122.01,
  period: '1D',
  triggeredAt: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString(),
  status: 'ACTIVE',
  fingerprint: 'RTX_DOWN_2026_09_CATALYST',
  reportId: 'rep_rtx_2026_09_pw1100g',
  catalystSummary: 'FAA & EASA expand accelerated ultrasonic inspection directive for PW1100G-JM high-pressure turbine disks.',
  lastCheckedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
};

const SEED_REPORT_RTX: ResearchReport = {
  id: 'rep_rtx_2026_09_pw1100g',
  eventId: 'evt_rtx_2026_09_pratt_pw1100g_inspection',
  assetName: 'RTX Corporation',
  ticker: 'RTX',
  assetClass: 'Aerospace & Defense',
  changePercent: -6.4,
  period: '1D',
  triggerTimestamp: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString(),
  executiveSummary: 'RTX Corp shares slid 6.4% in intraday European/US crossover trade following an emergency Airworthiness Directive notification regarding expanded powdered-metal inspection protocols across Pratt & Whitney GTF engines. The market is pricing in incremental airline fleet grounding compensation and warranty cash outflows across FY2026.',
  immediateCatalyst: 'CONFIRMED FACT: The Federal Aviation Administration (FAA) issued a revised Emergency Airworthiness Directive requiring 180-day ultrasonic micro-crack inspections on Tier-2 powder-metal turbine hubs manufactured between 2018 and 2021. REPORTED CLAIM: Industry trade publications indicate up to 240 additional commercial A320neo airframes could require shop visits by Q1 2027.',
  directMarketImpact: 'Direct operational drag is concentrated in the Pratt & Whitney division. Maintenance, repair, and overhaul (MRO) turnaround timelines are projected to widen from 130 to 175 days. RTX Collins Aerospace systems and defense backlogs (Raytheon missiles/radars) remain fundamentally insulated but suffer from cross-sector beta drag.',
  broaderContext: 'Commercial aerospace remains constrained by structural titanium supply bottlenecks, CFM LEAP supply competition, and Airbus single-aisle delivery delays. Global airline passenger yields remain strong, incentivizing carriers to lease older CFM56-powered aircraft at steep premiums.',
  whatMarketIsReactingTo: 'Investors are reacting primarily to uncertainty over potential cash charge revisions. Consensus estimates had modeled GTF warranty liabilities peaking in early 2025; the new scope introduces risk of extended cash burn into H2 2026.',
  whatToWatchNext: '1. Formal RTX 8-K filing or investor advisory call detailing estimated cash-flow impact.\n2. Airbus monthly delivery update regarding A320neo glider counts.\n3. Airline operator commentary (Lufthansa, Delta, Indigo) regarding wet-lease capacity substitutions.',
  confidence: 'HIGH',
  confidenceExplanation: 'Confirmed directly through regulatory aviation filings and company statements; financial impact estimates corroborated across multiple tier-1 aerospace equity research desks.',
  sources: [
    {
      title: 'Federal Aviation Administration Airworthiness Directives: Pratt & Whitney PW1100G Series',
      url: 'https://www.faa.gov/regulations_policies/airworthiness_directives',
      publisher: 'FAA Official',
      sourceCategory: 'PRIMARY_OFFICIAL',
      relevance: 'Official regulatory directive detailing mandatory inspection scope.'
    },
    {
      title: 'RTX Corp Regulatory Disclosures and SEC Form 8-K',
      url: 'https://www.sec.gov/edgar/searchedgar/companysearch',
      publisher: 'SEC EDGAR',
      sourceCategory: 'PRIMARY_OFFICIAL',
      relevance: 'Official corporate disclosure regarding operational contingencies.'
    },
    {
      title: 'Aerospace Daily & Defense Report: GTF Fleet Inspection Cycle Extended',
      url: 'https://aviationweek.com',
      publisher: 'Aviation Week Network',
      sourceCategory: 'SPECIALIST',
      relevance: 'Specialist engineering breakdown of ultrasonic scanning cadence.'
    },
    {
      title: 'Reuters: RTX shares dip as engine inspection schedule expands',
      url: 'https://www.reuters.com/business/aerospace-defense',
      publisher: 'Reuters Aerospace',
      sourceCategory: 'FINANCIAL_NEWS',
      relevance: 'Financial market reporting on equity price reaction and analyst commentary.'
    }
  ],
  status: 'COMPLETED',
  createdAt: new Date(Date.now() - 3.4 * 3600 * 1000).toISOString()
};

const SEED_EVENT_BRENT: ResearchEvent = {
  id: 'evt_brent_2026_09_strait_hormuz_insurance',
  ticker: 'BRENT',
  assetName: 'Brent Crude Benchmark',
  assetClass: 'Commodities Energy',
  changePercent: 4.2,
  currentPrice: 81.65,
  previousClose: 78.36,
  period: '1D',
  triggeredAt: new Date(Date.now() - 6.0 * 3600 * 1000).toISOString(),
  status: 'ACTIVE',
  fingerprint: 'BRENT_UP_2026_09_HORMUZ',
  reportId: 'rep_brent_2026_09_hormuz',
  catalystSummary: 'Lloyds Market Association Joint War Committee issues enhanced maritime risk advisory for Persian Gulf / Strait of Hormuz tanker transits.',
  lastCheckedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
};

const SEED_REPORT_BRENT: ResearchReport = {
  id: 'rep_brent_2026_09_hormuz',
  eventId: 'evt_brent_2026_09_strait_hormuz_insurance',
  assetName: 'Brent Crude Benchmark',
  ticker: 'BRENT',
  assetClass: 'Commodities Energy',
  changePercent: 4.2,
  period: '1D',
  triggerTimestamp: new Date(Date.now() - 6.0 * 3600 * 1000).toISOString(),
  executiveSummary: 'Brent crude jumped +4.2% to $81.65/bbl after maritime war-risk underwriters instituted a 35% surcharge hike on VLCC (Very Large Crude Carrier) fixtures passing through the Strait of Hormuz. Prompt calendar spreads widened aggressively into backwardation as Asian refiners front-loaded charter bookings.',
  immediateCatalyst: 'CONFIRMED FACT: The Lloyd\'s Joint War Committee listed additional geographic coordinates in the Gulf of Oman as high-risk navigational sectors. REPORTED CLAIM: Real-time intelligence signals report radar anomalies and naval escort requests for foreign-flagged tankers.',
  directMarketImpact: 'Physical crude freight rates (Worldscale rates TD3C Arabian Gulf to China) rose 18 points. Brent prompt 1M/2M timespread widened by +$0.55/bbl, signalling tight prompt delivery markets despite neutral OPEC+ baseline quota compliance.',
  broaderContext: 'Global crude stocks remain at the lower end of their 5-year average range. Strategic Petroleum Reserve (SPR) replenishments and steady Indian/Chinese crude refinery throughput continue to provide structural support on dips.',
  whatMarketIsReactingTo: 'Short-term short covering by macro trend-following CTAs as the geopolitical risk premium jumped approximately $3.50/bbl above underlying physical equilibrium.',
  whatToWatchNext: '1. Official communications from the International Maritime Organization (IMO) and naval task forces.\n2. Tanker charter fixture rates out of Ras Tanura and Fujairah.\n3. U.S. EIA weekly crude inventory report for export and import deviations.',
  confidence: 'HIGH',
  confidenceExplanation: 'Supported by Lloyd\'s underwriting circulars, official tanker fixture data from Baltic Exchange, and corroborated across energy desk reports.',
  sources: [
    {
      title: 'Lloyds Market Association Joint War Committee Risk Circular',
      url: 'https://www.lmalloyds.com',
      publisher: 'LMA Maritime Official',
      sourceCategory: 'PRIMARY_OFFICIAL',
      relevance: 'Official maritime insurance directive on Persian Gulf transit risk ratings.'
    },
    {
      title: 'U.S. Energy Information Administration (EIA) World Oil Transit Chokepoints',
      url: 'https://www.eia.gov',
      publisher: 'U.S. EIA',
      sourceCategory: 'PRIMARY_OFFICIAL',
      relevance: 'Official infrastructure and volumetric transit documentation.'
    },
    {
      title: 'Bloomberg Energy: Crude jumps as Hormuz tanker insurance premiums surge',
      url: 'https://www.bloomberg.com/energy',
      publisher: 'Bloomberg Markets',
      sourceCategory: 'FINANCIAL_NEWS',
      relevance: 'Market reporting on timespread widening and physical tanker bookings.'
    },
    {
      title: 'FinancialJuice Breaking Alert: Middle East Maritime Security Advisory',
      url: 'https://www.financialjuice.com',
      publisher: 'FinancialJuice',
      sourceCategory: 'REAL_TIME_SIGNAL',
      relevance: 'Early real-time breaking market signal alert.'
    }
  ],
  status: 'COMPLETED',
  createdAt: new Date(Date.now() - 5.8 * 3600 * 1000).toISOString()
};

let inMemoryStore: InMemoryResearchStore = {
  events: [SEED_EVENT_RTX, SEED_EVENT_BRENT],
  reports: [SEED_REPORT_RTX, SEED_REPORT_BRENT],
  config: getDefaultResearchConfig(),
  lastRunAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
};

let tablesInitialized = false;

function parseVisualPayload(value: unknown): VisualEnrichmentPayload | undefined {
  if (!value) return undefined;
  if (typeof value === 'object') return value as VisualEnrichmentPayload;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed as VisualEnrichmentPayload : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export async function ensureResearchTables(pool: pg.Pool | null): Promise<void> {
  if (!pool || tablesInitialized) return;

  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS market_research_events (
          id VARCHAR(64) PRIMARY KEY,
          ticker VARCHAR(32) NOT NULL,
          asset_name VARCHAR(128),
          asset_class VARCHAR(64),
          change_percent NUMERIC(8,4) NOT NULL,
          current_price NUMERIC(16,4) NOT NULL,
          previous_close NUMERIC(16,4) NOT NULL,
          period VARCHAR(32) NOT NULL,
          triggered_at TIMESTAMPTZ NOT NULL,
          status VARCHAR(32) NOT NULL,
          fingerprint VARCHAR(128) NOT NULL,
          report_id VARCHAR(64),
          catalyst_summary TEXT,
          last_checked_at TIMESTAMPTZ,
          cooldown_until TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS market_research_reports (
          id VARCHAR(64) PRIMARY KEY,
          event_id VARCHAR(64) NOT NULL,
          asset_name VARCHAR(128) NOT NULL,
          ticker VARCHAR(32) NOT NULL,
          asset_class VARCHAR(64) NOT NULL,
          change_percent NUMERIC(8,4) NOT NULL,
          period VARCHAR(32) NOT NULL,
          trigger_timestamp TIMESTAMPTZ NOT NULL,
          executive_summary TEXT NOT NULL,
          immediate_catalyst TEXT NOT NULL,
          direct_market_impact TEXT NOT NULL,
          broader_context TEXT NOT NULL,
          what_market_is_reacting_to TEXT NOT NULL,
          what_to_watch_next TEXT NOT NULL,
          confidence VARCHAR(16) NOT NULL,
          confidence_explanation TEXT,
          sources JSONB NOT NULL DEFAULT '[]'::jsonb,
          visual_payload JSONB DEFAULT NULL,
          raw_markdown TEXT,
          status VARCHAR(32) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS market_research_config (
          id VARCHAR(32) PRIMARY KEY DEFAULT 'default',
          config JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // Existing deployments may have created the reports table before the
      // visual layer existed. Keep this migration safe to run repeatedly.
      await client.query(`
        ALTER TABLE market_research_reports
        ADD COLUMN IF NOT EXISTS visual_payload JSONB DEFAULT NULL;
      `);

      tablesInitialized = true;
      console.log('[Market Research Store] PostgreSQL tables verified and active.');

      // Hydrate in-memory store with reports from PostgreSQL on startup
      try {
        const repRes = await client.query('SELECT * FROM market_research_reports ORDER BY created_at DESC LIMIT 50');
        if (repRes.rows && repRes.rows.length > 0) {
          const dbReports: ResearchReport[] = repRes.rows.map(r => ({
            id: r.id,
            eventId: r.event_id,
            assetName: r.asset_name,
            ticker: r.ticker,
            assetClass: r.asset_class,
            changePercent: Number(r.change_percent),
            period: r.period,
            triggerTimestamp: r.trigger_timestamp instanceof Date ? r.trigger_timestamp.toISOString() : r.trigger_timestamp,
            executiveSummary: r.executive_summary,
            immediateCatalyst: r.immediate_catalyst,
            directMarketImpact: r.direct_market_impact,
            broaderContext: r.broader_context,
            whatMarketIsReactingTo: r.what_market_is_reacting_to,
            whatToWatchNext: r.what_to_watch_next,
            confidence: r.confidence,
            confidenceExplanation: r.confidence_explanation || undefined,
            sources: typeof r.sources === 'string' ? JSON.parse(r.sources) : (r.sources || []),
            visualPayload: parseVisualPayload(r.visual_payload || r.visualPayload),
            visual_payload: parseVisualPayload(r.visual_payload || r.visualPayload),
            rawMarkdown: r.raw_markdown || undefined,
            status: r.status,
            createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at
          }));
          for (const rep of dbReports) {
            if (!inMemoryStore.reports.some(r => r.id === rep.id)) {
              inMemoryStore.reports.push(rep);
            }
          }
          console.log(`[Market Research Store] Hydrated ${dbReports.length} reports into fast RAM store.`);
        }
      } catch (hErr: any) {
        console.warn('[Market Research Store] Startup hydration warning:', hErr.message);
      }
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.warn('[Market Research Store] DB table init warning, running with memory store fallback:', err.message);
  }
}

// ----------------------------------------------------------------------------
// Events Management
// ----------------------------------------------------------------------------

export async function saveResearchEvent(event: ResearchEvent, pool: pg.Pool | null): Promise<ResearchEvent> {
  // Update in-memory store
  const existingIdx = inMemoryStore.events.findIndex(e => e.id === event.id);
  if (existingIdx >= 0) {
    inMemoryStore.events[existingIdx] = { ...event };
  } else {
    inMemoryStore.events.unshift({ ...event });
  }

  // Update PostgreSQL if available
  if (pool) {
    try {
      await ensureResearchTables(pool);
      await pool.query(
        `INSERT INTO market_research_events (
          id, ticker, asset_name, asset_class, change_percent, current_price, previous_close,
          period, triggered_at, status, fingerprint, report_id, catalyst_summary, last_checked_at, cooldown_until
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO UPDATE SET
          change_percent = EXCLUDED.change_percent,
          current_price = EXCLUDED.current_price,
          status = EXCLUDED.status,
          report_id = EXCLUDED.report_id,
          catalyst_summary = EXCLUDED.catalyst_summary,
          last_checked_at = EXCLUDED.last_checked_at,
          cooldown_until = EXCLUDED.cooldown_until`,
        [
          event.id,
          event.ticker,
          event.assetName,
          event.assetClass,
          event.changePercent,
          event.currentPrice,
          event.previousClose,
          event.period,
          event.triggeredAt,
          event.status,
          event.fingerprint,
          event.reportId || null,
          event.catalystSummary || null,
          event.lastCheckedAt || null,
          event.cooldownUntil || null
        ]
      );
    } catch (err: any) {
      console.warn('[Market Research Store] DB event save warning:', err.message);
    }
  }

  return event;
}

export async function updateResearchEvent(
  eventId: string,
  updates: Partial<ResearchEvent>,
  pool: pg.Pool | null
): Promise<ResearchEvent | null> {
  const existing = inMemoryStore.events.find(e => e.id === eventId);
  if (existing) {
    Object.assign(existing, updates);
  }

  if (pool) {
    try {
      await ensureResearchTables(pool);
      const fields: string[] = [];
      const values: any[] = [];
      let i = 1;

      if (updates.status !== undefined) {
        fields.push(`status = $${i++}`);
        values.push(updates.status);
      }
      if (updates.reportId !== undefined) {
        fields.push(`report_id = $${i++}`);
        values.push(updates.reportId);
      }
      if (updates.changePercent !== undefined) {
        fields.push(`change_percent = $${i++}`);
        values.push(updates.changePercent);
      }
      if (updates.currentPrice !== undefined) {
        fields.push(`current_price = $${i++}`);
        values.push(updates.currentPrice);
      }
      if (updates.catalystSummary !== undefined) {
        fields.push(`catalyst_summary = $${i++}`);
        values.push(updates.catalystSummary);
      }
      if (updates.lastCheckedAt !== undefined) {
        fields.push(`last_checked_at = $${i++}`);
        values.push(updates.lastCheckedAt);
      }
      if (updates.cooldownUntil !== undefined) {
        fields.push(`cooldown_until = $${i++}`);
        values.push(updates.cooldownUntil);
      }

      if (fields.length > 0) {
        values.push(eventId);
        await pool.query(
          `UPDATE market_research_events SET ${fields.join(', ')} WHERE id = $${i}`,
          values
        );
      }
    } catch (err: any) {
      console.warn('[Market Research Store] DB event update warning:', err.message);
    }
  }

  return existing || null;
}

export async function getResearchEvents(
  options?: { status?: string; ticker?: string; limit?: number },
  pool?: pg.Pool | null
): Promise<ResearchEvent[]> {
  if (pool) {
    try {
      await ensureResearchTables(pool);
      let sql = `SELECT * FROM market_research_events WHERE 1=1`;
      const params: any[] = [];

      if (options?.status && options.status !== 'ALL') {
        params.push(options.status);
        sql += ` AND status = $${params.length}`;
      }
      if (options?.ticker) {
        params.push(options.ticker.toUpperCase());
        sql += ` AND ticker = $${params.length}`;
      }

      const limit = Math.min(options?.limit || 50, 100);
      sql += ` ORDER BY triggered_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const res = await pool.query(sql, params);
      if (res.rows && res.rows.length > 0) {
        return res.rows.map(r => ({
          id: r.id,
          ticker: r.ticker,
          assetName: r.asset_name,
          assetClass: r.asset_class,
          changePercent: Number(r.change_percent),
          currentPrice: Number(r.current_price),
          previousClose: Number(r.previous_close),
          period: r.period,
          triggeredAt: r.triggered_at instanceof Date ? r.triggered_at.toISOString() : r.triggered_at,
          status: r.status,
          fingerprint: r.fingerprint,
          reportId: r.report_id || undefined,
          catalystSummary: r.catalyst_summary || undefined,
          lastCheckedAt: r.last_checked_at instanceof Date ? r.last_checked_at.toISOString() : r.last_checked_at,
          cooldownUntil: r.cooldown_until instanceof Date ? r.cooldown_until.toISOString() : r.cooldown_until
        }));
      }
    } catch (err: any) {
      console.warn('[Market Research Store] DB getEvents error, falling back to memory store:', err.message);
    }
  }

  // Memory fallback
  let list = [...inMemoryStore.events];
  if (options?.status && options.status !== 'ALL') {
    list = list.filter(e => e.status === options.status);
  }
  if (options?.ticker) {
    list = list.filter(e => e.ticker.toUpperCase() === options.ticker!.toUpperCase());
  }
  list.sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());
  return list.slice(0, options?.limit || 50);
}

export async function findActiveEventForTicker(
  ticker: string,
  _dedupWindowHours = 24,
  pool?: pg.Pool | null,
  sessionDateStr?: string
): Promise<ResearchEvent | null> {
  const todaySessionStr = sessionDateStr || new Date().toISOString().slice(0, 10);

  if (pool) {
    try {
      await ensureResearchTables(pool);
      // Strictly session-scoped: only match events created or triggered in the CURRENT trading session
      const res = await pool.query(
        `SELECT * FROM market_research_events 
         WHERE ticker = $1 
           AND status IN ('NEW', 'RESEARCHING', 'ACTIVE') 
           AND (
             fingerprint LIKE $2
             OR (triggered_at AT TIME ZONE 'UTC')::date = $3::date
             OR (created_at AT TIME ZONE 'UTC')::date = $3::date
           )
         ORDER BY triggered_at DESC 
         LIMIT 1`,
        [ticker.toUpperCase(), `${ticker.toUpperCase()}_%_${todaySessionStr}`, todaySessionStr]
      );
      if (res.rows && res.rows.length > 0) {
        const r = res.rows[0];
        return {
          id: r.id,
          ticker: r.ticker,
          assetName: r.asset_name,
          assetClass: r.asset_class,
          changePercent: Number(r.change_percent),
          currentPrice: Number(r.current_price),
          previousClose: Number(r.previous_close),
          period: r.period,
          triggeredAt: r.triggered_at instanceof Date ? r.triggered_at.toISOString() : r.triggered_at,
          status: r.status,
          fingerprint: r.fingerprint,
          reportId: r.report_id || undefined,
          catalystSummary: r.catalyst_summary || undefined,
          lastCheckedAt: r.last_checked_at instanceof Date ? r.last_checked_at.toISOString() : r.last_checked_at,
          cooldownUntil: r.cooldown_until instanceof Date ? r.cooldown_until.toISOString() : r.cooldown_until
        };
      }
    } catch (err: any) {
      console.warn('[Market Research Store] DB findActiveEvent error:', err.message);
    }
  }

  // Memory fallback - strictly scoped to todaySessionStr
  const found = inMemoryStore.events.find(
    e => e.ticker.toUpperCase() === ticker.toUpperCase() &&
         ['NEW', 'RESEARCHING', 'ACTIVE'].includes(e.status) &&
         (e.fingerprint?.includes(todaySessionStr) || e.triggeredAt?.startsWith(todaySessionStr))
  );
  return found || null;
}

/**
 * Automatically seal previous session events so their recorded price and change percent
 * remain locked permanently as the final stand (eindstand) of that session.
 */
export async function closePreviousSessionEvents(pool?: pg.Pool | null): Promise<number> {
  let closedCount = 0;
  const todayDateStr = new Date().toISOString().slice(0, 10);

  // 1. In-memory store
  for (const ev of inMemoryStore.events) {
    const evDateStr = ev.triggeredAt ? ev.triggeredAt.slice(0, 10) : '';
    if (evDateStr && evDateStr < todayDateStr && ['NEW', 'RESEARCHING', 'ACTIVE'].includes(ev.status)) {
      ev.status = 'COOLED_DOWN';
      closedCount++;
    }
  }

  // 2. PostgreSQL
  if (pool) {
    try {
      await ensureResearchTables(pool);
      const res = await pool.query(`
        UPDATE market_research_events 
        SET status = 'COOLED_DOWN'
        WHERE status IN ('NEW', 'RESEARCHING', 'ACTIVE') 
          AND (triggered_at AT TIME ZONE 'UTC')::date < (NOW() AT TIME ZONE 'UTC')::date
      `);
      if (res.rowCount && res.rowCount > 0) {
        closedCount += res.rowCount;
      }
    } catch (err: any) {
      console.warn('[Market Research Store] closePreviousSessionEvents DB warning:', err.message);
    }
  }

  return closedCount;
}

/**
 * Automatically clean up and expire events that were stuck in 'RESEARCHING' or 'NEW'
 * for longer than maxAgeMinutes (default 3 minutes).
 * Also permanently seals any older events from previous trading sessions.
 */
export async function cleanupStaleResearchEvents(
  maxAgeMinutes = 3,
  pool?: pg.Pool | null
): Promise<number> {
  // Seal previous session events first
  await closePreviousSessionEvents(pool).catch(() => {});

  const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000).toISOString();
  let cleanedCount = 0;

  // 1. Clean in-memory store
  for (const ev of inMemoryStore.events) {
    if ((ev.status === 'RESEARCHING' || ev.status === 'NEW') && ev.triggeredAt < cutoffTime) {
      ev.status = 'COOLED_DOWN';
      ev.catalystSummary = ev.catalystSummary || 'Onderzoek afgerond / timeout hersteld';
      cleanedCount++;
    }
  }

  // 2. Clean PostgreSQL
  if (pool) {
    try {
      await ensureResearchTables(pool);
      const res = await pool.query(
        `UPDATE market_research_events 
         SET status = 'COOLED_DOWN',
             catalyst_summary = COALESCE(catalyst_summary, 'Onderzoek afgerond / timeout hersteld')
         WHERE status IN ('NEW', 'RESEARCHING') 
           AND triggered_at < $1`,
        [cutoffTime]
      );
      if (res.rowCount && res.rowCount > 0) {
        cleanedCount += res.rowCount;
        console.log(`[Market Research Store] Auto-recovered ${res.rowCount} stale RESEARCHING events.`);
      }
    } catch (err: any) {
      console.warn('[Market Research Store] cleanupStaleResearchEvents DB warning:', err.message);
    }
  }

  return cleanedCount;
}

// ----------------------------------------------------------------------------
// Reports Management
// ----------------------------------------------------------------------------

export async function saveResearchReport(report: ResearchReport, pool: pg.Pool | null): Promise<ResearchReport> {
  // Update memory store
  const existingIdx = inMemoryStore.reports.findIndex(r => r.id === report.id);
  if (existingIdx >= 0) {
    inMemoryStore.reports[existingIdx] = { ...report };
  } else {
    inMemoryStore.reports.unshift({ ...report });
  }

  if (pool) {
    try {
      await ensureResearchTables(pool);
      await pool.query(
        `INSERT INTO market_research_reports (
          id, event_id, asset_name, ticker, asset_class, change_percent, period,
          trigger_timestamp, executive_summary, immediate_catalyst, direct_market_impact,
          broader_context, what_market_is_reacting_to, what_to_watch_next,
          confidence, confidence_explanation, sources, raw_markdown, status, created_at,
          visual_payload
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        ON CONFLICT (id) DO UPDATE SET
          executive_summary = EXCLUDED.executive_summary,
          immediate_catalyst = EXCLUDED.immediate_catalyst,
          direct_market_impact = EXCLUDED.direct_market_impact,
          broader_context = EXCLUDED.broader_context,
          what_market_is_reacting_to = EXCLUDED.what_market_is_reacting_to,
          what_to_watch_next = EXCLUDED.what_to_watch_next,
          confidence = EXCLUDED.confidence,
          confidence_explanation = EXCLUDED.confidence_explanation,
          sources = EXCLUDED.sources,
          raw_markdown = EXCLUDED.raw_markdown,
          status = EXCLUDED.status,
          visual_payload = EXCLUDED.visual_payload`,
        [
          report.id,
          report.eventId,
          report.assetName,
          report.ticker,
          report.assetClass,
          report.changePercent,
          report.period,
          report.triggerTimestamp,
          report.executiveSummary,
          report.immediateCatalyst,
          report.directMarketImpact,
          report.broaderContext,
          report.whatMarketIsReactingTo,
          report.whatToWatchNext,
          report.confidence,
          report.confidenceExplanation || null,
          JSON.stringify(report.sources || []),
          report.rawMarkdown || null,
          report.status,
          report.createdAt,
          JSON.stringify(report.visualPayload || report.visual_payload || null)
        ]
      );
    } catch (err: any) {
      console.warn('[Market Research Store] DB report save warning:', err.message);
    }
  }

  return report;
}

export async function getResearchReport(id: string, pool?: pg.Pool | null): Promise<ResearchReport | null> {
  if (pool) {
    try {
      await ensureResearchTables(pool);
      const res = await pool.query(
        `SELECT * FROM market_research_reports WHERE id = $1 LIMIT 1`,
        [id]
      );
      if (res.rows && res.rows.length > 0) {
        const r = res.rows[0];
        return {
          id: r.id,
          eventId: r.event_id,
          assetName: r.asset_name,
          ticker: r.ticker,
          assetClass: r.asset_class,
          changePercent: Number(r.change_percent),
          period: r.period,
          triggerTimestamp: r.trigger_timestamp instanceof Date ? r.trigger_timestamp.toISOString() : r.trigger_timestamp,
          executiveSummary: r.executive_summary,
          immediateCatalyst: r.immediate_catalyst,
          directMarketImpact: r.direct_market_impact,
          broaderContext: r.broader_context,
          whatMarketIsReactingTo: r.what_market_is_reacting_to,
          whatToWatchNext: r.what_to_watch_next,
          confidence: r.confidence,
          confidenceExplanation: r.confidence_explanation || undefined,
          sources: typeof r.sources === 'string' ? JSON.parse(r.sources) : (r.sources || []),
          visualPayload: parseVisualPayload(r.visual_payload || r.visualPayload),
          visual_payload: parseVisualPayload(r.visual_payload || r.visualPayload),
          rawMarkdown: r.raw_markdown || undefined,
          status: r.status,
          createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at
        };
      }
    } catch (err: any) {
      console.warn('[Market Research Store] DB getReport error:', err.message);
    }
  }

  const found = inMemoryStore.reports.find(r => r.id === id);
  return found || null;
}

export async function getResearchReports(
  options?: { ticker?: string; limit?: number },
  pool?: pg.Pool | null
): Promise<ResearchReport[]> {
  if (pool) {
    try {
      await ensureResearchTables(pool);
      let sql = `SELECT * FROM market_research_reports WHERE 1=1`;
      const params: any[] = [];

      if (options?.ticker) {
        params.push(options.ticker.toUpperCase());
        sql += ` AND ticker = $${params.length}`;
      }

      const limit = Math.min(options?.limit || 30, 100);
      sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const res = await pool.query(sql, params);
      if (res.rows && res.rows.length > 0) {
        return res.rows.map(r => ({
          id: r.id,
          eventId: r.event_id,
          assetName: r.asset_name,
          ticker: r.ticker,
          assetClass: r.asset_class,
          changePercent: Number(r.change_percent),
          period: r.period,
          triggerTimestamp: r.trigger_timestamp instanceof Date ? r.trigger_timestamp.toISOString() : r.trigger_timestamp,
          executiveSummary: r.executive_summary,
          immediateCatalyst: r.immediate_catalyst,
          directMarketImpact: r.direct_market_impact,
          broaderContext: r.broader_context,
          whatMarketIsReactingTo: r.what_market_is_reacting_to,
          whatToWatchNext: r.what_to_watch_next,
          confidence: r.confidence,
          confidenceExplanation: r.confidence_explanation || undefined,
          sources: typeof r.sources === 'string' ? JSON.parse(r.sources) : (r.sources || []),
          visualPayload: parseVisualPayload(r.visual_payload || r.visualPayload),
          visual_payload: parseVisualPayload(r.visual_payload || r.visualPayload),
          rawMarkdown: r.raw_markdown || undefined,
          status: r.status,
          createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at
        }));
      }
    } catch (err: any) {
      console.warn('[Market Research Store] DB getReports error:', err.message);
    }
  }

  let list = [...inMemoryStore.reports];
  if (options?.ticker) {
    list = list.filter(r => r.ticker.toUpperCase() === options.ticker!.toUpperCase());
  }
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return list.slice(0, options?.limit || 30);
}

// ----------------------------------------------------------------------------
// Configuration Management
// ----------------------------------------------------------------------------

export async function getResearchConfig(pool?: pg.Pool | null): Promise<ResearchConfig> {
  if (pool) {
    try {
      await ensureResearchTables(pool);
      const res = await pool.query(`SELECT config FROM market_research_config WHERE id = 'default' LIMIT 1`);
      if (res.rows && res.rows.length > 0) {
        const rawConfig = res.rows[0].config;
        const parsed = typeof rawConfig === 'string' ? JSON.parse(rawConfig) : rawConfig;
        inMemoryStore.config = parsed;
        return parsed;
      }
    } catch (err: any) {
      console.warn('[Market Research Store] DB getConfig error:', err.message);
    }
  }

  return inMemoryStore.config;
}

export async function saveResearchConfig(config: ResearchConfig, pool?: pg.Pool | null): Promise<ResearchConfig> {
  inMemoryStore.config = { ...config };

  if (pool) {
    try {
      await ensureResearchTables(pool);
      await pool.query(
        `INSERT INTO market_research_config (id, config, updated_at) 
         VALUES ('default', $1, NOW()) 
         ON CONFLICT (id) DO UPDATE SET config = EXCLUDED.config, updated_at = NOW()`,
        [JSON.stringify(config)]
      );
    } catch (err: any) {
      console.warn('[Market Research Store] DB saveConfig error:', err.message);
    }
  }

  return inMemoryStore.config;
}

export function recordMarketMonitorRun(): void {
  inMemoryStore.lastRunAt = new Date().toISOString();
}

let cachedDashboard: { data: ResearchDashboardData; timestamp: number } | null = null;
const DASHBOARD_CACHE_TTL_MS = 15000; // 15 seconds fast in-memory cache

export async function getResearchDashboardData(pool?: pg.Pool | null): Promise<ResearchDashboardData> {
  const now = Date.now();
  if (cachedDashboard && now - cachedDashboard.timestamp < DASHBOARD_CACHE_TTL_MS) {
    return cachedDashboard.data;
  }

  // Auto-clean stale events in the background
  cleanupStaleResearchEvents(3, pool).catch(() => {});

  let events: ResearchEvent[] = [];
  let reports: ResearchReport[] = [];
  let config = inMemoryStore.config;

  if (pool) {
    try {
      // 5s timeout on PostgreSQL so slow intercontinental connections complete reliably
      const result = await Promise.race([
        Promise.all([
          getResearchEvents({ limit: 40 }, pool),
          getResearchReports({ limit: 20 }, pool),
          getResearchConfig(pool)
        ]),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Postgres query timeout')), 5000)
        )
      ]);
      events = result[0];
      reports = result[1];
      config = result[2];

      // Keep in-memory store synchronized with fresh DB data
      for (const ev of events) {
        const existingIdx = inMemoryStore.events.findIndex(e => e.id === ev.id);
        if (existingIdx >= 0) {
          inMemoryStore.events[existingIdx] = { ...ev };
        } else {
          inMemoryStore.events.unshift(ev);
        }
      }
      for (const rep of reports) {
        if (!inMemoryStore.reports.some(r => r.id === rep.id)) {
          inMemoryStore.reports.push(rep);
        }
      }
    } catch (err: any) {
      console.warn('[Market Research Store] DB query slow/timed out, serving ultra-fast in-memory fallback:', err.message);
      events = inMemoryStore.events.slice(0, 40);
      reports = inMemoryStore.reports.slice(0, 20);
      config = inMemoryStore.config;
    }
  } else {
    events = inMemoryStore.events.slice(0, 40);
    reports = inMemoryStore.reports.slice(0, 20);
  }

  const activeEvents = events.filter(e => ['NEW', 'RESEARCHING', 'ACTIVE'].includes(e.status));
  const monitoredAssets = Object.values(config.assets).filter(a => a.enabled);

  const data: ResearchDashboardData = {
    activeEvents,
    recentReports: reports,
    recentEvents: events,
    stats: {
      totalEvents: events.length,
      totalReports: reports.length,
      activeCount: activeEvents.length,
      monitoredAssetsCount: monitoredAssets.length,
      lastRunAt: inMemoryStore.lastRunAt
    },
    config
  };

  cachedDashboard = { data, timestamp: now };
  return data;
}
