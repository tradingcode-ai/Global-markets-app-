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
  return null;
}

export const CONFIG = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_KEY || process.env.API_KEY,
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

export const RSS_FEEDS_CONFIG = {
  US_GLOBAL: [
    { name: "CNBC Top News", url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", fallbackUrl: "https://search.cnbc.com/rs/search/combinedserver/view.xml?partnerId=wrss01&id=100003114", category: "GLOBAL" },
    { name: "CNBC Markets", url: "https://www.cnbc.com/id/10000664/device/rss/rss.html", fallbackUrl: "https://search.cnbc.com/rs/search/combinedserver/view.xml?partnerId=wrss01&id=10000664", category: "MARKETS" },
    { name: "Yahoo Finance Top News", url: "https://finance.yahoo.com/news/rssindex", category: "GLOBAL" },
    { name: "MarketWatch Top Stories", url: "https://feeds.content.dowjones.io/public/rss/mw_topstories", category: "MARKETS" },
    { name: "MarketWatch MarketPulse", url: "https://feeds.content.dowjones.io/public/rss/mw_marketpulse", category: "MARKETS" },
    { name: "MarketWatch Real-time", url: "https://feeds.content.dowjones.io/public/rss/mw_realtimeheadlines", category: "MARKETS" }
  ],
  CENTRAL_BANKS_MACRO: [
    { name: "Federal Reserve Press Releases", url: "https://www.federalreserve.gov/feeds/press_all.xml", category: "CENTRAL_BANKS" },
    { name: "European Central Bank (ECB)", url: "https://www.ecb.europa.eu/rss/press.html", category: "CENTRAL_BANKS" },
    { name: "Trading Economics Global Indicators", url: "https://feeds.feedburner.com/TradingEconomics", category: "MACRO" },
    { name: "Investing.com Central Banks", url: "https://www.investing.com/rss/news_301.rss", category: "CENTRAL_BANKS" },
    { name: "Investing.com Economy & Rates", url: "https://www.investing.com/rss/news_14.rss", category: "MACRO" },
    { name: "Investing.com Commodities", url: "https://www.investing.com/rss/news_11.rss", category: "COMMODITIES" },
    { name: "Investing.com Stock Market", url: "https://www.investing.com/rss/news_25.rss", category: "MACRO" }
  ],
  CORPORATE_PRESS_WIRES: [
    { name: "SEC EDGAR 8-K Regulatory Filings", url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&CIK=&type=8-K&company=&dateb=&owner=include&start=0&count=40&output=atom", category: "REGULATORY" },
    { name: "PR Newswire Financial Services", url: "https://www.prnewswire.com/rss/financial-services-latest-news/financial-services-latest-news-list.rss", category: "EARNINGS" },
    { name: "Seeking Alpha Market Currents", url: "https://seekingalpha.com/market_currents.xml", category: "MARKETS" }
  ],
  APAC: [
    { name: "CNBC Asia-Pacific News", url: "https://www.cnbc.com/id/19832390/device/rss/rss.html", fallbackUrl: "https://search.cnbc.com/rs/search/combinedserver/view.xml?partnerId=wrss01&id=19832390", category: "APAC" },
    { name: "Investing.com Asian Markets", url: "https://www.investing.com/rss/news_25.rss", category: "APAC" }
  ],
  EUROPE: [
    { name: "CNBC Europe News", url: "https://www.cnbc.com/id/19794221/device/rss/rss.html", fallbackUrl: "https://search.cnbc.com/rs/search/combinedserver/view.xml?partnerId=wrss01&id=19794221", category: "EUROPE" },
    { name: "European Central Bank (ECB)", url: "https://www.ecb.europa.eu/rss/press.html", category: "CENTRAL_BANKS" }
  ]
};

export function getFeedsForEdition(edition) {
  const norm = String(edition || "").toUpperCase();

  if (norm === "ASIA_OPEN") {
    // Prioritize APAC & Global Macro, Central Banks, and Corporate Wires
    return [
      ...RSS_FEEDS_CONFIG.APAC,
      ...RSS_FEEDS_CONFIG.CENTRAL_BANKS_MACRO,
      ...RSS_FEEDS_CONFIG.CORPORATE_PRESS_WIRES,
      ...RSS_FEEDS_CONFIG.US_GLOBAL
    ];
  }

  if (norm === "MORNING_EUROPE") {
    // Include Europe, ECB, Asia overnight, Global Macro, and Corporate Wires
    return [
      ...RSS_FEEDS_CONFIG.EUROPE,
      ...RSS_FEEDS_CONFIG.CENTRAL_BANKS_MACRO,
      ...RSS_FEEDS_CONFIG.CORPORATE_PRESS_WIRES,
      ...RSS_FEEDS_CONFIG.APAC,
      ...RSS_FEEDS_CONFIG.US_GLOBAL
    ];
  }

  // US_OPEN / MARKET_CLOSE / BREAKING / default:
  // Prioritize US, Fed, SEC 8-K, Corporate Wires, and Global Macro
  return [
    ...RSS_FEEDS_CONFIG.US_GLOBAL,
    ...RSS_FEEDS_CONFIG.CORPORATE_PRESS_WIRES,
    ...RSS_FEEDS_CONFIG.CENTRAL_BANKS_MACRO,
    ...RSS_FEEDS_CONFIG.EUROPE
  ];
}
