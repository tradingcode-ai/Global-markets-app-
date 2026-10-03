import dotenv from 'dotenv';
import pg from 'pg';
import { runMarketResearchMonitor, QuoteFetcher } from '../services/marketResearchMonitor';
import { ensureResearchTables } from '../services/marketResearchStore';
import { fetchVerifiedResearchQuote } from '../services/researchSessionQuotes';

dotenv.config({ path: '.env.local' });
dotenv.config();

const { Pool } = pg;

function getDatabaseConnectionString(): string {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && (envUrl.startsWith('postgres://') || envUrl.startsWith('postgresql://'))) {
    return envUrl;
  }
  return '';
}

function getDbPool(): pg.Pool | null {
  const connStr = getDatabaseConnectionString();
  if (!connStr) return null;
  try {
    return new Pool({
      connectionString: connStr,
      ssl: connStr.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 15000
    });
  } catch (err: any) {
    console.warn('[CLI] Database connection warning:', err.message);
    return null;
  }
}

// Lightweight resilient Yahoo Finance quote fetcher for the CLI runner
const cliQuoteFetcher: QuoteFetcher = async (symbol: string) => {
  return fetchVerifiedResearchQuote(symbol);
};

async function main() {
  console.log('====================================================');
  console.log('   DEEP MARKET RESEARCH AUTONOMOUS MONITOR RUNNER   ');
  console.log('====================================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  const pool = getDbPool();
  if (!pool) throw new Error('DATABASE_URL ontbreekt; monitor start niet zonder duurzame opslag.');
  await ensureResearchTables(pool);

  console.log('[CLI] Running deterministic market monitor over enabled assets...');
  const result = await runMarketResearchMonitor(cliQuoteFetcher, pool, { autoRunAgent: true, waitForAgent: true });

  console.log('----------------------------------------------------');
  console.log(`Assets checked:   ${result.checkedAssetsCount}`);
  console.log(`Triggers crossed: ${result.triggeredCount}`);
  console.log(`Dedup skipped:    ${result.skippedDedupCount}`);
  console.log(`New Events:       ${result.newEvents.length}`);

  if (result.newEvents.length > 0) {
    for (const evt of result.newEvents) {
      console.log(` -> Event: ${evt.ticker} (${evt.assetName}): ${evt.changePercent.toFixed(2)}% | Status: ${evt.status}`);
    }
  }

  if (pool) {
    await pool.end();
  }
  console.log('====================================================');
}

main().catch((err) => {
  console.error('[CLI Fatal Error]:', err);
  process.exit(1);
});
