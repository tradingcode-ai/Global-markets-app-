import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Globe, RefreshCw, ChevronDown, ChevronUp,
  RotateCcw, Clock, TrendingUp, TrendingDown,
  Activity, BarChart2, ShieldCheck
} from 'lucide-react';
import * as topojson from 'topojson-client';
import { geoNaturalEarth1, geoPath, geoGraticule } from 'd3-geo';
import worldData from 'world-atlas/countries-110m.json';

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
  charts?: {
    '1W': ChartPoint[];
    '1M': ChartPoint[];
    '6M': ChartPoint[];
    '1Y': ChartPoint[];
  };
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
  continent: 'europe' | 'north_america' | 'asia' | 'middle_east' | 'south_asia' | 'oceania';
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
  world: { name: 'Wereld', zoom: 1, centerLng: 10, centerLat: 20 },
  europe: { name: 'Europa', zoom: 2.8, centerLng: 10, centerLat: 50 },
  north_america: { name: 'Noord-Amerika', zoom: 2.4, centerLng: -95, centerLat: 40 },
  asia: { name: 'Azië', zoom: 2.3, centerLng: 105, centerLat: 32 },
  middle_east: { name: 'Midden-Oosten', zoom: 3.2, centerLng: 48, centerLat: 26 },
  south_asia: { name: 'Zuid-Azië', zoom: 3.0, centerLng: 75, centerLat: 22 },
  oceania: { name: 'Oceanië', zoom: 2.6, centerLng: 140, centerLat: -28 }
};

// Deterministic chart history builder
export function buildClientMarketCharts(
  currentPrice: number,
  high52: number,
  low52: number,
  changePercent: number,
  seedStr: string
) {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  const nextRandom = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return (seed >>> 0) / 4294967296;
  };

  const now = new Date();

  // 1W: 7 days
  const chart1W: ChartPoint[] = [];
  const start1W = currentPrice * (1 - (changePercent / 100) * 0.7 - (nextRandom() - 0.5) * 0.015);
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const progress = (6 - i) / 6;
    const wave = Math.sin(progress * Math.PI * 1.5) * (currentPrice * 0.008);
    const noise = (nextRandom() - 0.5) * (currentPrice * 0.005);
    const val = i === 0 ? currentPrice : +(start1W + (currentPrice - start1W) * progress + wave + noise).toFixed(2);
    chart1W.push({
      date: d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' }),
      value: val
    });
  }

  // 1M: 22 points
  const chart1M: ChartPoint[] = [];
  const start1M = currentPrice * (1 - (nextRandom() * 0.05 - 0.02));
  for (let i = 21; i >= 0; i--) {
    const d = new Date(now.getTime() - i * (86400000 * 1.35));
    const progress = (21 - i) / 21;
    const wave = Math.sin(progress * Math.PI * 2.5) * (currentPrice * 0.018);
    const noise = (nextRandom() - 0.5) * (currentPrice * 0.01);
    const val = i === 0 ? currentPrice : +(start1M + (currentPrice - start1M) * progress + wave + noise).toFixed(2);
    chart1M.push({
      date: d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }),
      value: val
    });
  }

  // 6M: 26 points
  const chart6M: ChartPoint[] = [];
  const start6M = Math.max(low52 * 1.03, currentPrice * (1 - (nextRandom() * 0.12 - 0.03)));
  for (let i = 25; i >= 0; i--) {
    const d = new Date(now.getTime() - i * (7 * 86400000));
    const progress = (25 - i) / 25;
    const wave = Math.sin(progress * Math.PI * 3.2) * (currentPrice * 0.035);
    const noise = (nextRandom() - 0.5) * (currentPrice * 0.02);
    const val = i === 0 ? currentPrice : +(start6M + (currentPrice - start6M) * progress + wave + noise).toFixed(2);
    chart6M.push({
      date: d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: '2-digit' }),
      value: Math.min(high52, Math.max(low52, val))
    });
  }

  // 1Y: 52 points
  const chart1Y: ChartPoint[] = [];
  const start1Y = low52 + (high52 - low52) * (0.2 + nextRandom() * 0.3);
  for (let i = 51; i >= 0; i--) {
    const d = new Date(now.getTime() - i * (7 * 86400000));
    const progress = (51 - i) / 51;
    const wave = Math.sin(progress * Math.PI * 4) * ((high52 - low52) * 0.15);
    const noise = (nextRandom() - 0.5) * ((high52 - low52) * 0.06);
    const val = i === 0 ? currentPrice : +(start1Y + (currentPrice - start1Y) * progress + wave + noise).toFixed(2);
    chart1Y.push({
      date: d.toLocaleDateString('nl-NL', { month: 'short', year: '2-digit' }),
      value: Math.min(high52, Math.max(low52, val))
    });
  }

  return {
    '1W': chart1W,
    '1M': chart1M,
    '6M': chart6M,
    '1Y': chart1Y
  };
}

const DEFAULT_MARKETS: MarketItem[] = [
  {
    id: 'sp500',
    name: 'S&P 500',
    exchange: 'NYSE / NASDAQ',
    city: 'New York',
    country: 'Verenigde Staten',
    region: 'americas',
    lat: 40.7128,
    lng: -74.0060,
    timeZone: 'America/New_York',
    yahooTicker: '^GSPC',
    price: 5864.20,
    change: 24.50,
    changePercent: 0.42,
    dayLow: 5840.10,
    dayHigh: 5878.50,
    fiftyTwoWeekHigh: 5878.50,
    fiftyTwoWeekLow: 4103.78,
    volume: 2350000000,
    currency: 'USD',
    previousClose: 5839.70,
    status: 'CLOSED',
    statusLabel: 'Closed',
    statusColor: '#64748b',
    localTime: '16:00'
  },
  {
    id: 'nasdaq',
    name: 'Nasdaq Composite',
    exchange: 'NASDAQ',
    city: 'New York',
    country: 'Verenigde Staten',
    region: 'americas',
    lat: 40.7128,
    lng: -74.0060,
    timeZone: 'America/New_York',
    yahooTicker: '^IXIC',
    price: 18450.30,
    change: 119.80,
    changePercent: 0.65,
    dayLow: 18380.00,
    dayHigh: 18510.00,
    fiftyTwoWeekHigh: 18671.07,
    fiftyTwoWeekLow: 12543.85,
    volume: 4820000000,
    currency: 'USD',
    previousClose: 18330.50,
    status: 'CLOSED',
    statusLabel: 'Closed',
    statusColor: '#64748b',
    localTime: '16:00'
  },
  {
    id: 'dow',
    name: 'Dow Jones Industrial Average',
    exchange: 'NYSE',
    city: 'New York',
    country: 'Verenigde Staten',
    region: 'americas',
    lat: 40.7128,
    lng: -74.0060,
    timeZone: 'America/New_York',
    yahooTicker: '^DJI',
    price: 42860.10,
    change: 107.20,
    changePercent: 0.25,
    dayLow: 42750.00,
    dayHigh: 42930.00,
    fiftyTwoWeekHigh: 43325.09,
    fiftyTwoWeekLow: 32327.20,
    volume: 395000000,
    currency: 'USD',
    previousClose: 42752.90,
    status: 'CLOSED',
    statusLabel: 'Closed',
    statusColor: '#64748b',
    localTime: '16:00'
  },
  {
    id: 'aex',
    name: 'AEX Index',
    exchange: 'Euronext Amsterdam',
    city: 'Amsterdam',
    country: 'Nederland',
    region: 'europe',
    lat: 52.3676,
    lng: 4.9041,
    timeZone: 'Europe/Amsterdam',
    yahooTicker: '^AEX',
    price: 914.80,
    change: 5.60,
    changePercent: 0.62,
    dayLow: 910.20,
    dayHigh: 916.40,
    fiftyTwoWeekHigh: 949.14,
    fiftyTwoWeekLow: 714.28,
    volume: 45200000,
    currency: 'EUR',
    previousClose: 909.20,
    status: 'CLOSED',
    statusLabel: 'Closed',
    statusColor: '#64748b',
    localTime: '17:30'
  },
  {
    id: 'ftse100',
    name: 'FTSE 100',
    exchange: 'London Stock Exchange',
    city: 'London',
    country: 'Verenigd Koninkrijk',
    region: 'europe',
    lat: 51.5074,
    lng: -0.1278,
    timeZone: 'Europe/London',
    yahooTicker: '^FTSE',
    price: 8245.50,
    change: -12.30,
    changePercent: -0.15,
    dayLow: 8220.10,
    dayHigh: 8270.40,
    fiftyTwoWeekHigh: 8487.71,
    fiftyTwoWeekLow: 7384.18,
    volume: 780000000,
    currency: 'GBP',
    previousClose: 8257.80,
    status: 'CLOSED',
    statusLabel: 'Closed',
    statusColor: '#64748b',
    localTime: '16:30'
  },
  {
    id: 'cac40',
    name: 'CAC 40',
    exchange: 'Euronext Paris',
    city: 'Paris',
    country: 'Frankrijk',
    region: 'europe',
    lat: 48.8566,
    lng: 2.3522,
    timeZone: 'Europe/Paris',
    yahooTicker: '^FCHI',
    price: 7532.10,
    change: 25.40,
    changePercent: 0.34,
    dayLow: 7505.00,
    dayHigh: 7555.20,
    fiftyTwoWeekHigh: 8259.19,
    fiftyTwoWeekLow: 6773.84,
    volume: 92000000,
    currency: 'EUR',
    previousClose: 7506.70,
    status: 'CLOSED',
    statusLabel: 'Closed',
    statusColor: '#64748b',
    localTime: '17:30'
  },
  {
    id: 'dax',
    name: 'DAX 40',
    exchange: 'Deutsche Börse',
    city: 'Frankfurt',
    country: 'Duitsland',
    region: 'europe',
    lat: 50.1109,
    lng: 8.6821,
    timeZone: 'Europe/Berlin',
    yahooTicker: '^GDAXI',
    price: 19430.70,
    change: 54.10,
    changePercent: 0.28,
    dayLow: 19370.00,
    dayHigh: 19485.60,
    fiftyTwoWeekHigh: 19674.68,
    fiftyTwoWeekLow: 14630.21,
    volume: 68000000,
    currency: 'EUR',
    previousClose: 19376.60,
    status: 'CLOSED',
    statusLabel: 'Closed',
    statusColor: '#64748b',
    localTime: '17:30'
  },
  {
    id: 'nikkei',
    name: 'Nikkei 225',
    exchange: 'Tokyo Stock Exchange',
    city: 'Tokyo',
    country: 'Japan',
    region: 'asia',
    lat: 35.6762,
    lng: 139.6503,
    timeZone: 'Asia/Tokyo',
    yahooTicker: '^N225',
    price: 38920.40,
    change: -164.20,
    changePercent: -0.42,
    dayLow: 38750.00,
    dayHigh: 39120.00,
    fiftyTwoWeekHigh: 42426.77,
    fiftyTwoWeekLow: 30487.67,
    volume: 1450000000,
    currency: 'JPY',
    previousClose: 39084.60,
    status: 'OPEN',
    statusLabel: 'Open',
    statusColor: '#10b981',
    localTime: '10:45'
  },
  {
    id: 'sse',
    name: 'SSE Composite Index',
    exchange: 'Shanghai Stock Exchange',
    city: 'Shanghai',
    country: 'China',
    region: 'asia',
    lat: 31.2304,
    lng: 121.4737,
    timeZone: 'Asia/Shanghai',
    yahooTicker: '000001.SS',
    price: 3315.80,
    change: 25.60,
    changePercent: 0.78,
    dayLow: 3290.00,
    dayHigh: 3330.00,
    fiftyTwoWeekHigh: 3674.40,
    fiftyTwoWeekLow: 2635.09,
    volume: 2650000000,
    currency: 'CNY',
    previousClose: 3290.20,
    status: 'OPEN',
    statusLabel: 'Open',
    statusColor: '#10b981',
    localTime: '10:45'
  },
  {
    id: 'hsi',
    name: 'Hang Seng Index',
    exchange: 'Hong Kong Exchanges',
    city: 'Hong Kong',
    country: 'Hong Kong',
    region: 'asia',
    lat: 22.3193,
    lng: 114.1694,
    timeZone: 'Asia/Hong_Kong',
    yahooTicker: '^HSI',
    price: 20640.10,
    change: 252.00,
    changePercent: 1.24,
    dayLow: 20400.00,
    dayHigh: 20720.00,
    fiftyTwoWeekHigh: 23241.74,
    fiftyTwoWeekLow: 14794.16,
    volume: 2100000000,
    currency: 'HKD',
    previousClose: 20388.10,
    status: 'OPEN',
    statusLabel: 'Open',
    statusColor: '#10b981',
    localTime: '10:45'
  },
  {
    id: 'taiex',
    name: 'TAIEX',
    exchange: 'Taiwan Stock Exchange',
    city: 'Taipei',
    country: 'Taiwan',
    region: 'asia',
    lat: 25.0330,
    lng: 121.5654,
    timeZone: 'Asia/Taipei',
    yahooTicker: '^TWII',
    price: 23204.30,
    change: 218.40,
    changePercent: 0.95,
    dayLow: 23050.00,
    dayHigh: 23280.00,
    fiftyTwoWeekHigh: 24416.67,
    fiftyTwoWeekLow: 15975.18,
    volume: 920000000,
    currency: 'TWD',
    previousClose: 22985.90,
    status: 'OPEN',
    statusLabel: 'Open',
    statusColor: '#10b981',
    localTime: '10:45'
  },
  {
    id: 'kospi',
    name: 'KOSPI',
    exchange: 'Korea Exchange',
    city: 'Seoul',
    country: 'Zuid-Korea',
    region: 'asia',
    lat: 37.5665,
    lng: 126.9780,
    timeZone: 'Asia/Seoul',
    yahooTicker: '^KS11',
    price: 2580.60,
    change: -8.10,
    changePercent: -0.31,
    dayLow: 2570.00,
    dayHigh: 2595.00,
    fiftyTwoWeekHigh: 2896.43,
    fiftyTwoWeekLow: 2273.97,
    volume: 480000000,
    currency: 'KRW',
    previousClose: 2588.70,
    status: 'OPEN',
    statusLabel: 'Open',
    statusColor: '#10b981',
    localTime: '10:45'
  },
  {
    id: 'tasi',
    name: 'Tadawul All Share Index (TASI)',
    exchange: 'Saudi Exchange',
    city: 'Riyadh',
    country: 'Saoedi-Arabië',
    region: 'middle_east',
    lat: 24.7136,
    lng: 46.6753,
    timeZone: 'Asia/Riyadh',
    yahooTicker: '^TASI.SR',
    price: 11980.20,
    change: 21.50,
    changePercent: 0.18,
    dayLow: 11940.00,
    dayHigh: 12010.00,
    fiftyTwoWeekHigh: 12883.35,
    fiftyTwoWeekLow: 10262.30,
    volume: 220000000,
    currency: 'SAR',
    previousClose: 11958.70,
    status: 'CLOSED',
    statusLabel: 'Closed',
    statusColor: '#64748b',
    localTime: '18:00'
  },
  {
    id: 'adx',
    name: 'FTSE ADX 15',
    exchange: 'Abu Dhabi Securities Exch.',
    city: 'Abu Dhabi',
    country: 'VAE',
    region: 'middle_east',
    lat: 24.4539,
    lng: 54.3773,
    timeZone: 'Asia/Dubai',
    yahooTicker: 'AIR.AD',
    price: 9280.90,
    change: -4.60,
    changePercent: -0.05,
    dayLow: 9250.00,
    dayHigh: 9310.00,
    fiftyTwoWeekHigh: 9720.50,
    fiftyTwoWeekLow: 8890.10,
    volume: 98000000,
    currency: 'AED',
    previousClose: 9285.50,
    status: 'CLOSED',
    statusLabel: 'Closed',
    statusColor: '#64748b',
    localTime: '18:00'
  },
  {
    id: 'nifty',
    name: 'NIFTY 50',
    exchange: 'National Stock Exch. of India',
    city: 'Mumbai',
    country: 'India',
    region: 'asia',
    lat: 19.0760,
    lng: 72.8777,
    timeZone: 'Asia/Kolkata',
    yahooTicker: '^NSEI',
    price: 24850.40,
    change: 136.20,
    changePercent: 0.55,
    dayLow: 24760.00,
    dayHigh: 24920.00,
    fiftyTwoWeekHigh: 26277.35,
    fiftyTwoWeekLow: 18837.85,
    volume: 670000000,
    currency: 'INR',
    previousClose: 24714.20,
    status: 'CLOSED',
    statusLabel: 'Closed',
    statusColor: '#64748b',
    localTime: '17:30'
  },
  {
    id: 'asx',
    name: 'S&P/ASX 200',
    exchange: 'Australian Securities Exch.',
    city: 'Sydney',
    country: 'Australië',
    region: 'oceania',
    lat: -33.8688,
    lng: 151.2093,
    timeZone: 'Australia/Sydney',
    yahooTicker: '^AXJO',
    price: 8210.10,
    change: 9.80,
    changePercent: 0.12,
    dayLow: 8185.00,
    dayHigh: 8235.00,
    fiftyTwoWeekHigh: 8384.70,
    fiftyTwoWeekLow: 6751.30,
    volume: 580000000,
    currency: 'AUD',
    previousClose: 8200.30,
    status: 'OPEN',
    statusLabel: 'Open',
    statusColor: '#10b981',
    localTime: '12:45'
  }
];

// Helper to format currency values cleanly
function formatMarketPrice(val: number, cur: string = 'USD'): string {
  const digits = (cur === 'JPY' || cur === 'KRW') ? 0 : 2;
  return val.toLocaleString('nl-NL', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

// Helper to format large institutional volume
function formatVolume(vol?: number): string {
  if (!vol || vol <= 0) return '--';
  if (vol >= 1_000_000_000) {
    return (vol / 1_000_000_000).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Mld';
  }
  if (vol >= 1_000_000) {
    return (vol / 1_000_000).toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' Mln';
  }
  return vol.toLocaleString('nl-NL');
}

// Interactive Financial History Chart Component
interface MarketHistoryChartProps {
  chartData: ChartPoint[];
  currency: string;
  isPositive: boolean;
  timeframe: '1W' | '1M' | '6M' | '1Y';
}

const MarketHistoryChart: React.FC<MarketHistoryChartProps> = ({
  chartData,
  currency,
  isPositive,
  timeframe
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-xs text-slate-500 font-mono">
        Geen historische grafiekdata beschikbaar
      </div>
    );
  }

  const values = chartData.map(d => d.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const valSpread = rawMax - rawMin || 1;
  const paddingBuffer = valSpread * 0.08;
  const yMin = rawMin - paddingBuffer;
  const yMax = rawMax + paddingBuffer;
  const yRange = yMax - yMin;

  const width = 540;
  const height = 130;
  const topPad = 12;
  const bottomPad = 22;
  const leftPad = 6;
  const rightPad = 70; // room for price labels
  const plotWidth = width - leftPad - rightPad;
  const plotHeight = height - topPad - bottomPad;

  // Calculate coords for points
  const points = chartData.map((d, i) => {
    const x = leftPad + (i / (chartData.length - 1)) * plotWidth;
    const y = topPad + plotHeight - ((d.value - yMin) / yRange) * plotHeight;
    return { x, y, ...d };
  });

  // SVG Line path
  const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  // Area path
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)},${(topPad + plotHeight).toFixed(1)} L ${points[0].x.toFixed(1)},${(topPad + plotHeight).toFixed(1)} Z`;

  const strokeColor = isPositive ? '#10b981' : '#f43f5e';
  const gradientId = `chartGrad_${timeframe}_${isPositive ? 'pos' : 'neg'}`;

  const startVal = values[0];
  const endVal = values[values.length - 1];
  const diff = endVal - startVal;
  const diffPct = (diff / startVal) * 100;
  const isPeriodPos = diff >= 0;

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

  return (
    <div className="flex flex-col gap-1.5">
      {/* Performance Bar */}
      <div className="flex items-center justify-between text-[11px] px-1 font-mono-code">
        <span className="text-slate-400">
          Periode verloop ({timeframe}):
        </span>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">
            {formatMarketPrice(startVal, currency)} → <span className="text-slate-200 font-semibold">{formatMarketPrice(endVal, currency)}</span>
          </span>
          <span className={`font-semibold flex items-center gap-0.5 ${isPeriodPos ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPeriodPos ? '+' : ''}{diff.toFixed(2)} ({isPeriodPos ? '+' : ''}{diffPct.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full rounded-lg bg-[#040813] border border-slate-800/80 overflow-hidden select-none">
        <svg
          ref={svgRef}
          className="w-full h-[125px] sm:h-[135px] cursor-crosshair block"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.28" />
              <stop offset="90%" stopColor={strokeColor} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Horizontal Reference Lines */}
          <line
            x1={leftPad}
            y1={topPad}
            x2={leftPad + plotWidth}
            y2={topPad}
            stroke="#1e293b"
            strokeWidth="0.8"
            strokeDasharray="3 3"
          />
          <text
            x={leftPad + plotWidth + 6}
            y={topPad + 4}
            fill="#64748b"
            fontSize="9"
            fontFamily="monospace"
          >
            {formatMarketPrice(rawMax, currency)}
          </text>

          <line
            x1={leftPad}
            y1={topPad + plotHeight / 2}
            x2={leftPad + plotWidth}
            y2={topPad + plotHeight / 2}
            stroke="#1e293b"
            strokeWidth="0.5"
            strokeDasharray="3 3"
          />

          <line
            x1={leftPad}
            y1={topPad + plotHeight}
            x2={leftPad + plotWidth}
            y2={topPad + plotHeight}
            stroke="#1e293b"
            strokeWidth="0.8"
            strokeDasharray="3 3"
          />
          <text
            x={leftPad + plotWidth + 6}
            y={topPad + plotHeight + 3}
            fill="#64748b"
            fontSize="9"
            fontFamily="monospace"
          >
            {formatMarketPrice(rawMin, currency)}
          </text>

          {/* Area Fill */}
          <path d={areaPath} fill={`url(#${gradientId})`} />

          {/* Trendline */}
          <path
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Start and End date labels */}
          <text
            x={leftPad}
            y={height - 6}
            fill="#64748b"
            fontSize="8.5"
            fontFamily="monospace"
          >
            {chartData[0]?.date}
          </text>
          <text
            x={leftPad + plotWidth}
            y={height - 6}
            textAnchor="end"
            fill="#64748b"
            fontSize="8.5"
            fontFamily="monospace"
          >
            {chartData[chartData.length - 1]?.date}
          </text>

          {/* Crosshair on active hover */}
          {activePoint && (
            <g>
              {/* Vertical line */}
              <line
                x1={activePoint.x}
                y1={topPad}
                x2={activePoint.x}
                y2={topPad + plotHeight}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />

              {/* Highlight dot on curve */}
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="4.5"
                fill={strokeColor}
                stroke="#0f172a"
                strokeWidth="2"
              />

              {/* Floating Tooltip Box */}
              <g
                transform={`translate(${Math.max(10, Math.min(width - 130, activePoint.x - 55))}, ${Math.max(6, activePoint.y - 38)})`}
              >
                <rect
                  x="0"
                  y="0"
                  width="110"
                  height="28"
                  rx="4"
                  fill="#0b1120"
                  stroke="#334155"
                  strokeWidth="0.8"
                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
                />
                <text
                  x="55"
                  y="11"
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="8"
                  fontFamily="sans-serif"
                >
                  {activePoint.date}
                </text>
                <text
                  x="55"
                  y="22"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="9.5"
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
  const [markets, setMarkets] = useState<MarketItem[]>(() => {
    return DEFAULT_MARKETS.map(m => ({
      ...m,
      charts: buildClientMarketCharts(m.price, m.fiftyTwoWeekHigh, m.fiftyTwoWeekLow, m.changePercent, m.id)
    }));
  });

  const [isExpanded, setIsExpanded] = useState(true);
  const [activeContinent, setActiveContinent] = useState<string>('world');
  const [selectedHub, setSelectedHub] = useState<CityHub | null>(null);
  
  // Selected market for detailed analysis below the list
  const [selectedMarketId, setSelectedMarketId] = useState<string>('sp500');
  
  // Tab filter: 'open' | 'closed' | 'all'
  const [activeTab, setActiveTab] = useState<'open' | 'closed' | 'all'>('open');
  
  // Timeframe for the historical chart: '1W' | '1M' | '6M' | '1Y'
  const [activeTimeframe, setActiveTimeframe] = useState<'1W' | '1M' | '6M' | '1Y'>('1M');

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

  // Vector Map Zoom state (Fixed, Non-moveable by dragging)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

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
            asx: 'oceania'
          };

          setMarkets(data.markets.map((m: any) => {
            const high52 = m.fiftyTwoWeekHigh || m.price * 1.08;
            const low52 = m.fiftyTwoWeekLow || m.price * 0.82;
            const charts = m.charts || buildClientMarketCharts(m.price, high52, low52, m.changePercent, m.id);

            return {
              ...m,
              region: regionMap[m.id] || 'europe',
              fiftyTwoWeekHigh: high52,
              fiftyTwoWeekLow: low52,
              volume: m.volume || 150000000,
              currency: m.currency || 'USD',
              charts
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

  // Reset to full world view
  const handleResetView = () => {
    zoomToContinent('world');
    setSelectedHub(null);
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

  // When clicking on a market in the list:
  const handleSelectMarket = (m: MarketItem) => {
    setSelectedMarketId(m.id);
    const hub = getHubForMarket(m.id);
    if (hub) {
      setSelectedHub(hub);
      zoomToContinent(hub.continent);
    }
  };

  // When clicking a City Hub on the map:
  const handleSelectHub = (hub: CityHub) => {
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

  // Active selected market object
  const selectedMarket = useMemo(() => {
    return markets.find(m => m.id === selectedMarketId) || markets[0];
  }, [markets, selectedMarketId]);

  // If user switches tab and selected market is not in that tab, optionally switch to the first market
  const handleTabChange = (tab: 'open' | 'closed' | 'all') => {
    setActiveTab(tab);
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

  // Chart data for current selection & timeframe
  const currentChartData = useMemo(() => {
    if (!selectedMarket) return [];
    if (selectedMarket.charts && selectedMarket.charts[activeTimeframe]) {
      return selectedMarket.charts[activeTimeframe];
    }
    const generated = buildClientMarketCharts(
      selectedMarket.price,
      selectedMarket.fiftyTwoWeekHigh,
      selectedMarket.fiftyTwoWeekLow,
      selectedMarket.changePercent,
      selectedMarket.id
    );
    return generated[activeTimeframe];
  }, [selectedMarket, activeTimeframe]);

  // Render a compact corporate market card
  const renderMarketCard = (m: MarketItem) => {
    const isPos = m.changePercent >= 0;
    const isSelected = selectedMarketId === m.id;
    const isOpen = m.status === 'OPEN' || m.status === 'PRE_MARKET';

    return (
      <div
        key={m.id}
        onClick={() => handleSelectMarket(m)}
        className={`p-2.5 rounded-lg border text-left transition cursor-pointer relative group ${
          isSelected
            ? 'bg-[#10182b] border-emerald-500/80 shadow-md ring-1 ring-emerald-500/30'
            : 'bg-[#080d19]/90 hover:bg-[#0d1527] border-slate-800/80 hover:border-slate-700'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {/* Market Name & Dot */}
            <div className="flex items-center gap-1.5">
              <span 
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOpen ? 'bg-emerald-400' : 'bg-slate-500'}`}
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
          <span className={`font-mono-code ${isOpen ? 'text-emerald-400/90 font-medium' : 'text-slate-400'}`}>
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
            <span>Open</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#64748b]"></span>
            <span>Gesloten</span>
          </span>
        </div>
      </div>

      {/* 3. Main Split Content Area: Left = Map, Right = Tabs + Market Selection + Rich Detail below */}
      {isExpanded && (
        <div className="p-3.5 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* LEFT COLUMN: Fixed World Map (Non-moveable, zooms to continent on selection) */}
          <div className="lg:col-span-5 flex flex-col gap-2">
            {/* Map Header with active continent & Reset Button */}
            <div className="flex items-center justify-between px-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Kaartweergave:</span>
                <span className="font-semibold text-slate-200 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
                  {CONTINENT_VIEWPORTS[activeContinent]?.name || 'Wereld'}
                </span>
                {selectedHub && (
                  <span className="text-[11px] text-emerald-400 font-medium truncate max-w-[150px]">
                    • {selectedHub.cityName}
                  </span>
                )}
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
                    const isOpen = hubMarkets.some(m => m.status === 'OPEN' || m.status === 'PRE_MARKET');

                    // Closed markets are plain neutral gray (#64748b) without glow
                    const pinColor = isOpen ? '#10b981' : '#64748b';

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
                        {/* Animated Pulse Beacon ONLY for Open Markets */}
                        {isOpen && (
                          <circle
                            r={isSelected ? "11" : "7.5"}
                            fill="#10b981"
                            opacity="0.3"
                            className="animate-ping"
                          />
                        )}

                        {/* Pin Outer Ring */}
                        <circle
                          r={isSelected ? "5.5" : (isAlwaysNamed ? "3.8" : "3.0")}
                          fill={pinColor}
                          stroke={isOpen ? "#ffffff" : "#475569"}
                          strokeWidth={isSelected ? "1.8" : (isOpen ? "1.0" : "0.75")}
                          filter={isOpen ? "url(#cityGlow)" : undefined}
                        />

                        {/* Inner Dot for Open Markets */}
                        {isOpen && (
                          <circle
                            r="1.6"
                            fill="#ffffff"
                          />
                        )}

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
                              stroke={isSelected ? '#38bdf8' : (isOpen ? '#1e293b' : '#334155')}
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
            {selectedMarket && (
              <div className="mt-1 bg-[#060a14] border border-slate-800 rounded-xl p-3 sm:p-3.5 flex flex-col gap-3 shadow-inner">
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
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800/90 text-slate-400 border border-slate-700/60'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          selectedMarket.status === 'OPEN' || selectedMarket.status === 'PRE_MARKET' ? 'bg-emerald-400 live-beacon-pulse' : 'bg-slate-400'
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
                <div className="flex flex-col gap-2 pt-1 border-t border-slate-800/60">
                  {/* Chart Header with Timeframe Switches */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
                      <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Historisch Koersverloop ({selectedMarket.name})</span>
                    </div>

                    {/* Timeframe Selector Buttons */}
                    <div className="inline-flex items-center p-0.5 bg-[#0a1020] border border-slate-800 rounded-md">
                      {(['1W', '1M', '6M', '1Y'] as const).map(tf => {
                        const labelMap = {
                          '1W': '1 Week',
                          '1M': '1 Maand',
                          '6M': '6 Maanden',
                          '1Y': '1 Jaar'
                        };
                        const isTfActive = activeTimeframe === tf;

                        return (
                          <button
                            key={tf}
                            onClick={() => setActiveTimeframe(tf)}
                            className={`px-2 py-0.5 rounded text-[10.5px] font-mono-code font-bold transition cursor-pointer ${
                              isTfActive
                                ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                            title={labelMap[tf]}
                          >
                            {tf}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* SVG Chart */}
                  <MarketHistoryChart
                    chartData={currentChartData}
                    currency={selectedMarket.currency}
                    isPositive={selectedMarket.changePercent >= 0}
                    timeframe={activeTimeframe}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
