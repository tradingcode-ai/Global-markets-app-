import { SovereignBondItem } from '../types';
export type { SovereignBondItem };

export interface GlobalEconomyMeta {
  country: string;
  flag: string;
  gdpRank: number;
  gdpLabel: string;
  rating: string;
  centralBank: string;
  policyRate: string;
  role: string;
}

export const GLOBAL_ECONOMIES: GlobalEconomyMeta[] = [
  {
    country: 'United States',
    flag: '🇺🇸',
    gdpRank: 1,
    gdpLabel: '$28.8T GDP',
    rating: 'AA+ / Aaa',
    centralBank: 'Federal Reserve',
    policyRate: 'Fed Funds 4.75% - 5.00%',
    role: 'Global Reserve Currency & World Primary Risk-Free Benchmark'
  },
  {
    country: 'China',
    flag: '🇨🇳',
    gdpRank: 2,
    gdpLabel: '$18.5T GDP',
    rating: 'A+ / A1',
    centralBank: "People's Bank of China (PBOC)",
    policyRate: '7-Day RR: 1.50% • 1Y LPR: 3.10%',
    role: 'Second Largest Sovereign Debt Market & Asian Manufacturing Superpower'
  },
  {
    country: 'Germany',
    flag: '🇩🇪',
    gdpRank: 3,
    gdpLabel: '$4.6T GDP',
    rating: 'AAA',
    centralBank: 'European Central Bank (ECB) / Bundesbank',
    policyRate: 'ECB Deposit Rate: 3.50%',
    role: 'Eurozone Baseline Risk-Free Anchor & Continental Collateral Standard'
  },
  {
    country: 'Japan',
    flag: '🇯🇵',
    gdpRank: 4,
    gdpLabel: '$4.1T GDP',
    rating: 'A+ / A1',
    centralBank: 'Bank of Japan (BOJ)',
    policyRate: 'Overnight Call Rate: 0.25% - 0.50%',
    role: 'World Premier Carry Trade Anchor & JGB Super-Long ALM Reference'
  },
  {
    country: 'United Kingdom',
    flag: '🇬🇧',
    gdpRank: 5,
    gdpLabel: '$3.5T GDP',
    rating: 'AA',
    centralBank: 'Bank of England (BOE)',
    policyRate: 'Official Bank Rate: 5.00%',
    role: 'Sterling Sovereign Benchmark & UK Institutional Pension Duration Standard'
  },
  {
    country: 'France',
    flag: '🇫🇷',
    gdpRank: 6,
    gdpLabel: '$3.1T GDP',
    rating: 'AA-',
    centralBank: 'ECB / Banque de France',
    policyRate: 'OAT Deficit Premium Monitoring',
    role: 'French Sovereign Benchmark & Long-Dated Institutional Financing'
  },
  {
    country: 'Italy',
    flag: '🇮🇹',
    gdpRank: 7,
    gdpLabel: '$2.3T GDP',
    rating: 'BBB',
    centralBank: 'ECB / Banca d\'Italia',
    policyRate: 'BTP Peripheral Spread Vigilance',
    role: 'Southern European Sovereign Benchmark & Eurozone High-Beta Indicator'
  },
  {
    country: 'Spain',
    flag: '🇪🇸',
    gdpRank: 8,
    gdpLabel: '$1.6T GDP',
    rating: 'A',
    centralBank: 'ECB / Banco de España',
    policyRate: 'Spanish GDP Resilience Anchor',
    role: 'Iberian Peninsula Sovereign Benchmark (Outperforming Core Peers)'
  }
];

export const SOVEREIGN_BONDS_DATA: SovereignBondItem[] = [
  // ============================================================================
  // --- 1. UNITED STATES (TREASURIES & MORTGAGE EXCHANGE FEED) ---
  // ============================================================================
  {
    id: 'us-2y-treasury',
    symbol: 'US2Y',
    name: 'U.S. 2-Year Treasury Note',
    issuer: 'U.S. Department of the Treasury',
    country: 'United States',
    flag: '🇺🇸',
    maturity: '2Y',
    currentYield: 4.68,
    changeBps: -4.8,
    changePercent: -1.02,
    dayHigh: 4.73,
    dayLow: 4.66,
    previousClose: 4.728,
    sparkline: [4.74, 4.73, 4.71, 4.70, 4.69, 4.68],
    benchmarkRole: 'Monetary Policy & Short-End Fed Funds Rate Expectation Anchor',
    creditRating: 'AA+ (S&P) / Aaa (Moody’s)',
    centralBankPolicyRate: 'Fed Funds: 4.75% - 5.00%',
    spreadVsBundBps: 119.0,
    spreadVsUS10YBps: 27.0 // 10Y - 2Y curve slope
  },
  {
    id: 'us-10y-treasury',
    symbol: 'US10Y',
    name: 'U.S. 10-Year Treasury Benchmark',
    issuer: 'U.S. Department of the Treasury',
    country: 'United States',
    flag: '🇺🇸',
    maturity: '10Y',
    currentYield: 4.95,
    changeBps: -5.3,
    changePercent: -1.06,
    dayHigh: 5.01,
    dayLow: 4.94,
    previousClose: 5.003,
    sparkline: [5.03, 5.01, 4.99, 4.97, 4.96, 4.95],
    benchmarkRole: 'Global Risk-Free Rate, Corporate Cost of Capital & Equity Valuation Anchor',
    creditRating: 'AA+ (S&P) / Aaa (Moody’s)',
    centralBankPolicyRate: 'Fed Balance Sheet Runoff (QT: $60B/mo)',
    spreadVsBundBps: 146.0,
    spreadVsUS10YBps: 0.0
  },
  {
    id: 'us-30y-treasury',
    symbol: 'US30Y',
    name: 'U.S. 30-Year Treasury Bond ("Long Bond")',
    issuer: 'U.S. Department of the Treasury',
    country: 'United States',
    flag: '🇺🇸',
    maturity: '30Y',
    currentYield: 5.31,
    changeBps: -4.1,
    changePercent: -0.77,
    dayHigh: 5.36,
    dayLow: 5.29,
    previousClose: 5.351,
    sparkline: [5.37, 5.35, 5.33, 5.32, 5.31, 5.31],
    benchmarkRole: 'Ultra Long-Term Inflation & Term Premium Benchmark',
    creditRating: 'AA+ (S&P) / Aaa (Moody’s)',
    centralBankPolicyRate: 'Fiscal Debt Issuance Supply Monitor',
    spreadVsBundBps: 146.1,
    spreadVsUS10YBps: 36.0 // 30Y - 10Y term premium slope
  },
  {
    id: 'us-30y-mortgage',
    symbol: 'US30YFRM',
    name: 'U.S. 30-Year Fixed Mortgage Benchmark',
    issuer: 'US30YFRM:Exchange / Freddie Mac PMMS Live Feed',
    country: 'United States',
    flag: '🇺🇸',
    maturity: 'Mortgage 30Y',
    currentYield: 6.76,
    changeBps: -6.0,
    changePercent: -0.88,
    dayHigh: 6.84,
    dayLow: 6.72,
    previousClose: 6.82,
    sparkline: [6.89, 6.86, 6.82, 6.79, 6.77, 6.76],
    benchmarkRole: 'Primary U.S. Residential Real Estate & Consumer Debt Benchmark (US30YFRM:Exchange)',
    creditRating: 'MBS Guaranteed (GSE Agency)',
    centralBankPolicyRate: 'Mortgage Spread: +181 bps over 10Y Treasury',
    spreadVsBundBps: 327.0,
    spreadVsUS10YBps: 181.0
  },

  // ============================================================================
  // --- 2. CHINA (PEOPLE'S REPUBLIC OF CHINA - CGB) ---
  // ============================================================================
  {
    id: 'cn-10y-cgb',
    symbol: 'CN10Y',
    name: 'China 10-Year Government Bond (CGB)',
    issuer: 'Ministry of Finance (People’s Republic of China)',
    country: 'China',
    flag: '🇨🇳',
    maturity: '10Y',
    currentYield: 2.12,
    changeBps: -1.2,
    changePercent: -0.56,
    dayHigh: 2.15,
    dayLow: 2.10,
    previousClose: 2.132,
    sparkline: [2.16, 2.15, 2.14, 2.13, 2.12, 2.12],
    benchmarkRole: 'World’s 2nd Largest Sovereign Bond Market Reference & PBOC Yield Curve Anchor',
    creditRating: 'A+ (S&P) / A1 (Moody’s)',
    centralBankPolicyRate: 'PBOC 7-Day Reverse Repo: 1.50% • 1Y LPR: 3.10%',
    spreadVsBundBps: -137.0,
    spreadVsUS10YBps: -283.0
  },
  {
    id: 'cn-30y-cgb',
    symbol: 'CN30Y',
    name: 'China 30-Year Government Bond (CGB)',
    issuer: 'Ministry of Finance (People’s Republic of China)',
    country: 'China',
    flag: '🇨🇳',
    maturity: '30Y',
    currentYield: 2.38,
    changeBps: -1.8,
    changePercent: -0.75,
    dayHigh: 2.42,
    dayLow: 2.36,
    previousClose: 2.398,
    sparkline: [2.43, 2.41, 2.40, 2.39, 2.38, 2.38],
    benchmarkRole: 'PBOC Financial Stability Monitoring & Commercial Bank ALM Duration Standard',
    creditRating: 'A+ (S&P) / A1 (Moody’s)',
    centralBankPolicyRate: 'PBOC Secondary Market Treasury Trading Operations Active',
    spreadVsBundBps: -147.0,
    spreadVsUS10YBps: -293.0
  },

  // ============================================================================
  // --- 3. GERMANY (BUNDS - EUROZONE RISK FREE BENCHMARK) ---
  // ============================================================================
  {
    id: 'de-10y-bund',
    symbol: 'DE10Y',
    name: 'Germany 10-Year Federal Bund',
    issuer: 'Bundesrepublik Deutschland Finanzagentur',
    country: 'Germany',
    flag: '🇩🇪',
    maturity: '10Y',
    currentYield: 3.49,
    changeBps: -2.1,
    changePercent: -0.60,
    dayHigh: 3.52,
    dayLow: 3.47,
    previousClose: 3.511,
    sparkline: [3.53, 3.52, 3.50, 3.49, 3.49, 3.49],
    benchmarkRole: 'Eurozone Sovereign Risk-Free Reference Benchmark & Collateral Standard',
    creditRating: 'AAA (Stable across all agencies)',
    centralBankPolicyRate: 'ECB Deposit Rate: 3.50%',
    spreadVsBundBps: 0.0,
    spreadVsUS10YBps: -146.0
  },
  {
    id: 'de-30y-bund',
    symbol: 'DE30Y',
    name: 'Germany 30-Year Federal Bund',
    issuer: 'Bundesrepublik Deutschland Finanzagentur',
    country: 'Germany',
    flag: '🇩🇪',
    maturity: '30Y',
    currentYield: 3.85,
    changeBps: -2.7,
    changePercent: -0.70,
    dayHigh: 3.89,
    dayLow: 3.83,
    previousClose: 3.877,
    sparkline: [3.91, 3.89, 3.88, 3.86, 3.85, 3.85],
    benchmarkRole: 'Eurozone Long-End Pension & Insurance ALM Duration Standard',
    creditRating: 'AAA',
    centralBankPolicyRate: 'ECB PEPP Reinvestment Tapering',
    spreadVsBundBps: 36.0,
    spreadVsUS10YBps: -110.0
  },

  // ============================================================================
  // --- 4. JAPAN (JGB - JAPANESE GOVERNMENT BONDS) ---
  // ============================================================================
  {
    id: 'jp-10y-jgb',
    symbol: 'JP10Y',
    name: 'Japan 10-Year Government Bond (JGB)',
    issuer: 'Ministry of Finance (Japan)',
    country: 'Japan',
    flag: '🇯🇵',
    maturity: '10Y',
    currentYield: 1.08,
    changeBps: +2.1,
    changePercent: +1.98,
    dayHigh: 1.10,
    dayLow: 1.05,
    previousClose: 1.059,
    sparkline: [1.04, 1.05, 1.06, 1.07, 1.08, 1.08],
    benchmarkRole: 'Asian Sovereign Baseline Risk-Free Rate & Yen Carry Trade Macro Anchor',
    creditRating: 'A+ (S&P) / A1 (Moody’s)',
    centralBankPolicyRate: 'Bank of Japan Uncollateralized Call: 0.25% - 0.50%',
    spreadVsBundBps: -241.0,
    spreadVsUS10YBps: -387.0
  },
  {
    id: 'jp-30y-jgb',
    symbol: 'JP30Y',
    name: 'Japan 30-Year Government Bond (JGB)',
    issuer: 'Ministry of Finance (Japan)',
    country: 'Japan',
    flag: '🇯🇵',
    maturity: '30Y',
    currentYield: 2.28,
    changeBps: +3.4,
    changePercent: +1.51,
    dayHigh: 2.31,
    dayLow: 2.24,
    previousClose: 2.246,
    sparkline: [2.22, 2.24, 2.25, 2.27, 2.28, 2.28],
    benchmarkRole: 'Japanese Life Insurance & Pension Asset-Liability Duration Standard',
    creditRating: 'A+ (S&P) / A1 (Moody’s)',
    centralBankPolicyRate: 'BoJ Quantitative Tapering: JGB Purchase Reductions',
    spreadVsBundBps: -157.0,
    spreadVsUS10YBps: -267.0
  },

  // ============================================================================
  // --- 5. UNITED KINGDOM (GILTS) ---
  // ============================================================================
  {
    id: 'gb-10y-gilt',
    symbol: 'GB10Y',
    name: 'United Kingdom 10-Year Gilt',
    issuer: 'UK Debt Management Office (HM Treasury)',
    country: 'United Kingdom',
    flag: '🇬🇧',
    maturity: '10Y',
    currentYield: 5.21,
    changeBps: -8.9,
    changePercent: -1.68,
    dayHigh: 5.31,
    dayLow: 5.19,
    previousClose: 5.299,
    sparkline: [5.33, 5.31, 5.28, 5.25, 5.23, 5.21],
    benchmarkRole: 'Sterling Sovereign Benchmark & UK Mortgage Transmission Rate Anchor',
    creditRating: 'AA (Stable)',
    centralBankPolicyRate: 'Bank of England Bank Rate: 5.00%',
    spreadVsBundBps: 172.0,
    spreadVsUS10YBps: 26.0
  },
  {
    id: 'gb-30y-gilt',
    symbol: 'GB30Y',
    name: 'United Kingdom 30-Year Gilt',
    issuer: 'UK Debt Management Office (HM Treasury)',
    country: 'United Kingdom',
    flag: '🇬🇧',
    maturity: '30Y',
    currentYield: 5.74,
    changeBps: -12.3,
    changePercent: -2.10,
    dayHigh: 5.88,
    dayLow: 5.71,
    previousClose: 5.863,
    sparkline: [5.90, 5.87, 5.83, 5.79, 5.76, 5.74],
    benchmarkRole: 'UK Defined Benefit Pension Liability Discounting Anchor',
    creditRating: 'AA',
    centralBankPolicyRate: 'BoE Active Gilt Sales (QT: £100B/yr)',
    spreadVsBundBps: 189.0,
    spreadVsUS10YBps: 79.0
  },

  // ============================================================================
  // --- 6. FRANCE (OAT - OBLIGATIONS ASSIMILABLES DU TRÉSOR) ---
  // ============================================================================
  {
    id: 'fr-10y-oat',
    symbol: 'FR10Y',
    name: 'France 10-Year OAT',
    issuer: 'Agence France Trésor (Ministère de l’Économie)',
    country: 'France',
    flag: '🇫🇷',
    maturity: '10Y',
    currentYield: 4.46,
    changeBps: -1.4,
    changePercent: -0.31,
    dayHigh: 4.49,
    dayLow: 4.44,
    previousClose: 4.474,
    sparkline: [4.49, 4.48, 4.47, 4.46, 4.46, 4.46],
    benchmarkRole: 'French Sovereign Fiscal Headroom & OAT-Bund Spread Risk Indicator',
    creditRating: 'AA- (Negative Outlook)',
    centralBankPolicyRate: 'OAT-Bund Spread: +97 bps (Fiscal deficit watch)',
    spreadVsBundBps: 97.0,
    spreadVsUS10YBps: -49.0
  },
  {
    id: 'fr-30y-oat',
    symbol: 'FR30Y',
    name: 'France 30-Year OAT',
    issuer: 'Agence France Trésor',
    country: 'France',
    flag: '🇫🇷',
    maturity: '30Y',
    currentYield: 5.10,
    changeBps: -2.4,
    changePercent: -0.47,
    dayHigh: 5.14,
    dayLow: 5.08,
    previousClose: 5.124,
    sparkline: [5.15, 5.13, 5.12, 5.11, 5.10, 5.10],
    benchmarkRole: 'French Long-Dated Institutional Infrastructure Financing Rate',
    creditRating: 'AA-',
    centralBankPolicyRate: 'ECB Transmission Protection Instrument (TPI) Eligible',
    spreadVsBundBps: 125.0,
    spreadVsUS10YBps: 15.0
  },

  // ============================================================================
  // --- 7. ITALY (BTP - BUONI DEL TESORO POLIENNALI) ---
  // ============================================================================
  {
    id: 'it-10y-btp',
    symbol: 'IT10Y',
    name: 'Italy 10-Year BTP',
    issuer: 'Ministero dell’Economia e delle Finanze',
    country: 'Italy',
    flag: '🇮🇹',
    maturity: '10Y',
    currentYield: 4.36,
    changeBps: -1.8,
    changePercent: -0.41,
    dayHigh: 4.40,
    dayLow: 4.34,
    previousClose: 4.378,
    sparkline: [4.41, 4.39, 4.38, 4.37, 4.36, 4.36],
    benchmarkRole: 'Southern European Peripheral Risk & Sovereign Spread Barometer',
    creditRating: 'BBB (Investment Grade)',
    centralBankPolicyRate: 'BTP-Bund Spread: +87 bps (Resilient Euro stability)',
    spreadVsBundBps: 87.0,
    spreadVsUS10YBps: -59.0
  },
  {
    id: 'it-30y-btp',
    symbol: 'IT30Y',
    name: 'Italy 30-Year BTP',
    issuer: 'Ministero dell’Economia e delle Finanze',
    country: 'Italy',
    flag: '🇮🇹',
    maturity: '30Y',
    currentYield: 5.00,
    changeBps: -3.0,
    changePercent: -0.60,
    dayHigh: 5.05,
    dayLow: 4.97,
    previousClose: 5.03,
    sparkline: [5.06, 5.04, 5.02, 5.01, 5.00, 5.00],
    benchmarkRole: 'Italian High-Beta Sovereign Long-Duration Benchmark',
    creditRating: 'BBB',
    centralBankPolicyRate: 'EU Recovery & Resilience Facility (RRF) Target',
    spreadVsBundBps: 115.0,
    spreadVsUS10YBps: 5.0
  },

  // ============================================================================
  // --- 8. SPAIN (BONOS DEL ESTADO) ---
  // ============================================================================
  {
    id: 'es-10y-bonos',
    symbol: 'ES10Y',
    name: 'Spain 10-Year Bonos del Estado',
    issuer: 'Tesoro Público (Reino de España)',
    country: 'Spain',
    flag: '🇪🇸',
    maturity: '10Y',
    currentYield: 3.94,
    changeBps: -3.3,
    changePercent: -0.83,
    dayHigh: 3.99,
    dayLow: 3.92,
    previousClose: 3.973,
    sparkline: [4.01, 3.99, 3.97, 3.96, 3.95, 3.94],
    benchmarkRole: 'Iberian Peninsula Sovereign Benchmark (Outperforming Core Peers)',
    creditRating: 'A (Stable)',
    centralBankPolicyRate: 'Bonos-Bund Spread: +45 bps (Near 3-year tight)',
    spreadVsBundBps: 45.0,
    spreadVsUS10YBps: -101.0
  },
  {
    id: 'es-30y-bonos',
    symbol: 'ES30Y',
    name: 'Spain 30-Year Obligaciones',
    issuer: 'Tesoro Público (Reino de España)',
    country: 'Spain',
    flag: '🇪🇸',
    maturity: '30Y',
    currentYield: 4.48,
    changeBps: -3.2,
    changePercent: -0.71,
    dayHigh: 4.53,
    dayLow: 4.45,
    previousClose: 4.512,
    sparkline: [4.54, 4.52, 4.50, 4.49, 4.48, 4.48],
    benchmarkRole: 'Spanish Sovereign Green & Conventional Ultra-Long Bond Reference',
    creditRating: 'A',
    centralBankPolicyRate: 'Spanish GDP Growth +2.4% Fiscal Anchor',
    spreadVsBundBps: 63.0,
    spreadVsUS10YBps: -47.0
  }
];

export const YIELD_CURVE_BENCHMARKS = {
  usInversion: {
    spread2Y10Y: '+27.0 bps',
    spread10Y30Y: '+36.0 bps',
    status: 'Disinverted / Positively Sloped (+27 bps)',
    recessionRiskIndicator: 'Watch / Normalized Term Structure'
  },
  mortgageSpread: {
    spreadVs10Y: '+181.0 bps',
    medianMonthlyPayment500kLoan: '$3,245 / mo',
    historicalMeanSpread: '170 bps',
    exchangeFeed: 'US30YFRM:Exchange'
  },
  bundSpreads: [
    { country: 'Spain (Bonos)', spread: '+45 bps', trend: 'Tightening', rating: 'A' },
    { country: 'Italy (BTP)', spread: '+87 bps', trend: 'Stable', rating: 'BBB' },
    { country: 'France (OAT)', spread: '+97 bps', trend: 'Widening (Political Risk)', rating: 'AA-' },
    { country: 'United Kingdom (Gilt)', spread: '+172 bps', trend: 'Persistent Inflation Premium', rating: 'AA' }
  ]
};
