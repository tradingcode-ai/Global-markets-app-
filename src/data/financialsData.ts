import { QuarterlyResult, CompanyMeta } from '../types';

export const FINANCIAL_COMPANIES: Record<string, CompanyMeta> = {
  // U.S. BIG 6 BANKS
  JPM: {
    ticker: 'JPM',
    name: 'JPMorgan Chase & Co.',
    sector: 'U.S. Financials',
    region: 'US',
    country: 'United States',
    exchange: 'NYSE',
    logoBg: 'bg-[#002D62]',
    logoTextColor: 'text-white',
    marketCap: '$985B',
    currentPrice: 348.92,
    dayChangePercent: 1.15,
    description: 'Largest U.S. bank holding company by assets ($4.1T), leading global investment banking, commercial banking, markets, and asset management.'
  },
  BAC: {
    ticker: 'BAC',
    name: 'Bank of America Corporation',
    sector: 'U.S. Financials',
    region: 'US',
    country: 'United States',
    exchange: 'NYSE',
    logoBg: 'bg-[#002B49]',
    logoTextColor: 'text-[#E31837]',
    marketCap: '$450B',
    currentPrice: 57.90,
    dayChangePercent: 0.85,
    description: 'Second-largest U.S. banking institution serving 69 million consumer clients, Merrill Lynch wealth management, and global corporate banking.'
  },
  C: {
    ticker: 'C',
    name: 'Citigroup Inc.',
    sector: 'U.S. Financials',
    region: 'US',
    country: 'United States',
    exchange: 'NYSE',
    logoBg: 'bg-[#003B70]',
    logoTextColor: 'text-[#ED1B24]',
    marketCap: '$255B',
    currentPrice: 132.95,
    dayChangePercent: 1.42,
    description: 'Global banking franchise operating the world premier Treasury and Trade Solutions (TTS) network across 160 countries, wealth, and markets.'
  },
  WFC: {
    ticker: 'WFC',
    name: 'Wells Fargo & Company',
    sector: 'U.S. Financials',
    region: 'US',
    country: 'United States',
    exchange: 'NYSE',
    logoBg: 'bg-[#D71E28]',
    logoTextColor: 'text-[#FFD200]',
    marketCap: '$295B',
    currentPrice: 87.05,
    dayChangePercent: 0.65,
    description: 'Leading U.S. retail and commercial bank, top domestic mortgage originator, middle-market lender, and wealth management provider.'
  },
  MS: {
    ticker: 'MS',
    name: 'Morgan Stanley',
    sector: 'U.S. Financials',
    region: 'US',
    country: 'United States',
    exchange: 'NYSE',
    logoBg: 'bg-[#002B49]',
    logoTextColor: 'text-sky-300',
    marketCap: '$325B',
    currentPrice: 202.42,
    dayChangePercent: 1.80,
    description: 'Premier institutional securities powerhouse, M&A advisory leader, and global wealth management giant with over $5.5T in client assets.'
  },
  GS: {
    ticker: 'GS',
    name: 'Goldman Sachs Group, Inc.',
    sector: 'U.S. Financials',
    region: 'US',
    country: 'United States',
    exchange: 'NYSE',
    logoBg: 'bg-[#7399C6]',
    logoTextColor: 'text-white',
    marketCap: '$310B',
    currentPrice: 937.98,
    dayChangePercent: 2.10,
    description: 'Global leader in investment banking advisory, equity and FICC trading, institutional asset management, and private wealth solutions.'
  },

  // U.S. ALTERNATIVE INVESTMENT MANAGERS
  BX: {
    ticker: 'BX',
    name: 'Blackstone Inc.',
    sector: 'U.S. Financials',
    region: 'US',
    country: 'United States',
    exchange: 'NYSE',
    logoBg: 'bg-black',
    logoTextColor: 'text-white',
    marketCap: '$150B',
    currentPrice: 123.45,
    dayChangePercent: 1.95,
    description: 'World largest alternative asset manager with $1.1T+ in AUM across private equity, real estate (BREIT), private credit, and infrastructure.'
  },
  KKR: {
    ticker: 'KKR',
    name: 'KKR & Co. Inc.',
    sector: 'U.S. Financials',
    region: 'US',
    country: 'United States',
    exchange: 'NYSE',
    logoBg: 'bg-[#0C2340]',
    logoTextColor: 'text-amber-400',
    marketCap: '$86B',
    currentPrice: 96.84,
    dayChangePercent: 1.60,
    description: 'Pioneering global investment firm ($590B AUM) managing buyout private equity, infrastructure, credit, real estate, and Global Atlantic retirement assets.'
  },
  APO: {
    ticker: 'APO',
    name: 'Apollo Global Management, Inc.',
    sector: 'U.S. Financials',
    region: 'US',
    country: 'United States',
    exchange: 'NYSE',
    logoBg: 'bg-[#002244]',
    logoTextColor: 'text-[#D4AF37]',
    marketCap: '$72B',
    currentPrice: 124.53,
    dayChangePercent: 1.75,
    description: 'High-growth alternative asset manager and private credit juggernaut ($700B AUM) tightly integrated with Athene retirement services annuity platform.'
  },
  ARES: {
    ticker: 'ARES',
    name: 'Ares Management Corporation',
    sector: 'U.S. Financials',
    region: 'US',
    country: 'United States',
    exchange: 'NYSE',
    logoBg: 'bg-[#1C2541]',
    logoTextColor: 'text-cyan-400',
    marketCap: '$38B',
    currentPrice: 124.21,
    dayChangePercent: 1.40,
    description: 'Preeminent direct lending and private credit franchise ($460B AUM), providing flexible capital across North America, Europe, and Asia-Pacific.'
  },

  // EUROPEAN FINANCIALS
  BCS: {
    ticker: 'BCS',
    name: 'Barclays PLC',
    sector: 'European Financials',
    region: 'Europe',
    country: 'United Kingdom',
    exchange: 'LSE (BARC.L) / NYSE (BCS)',
    logoBg: 'bg-[#00AEEF]',
    logoTextColor: 'text-[#00395D]',
    marketCap: '£48B ($62B)',
    currentPrice: 25.34,
    dayChangePercent: 1.10,
    description: 'British universal bank with dual engines: Barclays UK retail/business banking and top-tier transatlantic Corporate & Investment Bank (CIB).'
  },
  HSBC: {
    ticker: 'HSBC',
    name: 'HSBC Holdings plc',
    sector: 'European Financials',
    region: 'Europe',
    country: 'United Kingdom / Hong Kong',
    exchange: 'LSE (HSBA.L) / NYSE (HSBC)',
    logoBg: 'bg-[#DB0011]',
    logoTextColor: 'text-white',
    marketCap: '£155B ($202B)',
    currentPrice: 100.84,
    dayChangePercent: 0.95,
    description: 'Europe largest bank by assets ($3.0T), connecting Western capital with high-growth trade corridors across Hong Kong, Asia, the Middle East, and the UK.'
  },
  ABN: {
    ticker: 'ABN',
    name: 'ABN AMRO Bank N.V.',
    sector: 'European Financials',
    region: 'Europe',
    country: 'Netherlands',
    exchange: 'Euronext Amsterdam (ABN.AS)',
    logoBg: 'bg-[#008375]',
    logoTextColor: 'text-[#FFAE00]',
    marketCap: '€16.5B ($18B)',
    currentPrice: 43.74,
    dayChangePercent: 0.80,
    description: 'Premier Dutch retail, private, and corporate bank, distinguished by industry-leading mortgage market share, wealth management, and strong capital buffers.'
  },
  ING: {
    ticker: 'ING',
    name: 'ING Groep N.V.',
    sector: 'European Financials',
    region: 'Europe',
    country: 'Netherlands',
    exchange: 'Euronext Amsterdam (INGA.AS) / NYSE',
    logoBg: 'bg-[#FF6200]',
    logoTextColor: 'text-white',
    marketCap: '€52B ($57B)',
    currentPrice: 36.36,
    dayChangePercent: 1.20,
    description: 'Global digital banking pioneer operating retail franchises across the Netherlands, Germany, and Belgium, alongside global Wholesale Banking.'
  },
  RABO: {
    ticker: 'RABO',
    name: 'Coöperatieve Rabobank U.A.',
    sector: 'European Financials',
    region: 'Europe',
    country: 'Netherlands',
    exchange: 'Euronext Amsterdam (RABO.AS)',
    logoBg: 'bg-[#001D4A]',
    logoTextColor: 'text-[#FF6600]',
    marketCap: '€28B ($31B Equiv)',
    currentPrice: 109.54,
    dayChangePercent: 0.45,
    description: 'Leading Dutch cooperative financial institution, global leader in Food & Agri wholesale financing, and issuer of Euronext-listed Rabobank Member Certificates.'
  },
  BNP: {
    ticker: 'BNP',
    name: 'BNP Paribas S.A.',
    sector: 'European Financials',
    region: 'Europe',
    country: 'France',
    exchange: 'Euronext Paris (BNP.PA)',
    logoBg: 'bg-[#00915A]',
    logoTextColor: 'text-white',
    marketCap: '€78B ($86B)',
    currentPrice: 103.28,
    dayChangePercent: 1.35,
    description: 'Eurozone largest banking group by total assets (€2.6T), dominating European Corporate & Institutional Banking (CIB), commercial banking, and wealth.'
  },
  GLE: {
    ticker: 'GLE',
    name: 'Société Générale S.A.',
    sector: 'European Financials',
    region: 'Europe',
    country: 'France',
    exchange: 'Euronext Paris (GLE.PA)',
    logoBg: 'bg-[#E60028]',
    logoTextColor: 'text-white',
    marketCap: '€26B ($29B)',
    currentPrice: 74.48,
    dayChangePercent: 1.55,
    description: 'French banking champion with global leadership in equity derivatives, structured finance, BoursoBank digital banking, and European transaction banking.'
  },
  UBS: {
    ticker: 'UBS',
    name: 'UBS Group AG',
    sector: 'European Financials',
    region: 'Europe',
    country: 'Switzerland',
    exchange: 'SIX Swiss Exchange / NYSE',
    logoBg: 'bg-[#E60000]',
    logoTextColor: 'text-white',
    marketCap: 'CHF 98B ($115B)',
    currentPrice: 50.42,
    dayChangePercent: 1.85,
    description: 'The world unchallenged premier wealth manager, managing over $5.7T in total invested assets globally following the milestone Credit Suisse acquisition.'
  },
  SAN: {
    ticker: 'SAN',
    name: 'Banco Santander, S.A.',
    sector: 'European Financials',
    region: 'Europe',
    country: 'Spain',
    exchange: 'Bolsa de Madrid (SAN.MC) / NYSE',
    logoBg: 'bg-[#EC0000]',
    logoTextColor: 'text-white',
    marketCap: '€72B ($79B)',
    currentPrice: 14.40,
    dayChangePercent: 0.90,
    description: 'Eurozone top commercial bank by customer base, serving 168 million clients across core geographic hubs in Spain, Brazil, the UK, Mexico, and the US.'
  },
  BBVA: {
    ticker: 'BBVA',
    name: 'Banco Bilbao Vizcaya Argentaria, S.A.',
    sector: 'European Financials',
    region: 'Europe',
    country: 'Spain',
    exchange: 'Bolsa de Madrid (BBVA.MC) / NYSE',
    logoBg: 'bg-[#004481]',
    logoTextColor: 'text-white',
    marketCap: '€58B ($64B)',
    currentPrice: 28.10,
    dayChangePercent: 1.65,
    description: 'High-return international banking leader in Spain, Mexico, and Turkey, lauded for industry-topping ROE (~18%), digital sales, and capital generation.'
  },
  SX7P: {
    ticker: 'SX7P',
    name: 'STOXX Europe 600 Banks Index',
    sector: 'European Financials',
    region: 'Europe',
    country: 'Eurozone / UK / Switzerland',
    exchange: 'STOXX Benchmark / Euronext (BNK.PA / EXV1.DE)',
    logoBg: 'bg-[#002D62]',
    logoTextColor: 'text-sky-300',
    marketCap: '€1.2T (Aggregate Index)',
    currentPrice: 42.90,
    dayChangePercent: 1.25,
    description: 'Premier market capitalization-weighted benchmark tracking 44 leading financial institutions and banks across 17 European nations.'
  }
};

export const INITIAL_FINANCIAL_RESULTS: QuarterlyResult[] = [
  // U.S. BIG 6 BANKS
  {
    id: 'jpm-q3-2026',
    ticker: 'JPM',
    companyName: 'JPMorgan Chase & Co.',
    sector: 'U.S. Financials',
    region: 'US',
    country: 'United States',
    quarter: 'Q3 2026',
    fiscalYear: 2026,
    reportDate: '2026-10-14',
    reportTime: 'BMO',
    status: 'upcoming',
    currency: 'USD',
    epsEstimate: 4.82,
    epsActual: undefined,
    revenueEstimate: 43.8,
    revenueActual: undefined,
    isImportant: true,
    guidanceRating: 'raised',
    guidanceSummary: 'Management upgraded FY2026 Net Interest Income (NII) guidance to $92.5B on sticky deposit pricing and strong commercial credit demand.',
    keyHighlights: [
      'Rotated excess liquidity into resilient 3Y-5Y Treasury ladder locking in ~4.4% yield',
      'Investment Banking fee pipeline up 32% YoY across tech M&A and sponsor leveraged buyouts',
      'Maintained fortress CET1 ratio of 15.3% with $30B multi-year share buyback capacity'
    ],
    segments: [
      { name: 'Consumer & Community Banking', revenue: '$18.4B', growthYoY: '+6%', beatExpectation: true, notes: 'Record deposit franchise retention' },
      { name: 'Corporate & Investment Bank', revenue: '$16.2B', growthYoY: '+18%', beatExpectation: true, notes: 'Global markets and equity underwriting surge' },
      { name: 'Commercial Banking', revenue: '$4.1B', growthYoY: '+5%', beatExpectation: true, notes: 'Mid-cap credit utilization expanding' },
      { name: 'Asset & Wealth Management', revenue: '$5.4B', growthYoY: '+14%', beatExpectation: true, notes: 'Client AUM expanded to record $3.8T' }
    ],
    conferenceCallTime: '8:30 AM ET',
    analystOutlooks: [
      {
        bankName: 'Goldman Sachs',
        logoColor: '#7399C6',
        targetPrice: '$390.00',
        targetPriceNumeric: 390.00,
        timeHorizon: '12 Months',
        rating: 'Buy',
        nextQuarterEpsEst: '$4.95',
        nextQuarterRevEst: '$44.5B',
        thesis: 'Fortress balance sheet, peer-leading ROTCE (21%), and structural market share gains in advisory and trading cement JPM as the premier global banking franchise.',
        catalysts: ['Accelerating corporate M&A fee realization', 'Lower-than-guided deposit beta', 'Capital return accretion via buybacks'],
        lastUpdated: 'September 2026'
      },
      {
        bankName: 'Morgan Stanley',
        logoColor: '#002B49',
        targetPrice: '$375.00',
        targetPriceNumeric: 375.00,
        timeHorizon: '12 Months',
        rating: 'Overweight',
        nextQuarterEpsEst: '$4.88',
        nextQuarterRevEst: '$44.1B',
        thesis: 'Jamie Dimon execution consistency and superior cost-of-funds provide durable upside through any interest rate recalibration cycle.',
        catalysts: ['Rebounding debt underwriting', 'Strong credit card spending resilience', 'Commercial loan growth inflection'],
        lastUpdated: 'September 2026'
      }
    ]
  },
  {
    id: 'bac-q3-2026',
    ticker: 'BAC',
    companyName: 'Bank of America Corporation',
    sector: 'U.S. Financials',
    region: 'US',
    country: 'United States',
    quarter: 'Q3 2026',
    fiscalYear: 2026,
    reportDate: '2026-10-15',
    reportTime: 'BMO',
    status: 'upcoming',
    currency: 'USD',
    epsEstimate: 0.94,
    revenueEstimate: 26.4,
    isImportant: true,
    guidanceRating: 'maintained',
    guidanceSummary: 'Guided Q3/Q4 NII trajectory higher as low-yielding held-to-maturity securities roll off into 4.5%+ reinvestment yields.',
    keyHighlights: [
      'Held-to-maturity securities runoff releasing $10B+ quarterly for higher-yielding reinvestment',
      'Merrill Lynch wealth management client balances surpassed $3.4T',
      'Efficiency ratio improved 140 bps to 62.1%'
    ],
    segments: [
      { name: 'Consumer Banking', revenue: '$10.8B', growthYoY: '+4%', beatExpectation: true },
      { name: 'Global Wealth & Investment', revenue: '$5.8B', growthYoY: '+9%', beatExpectation: true },
      { name: 'Global Banking', revenue: '$6.1B', growthYoY: '+12%', beatExpectation: true },
      { name: 'Global Markets', revenue: '$4.8B', growthYoY: '+8%', beatExpectation: true }
    ],
    conferenceCallTime: '8:30 AM ET',
    analystOutlooks: [
      {
        bankName: 'Citi Research',
        logoColor: '#003B70',
        targetPrice: '$65.00',
        targetPriceNumeric: 65.00,
        timeHorizon: '12 Months',
        rating: 'Buy',
        nextQuarterEpsEst: '$0.98',
        nextQuarterRevEst: '$26.9B',
        thesis: 'BofA is the most asset-sensitive beneficiary of yield curve steepening. HTM paper runoff will power a multi-year NII acceleration.',
        catalysts: ['Securities portfolio duration rollover', 'Consumer credit normalization', 'Merrill advisor net new asset inflows'],
        lastUpdated: 'September 2026'
      },
      {
        bankName: 'Goldman Sachs',
        logoColor: '#7399C6',
        targetPrice: '$63.00',
        targetPriceNumeric: 63.00,
        timeHorizon: '12 Months',
        rating: 'Outperform',
        nextQuarterEpsEst: '$0.95',
        nextQuarterRevEst: '$26.6B',
        thesis: 'Digital banking scale and operating leverage will expand ROTCE towards 15.5%, narrowing the valuation discount to JPM.',
        catalysts: ['Digital customer adoption', 'Controlled non-interest expense growth', 'Dividend hike'],
        lastUpdated: 'September 2026'
      }
    ]
  },
  {
    id: 'c-q3-2026',
    ticker: 'C',
    companyName: 'Citigroup Inc.',
    sector: 'U.S. Financials',
    region: 'US',
    country: 'United States',
    quarter: 'Q3 2026',
    fiscalYear: 2026,
    reportDate: '2026-10-14',
    reportTime: 'BMO',
    status: 'upcoming',
    currency: 'USD',
    epsEstimate: 1.68,
    revenueEstimate: 20.8,
    isImportant: true,
    guidanceRating: 'raised',
    guidanceSummary: 'Jane Fraser transformation plan delivering quantifiable expense reductions; reaffirmed 11-12% medium-term RoTCE objective.',
    keyHighlights: [
      'Treasury and Trade Solutions (TTS) fee revenue grew 11% on multinational cross-border clearing',
      'Completed divestiture of 9 international consumer banking franchises, streamlining risk profile',
      'Tangible Book Value per share climbed to $92.40'
    ],
    segments: [
      { name: 'Services (TTS & Securities)', revenue: '$4.9B', growthYoY: '+10%', beatExpectation: true },
      { name: 'Markets', revenue: '$4.6B', growthYoY: '+8%', beatExpectation: true },
      { name: 'Banking (IB & Corporate)', revenue: '$1.7B', growthYoY: '+24%', beatExpectation: true },
      { name: 'U.S. Personal Banking', revenue: '$5.2B', growthYoY: '+5%', beatExpectation: false }
    ],
    conferenceCallTime: '11:00 AM ET',
    analystOutlooks: [
      {
        bankName: 'Morgan Stanley',
        logoColor: '#002B49',
        targetPrice: '$150.00',
        targetPriceNumeric: 150.00,
        timeHorizon: '12 Months',
        rating: 'Overweight',
        nextQuarterEpsEst: '$1.74',
        nextQuarterRevEst: '$21.2B',
        thesis: 'Citi trades at a significant discount to Tangible Book Value despite owning the unrivaled global cross-border payments moat (TTS). Turnaround milestones are bearing fruit.',
        catalysts: ['Operational simplicity unlocking capital return', 'Consent order remediation progress', 'TTS float margins'],
        lastUpdated: 'September 2026'
      }
    ]
  },
  {
    id: 'wfc-q3-2026',
    ticker: 'WFC',
    companyName: 'Wells Fargo & Company',
    sector: 'U.S. Financials',
    region: 'US',
    country: 'United States',
    quarter: 'Q3 2026',
    fiscalYear: 2026,
    reportDate: '2026-10-14',
    reportTime: 'BMO',
    status: 'upcoming',
    currency: 'USD',
    epsEstimate: 1.42,
    revenueEstimate: 21.2,
    isImportant: true,
    guidanceRating: 'maintained',
    guidanceSummary: 'Federal Reserve asset cap remediation in final stages; investment banking advisory buildout yielding early share gains.',
    keyHighlights: [
      'Credit card net spend volumes increased 14% powered by Autograph and Active Cash portfolios',
      'Commercial real estate office reserve coverage elevated to a conservative 10.8%',
      'Repurchased $3.5B of common stock in the prior quarter'
    ],
    segments: [
      { name: 'Consumer Banking & Lending', revenue: '$9.5B', growthYoY: '+3%', beatExpectation: true },
      { name: 'Commercial Banking', revenue: '$3.3B', growthYoY: '+4%', beatExpectation: true },
      { name: 'Corporate & Investment Banking', revenue: '$4.8B', growthYoY: '+15%', beatExpectation: true },
      { name: 'Wealth & Investment Management', revenue: '$3.8B', growthYoY: '+8%', beatExpectation: true }
    ],
    conferenceCallTime: '10:00 AM ET',
    analystOutlooks: [
      {
        bankName: 'JPMorgan Equity Research',
        logoColor: '#002D62',
        targetPrice: '$98.00',
        targetPriceNumeric: 98.00,
        timeHorizon: '12 Months',
        rating: 'Overweight',
        nextQuarterEpsEst: '$1.48',
        nextQuarterRevEst: '$21.5B',
        thesis: 'Asset cap lifting remains the biggest organic multiple expansion catalyst across large-cap US banks, unlocking pent-up commercial balance sheet expansion.',
        catalysts: ['Fed asset cap resolution timeline', 'Expense run-rate discipline', 'Share buyback acceleration'],
        lastUpdated: 'September 2026'
      }
    ]
  },
  {
    id: 'ms-q3-2026',
    ticker: 'MS',
    companyName: 'Morgan Stanley',
    sector: 'U.S. Financials',
    region: 'US',
    country: 'United States',
    quarter: 'Q3 2026',
    fiscalYear: 2026,
    reportDate: '2026-10-16',
    reportTime: 'BMO',
    status: 'upcoming',
    currency: 'USD',
    epsEstimate: 2.15,
    revenueEstimate: 16.5,
    isImportant: true,
    guidanceRating: 'raised',
    guidanceSummary: 'Reaffirmed long-term target of $10T in client assets; Wealth Management pre-tax margins on track to exceed 28%.',
    keyHighlights: [
      'Net new client assets hit $75B in Wealth Management during previous quarter',
      'Equity sales and trading delivered best performance in 3 years',
      'Advisory backlog at cyclical highs driven by healthcare and technology sponsor activity'
    ],
    segments: [
      { name: 'Wealth Management', revenue: '$7.8B', growthYoY: '+11%', beatExpectation: true },
      { name: 'Institutional Securities', revenue: '$7.2B', growthYoY: '+16%', beatExpectation: true },
      { name: 'Investment Management', revenue: '$1.6B', growthYoY: '+9%', beatExpectation: true }
    ],
    conferenceCallTime: '9:30 AM ET',
    analystOutlooks: [
      {
        bankName: 'Goldman Sachs',
        logoColor: '#7399C6',
        targetPrice: '$225.00',
        targetPriceNumeric: 225.00,
        timeHorizon: '12 Months',
        rating: 'Buy',
        nextQuarterEpsEst: '$2.22',
        nextQuarterRevEst: '$16.9B',
        thesis: 'Morgan Stanley stands apart as a high-margin compounding machine. Wealth and Asset Management generate 55%+ of firm revenues with low capital intensity.',
        catalysts: ['Advisory and equity underwriting rebound', 'Net new asset acceleration', 'Higher wealth sweep deposit yield capture'],
        lastUpdated: 'September 2026'
      }
    ]
  },
  {
    id: 'gs-q3-2026',
    ticker: 'GS',
    companyName: 'Goldman Sachs Group, Inc.',
    sector: 'U.S. Financials',
    region: 'US',
    country: 'United States',
    quarter: 'Q3 2026',
    fiscalYear: 2026,
    reportDate: '2026-10-15',
    reportTime: 'BMO',
    status: 'upcoming',
    currency: 'USD',
    epsEstimate: 10.45,
    revenueEstimate: 13.9,
    isImportant: true,
    guidanceRating: 'raised',
    guidanceSummary: 'Leadership confirmed strategic focus returned 100% to core strengths: Global Banking & Markets and Asset & Wealth Management.',
    keyHighlights: [
      'Investment Banking fees surged 28% YoY, capturing #1 worldwide league table ranking in announced M&A',
      'FICC Financing and Equities Financing revenue set consecutive all-time records',
      'Alternative asset fundraising exceeded $60B year-to-date across private credit and real estate'
    ],
    segments: [
      { name: 'Global Banking & Markets', revenue: '$9.4B', growthYoY: '+21%', beatExpectation: true },
      { name: 'Asset & Wealth Management', revenue: '$4.1B', growthYoY: '+17%', beatExpectation: true },
      { name: 'Platform Solutions', revenue: '$0.55B', growthYoY: '-12%', beatExpectation: false }
    ],
    conferenceCallTime: '9:30 AM ET',
    analystOutlooks: [
      {
        bankName: 'Morgan Stanley',
        logoColor: '#002B49',
        targetPrice: '$1,050.00',
        targetPriceNumeric: 1050.00,
        timeHorizon: '12 Months',
        rating: 'Overweight',
        nextQuarterEpsEst: '$10.85',
        nextQuarterRevEst: '$14.3B',
        thesis: 'Goldman Sachs is the pure-play beneficiary of the global capital markets recovery. Strategic divestment of consumer experiments leaves a leaner, 16%+ ROE machine.',
        catalysts: ['Sponsor dealmaking monetization', 'Financing revenue stability', 'Asset management management-fee compounding'],
        lastUpdated: 'September 2026'
      }
    ]
  },

  // U.S. ALTERNATIVE INVESTMENT MANAGERS
  {
    id: 'bx-q3-2026',
    ticker: 'BX',
    companyName: 'Blackstone Inc.',
    sector: 'U.S. Financials',
    region: 'US',
    country: 'United States',
    quarter: 'Q3 2026',
    fiscalYear: 2026,
    reportDate: '2026-10-22',
    reportTime: 'BMO',
    status: 'upcoming',
    currency: 'USD',
    epsEstimate: 1.28,
    revenueEstimate: 3.10,
    isImportant: true,
    guidanceRating: 'raised',
    guidanceSummary: 'AUM reached $1.15T; fee-related earnings (FRE) guided to record levels on the back of European credit and infrastructure capital deployment.',
    keyHighlights: [
      'Fee-Related Earnings (FRE) grew 19% YoY to $1.35B on permanent capital stability',
      'Real estate transaction volumes inflecting higher with data center infrastructure leading returns',
      'Total dry powder of $185B positioned to capitalize on corporate balance sheet recaps'
    ],
    segments: [
      { name: 'Credit & Insurance', revenue: '$1.15B', growthYoY: '+26%', beatExpectation: true },
      { name: 'Real Estate', revenue: '$1.05B', growthYoY: '+12%', beatExpectation: true },
      { name: 'Private Equity', revenue: '$0.68B', growthYoY: '+15%', beatExpectation: true },
      { name: 'Multi-Asset & Infrastructure', revenue: '$0.32B', growthYoY: '+22%', beatExpectation: true }
    ],
    conferenceCallTime: '9:00 AM ET',
    analystOutlooks: [
      {
        bankName: 'JPMorgan Equity Research',
        logoColor: '#002D62',
        targetPrice: '$142.00',
        targetPriceNumeric: 142.00,
        timeHorizon: '12 Months',
        rating: 'Overweight',
        nextQuarterEpsEst: '$1.34',
        nextQuarterRevEst: '$3.25B',
        thesis: 'Unmatched brand equity, wealth channel distribution leadership (BXPE and BCRED), and data center AI compute infrastructure ownership position BX for superior FRE multiples.',
        catalysts: ['Q3/Q4 realizations and performance fee pickup', 'BREIT redemptions fully normalized', 'Private wealth product expansion'],
        lastUpdated: 'September 2026'
      }
    ]
  },
  {
    id: 'kkr-q3-2026',
    ticker: 'KKR',
    companyName: 'KKR & Co. Inc.',
    sector: 'U.S. Financials',
    region: 'US',
    country: 'United States',
    quarter: 'Q3 2026',
    fiscalYear: 2026,
    reportDate: '2026-10-29',
    reportTime: 'BMO',
    status: 'upcoming',
    currency: 'USD',
    epsEstimate: 1.15,
    revenueEstimate: 1.45,
    isImportant: true,
    guidanceRating: 'raised',
    guidanceSummary: 'Reiterated path to $1T+ in AUM and $7.00+ adjusted net income per share by 2028, supported by Global Atlantic insurance compounding.',
    keyHighlights: [
      'Global Atlantic insurance assets under management topped $195B',
      'Asia private equity and global infrastructure funds delivering top-quartile performance',
      'Capital Markets transaction revenue accelerated 35% on syndicated buyout debt'
    ],
    segments: [
      { name: 'Asset Management FRE', revenue: '$0.85B', growthYoY: '+22%', beatExpectation: true },
      { name: 'Insurance (Global Atlantic)', revenue: '$0.42B', growthYoY: '+28%', beatExpectation: true },
      { name: 'Capital Markets Fees', revenue: '$0.22B', growthYoY: '+35%', beatExpectation: true }
    ],
    conferenceCallTime: '10:00 AM ET',
    analystOutlooks: [
      {
        bankName: 'Morgan Stanley',
        logoColor: '#002B49',
        targetPrice: '$115.00',
        targetPriceNumeric: 115.00,
        timeHorizon: '12 Months',
        rating: 'Overweight',
        nextQuarterEpsEst: '$1.21',
        nextQuarterRevEst: '$1.52B',
        thesis: 'KKR possesses the most potent operating leverage among alternative asset managers due to its in-house capital markets syndication desk and Global Atlantic annuity spread capture.',
        catalysts: ['Capital Markets fee inflection', 'S&P 500 index inclusion liquidity', 'Global infrastructure fund closing'],
        lastUpdated: 'September 2026'
      }
    ]
  },
  {
    id: 'apo-q3-2026',
    ticker: 'APO',
    companyName: 'Apollo Global Management, Inc.',
    sector: 'U.S. Financials',
    region: 'US',
    country: 'United States',
    quarter: 'Q3 2026',
    fiscalYear: 2026,
    reportDate: '2026-11-04',
    reportTime: 'BMO',
    status: 'upcoming',
    currency: 'USD',
    epsEstimate: 2.10,
    revenueEstimate: 1.25,
    isImportant: true,
    guidanceRating: 'raised',
    guidanceSummary: 'Marc Rowan reiterated plan to achieve $100B in annual debt origination across investment-grade private credit and clean energy transition financing.',
    keyHighlights: [
      'Athene gross organic annuity inflows surged to record $18B in the quarter',
      'Private credit origination volume reached $35B across 16 origination platforms',
      'Fee-Related Earnings margin maintained at an industry-leading 56%'
    ],
    segments: [
      { name: 'Fee-Related Earnings (FRE)', revenue: '$0.62B', growthYoY: '+24%', beatExpectation: true },
      { name: 'Spread-Related Earnings (Athene)', revenue: '$0.58B', growthYoY: '+19%', beatExpectation: true },
      { name: 'Principal Investing', revenue: '$0.12B', growthYoY: '+10%', beatExpectation: false }
    ],
    conferenceCallTime: '8:30 AM ET',
    analystOutlooks: [
      {
        bankName: 'Citi Research',
        logoColor: '#003B70',
        targetPrice: '$148.00',
        targetPriceNumeric: 148.00,
        timeHorizon: '12 Months',
        rating: 'Buy',
        nextQuarterEpsEst: '$2.18',
        nextQuarterRevEst: '$1.32B',
        thesis: 'Apollo is structurally reinventing fixed income asset management through Athene. Its investment-grade origination engine provides a non-correlated yield spread that banks cannot match.',
        catalysts: ['Athene retirement asset inflows', 'Corporate hybrid financing design wins', 'Capital return'],
        lastUpdated: 'September 2026'
      }
    ]
  },
  {
    id: 'ares-q3-2026',
    ticker: 'ARES',
    companyName: 'Ares Management Corporation',
    sector: 'U.S. Financials',
    region: 'US',
    country: 'United States',
    quarter: 'Q3 2026',
    fiscalYear: 2026,
    reportDate: '2026-10-30',
    reportTime: 'BMO',
    status: 'upcoming',
    currency: 'USD',
    epsEstimate: 1.22,
    revenueEstimate: 1.10,
    isImportant: true,
    guidanceRating: 'raised',
    guidanceSummary: 'AUM reached $465B; direct lending default rates remain near historical lows at 0.7% while base rates sustain elevated net interest spreads.',
    keyHighlights: [
      'Global Credit group deployed $22B across senior secured middle-market loans',
      'European direct lending platform consolidated #1 market share ranking',
      'Raised $18B in gross new capital with over 85% in perpetual or long-dated funds'
    ],
    segments: [
      { name: 'Credit Group', revenue: '$0.84B', growthYoY: '+21%', beatExpectation: true },
      { name: 'Real Estate & Infrastructure', revenue: '$0.16B', growthYoY: '+14%', beatExpectation: true },
      { name: 'Private Equity & Secondaries', revenue: '$0.12B', growthYoY: '+18%', beatExpectation: true }
    ],
    conferenceCallTime: '10:00 AM ET',
    analystOutlooks: [
      {
        bankName: 'Barclays Research',
        logoColor: '#00AEEF',
        targetPrice: '$145.00',
        targetPriceNumeric: 145.00,
        timeHorizon: '12 Months',
        rating: 'Overweight',
        nextQuarterEpsEst: '$1.28',
        nextQuarterRevEst: '$1.15B',
        thesis: 'Ares is the purest vehicle to gain exposure to secular growth in private direct lending. Its senior secured underwriting record and sticky European presence justify a premium valuation.',
        catalysts: ['Private credit fund closes', 'Low non-accrual credit metrics', 'Dividend increase'],
        lastUpdated: 'September 2026'
      }
    ]
  },

  // EUROPEAN FINANCIALS
  {
    id: 'bcs-q3-2026',
    ticker: 'BCS',
    companyName: 'Barclays PLC',
    sector: 'European Financials',
    region: 'Europe',
    country: 'United Kingdom',
    quarter: 'Q3 2026',
    fiscalYear: 2026,
    reportDate: '2026-10-23',
    reportTime: 'BMO',
    status: 'upcoming',
    currency: 'GBP',
    epsEstimate: 0.24,
    revenueEstimate: 6.8,
    isImportant: true,
    guidanceRating: 'raised',
    guidanceSummary: 'Reaffirmed RoTE target of >12% by 2026; structured capital return of £10B+ across 2024-2026 underway.',
    keyHighlights: [
      'Barclays UK structural interest rate hedge delivering sequential gross margin expansion',
      'Investment bank risk-weighted assets (RWA) reduction progressing ahead of plan',
      'Acquisition of Tesco Bank retail banking operations completed smoothly'
    ],
    segments: [
      { name: 'Barclays UK', revenue: '£2.1B', growthYoY: '+5%', beatExpectation: true },
      { name: 'Barclays Investment Bank', revenue: '£2.9B', growthYoY: '+14%', beatExpectation: true },
      { name: 'Barclays US Consumer Bank', revenue: '£0.95B', growthYoY: '+4%', beatExpectation: false },
      { name: 'Barclays Private & Wealth', revenue: '£0.85B', growthYoY: '+9%', beatExpectation: true }
    ],
    conferenceCallTime: '8:30 AM BST',
    analystOutlooks: [
      {
        bankName: 'Goldman Sachs',
        logoColor: '#7399C6',
        targetPrice: '$32.00 (520p)',
        targetPriceNumeric: 32.00,
        timeHorizon: '12 Months',
        rating: 'Buy',
        nextQuarterEpsEst: '£0.26',
        nextQuarterRevEst: '£7.0B',
        thesis: 'Barclays structural rate hedge rollout provides clear multi-year earnings visibility, while its disciplined capital return program yields ~11% total payout.',
        catalysts: ['UK structural hedge reinvestment tailwind', 'FICC market share stabilization', 'Ongoing share repurchases'],
        lastUpdated: 'September 2026'
      }
    ]
  },
  {
    id: 'hsbc-q3-2026',
    ticker: 'HSBC',
    companyName: 'HSBC Holdings plc',
    sector: 'European Financials',
    region: 'Europe',
    country: 'United Kingdom / Hong Kong',
    quarter: 'Q3 2026',
    fiscalYear: 2026,
    reportDate: '2026-10-28',
    reportTime: 'BMO',
    status: 'upcoming',
    currency: 'USD',
    epsEstimate: 1.88,
    revenueEstimate: 16.2,
    isImportant: true,
    guidanceRating: 'raised',
    guidanceSummary: 'Upgraded banking NII guidance to $43B+ for FY2026; confirmed mid-teens RoTE target backed by Hong Kong and UK trade corridors.',
    keyHighlights: [
      'Wealth and Personal Banking profits in Asia up 24% YoY driven by international wealth deposits',
      'Completed sale of Canadian and Argentine subsidiaries, triggering special dividend payouts',
      'CET1 ratio remained superior at 15.0%'
    ],
    segments: [
      { name: 'Wealth and Personal Banking', revenue: '$7.4B', growthYoY: '+12%', beatExpectation: true },
      { name: 'Commercial Banking', revenue: '$5.2B', growthYoY: '+6%', beatExpectation: true },
      { name: 'Global Banking and Markets', revenue: '$3.8B', growthYoY: '+10%', beatExpectation: true }
    ],
    conferenceCallTime: '8:00 AM BST',
    analystOutlooks: [
      {
        bankName: 'UBS Investment Bank',
        logoColor: '#E60000',
        targetPrice: '$118.00 (780p)',
        targetPriceNumeric: 118.00,
        timeHorizon: '12 Months',
        rating: 'Buy',
        nextQuarterEpsEst: '$1.94',
        nextQuarterRevEst: '$16.6B',
        thesis: 'HSBC offers the highest dividend yield and share buyback total distribution yield in global mega-cap banking (~12%), supported by deep Hong Kong CASA deposit moats.',
        catalysts: ['Asian wealth fee compounding', 'Special dividend distributions', 'Net interest margin resilience'],
        lastUpdated: 'September 2026'
      }
    ]
  },
  {
    id: 'abn-q3-2026',
    ticker: 'ABN',
    companyName: 'ABN AMRO Bank N.V.',
    sector: 'European Financials',
    region: 'Europe',
    country: 'Netherlands',
    quarter: 'Q3 2026',
    fiscalYear: 2026,
    reportDate: '2026-11-11',
    reportTime: 'BMO',
    status: 'upcoming',
    currency: 'EUR',
    epsEstimate: 0.95,
    revenueEstimate: 2.25,
    isImportant: false,
    guidanceRating: 'maintained',
    guidanceSummary: 'Management confirmed strong Dutch residential mortgage demand; Dutch state reduced stake responsibly into open market buybacks.',
    keyHighlights: [
      'Dutch retail mortgage margins stabilized with market share held at 22%',
      'CET1 capital ratio stands at a commanding 15.8%, well above regulatory requirements',
      'Non-performing loan ratio at an exceptionally clean 1.3%'
    ],
    segments: [
      { name: 'Personal & Business Banking', revenue: '€1.15B', growthYoY: '+4%', beatExpectation: true },
      { name: 'Wealth Management', revenue: '€0.45B', growthYoY: '+8%', beatExpectation: true },
      { name: 'Corporate Banking', revenue: '€0.65B', growthYoY: '+3%', beatExpectation: false }
    ],
    conferenceCallTime: '9:00 AM CET',
    analystOutlooks: [
      {
        bankName: 'Kepler Cheuvreux',
        logoColor: '#002D62',
        targetPrice: '€50.00',
        targetPriceNumeric: 50.00,
        timeHorizon: '12 Months',
        rating: 'Buy',
        nextQuarterEpsEst: '€0.98',
        nextQuarterRevEst: '€2.30B',
        thesis: 'ABN AMRO is one of Europe most overcapitalized banks. Excess capital above 13.5% CET1 provides headroom for massive recurring share repurchases.',
        catalysts: ['Dutch government sell-down absorbed smoothly', 'Substantial buyback tranches', 'Mortgage loan margin uptick'],
        lastUpdated: 'September 2026'
      }
    ]
  },
  {
    id: 'ing-q3-2026',
    ticker: 'ING',
    companyName: 'ING Groep N.V.',
    sector: 'European Financials',
    region: 'Europe',
    country: 'Netherlands',
    quarter: 'Q3 2026',
    fiscalYear: 2026,
    reportDate: '2026-10-31',
    reportTime: 'BMO',
    status: 'upcoming',
    currency: 'EUR',
    epsEstimate: 0.62,
    revenueEstimate: 5.75,
    isImportant: true,
    guidanceRating: 'raised',
    guidanceSummary: 'CEO Steven van Rijswijk raised total income target; digital retail customer additions in Germany and Spain accelerating fee momentum.',
    keyHighlights: [
      'Fee income surged 14% YoY across retail investment products and payments',
      'Wholesale Banking lending growth up 7% driven by European energy transition infrastructure',
      'Delivered RoE of 14.8% alongside a €2.5B share buyback program'
    ],
    segments: [
      { name: 'Retail Netherlands & Belgium', revenue: '€2.55B', growthYoY: '+5%', beatExpectation: true },
      { name: 'Retail Germany & Challengers', revenue: '€1.65B', growthYoY: '+12%', beatExpectation: true },
      { name: 'Wholesale Banking', revenue: '€1.55B', growthYoY: '+9%', beatExpectation: true }
    ],
    conferenceCallTime: '9:00 AM CET',
    analystOutlooks: [
      {
        bankName: 'BNP Paribas Exane',
        logoColor: '#00915A',
        targetPrice: '€42.00',
        targetPriceNumeric: 42.00,
        timeHorizon: '12 Months',
        rating: 'Outperform',
        nextQuarterEpsEst: '€0.65',
        nextQuarterRevEst: '€5.85B',
        thesis: 'ING pan-European digital retail model produces the lowest cost-to-income ratio among major European peers (~51%), driving industry-leading free cash flow generation.',
        catalysts: ['Accelerating non-interest fee growth', 'Wholesale banking syndicated loan margins', 'Capital return yield >10%'],
        lastUpdated: 'September 2026'
      }
    ]
  },
  {
    id: 'rabo-q3-2026',
    ticker: 'RABO',
    companyName: 'Coöperatieve Rabobank U.A.',
    sector: 'European Financials',
    region: 'Europe',
    country: 'Netherlands',
    quarter: 'Q3 2026',
    fiscalYear: 2026,
    reportDate: '2026-11-19',
    reportTime: 'BMO',
    status: 'upcoming',
    currency: 'EUR',
    epsEstimate: 2.85,
    revenueEstimate: 3.45,
    isImportant: false,
    guidanceRating: 'maintained',
    guidanceSummary: 'Cooperative model maintained robust capital generation; Rabobank Member Certificates distributions confirmed at standard benchmark yield corridor.',
    keyHighlights: [
      'Global Food & Agri loan portfolio expanded to €118B across sustainable agribusiness clients',
      'Dutch domestic mortgage book performed solidly with minimal credit loss provisions',
      'Common Equity Tier 1 (CET1) ratio at an exemplary 16.5%'
    ],
    segments: [
      { name: 'Domestic Retail Banking', revenue: '€1.95B', growthYoY: '+4%', beatExpectation: true },
      { name: 'Wholesale & Rural (Food & Agri)', revenue: '€1.25B', growthYoY: '+7%', beatExpectation: true },
      { name: 'Leasing & Vendor Finance (DLL)', revenue: '€0.35B', growthYoY: '+5%', beatExpectation: true }
    ],
    conferenceCallTime: '10:00 AM CET',
    analystOutlooks: [
      {
        bankName: 'ING Financial Markets',
        logoColor: '#FF6200',
        targetPrice: '€116.00',
        targetPriceNumeric: 116.00,
        timeHorizon: '12 Months',
        rating: 'Buy',
        nextQuarterEpsEst: '€2.90',
        nextQuarterRevEst: '€3.50B',
        thesis: 'Rabobank Member Certificates offer one of Europe safest fixed-income-like coupon yield profiles (~6.5%), anchored by triple-A domestic mortgage and sovereign risk buffers.',
        catalysts: ['Resilient Dutch employment and house prices', 'Agri commodity price recovery', 'High cooperative capital retention'],
        lastUpdated: 'September 2026'
      }
    ]
  },
  {
    id: 'bnp-q3-2026',
    ticker: 'BNP',
    companyName: 'BNP Paribas S.A.',
    sector: 'European Financials',
    region: 'Europe',
    country: 'France',
    quarter: 'Q3 2026',
    fiscalYear: 2026,
    reportDate: '2026-10-30',
    reportTime: 'BMO',
    status: 'upcoming',
    currency: 'EUR',
    epsEstimate: 2.72,
    revenueEstimate: 12.8,
    isImportant: true,
    guidanceRating: 'raised',
    guidanceSummary: 'Upgraded 2026 net income expectation above €11.5B; CIB market share gains in equities and cross-asset financing offsetting European rate normalization.',
    keyHighlights: [
      'Global Markets revenue surged 16% on European equity and prime brokerage leadership',
      'Deployment of proceeds from Bank of the West sale generating superior organic RoTE',
      'Cost-to-income ratio reduced to 59.2%'
    ],
    segments: [
      { name: 'Corporate & Institutional Banking (CIB)', revenue: '€4.4B', growthYoY: '+15%', beatExpectation: true },
      { name: 'Commercial & Personal Banking Europe', revenue: '€4.2B', growthYoY: '+4%', beatExpectation: true },
      { name: 'Investment & Protection Services', revenue: '€1.6B', growthYoY: '+8%', beatExpectation: true },
      { name: 'Specialised Businesses (Arval/Leasing)', revenue: '€2.6B', growthYoY: '+6%', beatExpectation: true }
    ],
    conferenceCallTime: '8:30 AM CET',
    analystOutlooks: [
      {
        bankName: 'JPMorgan Equity Research',
        logoColor: '#002D62',
        targetPrice: '€120.00',
        targetPriceNumeric: 120.00,
        timeHorizon: '12 Months',
        rating: 'Overweight',
        nextQuarterEpsEst: '€2.80',
        nextQuarterRevEst: '€13.1B',
        thesis: 'BNP Paribas is undisputed as the "JPMorgan of Europe" — combining the scale, diversified CIB leadership, and capital strength to take share from retrenching rivals.',
        catalysts: ['European equity derivatives and prime services share gains', 'Arval fleet mobility margins', 'Disciplined buybacks'],
        lastUpdated: 'September 2026'
      }
    ]
  },
  {
    id: 'gle-q3-2026',
    ticker: 'GLE',
    companyName: 'Société Générale S.A.',
    sector: 'European Financials',
    region: 'Europe',
    country: 'France',
    quarter: 'Q3 2026',
    fiscalYear: 2026,
    reportDate: '2026-10-31',
    reportTime: 'BMO',
    status: 'upcoming',
    currency: 'EUR',
    epsEstimate: 1.48,
    revenueEstimate: 6.6,
    isImportant: true,
    guidanceRating: 'maintained',
    guidanceSummary: 'CEO Slawomir Krupa strategic plan on schedule; non-core asset sales completed and French retail NII inflection accelerating.',
    keyHighlights: [
      'Global Banking and Advisory equity derivatives revenue expanded 18% YoY',
      'BoursoBank digital client base crossed 6.5 million customers with profitability ramping',
      'CET1 ratio strengthened to 13.4%'
    ],
    segments: [
      { name: 'Global Banking & Investor Solutions', revenue: '€2.65B', growthYoY: '+12%', beatExpectation: true },
      { name: 'French Retail, Private & BoursoBank', revenue: '€2.25B', growthYoY: '+7%', beatExpectation: true },
      { name: 'International Retail & Mobility', revenue: '€1.70B', growthYoY: '+4%', beatExpectation: false }
    ],
    conferenceCallTime: '9:00 AM CET',
    analystOutlooks: [
      {
        bankName: 'Barclays Research',
        logoColor: '#00AEEF',
        targetPrice: '€88.00',
        targetPriceNumeric: 88.00,
        timeHorizon: '12 Months',
        rating: 'Overweight',
        nextQuarterEpsEst: '€1.55',
        nextQuarterRevEst: '€6.8B',
        thesis: 'SocGen is executing on its transformation roadmap with substantial cost rationalization and French retail margin recovery. Trades at an attractive multiple discount.',
        catalysts: ['French retail NII recovery inflection', 'BoursoBank fee monetization', 'Capital distribution clarity'],
        lastUpdated: 'September 2026'
      }
    ]
  },
  {
    id: 'ubs-q3-2026',
    ticker: 'UBS',
    companyName: 'UBS Group AG',
    sector: 'European Financials',
    region: 'Europe',
    country: 'Switzerland',
    quarter: 'Q3 2026',
    fiscalYear: 2026,
    reportDate: '2026-10-29',
    reportTime: 'BMO',
    status: 'upcoming',
    currency: 'USD',
    epsEstimate: 0.68,
    revenueEstimate: 12.2,
    isImportant: true,
    guidanceRating: 'raised',
    guidanceSummary: 'Integration of Credit Suisse ahead of schedule; gross cost reduction target of $13B by end of 2026 fully on track.',
    keyHighlights: [
      'Global Wealth Management net new assets hit $28B in the quarter',
      'Non-Core and Legacy (NCL) risk-weighted assets reduced by another $6B',
      'Swiss retail and corporate banking market share consolidated at #1'
    ],
    segments: [
      { name: 'Global Wealth Management', revenue: '€6.2B', growthYoY: '+15%', beatExpectation: true },
      { name: 'Investment Bank', revenue: '€2.6B', growthYoY: '+22%', beatExpectation: true },
      { name: 'Personal & Corporate Banking', revenue: '€2.1B', growthYoY: '+5%', beatExpectation: true },
      { name: 'Asset Management', revenue: '€0.85B', growthYoY: '+8%', beatExpectation: true }
    ],
    conferenceCallTime: '9:00 AM CEST',
    analystOutlooks: [
      {
        bankName: 'Morgan Stanley',
        logoColor: '#002B49',
        targetPrice: '$60.00 (CHF 52.00)',
        targetPriceNumeric: 60.00,
        timeHorizon: '12 Months',
        rating: 'Overweight',
        nextQuarterEpsEst: '$0.74',
        nextQuarterRevEst: '$12.6B',
        thesis: 'UBS stands as an unrivaled global wealth management juggernaut. Credit Suisse cost synergy extraction will generate extraordinary capital return flexibility by 2026-2027.',
        catalysts: ['Accelerated CS IT migration milestones', 'Resumption of aggressive share buybacks', 'Americas wealth margin expansion'],
        lastUpdated: 'September 2026'
      }
    ]
  },
  {
    id: 'san-q3-2026',
    ticker: 'SAN',
    companyName: 'Banco Santander, S.A.',
    sector: 'European Financials',
    region: 'Europe',
    country: 'Spain',
    quarter: 'Q3 2026',
    fiscalYear: 2026,
    reportDate: '2026-10-28',
    reportTime: 'BMO',
    status: 'upcoming',
    currency: 'EUR',
    epsEstimate: 0.22,
    revenueEstimate: 15.6,
    isImportant: true,
    guidanceRating: 'raised',
    guidanceSummary: 'Chair Ana Botín raised FY2026 RoTE target to >16%; global retail customer numbers grew by 5 million over the past 12 months.',
    keyHighlights: [
      'Net interest income in Spain and Europe rose 8% on efficient retail deposit pricing',
      'Digital consumer bank Openbank expanded footprint into the United States and Mexico',
      'Committed 50% of underlying profit to dividends and ongoing share repurchases'
    ],
    segments: [
      { name: 'Retail & Commercial (Europe)', revenue: '€6.4B', growthYoY: '+7%', beatExpectation: true },
      { name: 'Retail & Commercial (Americas)', revenue: '€5.2B', growthYoY: '+9%', beatExpectation: true },
      { name: 'Corporate & Investment Bank (CIB)', revenue: '€2.4B', growthYoY: '+16%', beatExpectation: true },
      { name: 'Wealth Management & Insurance', revenue: '€1.1B', growthYoY: '+12%', beatExpectation: true }
    ],
    conferenceCallTime: '10:00 AM CET',
    analystOutlooks: [
      {
        bankName: 'Citi Research',
        logoColor: '#003B70',
        targetPrice: '$17.50 (€5.50)',
        targetPriceNumeric: 17.50,
        timeHorizon: '12 Months',
        rating: 'Buy',
        nextQuarterEpsEst: '€0.24',
        nextQuarterRevEst: '€15.9B',
        thesis: 'Santander structural diversification across Europe and Latin America generates high RoTE resilience. Openbank US rollout unlocks low-cost consumer deposits for its auto business.',
        catalysts: ['Latin American loan growth recovery', 'Openbank US deposit growth', 'Share buyback yield >10%'],
        lastUpdated: 'September 2026'
      }
    ]
  },
  {
    id: 'bbva-q3-2026',
    ticker: 'BBVA',
    companyName: 'Banco Bilbao Vizcaya Argentaria, S.A.',
    sector: 'European Financials',
    region: 'Europe',
    country: 'Spain',
    quarter: 'Q3 2026',
    fiscalYear: 2026,
    reportDate: '2026-10-30',
    reportTime: 'BMO',
    status: 'upcoming',
    currency: 'EUR',
    epsEstimate: 0.44,
    revenueEstimate: 8.8,
    isImportant: true,
    guidanceRating: 'raised',
    guidanceSummary: 'Record performance across Mexico and Spain; reaffirmed sector-high RoTE target of ~19% with strong organic capital accumulation.',
    keyHighlights: [
      'BBVA Mexico franchise delivered 35%+ return on equity with credit demand surging',
      'Spanish domestic banking revenues up 14% on solid consumer credit and insurance cross-sell',
      'CET1 ratio maintained at 12.8% post-dividend accrual'
    ],
    segments: [
      { name: 'BBVA Mexico', revenue: '€4.2B', growthYoY: '+14%', beatExpectation: true },
      { name: 'BBVA Spain', revenue: '€2.7B', growthYoY: '+12%', beatExpectation: true },
      { name: 'Turkey (Garanti BBVA)', revenue: '€1.1B', growthYoY: '+8%', beatExpectation: true },
      { name: 'South America', revenue: '€0.8B', growthYoY: '+6%', beatExpectation: false }
    ],
    conferenceCallTime: '9:30 AM CET',
    analystOutlooks: [
      {
        bankName: 'Goldman Sachs',
        logoColor: '#7399C6',
        targetPrice: '$33.00 (€11.50)',
        targetPriceNumeric: 33.00,
        timeHorizon: '12 Months',
        rating: 'Buy',
        nextQuarterEpsEst: '€0.47',
        nextQuarterRevEst: '€9.1B',
        thesis: 'BBVA boasts the highest return on tangible equity (RoTE ~19%) in European banking, powered by its market-dominant Mexican banking jewel and superior digital acquisition efficiency.',
        catalysts: ['Nearshoring investment tailwinds in Mexico', 'Solid Spanish credit margins', 'Special capital return payouts'],
        lastUpdated: 'September 2026'
      }
    ]
  },
  {
    id: 'sx7p-benchmark-2026',
    ticker: 'SX7P',
    companyName: 'STOXX Europe 600 Banks Index',
    sector: 'European Financials',
    region: 'Europe',
    country: 'Eurozone / UK / Switzerland',
    quarter: 'Macro Q3 2026',
    fiscalYear: 2026,
    reportDate: '2026-10-20',
    reportTime: 'BMO',
    status: 'upcoming',
    currency: 'EUR',
    epsEstimate: 0.00,
    revenueEstimate: 0.00,
    isImportant: true,
    isBankingIndex: true,
    guidanceRating: 'maintained',
    guidanceSummary: 'Benchmark Index Consensus: 44 constituent banks average 7.6x forward P/E, 6.7% dividend yield, and record average CET1 solvency ratio of 15.6%.',
    keyHighlights: [
      'Tracks 44 leading European financial institutions across the Eurozone, UK, Switzerland, and Nordics',
      'Average constituent return on tangible equity (RoTE) sustained at 13.8%',
      'Consensus structural rate hedge rollover shielding European banks from early rate cuts'
    ],
    segments: [
      { name: 'Eurozone Megabanks (BNP, SAN, ING, BBVA)', revenue: '€48.5B agg', growthYoY: '+8%', beatExpectation: true },
      { name: 'UK & Swiss Leaders (HSBC, Barclays, UBS)', revenue: '€38.2B agg', growthYoY: '+11%', beatExpectation: true },
      { name: 'Nordic & Regional Banks', revenue: '€16.8B agg', growthYoY: '+5%', beatExpectation: true }
    ],
    conferenceCallTime: 'Daily Frankfurt Fixing 18:00 CET',
    // Note: STOXX Europe 600 Banks Index is explicitly excluded from individual single-stock analyst bank outlooks per user instructions
    analystOutlooks: undefined
  }
];
