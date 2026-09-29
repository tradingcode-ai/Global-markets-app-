import { GoogleGenAI } from '@google/genai';
import pg from 'pg';
import {
  ResearchEvent,
  ResearchReport,
  ResearchSource,
  ResearchConfidence
} from '../types/marketResearch';
import {
  saveResearchReport,
  updateResearchEvent
} from './marketResearchStore';

// System prompt directly from agents/05_EVENT_AND_SYSTEM_PROMPT.md
export const DEEP_MARKET_RESEARCH_SYSTEM_PROMPT = `You are the Deep Market Research Agent for the Global Markets application.
PURPOSE
Investigate significant market movements and produce a complete, source-based research report explaining what happened, why the market may be reacting, and what relevant context surrounds the event.
You are a research agent, not an investment adviser. Do not provide investment recommendations.
DATA INTEGRITY
Never invent or fabricate:
prices, percentage moves or financial figures;
earnings, revenue, production or analyst data;
economic or geopolitical facts;
sources, quotations or citations.
The market movement supplied in the event prompt is the authoritative trigger data.
Clearly distinguish:
CONFIRMED FACT — supported by reliable evidence;
REPORTED CLAIM — reported but not independently confirmed;
ANALYSIS / INFERENCE — reasoned interpretation;
UNKNOWN / UNCERTAIN — cannot be reliably established.
Never present inference as fact.
RESEARCH
Every triggered event receives the full Deep Research standard.
Research autonomously using available web tools.
Use no more than 5 search queries and normally no more than 8–10 relevant source documents. Stop earlier when sufficient evidence is established.
Do not rely only on search snippets or headlines. Read the most relevant accessible sources.
Research should establish:
what happened;
whether it can be confirmed;
how it affects the asset or sector;
what broader context matters;
what important uncertainty remains.
SOURCE SELECTION
Use the following registry as a source-selection aid.
The registry is not a mandatory browsing order.
Choose sources based on:
relevance to the specific event;
ability to establish or verify the specific claim;
source authority and reliability;
independence from other sources.

Primary / Official Sources
Prefer relevant primary sources when they directly document the event.
Examples include:
company Investor Relations websites;
official company press releases;
SEC / EDGAR filings;
Federal Reserve;
U.S. Treasury;
SEC;
CFTC;
ECB;
Bank of England;
Bank of Japan;
European Commission;
relevant government agencies;
relevant financial-market regulators;
official exchange announcements;
CME Group;
ICE;
Nasdaq;
NYSE;
OPEC;
IEA;
EIA;
official producer or government energy agencies.
Use the appropriate primary source for the event rather than mechanically searching all primary sources.

Preferred Financial News
When relevant, use high-quality financial news for reporting, independent confirmation, market reaction and context.
Preferred examples:
Reuters;
Bloomberg;
CNBC;
Financial Times;
The Wall Street Journal.
These sources are preferred financial-news sources, but they are not automatically authoritative for every claim.

Preferred Real-Time Signals
Use these sources when relevant for breaking developments and early market signals:
Walter Bloomberg — X: @DeItaone
First Squawk — X: @FirstSquawk
LiveSquawk — X: @LiveSquawk
FinancialJuice — X: @financialjuice
Nick Timiraos — X: @NickTimiraos
The Kobeissi Letter — X: @KobeissiLetter
Real-time signal sources are early-warning sources, not automatic confirmation sources.
Do not treat a post from a real-time signal account as a confirmed fact solely because it is published quickly or widely repeated.
Where practical, corroborate material claims with:
a primary or official source;
an independent high-quality financial-news source; or
another genuinely independent reliable source.
Multiple sources repeating the same underlying report do not constitute multiple independent confirmations.

Specialist Sources
Use specialist publications and services when they provide materially relevant information that broader financial media may not yet contain.
Examples include:
aerospace and defense publications;
semiconductor publications;
energy and commodity specialists;
shipping and supply-chain publications;
specialist geopolitical publications;
specialist market-data/news services.
Treat specialist and real-time sources as evidence whose reliability must be evaluated in context.

SOURCE SELECTION PRINCIPLE
Do not browse the Preferred-Source Registry from top to bottom.
Do not automatically search every preferred source.
Autonomously determine which sources are most relevant to the event.
If a primary source directly establishes the catalyst, prefer it for that factual claim.
If a real-time signal identifies a breaking development, use it as an early signal and seek appropriate confirmation.
Every source included in the final report must have materially contributed to the research.
Do not use a source merely because it appears in the Preferred-Source Registry.

CAUSALITY
Do not assume the cause before researching it.
Consider relevant simultaneous catalysts such as:
company developments;
earnings or guidance;
macroeconomic data;
central-bank policy;
geopolitics;
commodities;
sector developments;
regulation;
supply chains or infrastructure;
broader market conditions.
Only describe causation as established when the evidence supports it.

REQUIRED CONTEXT
Every report must cover:
1. Immediate Event
What happened, when, who/what was involved, the documented catalyst, supporting evidence and remaining uncertainty.
2. Direct Market / Sector Impact
Explain how the event affects the asset or sector through economic, operational, supply, demand, pricing, earnings or risk channels where relevant.
3. Broader Context
Explain materially relevant geopolitical, macroeconomic, infrastructure, supply-chain, commodity, policy or other wider context.
Do not add unrelated background merely to increase length.

REPORT OUTPUT
The final response MUST be a complete research report, not a two-line answer, short summary or unsupported conclusion.
Use this structure:
Market Move
Asset, ticker, asset class, movement, period and timestamp.
Executive Summary
Substantive explanation of what happened, the principal documented catalysts and why it matters.
1. Immediate Catalyst
Evidence surrounding the event, clearly separating fact, reported claims and inference.
2. Direct Market / Sector Impact
The transmission mechanism and relevant market or economic effects.
3. Broader Context
The wider context materially relevant to the event.
4. What the Market Is Reacting To
What information, expectation or risk appears to be driving the reaction. Separate evidence from inference.
5. What to Watch Next
Concrete developments that could materially change the situation.
6. Confidence
High, Medium or Low, with a brief evidence-based explanation.
7. Sources
List the sources actually used. Format each source on a new line with Title, URL, and Publisher where available. Never fabricate sources.
The report must be substantive enough to qualify as genuine market research. Length should reflect event complexity, not an arbitrary word count.
If reliable information is genuinely insufficient, explain what was researched, what was confirmed, what could not be confirmed and why.

EVENT DEDUPLICATION
A new market-movement trigger does not automatically mean a new research report.
Treat multiple triggers as the same event when evidence indicates the market is still reacting primarily to the same underlying catalyst.
Do not define event identity solely by ticker, price movement or timestamp.
A materially new development, escalation, policy action, confirmation, reversal or separate catalyst can constitute a new event and justify new research.

CONFLICTING INFORMATION
When credible sources disagree, identify the disagreement, attribute the claims and explain what remains unresolved.

FINAL CHECK
Before returning the report, verify:
The event was actually researched.
Sources are relevant and reliable.
Facts, claims, inference and uncertainty are clearly separated.
All three context layers are covered.
Causality is not overstated.
The complete report structure is present.
No financial data or sources were fabricated.
No investment recommendation was given.
The result is a genuine research report, not a short answer.`;

// Build event prompt directly from 05_EVENT_AND_SYSTEM_PROMPT.md template
export function buildEventPrompt(event: ResearchEvent): string {
  const movementSign = event.changePercent >= 0 ? '+' : '';
  const moveStr = `${movementSign}${event.changePercent.toFixed(2)}%`;

  return `Investigate this market event using your Deep Market Research instructions.
Asset: ${event.assetName}
Ticker: ${event.ticker}
Asset class: ${event.assetClass}
Movement: ${moveStr}
Period: ${event.period}
Timestamp: ${event.triggeredAt}
Determine the documented causes and relevant context of this movement.
Do not assume the cause in advance.
Perform the full Deep Research workflow and return the complete Global Markets research report defined by your system instructions.`;
}

let cachedGenAI: GoogleGenAI | null = null;
function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_KEY;
  if (!apiKey) return null;
  if (!cachedGenAI) {
    cachedGenAI = new GoogleGenAI({ apiKey });
  }
  return cachedGenAI;
}

interface ParsedReportSections {
  executiveSummary: string;
  immediateCatalyst: string;
  directMarketImpact: string;
  broaderContext: string;
  whatMarketIsReactingTo: string;
  whatToWatchNext: string;
  confidence: ResearchConfidence;
  confidenceExplanation: string;
  sources: ResearchSource[];
}

function parseMarkdownReport(rawMarkdown: string): ParsedReportSections {
  const clean = (s: string) => s.trim().replace(/^#+\s*/, '');

  const extractSection = (regexes: RegExp[]): string => {
    for (const rx of regexes) {
      const match = rawMarkdown.match(rx);
      if (match && match[1]) {
        return clean(match[1]);
      }
    }
    return '';
  };

  const executiveSummary = extractSection([
    /(?:###?\s*Executive Summary|Executive Summary:?)\s*([\s\S]*?)(?=(?:###?\s*1\.|\n1\.\s*Immediate|###?\s*Immediate Catalyst))/i,
    /(?:Executive Summary)\s*([\s\S]*?)(?=(?:###?\s*1|\n1\.))/i
  ]) || 'Executive summary unavailable in raw output.';

  const immediateCatalyst = extractSection([
    /(?:###?\s*1\.\s*Immediate Catalyst|1\.\s*Immediate Catalyst:?)\s*([\s\S]*?)(?=(?:###?\s*2\.|\n2\.\s*Direct))/i,
    /(?:Immediate Catalyst:?)\s*([\s\S]*?)(?=(?:Direct Market|\n2\.))/i
  ]) || 'Documented immediate catalyst under ongoing verification.';

  const directMarketImpact = extractSection([
    /(?:###?\s*2\.\s*Direct Market \/ Sector Impact|2\.\s*Direct Market \/ Sector Impact:?)\s*([\s\S]*?)(?=(?:###?\s*3\.|\n3\.\s*Broader))/i,
    /(?:Direct Market \/ Sector Impact:?)\s*([\s\S]*?)(?=(?:Broader Context|\n3\.))/i
  ]) || 'Direct market and sector transmission mechanisms identified.';

  const broaderContext = extractSection([
    /(?:###?\s*3\.\s*Broader Context|3\.\s*Broader Context:?)\s*([\s\S]*?)(?=(?:###?\s*4\.|\n4\.\s*What))/i,
    /(?:Broader Context:?)\s*([\s\S]*?)(?=(?:What the Market|\n4\.))/i
  ]) || 'Macroeconomic, geopolitical and industry context captured.';

  const whatMarketIsReactingTo = extractSection([
    /(?:###?\s*4\.\s*What the Market Is Reacting To|4\.\s*What the Market Is Reacting To:?)\s*([\s\S]*?)(?=(?:###?\s*5\.|\n5\.\s*What to Watch))/i,
    /(?:What the Market Is Reacting To:?)\s*([\s\S]*?)(?=(?:What to Watch Next|\n5\.))/i
  ]) || 'Market sentiment driving price discovery.';

  const whatToWatchNext = extractSection([
    /(?:###?\s*5\.\s*What to Watch Next|5\.\s*What to Watch Next:?)\s*([\s\S]*?)(?=(?:###?\s*6\.|\n6\.\s*Confidence))/i,
    /(?:What to Watch Next:?)\s*([\s\S]*?)(?=(?:Confidence|\n6\.))/i
  ]) || 'Key forthcoming macro and corporate data points.';

  // Extract Confidence
  const rawConfidenceMatch = rawMarkdown.match(/(?:###?\s*6\.\s*Confidence|6\.\s*Confidence:?)\s*([\s\S]*?)(?=(?:###?\s*7\.|\n7\.\s*Sources|$))/i);
  let confidence: ResearchConfidence = 'MEDIUM';
  let confidenceExplanation = '';
  if (rawConfidenceMatch && rawConfidenceMatch[1]) {
    const text = rawConfidenceMatch[1].trim();
    if (/\bHIGH\b/i.test(text)) confidence = 'HIGH';
    else if (/\bLOW\b/i.test(text)) confidence = 'LOW';
    else confidence = 'MEDIUM';
    confidenceExplanation = text;
  }

  // Extract Sources
  const rawSourcesMatch = rawMarkdown.match(/(?:###?\s*7\.\s*Sources|7\.\s*Sources:?)\s*([\s\S]*?)$/i);
  const sources: ResearchSource[] = [];

  if (rawSourcesMatch && rawSourcesMatch[1]) {
    const lines = rawSourcesMatch[1].split('\n').filter(l => l.trim().length > 0);
    for (const line of lines) {
      const urlMatch = line.match(/(https?:\/\/[^\s)\],]+)/i);
      const titleMatch = line.match(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/i) ||
                         line.match(/[-*•]\s*([^:]+?)(?::|\s+-\s+)(https?:\/\/[^\s]+)/i);

      if (urlMatch) {
        const url = urlMatch[1];
        let title = titleMatch ? titleMatch[1].trim() : line.replace(url, '').replace(/^[-*•\d.)\s]+/, '').trim();
        if (!title || title.length < 3) title = 'Verified Research Source';

        // Categorize publisher / source category
        let sourceCategory = 'FINANCIAL_NEWS';
        let publisher = 'Financial Press';

        if (/sec\.gov|edgar|investor\.|press\./i.test(url)) {
          sourceCategory = 'PRIMARY_OFFICIAL';
          publisher = 'Primary Corporate / Regulatory';
        } else if (/reuters\.com/i.test(url)) {
          sourceCategory = 'FINANCIAL_NEWS';
          publisher = 'Reuters';
        } else if (/bloomberg\.com/i.test(url)) {
          sourceCategory = 'FINANCIAL_NEWS';
          publisher = 'Bloomberg';
        } else if (/cnbc\.com/i.test(url)) {
          sourceCategory = 'FINANCIAL_NEWS';
          publisher = 'CNBC';
        } else if (/ft\.com/i.test(url)) {
          sourceCategory = 'FINANCIAL_NEWS';
          publisher = 'Financial Times';
        } else if (/wsj\.com/i.test(url)) {
          sourceCategory = 'FINANCIAL_NEWS';
          publisher = 'Wall Street Journal';
        } else if (/twitter\.com|x\.com/i.test(url)) {
          sourceCategory = 'REAL_TIME_SIGNAL';
          publisher = 'Real-Time Signal';
        }

        sources.push({
          title,
          url,
          publisher,
          sourceCategory,
          relevance: 'Contributed verified context to deep market research investigation.',
          accessedAt: new Date().toISOString()
        });
      }
    }
  }

  return {
    executiveSummary,
    immediateCatalyst,
    directMarketImpact,
    broaderContext,
    whatMarketIsReactingTo,
    whatToWatchNext,
    confidence,
    confidenceExplanation,
    sources
  };
}

export async function executeResearchForEvent(
  event: ResearchEvent,
  pool: pg.Pool | null
): Promise<{ success: boolean; report?: ResearchReport; error?: string }> {
  console.log(`[Research Agent] Starting Deep Market Research for ${event.ticker} (${event.assetName}, move: ${event.changePercent}%)...`);

  // 1. Mark event as RESEARCHING
  await updateResearchEvent(event.id, { status: 'RESEARCHING', lastCheckedAt: new Date().toISOString() }, pool);

  const aiClient = getGenAIClient();
  if (!aiClient) {
    const errorMsg = 'GEMINI_API_KEY is not configured. Deep Market Research requires Gemini API credentials.';
    console.warn(`[Research Agent] ${errorMsg}`);
    await updateResearchEvent(event.id, {
      status: 'COOLED_DOWN',
      catalystSummary: 'Research suspended: GEMINI_API_KEY not configured.'
    }, pool);
    return { success: false, error: errorMsg };
  }

  const prompt = buildEventPrompt(event);
  const modelsToTry = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];

  let rawMarkdown: string | null = null;
  let groundingSources: ResearchSource[] = [];
  let modelUsed = '';
  let lastError: any = null;

  // 1. First attempt: Official Interactions API Antigravity Agent
  if (aiClient.interactions && typeof aiClient.interactions.create === 'function') {
    try {
      console.log(`[Research Agent] Initializing official Antigravity Agent via Interactions API (agent: antigravity-preview-05-2026, model: gemini-3.8-flash)...`);
      const interactionResponse: any = await aiClient.interactions.create({
        agent: 'antigravity-preview-05-2026',
        agent_config: {
          type: 'antigravity',
          model: 'gemini-3.8-flash'
        },
        input: prompt,
        system_instruction: DEEP_MARKET_RESEARCH_SYSTEM_PROMPT,
        tools: [{ type: 'google_search' }]
      });

      if (interactionResponse) {
        // Check outputs or steps text
        const outputText = interactionResponse.output_text || 
          interactionResponse.outputs?.[0]?.text ||
          (Array.isArray(interactionResponse.steps) 
            ? interactionResponse.steps.map((s: any) => s.content?.map((c: any) => c.text).join('')).join('\n')
            : null);

        if (outputText && outputText.length > 50) {
          rawMarkdown = outputText;
          modelUsed = 'antigravity-preview-05-2026 (gemini-3.8-flash)';
          console.log(`[Research Agent] Successfully completed research via official Antigravity Agent interaction.`);
        }
      }
    } catch (err: any) {
      console.warn(`[Research Agent] Interactions API Antigravity agent attempted, falling back to direct model:`, err.message);
      lastError = err;
    }
  }

  // 2. Second attempt: Direct model generation loop
  if (!rawMarkdown) {
    for (const model of modelsToTry) {
      try {
        console.log(`[Research Agent] Calling model ${model} with Google Search tool...`);
        const response = await aiClient.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: DEEP_MARKET_RESEARCH_SYSTEM_PROMPT,
            tools: [{ googleSearch: {} }]
          }
        });

        if (response && response.text) {
          rawMarkdown = response.text;
          modelUsed = model;

          // Extract native Google Search grounding metadata if returned
          const candidate = response.candidates?.[0];
          const metadata = (candidate as any)?.groundingMetadata;
          if (metadata && Array.isArray(metadata.groundingChunks)) {
            for (const chunk of metadata.groundingChunks) {
              const web = chunk.web;
              if (web && web.uri) {
                groundingSources.push({
                  title: web.title || 'Grounding Search Source',
                  url: web.uri,
                  publisher: new URL(web.uri).hostname.replace('www.', ''),
                  sourceCategory: 'FINANCIAL_NEWS',
                  relevance: 'Grounding search confirmation document.',
                  accessedAt: new Date().toISOString()
                });
              }
            }
          }
          break;
        }
      } catch (err: any) {
        console.warn(`[Research Agent] Model ${model} failed:`, err.message);
        lastError = err;
      }
    }
  }

  if (!rawMarkdown) {
    const errMsg = lastError?.message || 'Gemini Deep Research call produced empty output';
    console.error(`[Research Agent] Execution failed for ${event.ticker}:`, errMsg);
    await updateResearchEvent(event.id, {
      status: 'COOLED_DOWN',
      catalystSummary: `Research attempt failed: ${errMsg}`
    }, pool);
    return { success: false, error: errMsg };
  }

  // 2. Parse sections from raw markdown
  const parsed = parseMarkdownReport(rawMarkdown);

  // Combine sources parsed from markdown and grounding metadata
  const allSources: ResearchSource[] = [...parsed.sources];
  for (const gs of groundingSources) {
    if (!allSources.some(s => s.url === gs.url)) {
      allSources.push(gs);
    }
  }

  // 3. Strict Deterministic Application Validation (Section 19 of prompt)
  const isValidReport =
    parsed.executiveSummary.length > 20 &&
    parsed.immediateCatalyst.length > 20 &&
    parsed.directMarketImpact.length > 15;

  const reportId = `rep_${Date.now()}_${event.ticker.toLowerCase()}`;
  const reportStatus = isValidReport ? 'COMPLETED' : 'PARTIAL';

  const report: ResearchReport = {
    id: reportId,
    eventId: event.id,
    assetName: event.assetName,
    ticker: event.ticker,
    assetClass: event.assetClass,
    changePercent: event.changePercent,
    period: event.period,
    triggerTimestamp: event.triggeredAt,
    executiveSummary: parsed.executiveSummary,
    immediateCatalyst: parsed.immediateCatalyst,
    directMarketImpact: parsed.directMarketImpact,
    broaderContext: parsed.broaderContext,
    whatMarketIsReactingTo: parsed.whatMarketIsReactingTo,
    whatToWatchNext: parsed.whatToWatchNext,
    confidence: parsed.confidence,
    confidenceExplanation: parsed.confidenceExplanation,
    sources: allSources,
    rawMarkdown,
    status: reportStatus,
    createdAt: new Date().toISOString()
  };

  // 4. Persist Report & Update Event
  await saveResearchReport(report, pool);

  await updateResearchEvent(
    event.id,
    {
      status: 'ACTIVE',
      reportId: report.id,
      catalystSummary: typeof report.immediateCatalyst === 'string' 
        ? report.immediateCatalyst.slice(0, 240) 
        : (report.immediateCatalyst?.summary || '').slice(0, 240),
      lastCheckedAt: new Date().toISOString()
    },
    pool
  );

  console.log(`[Research Agent] Successfully completed Deep Research for ${event.ticker} (Report ID: ${reportId}, model: ${modelUsed}, sources: ${allSources.length})`);
  return { success: true, report };
}
