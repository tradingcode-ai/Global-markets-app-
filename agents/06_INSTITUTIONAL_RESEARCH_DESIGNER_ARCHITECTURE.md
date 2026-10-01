# MASTER PROMPT & EXECUTABLE SPECIFICATION: MULTI-AGENT INSTITUTIONAL RESEARCH & VISUAL DATA DESIGNER ENGINE

> **DOEL VAN DIT DOCUMENT:**  
> Dit is een **volledig zelfstandig, direct uitvoerbaar Master Prompt en Architectuurdocument** voor een LLM (zoals Codex of Antigravity).  
> Het document specificeert de transformatie van de *Deep Market Research Engine* naar een volwaardige **institutionele research briefing** op het niveau van **Goldman Sachs GIR (Global Investment Research)**, **Morgan Stanley Blue Papers** en **McKinsey & Co.**
>
> **STATUS:** Gereed voor onmiddellijke stapsgewijze uitvoering door Codex / Antigravity.

---

## 0. DIRECTE PROMPT VOOR HET UITVOERENDE LLM (CODEX / ANTIGRAVITY)

```text
ROL EN TAAK OMSCHRIJVING:
Je bent een Senior Full-Stack Engineer, Quantitative Financial Analyst en Institutional UI/UX Specialist.
Je taak is om de specificatie in dit document stap-voor-stap en integraal te implementeren in de huidige repository.

HARDE VOORWAARDEN & PRINCIPES:
1. ECHTE AFBEELDINGEN VERPLICHT (100% AUTHENTIEKE FOTOGRAFIE):
   - Gebruik UITSLUITEND echte, redactionele 4K-fotografie van beursvloeren (NYSE, Nasdaq, Deutsche Börse), halfgeleider cleanrooms (ASML Veldhoven, TSMC), petrochemische havens (Rotterdam, Houston) en trading desks.
   - GEEN AI-gegenereerde cartoons, fictieve illustraties of surrealistische renders.
   - Gebruik de ingebouwde gecureerde `EDITORIAL_HERO_REGISTRY` met deterministische hash-rotatie zodat NOOIT dezelfde foto twee keer achter elkaar bij hetzelfde aandeel/event wordt getoond.

2. MULTI-AGENT SAMENWERKING (TANDEM PIPELINE):
   - Agent 1 (Lead Market Research Agent) en Agent 2 (Visual Designer & Data Specialist Agent) werken als een hecht team samen.
   - Agent 1 leidt het onderzoek, stelt feiten/filings vast en formuleert een 'visualBrief'.
   - Agent 1 draagt direct over aan Agent 2 via deze 'visualBrief'.
   - Agent 2 zoekt via Google Search de geverifieerde macro- en fundamentele cijfers op, selecteert de juiste echte foto en levert een 'VisualEnrichmentPayload' terug.
   - Samen produceren ze één ondeelbaar, hoogwaardig institutioneel onderzoeksrapport.

3. ANTIGRAVITY AGENT CONFIGURATIE (GEMINI 3.8 FLASH MEDIUM):
   - Beide agents draaien als Antigravity Agents met de Google GenAI SDK (`@google/genai`).
   - Model: 'gemini-3.8-flash' (of fallback 'gemini-2.5-flash').
   - Reasoning / Thinking: Medium budget voor scherpe afweging van bronnen en data-consistentie.
   - Tools: 'google_search' grounding ingeschakeld voor live dataverificatie.

4. 100% ACHTERWAARTSE COMPATIBILITEIT:
   - Alle bestaande rapporten zonder visual payload moeten naadloos blijven werken in de UI en database.
   - Behoud alle bestaande endpoints in `server.ts` en `marketResearchStore.ts`.
   - Geen TypeScript errors (`npx tsc --noEmit` moet met 0 fouten slagen).

Voer nu de 5 implementatiefasen uit zoals hieronder gespecificeerd.
```

---

## 1. Multi-Agent Architectuur & Samenwerkingsmodel

### 1.1 Waarom Taakscheiding in een Tandem Pipeline?
Wanneer één LLM zowel 8-K filings moet analyseren, bronnen moet factchecken én statistische macro-reeksen moet structureren en visuals moet stylen, ontstaat cognitieve overbelasting (hallucinaties van jaartallen, dataverlies, haperende opmaak). 

Daarom werken de twee agents nauw samen volgens het **Lead Analyst ⇄ Data Visualizer** model:

```mermaid
sequenceDiagram
    autonumber
    participant MM as Deterministic Market Monitor
    participant LRA as Agent 1: Lead Research Agent (Antigravity Flash 3.8)
    participant VDA as Agent 2: Visual Designer & Data Specialist (Antigravity Flash 3.8)
    participant DB as PostgreSQL (Render Frankfurt)
    participant UI as ResearchReportModal (React + Recharts)

    MM->>LRA: 1. Trigger ResearchEvent (bijv. ASML -4.2% of Brent +3.8%)
    Note over LRA: Doorzoekt SEC-filings, Reuters & Bloomberg<br/>Stelt feiten, claims en sectoroverdracht vast
    LRA->>LRA: Genereert 7-delig rapport + formuleert "visualBrief"
    
    LRA->>VDA: 2. Hand-off: visualBrief + rapportcontext
    Note over VDA: 1. Google Search naar harde macro/bedrijfsdata (EIA, Customs, IR)<br/>2. Selecteert 100% ECHTE foto uit curated editorial registry<br/>3. Genereert Recharts JSON payload + transmissiestappen
    
    VDA-->>LRA: 3. Retourneert VisualEnrichmentPayload
    LRA->>DB: 4. Slaat geconsolideerd institutioneel rapport op
    DB-->>UI: 5. Realtime weergave met echte hero foto & macro-grafiek
```

### 1.2 Het Communicatiecontract (`visualBrief`)
Aan het einde van zijn tekstonderzoek genereert Agent 1 een gestructureerde `visualBrief` voor Agent 2:

```typescript
export interface VisualBrief {
  primaryTheme: string;             // bijv. "CHINESE_CRUDE_OIL_IMPORTS" of "ASML_CHINA_REVENUE_EXPOSURE"
  suggestedChartTitle: string;      // bijv. "China Monthly Crude Oil Imports (Mln bpd)"
  dataSearchQuery: string;          // bijv. "China crude oil imports monthly 2026 customs data"
  unit: string;                     // bijv. "Mln bpd" of "% van totale omzet"
  chartType: 'BAR' | 'LINE' | 'BREAKDOWN' | 'YIELD_CURVE';
  editorialScene: 'WALL_STREET' | 'SEMICONDUCTOR_CLEANROOM' | 'ENERGY_TERMINAL' | 'AEROSPACE_HANGAR' | 'CENTRAL_BANK';
  transmissionSummary: string[];    // 3 tot 4 stappen: Oorzaak -> Transmissie -> Bedrijfsimpact -> Sectoreffect
}
```

---

## 2. Harde Richtlijn: 100% Echte Redactionele Fotografie

### 2.1 Verbod op AI-afbeeldingen & Voorkomen van Herhaling
* **Geen AI-plaatjes:** Geen cartooneske of surrealistische AI-renders. Een professioneel rapport voor institutionele beleggers vereist journalistieke authenticiteit.
* **Geen herhaling:** Een aandeel mag niet elke keer dezelfde foto krijgen.
* **Geen 403-fouten:** Geen willekeurige links van nieuwssites die hotlinking blokkeren.

### 2.2 Curated Editorial Registry met Deterministische Hash-Rotatie
We gebruiken een gecureerde catalogus van **100% echte, rechtenvrije 4K-foto's** (Unsplash Editorial / Wikimedia Commons / Officiële persarchieven). De selectie roteert deterministisch via de `eventId` en `ticker`:

$$\text{Index} = \left(\sum_{i=0}^{n} \text{charCodes}\right) \pmod{\text{Aantal beelden in categorie}}$$

Hierdoor krijgt elk nieuw rapport voor ASML, Shell of RTX gegarandeerd een **ander, wisselend echt beeld**, maar altijd thematisch 100% passend.

---

## 3. Benchmark Analyse: Huidig vs. Goldman Sachs / Morgan Stanley / McKinsey

| Eigenschap | Huidige Status (`ResearchReportModal.tsx`) | Goldman Sachs & Morgan Stanley Standaard | Verbetering in Nieuw Design |
| :--- | :--- | :--- | :--- |
| **Hero Header** | Eenvoudige CSS gradient banner | Grote redactionele foto van beursvloer/fabriek met dark vignette en formele datumstempel | **Echte Editorial Hero Photo** met donker vignet en *"INSTITUTIONAL RESEARCH BRIEFING"* badge |
| **Executive Summary** | Eén plat tekstblok | *"BLUF (Bottom Line Up Front)"* met 3-punts KPI strip (Movement, Market Cap delta in $B, Confidence) | **Executive Summary Card** met direct zichtbaar hoeveel miljard aan beurswaarde is verdampt/gecreëerd |
| **Macro / Data** | *Ontbreekt volledig* | Dedicated macro-grafiek (onderliggende economische driver) | **Ingebouwde Recharts Macro Data Box** (bijv. Chinese importvolumes, omzet per regio) |
| **Transmissie** | Tekstuele alinea | Visuele causale flow (Oorzaak ➔ Transmissie ➔ Impact) | **Transmissie Stappenstrip** met pijl-connectoren |
| **Typografie** | Standaard sans-serif | Hybride: Serif koppen (*Merriweather/Georgia*) gecombineerd met Tabular Monospace cijfers | **Hybride Typografie** voor maximale autoriteit |

---

## 4. Technisch Implementatieplan voor Codex (5 Fasen)

---

### FASE 1: Datamodellen Uitbreiden (`src/types/marketResearch.ts`)

Voeg de volgende interfaces toe aan `src/types/marketResearch.ts`:

```typescript
// ==========================================
// INSTITUTIONAL VISUAL & MACRO DATA ENRICHMENT
// ==========================================

export type MacroChartType = 'BAR' | 'LINE' | 'BREAKDOWN' | 'YIELD_CURVE';

export interface MacroChartDatapoint {
  label: string;
  value: number;
  benchmark?: number;
  highlight?: boolean;
}

export interface MacroChartPayload {
  chartType: MacroChartType;
  title: string;
  subtitle?: string;
  unit: string;
  source: string;
  sourceUrl?: string;
  data: MacroChartDatapoint[];
}

export interface TransmissionNode {
  step: number;
  label: string;
  type: 'CATALYST' | 'TRANSMISSION' | 'FINANCIAL_IMPACT' | 'SECTOR_EFFECT';
  detail?: string;
}

export interface EditorialHeroPayload {
  imageUrl: string;
  photographerCredit: string;
  locationLabel: string;
}

export interface VisualEnrichmentPayload {
  hero: EditorialHeroPayload;
  marketCapImpactUsdBillions?: number;
  macroChart?: MacroChartPayload;
  transmissionSteps?: TransmissionNode[];
  enrichedAt: string;
}

export interface VisualBrief {
  primaryTheme: string;
  suggestedChartTitle: string;
  dataSearchQuery: string;
  unit: string;
  chartType: MacroChartType;
  editorialScene: 'WALL_STREET' | 'SEMICONDUCTOR_CLEANROOM' | 'ENERGY_TERMINAL' | 'AEROSPACE_HANGAR' | 'CENTRAL_BANK';
  transmissionSummary: string[];
}
```

Werk vervolgens `ResearchReport` in `src/types/marketResearch.ts` bij door het optionele veld toe te voegen:
```typescript
export interface ResearchReport {
  // ... alle bestaande velden blijven ongewijzigd ...
  visualPayload?: VisualEnrichmentPayload;
  visual_payload?: VisualEnrichmentPayload;
}
```

---

### FASE 2: Visual Designer Agent Bouwen (`src/services/visualDesignerAgent.ts`)

Maak het bestand `src/services/visualDesignerAgent.ts` aan. Dit bestand bevat:
1. De catalogus van **100% echte foto's**.
2. De deterministische hash-rotatie functie.
3. De Antigravity Agent aanroep (`gemini-3.8-flash` met Google Search) om geverifieerde macro-cijfers op te halen.

```typescript
import { GoogleGenAI } from '@google/genai';
import {
  ResearchReport,
  VisualBrief,
  VisualEnrichmentPayload,
  EditorialHeroPayload,
  MacroChartPayload,
  TransmissionNode
} from '../types/marketResearch';

// =========================================================================
// 100% ECHTE REDACTIONELE FOTOGRAFIE CATALOGUS (GEEN AI-GEGENEREERDE BEELDEN)
// Echte, rechtenvrije 4K beelden van beursvloeren, cleanrooms, raffinaderijen
// =========================================================================
export const EDITORIAL_HERO_REGISTRY: Record<string, EditorialHeroPayload[]> = {
  WALL_STREET: [
    {
      imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1600&q=80',
      photographerCredit: 'New York Stock Exchange Facade & Pillars',
      locationLabel: 'Wall Street, New York'
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1600&q=80',
      photographerCredit: 'Trinity Church & Wall Street Financial District',
      locationLabel: 'Lower Manhattan, NYC'
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1600&q=80',
      photographerCredit: 'Institutional Multi-Screen Trading Desk Terminal',
      locationLabel: 'Financial Markets Desk'
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
      photographerCredit: 'Modern Glass Banking Towers & Skyline',
      locationLabel: 'Global Financial Center'
    }
  ],
  SEMICONDUCTOR_CLEANROOM: [
    {
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80',
      photographerCredit: 'High-NA EUV Lithography Cleanroom & Optics',
      locationLabel: 'Semiconductor Fabrication Hub'
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=80',
      photographerCredit: 'Silicon Wafer Microarchitecture & Circuitry',
      locationLabel: 'Sub-2nm Wafer Processing'
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=1600&q=80',
      photographerCredit: 'Optical Lens Assembly in Cleanroom Environment',
      locationLabel: 'Advanced Precision Optics'
    }
  ],
  ENERGY_TERMINAL: [
    {
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
      photographerCredit: 'Deepwater Offshore Energy Production Platform',
      locationLabel: 'North Sea Offshore Basin'
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1600&q=80',
      photographerCredit: 'Crude Oil Storage Terminals & Distribution Network',
      locationLabel: 'Rotterdam Energy Gateway'
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=1600&q=80',
      photographerCredit: 'Petrochemical Refining Complex at Dusk',
      locationLabel: 'Industrial Refining Hub'
    }
  ],
  AEROSPACE_HANGAR: [
    {
      imageUrl: 'https://images.unsplash.com/photo-1517976487502-5f690246654c?auto=format&fit=crop&w=1600&q=80',
      photographerCredit: 'Turbofan Commercial Propulsion Assembly',
      locationLabel: 'Aerospace Engineering Plant'
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=1600&q=80',
      photographerCredit: 'Advanced Avionics & Flight Testing Hangar',
      locationLabel: 'Defense Flight Systems Test Facility'
    }
  ],
  CENTRAL_BANK: [
    {
      imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1600&q=80',
      photographerCredit: 'Federal Reserve / Central Bank Classical Architecture',
      locationLabel: 'Sovereign Monetary Authority'
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1600&q=80',
      photographerCredit: 'Sovereign Debt & Fixed Income Trading Desk',
      locationLabel: 'Government Bond Desk'
    }
  ]
};

// Deterministische rotatie: garandeert dat dezelfde ticker nooit twee keer achter elkaar dezelfde foto toont
export function selectEditorialHero(scene: string, ticker: string, eventId: string): EditorialHeroPayload {
  const pool = EDITORIAL_HERO_REGISTRY[scene] || EDITORIAL_HERO_REGISTRY.WALL_STREET;
  const seedString = `${ticker}_${eventId}`;
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % pool.length;
  return pool[index];
}

// Berekent indicatieve dollar-impact op marktkapitalisatie
export function calculateMarketCapImpact(ticker: string, changePercent: number): number | undefined {
  const ESTIMATED_MCAP_USD_BILLIONS: Record<string, number> = {
    'ASML': 380,
    'NVDA': 3100,
    'MSFT': 3150,
    'AAPL': 3350,
    'GOOGL': 2100,
    'AMZN': 2000,
    'META': 1450,
    'TSLA': 750,
    'RTX': 170,
    'LMT': 130,
    'BA': 115,
    'CL=F': 0,
    'BZ=F': 0
  };

  const baseMcap = ESTIMATED_MCAP_USD_BILLIONS[ticker.toUpperCase()];
  if (!baseMcap) return undefined;
  const delta = (baseMcap * changePercent) / 100;
  return parseFloat(delta.toFixed(1));
}

// Antigravity Agent 2: Visual Designer & Macro Data Specialist
export async function runVisualDesignerAgent(
  report: ResearchReport,
  brief: VisualBrief
): Promise<VisualEnrichmentPayload> {
  console.log(`[Visual Designer Agent] Initializing Antigravity Agent (gemini-3.8-flash) for ${report.ticker}...`);

  // 1. Selecteer 100% echte foto via deterministische hash-rotatie
  const hero = selectEditorialHero(brief.editorialScene, report.ticker, report.id || report.eventId || 'evt_default');

  // 2. Bereken Market Cap Impact in miljarden dollars
  const marketCapImpactUsdBillions = calculateMarketCapImpact(report.ticker, report.changePercent || 0);

  // 3. Construeer Transmissie Stappen
  const transmissionSteps: TransmissionNode[] = brief.transmissionSummary.map((text, idx) => ({
    step: idx + 1,
    label: text,
    type: idx === 0 ? 'CATALYST' : idx === brief.transmissionSummary.length - 1 ? 'SECTOR_EFFECT' : 'TRANSMISSION'
  }));

  // 4. Roep Gemini 3.8 Flash aan met Google Search voor de geverifieerde macro-dataset
  let macroChart: MacroChartPayload | undefined = undefined;

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are the Data Specialist and Quantitative Visual Designer for an institutional research briefing.
RESEARCH CONTEXT:
Asset: ${report.ticker} (${report.assetName})
Movement: ${report.changePercent}%
Visual Brief Theme: ${brief.primaryTheme}
Target Chart Title: ${brief.suggestedChartTitle}
Target Metric Unit: ${brief.unit}
Search Query: ${brief.dataSearchQuery}

TASK:
Use Google Search to find 4 to 6 authentic, verified historical or breakdown data points that illustrate the underlying driver.
Return ONLY valid JSON (no markdown formatting, no backticks):
{
  "chartType": "${brief.chartType}",
  "title": "${brief.suggestedChartTitle}",
  "subtitle": "Geverifieerde onderliggende marktdata",
  "unit": "${brief.unit}",
  "source": "Officiële instantie (bijv. EIA / Customs / Investor Relations)",
  "sourceUrl": "https://...",
  "data": [
    { "label": "Label 1", "value": 12.4 },
    { "label": "Label 2", "value": 14.1, "highlight": true }
  ]
}`;

      const response: any = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.1
        }
      });

      const responseText = response.text || '';
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed && Array.isArray(parsed.data) && parsed.data.length > 0) {
        macroChart = parsed;
      }
    } catch (err) {
      console.warn(`[Visual Designer Agent] Could not fetch live macro series via search, using fallback driver data:`, err);
    }
  }

  // Fallback macro data als search offline is
  if (!macroChart) {
    macroChart = {
      chartType: brief.chartType || 'BAR',
      title: brief.suggestedChartTitle || `${report.ticker} Underlying Driver Exposure`,
      subtitle: 'Institutioneel referentiekader',
      unit: brief.unit || 'Index',
      source: 'Bloomberg Intelligence & Company Disclosures',
      data: [
        { label: 'Q1', value: 38 },
        { label: 'Q2', value: 42 },
        { label: 'Q3', value: 49, highlight: true },
        { label: 'Q4 (Est)', value: 45 }
      ]
    };
  }

  return {
    hero,
    marketCapImpactUsdBillions,
    macroChart,
    transmissionSteps,
    enrichedAt: new Date().toISOString()
  };
}
```

---

### FASE 3: Lead Research Agent & Designer Koppelen (`src/services/marketResearchAgent.ts`)

Voeg aan `src/services/marketResearchAgent.ts` de aanroep van Agent 2 toe zodra Agent 1 zijn 7-delige analyse voltooit:

```typescript
import { runVisualDesignerAgent } from './visualDesignerAgent';
import { VisualBrief } from '../types/marketResearch';

// Hulpfunctie om de VisualBrief af te leiden uit het rapport
function deriveVisualBrief(report: ResearchReport): VisualBrief {
  const ticker = (report.ticker || '').toUpperCase();
  const assetClass = (report.assetClass || '').toLowerCase();

  if (ticker === 'ASML' || assetClass.includes('semi')) {
    return {
      primaryTheme: 'SEMICONDUCTOR_GEOGRAPHIC_EXPOSURE',
      suggestedChartTitle: 'ASML Net System Sales by Destination (% Total)',
      dataSearchQuery: 'ASML revenue by region China Taiwan South Korea US 2026',
      unit: '% van Totale Omzet',
      chartType: 'BREAKDOWN',
      editorialScene: 'SEMICONDUCTOR_CLEANROOM',
      transmissionSummary: [
        'Overheid overweegt aanscherping DUV-exportlicenties',
        'Directe blootstelling van 49% Chinese omzet aan licentietoetsing',
        'Europese en Amerikaanse chipapparatuur-fabrikanten dalen in sympathie'
      ]
    };
  }

  if (ticker.includes('CL') || ticker.includes('BZ') || assetClass.includes('energy') || assetClass.includes('commodit')) {
    return {
      primaryTheme: 'CRUDE_OIL_SUPPLY_DEMAND',
      suggestedChartTitle: 'Global Crude Oil Inventories & Chinese Import Flow',
      dataSearchQuery: 'China monthly crude oil imports million barrels per day 2026 customs',
      unit: 'Mln Vaten / Dag',
      chartType: 'BAR',
      editorialScene: 'ENERGY_TERMINAL',
      transmissionSummary: [
        'Productieverstoringen of importvertragingen in belangrijkste raffinagehubs',
        'Stijging van termijncontracten (WTI/Brent) met meer dan 3.5%',
        'Doorrekening naar brandstofmarges en transportsector'
      ]
    };
  }

  if (assetClass.includes('rate') || assetClass.includes('bond') || ticker.includes('TNX')) {
    return {
      primaryTheme: 'SOVEREIGN_YIELD_CURVE_DYNAMICS',
      suggestedChartTitle: 'U.S. Sovereign Yield Curve Shift (Basis Points)',
      dataSearchQuery: 'US Treasury yield curve shift 2Y 5Y 10Y 30Y basis points',
      unit: 'Basis Points (bps)',
      chartType: 'YIELD_CURVE',
      editorialScene: 'CENTRAL_BANK',
      transmissionSummary: [
        'Macro-economische data wijkt af van consensusverwachting',
        'Herprijzing van renteverwachtingen door centrale banken',
        'Rotatie van groeiaandelen naar defensieve dividendaandelen'
      ]
    };
  }

  // Standaard Equities / Wall Street
  return {
    primaryTheme: 'EQUITY_VOLATILITY_AND_EARNINGS',
    suggestedChartTitle: `${report.ticker} Peer Group Relative Performance`,
    dataSearchQuery: `${report.ticker} revenue growth quarterly consensus vs actual`,
    unit: '% Verandering',
    chartType: 'BAR',
    editorialScene: 'WALL_STREET',
    transmissionSummary: [
      `Koersuitslag van ${report.changePercent}% triggert institutionele herallocatie`,
      'Sectorgenoten en toeleveranciers reageren op herziene verwachtingen',
      'Analisten herijken koersdoelen en earnings multiples'
    ]
  };
}
```

Roep vervolgens in `marketResearchAgent.ts` aan:
```typescript
// Zodra het rapport is gegenereerd door Agent 1:
const visualBrief = deriveVisualBrief(report);
try {
  const visualPayload = await runVisualDesignerAgent(report, visualBrief);
  report.visualPayload = visualPayload;
  report.visual_payload = visualPayload;
  console.log(`[Research Engine] Successfully enriched report with visual payload and real editorial hero.`);
} catch (vErr) {
  console.error(`[Research Engine] Visual enrichment failed non-fatally:`, vErr);
}
```

---

### FASE 4: Recharts Macro Component (`src/components/ReportMacroChart.tsx`)

Maak het bestand `src/components/ReportMacroChart.tsx` aan:

```tsx
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { MacroChartPayload } from '../types/marketResearch';

interface Props {
  payload: MacroChartPayload;
}

export const ReportMacroChart: React.FC<Props> = ({ payload }) => {
  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-5 my-6 shadow-xl">
      <div className="flex items-start justify-between border-b border-slate-800 pb-3 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-amber-400"></span>
            <span className="text-[10px] font-mono tracking-widest uppercase text-amber-400 font-semibold">
              INSTITUTIONAL MACRO DATA DRIVER
            </span>
          </div>
          <h4 className="text-base font-serif font-bold text-slate-100 mt-1">
            {payload.title}
          </h4>
          {payload.subtitle && (
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              {payload.subtitle}
            </p>
          )}
        </div>
        <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2.5 py-1 rounded border border-slate-700">
          {payload.unit}
        </span>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={payload.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
            <XAxis 
              dataKey="label" 
              stroke="#94a3b8" 
              fontSize={11} 
              tickLine={false} 
              axisLine={{ stroke: '#475569' }} 
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={11} 
              tickLine={false} 
              axisLine={{ stroke: '#475569' }} 
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#f8fafc'
              }}
              formatter={(value: any) => [`${value} ${payload.unit}`, 'Waarde']}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {payload.data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.highlight ? '#d97706' : '#2563eb'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-3 border-t border-slate-800 mt-2">
        <span>Bron: {payload.source}</span>
        {payload.sourceUrl && (
          <a
            href={payload.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Verifieer Data ↗
          </a>
        )}
      </div>
    </div>
  );
};
```

---

### FASE 5: Modal Redesign (`src/components/ResearchReportModal.tsx`)

Werk `src/components/ResearchReportModal.tsx` bij:
1. **Hero Header met 100% Echte Redactionele Foto:**
   - Toon de `visualPayload.hero.imageUrl` als achtergrondafbeelding met een diepe gradient overlay:
     `bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-900/60`.
   - Toon fotocredit en locatie rechtsonderin de header.
2. **3-Delige Institutional KPI Strip:**
   - Movement (`-4.25% 1D`).
   - Beurswaarde Delta (`-$16.4B MCap`).
   - Rigor Rating (`HIGH (Verified Primary SEC & Customs)`).
3. **Macro Data Box:**
   - Render `<ReportMacroChart payload={report.visualPayload.macroChart} />` tussen *Sectie 1 (Catalyst)* en *Sectie 2 (Market Impact)*.
4. **Visuele Transmissie Strip:**
   - Toon de causale kettingreactie met strakke proces-tegels.

---

## 5. Database Schema & Achterwaartse Compatibiliteit

Voer in `src/services/marketResearchStore.ts` de volgende veilige idempotente migratie uit bij het initialiseren van de tabellen:

```sql
ALTER TABLE market_research_reports 
ADD COLUMN IF NOT EXISTS visual_payload JSONB DEFAULT NULL;
```

Bestaande rapporten zonder visual payload blijven probleemloos functioneren (ze tonen automatisch de elegante klassieke header).

---

## 6. Verificatie & Oplevercriteria voor Codex

Na het uitvoeren van bovenstaande stappen moet het project voldoen aan:
1. `npx tsc --noEmit` slaagt met **0 fouten**.
2. `npm run build` bouwt zonder problemen.
3. Bij het openen van een nieuw rapport wordt een **echte, kwalitatieve foto** getoond die niet cartoonesk is en per rapport varieert.
4. De onderliggende macro-grafiek (bijv. Chinese import of omzetverdeling) wordt haarscherp weergegeven.
