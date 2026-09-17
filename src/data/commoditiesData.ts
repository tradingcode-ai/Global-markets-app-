import { CommodityItem } from '../types';

export const COMMODITIES_DATA: CommodityItem[] = [
  // 1. European Natural Gas (Dutch TTF)
  {
    id: 'dutch-ttf',
    name: 'Dutch TTF Natural Gas',
    symbol: 'TTF',
    category: 'Energy & Natural Gas',
    marketCode: 'ICE: TTF',
    unit: 'EUR/MWh',
    currentPrice: 36.85,
    change: 0.95,
    changePercent: 2.65,
    dayHigh: 37.40,
    dayLow: 35.80,
    volume: '142,500 lots',
    currency: 'EUR',
    curveStructure: 'Backwardation',
    inventoryStatus: 'EU Storage 92.4% Full (108.5 bcm)',
    crackSpreadOrMargin: 'Spark Spread: €14.20/MWh',
    primaryBenchmarkRole: 'Primary European Natural Gas & Power Generation Benchmark (Title Transfer Facility, Netherlands)',
    sparkline: [35.20, 35.80, 36.10, 35.90, 36.40, 36.85],
    consensusTarget: '€37.50 / MWh',
    consensusRange: { low: 32.00, high: 41.50, avg: 36.80 },
    macroFactors: [
      'EU underground storage tracking ~92% capacity ahead of heating withdrawal season',
      'Global LNG cargo competition with Asian buyers (JKM benchmark spread)',
      'Expiration of Ukraine-Russia gas transit pipeline pact at end of 2024/2025',
      'Norwegian offshore continental shelf maintenance cycles (Troll & Kollsnes)'
    ],
    analystOutlooks: [
      {
        bankName: 'Goldman Sachs',
        logoColor: 'text-blue-700 bg-blue-50 border-blue-200',
        targetPrice: '€38.00 / MWh',
        targetPriceNumeric: 38.00,
        timeHorizon: 'Q4 2026 Target',
        stance: 'Neutral',
        thesis: 'European storage will exit summer at comfortable fullness, but persistent LNG competition from Asia and potential late-winter cold snaps maintain upside tail risk. Russian pipeline transit expiration introduces a structural €4-€6 premium risk.',
        catalysts: ['Winter weather severity in NW Europe', 'Asian LNG spot import competition', 'Freeport & Sabine Pass LNG terminal uptime'],
        lastUpdated: 'September 2026'
      },
      {
        bankName: 'J.P. Morgan',
        logoColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
        targetPrice: '€41.50 / MWh',
        targetPriceNumeric: 41.50,
        timeHorizon: 'Winter 2026 Peak',
        stance: 'Bullish',
        thesis: 'Tight global LNG flexible cargo balance. Any unplanned Norwegian continental shelf outages rapidly re-tightens northwest Europe, driving gas-to-coal switching boundaries higher.',
        catalysts: ['Norwegian pipeline export consistency', 'Middle East geopolitical shipping disruption', 'Industrial gas demand recovery in Germany'],
        lastUpdated: 'September 2026'
      },
      {
        bankName: 'Morgan Stanley',
        logoColor: 'text-slate-800 bg-slate-100 border-slate-300',
        targetPrice: '€35.00 / MWh',
        targetPriceNumeric: 35.00,
        timeHorizon: '12-Month Target',
        stance: 'Neutral',
        thesis: 'Industrial demand in Germany and Italy remains structurally depressed by -12% vs 2021 baselines. New global LNG liquefaction waves from Qatar and US Gulf Coast in 2026/27 will cap upside spikes.',
        catalysts: ['European chemical sector operating rates', 'New Qatar North Field LNG supply contracts', 'Renewable power displacement in summer'],
        lastUpdated: 'August 2026'
      },
      {
        bankName: 'Citi',
        logoColor: 'text-sky-700 bg-sky-50 border-sky-200',
        targetPrice: '€32.00 / MWh',
        targetPriceNumeric: 32.00,
        timeHorizon: '2027 Full Year',
        stance: 'Bearish',
        thesis: 'Structural wave of global LNG supply from Golden Pass, Plaquemines, and Qatar North Field East adds over 180 bcm/yr into 2027, transitioning the European market into long-term oversupply.',
        catalysts: ['US Gulf Coast LNG train commissioning', 'German renewable generation capacity additions', 'Subdued European industrial manufacturing PMI'],
        lastUpdated: 'August 2026'
      }
    ]
  },

  // 2. US Henry Hub Natural Gas
  {
    id: 'henry-hub',
    name: 'Henry Hub Natural Gas',
    symbol: 'NG',
    category: 'Energy & Natural Gas',
    marketCode: 'NYMEX: NG',
    unit: 'USD/MMBtu',
    currentPrice: 2.85,
    change: 0.08,
    changePercent: 2.89,
    dayHigh: 2.92,
    dayLow: 2.76,
    volume: '285,400 contracts',
    currency: 'USD',
    curveStructure: 'Contango',
    inventoryStatus: 'EIA Working Gas: 3,445 Bcf (+215 Bcf vs 5-yr avg)',
    crackSpreadOrMargin: 'US-Europe LNG Netback: ~$7.10/MMBtu',
    primaryBenchmarkRole: 'North American Physical Delivery Natural Gas Benchmark (Erath, Louisiana Hub)',
    sparkline: [2.65, 2.72, 2.78, 2.74, 2.81, 2.85],
    consensusTarget: '$3.30 / MMBtu',
    consensusRange: { low: 2.50, high: 3.85, avg: 3.25 },
    macroFactors: [
      'Rapidly scaling US Gulf Coast LNG feedgas demand (Plaquemines, Corpus Christi Stage 3)',
      'Associated gas production growth from Permian shale basin drilling',
      'Power sector AI data center cooling loads driving domestic summer burn records',
      'Haynesville dry gas rig count discipline defending price support'
    ],
    analystOutlooks: [
      {
        bankName: 'Goldman Sachs',
        logoColor: 'text-blue-700 bg-blue-50 border-blue-200',
        targetPrice: '$3.40 / MMBtu',
        targetPriceNumeric: 3.40,
        timeHorizon: 'Winter 2026/27',
        stance: 'Bullish',
        thesis: 'LNG export capacity expansion of +3.5 Bcf/d absorbs excess domestic inventories, shifting Henry Hub from structural surplus to demand-driven tightening.',
        catalysts: ['LNG feedgas nominations at Sabine & Calcasieu', 'Winter heating degree days (HDDs)', 'Coal-to-gas power generation switching threshold'],
        lastUpdated: 'September 2026'
      },
      {
        bankName: 'Morgan Stanley',
        logoColor: 'text-slate-800 bg-slate-100 border-slate-300',
        targetPrice: '$3.60 / MMBtu',
        targetPriceNumeric: 3.60,
        timeHorizon: '2027 Average',
        stance: 'Bullish',
        thesis: 'Hyperscaler data center power purchase agreements (PPAs) for combined-cycle gas turbines (CCGT) create persistent year-round baseload demand floor.',
        catalysts: ['PJM & ERCOT data center grid connection approvals', 'Permian Matterhorn pipeline egress flows'],
        lastUpdated: 'August 2026'
      },
      {
        bankName: 'Bank of America',
        logoColor: 'text-red-700 bg-red-50 border-red-200',
        targetPrice: '$2.95 / MMBtu',
        targetPriceNumeric: 2.95,
        timeHorizon: '12-Month Target',
        stance: 'Neutral',
        thesis: 'Permian associated gas volume elasticities keep domestic storage comfortable, limiting aggressive multi-month price spikes above $4.00.',
        catalysts: ['Oil-directed drilling in Delaware Basin', 'Storage injection pace through October'],
        lastUpdated: 'September 2026'
      }
    ]
  },

  // 3. Asian LNG Benchmark (JKM)
  {
    id: 'jkm-lng',
    name: 'Platts JKM LNG (Japan Korea Marker)',
    symbol: 'JKM',
    category: 'Energy & Natural Gas',
    marketCode: 'S&P Platts / CME: JKM',
    unit: 'USD/MMBtu',
    currentPrice: 13.40,
    change: 0.28,
    changePercent: 2.13,
    dayHigh: 13.65,
    dayLow: 13.15,
    volume: '34,200 lots',
    currency: 'USD',
    curveStructure: 'Backwardation',
    inventoryStatus: 'Japanese Power Utility Stocks: 2.15M tonnes (Healthy)',
    crackSpreadOrMargin: 'JKM-TTF Spread: +$1.85/MMBtu (Pacific Premium)',
    primaryBenchmarkRole: 'Standard spot LNG price benchmark delivered ex-ship (DES) into Japan, South Korea, China, and Taiwan',
    sparkline: [12.80, 13.05, 13.15, 13.10, 13.25, 13.40],
    consensusTarget: '$14.20 / MMBtu',
    consensusRange: { low: 11.50, high: 16.50, avg: 13.90 },
    macroFactors: [
      'Northeast Asian peak winter heating and power demand ramp-up',
      'Chinese industrial gas demand substitution vs pipeline Central Asian supply',
      'Red Sea and Suez Canal transit avoidance rerouting cargoes around Cape of Good Hope',
      'Japanese nuclear restarts gradually dampening LNG spot power burn'
    ],
    analystOutlooks: [
      {
        bankName: 'J.P. Morgan',
        logoColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
        targetPrice: '$15.00 / MMBtu',
        targetPriceNumeric: 15.00,
        timeHorizon: 'Q1 2027 Target',
        stance: 'Bullish',
        thesis: 'Asian spot appetite remains resilient as emerging South and Southeast Asia (Vietnam, Philippines, India) expand regasification throughput alongside peak Chinese winter demand.',
        catalysts: ['Northeast Asian winter chill', 'Australian Gorgon/Wheatstone maintenance', 'Panama Canal LNG slot availability'],
        lastUpdated: 'September 2026'
      },
      {
        bankName: 'UBS',
        logoColor: 'text-zinc-700 bg-zinc-100 border-zinc-300',
        targetPrice: '$12.80 / MMBtu',
        targetPriceNumeric: 12.80,
        timeHorizon: 'Full Year 2027',
        stance: 'Neutral',
        thesis: 'Expanding Pacific basin liquefaction and continued Japanese reactor reactivation will compress the JKM-TTF arbitrage spread.',
        catalysts: ['Kansai Electric nuclear operating factors', 'China domestic renewable capacity growth'],
        lastUpdated: 'August 2026'
      }
    ]
  },

  // 4. WTI Crude Oil
  {
    id: 'wti-crude',
    name: 'WTI Light Sweet Crude Oil',
    symbol: 'WTI',
    category: 'Crude Oil & Refined',
    marketCode: 'NYMEX: CL',
    unit: 'USD/barrel',
    currentPrice: 74.20,
    change: 0.85,
    changePercent: 1.16,
    dayHigh: 74.85,
    dayLow: 73.10,
    volume: '385,200 contracts',
    currency: 'USD',
    curveStructure: 'Backwardation',
    inventoryStatus: 'Cushing Storage: 24.8M bbls (Near operational bottoms)',
    crackSpreadOrMargin: '3:2:1 Crack Spread: $19.45/bbl',
    primaryBenchmarkRole: 'Primary US and North American Petroleum Benchmark (Cushing, Oklahoma physical delivery)',
    sparkline: [72.80, 73.40, 73.90, 73.50, 74.10, 74.20],
    consensusTarget: '$78.00 / bbl',
    consensusRange: { low: 68.00, high: 86.00, avg: 76.50 },
    macroFactors: [
      'US Permian and Bakken production plateauing around ~13.4 mb/d due to capital discipline',
      'US Strategic Petroleum Reserve (SPR) steady monthly replenishment bids (~$70-$72 floor)',
      'Refinery utilization across US Gulf Coast and Midwest hovering at 93.5%',
      'Cushing, Oklahoma storage tank levels operating near operational bottom boundaries'
    ],
    analystOutlooks: [
      {
        bankName: 'Goldman Sachs',
        logoColor: 'text-blue-700 bg-blue-50 border-blue-200',
        targetPrice: '$77.00 / bbl',
        targetPriceNumeric: 77.00,
        timeHorizon: '12-Month Target',
        stance: 'Neutral',
        thesis: 'Permian efficiency gains are slowing down while E&P M&A consolidation (Exxon-Pioneer, Diamondback-Endeavor) enforces shareholder cash return over volume growth.',
        catalysts: ['US weekly EIA inventory draws', 'Permian horizontal rig count stability', 'SPR crude purchase solicitations'],
        lastUpdated: 'September 2026'
      },
      {
        bankName: 'Citi',
        logoColor: 'text-sky-700 bg-sky-50 border-sky-200',
        targetPrice: '$68.00 / bbl',
        targetPriceNumeric: 68.00,
        timeHorizon: 'End 2026 Target',
        stance: 'Bearish',
        thesis: 'Non-OPEC deepwater additions from Guyana, Brazil, and Canada combined with EV penetration in light passenger fleets creates supply surpluses into 2027.',
        catalysts: ['Guyana FPSO Errea Wittu startup', 'OPEC+ voluntary cut unwind timeline', 'Global refinery margins'],
        lastUpdated: 'August 2026'
      },
      {
        bankName: 'Standard Chartered',
        logoColor: 'text-teal-700 bg-teal-50 border-teal-200',
        targetPrice: '$83.00 / bbl',
        targetPriceNumeric: 83.00,
        timeHorizon: 'Winter 2026 Peak',
        stance: 'Bullish',
        thesis: 'Speculative money manager positioning is excessively short. Any unexpected geopolitical catalyst or prompt Cushing delivery squeeze will trigger rapid short-covering.',
        catalysts: ['CFTC net speculative length', 'Cushing tank farm inventory levels', 'US hurricane season interruptions'],
        lastUpdated: 'September 2026'
      }
    ]
  },

  // 5. Brent Crude Oil
  {
    id: 'brent-crude',
    name: 'Brent Crude Oil (ICE)',
    symbol: 'BRENT',
    category: 'Crude Oil & Refined',
    marketCode: 'ICE: B',
    unit: 'USD/barrel',
    currentPrice: 78.40,
    change: 0.90,
    changePercent: 1.16,
    dayHigh: 79.15,
    dayLow: 77.30,
    volume: '412,000 contracts',
    currency: 'USD',
    curveStructure: 'Backwardation',
    inventoryStatus: 'OECD Commercial Stocks: 74 days forward demand cover',
    crackSpreadOrMargin: 'Brent-WTI Spread: +$4.20/bbl (Seaborne freight parity)',
    primaryBenchmarkRole: 'Global Seaborne Crude Oil Benchmark pricing over 65% of internationally traded physical oil',
    sparkline: [76.90, 77.50, 78.10, 77.80, 78.20, 78.40],
    consensusTarget: '$82.50 / bbl',
    consensusRange: { low: 72.00, high: 90.00, avg: 80.80 },
    macroFactors: [
      'OPEC+ 8-member coalition voluntary output cuts management and gradual phase-in strategy',
      'Red Sea and Bab-el-Mandeb maritime shipping friction adding 12-14 days sailing around Africa',
      'Global spare capacity concentrated in Saudi Arabia and UAE (~5.2 mb/d buffer)',
      'Chinese crude import quotas and state strategic petroleum reserve builds'
    ],
    analystOutlooks: [
      {
        bankName: 'J.P. Morgan',
        logoColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
        targetPrice: '$85.00 / bbl',
        targetPriceNumeric: 85.00,
        timeHorizon: 'Q4 2026 Average',
        stance: 'Bullish',
        thesis: 'Global oil demand expands by +1.3 mb/d led by aviation jet fuel and emerging petrochemical feedstocks. OPEC+ will remain proactive in defending the $75-$85 band.',
        catalysts: ['OPEC+ Ministerial monitoring committee decisions', 'Middle East geopolitical risks', 'OECD commercial inventory deficits'],
        lastUpdated: 'September 2026'
      },
      {
        bankName: 'Morgan Stanley',
        logoColor: 'text-slate-800 bg-slate-100 border-slate-300',
        targetPrice: '$80.00 / bbl',
        targetPriceNumeric: 80.00,
        timeHorizon: '12-Month Target',
        stance: 'Neutral',
        thesis: 'Market is in balanced equilibrium. Supply growth from the Americas (US, Guyana, Brazil, Canada) roughly matches incremental demand.',
        catalysts: ['Global mobility indicators', 'Tanker charter rates (VLCC dirty freight)', 'China teapot refinery run rates'],
        lastUpdated: 'August 2026'
      },
      {
        bankName: 'Goldman Sachs',
        logoColor: 'text-blue-700 bg-blue-50 border-blue-200',
        targetPrice: '$82.00 / bbl',
        targetPriceNumeric: 82.00,
        timeHorizon: 'Average 2026-2027',
        stance: 'Neutral',
        thesis: 'Project a range of $75 to $85 per barrel. Price ceiling capped by ~5.5 mb/d of OPEC spare capacity; floor defended by low OECD inventories and attractive valuation.',
        catalysts: ['Saudi official selling prices (OSPs) to Asia', 'Fed rate cutting cycle impact on dollar', 'Non-OPEC deepwater execution'],
        lastUpdated: 'September 2026'
      }
    ]
  },

  // 6. Murban Crude Oil
  {
    id: 'murban-crude',
    name: 'Murban Crude Oil (IFAD)',
    symbol: 'MURBAN',
    category: 'Crude Oil & Refined',
    marketCode: 'ICE Futures Abu Dhabi: MBN',
    unit: 'USD/barrel',
    currentPrice: 122.85,
    change: 1.65,
    changePercent: 1.36,
    dayHigh: 124.20,
    dayLow: 121.50,
    volume: '98,400 contracts',
    currency: 'USD',
    curveStructure: 'Backwardation',
    inventoryStatus: 'Fujairah Commercial Terminal: 19.8M bbls',
    crackSpreadOrMargin: 'Murban OSP Differential: +$1.25/bbl to Dubai',
    primaryBenchmarkRole: 'Premier Middle Eastern Light Sour Crude Benchmark with direct Indian Ocean pipeline bypass to Fujairah (ICE IFAD)',
    sparkline: [120.50, 121.30, 122.10, 121.80, 122.40, 122.85],
    consensusTarget: '$126.00 / bbl',
    consensusRange: { low: 112.00, high: 138.00, avg: 125.50 },
    macroFactors: [
      'ADNOC pipeline link delivering 1.8 mb/d directly to Fujairah, bypassing Strait of Hormuz',
      'High naphtha and middle distillate yields commanding strong pricing among East Asian refiners',
      'Expansion of ADNOC maximum sustained production capacity toward 5.0 mb/d',
      'Growing physical delivery delivery share across Indian and Southeast Asian refiners'
    ],
    analystOutlooks: [
      {
        bankName: 'Goldman Sachs',
        logoColor: 'text-blue-700 bg-blue-50 border-blue-200',
        targetPrice: '$80.50 / bbl',
        targetPriceNumeric: 80.50,
        timeHorizon: '12-Month Target',
        stance: 'Neutral',
        thesis: 'Murban continues to gain market share against Dubai and Oman benchmarks due to superior logistical security via Fujairah deepwater terminal.',
        catalysts: ['IFAD exchange physical delivery volumes', 'East Asian naphtha petrochemical margins', 'ADNOC upstream production quotas'],
        lastUpdated: 'September 2026'
      },
      {
        bankName: 'UBS',
        logoColor: 'text-zinc-700 bg-zinc-100 border-zinc-300',
        targetPrice: '$83.00 / bbl',
        targetPriceNumeric: 83.00,
        timeHorizon: 'Q1 2027 Target',
        stance: 'Bullish',
        thesis: 'Indian refiners are structurally tilting import slates away from Russian Urals toward Middle Eastern light sour grades like Murban with transparent futures pricing.',
        catalysts: ['Indian crude import slate diversification', 'Fujairah bunker and storage utilization', 'Asia-Pacific refiner gross margins'],
        lastUpdated: 'August 2026'
      }
    ]
  },

  // 7. Shanghai Crude (INE)
  {
    id: 'shanghai-crude',
    name: 'Shanghai International Energy Exchange Crude',
    symbol: 'INE-SC',
    category: 'Crude Oil & Refined',
    marketCode: 'INE: SC',
    unit: 'CNY/barrel',
    currentPrice: 552.50,
    change: 5.80,
    changePercent: 1.06,
    dayHigh: 556.80,
    dayLow: 546.20,
    volume: '165,000 contracts',
    currency: 'CNY',
    curveStructure: 'Contango',
    inventoryStatus: 'INE Bonded Tank Farm Stocks: 8.9M bbls',
    crackSpreadOrMargin: 'Dollar Equivalent: ~$77.80/bbl',
    primaryBenchmarkRole: 'Asia-Pacific RMB-denominated physical crude futures benchmark reflecting delivered Middle East sour grades into China',
    sparkline: [542.00, 546.50, 550.00, 548.20, 551.00, 552.50],
    consensusTarget: '¥575.00 / bbl',
    consensusRange: { low: 510.00, high: 620.00, avg: 565.00 },
    macroFactors: [
      'PBOC monetary liquidity measures and infrastructure stimulus spending',
      'Import arbitrage convergence with Dubai and Oman prompt physical cargo swaps',
      'Petrochemical mega-complex run rates (Zhejiang Petrochemical, Hengli, Shenghong)',
      'Chinese commercial and state strategic crude stockholding accumulation'
    ],
    analystOutlooks: [
      {
        bankName: 'Bank of America',
        logoColor: 'text-red-700 bg-red-50 border-red-200',
        targetPrice: '¥580.00 / bbl',
        targetPriceNumeric: 580.00,
        timeHorizon: 'Q4 2026 Target',
        stance: 'Neutral',
        thesis: 'Chinese independent teapots and state majors maintain high sour crude demand as petrochemical demand offsets slower domestic diesel consumption.',
        catalysts: ['Ministry of Commerce import quota batch announcements', 'USD/CNY exchange rate movements', 'Chinese retail fuel price adjustments'],
        lastUpdated: 'September 2026'
      },
      {
        bankName: 'Morgan Stanley',
        logoColor: 'text-slate-800 bg-slate-100 border-slate-300',
        targetPrice: '¥560.00 / bbl',
        targetPriceNumeric: 560.00,
        timeHorizon: '12-Month Target',
        stance: 'Neutral',
        thesis: 'INE prices will closely track Brent and Oman physical parity, with RMB valuation playing a key role in domestic crack economics.',
        catalysts: ['China coastal port congestion', 'Domestic petrochemical ethylene crack margins'],
        lastUpdated: 'August 2026'
      }
    ]
  },

  // 8. RBOB Gasoline
  {
    id: 'rbob-gasoline',
    name: 'RBOB Reformulated Gasoline',
    symbol: 'RBOB',
    category: 'Crude Oil & Refined',
    marketCode: 'NYMEX: RB',
    unit: 'USD/gallon',
    currentPrice: 2.24,
    change: 0.03,
    changePercent: 1.36,
    dayHigh: 2.27,
    dayLow: 2.20,
    volume: '82,400 contracts',
    currency: 'USD',
    curveStructure: 'Backwardation',
    inventoryStatus: 'EIA Total Motor Gasoline: 220.5M bbls (-2.1% YoY)',
    crackSpreadOrMargin: 'Gasoline Crack Spread: ~$20.25/bbl',
    primaryBenchmarkRole: 'Standard US and Atlantic Basin finished motor gasoline contract deliverable into New York Harbor',
    sparkline: [2.16, 2.19, 2.22, 2.21, 2.23, 2.24],
    consensusTarget: '$2.38 / gal',
    consensusRange: { low: 2.05, high: 2.65, avg: 2.35 },
    macroFactors: [
      'US vehicle miles traveled (VMT) and seasonal highway driving trends',
      'Atlantic basin refinery FCC unit utilization and turnaround schedules',
      'Blendstock and alkylate availability during summer vs winter Reid Vapor Pressure (RVP) transitions',
      'Gasoline export arbitrage to Latin America (Mexico, Brazil)'
    ],
    analystOutlooks: [
      {
        bankName: 'Goldman Sachs',
        logoColor: 'text-blue-700 bg-blue-50 border-blue-200',
        targetPrice: '$2.45 / gal',
        targetPriceNumeric: 2.45,
        timeHorizon: 'Seasonal Peak',
        stance: 'Bullish',
        thesis: 'Tight refinery conversion capacity in the US Northeast post-refinery closures leaves New York Harbor vulnerable to sudden logistical inventory draws.',
        catalysts: ['US East Coast (PADD 1) inventory levels', 'Colonial Pipeline flow nominations', 'European gasoline export arbitrage'],
        lastUpdated: 'September 2026'
      },
      {
        bankName: 'Citi',
        logoColor: 'text-sky-700 bg-sky-50 border-sky-200',
        targetPrice: '$2.15 / gal',
        targetPriceNumeric: 2.15,
        timeHorizon: 'Winter 2026',
        stance: 'Bearish',
        thesis: 'Post-summer driving season demand decline combined with increasing fleet fuel economy and EV adoption will loosen Atlantic gasoline balances.',
        catalysts: ['Post-Labor Day driving demand drop', 'Winter grade RVP blending economics'],
        lastUpdated: 'August 2026'
      }
    ]
  },

  // 9. Ultra-Low Sulfur Diesel / Heating Oil
  {
    id: 'heating-oil',
    name: 'ULSD Heating Oil & Diesel',
    symbol: 'HO',
    category: 'Crude Oil & Refined',
    marketCode: 'NYMEX: HO',
    unit: 'USD/gallon',
    currentPrice: 2.42,
    change: 0.04,
    changePercent: 1.68,
    dayHigh: 2.45,
    dayLow: 2.37,
    volume: '71,600 contracts',
    currency: 'USD',
    curveStructure: 'Backwardation',
    inventoryStatus: 'Distillate Fuel Oil Stocks: 122.8M bbls (Below 5-yr norm)',
    crackSpreadOrMargin: 'Diesel Crack Spread: ~$27.40/bbl',
    primaryBenchmarkRole: 'North American and European distillate benchmark (Ultra-Low Sulfur Diesel #2 and Heating Oil)',
    sparkline: [2.32, 2.36, 2.39, 2.38, 2.40, 2.42],
    consensusTarget: '$2.60 / gal',
    consensusRange: { low: 2.20, high: 2.85, avg: 2.55 },
    macroFactors: [
      'Global freight trucking, railroad, and industrial manufacturing diesel burn',
      'Northeast US residential heating oil winter demand sensitivity',
      'European gasoil import dependency on Middle East and India post-Russian ban',
      'Hydrocracker refinery processing runs and sulfur unit uptime'
    ],
    analystOutlooks: [
      {
        bankName: 'J.P. Morgan',
        logoColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
        targetPrice: '$2.70 / gal',
        targetPriceNumeric: 2.70,
        timeHorizon: 'Q4 2026 Target',
        stance: 'Bullish',
        thesis: 'Global middle distillate inventories remain tight on structural refinery closures in Europe and US. Winter diesel heating demand provides strong prompt support.',
        catalysts: ['Freight freight ton-mile volume', 'European gasoil tanker arrivals from Jamnagar/Jubail', 'Winter weather chill'],
        lastUpdated: 'September 2026'
      },
      {
        bankName: 'UBS',
        logoColor: 'text-zinc-700 bg-zinc-100 border-zinc-300',
        targetPrice: '$2.50 / gal',
        targetPriceNumeric: 2.50,
        timeHorizon: '12-Month Target',
        stance: 'Neutral',
        thesis: 'Industrial macroeconomic softness in Europe and North America limits runaway upside for freight diesel, keeping cracks within historical $22-$28/bbl channels.',
        catalysts: ['Manufacturing PMI new export orders', 'Global refinery secondary unit uptime'],
        lastUpdated: 'August 2026'
      }
    ]
  },

  // 10. Gold (Spot / COMEX)
  {
    id: 'gold',
    name: 'Gold (COMEX / London Spot)',
    symbol: 'GOLD',
    category: 'Precious Metals',
    marketCode: 'COMEX: GC / XAU',
    unit: 'USD/troy oz',
    currentPrice: 2548.50,
    change: 14.80,
    changePercent: 0.58,
    dayHigh: 2562.00,
    dayLow: 2531.00,
    volume: '228,000 contracts',
    currency: 'USD',
    curveStructure: 'Contango',
    inventoryStatus: 'Global Central Bank Gold Reserves: +1,050t annualized net purchases',
    crackSpreadOrMargin: 'Gold/Silver Ratio: 84.5x',
    primaryBenchmarkRole: 'Primary Global Monetary Safe-Haven, Central Bank Reserve Asset, and Inflation Hedge',
    sparkline: [2510.00, 2525.00, 2540.00, 2535.00, 2542.00, 2548.50],
    consensusTarget: '$2,700 / oz',
    consensusRange: { low: 2400.00, high: 2900.00, avg: 2650.00 },
    macroFactors: [
      'Federal Reserve, ECB, and BOE monetary easing cycles and real 10-year US Treasury yield trends',
      'Structural sovereign de-dollarization and central bank net purchasing (PBOC, RBI, Turkey)',
      'Geopolitical tail-risk hedge and safe-haven liquidity demand',
      'Western physical Gold ETF inflows resuming after multi-year hiatus'
    ],
    analystOutlooks: [
      {
        bankName: 'Goldman Sachs',
        logoColor: 'text-blue-700 bg-blue-50 border-blue-200',
        targetPrice: '$2,700 / oz',
        targetPriceNumeric: 2700.00,
        timeHorizon: 'Mid 2027 Target',
        stance: 'Bullish',
        thesis: 'Reiterate high-conviction bullish recommendation. Unshakable structural central bank demand alongside physical ETF re-accumulation will drive gold toward record territory.',
        catalysts: ['Fed rate cutting pace', 'Central bank official monthly reserve filings', 'US fiscal deficit trajectory'],
        lastUpdated: 'September 2026'
      },
      {
        bankName: 'J.P. Morgan',
        logoColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
        targetPrice: '$2,850 / oz',
        targetPriceNumeric: 2850.00,
        timeHorizon: '2027 Bull Target',
        stance: 'Bullish',
        thesis: 'Gold remains top macro commodity pick. Long-term lower real US yields and persistent geopolitical fractures reinforce gold as the premier sovereign reserve anchor.',
        catalysts: ['US 10-year TIPS real yields', 'Global ETF tonnage holdings', 'Middle East / Taiwan geopolitical risk premia'],
        lastUpdated: 'September 2026'
      },
      {
        bankName: 'Citi',
        logoColor: 'text-sky-700 bg-sky-50 border-sky-200',
        targetPrice: '$2,600 / oz',
        targetPriceNumeric: 2600.00,
        timeHorizon: '12-Month Target',
        stance: 'Neutral',
        thesis: 'While central bank buying provides a rock-solid floor, physical jewelry demand in China and India has slowed due to high domestic spot retail prices.',
        catalysts: ['Indian Diwali festival import tariffs', 'Shanghai Gold Exchange physical premium'],
        lastUpdated: 'August 2026'
      }
    ]
  },

  // 11. Silver
  {
    id: 'silver',
    name: 'Silver (COMEX / London Spot)',
    symbol: 'SILVER',
    category: 'Precious Metals',
    marketCode: 'COMEX: SI / XAG',
    unit: 'USD/troy oz',
    currentPrice: 30.15,
    change: 0.45,
    changePercent: 1.52,
    dayHigh: 30.60,
    dayLow: 29.50,
    volume: '95,400 contracts',
    currency: 'USD',
    curveStructure: 'Backwardation',
    inventoryStatus: 'London Bullion Market (LBMA) Vaults: ~26,500 tonnes',
    crackSpreadOrMargin: 'Gold/Silver Ratio: 84.5x (Historical mean ~65x)',
    primaryBenchmarkRole: 'Dual-Role Precious Monetary & Industrial Transition Asset (Solar Photovoltaic, Electronics, EVs)',
    sparkline: [29.10, 29.40, 29.80, 29.60, 29.95, 30.15],
    consensusTarget: '$34.00 / oz',
    consensusRange: { low: 28.00, high: 38.00, avg: 33.20 },
    macroFactors: [
      'Booming photovoltaic (PV) solar panel manufacturing silver paste consumption (N-type TOPCon cells)',
      'Structural physical deficit in the silver market for the 4th consecutive year',
      'Strong beta to gold upward momentum during monetary easing cycles',
      'Automotive electrification and electronic interconnect solder demand'
    ],
    analystOutlooks: [
      {
        bankName: 'UBS',
        logoColor: 'text-zinc-700 bg-zinc-100 border-zinc-300',
        targetPrice: '$36.00 / oz',
        targetPriceNumeric: 36.00,
        timeHorizon: 'Q2 2027 Target',
        stance: 'Bullish',
        thesis: 'Silver offers superior high-beta leverage to gold rallies. The physical supply deficit is entrenched due to stagnant by-product lead/zinc mine output and explosive solar cell demand.',
        catalysts: ['Global solar gigawatt installation targets', 'COMEX registered vault withdrawals', 'Gold/silver ratio compression toward 70x'],
        lastUpdated: 'September 2026'
      },
      {
        bankName: 'Standard Chartered',
        logoColor: 'text-teal-700 bg-teal-50 border-teal-200',
        targetPrice: '$33.50 / oz',
        targetPriceNumeric: 33.50,
        timeHorizon: '12-Month Target',
        stance: 'Bullish',
        thesis: 'Institutional investor re-engagement through physically backed silver ETFs will amplify upward price discovery in a thin physical market.',
        catalysts: ['Silver Institute supply/demand deficit revisions', 'Chinese photovoltaic export volumes'],
        lastUpdated: 'August 2026'
      }
    ]
  },

  // 12. Copper (Doctor Copper)
  {
    id: 'copper',
    name: 'High Grade Copper (LME / COMEX)',
    symbol: 'COPPER',
    category: 'Industrial & Battery Metals',
    marketCode: 'LME: CA / COMEX: HG',
    unit: 'USD/lb',
    currentPrice: 4.38,
    change: 0.06,
    changePercent: 1.39,
    dayHigh: 4.44,
    dayLow: 4.30,
    volume: '118,500 contracts',
    currency: 'USD',
    curveStructure: 'Backwardation',
    inventoryStatus: 'LME & SHFE Combined Stocks: 380,000 tonnes',
    crackSpreadOrMargin: 'LME Cash/3M Backwardation: +$28.50/t',
    primaryBenchmarkRole: 'Global Economic Bellwether and Premier Energy Transition Metal (Grid, EVs, AI Data Centers)',
    sparkline: [4.22, 4.28, 4.34, 4.31, 4.35, 4.38],
    consensusTarget: '$4.85 / lb ($10,700 / t)',
    consensusRange: { low: 4.10, high: 5.40, avg: 4.75 },
    macroFactors: [
      'Unprecedented global electrical grid expansion and high-voltage transmission lines',
      'AI data center electrical busbars, transformer windings, and liquid cooling infrastructure',
      'Smelter treatment/refining charges (TC/RCs) collapsing near zero, proving mine concentrate shortages',
      'Chilean and Peruvian mine grade degradation and supply disruption (Cobre Panama closure)'
    ],
    analystOutlooks: [
      {
        bankName: 'Goldman Sachs',
        logoColor: 'text-blue-700 bg-blue-50 border-blue-200',
        targetPrice: '$5.20 / lb ($11,500 / t)',
        targetPriceNumeric: 5.20,
        timeHorizon: '2027 Full Year',
        stance: 'Bullish',
        thesis: 'Copper is our single highest-conviction base metal. The combination of structural concentrate shortages, near-zero smelter TC/RCs, and surging AI/grid demand will force global stockouts.',
        catalysts: ['Smelter production curtailments in China', 'Grid infrastructure spending budgets in China & Europe', 'Hyperscaler data center power wiring orders'],
        lastUpdated: 'September 2026'
      },
      {
        bankName: 'Morgan Stanley',
        logoColor: 'text-slate-800 bg-slate-100 border-slate-300',
        targetPrice: '$4.75 / lb ($10,500 / t)',
        targetPriceNumeric: 4.75,
        timeHorizon: '12-Month Target',
        stance: 'Bullish',
        thesis: 'Electric vehicle wiring and charging stations consume 3-4x more copper per vehicle than internal combustion engines. Even modest economic stabilization in China triggers market tightness.',
        catalysts: ['China State Grid procurement tenders', 'LME on-warrant inventory movements'],
        lastUpdated: 'August 2026'
      },
      {
        bankName: 'Citi',
        logoColor: 'text-sky-700 bg-sky-50 border-sky-200',
        targetPrice: '$4.30 / lb ($9,500 / t)',
        targetPriceNumeric: 4.30,
        timeHorizon: 'Near-Term 6M',
        stance: 'Neutral',
        thesis: 'Near-term upside is restrained by softness in traditional Chinese residential construction wire and cable demand, though long-term green drivers remain undeniable.',
        catalysts: ['Chinese property completion statistics', 'Cathode imports via bonded warehouses'],
        lastUpdated: 'September 2026'
      }
    ]
  },

  // 13. Uranium (U3O8)
  {
    id: 'uranium',
    name: 'Uranium Yellowcake (U3O8)',
    symbol: 'URANIUM',
    category: 'Industrial & Battery Metals',
    marketCode: 'UxC / CME: UX',
    unit: 'USD/lb U3O8',
    currentPrice: 84.50,
    change: 1.75,
    changePercent: 2.11,
    dayHigh: 85.50,
    dayLow: 82.00,
    volume: 'Physical / Off-Market Contracts',
    currency: 'USD',
    curveStructure: 'Backwardation',
    inventoryStatus: 'Global Utility Uncovered Requirements: >500M lbs through 2030',
    crackSpreadOrMargin: 'Long-Term Contract Price: $81.00/lb',
    primaryBenchmarkRole: 'Nuclear Fuel Cycle Feedstock powering baseload zero-carbon nuclear reactors and SMRs',
    sparkline: [79.00, 81.50, 82.00, 83.20, 83.80, 84.50],
    consensusTarget: '$98.00 / lb',
    consensusRange: { low: 78.00, high: 115.00, avg: 95.00 },
    macroFactors: [
      'Global nuclear reactor life extensions (US, Europe, Japan) and new build programs in China',
      'Big Tech AI hyperscalers securing direct behind-the-meter nuclear PPAs (Constellation-Microsoft, Amazon-Talen)',
      'Kazatomprom and Cameco production guidance downgrades from sulfuric acid shortages',
      'US ban on Russian enriched uranium imports spurring domestic supply security initiatives'
    ],
    analystOutlooks: [
      {
        bankName: 'Bank of America',
        logoColor: 'text-red-700 bg-red-50 border-red-200',
        targetPrice: '$105.00 / lb',
        targetPriceNumeric: 105.00,
        timeHorizon: '2027 Projection',
        stance: 'Bullish',
        thesis: 'Nuclear power renaissance driven by AI hyperscaler 24/7 clean baseload power needs is colliding with decade-long underinvestment in mine supply.',
        catalysts: ['Utility long-term procurement contract signings', 'Kazatomprom 2026/27 production volume targets', 'SMR design approvals'],
        lastUpdated: 'September 2026'
      },
      {
        bankName: 'Goldman Sachs',
        logoColor: 'text-blue-700 bg-blue-50 border-blue-200',
        targetPrice: '$95.00 / lb',
        targetPriceNumeric: 95.00,
        timeHorizon: '12-Month Target',
        stance: 'Bullish',
        thesis: 'Utility uncovered requirements are at 15-year highs. Utilities must re-contract at higher prices as secondary mobile supplies (enricher underfeeding) are exhausted.',
        catalysts: ['WNA (World Nuclear Association) symposium procurement data', 'Cameco McArthur River mine output'],
        lastUpdated: 'August 2026'
      }
    ]
  },

  // 14. Lithium Carbonate
  {
    id: 'lithium-carbonate',
    name: 'Lithium Carbonate (Battery Grade 99.5%)',
    symbol: 'LITHIUM',
    category: 'Industrial & Battery Metals',
    marketCode: 'Fastmarkets / GFEX: LC',
    unit: 'USD/tonne',
    currentPrice: 11800.00,
    change: 220.00,
    changePercent: 1.90,
    dayHigh: 12100.00,
    dayLow: 11500.00,
    volume: '22,400 tonnes',
    currency: 'USD',
    curveStructure: 'Contango',
    inventoryStatus: 'Upstream Lepidolite & Spodumene Port Stocks: High but plateauing',
    crackSpreadOrMargin: 'Hydroxide/Carbonate Spread: +$850/t',
    primaryBenchmarkRole: 'Core cathode chemical feedstock for Lithium-Iron-Phosphate (LFP) and Nickel-Manganese-Cobalt (NMC) EV batteries',
    sparkline: [11200, 11400, 11550, 11500, 11680, 11800],
    consensusTarget: '$14,500 / t',
    consensusRange: { low: 10000, high: 18000, avg: 13800 },
    macroFactors: [
      'High-cost Chinese lepidolite and Australian spodumene mine production curtailments setting price floor',
      'Global energy storage systems (BESS) deployments exploding at +45% YoY growth',
      'EV sales growth in China reaching over 50% penetration of new domestic vehicle sales',
      'Next-generation solid-state and silicon-anode battery technology commercialization'
    ],
    analystOutlooks: [
      {
        bankName: 'UBS',
        logoColor: 'text-zinc-700 bg-zinc-100 border-zinc-300',
        targetPrice: '$15,000 / t',
        targetPriceNumeric: 15000.00,
        timeHorizon: 'End 2026 Target',
        stance: 'Bullish',
        thesis: 'Current prices are below the 80th percentile of the cost curve. Supply cuts by marginal producers will balance the market faster than expected as grid storage demand surges.',
        catalysts: ['Mine shutdown announcements in Yichun, China', 'Global battery cell manufacturing utilization rates'],
        lastUpdated: 'September 2026'
      },
      {
        bankName: 'Goldman Sachs',
        logoColor: 'text-blue-700 bg-blue-50 border-blue-200',
        targetPrice: '$12,500 / t',
        targetPriceNumeric: 12500.00,
        timeHorizon: '12-Month Target',
        stance: 'Neutral',
        thesis: 'Sizable pipeline of low-cost South American brine projects (Argentina, Chile) will temper the pace of price recovery, keeping margins normalized.',
        catalysts: ['Catamarca and Salar de Atacama brine expansion timings', 'North American EV tax credit eligibility guidelines'],
        lastUpdated: 'August 2026'
      }
    ]
  },

  // 15. Chicago SRW Wheat
  {
    id: 'wheat',
    name: 'Chicago SRW Soft Red Winter Wheat',
    symbol: 'WHEAT',
    category: 'Agricultural & Softs',
    marketCode: 'CBOT: W',
    unit: 'USD/bushel',
    currentPrice: 5.82,
    change: 0.08,
    changePercent: 1.39,
    dayHigh: 5.91,
    dayLow: 5.74,
    volume: '94,000 contracts',
    currency: 'USD',
    curveStructure: 'Contango',
    inventoryStatus: 'USDA Global Ending Stocks: 256M tonnes (Tightest in 8 years excluding China)',
    crackSpreadOrMargin: 'Flour Milling Spread: Healthy',
    primaryBenchmarkRole: 'Global Food Security and Grains Benchmark traded on the Chicago Board of Trade',
    sparkline: [5.65, 5.72, 5.78, 5.75, 5.79, 5.82],
    consensusTarget: '$6.30 / bu',
    consensusRange: { low: 5.40, high: 7.10, avg: 6.20 },
    macroFactors: [
      'Black Sea grain corridor logistics and Russian export minimum price floor policy',
      'Weather anomalies across key growing regions (Australian dry spells, European wet harvests)',
      'Global wheat stocks-to-use ratios reaching multi-year lows outside of China',
      'Fertilizer input costs (natural gas ammonia prices) impacting future planting acreage'
    ],
    analystOutlooks: [
      {
        bankName: 'J.P. Morgan',
        logoColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
        targetPrice: '$6.50 / bu',
        targetPriceNumeric: 6.50,
        timeHorizon: 'Q1 2027 Target',
        stance: 'Bullish',
        thesis: 'European harvest yields were severely downgraded due to unseasonable rain, while Russian exportable surpluses are tighter than last season.',
        catalysts: ['USDA WASDE monthly report adjustments', 'Black Sea port infrastructure developments', 'Southern hemisphere wheat crop size'],
        lastUpdated: 'September 2026'
      },
      {
        bankName: 'Standard Chartered',
        logoColor: 'text-teal-700 bg-teal-50 border-teal-200',
        targetPrice: '$6.10 / bu',
        targetPriceNumeric: 6.10,
        timeHorizon: '12-Month Target',
        stance: 'Neutral',
        thesis: 'Abundant US winter wheat harvest balances European deficits, maintaining a stable range-bound trading corridor.',
        catalysts: ['US winter wheat emergence ratings', 'Egyptian GASC tender purchase prices'],
        lastUpdated: 'August 2026'
      }
    ]
  },

  // 16. Chicago Corn
  {
    id: 'corn',
    name: 'Chicago Corn Futures',
    symbol: 'CORN',
    category: 'Agricultural & Softs',
    marketCode: 'CBOT: C',
    unit: 'USD/bushel',
    currentPrice: 4.18,
    change: 0.05,
    changePercent: 1.21,
    dayHigh: 4.23,
    dayLow: 4.12,
    volume: '145,000 contracts',
    currency: 'USD',
    curveStructure: 'Contango',
    inventoryStatus: 'US Corn Ending Stocks: 2,050M bushels (Substantial cushion)',
    crackSpreadOrMargin: 'Ethanol Crush Margin: $0.38/gal',
    primaryBenchmarkRole: 'Premier Global Coarse Grains, Animal Feed, and Ethanol Biofuel Benchmark',
    sparkline: [4.05, 4.10, 4.15, 4.12, 4.16, 4.18],
    consensusTarget: '$4.50 / bu',
    consensusRange: { low: 3.85, high: 4.90, avg: 4.40 },
    macroFactors: [
      'US Midwest corn belt harvest yields and test weights',
      'Brazilian Safrinha (second crop) export competition into Asian markets',
      'Domestic US ethanol production blending quotas (E15 summer waivers)',
      'Global livestock feed demand from China and Southeast Asia'
    ],
    analystOutlooks: [
      {
        bankName: 'Goldman Sachs',
        logoColor: 'text-blue-700 bg-blue-50 border-blue-200',
        targetPrice: '$4.45 / bu',
        targetPriceNumeric: 4.45,
        timeHorizon: '12-Month Target',
        stance: 'Neutral',
        thesis: 'Strong US harvest buffers inventories, but strong ethanol crush demand and cheap export pricing stimulate international animal feed buying.',
        catalysts: ['Weekly USDA export sales figures', 'US ethanol refinery grind rates', 'Brazil planting progress'],
        lastUpdated: 'September 2026'
      },
      {
        bankName: 'Bank of America',
        logoColor: 'text-red-700 bg-red-50 border-red-200',
        targetPrice: '$4.60 / bu',
        targetPriceNumeric: 4.60,
        timeHorizon: 'Winter 2026/27',
        stance: 'Bullish',
        thesis: 'Farmer selling discipline at low price points will support cash basis levels, limiting downside below $4.00/bu.',
        catalysts: ['Farmer forward contracting volumes', 'Fertilizer pricing and 2027 acreage intentions'],
        lastUpdated: 'August 2026'
      }
    ]
  }
];
