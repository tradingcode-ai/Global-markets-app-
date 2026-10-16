import pg from 'pg';
import { randomUUID } from 'node:crypto';
import type { ResearchEvent, ResearchReport } from '../types/marketResearch';
import { RESEARCH_YAHOO_ALIASES } from './researchSessionQuotes';

export type ResearchDirection = 'UP' | 'DOWN';
export interface ResearchLease { eventId: string; reportId: string; owner: string; }
const schemaFlights = new WeakMap<pg.Pool, Promise<void>>();
export const MAX_RESEARCH_ATTEMPTS = 3;

/** Shared by HTTP workers and the CLI. Never substitute process-local memory. */
export async function ensureResearchSessionSchema(pool: pg.Pool | null, client?: pg.PoolClient): Promise<void> {
  if (!pool) throw new Error('Research requires PostgreSQL session reservations; generation is paused.');
  let flight = schemaFlights.get(pool);
  if (!flight) {
    flight = (client || pool).query(`
      ALTER TABLE market_research_events
        ADD COLUMN IF NOT EXISTS session_start TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS session_end TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS session_date VARCHAR(10),
        ADD COLUMN IF NOT EXISTS trigger_direction VARCHAR(4);
      CREATE TABLE IF NOT EXISTS market_research_session_claims (
        market_symbol VARCHAR(32) NOT NULL,
        session_start TIMESTAMPTZ NOT NULL,
        session_end TIMESTAMPTZ NOT NULL,
        session_date VARCHAR(10) NOT NULL,
        direction VARCHAR(4) NOT NULL CHECK (direction IN ('UP', 'DOWN')),
        event_id VARCHAR(64) NOT NULL UNIQUE,
        report_id VARCHAR(64) NOT NULL UNIQUE,
        state VARCHAR(16) NOT NULL DEFAULT 'PENDING',
        attempts INTEGER NOT NULL DEFAULT 0,
        lease_owner UUID,
        lease_until TIMESTAMPTZ,
        next_attempt_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (market_symbol, session_start, direction)
      );
      CREATE TABLE IF NOT EXISTS market_research_agent_slot (
        id INTEGER PRIMARY KEY CHECK (id=1),
        database_id UUID NOT NULL,
        lease_owner UUID,
        lease_until TIMESTAMPTZ,
        next_allowed_at TIMESTAMPTZ
      );
      ALTER TABLE market_research_agent_slot ADD COLUMN IF NOT EXISTS database_id UUID;
      INSERT INTO market_research_agent_slot (id,database_id) VALUES (1,'${randomUUID()}') ON CONFLICT DO NOTHING;
      UPDATE market_research_agent_slot SET database_id='${randomUUID()}' WHERE database_id IS NULL;
    `).then(() => undefined).catch(error => { schemaFlights.delete(pool!); throw error; });
    schemaFlights.set(pool, flight);
  }
  await flight;
}

/** A public random identifier, independent of passwords and internal/external database URLs. */
export async function getResearchDatabaseId(pool: pg.Pool | null): Promise<string | null> {
  if (!pool) return null;
  const query: pg.QueryConfig & { query_timeout: number } = {
    text: 'SELECT database_id FROM market_research_agent_slot WHERE id=1', query_timeout: 5000
  };
  const result = await pool.query(query);
  return result.rows[0]?.database_id || null;
}

function iso(value: any): string | undefined {
  return value instanceof Date ? value.toISOString() : value || undefined;
}

export function mapSessionEvent(row: any): ResearchEvent {
  return {
    id: row.id, ticker: row.ticker, assetName: row.asset_name, assetClass: row.asset_class,
    changePercent: Number(row.change_percent), currentPrice: Number(row.current_price),
    previousClose: Number(row.previous_close), period: row.period, triggeredAt: iso(row.triggered_at),
    status: row.status, fingerprint: row.fingerprint, reportId: row.report_id || undefined,
    catalystSummary: row.catalyst_summary, lastCheckedAt: iso(row.last_checked_at),
    triggerPrice: row.trigger_price == null ? undefined : Number(row.trigger_price),
    triggerChangePercent: row.trigger_change_percent == null ? undefined : Number(row.trigger_change_percent),
    marketSymbol: row.market_symbol, sessionStart: iso(row.session_start), sessionEnd: iso(row.session_end),
    sessionDate: row.session_date, triggerDirection: row.trigger_direction,
    sessionClosedAt: iso(row.session_closed_at),
    sessionClosePrice: row.session_close_price == null ? undefined : Number(row.session_close_price),
    sessionCloseChangePercent: row.session_close_change_percent == null ? undefined : Number(row.session_close_change_percent),
    sessionCloseSource: row.session_close_source
  };
}

export function sessionIdentity(event: ResearchEvent): { symbol: string; start: string; end: string; date: string; direction: ResearchDirection } {
  const start = Date.parse(event.sessionStart || '');
  const end = Date.parse(event.sessionEnd || '');
  const quoteTime = Date.parse(event.triggeredAt || '');
  const move = event.triggerChangePercent;
  if (!event.marketSymbol || !Number.isFinite(start) || !Number.isFinite(end) || end <= start ||
      !Number.isFinite(quoteTime) || quoteTime < start || quoteTime >= end ||
      !/^\d{4}-\d{2}-\d{2}$/.test(event.sessionDate || '') || !Number.isFinite(move) || move === 0) {
    throw new Error('Research trigger has no verified exchange session identity.');
  }
  return { symbol: event.marketSymbol.toUpperCase(), start: new Date(start).toISOString(),
    end: new Date(end).toISOString(), date: event.sessionDate!, direction: move! > 0 ? 'UP' : 'DOWN' };
}

/** The transaction serializes legacy adoption as well as insertion of a new session slot. */
export async function reserveResearchSession(
  pool: pg.Pool, candidate: ResearchEvent, allowCreate: boolean
): Promise<{ event: ResearchEvent; created: boolean } | null> {
  await ensureResearchSessionSchema(pool);
  const key = sessionIdentity(candidate);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [JSON.stringify([key.symbol, key.start, key.direction])]);
    const existing = await client.query(`SELECT e.* FROM market_research_session_claims c
      JOIN market_research_events e ON e.id=c.event_id
      WHERE c.market_symbol=$1 AND c.session_start=$2 AND c.direction=$3`, [key.symbol, key.start, key.direction]);
    let row = existing.rows[0];
    let created = false;
    if (!row) {
      const aliases = [key.symbol, candidate.ticker.toUpperCase(), ...Object.entries(RESEARCH_YAHOO_ALIASES)
        .filter(([, value]) => value.toUpperCase() === key.symbol).map(([alias]) => alias)];
      const legacy = await client.query(`SELECT e.*, r.id AS existing_report_id FROM market_research_events e
        LEFT JOIN LATERAL (SELECT id, status, change_percent FROM market_research_reports
          WHERE event_id=e.id ORDER BY (status='COMPLETED') DESC, created_at ASC LIMIT 1) r ON TRUE
        WHERE (UPPER(e.market_symbol)=$1 OR UPPER(e.ticker)=ANY($2::text[]))
          AND e.triggered_at >= $3 AND e.triggered_at < $4
          AND NOT EXISTS (SELECT 1 FROM market_research_session_claims c WHERE c.event_id=e.id)
          AND CASE
            WHEN e.trigger_direction IS NOT NULL THEN e.trigger_direction
            WHEN e.trigger_change_percent > 0 THEN 'UP'
            WHEN e.trigger_change_percent < 0 THEN 'DOWN'
            WHEN e.fingerprint ~ '_UP_' THEN 'UP'
            WHEN e.fingerprint ~ '_DOWN_' THEN 'DOWN'
            WHEN COALESCE(r.change_percent,e.change_percent)>0 THEN 'UP'
            WHEN COALESCE(r.change_percent,e.change_percent)<0 THEN 'DOWN'
          END = $5
        ORDER BY (r.id IS NOT NULL) DESC, (r.status='COMPLETED') DESC NULLS LAST, e.triggered_at ASC
        LIMIT 1`, [key.symbol, aliases, key.start, key.end, key.direction]);
      row = legacy.rows[0];
      if (!row && !allowCreate) { await client.query('COMMIT'); return null; }
      if (row && !row.existing_report_id && !allowCreate) { await client.query('COMMIT'); return null; }
      if (!row) {
        const inserted = await client.query(`INSERT INTO market_research_events (
          id,ticker,asset_name,asset_class,change_percent,current_price,previous_close,period,
          triggered_at,status,fingerprint,last_checked_at,trigger_price,trigger_change_percent,
          market_symbol,session_start,session_end,session_date,trigger_direction
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,'SESSION',$8,'NEW',$9,$8,$10,$5,$11,$12,$13,$14,$15) RETURNING *`,
        [candidate.id, candidate.ticker.toUpperCase(), candidate.assetName, candidate.assetClass,
          candidate.triggerChangePercent, candidate.currentPrice, candidate.previousClose, candidate.triggeredAt,
          `${key.symbol}_${key.direction}_${key.date}`, candidate.triggerPrice, key.symbol, key.start, key.end, key.date, key.direction]);
        row = inserted.rows[0];
        created = true;
      } else {
        await client.query(`UPDATE market_research_events SET market_symbol=$2,session_start=$3,
          session_end=$4,session_date=$5,trigger_direction=$6,report_id=$7::text,
          trigger_price=CASE WHEN $7::text IS NULL THEN COALESCE(trigger_price,$8) ELSE trigger_price END,
          trigger_change_percent=CASE WHEN $7::text IS NULL THEN COALESCE(trigger_change_percent,$9) ELSE trigger_change_percent END,
          triggered_at=CASE WHEN $7::text IS NULL AND trigger_change_percent IS NULL THEN $10::timestamptz ELSE triggered_at END,
          period=CASE WHEN $7::text IS NULL THEN 'SESSION' ELSE period END WHERE id=$1`,
        [row.id, key.symbol, key.start, key.end, key.date, key.direction, row.existing_report_id || null,
          candidate.triggerPrice, candidate.triggerChangePercent, candidate.triggeredAt]);
        Object.assign(row, { market_symbol: key.symbol, session_start: key.start, session_end: key.end,
          session_date: key.date, trigger_direction: key.direction });
      }
      await client.query(`INSERT INTO market_research_session_claims
        (market_symbol,session_start,session_end,session_date,direction,event_id,report_id,state)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [key.symbol, key.start, key.end, key.date, key.direction,
        row.id, row.existing_report_id || `rep_${randomUUID()}`, row.existing_report_id ? 'COMPLETED' : 'PENDING']);
    }
    const refreshed = await client.query(`UPDATE market_research_events SET current_price=$2,
      change_percent=$3,last_checked_at=$4 WHERE id=$1 RETURNING *`,
    [row.id, candidate.currentPrice, candidate.changePercent, candidate.lastCheckedAt]);
    await client.query('COMMIT');
    return { event: mapSessionEvent(refreshed.rows[0]), created };
  } catch (error) { await client.query('ROLLBACK').catch(() => {}); throw error; }
  finally { client.release(); }
}

export async function getRunnableResearchEvents(pool: pg.Pool, verifiedSessions: Set<string>): Promise<ResearchEvent[]> {
  await pool.query(`WITH exhausted AS (
    UPDATE market_research_session_claims SET state='EXHAUSTED',lease_owner=NULL,lease_until=NULL
    WHERE state='RUNNING' AND attempts >= $1 AND lease_until <= NOW() RETURNING event_id
  ) UPDATE market_research_events e SET status='COOLED_DOWN',catalyst_summary='Research retry limit reached after an abandoned execution.'
    FROM exhausted x WHERE e.id=x.event_id`, [MAX_RESEARCH_ATTEMPTS]);
  const result = await pool.query(`SELECT e.* FROM market_research_session_claims c
    JOIN market_research_events e ON e.id=c.event_id
    WHERE c.state <> 'COMPLETED' AND c.attempts < $1
      AND c.session_start <= NOW() AND c.session_end > NOW()
      AND (c.lease_until IS NULL OR c.lease_until <= NOW())
      AND (c.next_attempt_at IS NULL OR c.next_attempt_at <= NOW())
    ORDER BY c.created_at ASC`, [MAX_RESEARCH_ATTEMPTS]);
  return result.rows.filter(row => verifiedSessions.has(`${row.market_symbol}|${iso(row.session_start)}`)).map(mapSessionEvent);
}

export async function acquireResearchLease(pool: pg.Pool, eventId: string): Promise<ResearchLease | null> {
  const owner = randomUUID();
  const client = await pool.connect();
  try {
  await client.query('BEGIN');
  const slot = await client.query(`SELECT (lease_until IS NULL OR lease_until<=NOW())
    AND (next_allowed_at IS NULL OR next_allowed_at<=NOW()) AS available
    FROM market_research_agent_slot WHERE id=1 FOR UPDATE`);
  if (!slot.rows[0]?.available) { await client.query('COMMIT'); return null; }
  const result = await client.query(`WITH claimed AS (
    UPDATE market_research_session_claims SET state='RUNNING', attempts=attempts+1,
      lease_owner=$2,lease_until=NOW()+INTERVAL '5 minutes',next_attempt_at=NULL
    WHERE event_id=$1 AND state <> 'COMPLETED' AND attempts < $3
      AND session_start <= NOW() AND session_end > NOW()
      AND (lease_until IS NULL OR lease_until <= NOW())
      AND (next_attempt_at IS NULL OR next_attempt_at <= NOW())
    RETURNING event_id,report_id
  ), touched AS (UPDATE market_research_events e SET status='RESEARCHING',last_checked_at=NOW()
    FROM claimed c WHERE e.id=c.event_id RETURNING e.id)
  SELECT * FROM claimed`, [eventId, owner, MAX_RESEARCH_ATTEMPTS]);
  if (result.rows[0]) await client.query(`UPDATE market_research_agent_slot
    SET lease_owner=$1,lease_until=NOW()+INTERVAL '5 minutes' WHERE id=1`, [owner]);
  await client.query('COMMIT');
  return result.rows[0] ? { eventId, reportId: result.rows[0].report_id, owner } : null;
  } catch (error) { await client.query('ROLLBACK').catch(() => {}); throw error; }
  finally { client.release(); }
}

export async function renewResearchLease(pool: pg.Pool, lease: ResearchLease): Promise<boolean> {
  const result = await pool.query(`WITH global_renewal AS (
    UPDATE market_research_agent_slot SET lease_until=NOW()+INTERVAL '5 minutes'
    WHERE id=1 AND lease_owner=$2 AND lease_until>NOW() RETURNING id
  ), renewed AS (
    UPDATE market_research_session_claims SET lease_until=NOW()+INTERVAL '5 minutes'
    WHERE event_id=$1 AND lease_owner=$2 AND state='RUNNING' AND lease_until>NOW()
      AND EXISTS (SELECT 1 FROM global_renewal) RETURNING event_id
  ) UPDATE market_research_events e SET last_checked_at=NOW()
    FROM renewed r WHERE e.id=r.event_id RETURNING e.id`, [lease.eventId, lease.owner]);
  return result.rowCount === 1;
}

export async function failResearchLease(pool: pg.Pool, lease: ResearchLease, reason: string): Promise<void> {
  await pool.query(`WITH released AS (
    UPDATE market_research_agent_slot SET lease_owner=NULL,lease_until=NULL,next_allowed_at=NOW()+INTERVAL '2 seconds'
    WHERE id=1 AND lease_owner=$2 AND lease_until>NOW() RETURNING id
  ), failed AS (
    UPDATE market_research_session_claims SET state=CASE WHEN attempts >= $3 THEN 'EXHAUSTED' ELSE 'RETRY' END,
      lease_owner=NULL,lease_until=NULL,next_attempt_at=NOW()+INTERVAL '2 minutes'
    WHERE event_id=$1 AND lease_owner=$2 AND state='RUNNING' AND lease_until>NOW()
      AND EXISTS (SELECT 1 FROM released) RETURNING event_id
  ) UPDATE market_research_events e SET status='COOLED_DOWN',catalyst_summary=$4
    FROM failed f WHERE e.id=f.event_id`, [lease.eventId, lease.owner, MAX_RESEARCH_ATTEMPTS, reason.slice(0, 500)]);
}

/** Fence report publication with the lease; one stable report ID per reserved session slot. */
export async function completeResearchLease(
  pool: pg.Pool, lease: ResearchLease, report: ResearchReport,
  write: (client: pg.PoolClient) => Promise<void>
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const globalOwner = await client.query(`SELECT id FROM market_research_agent_slot
      WHERE id=1 AND lease_owner=$1 AND lease_until>NOW() FOR UPDATE`, [lease.owner]);
    if (!globalOwner.rowCount) throw new Error('Research ownership expired; global execution lease lost.');
    const owned = await client.query(`SELECT report_id FROM market_research_session_claims
      WHERE event_id=$1 AND lease_owner=$2 AND state='RUNNING' AND lease_until>NOW() FOR UPDATE`, [lease.eventId, lease.owner]);
    if (owned.rows[0]?.report_id !== report.id || report.id !== lease.reportId || report.eventId !== lease.eventId) {
      throw new Error('Research ownership expired; stale report publication rejected.');
    }
    await write(client);
    await client.query(`UPDATE market_research_session_claims SET state='COMPLETED',lease_owner=NULL,lease_until=NULL
      WHERE event_id=$1 AND lease_owner=$2`, [lease.eventId, lease.owner]);
    await client.query(`UPDATE market_research_agent_slot SET lease_owner=NULL,lease_until=NULL,
      next_allowed_at=NOW()+INTERVAL '2 seconds' WHERE id=1 AND lease_owner=$1`, [lease.owner]);
    const summary = report.bottomLine || report.executiveSummary || '';
    await client.query(`UPDATE market_research_events SET report_id=$2,catalyst_summary=$3,
      status=CASE WHEN session_closed_at IS NOT NULL THEN 'COOLED_DOWN' ELSE 'ACTIVE' END,last_checked_at=NOW()
      WHERE id=$1`, [lease.eventId, report.id, summary.slice(0, 240)]);
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK').catch(() => {}); throw error; }
  finally { client.release(); }
}
