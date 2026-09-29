import { ResearchConfig, CategoryThreshold, AssetResearchConfig } from '../types/marketResearch';

export const DEFAULT_RESEARCH_CATEGORIES: Record<string, CategoryThreshold> = {
  global_indices: {
    key: 'global_indices',
    label: 'Global indices',
    thresholdPct: 2.0,
    description: 'Een beweging van 2% in een grote index is doorgaans groot genoeg voor contextueel onderzoek'
  },
  sector_indices_etfs: {
    key: 'sector_indices_etfs',
    label: "Sectorindices / ETF's",
    thresholdPct: 4.0,
    description: 'Sectorbewegingen zijn iets specifieker'
  },
  mega_cap_stocks: {
    key: 'mega_cap_stocks',
    label: 'Mega-cap aandelen',
    thresholdPct: 4.0,
    description: 'Voorkomt research op normale dagelijkse volatiliteit'
  },
  normal_large_mid_cap: {
    key: 'normal_large_mid_cap',
    label: 'Normale large/mid-cap aandelen',
    thresholdPct: 5.5,
    description: 'Iets hogere drempel voor normale volatiliteit'
  },
  small_mid_high_beta: {
    key: 'small_mid_high_beta',
    label: 'Small/mid-cap / high-beta',
    thresholdPct: 7.5,
    description: 'Veel normale ruis; voorkomt overmatig aantal triggers'
  },
  brent_wti: {
    key: 'brent_wti',
    label: 'Brent / WTI',
    thresholdPct: 3.5,
    description: 'Relevante beweging voor supply/geopolitiek/macro onderzoek'
  },
  gold: {
    key: 'gold',
    label: 'Gold',
    thresholdPct: 3.0,
    description: 'Relevante macro/geopolitieke beweging'
  },
  silver: {
    key: 'silver',
    label: 'Silver',
    thresholdPct: 5.0,
    description: 'Hogere volatiliteit dan goud'
  },
  other_commodities: {
    key: 'other_commodities',
    label: 'Andere commodities',
    thresholdPct: 5.0,
    description: 'Energie, metalen en landbouwgrondstoffen'
  },
  global_rates: {
    key: 'global_rates',
    label: 'Global rates',
    thresholdPct: 1.0, // 100 basis points or 1.00%
    description: 'Renteverschuivingen van 100 bps hebben diepe macro-impact'
  }
};

export const DEFAULT_RESEARCH_ASSETS: Record<string, AssetResearchConfig> = {
  // Mega-cap stocks
  NVDA: { symbol: 'NVDA', name: 'NVIDIA Corporation', assetClass: 'Mega-cap Tech', categoryKey: 'mega_cap_stocks', enabled: true },
  MSFT: { symbol: 'MSFT', name: 'Microsoft Corporation', assetClass: 'Mega-cap Tech', categoryKey: 'mega_cap_stocks', enabled: true },
  AAPL: { symbol: 'AAPL', name: 'Apple Inc.', assetClass: 'Mega-cap Tech', categoryKey: 'mega_cap_stocks', enabled: true },
  GOOGL: { symbol: 'GOOGL', name: 'Alphabet Inc.', assetClass: 'Mega-cap Tech', categoryKey: 'mega_cap_stocks', enabled: true },
  AMZN: { symbol: 'AMZN', name: 'Amazon.com Inc.', assetClass: 'Mega-cap Tech', categoryKey: 'mega_cap_stocks', enabled: true },
  META: { symbol: 'META', name: 'Meta Platforms Inc.', assetClass: 'Mega-cap Tech', categoryKey: 'mega_cap_stocks', enabled: true },
  TSM: { symbol: 'TSM', name: 'Taiwan Semiconductor Manufacturing', assetClass: 'Mega-cap Tech', categoryKey: 'mega_cap_stocks', enabled: true },
  AVGO: { symbol: 'AVGO', name: 'Broadcom Inc.', assetClass: 'Mega-cap Tech', categoryKey: 'mega_cap_stocks', enabled: true },
  ASML: { symbol: 'ASML', name: 'ASML Holding N.V.', assetClass: 'Mega-cap Tech', categoryKey: 'mega_cap_stocks', enabled: true },
  SAP: { symbol: 'SAP', name: 'SAP SE', assetClass: 'Mega-cap Tech', categoryKey: 'mega_cap_stocks', enabled: true },
  JPM: { symbol: 'JPM', name: 'JPMorgan Chase & Co.', assetClass: 'Financials', categoryKey: 'mega_cap_stocks', enabled: true },

  // Normal large/mid-cap
  ORCL: { symbol: 'ORCL', name: 'Oracle Corporation', assetClass: 'Enterprise Cloud', categoryKey: 'normal_large_mid_cap', enabled: true },
  AMD: { symbol: 'AMD', name: 'Advanced Micro Devices', assetClass: 'Semiconductors', categoryKey: 'normal_large_mid_cap', enabled: true },
  CRM: { symbol: 'CRM', name: 'Salesforce, Inc.', assetClass: 'Enterprise Software', categoryKey: 'normal_large_mid_cap', enabled: true },
  NFLX: { symbol: 'NFLX', name: 'Netflix Inc.', assetClass: 'Digital Media', categoryKey: 'normal_large_mid_cap', enabled: true },
  ARM: { symbol: 'ARM', name: 'Arm Holdings plc', assetClass: 'Semiconductors', categoryKey: 'normal_large_mid_cap', enabled: true },
  SPOT: { symbol: 'SPOT', name: 'Spotify Technology S.A.', assetClass: 'Digital Media', categoryKey: 'normal_large_mid_cap', enabled: true },
  STM: { symbol: 'STM', name: 'STMicroelectronics N.V.', assetClass: 'Semiconductors', categoryKey: 'normal_large_mid_cap', enabled: true },
  PRX: { symbol: 'PRX', name: 'Prosus N.V.', assetClass: 'Internet & Tech', categoryKey: 'normal_large_mid_cap', enabled: true },
  ADYEN: { symbol: 'ADYEN', name: 'Adyen N.V.', assetClass: 'Fintech & Payments', categoryKey: 'normal_large_mid_cap', enabled: true },
  IFX: { symbol: 'IFX', name: 'Infineon Technologies AG', assetClass: 'Semiconductors', categoryKey: 'normal_large_mid_cap', enabled: true },
  SU: { symbol: 'SU', name: 'Schneider Electric SE', assetClass: 'Industrial Tech', categoryKey: 'normal_large_mid_cap', enabled: true },
  SIE: { symbol: 'SIE', name: 'Siemens AG', assetClass: 'Industrial Tech', categoryKey: 'normal_large_mid_cap', enabled: true },
  BAC: { symbol: 'BAC', name: 'Bank of America Corp.', assetClass: 'Financials', categoryKey: 'normal_large_mid_cap', enabled: true },
  C: { symbol: 'C', name: 'Citigroup Inc.', assetClass: 'Financials', categoryKey: 'normal_large_mid_cap', enabled: true },
  WFC: { symbol: 'WFC', name: 'Wells Fargo & Company', assetClass: 'Financials', categoryKey: 'normal_large_mid_cap', enabled: true },
  MS: { symbol: 'MS', name: 'Morgan Stanley', assetClass: 'Financials', categoryKey: 'normal_large_mid_cap', enabled: true },
  GS: { symbol: 'GS', name: 'Goldman Sachs Group Inc.', assetClass: 'Financials', categoryKey: 'normal_large_mid_cap', enabled: true },
  BX: { symbol: 'BX', name: 'Blackstone Inc.', assetClass: 'Alternative Assets', categoryKey: 'normal_large_mid_cap', enabled: true },
  KKR: { symbol: 'KKR', name: 'KKR & Co. Inc.', assetClass: 'Alternative Assets', categoryKey: 'normal_large_mid_cap', enabled: true },
  APO: { symbol: 'APO', name: 'Apollo Global Management', assetClass: 'Alternative Assets', categoryKey: 'normal_large_mid_cap', enabled: true },
  ARES: { symbol: 'ARES', name: 'Ares Management Corp.', assetClass: 'Alternative Assets', categoryKey: 'normal_large_mid_cap', enabled: true },
  GE: { symbol: 'GE', name: 'GE Aerospace', assetClass: 'Aerospace & Defense', categoryKey: 'normal_large_mid_cap', enabled: true },
  RTX: { symbol: 'RTX', name: 'RTX Corporation', assetClass: 'Aerospace & Defense', categoryKey: 'normal_large_mid_cap', enabled: true },
  BA: { symbol: 'BA', name: 'The Boeing Company', assetClass: 'Aerospace & Defense', categoryKey: 'normal_large_mid_cap', enabled: true },
  LMT: { symbol: 'LMT', name: 'Lockheed Martin Corp.', assetClass: 'Aerospace & Defense', categoryKey: 'normal_large_mid_cap', enabled: true },
  AMAT: { symbol: 'AMAT', name: 'Applied Materials Inc.', assetClass: 'Semiconductor Equipment', categoryKey: 'normal_large_mid_cap', enabled: true },
  LRCX: { symbol: 'LRCX', name: 'Lam Research Corp.', assetClass: 'Semiconductor Equipment', categoryKey: 'normal_large_mid_cap', enabled: true },
  KLAC: { symbol: 'KLAC', name: 'KLA Corporation', assetClass: 'Semiconductor Equipment', categoryKey: 'normal_large_mid_cap', enabled: true },
  INTC: { symbol: 'INTC', name: 'Intel Corporation', assetClass: 'Semiconductors', categoryKey: 'normal_large_mid_cap', enabled: true },
  MU: { symbol: 'MU', name: 'Micron Technology Inc.', assetClass: 'Memory & Storage', categoryKey: 'normal_large_mid_cap', enabled: true },
  MRVL: { symbol: 'MRVL', name: 'Marvell Technology Inc.', assetClass: 'Semiconductors', categoryKey: 'normal_large_mid_cap', enabled: true },
  TXN: { symbol: 'TXN', name: 'Texas Instruments Inc.', assetClass: 'Semiconductors', categoryKey: 'normal_large_mid_cap', enabled: true },
  CSCO: { symbol: 'CSCO', name: 'Cisco Systems Inc.', assetClass: 'Networking Hardware', categoryKey: 'normal_large_mid_cap', enabled: true },
  DELL: { symbol: 'DELL', name: 'Dell Technologies Inc.', assetClass: 'AI Infrastructure', categoryKey: 'normal_large_mid_cap', enabled: true },
  HPE: { symbol: 'HPE', name: 'Hewlett Packard Enterprise', assetClass: 'AI Infrastructure', categoryKey: 'normal_large_mid_cap', enabled: true },
  WDC: { symbol: 'WDC', name: 'Western Digital Corp.', assetClass: 'Storage Hardware', categoryKey: 'normal_large_mid_cap', enabled: true },
  STX: { symbol: 'STX', name: 'Seagate Technology', assetClass: 'Storage Hardware', categoryKey: 'normal_large_mid_cap', enabled: true },

  // Small/mid-cap / high-beta
  IONQ: { symbol: 'IONQ', name: 'IonQ, Inc.', assetClass: 'Quantum Computing', categoryKey: 'small_mid_high_beta', enabled: true },
  QBTS: { symbol: 'QBTS', name: 'D-Wave Quantum Inc.', assetClass: 'Quantum Computing', categoryKey: 'small_mid_high_beta', enabled: true },
  ASTS: { symbol: 'ASTS', name: 'AST SpaceMobile Inc.', assetClass: 'Space Communications', categoryKey: 'small_mid_high_beta', enabled: true },
  RKLB: { symbol: 'RKLB', name: 'Rocket Lab USA Inc.', assetClass: 'Space Systems', categoryKey: 'small_mid_high_beta', enabled: true },
  DRS: { symbol: 'DRS', name: 'Leonardo DRS Inc.', assetClass: 'Defense Electronics', categoryKey: 'small_mid_high_beta', enabled: true },
  RCAT: { symbol: 'RCAT', name: 'Red Cat Holdings Inc.', assetClass: 'Tactical Drones', categoryKey: 'small_mid_high_beta', enabled: true },
  KTOS: { symbol: 'KTOS', name: 'Kratos Defense & Security', assetClass: 'Autonomous Defense', categoryKey: 'small_mid_high_beta', enabled: true },
  AVAV: { symbol: 'AVAV', name: 'AeroVironment Inc.', assetClass: 'Unmanned Systems', categoryKey: 'small_mid_high_beta', enabled: true },
  ESLT: { symbol: 'ESLT', name: 'Elbit Systems Ltd.', assetClass: 'Defense Systems', categoryKey: 'small_mid_high_beta', enabled: true },
  UMAC: { symbol: 'UMAC', name: 'Unusual Machines Inc.', assetClass: 'Drone Components', categoryKey: 'small_mid_high_beta', enabled: true },
  DRO: { symbol: 'DRO', name: 'DroneShield Ltd.', assetClass: 'Counter-Drone Defense', categoryKey: 'small_mid_high_beta', enabled: true },
  RDW: { symbol: 'RDW', name: 'Redwire Corporation', assetClass: 'Space Infrastructure', categoryKey: 'small_mid_high_beta', enabled: true },
  SMCI: { symbol: 'SMCI', name: 'Super Micro Computer Inc.', assetClass: 'AI Server Systems', categoryKey: 'small_mid_high_beta', enabled: true },
  LITE: { symbol: 'LITE', name: 'Lumentum Holdings Inc.', assetClass: 'Optical Subsystems', categoryKey: 'small_mid_high_beta', enabled: true },
  COHR: { symbol: 'COHR', name: 'Coherent Corp.', assetClass: 'Photonics & Optical', categoryKey: 'small_mid_high_beta', enabled: true },
  CIEN: { symbol: 'CIEN', name: 'Ciena Corporation', assetClass: 'Optical Networking', categoryKey: 'small_mid_high_beta', enabled: true },
  CRWV: { symbol: 'CRWV', name: 'CoreWeave', assetClass: 'AI Cloud Compute', categoryKey: 'small_mid_high_beta', enabled: true },
  NBIS: { symbol: 'NBIS', name: 'Nebius Group', assetClass: 'AI Infrastructure', categoryKey: 'small_mid_high_beta', enabled: true },
  IREN: { symbol: 'IREN', name: 'IREN Ltd.', assetClass: 'Next-Gen Compute', categoryKey: 'small_mid_high_beta', enabled: true },
  CBRS: { symbol: 'CBRS', name: 'Cerebras Systems', assetClass: 'AI Silicon', categoryKey: 'small_mid_high_beta', enabled: true },

  // Brent / WTI
  BRENT: { symbol: 'BRENT', name: 'Brent Crude Benchmark', assetClass: 'Energy Commodities', categoryKey: 'brent_wti', enabled: true },
  WTI: { symbol: 'WTI', name: 'WTI Light Sweet Crude', assetClass: 'Energy Commodities', categoryKey: 'brent_wti', enabled: true },

  // Gold
  GOLD: { symbol: 'GOLD', name: 'Gold Bullion', assetClass: 'Precious Metals', categoryKey: 'gold', enabled: true },

  // Silver
  SILVER: { symbol: 'SILVER', name: 'Silver Futures', assetClass: 'Precious Metals', categoryKey: 'silver', enabled: true },

  // Other commodities
  COPPER: { symbol: 'COPPER', name: 'Copper High Grade', assetClass: 'Industrial Metals', categoryKey: 'other_commodities', enabled: true },
  TTF: { symbol: 'TTF', name: 'Dutch TTF Natural Gas', assetClass: 'Energy Commodities', categoryKey: 'other_commodities', enabled: true },
  NG: { symbol: 'NG', name: 'Henry Hub Natural Gas', assetClass: 'Energy Commodities', categoryKey: 'other_commodities', enabled: true },
  JKM: { symbol: 'JKM', name: 'Japan Korea Marker LNG', assetClass: 'Energy Commodities', categoryKey: 'other_commodities', enabled: true },
  URANIUM: { symbol: 'URANIUM', name: 'Uranium Benchmark', assetClass: 'Nuclear Energy', categoryKey: 'other_commodities', enabled: true },
  LITHIUM: { symbol: 'LITHIUM', name: 'Lithium Carbonate', assetClass: 'Battery Metals', categoryKey: 'other_commodities', enabled: true },
  WHEAT: { symbol: 'WHEAT', name: 'Chicago SRW Wheat', assetClass: 'Agricultural', categoryKey: 'other_commodities', enabled: true },
  CORN: { symbol: 'CORN', name: 'Chicago Corn Futures', assetClass: 'Agricultural', categoryKey: 'other_commodities', enabled: true },
  RBOB: { symbol: 'RBOB', name: 'RBOB Gasoline', assetClass: 'Refined Products', categoryKey: 'other_commodities', enabled: true },
  HO: { symbol: 'HO', name: 'Heating Oil / Ultra-Low Sulfur Diesel', assetClass: 'Refined Products', categoryKey: 'other_commodities', enabled: true },

  // Global indices
  '^SP500-45': { symbol: '^SP500-45', name: 'S&P 500 Information Technology', assetClass: 'Global Indices', categoryKey: 'global_indices', enabled: true },
  '^SP500-40': { symbol: '^SP500-40', name: 'S&P 500 Financials', assetClass: 'Global Indices', categoryKey: 'global_indices', enabled: true },
  '^SP500-10': { symbol: '^SP500-10', name: 'S&P 500 Energy', assetClass: 'Global Indices', categoryKey: 'global_indices', enabled: true },
  SX7P: { symbol: 'SX7P', name: 'STOXX Europe 600 Banks', assetClass: 'Global Indices', categoryKey: 'global_indices', enabled: true },

  // Sector indices & ETFs
  XLK: { symbol: 'XLK', name: 'Technology Select Sector SPDR', assetClass: 'Sector ETFs', categoryKey: 'sector_indices_etfs', enabled: true },
  XLF: { symbol: 'XLF', name: 'Financial Select Sector SPDR', assetClass: 'Sector ETFs', categoryKey: 'sector_indices_etfs', enabled: true },
  XLE: { symbol: 'XLE', name: 'Energy Select Sector SPDR', assetClass: 'Sector ETFs', categoryKey: 'sector_indices_etfs', enabled: true },
  XLI: { symbol: 'XLI', name: 'Industrial Select Sector SPDR', assetClass: 'Sector ETFs', categoryKey: 'sector_indices_etfs', enabled: true },
  SOXX: { symbol: 'SOXX', name: 'iShares Semiconductor ETF', assetClass: 'Thematic ETFs', categoryKey: 'sector_indices_etfs', enabled: true },
  SMH: { symbol: 'SMH', name: 'VanEck Semiconductor ETF', assetClass: 'Thematic ETFs', categoryKey: 'sector_indices_etfs', enabled: true },
  IGV: { symbol: 'IGV', name: 'iShares Expanded Tech-Software ETF', assetClass: 'Thematic ETFs', categoryKey: 'sector_indices_etfs', enabled: true },
  CIBR: { symbol: 'CIBR', name: 'First Trust NASDAQ Cybersecurity ETF', assetClass: 'Thematic ETFs', categoryKey: 'sector_indices_etfs', enabled: true },
  XBI: { symbol: 'XBI', name: 'SPDR S&P Biotech ETF', assetClass: 'Thematic ETFs', categoryKey: 'sector_indices_etfs', enabled: true },
  KRE: { symbol: 'KRE', name: 'SPDR S&P Regional Banking ETF', assetClass: 'Banking ETFs', categoryKey: 'sector_indices_etfs', enabled: true },
  JETS: { symbol: 'JETS', name: 'U.S. Global Jets ETF', assetClass: 'Thematic ETFs', categoryKey: 'sector_indices_etfs', enabled: true },

  // Global rates
  US2Y: { symbol: 'US2Y', name: 'US 2-Year Treasury Yield', assetClass: 'Sovereign Rates', categoryKey: 'global_rates', enabled: true },
  US10Y: { symbol: 'US10Y', name: 'US 10-Year Treasury Yield', assetClass: 'Sovereign Rates', categoryKey: 'global_rates', enabled: true },
  US30Y: { symbol: 'US30Y', name: 'US 30-Year Treasury Yield', assetClass: 'Sovereign Rates', categoryKey: 'global_rates', enabled: true },
  DE10Y: { symbol: 'DE10Y', name: 'German 10-Year Bund Yield', assetClass: 'Sovereign Rates', categoryKey: 'global_rates', enabled: true },
  JP10Y: { symbol: 'JP10Y', name: 'Japan 10-Year JGB Yield', assetClass: 'Sovereign Rates', categoryKey: 'global_rates', enabled: true },
  GB10Y: { symbol: 'GB10Y', name: 'UK 10-Year Gilt Yield', assetClass: 'Sovereign Rates', categoryKey: 'global_rates', enabled: true }
};

export function getDefaultResearchConfig(): ResearchConfig {
  return {
    schedulerIntervalMin: 5,
    categories: { ...DEFAULT_RESEARCH_CATEGORIES },
    assets: { ...DEFAULT_RESEARCH_ASSETS },
    dedupWindowHours: 24
  };
}
