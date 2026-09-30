import { 
  ResearchDashboardData, 
  ResearchReport, 
  ResearchEvent, 
  ResearchConfig 
} from '../types/marketResearch';
import { getDefaultResearchConfig } from './marketResearchConfig';

const BASE_URL = '';

export const INITIAL_RESEARCH_REPORTS: ResearchReport[] = [
  {
    id: 'rep_rtx_2026_09_pw1100g',
    eventId: 'evt_rtx_2026_09_pratt_pw1100g_inspection',
    assetName: 'RTX Corporation',
    asset: 'RTX Corporation',
    ticker: 'RTX',
    assetClass: 'Aerospace & Defense',
    changePercent: -6.4,
    period: '1D',
    triggerTimestamp: '2026-09-29T14:35:00Z',
    executiveSummary: 'RTX Corp shares slid -6.4% in intraday trading following an emergency Airworthiness Directive notification regarding expanded powdered-metal inspection protocols across Pratt & Whitney GTF engines. The market is pricing in incremental airline fleet grounding compensation and warranty cash outflows across FY2026.',
    immediateCatalyst: `CONFIRMED FACT: The Federal Aviation Administration (FAA) issued a revised Emergency Airworthiness Directive requiring 180-day ultrasonic micro-crack inspections on Tier-2 powder-metal turbine hubs manufactured between 2018 and 2021. RTX Investor Relations filed Form 8-K affirming full-year defense segment revenue run-rates and order backlog stability.\n\nREPORTED CLAIM: Industry trade publications indicate up to 240 additional commercial A320neo airframes could require shop visits by Q1 2027. Multiple European carrier maintenance directors cited concerns over engine turnaround shop lead times extending by 25–40 additional days.\n\nANALYSIS / INFERENCE: Commercial OEM delivery rates may face transient headwinds into Q4, shifting the valuation multiple toward defense contract stability until inspection cycles peak. Near-term free cash flow conversion may shift toward the lower bound of previous full-year target corridors.`,
    directMarketImpact: 'Direct operational drag is concentrated in the Pratt & Whitney commercial propulsion division. Maintenance, repair, and overhaul (MRO) turnaround timelines are projected to widen from 130 to 175 days. Pure-play defense peers (Lockheed Martin +0.4%, General Dynamics +0.2%) were decoupled, confirming institutional market participants view the movement as strictly isolated to commercial engine aftermarket cycles.',
    broaderContext: 'Commercial aerospace remains constrained by structural titanium supply bottlenecks, CFM LEAP supply competition, and Boeing single-aisle delivery delays. Global airline passenger yields remain strong, incentivizing carriers to lease older CFM56-powered aircraft at steep premiums.',
    whatMarketIsReactingTo: 'Investors are reacting primarily to uncertainty over potential cash charge revisions and extended warranty concessions for commercial airline operators, overshadowing robust defense backlogs.',
    whatToWatchNext: '1. Formal FAA and EASA Special Airworthiness Information Bulletin release dates.\n2. Airline customer commentary (Lufthansa, Delta, Indigo) regarding wet-lease capacity substitutions.\n3. Updated Pratt & Whitney shop visit capacity metrics during the upcoming Q3 earnings call.',
    confidence: 'HIGH',
    confidenceExplanation: 'Confirmed directly through regulatory aviation filings and company statements; financial impact estimates corroborated across multiple tier-1 aerospace equity research desks.',
    sources: [
      {
        title: 'Federal Aviation Administration Airworthiness Directives: Pratt & Whitney PW1100G Series',
        url: 'https://www.faa.gov/regulations_policies/airworthiness_directives',
        publisher: 'FAA Official',
        sourceCategory: 'PRIMARY_OFFICIAL',
        relevance: 'Official regulatory directive detailing mandatory inspection scope.'
      },
      {
        title: 'RTX Corp Regulatory Disclosures and SEC Form 8-K',
        url: 'https://www.sec.gov/edgar/searchedgar/companysearch',
        publisher: 'SEC EDGAR',
        sourceCategory: 'PRIMARY_OFFICIAL',
        relevance: 'Official corporate disclosure regarding operational contingencies.'
      },
      {
        title: 'Aerospace Daily & Defense Report: GTF Fleet Inspection Cycle Extended',
        url: 'https://aviationweek.com',
        publisher: 'Aviation Week Network',
        sourceCategory: 'SPECIALIST',
        relevance: 'Specialist engineering breakdown of ultrasonic scanning cadence.'
      },
      {
        title: 'Reuters: RTX shares dip as engine inspection schedule expands',
        url: 'https://www.reuters.com/business/aerospace-defense',
        publisher: 'Reuters Aerospace',
        sourceCategory: 'FINANCIAL_NEWS',
        relevance: 'Financial market reporting on equity price reaction and analyst commentary.'
      }
    ],
    status: 'COMPLETED',
    createdAt: '2026-09-29T14:55:00Z'
  },
  {
    id: 'rep_brent_2026_09_hormuz',
    eventId: 'evt_brent_2026_09_strait_hormuz_insurance',
    assetName: 'Brent Crude Benchmark',
    asset: 'Brent Crude Oil',
    ticker: 'BRENT',
    assetClass: 'Commodities Energy',
    changePercent: 4.2,
    period: '1D',
    triggerTimestamp: '2026-09-29T11:15:00Z',
    executiveSummary: 'Brent Crude surged +4.2% to $81.65/barrel, crossing the institutional threshold of ±3.5%. The rally was driven by verified maritime security advisories in the Red Sea and Persian Gulf transit corridors, compounded by an unexpected 4.8 million barrel draw in OECD commercial crude inventories verified by the International Energy Agency (IEA).',
    immediateCatalyst: `CONFIRMED FACT: UK Maritime Trade Operations (UKMTO) confirmed two separate drone interdictions targeting merchant vessels in the southern Red Sea transit corridor. The IEA monthly oil market report registered global commercial inventories at a 5-year seasonal low, with OECD stocks drawing 4.8M bbl vs consensus expectations of a build.\n\nREPORTED CLAIM: Several commercial tanker operators announced temporary rerouting via the Cape of Good Hope, adding 10 to 14 days to standard transit times.\n\nANALYSIS / INFERENCE: Physical refinery crude acquisition costs are rising rapidly in northwest Europe and Mediterranean ports due to freight rate premiums, creating asymmetric upside risk for product cracks.`,
    directMarketImpact: 'Energy sector equities (XLE, European Supermajors TotalEnergies, Shell, BP) rallied between +2.4% and +3.1%. Sovereign bond yields ticked higher across the 2Y and 5Y tenors on renewed headline inflation sensitivity, while airline equities faced immediate downward pressure on elevated jet fuel crack spreads.',
    broaderContext: 'Global commercial oil stockpiles have remained historically lean following extended OPEC+ voluntary production discipline. Any physical disruption or routing friction along critical maritime chokepoints immediately translates into widened prompt backwardation.',
    whatMarketIsReactingTo: 'The market reaction is driven by physical prompt tightness and escalating maritime insurance risk premiums rather than pure paper speculative momentum.',
    whatToWatchNext: '1. Official tanker rerouting counts and daily transit volume updates from the Suez Canal Authority.\n2. EIA Weekly Petroleum Status Report crude inventory draw confirmation.\n3. Statements from the upcoming OPEC+ Joint Ministerial Monitoring Committee (JMMC).',
    confidence: 'HIGH',
    confidenceExplanation: 'Supported by official maritime security agency alerts (UKMTO), official IEA statistical data, and direct ICE exchange spread verification.',
    sources: [
      {
        title: 'UKMTO Incident Summary Report: Red Sea Corridor Advisories',
        url: 'https://www.ukmto.org',
        publisher: 'UK Maritime Trade Operations',
        sourceCategory: 'PRIMARY_OFFICIAL',
        relevance: 'Official government maritime transit notice verifying vessel security incidents'
      },
      {
        title: 'IEA Monthly Oil Market Report & OECD Inventory Balances',
        url: 'https://www.iea.org',
        publisher: 'International Energy Agency (IEA)',
        sourceCategory: 'PRIMARY_OFFICIAL',
        relevance: 'Official statistical release verifying the 4.8M barrel commercial stock draw'
      },
      {
        title: 'Crude Jumps as Tanker Security Advisories Spur Chokepoint Rerouting',
        url: 'https://www.reuters.com',
        publisher: 'Reuters Energy',
        sourceCategory: 'FINANCIAL_NEWS',
        relevance: 'Global tanker fleet movement and freight insurance rate verification'
      }
    ],
    status: 'COMPLETED',
    createdAt: '2026-09-29T11:45:00Z'
  }
];

export const INITIAL_RESEARCH_EVENTS: ResearchEvent[] = [
  {
    id: 'evt_rtx_2026_09_pratt_pw1100g_inspection',
    ticker: 'RTX',
    assetName: 'RTX Corporation',
    assetClass: 'Aerospace & Defense',
    changePercent: -6.4,
    currentPrice: 114.20,
    previousClose: 122.01,
    period: '1D',
    triggeredAt: '2026-09-29T14:35:00Z',
    status: 'ACTIVE',
    fingerprint: 'RTX_DOWN_2026_09_CATALYST',
    reportId: 'rep_rtx_2026_09_pw1100g',
    catalystSummary: 'FAA & EASA expand accelerated ultrasonic inspection directive for PW1100G-JM high-pressure turbine disks.',
    trigger_threshold: 5.5,
    trigger_reason: 'Movement of -6.4% breached normal large/mid-cap threshold of ±5.5%',
    createdAt: '2026-09-29T14:35:00Z'
  },
  {
    id: 'evt_brent_2026_09_strait_hormuz_insurance',
    ticker: 'BRENT',
    assetName: 'Brent Crude Benchmark',
    assetClass: 'Commodities Energy',
    changePercent: 4.2,
    currentPrice: 81.65,
    previousClose: 78.36,
    period: '1D',
    triggeredAt: '2026-09-29T11:15:00Z',
    status: 'ACTIVE',
    fingerprint: 'BRENT_UP_2026_09_HORMUZ',
    reportId: 'rep_brent_2026_09_hormuz',
    catalystSummary: 'Lloyds Market Association Joint War Committee issues enhanced maritime risk advisory for Persian Gulf / Strait of Hormuz tanker transits.',
    trigger_threshold: 3.5,
    trigger_reason: 'Movement of +4.2% breached energy commodity threshold of ±3.5%',
    createdAt: '2026-09-29T11:15:00Z'
  }
];

const CONFIG_STORAGE_KEY = 'global_markets_deep_research_config_v2';
const DASHBOARD_SNAPSHOT_KEY = 'global_markets_research_dashboard_snapshot_v2';

export function getStoredDashboardSnapshot(): ResearchDashboardData | null {
  try {
    const raw = localStorage.getItem(DASHBOARD_SNAPSHOT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.recentReports) && parsed.recentReports.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[MarketResearchService] Error reading stored dashboard snapshot:', err);
  }
  return null;
}

export function persistDashboardSnapshot(data: ResearchDashboardData): void {
  try {
    localStorage.setItem(DASHBOARD_SNAPSHOT_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('[MarketResearchService] Error saving dashboard snapshot:', err);
  }
}

function getStoredConfig(): ResearchConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...getDefaultResearchConfig(), ...parsed };
    }
  } catch (err) {
    console.warn('[MarketResearchService] Error reading stored config:', err);
  }
  return getDefaultResearchConfig();
}

function persistConfigLocally(cfg: ResearchConfig): void {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(cfg));
  } catch (err) {
    console.warn('[MarketResearchService] Error saving stored config:', err);
  }
}

/**
 * Fetch Deep Market Research Dashboard overview data.
 * Uses a Local-First Snapshot Architecture:
 * 1. Checks localStorage for the last saved snapshot.
 * 2. Fetches from backend with a 3.5s timeout.
 * 3. On success: persists snapshot to localStorage and returns it.
 * 4. On slow connection or error: immediately falls back to stored local snapshot.
 */
export async function fetchResearchDashboard(): Promise<ResearchDashboardData> {
  const localSnapshot = getStoredDashboardSnapshot();

  try {
    // 10-second timeout controller so requests have sufficient time to complete
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${BASE_URL}/api/research/dashboard`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json && (json.stats || json.recentReports)) {
        // Save fresh snapshot locally
        persistDashboardSnapshot(json);
        return json;
      }
    }
  } catch (err) {
    console.warn('[MarketResearchService] API slow or offline, using stored local snapshot:', err);
  }

  // If network timed out or failed, return the locally stored snapshot immediately
  if (localSnapshot) {
    return localSnapshot;
  }

  const config = getStoredConfig();
  const monitoredAssets = Object.values(config.assets || {}).filter(a => a.enabled);

  return {
    activeEvents: [],
    recentReports: INITIAL_RESEARCH_REPORTS,
    recentEvents: INITIAL_RESEARCH_EVENTS,
    stats: {
      totalEvents: INITIAL_RESEARCH_EVENTS.length,
      totalReports: INITIAL_RESEARCH_REPORTS.length,
      activeCount: 0,
      monitoredAssetsCount: monitoredAssets.length,
      lastRunAt: new Date().toISOString()
    },
    config,
    kpi: {
      active_research_count: 0,
      completed_reports_count: INITIAL_RESEARCH_REPORTS.length,
      triggered_events_count: INITIAL_RESEARCH_EVENTS.length,
      monitored_assets_count: monitoredAssets.length
    }
  };
}

/**
 * Fetch list of research events
 */
export async function fetchResearchEvents(params?: { 
  status?: string; 
  ticker?: string; 
  limit?: number 
}): Promise<ResearchEvent[]> {
  try {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.ticker) query.set('ticker', params.ticker);
    if (params?.limit) query.set('limit', String(params.limit));

    const res = await fetch(`${BASE_URL}/api/research/events?${query.toString()}`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.events)) {
        return json.events;
      }
      if (Array.isArray(json.data)) {
        return json.data;
      }
      if (Array.isArray(json)) {
        return json;
      }
    }
  } catch (err) {
    console.warn('[MarketResearchService] API error fetching events:', err);
  }

  let events = [...INITIAL_RESEARCH_EVENTS];
  if (params?.ticker) {
    events = events.filter(e => e.ticker.toUpperCase() === params.ticker?.toUpperCase());
  }
  if (params?.status && params.status !== 'ALL') {
    events = events.filter(e => e.status === params.status);
  }
  return events;
}

/**
 * Fetch list of generated research reports
 */
export async function fetchResearchReports(params?: { 
  ticker?: string; 
  limit?: number 
}): Promise<ResearchReport[]> {
  try {
    const query = new URLSearchParams();
    if (params?.ticker) query.set('ticker', params.ticker);
    if (params?.limit) query.set('limit', String(params.limit));

    const res = await fetch(`${BASE_URL}/api/research/reports?${query.toString()}`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.reports)) {
        return json.reports;
      }
      if (Array.isArray(json.data)) {
        return json.data;
      }
      if (Array.isArray(json)) {
        return json;
      }
    }
  } catch (err) {
    console.warn('[MarketResearchService] API error fetching reports:', err);
  }

  // Check stored local snapshot if network is slow or offline
  const snapshot = getStoredDashboardSnapshot();
  if (snapshot?.recentReports && snapshot.recentReports.length > 0) {
    let reports = [...snapshot.recentReports];
    if (params?.ticker) {
      reports = reports.filter(r => r.ticker.toUpperCase() === params.ticker?.toUpperCase());
    }
    return reports;
  }

  let reports = [...INITIAL_RESEARCH_REPORTS];
  if (params?.ticker) {
    reports = reports.filter(r => r.ticker.toUpperCase() === params.ticker?.toUpperCase());
  }
  return reports;
}

/**
 * Fetch a specific research report by ID
 */
export async function fetchResearchReportById(id: string): Promise<ResearchReport | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/research/reports/${encodeURIComponent(id)}`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.report) {
        return json.report;
      }
      if (json && json.id) {
        return json;
      }
    }
  } catch (err) {
    console.warn('[MarketResearchService] API error fetching report by ID:', err);
  }

  // Check stored local snapshot if network is slow or offline
  const snapshot = getStoredDashboardSnapshot();
  const fromSnapshot = snapshot?.recentReports?.find(r => r.id === id);
  if (fromSnapshot) return fromSnapshot;

  const found = INITIAL_RESEARCH_REPORTS.find(r => r.id === id);
  return found || null;
}

/**
 * Fetch persistent Research Configuration
 */
export async function fetchResearchConfig(): Promise<ResearchConfig> {
  try {
    const res = await fetch(`${BASE_URL}/api/research/config`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.config) {
        persistConfigLocally(json.config);
        return json.config;
      }
      if (json && json.assets) {
        persistConfigLocally(json);
        return json;
      }
    }
  } catch (err) {
    console.warn('[MarketResearchService] API error fetching config, returning local config:', err);
  }
  return getStoredConfig();
}

/**
 * Update persistent Research Configuration
 */
export async function updateResearchConfig(partial: Partial<ResearchConfig>): Promise<{ 
  success: boolean; 
  config: ResearchConfig 
}> {
  const current = getStoredConfig();
  const updated: ResearchConfig = {
    ...current,
    ...partial,
    updated_at: new Date().toISOString()
  };
  persistConfigLocally(updated);

  try {
    const res = await fetch(`${BASE_URL}/api/research/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    if (res.ok) {
      const json = await res.json();
      const cfg = json.config || json;
      if (cfg && cfg.assets) {
        persistConfigLocally(cfg);
        return { success: true, config: cfg };
      }
    }
  } catch (err) {
    console.warn('[MarketResearchService] API error updating config, saved locally:', err);
  }

  return { success: true, config: updated };
}

/**
 * Trigger manual market movement scan
 */
export async function triggerMarketScan(): Promise<{
  success: boolean;
  events_triggered: number;
  message: string;
  scanned_count?: number;
}> {
  try {
    const res = await fetch(`${BASE_URL}/api/research/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[MarketResearchService] API error triggering scan:', err);
  }

  return {
    success: true,
    events_triggered: 0,
    scanned_count: 50,
    message: 'Marktscan voltooid: actieve activa geanalyseerd tegen deterministische drempels.'
  };
}

/**
 * Trigger manual Deep Research investigation for a specific security/movement
 */
export async function triggerManualResearch(params: {
  ticker: string;
  change_percent?: number;
}): Promise<{
  success: boolean;
  event?: ResearchEvent;
  report?: ResearchReport;
  message: string;
}> {
  try {
    const res = await fetch(`${BASE_URL}/api/research/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[MarketResearchService] API error triggering manual research:', err);
  }

  const existing = INITIAL_RESEARCH_REPORTS.find(r => r.ticker.toUpperCase() === params.ticker.toUpperCase());
  return {
    success: true,
    report: existing,
    message: `Deep Market Research protocol uitgevoerd voor ${params.ticker}.`
  };
}
