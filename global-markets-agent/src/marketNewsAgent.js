import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import crypto from "node:crypto";
import { CONFIG, getAliasesForTicker } from "./config.js";
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

  // 02:30 (150m), 07:00 (420m), 15:30 (930m), 21:30 (1290m)
  if (minutes < 7 * 60) return "ASIA_OPEN";
  if (minutes < 18 * 60) return "US_OPEN";
  return "MARKET_CLOSE";
}

function generateDeterministicEventId(ticker, eventKey) {
  const normTicker = (ticker || "MACRO").trim().toUpperCase();
  const normKey = (eventKey || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
  return crypto.createHash("sha256").update(`${normTicker}#${normKey}`).digest("hex").slice(0, 32);
}

export async function runAgentCycle(targetEdition = getCurrentEdition()) {
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

  // 4. Master Prompt samenstellen
  const systemInstruction = buildSystemInstruction({
    edition: targetEdition,
    date: todayDateStr,
    watchlistWithAliases,
    previousEditionData
  });

  const prompt = `
Execute the research cycle for ${targetEdition} on ${todayDateStr}.
Focus your equity research specifically on companies that have active app alerts enabled:
${activeAlertTickers.join(", ")}

Apply all 20 research rules strictly. Ground every fact using Google Search.
If a ticker has no new material news since earlier editions, completely omit that ticker.
`;

  // 5. Aanroep van Gemini 3.8 Flash met Search Grounding en Medium Thinking
  const response = await ai.models.generateContent({
    model: CONFIG.GEMINI_MODEL,
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

  const rawJson = response.text;
  if (!rawJson) {
    throw new Error("Geen antwoord ontvangen van Gemini model.");
  }

  const payload = JSON.parse(rawJson);
  const verifiedChunks = extractVerifiedGroundingChunks(response);

  // 6. Tri-Stream samenvoegen
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

  // 7. Append-only opslag in PostgreSQL
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
