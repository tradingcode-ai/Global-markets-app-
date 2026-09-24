import pg from "pg";
import { CONFIG } from "./config.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: CONFIG.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000
});

/**
 * Haalt dynamisch alle unieke tickers op van aandelen waarvoor gebruikers
 * in de app actieve notificaties/meldingen aan hebben staan.
 */
export async function getActiveAlertTickers() {
  const query = `
    SELECT DISTINCT UPPER(ticker) AS ticker
    FROM user_stock_alerts
    WHERE notifications_enabled = TRUE
    ORDER BY ticker ASC;
  `;
  try {
    const res = await pool.query(query);
    const tickers = res.rows.map(r => r.ticker.trim().toUpperCase()).filter(Boolean);
    if (tickers.length > 0) {
      console.log(`[DB] ${tickers.length} actieve tickers met notificaties opgehaald uit user_stock_alerts.`);
      return tickers;
    }
  } catch (err) {
    console.warn("[DB Warning] Kon user_stock_alerts niet raadplegen (tabel mist wellicht nog), fallback naar defaults:", err.message);
  }
  return CONFIG.FALLBACK_WATCHLIST;
}

export async function getRecentEventKeys(hoursLookback = 36) {
  const query = `
    SELECT DISTINCT event_id, ticker, headline, source_url
    FROM market_news
    WHERE edition_at >= NOW() - ($1 || ' hours')::INTERVAL;
  `;
  try {
    const res = await pool.query(query, [hoursLookback]);
    return res.rows;
  } catch (err) {
    console.error("[DB Error] Kon recente events niet ophalen:", err.message);
    return [];
  }
}

export async function getPreviousEditionSnapshot() {
  try {
    const res = await pool.query(`
      SELECT event_id, ticker, category, headline, published_at
      FROM market_news
      ORDER BY edition_at DESC
      LIMIT 25;
    `);
    return res.rows.length > 0 ? res.rows : null;
  } catch (err) {
    console.warn("[DB Warning] Kon snapshot van vorige editie niet ophalen:", err.message);
    return null;
  }
}

export async function insertNewsBatch(items) {
  if (!items.length) return 0;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const query = `
      INSERT INTO market_news (
        event_id, edition, ticker, company, category, headline, summary,
        fact, market_reaction, analyst_interpretation, sentiment,
        impact, impact_score, urgency, published_at, discovered_at,
        edition_at, source_name, source_url, supporting_sources, confidence
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11,
        $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21
      )
      ON CONFLICT (id) DO NOTHING;
    `;

    for (const item of items) {
      await client.query(query, [
        item.event_id,
        item.edition,
        item.ticker || null,
        item.company || null,
        item.category,
        item.headline,
        item.summary,
        item.fact,
        item.market_reaction || null,
        item.analyst_interpretation || null,
        item.sentiment,
        item.impact,
        item.impact_score,
        item.urgency,
        item.published_at,
        item.discovered_at,
        item.edition_at,
        item.source_name,
        item.source_url,
        JSON.stringify(item.supporting_sources || []),
        item.confidence
      ]);
    }

    await client.query("COMMIT");
    return items.length;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
