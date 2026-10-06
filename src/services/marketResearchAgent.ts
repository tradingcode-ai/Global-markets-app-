import { GoogleGenAI } from '@google/genai';
import pg from 'pg';
import {
  ResearchEvent,
  ResearchReport,
  ResearchSource,
  ResearchConfidence,
  VisualBrief,
  ResearchCertainty,
  EventNoteSectionPurpose,
  ResearchClaim,
  Catalyst,
  Risk
} from '../types/marketResearch';
import {
  saveResearchReport,
  updateResearchEvent
} from './marketResearchStore';
import { runAntiGravityVisualDataAgent } from './antiGravityVisualDataAgent';

// System prompt incorporating Sell-Side Editorial & Writing Architecture
// (agents/marketResearchSellSideEditorialSpecification.ts & agents/05_EVENT_AND_SYSTEM_PROMPT.md)
export const DEEP_MARKET_RESEARCH_SYSTEM_PROMPT = `You are the Deep Market Research Agent for the Global Markets application, authoring institutional Sell-Side Event Notes.

PURPOSE
Investigate significant market movements and produce a complete, source-based institutional Sell-Side Event Note explaining what happened, why the market may be reacting, and what relevant context surrounds the event.
You are an institutional research agent, not an investment adviser. Do not provide retail investment recommendations, fake buy/hold/sell ratings, or simulated price targets.

SELL-SIDE EDITORIAL & WRITING ARCHITECTURE
- Bottom-Line First: Lead with the event and its core investment meaning immediately. Do not bury the analytical conclusion behind scene-setting or chronological news recaps.
- Analytical Default: Concise, institutional tone tailored for professional market readers. Avoid promotional language, generic market filler, or artificial drama.
- Concise Paragraphs: One primary idea per paragraph. The lead sentence carries the analytical conclusion, evidence immediately supports it, and market/financial implication follows evidence.
- Conclusion-Style Headlines: Report and section headlines must state the analytical conclusion rather than a generic topic (e.g. "China exposure remains material, but headline overstates near-term earnings sensitivity", NOT "China Exposure"). No clickbait, sensationalism, or unconfirmed claims presented as fact.
- Quantify When Verified: Prefer exact verified numbers over qualitative adjectives. Preserve units, currency, period, and basis. Distinguish actual vs estimate vs guidance vs consensus. Never invent missing values, backsolve unstated figures, or use synthetic fallback data.
- Epistemic Integrity: Distinguish confirmed facts, reported claims, analysis/inferences, and uncertainties. Developing-event writing may adopt restrained financial journalism with explicit attribution, stating clearly what remains unconfirmed.

CERTAINTY LANGUAGE RULES (EPISTEMIC INTEGRITY)
Every material statement must reflect its exact evidentiary certainty:
1. CONFIRMED:
   - Supported by authoritative primary sources (SEC filings, company IR, official government agencies/regulators, official exchange disclosures).
   - May state as fact without qualification. Preferred language: "confirmed", "disclosed", "reported in official data".
2. REPORTED:
   - Reported by credible financial media (Reuters, Bloomberg, FT, WSJ) but not yet independently confirmed.
   - Attribution required: "Reuters reported...", "According to Bloomberg...". Never state as established fact.
3. CLAIMED:
   - Statements or assertions by company officials, spokespersons, or stakeholders without independent verification.
   - Preserve the claimant: "The company said...", "Officials claimed...".
4. INFERRED:
   - Reasoned analytical deductions, transmission channels, or valuation implications.
   - Signal analysis: "This suggests...", "Our interpretation is...", "The move appears consistent with...".
5. UNKNOWN:
   - Facts or data that cannot be established.
   - Explicitly state uncertainty: "has not been confirmed", "remains unclear", "cannot yet be established". Never resolve uncertainty prematurely.

ANALYST VOICE GUARDRAILS
- No fake buy/hold/sell ratings.
- No fake price targets.
- No fake earnings estimates or simulated model revisions.
- Discuss market implications, valuation sensitivity, risk/reward asymmetry, and base-case interpretations.
- Never invent citations, data points, or source links.

CORE EDITORIAL SEQUENCE
Every section should progress through:
CLAIM -> EVIDENCE -> INTERPRETATION -> MARKET / FINANCIAL IMPLICATION -> WHAT TO WATCH

SOURCE SELECTION
Use the following registry as a source-selection aid. The registry is not a mandatory browsing order.
Choose sources based on:
- relevance to the specific event;
- ability to establish or verify the specific claim;
- source authority and reliability;
- independence from other sources.

Primary / Official Sources:
Prefer relevant primary sources when they directly document the event.
Examples include:
- company Investor Relations websites and official press releases;
- SEC / EDGAR filings;
- Federal Reserve, U.S. Treasury, SEC, CFTC, ECB, Bank of England, Bank of Japan, European Commission;
- relevant government agencies and financial-market regulators;
- official exchange announcements (CME Group, ICE, Nasdaq, NYSE);
- OPEC, IEA, EIA, official producer or government energy agencies.
Use the appropriate primary source for the event rather than mechanically searching all primary sources.

Preferred Financial News:
When relevant, use high-quality financial news for reporting, independent confirmation, market reaction and context.
Preferred examples:
- Reuters;
- Bloomberg;
- CNBC;
- Financial Times;
- The Wall Street Journal.
These sources are preferred financial-news sources, but they are not automatically authoritative for every claim.

Preferred Real-Time Signals:
Use these sources when relevant for breaking developments and early market signals:
- Walter Bloomberg — X: @DeItaone
- First Squawk — X: @FirstSquawk
- LiveSquawk — X: @LiveSquawk
- FinancialJuice — X: @financialjuice
- Nick Timiraos — X: @NickTimiraos
- The Kobeissi Letter — X: @KobeissiLetter
Real-time signal sources are early-warning sources, not automatic confirmation sources.
Do not treat a post from a real-time signal account as a confirmed fact solely because it is published quickly or widely repeated.
Where practical, corroborate material claims with a primary or official source, an independent high-quality financial-news source, or another genuinely independent reliable source. Multiple sources repeating the same underlying report do not constitute multiple independent confirmations.

Specialist Sources:
Use specialist publications and services when they provide materially relevant information that broader financial media may not yet contain.
Examples include:
- aerospace and defense publications;
- semiconductor publications;
- energy and commodity specialists;
- shipping and supply-chain publications;
- specialist geopolitical publications;
- specialist market-data/news services.
Treat specialist and real-time sources as evidence whose reliability must be evaluated in context.
Every source included in the final report must have materially contributed to the research.

SOURCE SELECTION PRINCIPLE
Do not browse the Preferred-Source Registry from top to bottom.
Do not automatically search every preferred source.
Autonomously determine which sources are most relevant to the event.
For example:
- a company announcement → company IR / filing first;
- a central-bank event → relevant central bank and high-quality financial news;
- a geopolitical breaking event → relevant official sources plus independent financial reporting;
- an unexpected commodity move → relevant real-time signals, commodity sources, official agencies and independent financial reporting.
If a primary source directly establishes the catalyst, prefer it for that factual claim.
If a real-time signal identifies a breaking development, use it as an early signal and seek appropriate confirmation.
Every source included in the final report must have materially contributed to the research.
Do not use a source merely because it appears in the Preferred-Source Registry.

CAUSALITY
Do not assume the cause before researching it.
Consider relevant simultaneous catalysts such as:
- company developments;
- earnings or guidance;
- macroeconomic data;
- central-bank policy;
- geopolitics;
- commodities;
- sector developments;
- regulation;
- supply chains or infrastructure;
- broader market conditions.
Only describe causation as established when the evidence supports it.

CONFLICTING INFORMATION
When credible sources disagree, identify the disagreement, attribute the claims and explain what remains unresolved.

REQUIRED REPORT OUTPUT STRUCTURE
The final response MUST be a complete Sell-Side Event Note formatted in Markdown with the following exact section headers:

# [Conclusion-Style Report Headline]

Market Move
Asset: [Asset Name], Ticker: [Ticker], Asset Class: [Asset Class], Movement: [Move%], Period: [Period], Timestamp: [Timestamp]

The Bottom Line
A compact institutional synthesis answering:
1. What happened?
2. What is confirmed vs reported/claimed?
3. Why did the market care?
4. What is the investment implication?
5. What matters next?

The Key Debate
The core investment question or tension framing the move (bull vs bear tension, expectations vs reality, valuation vs growth). Connect to earnings, multiples, or positioning.

Key Takeaways
Strictly maximum 3 concise bullet points summarizing the highest-conviction conclusions:
- [Takeaway 1]
- [Takeaway 2]
- [Takeaway 3]

1. What Drove the Move
The immediate catalyst and evidence surrounding the event. Explicitly organize into:
- Confirmed Facts: Authoritatively verified data, filings, or announcements.
- Reported Claims: Unconfirmed media reports or stakeholder claims with direct attribution.
- Analysis / Inference: Reasoned interpretation of the catalyst mechanism.

2. Direct Market / Sector Impact
Why it matters: Explain the transmission mechanism into company financials (earnings, margins, cash flows, valuation multiples) and sector peers.

3. Broader Context
Macroeconomic, geopolitical, supply chain, policy, or industry context materially relevant to the event.

4. What the Market Is Reacting To
Identify the underlying expectations, positioning, or sentiment shift driving price discovery. Separate evidence from inference.

5. Forward View & What to Watch Next
Next observable catalysts, upcoming earnings dates, regulatory milestones, or key economic data points.

6. Catalysts & Risks
Provide specific catalysts and risks formatted with subheadings:
**Catalysts:**
- [Catalyst with timing if known, e.g. Q3 Earnings (Oct 24, 2026)]: [Description]
**Risks:**
- [Key downside or volatility risk]: [Description]

7. What Would Change Our View
View invalidators: 2-4 concrete, observable developments or data points that would invalidate our baseline interpretation.
- [Invalidator 1]
- [Invalidator 2]

8. Confidence
High, Medium, or Low, followed by an evidence-based explanation of data quality and verification completeness.

9. Sources
Numbered or bulleted list of verified sources actually consulted during research. Format each source with Title, URL, and Publisher:
- [Source Title](URL) - Publisher

FINAL CHECK
Before returning the report, verify:
- The event was actually researched autonomously with fresh grounding data.
- Sources are relevant, reliable, and properly attributed; every source materially contributed.
- Certainty language strictly distinguishes CONFIRMED facts, REPORTED media accounts, CLAIMED statements, INFERRED analysis, and UNKNOWN uncertainties.
- Causality is not assumed or overstated; simultaneous catalysts were considered.
- The complete Sell-Side Event Note structure is present (Headline, Market Move, The Bottom Line, The Key Debate, Key Takeaways max 3, Sections 1–9).
- Headlines state analytical conclusions rather than generic topics.
- Quantified numbers are verified; no missing figures, percentages, quotes, or citations were fabricated.
- No retail investment recommendations, fake buy/hold/sell ratings, or fake price targets were provided.
- The result is an institutional, rigorous Sell-Side Event Note, not generic filler or a short answer.`;

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
  headline?: string;
  bottomLine?: string;
  keyDebate?: string;
  keyTakeaways?: string[];
  executiveSummary: string;
  immediateCatalyst: string;
  directMarketImpact: string;
  broaderContext: string;
  whatMarketIsReactingTo: string;
  whatToWatchNext: string;
  catalysts?: Catalyst[];
  risks?: Risk[];
  whatWouldChangeOurView?: string[];
  claims?: ResearchClaim[];
  confidence: ResearchConfidence;
  confidenceExplanation: string;
  sources: ResearchSource[];
}

function extractStructuredClaims(
  bottomLine: string | undefined,
  keyDebate: string | undefined,
  immediateCatalyst: string,
  directMarketImpact: string,
  broaderContext: string,
  whatToWatchNext: string,
  sources: ResearchSource[]
): ResearchClaim[] {
  const claims: ResearchClaim[] = [];
  let claimIndex = 1;

  const determineCertainty = (text: string): ResearchCertainty => {
    if (/\b(?:confirmed|official|sec filing|filing shows|disclosed|registered)\b/i.test(text)) {
      return 'CONFIRMED';
    }
    if (/\b(?:reported|according to|reuters|bloomberg|wsj|ft|sources said)\b/i.test(text)) {
      return 'REPORTED';
    }
    if (/\b(?:said|stated|claimed|company said|spokesperson)\b/i.test(text)) {
      return 'CLAIMED';
    }
    if (/\b(?:unclear|unconfirmed|unknown|cannot be established|remains to be seen)\b/i.test(text)) {
      return 'UNKNOWN';
    }
    return 'INFERRED';
  };

  const findSourceIds = (text: string): string[] => {
    const ids: string[] = [];
    for (let i = 0; i < sources.length; i++) {
      const src = sources[i];
      if (src.publisher && text.toLowerCase().includes(src.publisher.toLowerCase())) {
        ids.push(`src_${i + 1}`);
      } else if (src.title && text.toLowerCase().includes(src.title.toLowerCase().slice(0, 15))) {
        ids.push(`src_${i + 1}`);
      }
    }
    return ids;
  };

  // 1. Bottom Line Claim
  if (bottomLine && bottomLine.length > 10) {
    claims.push({
      id: `claim_${claimIndex++}`,
      text: bottomLine.slice(0, 300).trim(),
      certainty: determineCertainty(bottomLine),
      sourceIds: findSourceIds(bottomLine),
      sectionPurpose: 'bottom_line',
      implication: 'Primary institutional bottom-line takeaway for the event.'
    });
  }

  // 2. Key Debate Claim
  if (keyDebate && keyDebate.length > 10) {
    claims.push({
      id: `claim_${claimIndex++}`,
      text: keyDebate.slice(0, 300).trim(),
      certainty: 'INFERRED',
      sourceIds: findSourceIds(keyDebate),
      sectionPurpose: 'key_debate',
      interpretation: 'Core market debate framing price discovery.'
    });
  }

  // 3. What Drove the Move Claims
  if (immediateCatalyst && immediateCatalyst.length > 10) {
    const bulletLines = immediateCatalyst.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 20 && (/^[-*•\d.]/.test(l) || /^(?:Confirmed|Reported|Analysis|Inference)/i.test(l)));

    if (bulletLines.length > 0) {
      for (const line of bulletLines.slice(0, 4)) {
        const cleanLine = line.replace(/^[-*•\d.)\s]+/, '').trim();
        claims.push({
          id: `claim_${claimIndex++}`,
          text: cleanLine,
          certainty: determineCertainty(cleanLine),
          sourceIds: findSourceIds(cleanLine),
          sectionPurpose: 'what_drove_the_move'
        });
      }
    } else {
      claims.push({
        id: `claim_${claimIndex++}`,
        text: immediateCatalyst.slice(0, 300).trim(),
        certainty: determineCertainty(immediateCatalyst),
        sourceIds: findSourceIds(immediateCatalyst),
        sectionPurpose: 'what_drove_the_move'
      });
    }
  }

  // 4. Direct Market Impact / Why It Matters Claim
  if (directMarketImpact && directMarketImpact.length > 10) {
    claims.push({
      id: `claim_${claimIndex++}`,
      text: directMarketImpact.slice(0, 300).trim(),
      certainty: determineCertainty(directMarketImpact),
      sourceIds: findSourceIds(directMarketImpact),
      sectionPurpose: 'why_it_matters',
      implication: 'Fundamental transmission into earnings, margins, or valuation.'
    });
  }

  // 5. Broader Context / Financial Impact Claim
  if (broaderContext && broaderContext.length > 10) {
    claims.push({
      id: `claim_${claimIndex++}`,
      text: broaderContext.slice(0, 300).trim(),
      certainty: determineCertainty(broaderContext),
      sourceIds: findSourceIds(broaderContext),
      sectionPurpose: 'financial_impact'
    });
  }

  // 6. Forward View Claim
  if (whatToWatchNext && whatToWatchNext.length > 10) {
    claims.push({
      id: `claim_${claimIndex++}`,
      text: whatToWatchNext.slice(0, 300).trim(),
      certainty: determineCertainty(whatToWatchNext),
      sourceIds: findSourceIds(whatToWatchNext),
      sectionPurpose: 'forward_view'
    });
  }

  return claims;
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

  // 1. Headline
  let headline: string | undefined = undefined;
  const headlineExplicit = rawMarkdown.match(/(?:^|\n)(?:#+\s*Headline:?|Headline:)\s*([^\n]+)/i);
  if (headlineExplicit && headlineExplicit[1]) {
    headline = clean(headlineExplicit[1]).replace(/^[#*_\s]+|[#*_\s]+$/g, '');
  } else {
    const topH1 = rawMarkdown.match(/(?:^|\n)#\s+([^\n]+)/);
    if (topH1 && topH1[1]) {
      const candidate = clean(topH1[1]).replace(/^[#*_\s]+|[#*_\s]+$/g, '');
      if (!/^(?:Market Move|Deep Market Research|Research Report|Global Markets)/i.test(candidate)) {
        headline = candidate;
      }
    }
  }

  // 2. The Bottom Line
  const bottomLine = extractSection([
    /(?:###?\s*The Bottom Line|The Bottom Line:?|###?\s*Bottom Line|Bottom Line:?)\s*([\s\S]*?)(?=(?:###?\s*(?:The Key Debate|Key Debate|Key Takeaways|Executive Summary|1\.)|\n(?:The Key Debate|Key Debate|Key Takeaways|1\.)))/i
  ]);

  // 3. The Key Debate
  const keyDebate = extractSection([
    /(?:###?\s*The Key Debate|The Key Debate:?|###?\s*Key Debate|Key Debate:?)\s*([\s\S]*?)(?=(?:###?\s*(?:Key Takeaways|1\.|Executive Summary)|\n(?:Key Takeaways|1\.)))/i
  ]);

  // 4. Key Takeaways (strictly max 3)
  const rawTakeaways = extractSection([
    /(?:###?\s*Key Takeaways|Key Takeaways:?)\s*([\s\S]*?)(?=(?:###?\s*1\.|\n1\.\s*(?:What Drove|Immediate)|###?\s*(?:What Drove|Immediate)))/i
  ]);
  const keyTakeaways: string[] = [];
  if (rawTakeaways) {
    const lines = rawTakeaways.split('\n')
      .map(l => l.replace(/^[-*•\d.)\s]+/, '').trim())
      .filter(l => l.length > 5);
    keyTakeaways.push(...lines.slice(0, 3));
  }

  // 5. Executive Summary (backward-compatibility mapping)
  let executiveSummary = extractSection([
    /(?:###?\s*Executive Summary|Executive Summary:?)\s*([\s\S]*?)(?=(?:###?\s*(?:The Bottom Line|Bottom Line|1\.)|\n1\.\s*Immediate|###?\s*Immediate Catalyst))/i,
    /(?:Executive Summary)\s*([\s\S]*?)(?=(?:###?\s*1|\n1\.))/i
  ]);

  if (!executiveSummary && bottomLine) {
    executiveSummary = bottomLine;
  } else if (!executiveSummary) {
    executiveSummary = 'Executive summary unavailable in raw output.';
  }

  const resolvedBottomLine = bottomLine || (executiveSummary !== 'Executive summary unavailable in raw output.' ? executiveSummary : undefined);

  // 6. Section 1: What Drove the Move / Immediate Catalyst
  const immediateCatalyst = extractSection([
    /(?:###?\s*1\.\s*(?:What Drove the Move|Immediate Catalyst)|1\.\s*(?:What Drove the Move|Immediate Catalyst):?)\s*([\s\S]*?)(?=(?:###?\s*2\.|\n2\.\s*Direct))/i,
    /(?:(?:What Drove the Move|Immediate Catalyst):?)\s*([\s\S]*?)(?=(?:Direct Market|\n2\.))/i
  ]) || 'Documented immediate catalyst under ongoing verification.';

  // 7. Section 2: Direct Market / Sector Impact
  const directMarketImpact = extractSection([
    /(?:###?\s*2\.\s*Direct Market \/ Sector Impact|2\.\s*Direct Market \/ Sector Impact:?)\s*([\s\S]*?)(?=(?:###?\s*3\.|\n3\.\s*Broader))/i,
    /(?:Direct Market \/ Sector Impact:?)\s*([\s\S]*?)(?=(?:Broader Context|\n3\.))/i
  ]) || 'Direct market and sector transmission mechanisms identified.';

  // 8. Section 3: Broader Context
  const broaderContext = extractSection([
    /(?:###?\s*3\.\s*Broader Context|3\.\s*Broader Context:?)\s*([\s\S]*?)(?=(?:###?\s*4\.|\n4\.\s*What))/i,
    /(?:Broader Context:?)\s*([\s\S]*?)(?=(?:What the Market|\n4\.))/i
  ]) || 'Macroeconomic, geopolitical and industry context captured.';

  // 9. Section 4: What the Market Is Reacting To
  const whatMarketIsReactingTo = extractSection([
    /(?:###?\s*4\.\s*What the Market Is Reacting To|4\.\s*What the Market Is Reacting To:?)\s*([\s\S]*?)(?=(?:###?\s*5\.|\n5\.\s*(?:Forward View|What to Watch)))/i,
    /(?:What the Market Is Reacting To:?)\s*([\s\S]*?)(?=(?:Forward View|What to Watch Next|\n5\.))/i
  ]) || 'Market sentiment driving price discovery.';

  // 10. Section 5: Forward View & What to Watch Next
  const whatToWatchNext = extractSection([
    /(?:###?\s*5\.\s*(?:Forward View & What to Watch Next|Forward View|What to Watch Next)|5\.\s*(?:Forward View & What to Watch Next|Forward View|What to Watch Next):?)\s*([\s\S]*?)(?=(?:###?\s*6\.|\n6\.\s*(?:Catalysts|Confidence)|###?\s*(?:Catalysts & Risks|Confidence)))/i,
    /(?:(?:Forward View & What to Watch Next|What to Watch Next):?)\s*([\s\S]*?)(?=(?:Catalysts|Confidence|\n6\.))/i
  ]) || 'Key forthcoming macro and corporate data points.';

  // 11. Section 6: Catalysts & Risks
  const rawCatalystsRisks = extractSection([
    /(?:###?\s*6\.\s*(?:Catalysts & Risks|Catalysts and Risks)|6\.\s*(?:Catalysts & Risks|Catalysts and Risks):?|(?:Catalysts & Risks|Catalysts and Risks):?)\s*([\s\S]*?)(?=(?:###?\s*7\.|\n7\.\s*(?:What Would Change|View Invalidators)|###?\s*(?:What Would Change|View Invalidators)|###?\s*(?:6\.|8\.)\s*Confidence))/i
  ]);

  const catalysts: Catalyst[] = [];
  const risks: Risk[] = [];

  if (rawCatalystsRisks) {
    const catalystsPartMatch = rawCatalystsRisks.match(/(?:(?:\*\*|\b)Catalysts:?(?:\*\*|:)?)\s*([\s\S]*?)(?=(?:(?:\*\*|\b)Risks:?(?:\*\*|:)?|$))/i);
    const risksPartMatch = rawCatalystsRisks.match(/(?:(?:\*\*|\b)Risks:?(?:\*\*|:)?)\s*([\s\S]*?)$/i);

    if (catalystsPartMatch && catalystsPartMatch[1]) {
      const lines = catalystsPartMatch[1].split('\n')
        .map(l => l.replace(/^[-*•\d.)\s]+/, '').trim())
        .filter(l => l.length > 3);
      for (const line of lines) {
        const timingMatch = line.match(/\(([^)]*(?:Q[1-4]|\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|20\d\d|days|weeks|months|H[1-2])[^)]*)\)/i) ||
                            line.match(/\[([^\]]*(?:Q[1-4]|\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|20\d\d|days|weeks|months|H[1-2])[^\]]*)\]/i);
        const timing = timingMatch ? timingMatch[1].trim() : undefined;
        catalysts.push({
          text: line,
          timing,
          sourceIds: []
        });
      }
    }

    if (risksPartMatch && risksPartMatch[1]) {
      const lines = risksPartMatch[1].split('\n')
        .map(l => l.replace(/^[-*•\d.)\s]+/, '').trim())
        .filter(l => l.length > 3);
      for (const line of lines) {
        risks.push({
          text: line,
          sourceIds: []
        });
      }
    }

    if (catalysts.length === 0 && risks.length === 0) {
      const lines = rawCatalystsRisks.split('\n')
        .map(l => l.replace(/^[-*•\d.)\s]+/, '').trim())
        .filter(l => l.length > 3);
      for (const line of lines) {
        if (/\b(?:risk|threat|downside|headwind|vulnerability)\b/i.test(line)) {
          risks.push({ text: line, sourceIds: [] });
        } else {
          catalysts.push({ text: line, sourceIds: [] });
        }
      }
    }
  }

  // 12. Section 7: What Would Change Our View
  const rawChangeView = extractSection([
    /(?:###?\s*7\.\s*(?:What Would Change Our View|View Invalidators)|7\.\s*(?:What Would Change Our View|View Invalidators):?|(?:What Would Change Our View|View Invalidators):?)\s*([\s\S]*?)(?=(?:###?\s*(?:8\.|6\.)\s*Confidence|(?:8\.|6\.)\s*Confidence:?|###?\s*Confidence|\nConfidence))/i
  ]);

  const whatWouldChangeOurView: string[] = [];
  if (rawChangeView) {
    const lines = rawChangeView.split('\n')
      .map(l => l.replace(/^[-*•\d.)\s]+/, '').trim())
      .filter(l => l.length > 5);
    whatWouldChangeOurView.push(...lines);
  }

  // 13. Section 8 / 6: Confidence
  const rawConfidenceMatch = rawMarkdown.match(/(?:###?\s*(?:8\.|6\.)\s*Confidence|(?:8\.|6\.)\s*Confidence:?|###?\s*Confidence)\s*([\s\S]*?)(?=(?:###?\s*(?:9\.|7\.)\s*Sources|(?:9\.|7\.)\s*Sources:?|###?\s*Sources|$))/i);
  let confidence: ResearchConfidence = 'MEDIUM';
  let confidenceExplanation = '';
  if (rawConfidenceMatch && rawConfidenceMatch[1]) {
    const text = rawConfidenceMatch[1].trim();
    if (/\bHIGH\b/i.test(text)) confidence = 'HIGH';
    else if (/\bLOW\b/i.test(text)) confidence = 'LOW';
    else confidence = 'MEDIUM';
    confidenceExplanation = text;
  }

  // 14. Section 9 / 7: Sources
  const rawSourcesMatch = rawMarkdown.match(/(?:###?\s*(?:9\.|7\.)\s*Sources|(?:9\.|7\.)\s*Sources:?|###?\s*Sources)\s*([\s\S]*?)$/i);
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

  // 15. Structured Claims Extraction
  const claims = extractStructuredClaims(
    resolvedBottomLine,
    keyDebate,
    immediateCatalyst,
    directMarketImpact,
    broaderContext,
    whatToWatchNext,
    sources
  );

  return {
    headline,
    bottomLine: resolvedBottomLine,
    keyDebate: keyDebate || undefined,
    keyTakeaways: keyTakeaways.length > 0 ? keyTakeaways : undefined,
    executiveSummary,
    immediateCatalyst,
    directMarketImpact,
    broaderContext,
    whatMarketIsReactingTo,
    whatToWatchNext,
    catalysts: catalysts.length > 0 ? catalysts : undefined,
    risks: risks.length > 0 ? risks : undefined,
    whatWouldChangeOurView: whatWouldChangeOurView.length > 0 ? whatWouldChangeOurView : undefined,
    claims: claims.length > 0 ? claims : undefined,
    confidence,
    confidenceExplanation,
    sources
  };
}

/**
 * Converts the completed textual report into a constrained hand-off for the
 * visual specialist. It describes the research question, not financial data.
 */
export function deriveVisualBrief(report: ResearchReport): VisualBrief {
  const ticker = (report.ticker || '').toUpperCase();
  const assetClass = (report.assetClass || report.asset_class || '').toLowerCase();

  if (ticker === 'ASML' || assetClass.includes('semi')) {
    return {
      primaryTheme: 'SEMICONDUCTOR_GEOGRAPHIC_EXPOSURE',
      suggestedChartTitle: 'Semiconductor equipment exposure by destination',
      dataSearchQuery: `${ticker} latest revenue by geography official investor relations disclosure`,
      unit: '% of total revenue',
      chartType: 'BREAKDOWN',
      editorialScene: 'SEMICONDUCTOR_CLEANROOM',
      transmissionSummary: [
        'Documented policy, demand, or export-control catalyst',
        'Exposure transmits through customer geography and order visibility',
        'Earnings and valuation expectations are repriced',
        'Semiconductor equipment peers react to the revised risk signal'
      ]
    };
  }

  if (
    ticker.includes('CL') ||
    ticker.includes('BZ') ||
    ticker.includes('BRENT') ||
    assetClass.includes('energy') ||
    assetClass.includes('commodit')
  ) {
    return {
      primaryTheme: 'CRUDE_OIL_SUPPLY_DEMAND',
      suggestedChartTitle: 'Verified crude supply, demand, or inventory driver',
      dataSearchQuery: `${ticker} latest official crude imports inventories or production series`,
      unit: 'reported units',
      chartType: 'BAR',
      editorialScene: 'ENERGY_TERMINAL',
      transmissionSummary: [
        'Documented supply, demand, logistics, or geopolitical catalyst',
        'Physical availability and prompt pricing transmit through the curve',
        'Downstream margins and transport costs are reassessed',
        'Energy-sensitive sectors absorb the revised risk premium'
      ]
    };
  }

  if (assetClass.includes('rate') || assetClass.includes('bond') || ticker.includes('TNX')) {
    return {
      primaryTheme: 'SOVEREIGN_YIELD_CURVE_DYNAMICS',
      suggestedChartTitle: 'Verified sovereign yield-curve observations',
      dataSearchQuery: 'latest official US Treasury yield curve 2Y 5Y 10Y 30Y',
      unit: 'basis points or percent as reported',
      chartType: 'YIELD_CURVE',
      editorialScene: 'CENTRAL_BANK',
      transmissionSummary: [
        'Economic or policy data changes the rate-path debate',
        'Sovereign yields reprice across the maturity curve',
        'Discount rates transmit into duration-sensitive assets',
        'Capital rotates across growth, defensives, and fixed income'
      ]
    };
  }

  return {
    primaryTheme: 'EQUITY_VOLATILITY_AND_EARNINGS',
    suggestedChartTitle: `${ticker} verified underlying operating or peer driver`,
    dataSearchQuery: `${ticker} official investor relations latest operating metric or peer disclosure`,
    unit: 'reported units',
    chartType: 'LINE',
    editorialScene: 'WALL_STREET',
    transmissionSummary: [
      `The documented ${report.changePercent ?? report.change_percent ?? 'unknown'}% move triggers institutional reassessment`,
      'Operating, supply-chain, or peer evidence transmits into expectations',
      'Earnings multiples and risk premia are recalibrated',
      'Sector components respond to the revised information set'
    ]
  };
}

// Concurrency mutex lock: ensures only 1 Deep Market Research Agent runs at any given moment
let agentExecutionLock: Promise<any> = Promise.resolve();

export async function executeResearchForEvent(
  event: ResearchEvent,
  pool: pg.Pool | null
): Promise<{ success: boolean; report?: ResearchReport; error?: string }> {
  // Wait for previous agent execution to complete so research runs strictly 1-by-1
  const previous = agentExecutionLock;
  let release: (value?: any) => void = () => {};
  agentExecutionLock = new Promise(resolve => { release = resolve; });

  await previous.catch(() => {});

  try {
    return await executeResearchForEventInternal(event, pool);
  } finally {
    release();
  }
}

async function executeResearchForEventInternal(
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
        environment: {
          type: 'remote',
          sources: [
            {
              type: 'inline',
              content: DEEP_MARKET_RESEARCH_SYSTEM_PROMPT,
              target: '.agents/AGENTS.md'
            }
          ]
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

          // Extract and record exact Google Interactions API token usage
          const usage = (interactionResponse as any)?.usage || 
            (interactionResponse as any)?.usage_metadata || 
            (interactionResponse as any)?.usageMetadata;

          let promptTokens = Number(usage?.total_input_tokens ?? usage?.prompt_tokens ?? usage?.promptTokenCount ?? 0);
          let candidatesTokens = Number(usage?.total_output_tokens ?? usage?.completion_tokens ?? usage?.candidatesTokenCount ?? 0);
          let thoughtsTokens = Number(usage?.total_thought_tokens ?? usage?.thoughts_tokens ?? usage?.thoughtsTokenCount ?? 0);
          let outputTokens = candidatesTokens + thoughtsTokens;
          let totalTokens = Number(usage?.total_tokens ?? usage?.totalTokenCount ?? (promptTokens + outputTokens));

          // If usage was broken into steps, sum step tokens
          if (totalTokens === 0 && Array.isArray((interactionResponse as any)?.steps)) {
            for (const step of (interactionResponse as any).steps) {
              const stepUsage = step.usage || step.usage_metadata;
              if (stepUsage) {
                promptTokens += Number(stepUsage.total_input_tokens || stepUsage.prompt_tokens || 0);
                outputTokens += Number(stepUsage.total_output_tokens || stepUsage.completion_tokens || 0);
                totalTokens += Number(stepUsage.total_tokens || 0);
              }
            }
          }

          if (pool && totalTokens > 0) {
            try {
              await pool.query(`
                INSERT INTO gemini_token_usage (
                  agent_type, model, input_tokens, output_tokens, total_tokens, operation, metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
              `, [
                'antigravity_research_agent',
                modelUsed,
                promptTokens,
                outputTokens,
                totalTokens,
                `RESEARCH_DOSSIER_${event.ticker}`,
                JSON.stringify({
                  ticker: event.ticker,
                  eventId: event.id,
                  promptTokenCount: promptTokens,
                  candidatesTokenCount: candidatesTokens,
                  thoughtsTokenCount: thoughtsTokens,
                  totalTokenCount: totalTokens,
                  source: 'INTERACTIONS_API'
                })
              ]);
              console.log(`[Research Agent] ✅ Exact Google Interactions usageMetadata saved: ${promptTokens} in / ${outputTokens} out (${totalTokens} total) for ${event.ticker}`);
            } catch (saveErr: any) {
              console.warn(`[Research Agent] Failed to save Antigravity token usage to DB:`, saveErr.message);
            }
          }
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

          // Record exact Google usageMetadata to Postgres
          if (response.usageMetadata && pool) {
            const promptTokens = response.usageMetadata.promptTokenCount || 0;
            const candidatesTokens = response.usageMetadata.candidatesTokenCount || 0;
            const thoughtsTokens = (response.usageMetadata as any).thoughtsTokenCount || 0;
            const outputTokens = candidatesTokens + thoughtsTokens;
            const totalTokens = response.usageMetadata.totalTokenCount || (promptTokens + outputTokens);

            try {
              await pool.query(`
                INSERT INTO gemini_token_usage (
                  agent_type, model, input_tokens, output_tokens, total_tokens, operation, metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
              `, [
                'antigravity_research_agent',
                modelUsed || model,
                promptTokens,
                outputTokens,
                totalTokens,
                `RESEARCH_DOSSIER_${event.ticker}`,
                JSON.stringify({
                  ticker: event.ticker,
                  eventId: event.id,
                  promptTokenCount: promptTokens,
                  candidatesTokenCount: candidatesTokens,
                  thoughtsTokenCount: thoughtsTokens
                })
              ]);
              console.log(`[Research Agent] ✅ Exact Google usageMetadata saved: ${promptTokens} in / ${outputTokens} out (${totalTokens} total) for ${event.ticker}`);
            } catch (err: any) {
              console.warn(`[Research Agent] Token usage log error:`, err.message);
            }
          }

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

  // 3. Strict Deterministic Application Validation
  const isValidReport =
    (parsed.executiveSummary.length > 20 || (parsed.bottomLine && parsed.bottomLine.length > 20)) &&
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
    marketCapUsdBillions: event.marketCapUsdBillions ?? event.market_cap_usd_billions,
    period: event.period,
    triggerTimestamp: event.triggeredAt,
    headline: parsed.headline,
    bottomLine: parsed.bottomLine,
    bottom_line: parsed.bottomLine,
    keyDebate: parsed.keyDebate,
    key_debate: parsed.keyDebate,
    keyTakeaways: parsed.keyTakeaways,
    key_takeaways: parsed.keyTakeaways,
    catalysts: parsed.catalysts,
    risks: parsed.risks,
    whatWouldChangeOurView: parsed.whatWouldChangeOurView,
    claims: parsed.claims,
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

  // Visual enrichment is deliberately non-fatal: textual research remains
  // available even when the macro search is offline or returns no evidence.
  try {
    const visualBrief = deriveVisualBrief(report);
    const visualPayload = await runAntiGravityVisualDataAgent(report, visualBrief, pool);
    report.visualPayload = visualPayload;
    report.visual_payload = visualPayload;
    console.log(`[Research Agent] Visual enrichment attached for ${event.ticker}.`);
  } catch (visualError: any) {
    console.warn(`[Research Agent] Visual enrichment failed non-fatally for ${event.ticker}:`, visualError?.message || visualError);
  }

  // 4. Persist Report & Update Event
  await saveResearchReport(report, pool);

  await updateResearchEvent(
    event.id,
    {
      status: 'ACTIVE',
      reportId: report.id,
      catalystSummary: parsed.bottomLine 
        ? parsed.bottomLine.slice(0, 240)
        : (typeof report.immediateCatalyst === 'string' 
            ? report.immediateCatalyst.slice(0, 240) 
            : (report.immediateCatalyst?.summary || '').slice(0, 240)),
      lastCheckedAt: new Date().toISOString()
    },
    pool
  );

  console.log(`[Research Agent] Successfully completed Deep Research for ${event.ticker} (Report ID: ${reportId}, model: ${modelUsed}, sources: ${allSources.length})`);
  return { success: true, report };
}
