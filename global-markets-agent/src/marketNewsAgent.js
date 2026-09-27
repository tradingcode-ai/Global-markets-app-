import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import crypto from "node:crypto";
import { CONFIG, getAliasesForTicker, getFeedsForEdition } from "./config.js";
import { 
  getActiveAlertTickers, 
  getRecentEventKeys, 
  getPreviousEditionSnapshot, 
  insertNewsBatch 
} from "./db.js";
import { extractVerifiedGroundingChunks, sanitizeAndEnforceGrounding } from "./groundingValidator.js";
import { buildSystemInstruction } from "./masterPrompt.js";

const ai = new GoogleGenAI({
  apiKey: CONFIG.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});

const newsItemSchema = {
  type: Type.OBJECT,
  additionalProperties: false,
  properties: {
    event_key: { type: Type.STRING, description: "Unieke snake_case id, bijv. fed_interest_rate_hold of asml_q3_orders_beat" },
    ticker: { type: Type.STRING, description: "Aandeel ticker (indien van toepassing), anders null" },
    company: { type: Type.STRING, description: "Bedrijfsnaam of instelling" },
    category: { 
      type: Type.STRING, 
      enum: ["MACRO", "CENTRAL_BANK", "ECONOMIC_DATA", "EARNINGS", "EQUITY", "M&A", "REGULATION", "GEOPOLITICS", "COMMODITIES"] 
    },
    headline: { type: Type.STRING },
    summary: { type: Type.STRING },
    fact: { type: Type.STRING },
    market_reaction: { type: Type.STRING },
    analyst_interpretation: { type: Type.STRING },
    sentiment: { type: Type.STRING, enum: ["BULLISH", "BEARISH", "NEUTRAL"] },
    impact: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
    impact_score: { type: Type.INTEGER, minimum: 0, maximum: 100 },
    urgency: { type: Type.STRING, enum: ["ROUTINE", "IMPORTANT", "BREAKING"] },
    confidence: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
    published_at: { type: Type.STRING, description: "ISO-8601 timestamp van publicatie" },
    source_name: { type: Type.STRING },
    source_url: { type: Type.STRING },
    supporting_sources: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        additionalProperties: false,
        properties: {
          name: { type: Type.STRING },
          url: { type: Type.STRING },
          tier: { type: Type.INTEGER, minimum: 1, maximum: 4 }
        },
        required: ["name", "url", "tier"]
      }
    }
  },
  required: [
    "event_key", "category", "headline", "summary", "fact",
    "market_reaction", "analyst_interpretation", "sentiment", "impact",
    "impact_score", "urgency", "confidence", "published_at", "source_name", "source_url"
  ]
};

const triStreamSchema = {
  type: Type.OBJECT,
  additionalProperties: false,
  properties: {
    edition: { type: Type.STRING, enum: ["ASIA_OPEN", "MORNING_EUROPE", "US_OPEN", "MARKET_CLOSE"] },
    macro_news: {
      type: Type.ARRAY,
      maxItems: 5,
      items: newsItemSchema,
      description: "Macro-economie: Centrale banken, rente, inflatie, banencijfers, geopolitiek."
    },
    earnings_news: {
      type: Type.ARRAY,
      items: newsItemSchema,
      description: "Kwartaalcijfers, omzetverwachtingen, winstwaarschuwingen voor aandelen met actieve app-meldingen."
    },
    company_news: {
      type: Type.ARRAY,
      items: newsItemSchema,
      description: "Watchlist-bedrijven met actieve meldingen: M&A, directiewisselingen, analistenupgrades/downgrades."
    }
  },
  required: ["edition", "macro_news", "earnings_news", "company_news"]
};

function cleanHtmlText(text) {
  if (!text) return "";
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x201c;|&#x201d;|&ldquo;|&rdquo;/g, '"')
    .replace(/&#x2018;|&#x2019;|&lsquo;|&rsquo;/g, "'")
    .replace(/&#x2014;|&mdash;/g, "—")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrlKey(url) {
  try {
    const u = new URL(url);
    return (u.origin + u.pathname).toLowerCase().replace(/\/$/, "");
  } catch {
    return String(url || "").split("?")[0].toLowerCase().trim();
  }
}

function normalizeTitleKey(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 50);
}

async function fetchSingleRssFeed(feedUrl, sourceName) {
  const res = await fetch(feedUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      "Accept": "application/rss+xml, application/xml, text/xml, */*"
    },
    signal: AbortSignal.timeout(5000)
  });
  if (!res.ok) return [];
  const xml = await res.text();
  if (!xml || xml.length < 50) return [];

  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  const items = [];
  let match;
  while ((match = itemRegex.exec(xml)) !== null && items.length < 20) {
    const itemXml = match[1];
    const titleMatch = /<title>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/title>/i.exec(itemXml);
    const linkMatch = /<link>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/link>/i.exec(itemXml);
    const descMatch = /<description>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/description>/i.exec(itemXml);
    const pubDateMatch = /<pubDate>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/pubDate>/i.exec(itemXml);

    const title = cleanHtmlText(titleMatch?.[1] || titleMatch?.[2] || "");
    const link = (linkMatch?.[1] || linkMatch?.[2] || "").trim();
    const desc = cleanHtmlText(descMatch?.[1] || descMatch?.[2] || "").slice(0, 160);
    const pubDateStr = (pubDateMatch?.[1] || pubDateMatch?.[2] || "").trim();

    if (title && link) {
      items.push({
        source: sourceName,
        title,
        link,
        description: desc,
        pubDate: pubDateStr || new Date().toISOString()
      });
    }
  }
  return items;
}

async function fetchLiveRssStories(edition = "US_OPEN") {
  const feeds = getFeedsForEdition(edition);
  const t0 = Date.now();
  const now = Date.now();
  // 36 hours maximum window (covers weekend sessions, overnight APAC moves, and market closes)
  const maxAgeMs = 36 * 60 * 60 * 1000;

  const seenUrls = new Set();
  const seenTitles = new Set();
  const allCandidates = [];

  const results = await Promise.allSettled(feeds.map(async feed => {
    try {
      let feedItems = await fetchSingleRssFeed(feed.url, feed.name);
      if (feedItems.length === 0 && feed.fallbackUrl) {
        feedItems = await fetchSingleRssFeed(feed.fallbackUrl, feed.name);
      }
      return feedItems;
    } catch {
      if (feed.fallbackUrl) {
        try {
          return await fetchSingleRssFeed(feed.fallbackUrl, feed.name);
        } catch {
          return [];
        }
      }
      return [];
    }
  }));

  for (const r of results) {
    if (r.status === "fulfilled" && Array.isArray(r.value)) {
      for (const item of r.value) {
        // 1. Recency filter in code (zero tokens wasted)
        if (item.pubDate) {
          const parsed = new Date(item.pubDate).getTime();
          if (!isNaN(parsed) && (now - parsed) > maxAgeMs) {
            continue;
          }
        }

        // 2. URL & Title deduplication in code
        const normUrl = normalizeUrlKey(item.link);
        const normTitle = normalizeTitleKey(item.title);
        if (seenUrls.has(normUrl) || seenTitles.has(normTitle)) {
          continue;
        }

        seenUrls.add(normUrl);
        seenTitles.add(normTitle);
        allCandidates.push(item);
      }
    }
  }

  console.log(`[RSS Ingestion] Fetched ${allCandidates.length} unique verified candidate stories in ${Date.now() - t0}ms for edition ${edition}`);
  return allCandidates;
}

export function getCurrentEdition() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: CONFIG.TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(new Date());

  const hour = Number(parts.find(p => p.type === "hour").value);
  const minute = Number(parts.find(p => p.type === "minute").value);
  const minutes = hour * 60 + minute;

  // 02:30 - 07:00 Amsterdam (Asia Open)
  if (minutes < 7 * 60) return "ASIA_OPEN";
  // 07:00 - 15:30 Amsterdam (Morning Europe)
  if (minutes < 15 * 60 + 30) return "MORNING_EUROPE";
  // 15:30 - 21:30 Amsterdam (US Open)
  if (minutes < 21 * 60 + 30) return "US_OPEN";
  // 21:30 - 02:30 Amsterdam (Market Close)
  return "MARKET_CLOSE";
}

function generateDeterministicEventId(ticker, eventKey) {
  const normTicker = (ticker || "MACRO").trim().toUpperCase();
  const normKey = (eventKey || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
  return crypto.createHash("sha256").update(`${normTicker}#${normKey}`).digest("hex").slice(0, 32);
}

export async function runAgentCycle(targetEdition = getCurrentEdition()) {
  if (!CONFIG.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY ontbreekt in de omgevingsvariabelen! Zorg dat de secret 'GEMINI_API_KEY' is ingesteld in je GitHub repository onder Settings -> Secrets and variables -> Actions.");
  }
  const now = new Date();
  const todayDateStr = now.toISOString().split("T")[0];

  // 1. DYNAMISCH OPHALEN: Aandelen waarvoor in de app notificaties aanstaan
  const activeAlertTickers = await getActiveAlertTickers();

  console.log(`\n======================================================`);
  console.log(`[Market News Agent] MODEL: ${CONFIG.GEMINI_MODEL}`);
  console.log(`[Market News Agent] EDITION: ${targetEdition} @ ${now.toISOString()}`);
  console.log(`[Market News Agent] TICKERS MET MELDINGEN AAN: ${activeAlertTickers.join(", ")}`);

  // 2. Historische deduplicatie data ophalen
  const recentEvents = await getRecentEventKeys(36);
  const existingEventIds = new Set(recentEvents.map(e => e.event_id));
  const previousEditionData = await getPreviousEditionSnapshot();

  // 3. Aliases genereren voor betere search grounding
  const watchlistWithAliases = activeAlertTickers
    .map(ticker => `- ${ticker}: ${getAliasesForTicker(ticker).join(", ")}`)
    .join("\n");

  // 4. Robuuste parallelle RSS ingestion afgestemd op de huidige editie
  const liveStories = await fetchLiveRssStories(targetEdition);

  // 5. Ultra-efficiënte, token-besparende batch candidate block samenstellen (~30 tokens per candidate)
  const candidateBlock = liveStories.map((s, idx) => {
    const pubTime = s.pubDate 
      ? new Date(s.pubDate).toISOString().replace("T", " ").slice(0, 16) 
      : todayDateStr;
    const descPart = s.description ? ` - ${s.description.slice(0, 140)}` : "";
    return `[ID: #${idx + 1}] (Source: ${s.source} | Published: ${pubTime}) ${s.title}${descPart} | Link: ${s.link}`;
  }).join("\n");

  // 6. Master Prompt samenstellen
  const systemInstruction = buildSystemInstruction({
    edition: targetEdition,
    date: todayDateStr,
    watchlistWithAliases,
    previousEditionData
  });

  const prompt = `
Execute the institutional research cycle for ${targetEdition} on ${todayDateStr}.
Focus your equity research specifically on companies that have active app alerts enabled:
${activeAlertTickers.join(", ")}

You have been provided with ${liveStories.length} fresh, pre-filtered financial news candidate stories from verified institutional sources (CNBC, Yahoo Finance, MarketWatch, Investing.com):

=== VERIFIED FINANCIAL RSS CANDIDATE HEADLINES (${liveStories.length} CANDIDATES) ===
${candidateBlock}
=== END CANDIDATE HEADLINES ===

Your editorial objectives for this cycle:
1. SCREEN CANDIDATES: Screen all candidate headlines against the active edition scope (${targetEdition}) and the active watchlist (${activeAlertTickers.join(", ")}).
2. SELECT & SYNTHESIZE: Select the most critical market-moving developments and synthesize them directly into the tri-stream format (macro_news, earnings_news, company_news).
3. VERIFIABLE SOURCE URLS: You MUST set the candidate's real "Link" as the "source_url" in each generated news item. Do NOT invent URLs.
4. STRICT REGIONAL SCOPE: Ensure regional compliance for ${targetEdition} as mandated in your instructions.
5. GROUNDING & FACTS: Use Google Search grounding to enrich missing financial metrics (EPS, revenue beats, consensus, percentage changes, market reactions) for the top selected stories. If Google Search is unavailable or throttled (429/503 fallback), synthesize strictly from the candidate facts provided above.
6. COMPLIANCE: Every item must have real factual backing, correct sentiment, and strictly adhere to all 20 research rules.
Provide the real source_url for each item.
`;

  // 7. Aanroep van Gemini met fallback modellen en rate limit retry
  let response;
  const modelsToTry = [CONFIG.GEMINI_MODEL, 'gemini-3.1-flash-lite'];
  
  for (const currentModel of modelsToTry) {
    if (response) break;
    for (let attempt = 1; attempt <= 2; attempt++) {
      if (response) break;
      try {
        response = await ai.models.generateContent({
          model: currentModel,
          contents: prompt,
          config: {
            systemInstruction,
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: triStreamSchema,
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.MEDIUM
            }
          }
        });
      } catch (err) {
        if (err?.status === 429 || err?.status === 503 || err?.message?.includes("quota") || err?.message?.includes("RESOURCE_EXHAUSTED") || err?.message?.includes("high demand")) {
          console.warn(`[Agent Warning] Model ${currentModel} (poging ${attempt}) gaf ${err.status || 'rate limit'}. Probeert RSS-analyse modus...`);
          try {
            response = await ai.models.generateContent({
              model: currentModel,
              contents: prompt,
              config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: triStreamSchema
              }
            });
          } catch (innerErr) {
            console.warn(`[Agent Warning] RSS analyse met ${currentModel} gaf: ${innerErr.message}`);
            if (attempt === 1) {
              await new Promise(r => setTimeout(r, 2500));
            }
          }
        } else {
          console.warn(`[Agent Warning] Onverwachte fout met ${currentModel}: ${err.message}`);
        }
      }
    }
  }

  if (!response || !response.text) {
    throw new Error("Geen antwoord ontvangen van de beschikbare Gemini modellen.");
  }

  const rawJson = response.text;

  const payload = JSON.parse(rawJson);
  const verifiedChunks = extractVerifiedGroundingChunks(response);

  // 8. Tri-Stream samenvoegen
  const combinedStream = [
    ...(payload.macro_news || []).map(x => ({ ...x, ticker: null, company: x.company || "Global Macro" })),
    ...(payload.earnings_news || []),
    ...(payload.company_news || [])
  ];

  const allowedTickerSet = new Set(activeAlertTickers.map(t => t.toUpperCase()));
  const recordsToInsert = [];
  let duplicatesSkipped = 0;

  for (const item of combinedStream) {
    // Valideer of aandeel-specifiek nieuws daadwerkelijk behoort tot actieve alerts
    if (item.ticker && !allowedTickerSet.has(item.ticker.toUpperCase())) {
      console.log(`[QA Filter] Item genegeerd voor ticker ${item.ticker} (geen actieve melding in app)`);
      continue;
    }

    const eventId = generateDeterministicEventId(item.ticker, item.event_key);

    if (existingEventIds.has(eventId)) {
      duplicatesSkipped++;
      continue;
    }

    try {
      const sanitized = sanitizeAndEnforceGrounding(item, verifiedChunks);

      recordsToInsert.push({
        event_id: eventId,
        edition: targetEdition,
        ticker: sanitized.ticker ? sanitized.ticker.toUpperCase() : null,
        company: sanitized.company,
        category: sanitized.category,
        headline: sanitized.headline,
        summary: sanitized.summary,
        fact: sanitized.fact,
        market_reaction: sanitized.market_reaction || null,
        analyst_interpretation: sanitized.analyst_interpretation || null,
        sentiment: sanitized.sentiment,
        impact: sanitized.impact,
        impact_score: sanitized.impact_score,
        urgency: sanitized.urgency,
        published_at: new Date(sanitized.published_at || now).toISOString(),
        discovered_at: now.toISOString(),
        edition_at: now.toISOString(),
        source_name: sanitized.source_name,
        source_url: sanitized.source_url,
        supporting_sources: sanitized.supporting_sources,
        confidence: sanitized.confidence
      });

      existingEventIds.add(eventId);
    } catch (err) {
      console.warn(`[QA Warning] Item '${item.headline}' overgeslagen:`, err.message);
    }
  }

  // 9. Append-only opslag in PostgreSQL
  const insertedCount = await insertNewsBatch(recordsToInsert);
  console.log(`[Market News Agent] Run succesvol: ${insertedCount} toegevoegd, ${duplicatesSkipped} deduplicaties.`);

  return {
    edition: targetEdition,
    model: CONFIG.GEMINI_MODEL,
    activeAlertTickersCount: activeAlertTickers.length,
    inserted: insertedCount,
    deduped: duplicatesSkipped,
    items: recordsToInsert
  };
}

