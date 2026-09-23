import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Globe, RefreshCw, ChevronDown, ChevronUp,
  RotateCcw, Clock, TrendingUp, TrendingDown,
  Activity, BarChart2, ShieldCheck
} from 'lucide-react';
import * as topojson from 'topojson-client';
import { geoNaturalEarth1, geoPath, geoGraticule } from 'd3-geo';
import worldData from 'world-atlas/countries-110m.json';

export type ChartTimeframe = '24U' | '1W' | '3M' | 'YTD' | '1Y' | '5Y' | '10Y' | 'ALL';
export type ChartDesignTheme = 'bloomberg' | 'ice' | 'executive';

export interface ChartPoint {
  date: string;
  value: number;
}

export interface MarketItem {
  id: string;
  name: string;
  exchange: string;
  city: string;
  country: string;
  region: 'americas' | 'europe' | 'asia' | 'middle_east' | 'oceania';
  lat: number;
  lng: number;
  timeZone: string;
  yahooTicker: string;
  price: number;
  change: number;
  changePercent: number;
  dayLow: number;
  dayHigh: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  volume: number;
  currency: string;
  charts?: Record<ChartTimeframe, ChartPoint[]>;
  previousClose?: number;
  status: 'PRE_MARKET' | 'OPEN' | 'AFTER_MARKET' | 'CLOSED';
  statusLabel: string;
  statusColor: string;
  localTime: string;
  isTradingDay?: boolean;
}

// Grouped city location on the map
export interface CityHub {
  id: string;
  cityName: string;
  country: string;
  continent: 'europe' | 'north_america' | 'south_america' | 'asia' | 'middle_east' | 'south_asia' | 'oceania';
  lat: number;
  lng: number;
  marketIds: string[];
}

export const CITY_HUBS: CityHub[] = [
  {
    id: 'new_york',
    cityName: 'New York',
    country: 'Verenigde Staten',
    continent: 'north_america',
    lat: 40.7128,
    lng: -74.0060,
    marketIds: ['sp500', 'nasdaq', 'dow']
  },
  {
    id: 'amsterdam',
    cityName: 'Amsterdam',
    country: 'Nederland',
    continent: 'europe',
    lat: 52.3676,
    lng: 4.9041,
    marketIds: ['aex']
  },
  {
    id: 'london',
    cityName: 'London',
    country: 'Verenigd Koninkrijk',
    continent: 'europe',
    lat: 51.5074,
    lng: -0.1278,
    marketIds: ['ftse100']
  },
  {
    id: 'paris',
    cityName: 'Paris',
    country: 'Frankrijk',
    continent: 'europe',
    lat: 48.8566,
    lng: 2.3522,
    marketIds: ['cac40']
  },
  {
    id: 'frankfurt',
    cityName: 'Frankfurt',
    country: 'Duitsland',
    continent: 'europe',
    lat: 50.1109,
    lng: 8.6821,
    marketIds: ['dax']
  },
  {
    id: 'tokyo',
    cityName: 'Tokyo',
    country: 'Japan',
    continent: 'asia',
    lat: 35.6762,
    lng: 139.6503,
    marketIds: ['nikkei']
  },
  {
    id: 'shanghai',
    cityName: 'Shanghai',
    country: 'China',
    continent: 'asia',
    lat: 31.2304,
    lng: 121.4737,
    marketIds: ['sse']
  },
  {
    id: 'hong_kong',
    cityName: 'Hong Kong',
    country: 'Hong Kong',
    continent: 'asia',
    lat: 22.3193,
    lng: 114.1694,
    marketIds: ['hsi']
  },
  {
    id: 'taipei',
    cityName: 'Taipei',
    country: 'Taiwan',
    continent: 'asia',
    lat: 25.0330,
    lng: 121.5654,
    marketIds: ['taiex']
  },
  {
    id: 'seoul',
    cityName: 'Seoul',
    country: 'Zuid-Korea',
    continent: 'asia',
    lat: 37.5665,
    lng: 126.9780,
    marketIds: ['kospi']
  },
  {
    id: 'riyadh',
    cityName: 'Riyadh',
    country: 'Saoedi-Arabië',
    continent: 'middle_east',
    lat: 24.7136,
    lng: 46.6753,
    marketIds: ['tasi']
  },
  {
    id: 'abu_dhabi',
    cityName: 'Abu Dhabi',
    country: 'VAE',
    continent: 'middle_east',
    lat: 24.4539,
    lng: 54.3773,
    marketIds: ['adx']
  },
  {
    id: 'mumbai',
    cityName: 'Mumbai',
    country: 'India',
    continent: 'south_asia',
    lat: 19.0760,
    lng: 72.8777,
    marketIds: ['nifty']
  },
  {
    id: 'sydney',
    cityName: 'Sydney',
    country: 'Australië',
    continent: 'oceania',
    lat: -33.8688,
    lng: 151.2093,
    marketIds: ['asx']
  },
  {
    id: 'toronto',
    cityName: 'Toronto',
    country: 'Canada',
    continent: 'north_america',
    lat: 43.6532,
    lng: -79.3832,
    marketIds: ['tsx']
  },
  {
    id: 'zurich',
    cityName: 'Zürich',
    country: 'Zwitserland',
    continent: 'europe',
    lat: 47.3769,
    lng: 8.5417,
    marketIds: ['smi']
  },
  {
    id: 'sao_paulo',
    cityName: 'São Paulo',
    country: 'Brazilië',
    continent: 'south_america',
    lat: -23.5505,
    lng: -46.6333,
    marketIds: ['ibovespa']
  },
  {
    id: 'madrid',
    cityName: 'Madrid',
    country: 'Spanje',
    continent: 'europe',
    lat: 40.4168,
    lng: -3.7038,
    marketIds: ['ibex']
  },
  {
    id: 'milan',
    cityName: 'Milaan',
    country: 'Italië',
    continent: 'europe',
    lat: 45.4642,
    lng: 9.1900,
    marketIds: ['ftsemib']
  },
  {
    id: 'singapore',
    cityName: 'Singapore',
    country: 'Singapore',
    continent: 'asia',
    lat: 1.3521,
    lng: 103.8198,
    marketIds: ['sti']
  }
];

// Target bounding centers for Continent Zooms (Natural Earth projection 1000x500)
interface ContinentViewport {
  name: string;
  zoom: number;
  centerLng: number;
  centerLat: number;
}

const CONTINENT_VIEWPORTS: Record<string, ContinentViewport> = {
  world: { name: 'Wereld', zoom: 1.25, centerLng: 18, centerLat: 16 },
  europe: { name: 'Europa', zoom: 2.8, centerLng: 10, centerLat: 50 },
  north_america: { name: 'Noord-Amerika', zoom: 2.4, centerLng: -95, centerLat: 40 },
  south_america: { name: 'Zuid-Amerika', zoom: 2.3, centerLng: -58, centerLat: -18 },
  asia: { name: 'Azië', zoom: 2.3, centerLng: 105, centerLat: 32 },
  middle_east: { name: 'Midden-Oosten', zoom: 3.2, centerLng: 48, centerLat: 26 },
  south_asia: { name: 'Zuid-Azië', zoom: 3.0, centerLng: 75, centerLat: 22 },
  oceania: { name: 'Oceanië', zoom: 2.6, centerLng: 140, centerLat: -28 }
};

// Deterministic chart history builder
// Interactive Financial History Chart Component
interface MarketHistoryChartProps {
  chartData: ChartPoint[];
  currency: string;
  marketName: string;
  ticker?: string;
  timeframe: ChartTimeframe;
  theme: ChartDesignTheme;
}

const MarketHistoryChart: React.FC<MarketHistoryChartProps> = ({
  chartData,
  currency,
  marketName,
  ticker,
  timeframe,
  theme
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const currentTheme = CHART_THEMES[theme] || CHART_THEMES.bloomberg;

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-36 flex items-center justify-center text-xs text-slate-500 font-mono">
        Geen historische grafiekdata beschikbaar
      </div>
    );
  }

  const values = chartData.map(d => d.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const valSpread = rawMax - rawMin || 1;
  const paddingBuffer = valSpread * 0.09;
  const yMin = rawMin - paddingBuffer;
  const yMax = rawMax + paddingBuffer;
  const yRange = yMax - yMin;

  const width = 720;
  const height = 320;
  const topPad = 14;
  const bottomPad = 26;
  const leftPad = 8;
  const rightPad = 72; // room for price labels
  const plotWidth = width - leftPad - rightPad;
  const plotHeight = height - topPad - bottomPad;

  // Calculate coords for points with high floating-point fidelity
  const points = chartData.map((d, i) => {
    const x = leftPad + (i / (chartData.length - 1)) * plotWidth;
    const y = topPad + plotHeight - ((d.value - yMin) / yRange) * plotHeight;
    return { x, y, ...d };
  });

  // SVG Line path
  const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  // Area path
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)},${(topPad + plotHeight).toFixed(1)} L ${points[0].x.toFixed(1)},${(topPad + plotHeight).toFixed(1)} Z`;

  // Start & End statistics
  const startVal = values[0];
  const endVal = values[values.length - 1];
  const diff = endVal - startVal;
  const diffPct = (diff / startVal) * 100;
  const isPeriodPos = diff >= 0;

  // Midline Y coordinate
  const yMid = topPad + plotHeight / 2;
  const startY = topPad + plotHeight - ((startVal - yMin) / yRange) * plotHeight;

  // Gradient ID unique to theme and timeframe
  const gradientId = `chartGrad_${theme}_${timeframe}`;
  const filterId = `chartGlow_${theme}`;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, (mouseX - leftPad) / plotWidth));
    const closestIdx = Math.round(ratio * (chartData.length - 1));
    setHoverIndex(closestIdx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const activePoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

  // Generate 4-5 well-spaced date markers along the X axis
  const numDateTicks = Math.min(5, Math.max(2, chartData.length));
  const dateTickIndices: number[] = [];
  for (let step = 0; step < numDateTicks; step++) {
    const idx = Math.round((step / (numDateTicks - 1)) * (chartData.length - 1));
    if (!dateTickIndices.includes(idx)) {
      dateTickIndices.push(idx);
    }
  }

  return (
    <div className="flex flex-col gap-1.5 select-none">
      {/* Institutional Top Stat Bar */}
      <div className="flex flex-wrap items-center justify-between text-[11px] px-1 font-mono-code gap-1">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">
            Looptijd ({timeframe}):
          </span>
          <span className="text-slate-400">
            {formatMarketPrice(startVal, currency)} → <span className="text-white font-bold">{formatMarketPrice(endVal, currency)}</span>
          </span>
          <span className={`font-bold flex items-center gap-0.5 ${isPeriodPos ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPeriodPos ? '+' : ''}{diff.toFixed(2)} ({isPeriodPos ? '+' : ''}{diffPct.toFixed(2)}%)
          </span>
        </div>

        {/* Current Theme Indicator Tag */}
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="text-slate-500">Design:</span>
          <span className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${currentTheme.highTagBg} ${currentTheme.highTagBorder} ${currentTheme.highTagText} border`}>
            {currentTheme.name}
          </span>
        </div>
      </div>

      {/* SVG Canvas with Provider Design Aesthetic */}
      <div 
        className="relative w-full rounded-lg overflow-hidden border shadow-inner transition-colors duration-300"
        style={{ 
          backgroundColor: currentTheme.bgColor,
          borderColor: currentTheme.borderColor
        }}
      >
        <svg
          ref={svgRef}
          className="w-full h-[145px] sm:h-[155px] cursor-crosshair block"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Area Linear Gradient */}
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={currentTheme.fillColor} stopOpacity={currentTheme.fillOpacityStart} />
              <stop offset="95%" stopColor={currentTheme.fillColor} stopOpacity={currentTheme.fillOpacityEnd} />
            </linearGradient>

            {/* Neon Glow Filter for Line */}
            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor={currentTheme.lineColor} floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Watermark Label in Center/Top */}
          <text
            x={leftPad + 6}
            y={topPad + 14}
            fill={currentTheme.lineColor}
            fillOpacity="0.14"
            fontSize="10"
            fontWeight="bold"
            letterSpacing="0.08em"
            fontFamily="monospace"
          >
            {currentTheme.watermark}
          </text>

          {/* Horizontal Grid & Price Reference Levels */}
          {/* Upper Quartile / Max Bound */}
          <line
            x1={leftPad}
            y1={topPad}
            x2={leftPad + plotWidth}
            y2={topPad}
            stroke={currentTheme.gridColor}
            strokeOpacity={currentTheme.gridOpacity}
            strokeWidth="0.8"
            strokeDasharray={currentTheme.gridDashed ? "2 3" : undefined}
          />
          <text
            x={leftPad + plotWidth + 6}
            y={topPad + 4}
            fill={currentTheme.lineColor}
            fillOpacity="0.85"
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {formatMarketPrice(rawMax, currency)}
          </text>

          {/* Midline Level */}
          <line
            x1={leftPad}
            y1={yMid}
            x2={leftPad + plotWidth}
            y2={yMid}
            stroke={currentTheme.gridColor}
            strokeOpacity={currentTheme.gridOpacity * 0.75}
            strokeWidth="0.5"
            strokeDasharray={currentTheme.gridDashed ? "2 3" : undefined}
          />
          <text
            x={leftPad + plotWidth + 6}
            y={yMid + 3}
            fill="#64748b"
            fontSize="8.5"
            fontFamily="monospace"
          >
            {formatMarketPrice((rawMax + rawMin) / 2, currency)}
          </text>

          {/* Baseline Reference (Start of period) for ICE theme */}
          {currentTheme.hasBaseline && (
            <line
              x1={leftPad}
              y1={startY}
              x2={leftPad + plotWidth}
              y2={startY}
              stroke="#0891b2"
              strokeOpacity="0.5"
              strokeWidth="0.75"
              strokeDasharray="4 4"
            />
          )}

          {/* Lower Quartile / Min Bound */}
          <line
            x1={leftPad}
            y1={topPad + plotHeight}
            x2={leftPad + plotWidth}
            y2={topPad + plotHeight}
            stroke={currentTheme.gridColor}
            strokeOpacity={currentTheme.gridOpacity}
            strokeWidth="0.8"
            strokeDasharray={currentTheme.gridDashed ? "2 3" : undefined}
          />
          <text
            x={leftPad + plotWidth + 6}
            y={topPad + plotHeight + 3}
            fill={currentTheme.lineColor}
            fillOpacity="0.85"
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {formatMarketPrice(rawMin, currency)}
          </text>

          {/* Bloomberg-Style Micro Volume/Tick Bars along Bottom */}
          {currentTheme.hasVolumeTicks && points.map((p, idx) => {
            if (idx % 2 !== 0 && chartData.length > 50) return null; // sample for dense series
            const pseudoHeight = 3 + Math.abs(Math.sin(idx * 1.7)) * 10;
            return (
              <line
                key={`tick_${idx}`}
                x1={p.x}
                y1={topPad + plotHeight}
                x2={p.x}
                y2={topPad + plotHeight - pseudoHeight}
                stroke={currentTheme.lineColor}
                strokeOpacity="0.22"
                strokeWidth={chartData.length > 60 ? "1.0" : "1.5"}
              />
            );
          })}

          {/* Area Fill */}
          <path d={areaPath} fill={`url(#${gradientId})`} />

          {/* Detailed Primary Price Trendline */}
          <path
            d={linePath}
            fill="none"
            stroke={currentTheme.lineColor}
            strokeWidth={currentTheme.hasGlowFilter ? "2.0" : "1.8"}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={currentTheme.hasGlowFilter ? `url(#${filterId})` : undefined}
          />

          {/* Key inflection anchor dots on low point count series */}
          {chartData.length <= 40 && points.map((p, idx) => (
            <circle
              key={`anchor_${idx}`}
              cx={p.x}
              cy={p.y}
              r="2.2"
              fill={currentTheme.lineColor}
              stroke={currentTheme.bgColor}
              strokeWidth="1"
            />
          ))}

          {/* Date Axis Markers evenly distributed */}
          {dateTickIndices.map((idx, step) => {
            const p = points[idx];
            if (!p) return null;
            const isFirst = step === 0;
            const isLast = step === dateTickIndices.length - 1;
            const anchor = isFirst ? 'start' : isLast ? 'end' : 'middle';
            return (
              <text
                key={`date_${idx}`}
                x={p.x}
                y={height - 7}
                textAnchor={anchor}
                fill="#64748b"
                fontSize="8.5"
                fontFamily="monospace"
              >
                {p.date}
              </text>
            );
          })}

          {/* Crosshair & Floating Tooltip on Hover */}
          {activePoint && (
            <g>
              {/* Vertical Crosshair Line */}
              <line
                x1={activePoint.x}
                y1={topPad}
                x2={activePoint.x}
                y2={topPad + plotHeight}
                stroke={currentTheme.crosshairColor}
                strokeWidth="1"
                strokeDasharray="2 2"
                strokeOpacity="0.8"
              />

              {/* Horizontal Crosshair Line */}
              <line
                x1={leftPad}
                y1={activePoint.y}
                x2={leftPad + plotWidth}
                y2={activePoint.y}
                stroke={currentTheme.crosshairColor}
                strokeWidth="0.75"
                strokeDasharray="2 2"
                strokeOpacity="0.5"
              />

              {/* Highlight Target Dot on Curve */}
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="5"
                fill={currentTheme.lineColor}
                stroke="#0f172a"
                strokeWidth="2"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="8"
                fill="none"
                stroke={currentTheme.lineColor}
                strokeWidth="1"
                strokeOpacity="0.5"
              />

              {/* Dynamic Price Tag on Y Axis */}
              <g transform={`translate(${leftPad + plotWidth + 3}, ${activePoint.y - 7})`}>
                <rect
                  x="0"
                  y="0"
                  width="62"
                  height="14"
                  rx="2"
                  fill={currentTheme.lineColor}
                />
                <text
                  x="31"
                  y="10.5"
                  textAnchor="middle"
                  fill="#000000"
                  fontSize="8.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {formatMarketPrice(activePoint.value, currency)}
                </text>
              </g>

              {/* Floating Tooltip Box */}
              <g
                transform={`translate(${Math.max(10, Math.min(width - 150, activePoint.x - 65))}, ${Math.max(6, activePoint.y - 44)})`}
              >
                <rect
                  x="0"
                  y="0"
                  width="130"
                  height="34"
                  rx="4"
                  fill="#060c1c"
                  stroke={currentTheme.lineColor}
                  strokeWidth="0.85"
                  strokeOpacity="0.9"
                  filter="drop-shadow(0 4px 6px rgba(0,0,0,0.7))"
                />
                <text
                  x="65"
                  y="12"
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="8"
                  fontWeight="500"
                  fontFamily="monospace"
                >
                  {activePoint.date} • {timeframe}
                </text>
                <text
                  x="65"
                  y="26"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {formatMarketPrice(activePoint.value, currency)} {currency}
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

export const GlobalMarketsMap: React.FC = () => {
  const [markets, setMarkets] = useState<MarketItem[]>(DEFAULT_MARKETS);

  const [isExpanded, setIsExpanded] = useState(true);
  const [activeContinent, setActiveContinent] = useState<string>('world');
  const [selectedHub, setSelectedHub] = useState<CityHub | null>(null);
  
  // Selected market for detailed analysis below the list (null initially as requested)
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  
  // Tab filter: 'open' | 'closed' | 'all'
  const [activeTab, setActiveTab] = useState<'open' | 'closed' | 'all'>('open');
  
  // Timeframe for the historical chart: '24U' | '1W' | '3M' | 'YTD' | '1Y' | '5Y' | '10Y' | 'ALL'
  const [activeTimeframe, setActiveTimeframe] = useState<ChartTimeframe>('24U');

  // One unified institutional chart design; data is loaded live from Yahoo Finance.
  const [liveChartData, setLiveChartData] = useState<ChartPoint[]>([]);
  const [chartProvider, setChartProvider] = useState('Yahoo Finance Historical Chart API');
  const [chartLoading, setChartLoading] = useState(false);

  const [hoveredHub, setHoveredHub] = useState<CityHub | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Live World Clocks (London, New York with AM/PM ET, Shanghai, Amsterdam) in clean neutral gray
  const [worldClocks, setWorldClocks] = useState({
    london: '--:--:--',
    newYork: '--:-- -- ET',
    shanghai: '--:--:-- CST',
    amsterdam: '--:--:-- CET'
  });

  // Vector Map Zoom state: initially zoomed in (1.25x) centered so world map fills frame nicely
  const [zoom, setZoom] = useState(1.25);
  const [pan, setPan] = useState({ x: -184.4, y: -0.6 });

  // SVG dimensions for Natural Earth projection
  const MAP_WIDTH = 1000;
  const MAP_HEIGHT = 500;

  // Memoized Geo Generator: 100% Offline via bundled world-atlas dataset
  const { landPath, bordersPath, graticulePath, projection } = useMemo(() => {
    const proj = geoNaturalEarth1().fitSize([MAP_WIDTH, MAP_HEIGHT], { type: 'Sphere' });
    const pathGen = geoPath(proj);
    const countries = (worldData.objects as any).countries;
    const landGeo = topojson.feature(worldData as any, countries);
    const bordersGeo = topojson.mesh(worldData as any, countries, (a: any, b: any) => a !== b);
    const grat = geoGraticule();

    return {
      projection: proj,
      landPath: pathGen(landGeo) || '',
      bordersPath: pathGen(bordersGeo) || '',
      graticulePath: pathGen(grat()) || ''
    };
  }, []);

  // Fetch updated market data from local backend endpoint
  const fetchLiveData = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);

    try {
      const res = await fetch('/api/global-markets');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.markets) && data.markets.length > 0) {
          const regionMap: Record<string, MarketItem['region']> = {
            sp500: 'americas',
            nasdaq: 'americas',
            dow: 'americas',
            aex: 'europe',
            ftse100: 'europe',
            cac40: 'europe',
            dax: 'europe',
            nikkei: 'asia',
            hsi: 'asia',
            sse: 'asia',
            taiex: 'asia',
            kospi: 'asia',
            tasi: 'middle_east',
            adx: 'middle_east',
            nifty: 'asia',
            asx: 'oceania',
            tsx: 'americas',
            smi: 'europe',
            ibovespa: 'americas',
            ibex: 'europe',
            ftsemib: 'europe',
            sti: 'asia'
          };

          setMarkets(data.markets.map((m: any) => {
            const high52 = m.fiftyTwoWeekHigh || m.price * 1.08;
            const low52 = m.fiftyTwoWeekLow || m.price * 0.82;
            return {
              ...m,
              region: regionMap[m.id] || 'europe',
              fiftyTwoWeekHigh: high52,
              fiftyTwoWeekLow: low52,
              volume: m.volume || 150000000,
              currency: m.currency || 'USD'
            };
          }));
        }
      }
    } catch (err) {
      console.warn('API sync using active feeds:', err);
    } finally {
      if (isManual) setIsRefreshing(false);
      setCountdown(30);
    }
  };

  useEffect(() => {
    fetchLiveData();
  }, []);

  // Update World Clocks every second
  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();

      // 1. London (24-hour GMT/BST)
      const londonTime = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }).format(now);

      // 2. New York (12-hour AM/PM ET)
      const nyTime = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
      }).format(now);

      // 3. Shanghai (24-hour CST)
      const shanghaiTime = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Shanghai',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }).format(now);

      // 4. Amsterdam (24-hour CET)
      const amsTime = new Intl.DateTimeFormat('nl-NL', {
        timeZone: 'Europe/Amsterdam',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }).format(now);

      setWorldClocks({
        london: `${londonTime} GMT`,
        newYork: `${nyTime} ET`,
        shanghai: `${shanghaiTime} CST`,
        amsterdam: `${amsTime} CET`
      });
    };

    updateClocks();
    const clockInterval = setInterval(updateClocks, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Auto-refresh countdown & micro-ticks on open markets
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchLiveData();
          return 30;
        }
        return prev - 1;
      });

      // Micro-tick movement on active OPEN markets
      setMarkets(prev => prev.map(m => {
        if (m.status === 'OPEN') {
          const delta = (Math.random() - 0.495) * (m.price * 0.0001);
          const newPrice = +(m.price + delta).toFixed(2);
          return { ...m, price: newPrice };
        }
        return m;
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Zoom into specific continent viewport (smooth animated transform)
  const zoomToContinent = (continentKey: string) => {
    setActiveContinent(continentKey);
    const target = CONTINENT_VIEWPORTS[continentKey] || CONTINENT_VIEWPORTS.world;
    const coords = projection([target.centerLng, target.centerLat]);
    if (!coords) return;

    const [px, py] = coords;
    const targetZoom = target.zoom;
    const targetPanX = MAP_WIDTH / 2 - px * targetZoom;
    const targetPanY = MAP_HEIGHT / 2 - py * targetZoom;

    setZoom(targetZoom);
    setPan({ x: targetPanX, y: targetPanY });
  };

  // Reset to full world view & deselect active hub/market
  const handleResetView = () => {
    zoomToContinent('world');
    setSelectedHub(null);
    setSelectedMarketId(null);
  };

  // Helper to find CityHub for a market
  const getHubForMarket = (marketId: string): CityHub | undefined => {
    return CITY_HUBS.find(h => h.marketIds.includes(marketId));
  };

  // Helper to get MarketItems for a Hub
  const getMarketsForHub = (hub: CityHub): MarketItem[] => {
    return hub.marketIds
      .map(id => markets.find(m => m.id === id))
      .filter((m): m is MarketItem => Boolean(m));
  };

  // Helper to get performance & session color for a CityHub (matches pin logic)
  const getHubColor = (hub: CityHub) => {
    const hubMarkets = getMarketsForHub(hub);
    const isOpen = hubMarkets.some(m => m.status === 'OPEN');
    const isPreMarket = !isOpen && hubMarkets.some(m => m.status === 'PRE_MARKET');
    const isClosed = !isOpen && !isPreMarket;

    const avgChange = hubMarkets.length > 0 
      ? hubMarkets.reduce((acc, m) => acc + (m.changePercent || 0), 0) / hubMarkets.length 
      : (hubMarkets[0]?.changePercent ?? 0);
    const isPositive = avgChange >= 0;

    if (isOpen) {
      return {
        text: isPositive ? 'text-emerald-400' : 'text-rose-400',
        border: isPositive ? 'border-emerald-500' : 'border-rose-500',
        hex: isPositive ? '#10b981' : '#ef4444',
        isOpen: true,
        isClosed: false,
        isPositive
      };
    } else if (isPreMarket) {
      return {
        text: isPositive ? 'text-emerald-400' : 'text-rose-400',
        border: isPositive ? 'border-emerald-400/80' : 'border-rose-400/80',
        hex: isPositive ? '#10b981' : '#ef4444',
        isOpen: false,
        isClosed: false,
        isPositive
      };
    } else {
      return {
        text: 'text-slate-400',
        border: 'border-slate-500',
        hex: '#64748b',
        isOpen: false,
        isClosed: true,
        isPositive
      };
    }
  };

  // When clicking on a market in the list (click selected again to deselect):
  const handleSelectMarket = (m: MarketItem) => {
    if (selectedMarketId === m.id) {
      setSelectedMarketId(null);
      setSelectedHub(null);
      return;
    }
    setSelectedMarketId(m.id);
    const hub = getHubForMarket(m.id);
    if (hub) {
      setSelectedHub(hub);
      zoomToContinent(hub.continent);
    }
  };

  // When clicking a City Hub on the map (click selected again to deselect):
  const handleSelectHub = (hub: CityHub) => {
    if (selectedHub?.id === hub.id) {
      setSelectedHub(null);
      setSelectedMarketId(null);
      return;
    }
    setSelectedHub(hub);
    const primaryId = hub.marketIds[0];
    if (primaryId) {
      setSelectedMarketId(primaryId);
    }
    zoomToContinent(hub.continent);
  };

  // Filtered lists for tabs
  const openMarkets = useMemo(() => {
    return markets.filter(m => m.status === 'OPEN' || m.status === 'PRE_MARKET');
  }, [markets]);

  const closedMarkets = useMemo(() => {
    return markets.filter(m => m.status === 'CLOSED' || m.status === 'AFTER_MARKET');
  }, [markets]);

  const activeTabMarkets = useMemo(() => {
    if (activeTab === 'open') return openMarkets;
    if (activeTab === 'closed') return closedMarkets;
    return markets;
  }, [activeTab, openMarkets, closedMarkets, markets]);

  const openCount = openMarkets.length;
  const closedCount = closedMarkets.length;

  // Active selected market object (null initially when user opens app)
  const selectedMarket = useMemo(() => {
    if (!selectedMarketId) return null;
    return markets.find(m => m.id === selectedMarketId) || null;
  }, [markets, selectedMarketId]);

  // If user switches tab, only re-target if a market was already selected
  const handleTabChange = (tab: 'open' | 'closed' | 'all') => {
    setActiveTab(tab);
    if (!selectedMarketId) return;

    let targetList = markets;
    if (tab === 'open') targetList = openMarkets;
    if (tab === 'closed') targetList = closedMarkets;

    if (targetList.length > 0 && !targetList.some(m => m.id === selectedMarketId)) {
      setSelectedMarketId(targetList[0].id);
      const hub = getHubForMarket(targetList[0].id);
      if (hub) {
        setSelectedHub(hub);
        zoomToContinent(hub.continent);
      }
    }
  };

  // 52-week position calculation (0 to 100%)
  const fiftyTwoWeekPct = useMemo(() => {
    if (!selectedMarket) return 50;
    const low = selectedMarket.fiftyTwoWeekLow;
    const high = selectedMarket.fiftyTwoWeekHigh;
    const spread = high - low;
    if (spread <= 0) return 50;
    const ratio = ((selectedMarket.price - low) / spread) * 100;
    return Math.max(0, Math.min(100, ratio));
  }, [selectedMarket]);

  // Day range position calculation (0 to 100%)
  const dayRangePct = useMemo(() => {
    if (!selectedMarket) return 50;
    const low = selectedMarket.dayLow;
    const high = selectedMarket.dayHigh;
    const spread = high - low;
    if (spread <= 0) return 50;
    const ratio = ((selectedMarket.price - low) / spread) * 100;
    return Math.max(0, Math.min(100, ratio));
  }, [selectedMarket]);

    // Live historical chart data for the selected market/timeframe.
  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      if (!selectedMarket) {
        setLiveChartData([]);
        return;
      }

      setChartLoading(true);
      try {
        const res = await fetch(`/api/global-market-history/${encodeURIComponent(selectedMarket.yahooTicker)}?range=${activeTimeframe}`);
        if (!res.ok) throw new Error(`History HTTP ${res.status}`);
        const payload = await res.json();
        if (!cancelled) {
          setLiveChartData(Array.isArray(payload.points) ? payload.points : []);
          setChartProvider(payload.provider || 'Yahoo Finance Historical Chart API');
        }
      } catch (err) {
        if (!cancelled) setLiveChartData([]);
        console.warn('Failed to load live market history:', err);
      } finally {
        if (!cancelled) setChartLoading(false);
      }
    };

    loadHistory();
    const refreshTimer = window.setInterval(loadHistory, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, [selectedMarket?.yahooTicker, activeTimeframe]);

  const currentChartData = liveChartData;

  // Render a compact corporate market card with dynamic borders matching market status
  const renderMarketCard = (m: MarketItem) => {
    const isPos = m.changePercent >= 0;
    const isSelected = selectedMarketId === m.id;
    const isOpen = m.status === 'OPEN';
    const isPreMarket = m.status === 'PRE_MARKET';
    const isClosed = !isOpen && !isPreMarket;

    let selectedClasses = 'bg-[#080d19]/90 hover:bg-[#0d1527] border-slate-800/80 hover:border-slate-700';
    if (isSelected) {
      if (isOpen) {
        selectedClasses = isPos
          ? 'bg-[#0d1a29] border-emerald-500/85 shadow-md ring-1 ring-emerald-500/40'
          : 'bg-[#1a0f16] border-rose-500/85 shadow-md ring-1 ring-rose-500/40';
      } else if (isPreMarket) {
        selectedClasses = isPos
          ? 'bg-[#0d1a29] border-emerald-400/70 shadow-md ring-1 ring-emerald-400/30'
          : 'bg-[#1a0f16] border-rose-400/70 shadow-md ring-1 ring-rose-400/30';
      } else {
        // Market is closed/uit: gray border
        selectedClasses = 'bg-[#111726] border-slate-500/85 shadow-md ring-1 ring-slate-500/40';
      }
    }

    return (
      <div
        key={m.id}
        onClick={() => handleSelectMarket(m)}
        className={`p-2.5 rounded-lg border text-left transition cursor-pointer relative group ${selectedClasses}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {/* Market Name & Dot */}
            <div className="flex items-center gap-1.5">
              <span 
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  isOpen
                    ? (isPos ? 'bg-emerald-400' : 'bg-rose-500')
                    : (isPreMarket
                        ? (isPos ? 'bg-slate-500 border border-emerald-400' : 'bg-slate-500 border border-rose-500')
                        : 'bg-slate-500')
                }`}
              />
              <span className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-slate-200'}`} title={m.name}>
                {m.name}
              </span>
            </div>

            {/* Subtitle: City • Exchange */}
            <div className="text-[10px] text-slate-400 truncate mt-0.5 pl-3">
              {m.city} • <span className="text-slate-500">{m.exchange}</span>
            </div>
          </div>

          {/* Price & Change */}
          <div className="text-right shrink-0 font-mono-code">
            <div className="text-xs font-semibold text-white tracking-tight">
              {formatMarketPrice(m.price, m.currency)}
            </div>
            <div className={`text-[10.5px] font-medium flex items-center justify-end gap-0.5 ${
              isPos ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {isPos ? '+' : ''}{m.changePercent.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Bottom row: status & local time */}
        <div className="mt-2 pt-1 border-t border-slate-800/60 flex items-center justify-between text-[9.5px] text-slate-400 pl-3">
          <span className={`font-mono-code ${
            isOpen
              ? (isPos ? 'text-emerald-400/90 font-medium' : 'text-rose-400/90 font-medium')
              : 'text-slate-400'
          }`}>
            {m.statusLabel}
          </span>
          <span className="font-mono-code text-slate-500">
            {m.localTime}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="mb-5 bg-[#070b14] border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl text-slate-100">
      {/* 1. Header Bar with Clean Corporate Title & Desk Metrics */}
      <div className="bg-[#0b1120] px-4 py-2.5 border-b border-slate-800/90 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Globe className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm tracking-tight text-white uppercase">Global Markets Monitor</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-[10.5px] font-mono-code font-semibold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-beacon-pulse"></span>
                <span>{openCount} Open</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/80 text-[10.5px] font-mono-code text-slate-400">
                <span>{closedCount} Gesloten</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            onClick={() => fetchLiveData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition cursor-pointer text-xs"
            title="Ververs marktdata"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="font-mono-code text-[11px] hidden sm:inline">{countdown}s</span>
          </button>

          {/* Toggle Expand */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-md bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
            title={isExpanded ? 'Inklappen' : 'Uitklappen'}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. World Clock Bar (London, New York ET AM/PM, Shanghai, Amsterdam in neutral gray) */}
      <div className="bg-[#090e1a] px-4 py-2 border-b border-slate-800/80 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 text-slate-400 shrink-0 text-xs font-semibold uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Wereldklok:</span>
        </div>

        {/* Real-Time Clocks with Gray Neutral Styling */}
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-0.5">
          {/* New York (PM/AM ET) */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 shrink-0 font-mono-code text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span className="text-slate-400 font-sans font-medium text-[11px]">New York:</span>
            <span className="text-slate-300 font-semibold tracking-tight">{worldClocks.newYork}</span>
          </div>

          {/* London (GMT/BST) */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 shrink-0 font-mono-code text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span className="text-slate-400 font-sans font-medium text-[11px]">London:</span>
            <span className="text-slate-300 font-semibold tracking-tight">{worldClocks.london}</span>
          </div>

          {/* Shanghai (CST) */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 shrink-0 font-mono-code text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span className="text-slate-400 font-sans font-medium text-[11px]">Shanghai:</span>
            <span className="text-slate-300 font-semibold tracking-tight">{worldClocks.shanghai}</span>
          </div>

          {/* Amsterdam (CET) */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-800 shrink-0 font-mono-code text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span className="text-slate-400 font-sans font-medium text-[11px]">Amsterdam:</span>
            <span className="text-slate-300 font-semibold tracking-tight">{worldClocks.amsterdam}</span>
          </div>
        </div>

        {/* Desk Legend */}
        <div className="hidden xl:flex items-center gap-3 text-[11px] text-slate-400 shrink-0 font-mono-code">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
            <span className="text-emerald-400 font-semibold">+ Open (Groen)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#ef4444]"></span>
            <span className="text-rose-400 font-semibold">- Open (Rood)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#64748b] border border-emerald-400"></span>
            <span className="text-slate-300">Pre-Mkt</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#64748b]"></span>
            <span className="text-slate-400">Uit (Grijs)</span>
          </span>
        </div>
      </div>

      {/* 3. Main Split Content Area: Left = Map, Right = Tabs + Market Selection + Rich Detail below */}
      {isExpanded && (
        <div className="p-3.5 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* LEFT COLUMN: Fixed World Map (Non-moveable, zooms to continent on selection) */}
          <div className="lg:col-span-5 flex flex-col gap-2">
            {/* Map Header with active continent, plus/min indicator & Reset Button */}
            <div className="flex items-center justify-between px-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Kaartweergave:</span>
                <span className="font-semibold text-slate-200 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
                  {CONTINENT_VIEWPORTS[activeContinent]?.name || 'Wereld'}
                </span>
                {selectedHub && (() => {
                  const hubCol = getHubColor(selectedHub);
                  return (
                    <span className={`text-[11px] ${hubCol.text} font-semibold truncate max-w-[170px]`}>
                      • {selectedHub.cityName}
                    </span>
                  );
                })()}
              </div>

              <div className="flex items-center gap-2">
                {/* Subtle indicator: Groen = Plus, Rood = Min, Pre-Mkt, Uit */}
                <div className="hidden xs:flex items-center gap-1.5 text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-800/80">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>+</span>
                  </span>
                  <span className="text-slate-600">/</span>
                  <span className="flex items-center gap-1 text-rose-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    <span>-</span>
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#64748b] border border-emerald-400"></span>
                    <span>Pre</span>
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#64748b]"></span>
                    <span>Uit</span>
                  </span>
                </div>

                {activeContinent !== 'world' && (
                  <button
                    onClick={handleResetView}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-[11px] border border-slate-700/80"
                    title="Herstel naar de hele wereld"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Wereld</span>
                  </button>
                )}
              </div>
            </div>

            {/* Non-moveable SVG Map Frame */}
            <div className="w-full relative rounded-xl overflow-hidden border border-slate-800/90 bg-[#040711] select-none h-[420px] lg:h-[500px] flex items-center justify-center">
              <svg
                className="w-full h-full"
                viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  {/* High quality dark ocean gradient */}
                  <radialGradient id="oceanShade" cx="50%" cy="45%" r="70%">
                    <stop offset="0%" stopColor="#0b1325" />
                    <stop offset="60%" stopColor="#060a14" />
                    <stop offset="100%" stopColor="#020409" />
                  </radialGradient>

                  {/* Continent Landmass subtle gradient */}
                  <linearGradient id="landGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#141e33" />
                    <stop offset="100%" stopColor="#0f1728" />
                  </linearGradient>

                  {/* Soft glow for active city beacons */}
                  <filter id="cityGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Ocean Base */}
                <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#oceanShade)" />

                {/* Transform Container for Continent Zoom */}
                <g 
                  transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
                  style={{ transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
                >
                  {/* Graticule Lat/Lon Lines */}
                  <path
                    d={graticulePath}
                    fill="none"
                    stroke="#172236"
                    strokeWidth="0.5"
                    strokeDasharray="2 3"
                    opacity="0.5"
                  />

                  {/* Continents Landmass */}
                  <path
                    d={landPath}
                    fill="url(#landGradient)"
                    stroke="#22324f"
                    strokeWidth="0.75"
                  />

                  {/* Country Borders */}
                  <path
                    d={bordersPath}
                    fill="none"
                    stroke="#18253b"
                    strokeWidth="0.45"
                    opacity="0.8"
                  />

                  {/* City Hub Pins (Delicate dots, no percentages, New York, London, Shanghai named) */}
                  {CITY_HUBS.map(hub => {
                    const coords = projection([hub.lng, hub.lat]);
                    if (!coords) return null;
                    const [cx, cy] = coords;

                    const hubMarkets = getMarketsForHub(hub);
                    const isSelected = selectedHub?.id === hub.id || (selectedMarket && hub.marketIds.includes(selectedMarket.id));
                    const isHovered = hoveredHub?.id === hub.id;

                    // Session states:
                    // 1. OPEN: active regular trading session
                    const isOpen = hubMarkets.some(m => m.status === 'OPEN');
                    // 2. PRE_MARKET: pre-market active
                    const isPreMarket = !isOpen && hubMarkets.some(m => m.status === 'PRE_MARKET');
                    // 3. CLOSED: market is off / closed
                    const isClosed = !isOpen && !isPreMarket;

                    // USER REQUIREMENTS:
                    // 1. "wel op grijs als de markt uit is" -> closed = gray
                    // 2. "zonder wit erin hebben alleen rood of groen" -> open = solid green or solid red, NO white inside
                    // 3. "pre market grijs met rode of groen rand" -> pre-market = gray dot with red or green border
                    // 4. "De puntjes moet wel nog flikkeren" -> active dots (open / pre-market) must flicker/pulse

                    const avgChange = hubMarkets.length > 0 
                      ? hubMarkets.reduce((acc, m) => acc + (m.changePercent || 0), 0) / hubMarkets.length 
                      : (hubMarkets[0]?.changePercent ?? 0);
                    const isPositive = avgChange >= 0;

                    let pinFill = '#64748b'; // Neutral gray when closed
                    let pinStroke = '#334155';
                    let pingColor = isPositive ? '#10b981' : '#ef4444';
                    const isFlickering = isOpen || isPreMarket;

                    if (isOpen) {
                      // OPEN: Alleen rood of groen, zonder wit erin
                      pinFill = isPositive ? '#10b981' : '#ef4444';
                      pinStroke = isPositive ? '#059669' : '#b91c1c';
                      pingColor = isPositive ? '#10b981' : '#ef4444';
                    } else if (isPreMarket) {
                      // PRE-MARKET: Grijs met rode of groene rand
                      pinFill = '#64748b';
                      pinStroke = isPositive ? '#10b981' : '#ef4444';
                      pingColor = isPositive ? '#10b981' : '#ef4444';
                    } else {
                      // MARKT UIT: Grijs
                      pinFill = '#64748b';
                      pinStroke = '#475569';
                    }

                    // Only New York, London, and Shanghai have name tags permanently displayed on the map
                    const isAlwaysNamed = ['new_york', 'london', 'shanghai'].includes(hub.id);
                    const showLabel = isAlwaysNamed || isSelected || isHovered;

                    return (
                      <g
                        key={hub.id}
                        transform={`translate(${cx}, ${cy})`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectHub(hub);
                        }}
                        onMouseEnter={() => setHoveredHub(hub)}
                        onMouseLeave={() => setHoveredHub(null)}
                        className="cursor-pointer group"
                      >
                        {/* Animated Pulse Beacon (Flikkeren) for active Open & Pre-Market sessions */}
                        {isFlickering && (
                          <g>
                            {/* Expanding CSS ping wave */}
                            <circle
                              r={isSelected ? "11" : "7.5"}
                              fill={pingColor}
                              opacity={isPreMarket ? "0.25" : "0.35"}
                              className="animate-ping"
                              style={{ transformOrigin: '0 0' }}
                            />
                            {/* Native SVG expanding wave to guarantee smooth flicker */}
                            <circle r="3.2" fill="none" stroke={pingColor} strokeWidth="1.2" opacity="0.8">
                              <animate attributeName="r" values="3.2;9;12" dur={isPreMarket ? "2.2s" : "1.5s"} repeatCount="indefinite" />
                              <animate attributeName="opacity" values="0.8;0.3;0" dur={isPreMarket ? "2.2s" : "1.5s"} repeatCount="indefinite" />
                            </circle>
                          </g>
                        )}

                        {/* Pin Dot: Purely red/green when open, gray with red/green border in pre-market, plain gray when closed */}
                        <circle
                          r={isSelected ? "5.5" : (isAlwaysNamed ? "4.0" : "3.2")}
                          fill={pinFill}
                          stroke={isSelected ? (isClosed ? "#94a3b8" : (isPositive ? "#10b981" : "#ef4444")) : pinStroke}
                          strokeWidth={isSelected ? "2.2" : (isPreMarket ? "1.8" : (isOpen ? "1.2" : "0.8"))}
                          filter={isFlickering ? "url(#cityGlow)" : undefined}
                        >
                          {isFlickering && (
                            <animate attributeName="opacity" values="1;0.7;1" dur={isPreMarket ? "2.2s" : "1.5s"} repeatCount="indefinite" />
                          )}
                        </circle>

                        {/* Name Tag Label */}
                        {showLabel && (
                          <g transform="translate(0, -9)">
                            <rect
                              x={-(hub.cityName.length * 3.2 + 6)}
                              y="-11"
                              width={hub.cityName.length * 6.4 + 12}
                              height="12"
                              rx="2.5"
                              fill="#080d19"
                              fillOpacity="0.94"
                              stroke={isSelected ? (isClosed ? '#64748b' : (isPositive ? '#10b981' : '#ef4444')) : (isOpen ? (isPositive ? '#065f46' : '#7f1d1d') : (isPreMarket ? (isPositive ? '#065f46' : '#7f1d1d') : '#334155'))}
                              strokeWidth="0.75"
                            />
                            <text
                              x="0"
                              y="-3"
                              textAnchor="middle"
                              fill="#ffffff"
                              fontSize="7.5"
                              fontWeight="700"
                              fontFamily="sans-serif"
                            >
                              {hub.cityName}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>
          </div>

          {/* RIGHT COLUMN: Tab Switcher (Open vs Gesloten) + Compact List + Rich Stock Detail Below */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {/* Top Bar with Tabs for Open / Gesloten / Alle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              {/* Institutional Tab Control */}
              <div className="inline-flex items-center p-0.5 bg-[#090e1a] border border-slate-800 rounded-lg">
                <button
                  onClick={() => handleTabChange('open')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                    activeTab === 'open'
                      ? 'bg-slate-800 text-white font-bold shadow-sm border border-slate-700/80'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Open Beurzen</span>
                  <span className="ml-1 px-1.5 py-0.2 rounded bg-slate-900 text-[10px] font-mono-code text-emerald-400 border border-slate-700/50">
                    {openCount}
                  </span>
                </button>

                <button
                  onClick={() => handleTabChange('closed')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                    activeTab === 'closed'
                      ? 'bg-slate-800 text-white font-bold shadow-sm border border-slate-700/80'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  <span>Gesloten Beurzen</span>
                  <span className="ml-1 px-1.5 py-0.2 rounded bg-slate-900 text-[10px] font-mono-code text-slate-300 border border-slate-700/50">
                    {closedCount}
                  </span>
                </button>

                <button
                  onClick={() => handleTabChange('all')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-slate-800 text-white font-bold shadow-sm border border-slate-700/80'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>Alle</span>
                  <span className="ml-1 px-1.5 py-0.2 rounded bg-slate-900 text-[10px] font-mono-code text-slate-400 border border-slate-700/50">
                    {markets.length}
                  </span>
                </button>
              </div>

              {/* Sub-label */}
              <div className="text-[11px] text-slate-500 font-mono-code hidden sm:block">
                Selecteer een beurs voor analyse & koersgrafiek
              </div>
            </div>

            {/* Compact Market Card Grid (Max height with smooth scroll) */}
            <div className="max-h-[165px] overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2 custom-scrollbar">
              {activeTabMarkets.map(renderMarketCard)}
            </div>

            {/* LOWER PANE: Rich Institutional Stock Market Info & Historical Chart */}
            {selectedMarket ? (
              <div className={`mt-1 bg-[#060a14] rounded-xl p-3 sm:p-3.5 flex flex-col gap-3 shadow-inner border transition-all ${
                selectedMarket.status === 'OPEN'
                  ? (selectedMarket.changePercent >= 0 
                      ? 'border-emerald-500/70 ring-1 ring-emerald-500/25' 
                      : 'border-rose-500/70 ring-1 ring-rose-500/25')
                  : (selectedMarket.status === 'PRE_MARKET'
                      ? (selectedMarket.changePercent >= 0 
                          ? 'border-emerald-400/50 ring-1 ring-emerald-400/20' 
                          : 'border-rose-400/50 ring-1 ring-rose-400/20')
                      : 'border-slate-800/90')
              }`}>
                {/* Header row of selected market */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800/80 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base font-bold text-white tracking-tight">
                        {selectedMarket.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/80 text-[10.5px] font-mono-code text-slate-300">
                        {selectedMarket.yahooTicker}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold ${
                        selectedMarket.status === 'OPEN' || selectedMarket.status === 'PRE_MARKET'
                          ? (selectedMarket.changePercent >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30')
                          : 'bg-slate-800/90 text-slate-400 border border-slate-700/60'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          selectedMarket.status === 'OPEN' || selectedMarket.status === 'PRE_MARKET' 
                            ? (selectedMarket.changePercent >= 0 ? 'bg-emerald-400 live-beacon-pulse' : 'bg-rose-500 live-beacon-pulse')
                            : 'bg-slate-400'
                        }`} />
                        <span>{selectedMarket.statusLabel}</span>
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{selectedMarket.exchange}</span>
                      <span>•</span>
                      <span className="text-slate-300">{selectedMarket.city}, {selectedMarket.country}</span>
                      <span>•</span>
                      <span className="font-mono-code text-slate-400">Lokale tijd: {selectedMarket.localTime}</span>
                    </div>
                  </div>

                  {/* Live Price display */}
                  <div className="text-right font-mono-code">
                    <div className="flex items-baseline justify-end gap-1.5">
                      <span className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        {formatMarketPrice(selectedMarket.price, selectedMarket.currency)}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">{selectedMarket.currency}</span>
                    </div>
                    <div className={`text-xs font-semibold flex items-center justify-end gap-1 ${
                      selectedMarket.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {selectedMarket.changePercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{selectedMarket.change >= 0 ? '+' : ''}{selectedMarket.change.toFixed(2)}</span>
                      <span>({selectedMarket.changePercent >= 0 ? '+' : ''}{selectedMarket.changePercent.toFixed(2)}%)</span>
                    </div>
                  </div>
                </div>

                {/* 4 Key Institutional Financial Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono-code">
                  {/* 1. 52-Week Range */}
                  <div className="bg-[#090f1e] p-2.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="uppercase tracking-wider font-sans font-medium">52w Bereik</span>
                      <span className="text-slate-300 font-semibold">{fiftyTwoWeekPct.toFixed(0)}%</span>
                    </div>
                    <div className="my-1.5">
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden relative">
                        <div
                          className="h-full bg-gradient-to-r from-slate-600 via-emerald-600 to-emerald-400 rounded-full"
                          style={{ width: `${fiftyTwoWeekPct}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span title="52-Week Low">{formatMarketPrice(selectedMarket.fiftyTwoWeekLow, selectedMarket.currency)}</span>
                      <span title="52-Week High" className="text-slate-300 font-medium">{formatMarketPrice(selectedMarket.fiftyTwoWeekHigh, selectedMarket.currency)}</span>
                    </div>
                  </div>

                  {/* 2. Day Range */}
                  <div className="bg-[#090f1e] p-2.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="uppercase tracking-wider font-sans font-medium">Dagbereik</span>
                      <span className="text-slate-300 font-semibold">{dayRangePct.toFixed(0)}%</span>
                    </div>
                    <div className="my-1.5">
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden relative">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${dayRangePct}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span title="Dag Laag">{formatMarketPrice(selectedMarket.dayLow, selectedMarket.currency)}</span>
                      <span title="Dag Hoog" className="text-slate-300 font-medium">{formatMarketPrice(selectedMarket.dayHigh, selectedMarket.currency)}</span>
                    </div>
                  </div>

                  {/* 3. Vorige Slot */}
                  <div className="bg-[#090f1e] p-2.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-medium">
                      Vorige Slot
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-slate-100 my-0.5">
                      {formatMarketPrice(selectedMarket.previousClose || selectedMarket.price - selectedMarket.change, selectedMarket.currency)}
                    </div>
                    <div className="text-[9.5px] text-slate-500 truncate">
                      Officiële slotkoers
                    </div>
                  </div>

                  {/* 4. Handelsvolume */}
                  <div className="bg-[#090f1e] p-2.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-medium">
                      Handelsvolume
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-slate-100 my-0.5">
                      {formatVolume(selectedMarket.volume)}
                    </div>
                    <div className="text-[9.5px] text-slate-500 truncate">
                      Dagtotalen index
                    </div>
                  </div>
                </div>

                {/* Interactive Chart Module */}
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/60">
                  {/* Chart Header with Provider Design Switcher & Timeframe Switches */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    {/* Title & Design Theme Toggle */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-200 font-bold">
                        <BarChart2 className="w-3.5 h-3.5 text-slate-300" />
                        <span>Koersgrafiek ({selectedMarket.name})</span>
                      </div>

                    {/* 8 Timeframe Selector Buttons (24U, 1W, 3M, YTD, 1Y, 5Y, 10Y, ALL) */}
                    <div className="inline-flex flex-wrap items-center p-0.5 bg-[#080d1a] border border-slate-800/90 rounded-lg shadow-sm">
                      {[
                        { id: '24U' as const, label: '24U', title: 'Laatste 24 uur (Intraday hoge frequentie)' },
                        { id: '1W' as const, label: '1W', title: '1 Week (Uurbasis)' },
                        { id: '3M' as const, label: '3M', title: '3 Maanden (Dagbasis)' },
                        { id: 'YTD' as const, label: 'YTD', title: 'Year To Date (Sinds 1 januari)' },
                        { id: '1Y' as const, label: '1Y', title: '1 Jaar (Weekbasis)' },
                        { id: '5Y' as const, label: '5Y', title: '5 Jaar (Maandbasis)' },
                        { id: '10Y' as const, label: '10Y', title: '10 Jaar (Kwartaalbasis)' },
                        { id: 'ALL' as const, label: 'ALL', title: 'All-Time (Historische trend)' }
                      ].map(tf => {
                        const isTfActive = activeTimeframe === tf.id;
                        return (
                          <button
                            key={tf.id}
                            onClick={() => setActiveTimeframe(tf.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold transition cursor-pointer ${
                              isTfActive
                                ? 'bg-slate-700/90 text-white shadow-sm border border-slate-600'
                                : 'text-slate-400 hover:text-slate-200 border border-transparent'
                            }`}
                            title={tf.title}
                          >
                            {tf.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Unified live institutional SVG Financial Chart */}
                  <div className="w-full max-w-5xl mx-auto">
                  <MarketHistoryChart
                    chartData={currentChartData}
                    currency={selectedMarket.currency}
                    marketName={selectedMarket.name}
                    ticker={selectedMarket.yahooTicker}
                    timeframe={activeTimeframe}
                    theme={'ice'}
                  />
                  <div className="mt-1 flex items-center justify-between text-[9px] text-slate-500 font-mono-code px-1">
                    <span>{chartLoading ? 'LIVE HISTORY · SYNCING…' : 'LIVE HISTORY'}</span>
                    <span>{chartProvider}</span>
                  </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-1 bg-[#060a14]/60 border border-dashed border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center text-center text-slate-400 gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-slate-300">Geen aandelenmarkt geselecteerd</div>
                <div className="text-[11px] text-slate-500 max-w-sm">
                  Klik op een marktpunt op de wereldkaart of kies een beurs uit de lijst hierboven om realtime grafieken, koersanalyse en 52-weeks bereik te bekijken.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
