export interface AppStockMeta {
  ticker: string;
  name: string;
  category: 'mega_cap' | 'semiconductors' | 'software' | 'europe' | 'financials' | 'aerospace';
  categoryLabel: string;
  exchange: string;
  country: string;
}

export const ALL_APP_STOCKS: AppStockMeta[] = [
  // 1. Big Tech & Mega-Cap
  { ticker: 'NVDA', name: 'NVIDIA Corporation', category: 'mega_cap', categoryLabel: 'Mega-Cap Tech', exchange: 'Nasdaq', country: 'Verenigde Staten' },
  { ticker: 'MSFT', name: 'Microsoft Corporation', category: 'mega_cap', categoryLabel: 'Mega-Cap Tech', exchange: 'Nasdaq', country: 'Verenigde Staten' },
  { ticker: 'AAPL', name: 'Apple Inc.', category: 'mega_cap', categoryLabel: 'Mega-Cap Tech', exchange: 'Nasdaq', country: 'Verenigde Staten' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', category: 'mega_cap', categoryLabel: 'Mega-Cap Tech', exchange: 'Nasdaq', country: 'Verenigde Staten' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', category: 'mega_cap', categoryLabel: 'Mega-Cap Tech', exchange: 'Nasdaq', country: 'Verenigde Staten' },
  { ticker: 'META', name: 'Meta Platforms Inc.', category: 'mega_cap', categoryLabel: 'Mega-Cap Tech', exchange: 'Nasdaq', country: 'Verenigde Staten' },
  { ticker: 'TSLA', name: 'Tesla, Inc.', category: 'mega_cap', categoryLabel: 'Mega-Cap Tech', exchange: 'Nasdaq', country: 'Verenigde Staten' },
  { ticker: 'NFLX', name: 'Netflix Inc.', category: 'mega_cap', categoryLabel: 'Mega-Cap Tech', exchange: 'Nasdaq', country: 'Verenigde Staten' },

  // 2. Semiconductors & Shovel Sellers
  { ticker: 'ASML', name: 'ASML Holding N.V.', category: 'semiconductors', categoryLabel: 'Semiconductors & Equipment', exchange: 'Euronext Amsterdam (AEX)', country: 'Nederland' },
  { ticker: 'TSM', name: 'Taiwan Semiconductor Manufacturing Co.', category: 'semiconductors', categoryLabel: 'Semiconductors & Equipment', exchange: 'Taiwan Stock Exchange (TWSE: 2330)', country: 'Taiwan' },
  { ticker: 'AVGO', name: 'Broadcom Inc.', category: 'semiconductors', categoryLabel: 'Semiconductors & Equipment', exchange: 'Nasdaq', country: 'Verenigde Staten' },
  { ticker: 'AMD', name: 'Advanced Micro Devices', category: 'semiconductors', categoryLabel: 'Semiconductors & Equipment', exchange: 'Nasdaq', country: 'Verenigde Staten' },
  { ticker: 'ARM', name: 'Arm Holdings plc', category: 'semiconductors', categoryLabel: 'Semiconductors & Equipment', exchange: 'Nasdaq', country: 'Verenigd Koninkrijk' },
  { ticker: 'AMAT', name: 'Applied Materials Inc.', category: 'semiconductors', categoryLabel: 'Semiconductors & Equipment', exchange: 'Nasdaq', country: 'Verenigde Staten' },
  { ticker: 'LRCX', name: 'Lam Research Corp.', category: 'semiconductors', categoryLabel: 'Semiconductors & Equipment', exchange: 'Nasdaq', country: 'Verenigde Staten' },
  { ticker: 'KLAC', name: 'KLA Corporation', category: 'semiconductors', categoryLabel: 'Semiconductors & Equipment', exchange: 'Nasdaq', country: 'Verenigde Staten' },
  { ticker: 'MU', name: 'Micron Technology Inc.', category: 'semiconductors', categoryLabel: 'Semiconductors & Equipment', exchange: 'Nasdaq', country: 'Verenigde Staten' },
  { ticker: 'INTC', name: 'Intel Corporation', category: 'semiconductors', categoryLabel: 'Semiconductors & Equipment', exchange: 'Nasdaq', country: 'Verenigde Staten' },
  { ticker: 'QCOM', name: 'Qualcomm Inc.', category: 'semiconductors', categoryLabel: 'Semiconductors & Equipment', exchange: 'Nasdaq', country: 'Verenigde Staten' },
  { ticker: 'MRVL', name: 'Marvell Technology Inc.', category: 'semiconductors', categoryLabel: 'Semiconductors & Equipment', exchange: 'Nasdaq', country: 'Verenigde Staten' },
  { ticker: 'TXN', name: 'Texas Instruments Inc.', category: 'semiconductors', categoryLabel: 'Semiconductors & Equipment', exchange: 'Nasdaq', country: 'Verenigde Staten' },
  { ticker: 'SNPS', name: 'Synopsys Inc.', category: 'semiconductors', categoryLabel: 'Semiconductors & Equipment', exchange: 'Nasdaq', country: 'Verenigde Staten' },
  { ticker: 'CDNS', name: 'Cadence Design Systems', category: 'semiconductors', categoryLabel: 'Semiconductors & Equipment', exchange: 'Nasdaq', country: 'Verenigde Staten' },
  { ticker: 'TOELY', name: 'Tokyo Electron Ltd.', category: 'semiconductors', categoryLabel: 'Semiconductors & Equipment', exchange: 'Tokyo Stock Exchange', country: 'Japan' },
  { ticker: 'BESI', name: 'BE Semiconductor Industries', category: 'europe', categoryLabel: 'Europese Champions', exchange: 'Euronext Amsterdam (AEX)', country: 'Nederland' },
  { ticker: 'ASMI', name: 'ASM International N.V.', category: 'europe', categoryLabel: 'Europese Champions', exchange: 'Euronext Amsterdam (AEX)', country: 'Nederland' },

  // 3. Enterprise Software, Cloud & AI Infrastructure
  { ticker: 'ORCL', name: 'Oracle Corporation', category: 'software', categoryLabel: 'Cloud & Enterprise Software', exchange: 'NYSE', country: 'Verenigde Staten' },
  { ticker: 'CRM', name: 'Salesforce, Inc.', category: 'software', categoryLabel: 'Cloud & Enterprise Software', exchange: 'NYSE', country: 'Verenigde Staten' },
  { ticker: 'NOW', name: 'ServiceNow Inc.', category: 'software', categoryLabel: 'Cloud & Enterprise Software', exchange: 'NYSE', country: 'Verenigde Staten' },
  { ticker: 'PLTR', name: 'Palantir Technologies', category: 'software', categoryLabel: 'Cloud & Enterprise Software', exchange: 'NYSE', country: 'Verenigde Staten' },
  { ticker: 'PANW', name: 'Palo Alto Networks', category: 'software', categoryLabel: 'Cloud & Enterprise Software', exchange: 'Nasdaq', country: 'Verenigde Staten' },
  { ticker: 'CRWD', name: 'CrowdStrike Holdings', category: 'software', categoryLabel: 'Cloud & Enterprise Software', exchange: 'Nasdaq', country: 'Verenigde Staten' },
  { ticker: 'SNOW', name: 'Snowflake Inc.', category: 'software', categoryLabel: 'Cloud & Enterprise Software', exchange: 'NYSE', country: 'Verenigde Staten' },
  { ticker: 'IBM', name: 'International Business Machines', category: 'software', categoryLabel: 'Cloud & Enterprise Software', exchange: 'NYSE', country: 'Verenigde Staten' },
  { ticker: 'UBER', name: 'Uber Technologies Inc.', category: 'software', categoryLabel: 'Cloud & Enterprise Software', exchange: 'NYSE', country: 'Verenigde Staten' },
  { ticker: 'ABNB', name: 'Airbnb Inc.', category: 'software', categoryLabel: 'Cloud & Enterprise Software', exchange: 'Nasdaq', country: 'Verenigde Staten' },
  { ticker: 'DELL', name: 'Dell Technologies Inc.', category: 'software', categoryLabel: 'AI Infrastructure', exchange: 'NYSE', country: 'Verenigde Staten' },
  { ticker: 'HPE', name: 'Hewlett Packard Enterprise', category: 'software', categoryLabel: 'AI Infrastructure', exchange: 'NYSE', country: 'Verenigde Staten' },
  { ticker: 'SMCI', name: 'Super Micro Computer', category: 'software', categoryLabel: 'AI Infrastructure', exchange: 'Nasdaq', country: 'Verenigde Staten' },

  // 4. Europese Champions & Industrials
  { ticker: 'SAP', name: 'SAP SE', category: 'europe', categoryLabel: 'Europese Champions', exchange: 'Deutsche Börse (XETRA)', country: 'Duitsland' },
  { ticker: 'SPOT', name: 'Spotify Technology S.A.', category: 'europe', categoryLabel: 'Europese Champions', exchange: 'NYSE', country: 'Zweden' },
  { ticker: 'PRX', name: 'Prosus N.V.', category: 'europe', categoryLabel: 'Europese Champions', exchange: 'Euronext Amsterdam (AEX)', country: 'Nederland' },
  { ticker: 'ADYEN', name: 'Adyen N.V.', category: 'europe', categoryLabel: 'Europese Champions', exchange: 'Euronext Amsterdam (AEX)', country: 'Nederland' },
  { ticker: 'IFX', name: 'Infineon Technologies AG', category: 'europe', categoryLabel: 'Europese Champions', exchange: 'Deutsche Börse (XETRA)', country: 'Duitsland' },
  { ticker: 'STM', name: 'STMicroelectronics N.V.', category: 'europe', categoryLabel: 'Europese Champions', exchange: 'Euronext Paris', country: 'Frankrijk' },
  { ticker: 'SU', name: 'Schneider Electric SE', category: 'europe', categoryLabel: 'Europese Champions', exchange: 'Euronext Paris', country: 'Frankrijk' },
  { ticker: 'SIE', name: 'Siemens AG', category: 'europe', categoryLabel: 'Europese Champions', exchange: 'Deutsche Börse (XETRA)', country: 'Duitsland' },

  // 5. Financials & Alternative Asset Managers
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.', category: 'financials', categoryLabel: 'Financials & Banking', exchange: 'NYSE', country: 'Verenigde Staten' },
  { ticker: 'BAC', name: 'Bank of America Corp.', category: 'financials', categoryLabel: 'Financials & Banking', exchange: 'NYSE', country: 'Verenigde Staten' },
  { ticker: 'GS', name: 'Goldman Sachs Group', category: 'financials', categoryLabel: 'Financials & Banking', exchange: 'NYSE', country: 'Verenigde Staten' },
  { ticker: 'MS', name: 'Morgan Stanley', category: 'financials', categoryLabel: 'Financials & Banking', exchange: 'NYSE', country: 'Verenigde Staten' },
  { ticker: 'BX', name: 'Blackstone Inc.', category: 'financials', categoryLabel: 'Financials & Banking', exchange: 'NYSE', country: 'Verenigde Staten' },
  { ticker: 'KKR', name: 'KKR & Co. Inc.', category: 'financials', categoryLabel: 'Financials & Banking', exchange: 'NYSE', country: 'Verenigde Staten' },

  // 6. Aerospace & Defense
  { ticker: 'RTX', name: 'RTX Corporation', category: 'aerospace', categoryLabel: 'Aerospace & Defense', exchange: 'NYSE', country: 'Verenigde Staten' },
  { ticker: 'GE', name: 'GE Aerospace', category: 'aerospace', categoryLabel: 'Aerospace & Defense', exchange: 'NYSE', country: 'Verenigde Staten' },
  { ticker: 'LMT', name: 'Lockheed Martin Corp.', category: 'aerospace', categoryLabel: 'Aerospace & Defense', exchange: 'NYSE', country: 'Verenigde Staten' }
];

export const CANONICAL_NEWS_AGENT_TICKERS = ['ASML', 'MSFT', 'NVDA', 'TSM'];

export const ALL_APP_TICKERS = ALL_APP_STOCKS.map(s => s.ticker);
