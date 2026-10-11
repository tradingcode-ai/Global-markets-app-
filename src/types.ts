export interface LiveQuote {
  symbol: string;
  companyName?: string;
  price: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  previousClose: number;
  currency: string;
  lastUpdated: string;
  isLive: boolean;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  twoHundredDayAverage?: number;
  sparkline?: number[];
  lastTickDirection?: 'up' | 'down' | 'unchanged';
  provider?: string;
  providerMarketSymbol?: string;
  providerName?: string;
  providerInstrumentType?: string;
  preMarketPrice?: number;
  preMarketChange?: number;
  preMarketChangePercent?: number;
  postMarketPrice?: number;
  postMarketChange?: number;
  postMarketChangePercent?: number;
  marketState?: 'PRE' | 'REGULAR' | 'POST' | 'CLOSED';
  /** Yahoo's actual last regular-market trade time, independent of fetch time. */
  providerTradeTimestamp?: string;
  /** Provider-reported quote delay, when available. Positive values are ineligible for alerts. */
  providerDelaySeconds?: number;
  /** Provider's exchange session boundaries in epoch milliseconds. */
  regularSessionStartMs?: number;
  regularSessionEndMs?: number;
  exchangeTimezoneName?: string;
  /** Previous official regular-session close used only for alert calculations. */
  alertCurrentPrice?: number;
  alertPreviousClose?: number;
  alertChangePercent?: number;
  /** True only when the provider supplied a complete 52-week range. */
  is52WeekMetricsVerified?: boolean;
  /** True only when the 200-day average came from a sufficiently long daily series. */
  isTwoHundredDayAverageVerified?: boolean;

  // Primary Local Listing & FX Conversion to USD
  primaryListingSymbol?: string;
  localPrice?: number;
  localCurrency?: string;
  localChange?: number;
  localDayHigh?: number;
  localDayLow?: number;
  localPreviousClose?: number;
  localFiftyTwoWeekHigh?: number;
  localFiftyTwoWeekLow?: number;
  priceUsd?: number;
  fxRateToUsd?: number;
  fxPair?: string;
  marketCap?: number;
  marketCapUsd?: string;
  enterpriseValueUsd?: string;
  peRatio?: number;
  exchangeName?: string;
}

export interface NotificationAssetCatalogItem {
  symbol: string;
  name: string;
  assetClass: string;
  group: 'Global indices' | 'Sector indices & ETFs' | 'Commodities' | 'Sovereign yields';
  categoryKey: string;
  thresholdPct?: number;
  unit?: string;
  currency?: string;
  providerSymbol?: string;
  quoteAvailable: boolean;
  coverageReason?: string;
  routeKind: 'global-index' | 'sector' | 'commodity' | 'bond';
  targetId?: string;
}

export type ThemeMode = 'soft-light' | 'soft-slate';

export type Region = 'US' | 'Europe';

export type Sector = 
  | 'Big Tech Megacap' 
  | 'Semiconductors & AI' 
  | 'Cloud & Enterprise' 
  | 'Consumer & Media'
  | 'Industrial Tech & Energy'
  | 'Fintech & Digital Payments'
  | 'U.S. Financials'
  | 'European Financials'
  | 'The Shovel Sellers'
  | 'Hyperscalers & Neo Clouds'
  | 'Aerospace & Defense';

export type ShovelSubSector = 
  | 'Semiconductor Equipment & Materials'
  | 'Communication Equipment'
  | 'Computer Hardware & storage'
  | 'Semiconductors';

export type CommodityCategory = 'Energy & Natural Gas' | 'Crude Oil & Refined' | 'Precious Metals' | 'Industrial & Battery Metals' | 'Agricultural & Softs';

export type BondRegion = 'US' | 'China' | 'Germany' | 'Japan' | 'United Kingdom' | 'France' | 'Italy' | 'Spain';

export interface SovereignBondItem {
  id: string;
  symbol: string; // e.g. 'US2Y', 'US10Y', 'US30Y', 'US30YMORT', 'DE10Y', 'DE30Y', etc.
  name: string;
  issuer: string;
  country: string;
  flag: string;
  maturity: '2Y' | '10Y' | '30Y' | 'Mortgage 30Y';
  currentYield: number; // in percent e.g. 4.95
  changeBps: number; // basis points e.g. -5.3
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  previousClose: number;
  sparkline: number[];
  benchmarkRole: string;
  creditRating: string;
  centralBankPolicyRate: string;
  spreadVsBundBps?: number;
  spreadVsUS10YBps?: number;
}


export type CommodityId = 
  | 'dutch-ttf' 
  | 'henry-hub'
  | 'jkm-lng'
  | 'wti-crude' 
  | 'brent-crude' 
  | 'murban-crude' 
  | 'oman-crude'
  | 'shanghai-crude'
  | 'rbob-gasoline'
  | 'heating-oil'
  | 'gold'
  | 'silver'
  | 'copper'
  | 'uranium'
  | 'lithium-carbonate'
  | 'wheat'
  | 'corn';

export interface BankOutlook {
  bankName: string;
  logoColor?: string;
  targetPrice: string;
  targetPriceNumeric: number;
  timeHorizon: string;
  stance: 'Bullish' | 'Neutral' | 'Bearish';
  thesis: string;
  catalysts: string[];
  lastUpdated: string;
}

export interface EquityBankOutlook {
  bankName: string;
  logoColor?: string;
  targetPrice: string;
  targetPriceNumeric: number;
  timeHorizon: string;
  rating: 'Overweight' | 'Outperform' | 'Buy' | 'Neutral' | 'Hold' | 'Underweight';
  nextQuarterEpsEst: string;
  nextQuarterRevEst: string;
  thesis: string;
  catalysts: string[];
  lastUpdated: string;
  provider?: string;
}

export interface CommodityItem {
  id: CommodityId;
  name: string;
  symbol: string;
  category: CommodityCategory;
  marketCode: string;
  unit: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  volume: string;
  currency: string;
  primaryBenchmarkRole: string;
  sparkline: number[];
  consensusTarget: string;
  consensusRange: { low: number; high: number; avg: number };
  macroFactors: string[];
  analystOutlooks: BankOutlook[];
  inventoryStatus?: string;
  curveStructure?: 'Backwardation' | 'Contango';
  crackSpreadOrMargin?: string;
}

export type ReportTiming = 'BMO' | 'AMC'; // Before Market Open | After Market Close
export type EarningsStatus = 'reported' | 'upcoming' | 'reporting_today';

export interface EarningsSegment {
  name: string;
  revenue: string;
  growthYoY: string;
  beatExpectation?: boolean;
  notes?: string;
}

export interface QuarterlyResult {
  id: string;
  ticker: string;
  companyName: string;
  sector: Sector;
  region?: Region;
  country?: string;
  quarter: string; // e.g. "Q2 2026", "Q1 2026"
  fiscalYear: number;
  reportDate: string; // YYYY-MM-DD
  reportTime?: ReportTiming;
  status: EarningsStatus;
  currency?: string; // USD, EUR, GBP
  
  // Financials
  epsEstimate: number;
  epsActual?: number;
  epsSurprisePercent?: number; // e.g. +5.4
  
  revenueEstimate: number; // in Billions USD
  revenueActual?: number; // in Billions USD
  revenueSurprisePercent?: number;
  revenueYoY?: number; // percentage
  
  // Market reaction
  priceReactionPercent?: number; // e.g. +6.8%
  nextDayMove?: number;
  
  // Highlights & Guidance
  keyHighlights?: string[];
  guidanceRating?: 'raised' | 'maintained' | 'lowered' | 'mixed' | 'pending';
  guidanceSummary?: string;
  aiCapexHighlight?: string;
  segments?: EarningsSegment[];
  
  // Meta
  conferenceCallTime?: string;
  isImportant?: boolean; // mega-impact tech release
  pressReleaseUrl?: string;
  analystOutlooks?: EquityBankOutlook[];
  quarterlyConsensus?: QuarterlyConsensusSnapshot;
  isBankingIndex?: boolean;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  twoHundredDayAverage?: number;
  subSector?: ShovelSubSector | string;
  liveDateProvider?: string;
  isDateConfirmed?: boolean;
  consensusMatrix?: boolean;
}

export interface LiveEarningsDate {
  symbol: string;
  reportDate: string; // YYYY-MM-DD
  reportTime?: ReportTiming;
  fiscalQuarter?: string;
  epsEstimate?: number;
  revenueEstimate?: number;
  isConfirmed: boolean;
  provider: string;
  lastUpdated: string;
}

export interface CompanyMeta {
  ticker: string;
  name: string;
  sector: Sector;
  region?: Region;
  country?: string;
  exchange?: string;
  logoBg: string;
  logoTextColor: string;
  marketCap: string;
  currentPrice: number;
  dayChangePercent: number;
  description: string;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  twoHundredDayAverage?: number;
  subSector?: ShovelSubSector | string;
  currency?: string;
  primaryListing?: string;
  localTicker?: string;
  localExchange?: string;
  localCurrency?: string;
}

export type NotificationEventType =
  | 'earnings-beat'
  | 'earnings-miss'
  | 'earnings-release'
  | 'dma-breakdown'
  | 'asset-volatility'
  | 'momentum-up'
  | 'momentum-down'
  | '52w-high'
  | '52w-low'
  | 'sec-8k'
  | 'upcoming'
  | 'breaking'
  | 'beat'
  | 'miss'
  | 'guidance';

export interface PushNotificationItem {
  id: string;
  ticker: string;
  companyName: string;
  title: string;
  body: string;
  timestamp: string;
  /** Source event time; can be date-only when the source gives no time of day. */
  eventOccurredAt?: string;
  /** Local delivery time, separate from the time the event happened. */
  deliveredAt?: string;
  tradingDate?: string;
  type: NotificationEventType;
  read: boolean;
  dedupeKey?: string;
  source?: string;
  metrics?: {
    epsActual?: number;
    epsEstimate?: number;
    revenueActual?: number;
    revenueEstimate?: number;
    priceMove?: number;
  };
  metadata?: {
    epsActual?: number;
    epsEstimate?: number;
    revenueActual?: number;
    revenueEstimate?: number;
    filingAccession?: string;
    filingUrl?: string;
    fiscalQuarter?: string;
    currentPrice?: number;
    percentageChange?: number;
    quoteTimestamp?: string;
    previousClose?: number;
    source?: string;
    guidanceNote?: string;
    eventIsHistorical?: boolean;
    assetClass?: string;
    assetGroup?: string;
    assetCategoryKey?: string;
    thresholdPct?: number;
    assetUnit?: string;
    providerSymbol?: string;
  };
}

export interface AlertPreferences {
  browserNotificationsEnabled: boolean;
  soundEnabled: boolean;
  subscribedTickers: string[]; // empty means no automatic ticker alerts
  subscribedAssetSymbols?: string[]; // opt-in non-equity market alerts, independent from stock subscriptions
  alertOnAssetVolatility?: boolean;
  alertOnEarningsBeat: boolean;
  alertOnEarningsMiss: boolean;
  alertOnSec8K: boolean;
  alertOnMomentumUp: boolean; // > +5.0%
  alertOnMomentumDown: boolean; // < -5.0%
  alertOnFiftyTwoWeekHighLow?: boolean;
  alertOnDmaBreakdown?: boolean;
  // Legacy backwards compatibility fields
  minSurprisePercentage?: number;
  alertOnBeat?: boolean;
  alertOnMiss?: boolean;
  alertOnRelease?: boolean;
  alertOnMajorSurprise?: boolean;
  alertOnGuidanceChange?: boolean;
  alertOnAiCapex?: boolean;
  reminderBeforeCall?: boolean;
  alertOnFivePercentMove?: boolean;
}

export interface AiEarningsAnalysis {
  ticker: string;
  quarter: string;
  summaryVerdict: string;
  financialScorecard: {
    epsAnalysis: string;
    revenueAnalysis: string;
    marginTrends: string;
  };
  keyDrivers: string[];
  aiAndCapexTakeaway: string;
  guidanceAndOutlook: string;
  marketImplication: string;
  bullCase: string;
  bearCase: string;
  generatedAt: string;
}

export interface QuarterlyFinancialPoint {
  quarter: string; // e.g. "Q2 '26", etc.
  releaseLabel?: string; // e.g. "jul'2026", "apr'2026", etc.
  displayLabel?: string; // clean regular calendar date on X-axis, e.g. "jul'2026"
  fiscalDate: string; // e.g. "2026-07-26"
  fiscalYear: number;
  quarterNum: 1 | 2 | 3 | 4;
  fiscalQuarterLabel?: string; // e.g. "Fiscaal Q2 2027" or "Fiscaal Q3 2026"
  reportedReleaseDate?: string; // exact date when figures were released e.g. "2026-08-26"
  revenue: number; // in Billions
  freeCashFlow: number; // in Billions
  eps: number; // in $/€
  netIncome: number; // in Billions
  isEstimated?: boolean;
  isPrePublic?: boolean;
  currency?: string;
  sourceCurrency?: string;
}

export type FinancialMetricKey = 'revenue' | 'freeCashFlow' | 'eps' | 'netIncome';

export interface CompanyFinancialHistory {
  symbol: string;
  currency: string;
  provider: string;
  lastUpdated: string;
  nextMonthlyUpdate: string;
  publicFinancialStartDate?: string | null;
  isLive: boolean;
  fiscalNote?: string;
  calendarType?: string;
  quarters: QuarterlyFinancialPoint[];
}

export interface QuarterlyAnalystOutlook {
  bankName: string;
  rating: string;
  targetPrice?: number | string;
  targetPriceNumeric?: number;
  previousTargetPrice?: number;
  currency?: string;
  asOfDate?: string;
  logoColor?: string;
  lastUpdated?: string;
  timeHorizon?: string;
  nextQuarterEpsEst?: string;
  nextQuarterRevEst?: string;
  thesis?: string;
  catalysts?: string[];
  provider?: string;
}

export interface QuarterlyConsensusSnapshot {
  ticker: string;
  quarterKey: string;
  nextQuarterLabel: string;
  snapshotDate: string;
  consensusRating?: string;
  recommendationCounts?: {
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
  };
  averagePriceTarget?: number;
  lowPriceTarget?: number;
  highPriceTarget?: number;
  targetCurrency?: string;
  consensusCurrency?: string;
  consensusPeriodEnd?: string;
  reportedFinancials?: {
    fiscalDate: string;
    eps?: number;
    revenue?: number;
    currency?: string;
    snapshotDate: string;
    isCachedSnapshot?: boolean;
    provider?: string;
  };
  nextQuarterEps?: number;
  nextQuarterEpsLow?: number;
  nextQuarterEpsHigh?: number;
  nextQuarterRevenue?: number;
  nextQuarterRevenueLow?: number;
  nextQuarterRevenueHigh?: number;
  previousQuarterEps?: number;
  previousQuarterRevenue?: number;
  yearAgoEps?: number;
  yearAgoRevenue?: number;
  analystsCount?: number;
  outlooks: (QuarterlyAnalystOutlook | EquityBankOutlook)[];
  provider?: string;
  monthlyRevisionDate?: string;
  twelveMonthHorizon?: string;
  upsidePercent?: number;
  isConvertedToUsd?: boolean;
  originalCurrency?: string;
  conversionNote?: string;
  revenueIsAnalystConsensus?: boolean;
  isLiveFeed?: boolean;
  isProviderCache?: boolean;
  isCachedSnapshot?: boolean;
  snapshotSavedAt?: string;
  isConsensusMatrixRow?: boolean;
}

export interface EarningsConsensusData {
  ticker: string;
  company_name: string;
  earnings_info: {
    next_earnings_date: string;
    earnings_status: 'Confirmed' | 'Estimated' | string;
    fiscal_quarter: string;
  };
  analyst_consensus: {
    total_analysts: number;
    consensus_price_target: number;
    expected_eps: number;
    expected_revenue: number;
    expected_net_profit: number;
  };
  analyst_breakdown: Array<{
    firm: string;
    analyst_rating: 'Buy' | 'Hold' | 'Sell' | string;
    price_target: number;
    key_notes: string;
  }>;
}
