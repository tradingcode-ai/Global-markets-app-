export interface SectorIndexItem {
  id: string;
  name: string;
  gicsCode: string;
  symbol: string;           // e.g. '^SP500-45'
  yahooSymbol: string;      // e.g. '^SP500-45' or '^GSPE'
  benchmarkEtf: string;     // e.g. 'XLK'
  benchmarkEtfName: string; // e.g. 'Technology Select Sector SPDR Fund'
  weightPercent: number;    // Weight in S&P 500 (~31.8%)
  constituentsCount: number;
  peRatio: number;
  dividendYield: number;
  description: string;
  mandate: string;
  inceptionDate: string;
  weightingMethodology: string;
  assetClass: 'Index';
  prospectusUrl: string;
  fallbackHoldings: Array<{ rank: number; ticker: string; company: string; weight: number }>;
}

export interface IndustryClusterItem {
  id: string;
  name: string;
  clusterNumber: number;
  description: string;
  primaryEtf: {
    symbol: string;
    name: string;
    role: string; // 'Flagship Sector ETF' | 'Primary Industry ETF'
    assetClass: 'ETF';
    expenseRatio: string;
    inceptionDate: string;
    weightingMethodology: string;
    description: string;
    prospectusUrl: string;
    fallbackHoldings: Array<{ rank: number; ticker: string; company: string; weight: number }>;
  };
  dedicatedEtf?: {
    symbol: string;
    name: string;
    role: string;
    assetClass: 'ETF';
    expenseRatio: string;
    inceptionDate: string;
    weightingMethodology: string;
    description: string;
    prospectusUrl: string;
    fallbackHoldings: Array<{ rank: number; ticker: string; company: string; weight: number }>;
  };
  secondaryThematics: Array<{
    symbol: string;
    name: string;
    subThematic: string;
    assetClass: 'ETF';
    expenseRatio: string;
    inceptionDate: string;
    weightingMethodology: string;
    description: string;
    prospectusUrl: string;
    fallbackHoldings?: Array<{ rank: number; ticker: string; company: string; weight: number }>;
  }>;
}

// 1. THE 11 OFFICIAL GICS LEVEL 1 S&P MACRO SECTORS
export const SP_MACRO_SECTORS: SectorIndexItem[] = [
  {
    id: 'info-tech',
    name: 'Information Technology',
    gicsCode: '45',
    symbol: '^SP500-45',
    yahooSymbol: '^SP500-45',
    benchmarkEtf: 'XLK',
    benchmarkEtfName: 'Technology Select Sector SPDR Fund',
    weightPercent: 31.8,
    constituentsCount: 67,
    peRatio: 33.4,
    dividendYield: 0.68,
    description: 'Comprises enterprise software, cloud platforms, semiconductor design & fabrication, hyperscale hardware, and IT infrastructure services.',
    mandate: 'S&P 500 Information Technology Index – A float-adjusted market-cap weighted benchmark comprising all companies in the S&P 500 classified under GICS Sector 45.',
    inceptionDate: '1998-12-16',
    weightingMethodology: 'Float-Adjusted Market Capitalization',
    assetClass: 'Index',
    prospectusUrl: 'https://www.ssga.com/us/en/intermediary/etfs/funds/technology-select-sector-spdr-fund-xlk',
    fallbackHoldings: [
      { rank: 1, ticker: 'NVDA', company: 'NVIDIA Corporation', weight: 14.36 },
      { rank: 2, ticker: 'AAPL', company: 'Apple Inc.', weight: 12.50 },
      { rank: 3, ticker: 'MSFT', company: 'Microsoft Corporation', weight: 10.12 },
      { rank: 4, ticker: 'AVGO', company: 'Broadcom Inc.', weight: 5.42 },
      { rank: 5, ticker: 'ORCL', company: 'Oracle Corporation', weight: 3.15 },
      { rank: 6, ticker: 'AMD', company: 'Advanced Micro Devices, Inc.', weight: 2.85 },
      { rank: 7, ticker: 'CRM', company: 'Salesforce, Inc.', weight: 2.74 },
      { rank: 8, ticker: 'QCOM', company: 'QUALCOMM Incorporated', weight: 2.38 },
      { rank: 9, ticker: 'CSCO', company: 'Cisco Systems, Inc.', weight: 2.18 },
      { rank: 10, ticker: 'ACN', company: 'Accenture plc Class A', weight: 2.05 }
    ]
  },
  {
    id: 'financials',
    name: 'Financials',
    gicsCode: '40',
    symbol: '^SP500-40',
    yahooSymbol: '^SP500-40',
    benchmarkEtf: 'XLF',
    benchmarkEtfName: 'Financial Select Sector SPDR Fund',
    weightPercent: 13.2,
    constituentsCount: 72,
    peRatio: 16.8,
    dividendYield: 1.52,
    description: 'Encompasses diversified money center banks, investment banks, asset managers, insurance underwriters, and financial data exchanges.',
    mandate: 'S&P 500 Financials Index – Represents institutions providing banking, consumer finance, investment banking, brokerage, and insurance services across the S&P 500.',
    inceptionDate: '1998-12-16',
    weightingMethodology: 'Float-Adjusted Market Capitalization',
    assetClass: 'Index',
    prospectusUrl: 'https://www.ssga.com/us/en/intermediary/etfs/funds/financial-select-sector-spdr-fund-xlf',
    fallbackHoldings: [
      { rank: 1, ticker: 'BRK.B', company: 'Berkshire Hathaway Inc. Class B', weight: 13.20 },
      { rank: 2, ticker: 'JPM', company: 'JPMorgan Chase & Co.', weight: 10.45 },
      { rank: 3, ticker: 'V', company: 'Visa Inc. Class A', weight: 7.85 },
      { rank: 4, ticker: 'MA', company: 'Mastercard Incorporated Class A', weight: 6.95 },
      { rank: 5, ticker: 'BAC', company: 'Bank of America Corporation', weight: 4.80 },
      { rank: 6, ticker: 'WFC', company: 'Wells Fargo & Company', weight: 3.42 },
      { rank: 7, ticker: 'GS', company: 'The Goldman Sachs Group, Inc.', weight: 3.25 },
      { rank: 8, ticker: 'MS', company: 'Morgan Stanley', weight: 2.95 },
      { rank: 9, ticker: 'SPGI', company: 'S&P Global Inc.', weight: 2.75 },
      { rank: 10, ticker: 'AXP', company: 'American Express Company', weight: 2.65 }
    ]
  },
  {
    id: 'health-care',
    name: 'Health Care',
    gicsCode: '35',
    symbol: '^SP500-35',
    yahooSymbol: '^SP500-35',
    benchmarkEtf: 'XLV',
    benchmarkEtfName: 'Health Care Select Sector SPDR Fund',
    weightPercent: 11.5,
    constituentsCount: 63,
    peRatio: 21.2,
    dividendYield: 1.58,
    description: 'Pharmaceutical innovators, medical equipment manufacturers, managed healthcare providers, and cutting-edge biotechnology firms.',
    mandate: 'S&P 500 Health Care Index – Tracks biopharma giants, healthcare facilities, diagnostic tools, and surgical robotic systems in the S&P 500.',
    inceptionDate: '1998-12-16',
    weightingMethodology: 'Float-Adjusted Market Capitalization',
    assetClass: 'Index',
    prospectusUrl: 'https://www.ssga.com/us/en/intermediary/etfs/funds/health-care-select-sector-spdr-fund-xlv',
    fallbackHoldings: [
      { rank: 1, ticker: 'LLY', company: 'Eli Lilly and Company', weight: 11.85 },
      { rank: 2, ticker: 'UNH', company: 'UnitedHealth Group Incorporated', weight: 9.65 },
      { rank: 3, ticker: 'JNJ', company: 'Johnson & Johnson', weight: 6.85 },
      { rank: 4, ticker: 'ABBV', company: 'AbbVie Inc.', weight: 6.10 },
      { rank: 5, ticker: 'MRK', company: 'Merck & Co., Inc.', weight: 5.40 },
      { rank: 6, ticker: 'TMO', company: 'Thermo Fisher Scientific Inc.', weight: 4.15 },
      { rank: 7, ticker: 'ABT', company: 'Abbott Laboratories', weight: 3.95 },
      { rank: 8, ticker: 'ISRG', company: 'Intuitive Surgical, Inc.', weight: 3.80 },
      { rank: 9, ticker: 'DHR', company: 'Danaher Corporation', weight: 3.20 },
      { rank: 10, ticker: 'PFE', company: 'Pfizer Inc.', weight: 2.75 }
    ]
  },
  {
    id: 'consumer-discretionary',
    name: 'Consumer Discretionary',
    gicsCode: '25',
    symbol: '^SP500-25',
    yahooSymbol: '^SP500-25',
    benchmarkEtf: 'XLY',
    benchmarkEtfName: 'Consumer Discretionary Select Sector SPDR Fund',
    weightPercent: 10.4,
    constituentsCount: 52,
    peRatio: 27.5,
    dividendYield: 0.78,
    description: 'E-commerce retailers, automotive manufacturers, hotel chains, leisure operators, luxury goods, and quick-service restaurant networks.',
    mandate: 'S&P 500 Consumer Discretionary Index – Benchmarks goods and services whose demand is tied to consumer disposable income and cyclical consumer confidence.',
    inceptionDate: '1998-12-16',
    weightingMethodology: 'Float-Adjusted Market Capitalization',
    assetClass: 'Index',
    prospectusUrl: 'https://www.ssga.com/us/en/intermediary/etfs/funds/consumer-discretionary-select-sector-spdr-fund-xly',
    fallbackHoldings: [
      { rank: 1, ticker: 'AMZN', company: 'Amazon.com, Inc.', weight: 22.80 },
      { rank: 2, ticker: 'TSLA', company: 'Tesla, Inc.', weight: 15.40 },
      { rank: 3, ticker: 'HD', company: 'The Home Depot, Inc.', weight: 8.95 },
      { rank: 4, ticker: 'MCD', company: "McDonald's Corporation", weight: 4.85 },
      { rank: 5, ticker: 'BKNG', company: 'Booking Holdings Inc.', weight: 3.90 },
      { rank: 6, ticker: 'NKE', company: 'NIKE, Inc. Class B', weight: 3.15 },
      { rank: 7, ticker: 'SBUX', company: 'Starbucks Corporation', weight: 2.85 },
      { rank: 8, ticker: 'LOW', company: "Lowe's Companies, Inc.", weight: 2.75 },
      { rank: 9, ticker: 'TJX', company: 'The TJX Companies, Inc.', weight: 2.60 },
      { rank: 10, ticker: 'CMG', company: 'Chipotle Mexican Grill, Inc.', weight: 2.10 }
    ]
  },
  {
    id: 'communication-services',
    name: 'Communication Services',
    gicsCode: '50',
    symbol: '^SP500-50',
    yahooSymbol: '^SP500-50',
    benchmarkEtf: 'XLC',
    benchmarkEtfName: 'Communication Services Select Sector SPDR Fund',
    weightPercent: 9.2,
    constituentsCount: 22,
    peRatio: 22.1,
    dividendYield: 0.85,
    description: 'Global interactive media giants, social networking networks, search engines, entertainment platforms, video games, and telecom providers.',
    mandate: 'S&P 500 Communication Services Index – Measures companies facilitating human interaction, digital advertising, content streaming, and broadband connectivity.',
    inceptionDate: '2018-06-18',
    weightingMethodology: 'Float-Adjusted Market Capitalization',
    assetClass: 'Index',
    prospectusUrl: 'https://www.ssga.com/us/en/intermediary/etfs/funds/communication-services-select-sector-spdr-fund-xlc',
    fallbackHoldings: [
      { rank: 1, ticker: 'META', company: 'Meta Platforms, Inc. Class A', weight: 23.40 },
      { rank: 2, ticker: 'GOOGL', company: 'Alphabet Inc. Class A', weight: 12.80 },
      { rank: 3, ticker: 'GOOG', company: 'Alphabet Inc. Class C', weight: 11.20 },
      { rank: 4, ticker: 'NFLX', company: 'Netflix, Inc.', weight: 5.60 },
      { rank: 5, ticker: 'DIS', company: 'The Walt Disney Company', weight: 4.80 },
      { rank: 6, ticker: 'CMCSA', company: 'Comcast Corporation Class A', weight: 4.25 },
      { rank: 7, ticker: 'TMUS', company: 'T-Mobile US, Inc.', weight: 4.10 },
      { rank: 8, ticker: 'VZ', company: 'Verizon Communications Inc.', weight: 3.95 },
      { rank: 9, ticker: 'T', company: 'AT&T Inc.', weight: 3.40 },
      { rank: 10, ticker: 'EA', company: 'Electronic Arts Inc.', weight: 2.15 }
    ]
  },
  {
    id: 'industrials',
    name: 'Industrials',
    gicsCode: '20',
    symbol: '^SP500-20',
    yahooSymbol: '^SP500-20',
    benchmarkEtf: 'XLI',
    benchmarkEtfName: 'Industrial Select Sector SPDR Fund',
    weightPercent: 8.1,
    constituentsCount: 78,
    peRatio: 23.8,
    dividendYield: 1.45,
    description: 'Aerospace & defense defense contractors, rail freight logistics, electrical equipment, building machinery, and industrial conglomerates.',
    mandate: 'S&P 500 Industrials Index – Gauges heavy manufacturing, civil transport, logistics infrastructure, and aerospace innovation across the U.S. economy.',
    inceptionDate: '1998-12-16',
    weightingMethodology: 'Float-Adjusted Market Capitalization',
    assetClass: 'Index',
    prospectusUrl: 'https://www.ssga.com/us/en/intermediary/etfs/funds/industrial-select-sector-spdr-fund-xli',
    fallbackHoldings: [
      { rank: 1, ticker: 'GE', company: 'GE Aerospace', weight: 6.45 },
      { rank: 2, ticker: 'CAT', company: 'Caterpillar Inc.', weight: 5.80 },
      { rank: 3, ticker: 'RTX', company: 'RTX Corporation', weight: 4.90 },
      { rank: 4, ticker: 'UNP', company: 'Union Pacific Corporation', weight: 4.65 },
      { rank: 5, ticker: 'HON', company: 'Honeywell International Inc.', weight: 4.20 },
      { rank: 6, ticker: 'ETN', company: 'Eaton Corporation plc', weight: 3.95 },
      { rank: 7, ticker: 'DE', company: 'Deere & Company', weight: 3.40 },
      { rank: 8, ticker: 'LMT', company: 'Lockheed Martin Corporation', weight: 3.35 },
      { rank: 9, ticker: 'BA', company: 'The Boeing Company', weight: 3.10 },
      { rank: 10, ticker: 'UPS', company: 'United Parcel Service, Inc. Class B', weight: 2.95 }
    ]
  },
  {
    id: 'consumer-staples',
    name: 'Consumer Staples',
    gicsCode: '30',
    symbol: '^SP500-30',
    yahooSymbol: '^SP500-30',
    benchmarkEtf: 'XLP',
    benchmarkEtfName: 'Consumer Staples Select Sector SPDR Fund',
    weightPercent: 5.6,
    constituentsCount: 38,
    peRatio: 20.4,
    dividendYield: 2.65,
    description: 'Food & beverage producers, household cleaning products, personal care essentials, hypermarket discount chains, and tobacco products.',
    mandate: 'S&P 500 Consumer Staples Index – Tracks non-cyclical manufacturers and retailers of essential daily consumer goods less sensitive to economic downturns.',
    inceptionDate: '1998-12-16',
    weightingMethodology: 'Float-Adjusted Market Capitalization',
    assetClass: 'Index',
    prospectusUrl: 'https://www.ssga.com/us/en/intermediary/etfs/funds/consumer-staples-select-sector-spdr-fund-xlp',
    fallbackHoldings: [
      { rank: 1, ticker: 'PG', company: 'The Procter & Gamble Company', weight: 14.80 },
      { rank: 2, ticker: 'COST', company: 'Costco Wholesale Corporation', weight: 12.40 },
      { rank: 3, ticker: 'WMT', company: 'Walmart Inc.', weight: 9.85 },
      { rank: 4, ticker: 'KO', company: 'The Coca-Cola Company', weight: 9.10 },
      { rank: 5, ticker: 'PEP', company: 'PepsiCo, Inc.', weight: 7.95 },
      { rank: 6, ticker: 'PM', company: 'Philip Morris International Inc.', weight: 5.20 },
      { rank: 7, ticker: 'MDLZ', company: 'Mondelez International, Inc. Class A', weight: 3.40 },
      { rank: 8, ticker: 'CL', company: 'Colgate-Palmolive Company', weight: 3.10 },
      { rank: 9, ticker: 'MO', company: 'Altria Group, Inc.', weight: 2.85 },
      { rank: 10, ticker: 'TGT', company: 'Target Corporation', weight: 2.45 }
    ]
  },
  {
    id: 'energy',
    name: 'Energy',
    gicsCode: '10',
    symbol: '^SP500-10',
    yahooSymbol: '^GSPE',
    benchmarkEtf: 'XLE',
    benchmarkEtfName: 'Energy Select Sector SPDR Fund',
    weightPercent: 3.4,
    constituentsCount: 23,
    peRatio: 12.9,
    dividendYield: 3.35,
    description: 'Integrated multinational oil supermajors, exploration & production (E&P) operators, oilfield equipment services, and refining networks.',
    mandate: 'S&P 500 Energy Index (GSPE) – Tracks upstream, midstream, and downstream petroleum and natural gas energy producers.',
    inceptionDate: '1998-12-16',
    weightingMethodology: 'Float-Adjusted Market Capitalization',
    assetClass: 'Index',
    prospectusUrl: 'https://www.ssga.com/us/en/intermediary/etfs/funds/energy-select-sector-spdr-fund-xle',
    fallbackHoldings: [
      { rank: 1, ticker: 'XOM', company: 'Exxon Mobil Corporation', weight: 22.80 },
      { rank: 2, ticker: 'CVX', company: 'Chevron Corporation', weight: 15.60 },
      { rank: 3, ticker: 'COP', company: 'ConocoPhillips', weight: 8.95 },
      { rank: 4, ticker: 'EOG', company: 'EOG Resources, Inc.', weight: 4.80 },
      { rank: 5, ticker: 'SLB', company: 'Schlumberger Limited', weight: 4.45 },
      { rank: 6, ticker: 'MPC', company: 'Marathon Petroleum Corporation', weight: 3.90 },
      { rank: 7, ticker: 'PSX', company: 'Phillips 66', weight: 3.65 },
      { rank: 8, ticker: 'VLO', company: 'Valero Energy Corporation', weight: 3.40 },
      { rank: 9, ticker: 'WMB', company: 'The Williams Companies, Inc.', weight: 3.25 },
      { rank: 10, ticker: 'OXY', company: 'Occidental Petroleum Corporation', weight: 2.95 }
    ]
  },
  {
    id: 'utilities',
    name: 'Utilities',
    gicsCode: '55',
    symbol: '^SP500-55',
    yahooSymbol: '^SP500-55',
    benchmarkEtf: 'XLU',
    benchmarkEtfName: 'Utilities Select Sector SPDR Fund',
    weightPercent: 2.5,
    constituentsCount: 31,
    peRatio: 18.6,
    dividendYield: 3.20,
    description: 'Regulated electric power utilities, nuclear baseload operators, gas distribution networks, water utilities, and renewable independent power producers.',
    mandate: 'S&P 500 Utilities Index – Represents regulated power providers benefiting from increasing data center electricity demand and renewable grid buildouts.',
    inceptionDate: '1998-12-16',
    weightingMethodology: 'Float-Adjusted Market Capitalization',
    assetClass: 'Index',
    prospectusUrl: 'https://www.ssga.com/us/en/intermediary/etfs/funds/utilities-select-sector-spdr-fund-xlu',
    fallbackHoldings: [
      { rank: 1, ticker: 'NEE', company: 'NextEra Energy, Inc.', weight: 14.20 },
      { rank: 2, ticker: 'SO', company: 'The Southern Company', weight: 8.95 },
      { rank: 3, ticker: 'DUK', company: 'Duke Energy Corporation', weight: 8.40 },
      { rank: 4, ticker: 'CEG', company: 'Constellation Energy Corporation', weight: 6.80 },
      { rank: 5, ticker: 'GEV', company: 'GE Vernova Inc.', weight: 5.95 },
      { rank: 6, ticker: 'SRE', company: 'Sempra', weight: 4.85 },
      { rank: 7, ticker: 'AEP', company: 'American Electric Power Company, Inc.', weight: 4.60 },
      { rank: 8, ticker: 'D', company: 'Dominion Energy, Inc.', weight: 3.90 },
      { rank: 9, ticker: 'PCG', company: 'PG&E Corporation', weight: 3.75 },
      { rank: 10, ticker: 'PEG', company: 'Public Service Enterprise Group Incorporated', weight: 3.60 }
    ]
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    gicsCode: '60',
    symbol: '^SP500-60',
    yahooSymbol: '^SP500-60',
    benchmarkEtf: 'XLRE',
    benchmarkEtfName: 'Real Estate Select Sector SPDR Fund',
    weightPercent: 2.2,
    constituentsCount: 31,
    peRatio: 34.2,
    dividendYield: 3.48,
    description: 'Equity REITs specializing in digital infrastructure (data centers, cell towers), industrial logistics hubs, residential rental, and healthcare real estate.',
    mandate: 'S&P 500 Real Estate Index – Measures equity real estate investment trusts (REITs) and real estate operating and development companies.',
    inceptionDate: '2015-10-07',
    weightingMethodology: 'Float-Adjusted Market Capitalization',
    assetClass: 'Index',
    prospectusUrl: 'https://www.ssga.com/us/en/intermediary/etfs/funds/real-estate-select-sector-spdr-fund-xlre',
    fallbackHoldings: [
      { rank: 1, ticker: 'PLD', company: 'Prologis, Inc.', weight: 11.80 },
      { rank: 2, ticker: 'AMT', company: 'American Tower Corporation', weight: 10.40 },
      { rank: 3, ticker: 'EQIX', company: 'Equinix, Inc.', weight: 8.95 },
      { rank: 4, ticker: 'WELL', company: 'Welltower Inc.', weight: 6.70 },
      { rank: 5, ticker: 'SPG', company: 'Simon Property Group, Inc.', weight: 5.40 },
      { rank: 6, ticker: 'PSA', company: 'Public Storage', weight: 4.85 },
      { rank: 7, ticker: 'O', company: 'Realty Income Corporation', weight: 4.70 },
      { rank: 8, ticker: 'DLR', company: 'Digital Realty Trust, Inc.', weight: 4.60 },
      { rank: 9, ticker: 'CCI', company: 'Crown Castle Inc.', weight: 3.95 },
      { rank: 10, ticker: 'CSGP', company: 'CoStar Group, Inc.', weight: 3.10 }
    ]
  },
  {
    id: 'materials',
    name: 'Materials',
    gicsCode: '15',
    symbol: '^SP500-15',
    yahooSymbol: '^SP500-15',
    benchmarkEtf: 'XLB',
    benchmarkEtfName: 'Materials Select Sector SPDR Fund',
    weightPercent: 2.1,
    constituentsCount: 28,
    peRatio: 19.5,
    dividendYield: 1.82,
    description: 'Industrial gases, specialty chemicals, base metals miners, packaging solutions, construction aggregates, and fertilizer producers.',
    mandate: 'S&P 500 Materials Index – Encompasses suppliers of chemical, mining, and basic feedstock raw materials utilized across global manufacturing.',
    inceptionDate: '1998-12-16',
    weightingMethodology: 'Float-Adjusted Market Capitalization',
    assetClass: 'Index',
    prospectusUrl: 'https://www.ssga.com/us/en/intermediary/etfs/funds/materials-select-sector-spdr-fund-xlb',
    fallbackHoldings: [
      { rank: 1, ticker: 'LIN', company: 'Linde plc', weight: 18.90 },
      { rank: 2, ticker: 'SHW', company: 'The Sherwin-Williams Company', weight: 8.40 },
      { rank: 3, ticker: 'FCX', company: 'Freeport-McMoRan Inc.', weight: 7.20 },
      { rank: 4, ticker: 'ECL', company: 'Ecolab Inc.', weight: 6.85 },
      { rank: 5, ticker: 'NEM', company: 'Newmont Corporation', weight: 5.95 },
      { rank: 6, ticker: 'APD', company: 'Air Products and Chemicals, Inc.', weight: 5.60 },
      { rank: 7, ticker: 'CTVA', company: 'Corteva, Inc.', weight: 4.40 },
      { rank: 8, ticker: 'DOW', company: 'Dow Inc.', weight: 4.10 },
      { rank: 9, ticker: 'NUE', company: 'Nucor Corporation', weight: 3.85 },
      { rank: 10, ticker: 'VMC', company: 'Vulcan Materials Company', weight: 3.60 }
    ]
  }
];

// 2. THE 7 SUB-INDUSTRIES & INDEX-LINKED PRODUCTS (ETFs)
export const SP_INDUSTRY_CLUSTERS: IndustryClusterItem[] = [
  {
    id: 'semiconductors-hardware',
    clusterNumber: 1,
    name: 'Semiconductors, Memory & Hardware',
    description: 'Silicon foundry champions, EUV lithography equipment, High-Bandwidth Memory (HBM) packaging, and high-performance compute chips.',
    primaryEtf: {
      symbol: 'SOXX',
      name: 'iShares Semiconductor ETF',
      role: 'Primary Flagship ETF',
      assetClass: 'ETF',
      expenseRatio: '0.35%',
      inceptionDate: '2001-07-10',
      weightingMethodology: 'Modified Market-Cap Weighted (Top 5 capped at 8%, remainder capped at 4%)',
      description: 'Tracks the NYSE Semiconductor Index, providing targeted exposure to 30 leading U.S.-listed semiconductor design, distribution, and manufacturing enterprises.',
      prospectusUrl: 'https://www.ishares.com/us/products/239705/ishares-phlx-semiconductor-etf',
      fallbackHoldings: [
        { rank: 1, ticker: 'NVDA', company: 'NVIDIA Corporation', weight: 9.43 },
        { rank: 2, ticker: 'AVGO', company: 'Broadcom Inc.', weight: 8.85 },
        { rank: 3, ticker: 'AMD', company: 'Advanced Micro Devices, Inc.', weight: 7.92 },
        { rank: 4, ticker: 'QCOM', company: 'QUALCOMM Incorporated', weight: 7.21 },
        { rank: 5, ticker: 'TXN', company: 'Texas Instruments Incorporated', weight: 5.95 },
        { rank: 6, ticker: 'INTC', company: 'Intel Corporation', weight: 5.40 },
        { rank: 7, ticker: 'AMAT', company: 'Applied Materials, Inc.', weight: 4.65 },
        { rank: 8, ticker: 'LRCX', company: 'Lam Research Corporation', weight: 4.40 },
        { rank: 9, ticker: 'ADI', company: 'Analog Devices, Inc.', weight: 4.15 },
        { rank: 10, ticker: 'MU', company: 'Micron Technology, Inc.', weight: 3.90 }
      ]
    },
    dedicatedEtf: {
      symbol: 'DRAM',
      name: 'Roundhill Memory ETF',
      role: 'Dedicated Memory Hardware ETF',
      assetClass: 'ETF',
      expenseRatio: '0.75%',
      inceptionDate: '2024-05-15',
      weightingMethodology: 'Tiered Pure-Play Thematic Exposure',
      description: 'Targets global companies focused on the design, production, and packaging of memory and storage chips, including DRAM, NAND Flash, and High Bandwidth Memory (HBM).',
      prospectusUrl: 'https://www.roundhillinvestments.com/etf/dram/',
      fallbackHoldings: [
        { rank: 1, ticker: '005930.KS', company: 'Samsung Electronics Co., Ltd.', weight: 19.44 },
        { rank: 2, ticker: '000660.KS', company: 'SK Hynix Inc.', weight: 18.85 },
        { rank: 3, ticker: 'MU', company: 'Micron Technology, Inc.', weight: 17.50 },
        { rank: 4, ticker: 'WDC', company: 'Western Digital Corporation', weight: 8.20 },
        { rank: 5, ticker: 'STX', company: 'Seagate Technology Holdings plc', weight: 7.60 },
        { rank: 6, ticker: '285A.T', company: 'Kioxia Holdings Corporation', weight: 6.80 },
        { rank: 7, ticker: 'ASML', company: 'ASML Holding N.V.', weight: 5.40 },
        { rank: 8, ticker: 'AMAT', company: 'Applied Materials, Inc.', weight: 4.90 },
        { rank: 9, ticker: 'LRCX', company: 'Lam Research Corporation', weight: 4.50 },
        { rank: 10, ticker: '6857.T', company: 'Advantest Corporation', weight: 3.90 }
      ]
    },
    secondaryThematics: [
      {
        symbol: 'SMH',
        name: 'VanEck Semiconductor ETF',
        subThematic: 'Global Foundries & Top 25',
        assetClass: 'ETF',
        expenseRatio: '0.35%',
        inceptionDate: '2011-12-20',
        weightingMethodology: 'MVIS US Listed Semiconductor 25 Index (Market-Cap Weighted)',
        description: 'Concentrated 25-holding semiconductor benchmark weighted heavily towards primary fabrication leaders like TSMC and NVIDIA.',
        prospectusUrl: 'https://www.vaneck.com/us/en/investments/semiconductor-etf-smh/'
      },
      {
        symbol: 'XSD',
        name: 'SPDR S&P Semiconductor ETF',
        subThematic: 'Equal-Weight Small/Mid Cap Semis',
        assetClass: 'ETF',
        expenseRatio: '0.35%',
        inceptionDate: '2006-01-31',
        weightingMethodology: 'Modified Equal-Weighted',
        description: 'Equal-weighted exposure across mega, mid, and small-cap chip designers and wafer fab equipment suppliers.',
        prospectusUrl: 'https://www.ssga.com/us/en/intermediary/etfs/funds/spdr-sp-semiconductor-etf-xsd'
      },
      {
        symbol: 'PSI',
        name: 'Invesco Semiconductors ETF',
        subThematic: 'Dynamic Multi-Factor Semiconductor',
        assetClass: 'ETF',
        expenseRatio: '0.57%',
        inceptionDate: '2005-06-23',
        weightingMethodology: 'Dynamic Intellisense Multi-Factor',
        description: 'Selects U.S. semiconductor stocks based on price momentum, earnings momentum, quality, and management action.',
        prospectusUrl: 'https://www.invesco.com/us/financial-products/etfs/product-detail?audienceType=Investor&ticker=PSI'
      },
      {
        symbol: 'QTUM',
        name: 'Defiance Quantum & AI ETF',
        subThematic: 'Quantum Computing & Machine Learning',
        assetClass: 'ETF',
        expenseRatio: '0.40%',
        inceptionDate: '2018-09-04',
        weightingMethodology: 'Modified Equal-Weighted Quantum Index',
        description: 'Global exposure to firms developing quantum computing systems, superconducting qubits, and AI hardware architecture.',
        prospectusUrl: 'https://www.defianceetfs.com/qtum/'
      },
      {
        symbol: 'BOTZ',
        name: 'Global X Robotics & AI ETF',
        subThematic: 'Robotics & Industrial Automation',
        assetClass: 'ETF',
        expenseRatio: '0.68%',
        inceptionDate: '2016-09-12',
        weightingMethodology: 'Indxx Global Robotics & AI Thematic Index',
        description: 'Invests in companies pioneering industrial robotics, automated factory machinery, and autonomous artificial intelligence.',
        prospectusUrl: 'https://www.globalxetfs.com/funds/botz/'
      }
    ]
  },
  {
    id: 'software-cloud-cyber',
    clusterNumber: 2,
    name: 'Software, Cloud Computing & Cybersecurity',
    description: 'SaaS platforms, cloud infrastructure, AI model serving, Zero Trust security networks, and enterprise productivity software.',
    primaryEtf: {
      symbol: 'IGV',
      name: 'iShares Expanded Tech-Software ETF',
      role: 'Primary Flagship ETF',
      assetClass: 'ETF',
      expenseRatio: '0.40%',
      inceptionDate: '2001-07-10',
      weightingMethodology: 'Modified Market-Cap Weighted S&P North American Software Index',
      description: 'Provides deep, dedicated exposure to North American software developers spanning enterprise applications, system infrastructure, and interactive home software.',
      prospectusUrl: 'https://www.ishares.com/us/products/239771/ishares-expanded-techsoftware-sector-etf',
      fallbackHoldings: [
        { rank: 1, ticker: 'MSFT', company: 'Microsoft Corporation', weight: 8.95 },
        { rank: 2, ticker: 'ORCL', company: 'Oracle Corporation', weight: 8.40 },
        { rank: 3, ticker: 'CRM', company: 'Salesforce, Inc.', weight: 8.10 },
        { rank: 4, ticker: 'ADBE', company: 'Adobe Inc.', weight: 7.45 },
        { rank: 5, ticker: 'NOW', company: 'ServiceNow, Inc.', weight: 6.90 },
        { rank: 6, ticker: 'INTU', company: 'Intuit Inc.', weight: 6.20 },
        { rank: 7, ticker: 'PANW', company: 'Palo Alto Networks, Inc.', weight: 4.80 },
        { rank: 8, ticker: 'CRWD', company: 'CrowdStrike Holdings, Inc. Class A', weight: 4.25 },
        { rank: 9, ticker: 'SNPS', company: 'Synopsys, Inc.', weight: 3.90 },
        { rank: 10, ticker: 'CDNS', company: 'Cadence Design Systems, Inc.', weight: 3.75 }
      ]
    },
    secondaryThematics: [
      {
        symbol: 'CIBR',
        name: 'First Trust NASDAQ Cybersecurity ETF',
        subThematic: 'Zero Trust & Enterprise Cyber Defense',
        assetClass: 'ETF',
        expenseRatio: '0.59%',
        inceptionDate: '2015-07-07',
        weightingMethodology: 'Modified Liquidity-Weighted Nasdaq Cybersecurity Index',
        description: 'Leading benchmark for firms building network perimeter protection, endpoint security, and cloud identity management.',
        prospectusUrl: 'https://www.ftportfolios.com/retail/etf/etfsummary.aspx?Ticker=CIBR'
      },
      {
        symbol: 'BUG',
        name: 'Global X Cybersecurity ETF',
        subThematic: 'Pure-Play Cybersecurity Innovators',
        assetClass: 'ETF',
        expenseRatio: '0.50%',
        inceptionDate: '2019-10-25',
        weightingMethodology: 'Indxx Cybersecurity Index (Pure-Play)',
        description: 'Focuses strictly on companies generating at least 50% of their revenue from cybersecurity software and hardware solutions.',
        prospectusUrl: 'https://www.globalxetfs.com/funds/bug/'
      },
      {
        symbol: 'CLOU',
        name: 'Global X Cloud Computing ETF',
        subThematic: 'SaaS, PaaS & Cloud Infrastructure',
        assetClass: 'ETF',
        expenseRatio: '0.68%',
        inceptionDate: '2019-04-12',
        weightingMethodology: 'Indxx Global Cloud Computing Index',
        description: 'Tracks vendors operating distributed datacenters, public cloud hyperscalers, and subscription-based enterprise software.',
        prospectusUrl: 'https://www.globalxetfs.com/funds/clou/'
      },
      {
        symbol: 'SKYY',
        name: 'First Trust Cloud Computing ETF',
        subThematic: 'Tiered Cloud Infrastructure & Services',
        assetClass: 'ETF',
        expenseRatio: '0.60%',
        inceptionDate: '2011-07-05',
        weightingMethodology: 'ISE CTA Cloud Computing Index',
        description: 'Pure-play cloud software providers, storage infrastructure, and platform-as-a-service market leaders.',
        prospectusUrl: 'https://www.ftportfolios.com/retail/etf/etfsummary.aspx?Ticker=SKYY'
      },
      {
        symbol: 'WCLD',
        name: 'WisdomTree Cloud Computing ETF',
        subThematic: 'BVP Nasdaq Emerging Cloud Index',
        assetClass: 'ETF',
        expenseRatio: '0.45%',
        inceptionDate: '2019-09-06',
        weightingMethodology: 'Equal-Weighted Cloud Index',
        description: 'Developed in partnership with Bessemer Venture Partners (BVP) to track emerging, high-growth cloud and enterprise SaaS companies.',
        prospectusUrl: 'https://www.wisdomtree.com/investments/etfs/megatrends/wcld'
      }
    ]
  },
  {
    id: 'biotech-medtech',
    clusterNumber: 3,
    name: 'Biotechnology & Medical Technology',
    description: 'Clinical gene therapies, oncology treatments, robotic surgery systems, diagnostic assays, and medical device innovators.',
    primaryEtf: {
      symbol: 'XBI',
      name: 'SPDR S&P Biotech ETF',
      role: 'Primary Flagship ETF',
      assetClass: 'ETF',
      expenseRatio: '0.35%',
      inceptionDate: '2006-01-31',
      weightingMethodology: 'Modified Equal-Weighted (Prevents megacap distortion)',
      description: 'Equal-weighted exposure across clinical-stage biotechnology developers and commercial pharmaceutical innovators in the S&P Total Market Index.',
      prospectusUrl: 'https://www.ssga.com/us/en/intermediary/etfs/funds/spdr-sp-biotech-etf-xbi',
      fallbackHoldings: [
        { rank: 1, ticker: 'MRNA', company: 'Moderna, Inc.', weight: 2.81 },
        { rank: 2, ticker: 'ALNY', company: 'Alnylam Pharmaceuticals, Inc.', weight: 2.65 },
        { rank: 3, ticker: 'REGN', company: 'Regeneron Pharmaceuticals, Inc.', weight: 2.45 },
        { rank: 4, ticker: 'VRTX', company: 'Vertex Pharmaceuticals Incorporated', weight: 2.30 },
        { rank: 5, ticker: 'BIIB', company: 'Biogen Inc.', weight: 2.15 },
        { rank: 6, ticker: 'EXEL', company: 'Exelixis, Inc.', weight: 2.05 },
        { rank: 7, ticker: 'INCY', company: 'Incyte Corporation', weight: 1.95 },
        { rank: 8, ticker: 'RARE', company: 'Ultragenyx Pharmaceutical Inc.', weight: 1.85 },
        { rank: 9, ticker: 'BMRN', company: 'BioMarin Pharmaceutical Inc.', weight: 1.80 },
        { rank: 10, ticker: 'NBIX', company: 'Neurocrine Biosciences, Inc.', weight: 1.75 }
      ]
    },
    secondaryThematics: [
      {
        symbol: 'IBB',
        name: 'iShares Biotechnology ETF',
        subThematic: 'Market-Cap Weighted Biotech Index',
        assetClass: 'ETF',
        expenseRatio: '0.45%',
        inceptionDate: '2001-02-05',
        weightingMethodology: 'Modified Market-Cap Weighted Nasdaq Biotechnology Index',
        description: 'Benchmark weighted toward mature, profitable biopharma leaders with substantial commercial drug portfolios.',
        prospectusUrl: 'https://www.ishares.com/us/products/239699/ishares-biotechnology-etf'
      },
      {
        symbol: 'IHI',
        name: 'iShares U.S. Medical Devices ETF',
        subThematic: 'Medical Devices & Robotic Surgery',
        assetClass: 'ETF',
        expenseRatio: '0.40%',
        inceptionDate: '2006-05-01',
        weightingMethodology: 'Dow Jones U.S. Select Medical Equipment Index',
        description: 'Invests in manufacturers of robotic surgery tools, cardiovascular stents, pacemakers, and MRI diagnostic systems.',
        prospectusUrl: 'https://www.ishares.com/us/products/239516/ishares-us-medical-devices-etf'
      },
      {
        symbol: 'PJP',
        name: 'Invesco Dynamic Pharmaceuticals ETF',
        subThematic: 'Commercial Pharma & Drug Discovery',
        assetClass: 'ETF',
        expenseRatio: '0.57%',
        inceptionDate: '2005-06-23',
        weightingMethodology: 'Dynamic Pharmaceutical Intellisense Index',
        description: 'Multi-factor selection of major U.S. pharmaceutical companies focused on prescription medicines, vaccines, and patent pipelines.',
        prospectusUrl: 'https://www.invesco.com/us/financial-products/etfs/product-detail?audienceType=Investor&ticker=PJP'
      }
    ]
  },
  {
    id: 'banking-credit-fintech',
    clusterNumber: 4,
    name: 'Banking, Credit & Financial Infrastructure',
    description: 'Regional lending institutions, commercial bank branches, commercial insurance brokers, and digital payment networks.',
    primaryEtf: {
      symbol: 'KRE',
      name: 'SPDR S&P Regional Banking ETF',
      role: 'Primary Flagship ETF',
      assetClass: 'ETF',
      expenseRatio: '0.35%',
      inceptionDate: '2006-06-19',
      weightingMethodology: 'Modified Equal-Weighted S&P Regional Banks Select Industry Index',
      description: 'The definitive benchmark for U.S. regional and community commercial banks, tracking net interest margin (NIM) cycles and loan growth.',
      prospectusUrl: 'https://www.ssga.com/us/en/intermediary/etfs/funds/spdr-sp-regional-banking-etf-kre',
      fallbackHoldings: [
        { rank: 1, ticker: 'CFR', company: 'Cullen/Frost Bankers, Inc.', weight: 1.46 },
        { rank: 2, ticker: 'WAL', company: 'Western Alliance Bancorporation', weight: 1.42 },
        { rank: 3, ticker: 'ZION', company: 'Zions Bancorporation, N.A.', weight: 1.39 },
        { rank: 4, ticker: 'FITB', company: 'Fifth Third Bancorp', weight: 1.38 },
        { rank: 5, ticker: 'KEY', company: 'KeyCorp', weight: 1.36 },
        { rank: 6, ticker: 'CFG', company: 'Citizens Financial Group, Inc.', weight: 1.35 },
        { rank: 7, ticker: 'RF', company: 'Regions Financial Corporation', weight: 1.34 },
        { rank: 8, ticker: 'HBAN', company: 'Huntington Bancshares Incorporated', weight: 1.32 },
        { rank: 9, ticker: 'MTB', company: 'M&T Bank Corporation', weight: 1.30 },
        { rank: 10, ticker: 'EWBC', company: 'East West Bancorp, Inc.', weight: 1.28 }
      ]
    },
    secondaryThematics: [
      {
        symbol: 'KBE',
        name: 'SPDR S&P Bank ETF',
        subThematic: 'National Commercial Banks & Thrifts',
        assetClass: 'ETF',
        expenseRatio: '0.35%',
        inceptionDate: '2005-11-08',
        weightingMethodology: 'Modified Equal-Weighted S&P Banks Select Industry Index',
        description: 'Equal-weighted portfolio of money center banks, savings institutions, regional lenders, and diversified asset managers.',
        prospectusUrl: 'https://www.ssga.com/us/en/intermediary/etfs/funds/spdr-sp-bank-etf-kbe'
      },
      {
        symbol: 'IAK',
        name: 'iShares U.S. Insurance ETF',
        subThematic: 'Property, Casualty & Life Insurance',
        assetClass: 'ETF',
        expenseRatio: '0.40%',
        inceptionDate: '2006-05-01',
        weightingMethodology: 'Dow Jones U.S. Select Insurance Index',
        description: 'Exposure to underwriters of commercial property, reinsurance, life policies, and insurance brokerage intermediaries.',
        prospectusUrl: 'https://www.ishares.com/us/products/239514/ishares-us-insurance-etf'
      },
      {
        symbol: 'IPAY',
        name: 'Amplify Mobile Payments ETF',
        subThematic: 'FinTech, Gateways & Payment Networks',
        assetClass: 'ETF',
        expenseRatio: '0.75%',
        inceptionDate: '2015-07-15',
        weightingMethodology: 'Prime Mobile Payments Index',
        description: 'Focuses on electronic transaction processors, merchant acquiring gateways, card networks, and point-of-sale software.',
        prospectusUrl: 'https://amplifyetfs.com/ipay/'
      }
    ]
  },
  {
    id: 'aerospace-defense-transport',
    clusterNumber: 5,
    name: 'Aerospace, Defense & Transportation',
    description: 'Commercial aerospace manufacturing, defense avionics, military drone systems, passenger airlines, and freight logistics networks.',
    primaryEtf: {
      symbol: 'ITA',
      name: 'iShares U.S. Aerospace & Defense ETF',
      role: 'Primary Flagship ETF',
      assetClass: 'ETF',
      expenseRatio: '0.40%',
      inceptionDate: '2006-05-01',
      weightingMethodology: 'Modified Market-Cap Weighted Dow Jones U.S. Select Aerospace & Defense Index',
      description: 'Tracks U.S. companies that manufacture commercial aircraft, military jets, defense radar systems, guided munitions, and space hardware.',
      prospectusUrl: 'https://www.ishares.com/us/products/239502/ishares-us-aerospace-defense-etf',
      fallbackHoldings: [
        { rank: 1, ticker: 'GE', company: 'GE Aerospace', weight: 19.80 },
        { rank: 2, ticker: 'RTX', company: 'RTX Corporation', weight: 16.20 },
        { rank: 3, ticker: 'LMT', company: 'Lockheed Martin Corporation', weight: 10.40 },
        { rank: 4, ticker: 'BA', company: 'The Boeing Company', weight: 7.90 },
        { rank: 5, ticker: 'NOC', company: 'Northrop Grumman Corporation', weight: 6.20 },
        { rank: 6, ticker: 'GD', company: 'General Dynamics Corporation', weight: 5.80 },
        { rank: 7, ticker: 'TDG', company: 'TransDigm Group Incorporated', weight: 5.40 },
        { rank: 8, ticker: 'HWM', company: 'Howmet Aerospace Inc.', weight: 4.80 },
        { rank: 9, ticker: 'LHX', company: 'L3Harris Technologies, Inc.', weight: 3.90 },
        { rank: 10, ticker: 'TXT', company: 'Textron Inc.', weight: 2.80 }
      ]
    },
    secondaryThematics: [
      {
        symbol: 'XAR',
        name: 'SPDR S&P Aerospace & Defense ETF',
        subThematic: 'Equal-Weight Defense & Subcontractors',
        assetClass: 'ETF',
        expenseRatio: '0.35%',
        inceptionDate: '2011-09-28',
        weightingMethodology: 'Modified Equal-Weighted S&P Aerospace & Defense Select Industry Index',
        description: 'Equal-weighted exposure preventing megacap concentration and highlighting mid-cap defense subcontractors and avionics suppliers.',
        prospectusUrl: 'https://www.ssga.com/us/en/intermediary/etfs/funds/spdr-sp-aerospace-defense-etf-xar'
      },
      {
        symbol: 'JETS',
        name: 'U.S. Global Jets ETF',
        subThematic: 'Commercial Passenger Airlines & Airports',
        assetClass: 'ETF',
        expenseRatio: '0.60%',
        inceptionDate: '2015-04-28',
        weightingMethodology: 'U.S. Global Jets Index (Tiered Global Factor)',
        description: 'Global benchmark tracking domestic and international passenger airlines, aircraft leasing, and airport terminal operators.',
        prospectusUrl: 'https://usfunds.com/funds/us-global-jets-etf/'
      },
      {
        symbol: 'IYT',
        name: 'iShares U.S. Transportation ETF',
        subThematic: 'Railroads, Trucking & Parcel Freight',
        assetClass: 'ETF',
        expenseRatio: '0.40%',
        inceptionDate: '2003-10-06',
        weightingMethodology: 'S&P Transportation Select Industry FMC Weighted Index',
        description: 'Key barometer of U.S. economic velocity across intermodal rail, long-haul trucking, express parcel delivery, and marine shipping.',
        prospectusUrl: 'https://www.ishares.com/us/products/239501/ishares-us-transportation-etf'
      }
    ]
  },
  {
    id: 'energy-upstream-nuclear',
    clusterNumber: 6,
    name: 'Energy Upstream, Services & Nuclear Materials',
    description: 'Permian shale drillers, offshore subsea engineering, uranium fuel cycle miners, pipeline MLPs, and clean transition infrastructure.',
    primaryEtf: {
      symbol: 'XOP',
      name: 'SPDR S&P Oil & Gas Exploration & Production ETF',
      role: 'Primary Flagship ETF',
      assetClass: 'ETF',
      expenseRatio: '0.35%',
      inceptionDate: '2006-06-19',
      weightingMethodology: 'Modified Equal-Weighted S&P Oil & Gas Exploration & Production Index',
      description: 'Equal-weighted benchmark capturing upstream crude oil and natural gas exploration and production companies operating across the Permian, Eagle Ford, and Marcellus basins.',
      prospectusUrl: 'https://www.ssga.com/us/en/intermediary/etfs/funds/spdr-sp-oil-gas-exploration-production-etf-xop',
      fallbackHoldings: [
        { rank: 1, ticker: 'PBF', company: 'PBF Energy Inc. Class A', weight: 3.80 },
        { rank: 2, ticker: 'DVN', company: 'Devon Energy Corporation', weight: 3.25 },
        { rank: 3, ticker: 'FANG', company: 'Diamondback Energy, Inc.', weight: 3.15 },
        { rank: 4, ticker: 'MRO', company: 'Marathon Oil Corporation', weight: 2.95 },
        { rank: 5, ticker: 'OXY', company: 'Occidental Petroleum Corporation', weight: 2.90 },
        { rank: 6, ticker: 'EOG', company: 'EOG Resources, Inc.', weight: 2.85 },
        { rank: 7, ticker: 'APA', company: 'APA Corporation', weight: 2.75 },
        { rank: 8, ticker: 'EQT', company: 'EQT Corporation', weight: 2.70 },
        { rank: 9, ticker: 'CTRA', company: 'Coterra Energy Inc.', weight: 2.65 },
        { rank: 10, ticker: 'CHRD', company: 'Chord Energy Corporation', weight: 2.60 }
      ]
    },
    secondaryThematics: [
      {
        symbol: 'OIH',
        name: 'VanEck Oil Services ETF',
        subThematic: 'Oilfield Services & Offshore Rigs',
        assetClass: 'ETF',
        expenseRatio: '0.35%',
        inceptionDate: '2011-12-20',
        weightingMethodology: 'MVIS U.S. Listed Oil Services 25 Index',
        description: 'Invests in the 25 largest oil service providers providing drilling fluids, subsea manifolds, directional drilling, and pressure pumping.',
        prospectusUrl: 'https://www.vaneck.com/us/en/investments/oil-services-etf-oih/'
      },
      {
        symbol: 'URA',
        name: 'Global X Uranium ETF',
        subThematic: 'Uranium Miners & Nuclear Fuel Cycle',
        assetClass: 'ETF',
        expenseRatio: '0.69%',
        inceptionDate: '2010-11-04',
        weightingMethodology: 'Solactive Global Uranium & Nuclear Components Index',
        description: 'Comprehensive global exposure to yellowcake producers, in-situ recovery facilities, and nuclear reactor component manufacturers.',
        prospectusUrl: 'https://www.globalxetfs.com/funds/ura/'
      },
      {
        symbol: 'AMLP',
        name: 'Alerian MLP ETF',
        subThematic: 'Midstream Pipeline Master Limited Partnerships',
        assetClass: 'ETF',
        expenseRatio: '0.85%',
        inceptionDate: '2010-08-24',
        weightingMethodology: 'Alerian MLP Infrastructure Index (C-Corp Capped)',
        description: 'Tracks energy midstream infrastructure handling pipeline transportation, storage terminals, and natural gas fractionators with high distribution yields.',
        prospectusUrl: 'https://aleriantf.com/funds/amlp/'
      },
      {
        symbol: 'ICLN',
        name: 'iShares Global Clean Energy ETF',
        subThematic: 'Solar, Wind, Geothermal & Hydroelectric',
        assetClass: 'ETF',
        expenseRatio: '0.41%',
        inceptionDate: '2008-06-24',
        weightingMethodology: 'S&P Global Clean Energy Index',
        description: 'Global benchmark investing in companies involved in renewable electricity generation, photovoltaic inverters, and wind turbines.',
        prospectusUrl: 'https://www.ishares.com/us/products/239738/ishares-global-clean-energy-etf'
      }
    ]
  },
  {
    id: 'homebuilding-retail-mining',
    clusterNumber: 7,
    name: 'Homebuilding, Construction & Consumer Niches',
    description: 'Residential single-family homebuilders, building supply warehouses, omnichannel retailers, copper miners, and steel fabricators.',
    primaryEtf: {
      symbol: 'XHB',
      name: 'SPDR S&P Homebuilders ETF',
      role: 'Primary Flagship ETF',
      assetClass: 'ETF',
      expenseRatio: '0.35%',
      inceptionDate: '2006-01-31',
      weightingMethodology: 'Modified Equal-Weighted S&P Homebuilders Select Industry Index',
      description: 'Equal-weighted benchmark tracking residential homebuilders, building materials manufacturers, and home improvement retail centers across the U.S.',
      prospectusUrl: 'https://www.ssga.com/us/en/intermediary/etfs/funds/spdr-sp-homebuilders-etf-xhb',
      fallbackHoldings: [
        { rank: 1, ticker: 'DHI', company: 'D.R. Horton, Inc.', weight: 4.80 },
        { rank: 2, ticker: 'LEN', company: 'Lennar Corporation Class A', weight: 4.75 },
        { rank: 3, ticker: 'NVR', company: 'NVR, Inc.', weight: 4.60 },
        { rank: 4, ticker: 'PHM', company: 'PulteGroup, Inc.', weight: 4.50 },
        { rank: 5, ticker: 'TOL', company: 'Toll Brothers, Inc.', weight: 4.35 },
        { rank: 6, ticker: 'HD', company: 'The Home Depot, Inc.', weight: 4.20 },
        { rank: 7, ticker: 'LOW', company: "Lowe's Companies, Inc.", weight: 4.10 },
        { rank: 8, ticker: 'MAS', company: 'Masco Corporation', weight: 3.90 },
        { rank: 9, ticker: 'OC', company: 'Owens Corning', weight: 3.80 },
        { rank: 10, ticker: 'TREX', company: 'Trex Company, Inc.', weight: 3.65 }
      ]
    },
    secondaryThematics: [
      {
        symbol: 'ITB',
        name: 'iShares U.S. Home Construction ETF',
        subThematic: 'Market-Cap Weighted Homebuilders',
        assetClass: 'ETF',
        expenseRatio: '0.40%',
        inceptionDate: '2006-05-01',
        weightingMethodology: 'Dow Jones U.S. Select Home Construction Index',
        description: 'Cap-weighted focus concentrating heavily on the top U.S. mega-homebuilders (D.R. Horton, Lennar, PulteGroup) and wood product fabricators.',
        prospectusUrl: 'https://www.ishares.com/us/products/239512/ishares-us-home-construction-etf'
      },
      {
        symbol: 'XRT',
        name: 'SPDR S&P Retail ETF',
        subThematic: 'Omnichannel, Apparel & Department Stores',
        assetClass: 'ETF',
        expenseRatio: '0.35%',
        inceptionDate: '2006-06-19',
        weightingMethodology: 'Modified Equal-Weighted S&P Retail Select Industry Index',
        description: 'Equal-weighted indicator of consumer point-of-sale spending across grocery, specialty apparel, electronics, and discount department stores.',
        prospectusUrl: 'https://www.ssga.com/us/en/intermediary/etfs/funds/spdr-sp-retail-etf-xrt'
      },
      {
        symbol: 'XME',
        name: 'SPDR S&P Metals & Mining ETF',
        subThematic: 'Steel, Aluminum, Coal & Precious Metals',
        assetClass: 'ETF',
        expenseRatio: '0.35%',
        inceptionDate: '2006-06-19',
        weightingMethodology: 'Modified Equal-Weighted S&P Metals & Mining Select Industry Index',
        description: 'Provides direct exposure across steel mills, copper producers, gold/silver miners, and coal extraction operators.',
        prospectusUrl: 'https://www.ssga.com/us/en/intermediary/etfs/funds/spdr-sp-metals-mining-etf-xme'
      },
      {
        symbol: 'COPX',
        name: 'Global X Copper Miners ETF',
        subThematic: 'Global Copper Extraction & Smelting',
        assetClass: 'ETF',
        expenseRatio: '0.65%',
        inceptionDate: '2010-04-19',
        weightingMethodology: 'Solactive Global Copper Miners Total Return Index',
        description: 'Invests in global mining corporations producing red metal feedstocks critical for electricity grids, EVs, and AI datacenter busbars.',
        prospectusUrl: 'https://www.globalxetfs.com/funds/copx/'
      }
    ]
  }
];

// Helper to find any security metadata by symbol
export function getSecurityMetadata(symbol: string): {
  symbol: string;
  name: string;
  type: 'Index' | 'ETF';
  gicsSector?: string;
  expenseRatio?: string;
  inceptionDate: string;
  weightingMethodology: string;
  description: string;
  prospectusUrl: string;
  fallbackHoldings: Array<{ rank: number; ticker: string; company: string; weight: number }>;
  benchmarkEtf?: string;
} | null {
  const norm = (symbol || '').trim().toUpperCase();

  // 1. Check Macro Sectors
  const macroSector = SP_MACRO_SECTORS.find(s => s.symbol.toUpperCase() === norm || s.yahooSymbol.toUpperCase() === norm || s.id.toUpperCase() === norm);
  if (macroSector) {
    return {
      symbol: macroSector.symbol,
      name: macroSector.name,
      type: 'Index',
      gicsSector: macroSector.name,
      inceptionDate: macroSector.inceptionDate,
      weightingMethodology: macroSector.weightingMethodology,
      description: macroSector.mandate,
      prospectusUrl: macroSector.prospectusUrl,
      fallbackHoldings: macroSector.fallbackHoldings,
      benchmarkEtf: macroSector.benchmarkEtf
    };
  }

  // 2. Check Benchmark ETFs of Macro Sectors
  const benchmarkSector = SP_MACRO_SECTORS.find(s => s.benchmarkEtf.toUpperCase() === norm);
  if (benchmarkSector) {
    return {
      symbol: benchmarkSector.benchmarkEtf,
      name: benchmarkSector.benchmarkEtfName,
      type: 'ETF',
      gicsSector: benchmarkSector.name,
      expenseRatio: '0.09%',
      inceptionDate: benchmarkSector.inceptionDate,
      weightingMethodology: benchmarkSector.weightingMethodology,
      description: `Tracks the ${benchmarkSector.name} sector of the S&P 500 Index.`,
      prospectusUrl: benchmarkSector.prospectusUrl,
      fallbackHoldings: benchmarkSector.fallbackHoldings
    };
  }

  // 3. Check Industry Clusters (Primary, Dedicated, Secondary)
  for (const cluster of SP_INDUSTRY_CLUSTERS) {
    if (cluster.primaryEtf.symbol.toUpperCase() === norm) {
      return {
        symbol: cluster.primaryEtf.symbol,
        name: cluster.primaryEtf.name,
        type: 'ETF',
        gicsSector: cluster.name,
        expenseRatio: cluster.primaryEtf.expenseRatio,
        inceptionDate: cluster.primaryEtf.inceptionDate,
        weightingMethodology: cluster.primaryEtf.weightingMethodology,
        description: cluster.primaryEtf.description,
        prospectusUrl: cluster.primaryEtf.prospectusUrl,
        fallbackHoldings: cluster.primaryEtf.fallbackHoldings
      };
    }
    if (cluster.dedicatedEtf && cluster.dedicatedEtf.symbol.toUpperCase() === norm) {
      return {
        symbol: cluster.dedicatedEtf.symbol,
        name: cluster.dedicatedEtf.name,
        type: 'ETF',
        gicsSector: cluster.name,
        expenseRatio: cluster.dedicatedEtf.expenseRatio,
        inceptionDate: cluster.dedicatedEtf.inceptionDate,
        weightingMethodology: cluster.dedicatedEtf.weightingMethodology,
        description: cluster.dedicatedEtf.description,
        prospectusUrl: cluster.dedicatedEtf.prospectusUrl,
        fallbackHoldings: cluster.dedicatedEtf.fallbackHoldings
      };
    }
    for (const sec of cluster.secondaryThematics) {
      if (sec.symbol.toUpperCase() === norm) {
        return {
          symbol: sec.symbol,
          name: sec.name,
          type: 'ETF',
          gicsSector: cluster.name,
          expenseRatio: sec.expenseRatio,
          inceptionDate: sec.inceptionDate,
          weightingMethodology: sec.weightingMethodology,
          description: sec.description,
          prospectusUrl: sec.prospectusUrl,
          fallbackHoldings: sec.fallbackHoldings || cluster.primaryEtf.fallbackHoldings
        };
      }
    }
  }

  return null;
}
