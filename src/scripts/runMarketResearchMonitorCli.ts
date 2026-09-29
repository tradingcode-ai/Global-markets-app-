import dotenv from 'dotenv';
import pg from 'pg';
import { runMarketResearchMonitor, QuoteFetcher } from '../services/marketResearchMonitor';
import { ensureResearchTables } from '../services/marketResearchStore';

dotenv.config({ path: '.env.local' });
dotenv.config();

const { Pool } = pg;

function getDatabaseConnectionString(): string {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && (envUrl.startsWith('postgres://') || envUrl.startsWith('postgresql://'))) {
    return envUrl;
  }
  return 'postgresql://thecreator:gqD02DGaFbThHMgJIsiIqrvTYP2zrp7G@dpg-daq83h97lnhs73c1f75g-a.frankfurt-postgres.render.com/markets_xp9o';
}

function getDbPool(): pg.Pool | null {
  const connStr = getDatabaseConnectionString();
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
  try {
    let yahooSymbol = symbol;
    if (symbol === 'BRENT') yahooSymbol = 'BZ=F';
    else if (symbol === 'WTI') yahooSymbol = 'CL=F';
    else if (symbol === 'GOLD') yahooSymbol = 'GC=F';
    else if (symbol === 'SILVER') yahooSymbol = 'SI=F';
    else if (symbol === 'COPPER') yahooSymbol = 'HG=F';
    else if (symbol === 'NG') yahooSymbol = 'NG=F';
    else if (symbol === 'US2Y') yahooSymbol = '^2YY';
    else if (symbol === 'US10Y') yahooSymbol = '^TNX';
    else if (symbol === 'US30Y') yahooSymbol = '^TYX';

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=2d`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) return null;
    const data: any = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta || typeof meta.regularMarketPrice !== 'number') return null;

    const price = meta.regularMarketPrice;
    const previousClose = meta.chartPreviousClose || meta.previousClose || price;
    const changePercent = previousClose !== 0 ? ((price - previousClose) / previousClose) * 100 : 0;

    return {
      symbol,
      price,
      changePercent,
      previousClose
    };
  } catch {
    return null;
  }
};

async function main() {
  console.log('====================================================');
  console.log('   DEEP MARKET RESEARCH AUTONOMOUS MONITOR RUNNER   ');
  console.log('====================================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  const pool = getDbPool();
  if (pool) {
    await ensureResearchTables(pool).catch(() => {});
  }

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
