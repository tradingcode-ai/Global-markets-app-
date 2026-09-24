import express from "express";
import { pool } from "./db.js";
import { CONFIG } from "./config.js";
import { initScheduler } from "./scheduler.js";
import { runAgentCycle, getCurrentEdition } from "./marketNewsAgent.js";
import { getActiveAlertTickers } from "./db.js";

const app = express();
app.use(express.json());

// Lightweight health endpoint for Render and monitoring.
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "global-markets-news-agent" });
});

// 1. Live Timeline Feed Endpoint voor de Global Markets App
app.get("/api/v1/news/timeline", async (req, res) => {
  try {
    const { stream, ticker, sentiment, impact, limit = 50 } = req.query;

    let query = `SELECT * FROM market_news WHERE 1=1`;
    const params = [];

    if (stream === "macro") {
      query += ` AND category IN ('MACRO', 'CENTRAL_BANK', 'ECONOMIC_DATA', 'GEOPOLITICS', 'COMMODITIES')`;
    } else if (stream === "earnings") {
      query += ` AND category = 'EARNINGS'`;
    } else if (stream === "companies") {
      query += ` AND category IN ('EQUITY', 'M&A', 'REGULATION')`;
    }

    if (ticker) {
      params.push(ticker.toUpperCase());
      query += ` AND ticker = $${params.length}`;
    }

    if (sentiment) {
      params.push(sentiment.toUpperCase());
      query += ` AND sentiment = $${params.length}`;
    }

    if (impact) {
      params.push(impact.toUpperCase());
      query += ` AND impact = $${params.length}`;
    }

    query += ` ORDER BY edition_at DESC, created_at DESC LIMIT $${params.length + 1}`;
    params.push(Math.min(parseInt(limit, 10), 100));

    const result = await pool.query(query, params);
    res.json({
      status: "success",
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// 2. Beheer van aandelen notificaties door gebruikers
app.post("/api/v1/alerts/toggle", async (req, res) => {
  try {
    const { user_id, ticker, company_name, enabled } = req.body;
    if (!user_id || !ticker) {
      return res.status(400).json({ error: "user_id en ticker zijn verplicht" });
    }

    const query = `
      INSERT INTO user_stock_alerts (user_id, ticker, company_name, notifications_enabled, updated_at)
      VALUES ($1, UPPER($2), $3, $4, NOW())
      ON CONFLICT (user_id, ticker)
      DO UPDATE SET 
        notifications_enabled = EXCLUDED.notifications_enabled,
        updated_at = NOW()
      RETURNING *;
    `;
    const result = await pool.query(query, [user_id, ticker, company_name || null, enabled !== false]);
    res.json({ status: "success", alert: result.rows[0] });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// 3. Status endpoint for the dedicated news agent.
app.get('/api/v1/news/status', async (_req, res) => {
  try {
    const activeAlertTickers = await getActiveAlertTickers();
    res.json({
      model: CONFIG.GEMINI_MODEL,
      thinkingLevel: CONFIG.GEMINI_THINKING_LEVEL,
      timezone: CONFIG.TIMEZONE,
      configured: Boolean(CONFIG.GEMINI_API_KEY && CONFIG.DATABASE_URL),
      postgresConnected: Boolean(CONFIG.DATABASE_URL),
      activeAlertTickers,
      schedule: CONFIG.EDITION_SCHEDULES
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});
// 4. Handmatige trigger endpoint
app.post("/api/v1/agent/run", async (req, res) => {
  const apiKey = req.headers["x-admin-key"];
  if (apiKey !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Niet geautoriseerd" });
  }

  const requestedEdition = req.body.edition || getCurrentEdition();
  try {
    const result = await runAgentCycle(requestedEdition);
    res.json({ status: "completed", result });
  } catch (error) {
    res.status(500).json({ status: "failed", error: error.message });
  }
});

app.listen(CONFIG.PORT, "0.0.0.0", () => {
  console.log(`[Markets News API] Actief op http://localhost:${CONFIG.PORT}`);
  initScheduler();
});
