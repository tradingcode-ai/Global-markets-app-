import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env"), override: true });
dotenv.config({ override: true });

function getValidDatabaseUrl() {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && (envUrl.startsWith("postgres://") || envUrl.startsWith("postgresql://"))) {
    return envUrl;
  }
  return "postgresql://thecreator:gqD02DGaFbThHMgJIsiIqrvTYP2zrp7G@dpg-daq83h97lnhs73c1f75g-a.frankfurt-postgres.render.com/markets_xp9o";
}

export const CONFIG = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_NEWS_MODEL || "gemini-3.8-flash",
  GEMINI_THINKING_LEVEL: process.env.GEMINI_THINKING_LEVEL || "MEDIUM",
  TEMPERATURE: parseFloat(process.env.GEMINI_TEMPERATURE || "0.1"),
  DATABASE_URL: getValidDatabaseUrl(),
  TIMEZONE: process.env.MARKET_NEWS_TIMEZONE || "Europe/Amsterdam",
  PORT: process.env.PORT || 3000,
  FALLBACK_WATCHLIST: (process.env.DEFAULT_NEWS_WATCHLIST || "ASML,NVDA,MSFT,AAPL,GOOGL,TSM,SHEL.AS")
    .split(",")
    .map(t => t.trim().toUpperCase())
    .filter(Boolean),
  EDITION_SCHEDULES: {
    ASIA_OPEN: { hour: 2, minute: 30, label: "Asia Open" },
    MORNING_EUROPE: { hour: 7, minute: 0, label: "Morning Europe" },
    US_OPEN: { hour: 15, minute: 30, label: "US Open" },
    MARKET_CLOSE: { hour: 21, minute: 30, label: "Market Close" }
  },
  SOURCE_TIERS: {
    1: [
      "Federal Reserve", "ECB", "European Central Bank", "Bank of Japan",
      "Bank of England", "SEC", "ESMA", "Eurostat", "BLS", "BEA",
      "Statistics Bureau of Japan", "Investor Relations", "PR Newswire", "Business Wire"
    ],
    2: ["Reuters", "Bloomberg", "Financial Times", "Wall Street Journal", "CNBC", "Nikkei Asia"],
    3: ["MarketWatch", "Yahoo Finance", "Barron's", "The Economist", "Seeking Alpha", "Forbes"],
    4: []
  }
};

export const STATIC_TICKER_ALIASES = {
  ASML: ["ASML", "ASML Holding", "ASML.AS"],
  "SHEL.AS": ["Shell", "Shell plc", "SHEL.AS"],
  SHEL: ["Shell", "Shell plc", "SHEL"],
  TSM: ["TSMC", "Taiwan Semiconductor Manufacturing", "2330.TW", "TSM"],
  SSNLF: ["Samsung Electronics", "Samsung", "005930.KS"],
  NVDA: ["NVIDIA", "NVIDIA Corporation", "NVDA"],
  MSFT: ["Microsoft", "MSFT"],
  AAPL: ["Apple", "Apple Inc.", "AAPL"],
  GOOGL: ["Google", "Alphabet", "GOOGL"],
  AMZN: ["Amazon", "Amazon.com", "AMZN"]
};

export function getAliasesForTicker(ticker) {
  const norm = String(ticker || "").trim().toUpperCase();
  return STATIC_TICKER_ALIASES[norm] || [norm];
}
