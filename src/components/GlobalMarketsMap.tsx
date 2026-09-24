import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Globe, RefreshCw, ChevronDown, ChevronUp,
  RotateCcw, Clock, TrendingUp, TrendingDown,
  BarChart2
} from 'lucide-react';
import * as topojson from 'topojson-client';
import { geoNaturalEarth1, geoPath, geoGraticule } from 'd3-geo';
import worldData from 'world-atlas/countries-110m.json';

export type ChartTimeframe = '24U' | '1W' | '3M' | 'YTD' | '1Y' | '5Y' | '10Y' | 'ALL';

export interface ChartPoint {
  timestamp: number;
  date: string;
  value: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
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
    yahooTicker: 'FADX15.FGI',
    price: 10864.70,
    change: -10.70,
    changePercent: -0.10,
    dayLow: 10797.87,
    dayHigh: 10890.81,
    fiftyTwoWeekHigh: 10890.81,
    fiftyTwoWeekLow: 8890.10,
    volume: 98000000,
    currency: 'AED',
    previousClose: 10875.40,
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
  },
  {
    id: 'tsx',
    name: 'S&P/TSX Composite',
    exchange: 'TSX',
    city: 'Toronto',
    country: 'Canada',
    region: 'americas',
    lat: 43.6532,
    lng: -79.3832,
    timeZone: 'America/Toronto',
    yahooTicker: '^GSPTSE',
    price: 24720.50,
    change: 86.40,
    changePercent: 0.35,
    dayLow: 24650.00,
    dayHigh: 24790.00,
    fiftyTwoWeekHigh: 25010.40,
    fiftyTwoWeekLow: 19120.30,
    volume: 245000000,
    currency: 'CAD',
    previousClose: 24634.10,
    status: 'CLOSED',
    statusLabel: 'Closed',
    statusColor: '#64748b',
    localTime: '16:00'
  },
  {
    id: 'smi',
    name: 'Swiss Market Index (SMI)',
    exchange: 'SIX Swiss Exchange',
    city: 'Zürich',
    country: 'Zwitserland',
    region: 'europe',
    lat: 47.3769,
    lng: 8.5417,
    timeZone: 'Europe/Zurich',
    yahooTicker: '^SSMI',
    price: 12150.80,
    change: 26.70,
    changePercent: 0.22,
    dayLow: 12110.00,
    dayHigh: 12190.00,
    fiftyTwoWeekHigh: 12450.90,
    fiftyTwoWeekLow: 10820.40,
    volume: 42000000,
    currency: 'CHF',
    previousClose: 12124.10,
    status: 'CLOSED',
    statusLabel: 'Closed',
    statusColor: '#64748b',
    localTime: '17:30'
  },
  {
    id: 'ibovespa',
    name: 'Ibovespa',
    exchange: 'B3',
    city: 'São Paulo',
    country: 'Brazilië',
    region: 'americas',
    lat: -23.5505,
    lng: -46.6333,
    timeZone: 'America/Sao_Paulo',
    yahooTicker: '^BVSP',
    price: 131850.00,
    change: 628.00,
    changePercent: 0.48,
    dayLow: 131100.00,
    dayHigh: 132400.00,
    fiftyTwoWeekHigh: 137469.00,
    fiftyTwoWeekLow: 118120.00,
    volume: 1250000000,
    currency: 'BRL',
    previousClose: 131222.00,
    status: 'CLOSED',
    statusLabel: 'Closed',
    statusColor: '#64748b',
    localTime: '17:00'
  },
  {
    id: 'ibex',
    name: 'IBEX 35',
    exchange: 'Bolsa de Madrid',
    city: 'Madrid',
    country: 'Spanje',
    region: 'europe',
    lat: 40.4168,
    lng: -3.7038,
    timeZone: 'Europe/Madrid',
    yahooTicker: '^IBEX',
    price: 11840.60,
    change: 22.40,
    changePercent: 0.19,
    dayLow: 11790.00,
    dayHigh: 11880.00,
    fiftyTwoWeekHigh: 12020.40,
    fiftyTwoWeekLow: 8850.10,
    volume: 110000000,
    currency: 'EUR',
    previousClose: 11818.20,
    status: 'CLOSED',
    statusLabel: 'Closed',
    statusColor: '#64748b',
    localTime: '17:30'
  },
  {
    id: 'ftsemib',
    name: 'FTSE MIB',
    exchange: 'Borsa Italiana',
    city: 'Milaan',
    country: 'Italië',
    region: 'europe',
    lat: 45.4642,
    lng: 9.1900,
    timeZone: 'Europe/Rome',
    yahooTicker: 'FTSEMIB.MI',
    price: 34820.30,
    change: 107.50,
    changePercent: 0.31,
    dayLow: 34680.00,
    dayHigh: 34950.00,
    fiftyTwoWeekHigh: 35450.20,
    fiftyTwoWeekLow: 27150.00,
    volume: 85000000,
    currency: 'EUR',
    previousClose: 34712.80,
    status: 'CLOSED',
    statusLabel: 'Closed',
    statusColor: '#64748b',
    localTime: '17:30'
  },
  {
    id: 'sti',
    name: 'Straits Times Index (STI)',
    exchange: 'SGX',
    city: 'Singapore',
    country: 'Singapore',
    region: 'asia',
    lat: 1.3521,
    lng: 103.8198,
    timeZone: 'Asia/Singapore',
    yahooTicker: '^STI',
    price: 3620.40,
    change: -4.35,
    changePercent: -0.12,
    dayLow: 3605.00,
    dayHigh: 3635.00,
    fiftyTwoWeekHigh: 3645.00,
    fiftyTwoWeekLow: 3040.50,
    volume: 220000000,
    currency: 'SGD',
    previousClose: 3624.75,
    status: 'CLOSED',
    statusLabel: 'Closed',
    statusColor: '#64748b',
    localTime: '17:00'
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

// Chart Design Theme Configurations inspired by top data providers (Bloomberg, ICE, LSEG/Morgan Stanley)
export 
interface MarketHistoryChartProps {
  chartData: ChartPoint[];
  currency: string;
  marketName: string;
  ticker?: string;
  timeframe: ChartTimeframe;
  loading?: boolean;
  provider?: string;
}

const formatChartPrice = (value: number, currency: string) => {
  if (!Number.isFinite(value)) return '—';
  const decimals = ['JPY', 'KRW'].includes(currency) ? 0 : value >= 1000 ? 0 : 2;
  return value.toLocaleString('nl-NL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

const MarketHistoryChart: React.FC<MarketHistoryChartProps> = ({
  chartData,
  currency,
  marketName,
  ticker,
  timeframe,
  loading = false,
  provider = 'Yahoo Finance Historical Chart API'
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto h-[260px] sm:h-[320px] rounded-xl border border-slate-800 bg-[#07101c] flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
          Historische marktdata laden…
        </div>
      </div>
    );
  }

  if (!chartData || chartData.length < 2) {
    return (
      <div className="w-full max-w-5xl mx-auto h-[260px] sm:h-[320px] rounded-xl border border-dashed border-slate-800 bg-[#07101c] flex items-center justify-center text-xs text-slate-500 font-mono">
        Geen historische data beschikbaar voor deze periode.
      </div>
    );
  }

  const values = chartData.map(d => d.value).filter(Number.isFinite);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const spread = rawMax - rawMin || Math.max(Math.abs(rawMax) * 0.01, 1);
  const pad = spread * 0.08;
  const yMin = rawMin - pad;
  const yMax = rawMax + pad;

  // A taller, narrower chart gives the market curve enough vertical resolution
  // without letting it dominate the entire Global Markets interface.
  const width = 1000;
  const height = 320;
  const leftPad = 18;
  const rightPad = 86;
  const topPad = 22;
  const bottomPad = 48;
  const plotWidth = width - leftPad - rightPad;
  const plotHeight = height - topPad - bottomPad;

  const points = chartData.map((d, i) => {
    const x = leftPad + (i / Math.max(1, chartData.length - 1)) * plotWidth;
    const y = topPad + plotHeight - ((d.value - yMin) / (yMax - yMin)) * plotHeight;
    return { ...d, x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)},${topPad + plotHeight} L ${points[0].x.toFixed(2)},${topPad + plotHeight} Z`;

  const startVal = points[0].value;
  const endVal = points[points.length - 1].value;
  const periodChange = endVal - startVal;
  const periodPct = startVal ? (periodChange / startVal) * 100 : 0;
  const isPositive = periodChange >= 0;

  const volumeValues = chartData.map(d => Number(d.volume || 0));
  const maxVolume = Math.max(...volumeValues, 1);
  const volumeTop = topPad + plotHeight - 2;
  const volumeHeight = 32;

  const gridCount = 6;
  const dateTickCount = Math.min(7, Math.max(2, points.length));
  const rawTickIndices = points.length <= 1
    ? [0]
    : Array.from({ length: dateTickCount }, (_, i) =>
        Math.round((i / Math.max(1, dateTickCount - 1)) * (points.length - 1))
      );
  const dateTickIndices = Array.from(new Set(rawTickIndices)).filter(
    idx => idx >= 0 && idx < points.length
  );

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const ratio = Math.max(0, Math.min(1, (x - leftPad) / plotWidth));
    setHoverIndex(Math.round(ratio * (points.length - 1)));
  };

  const activePoint = hoverIndex !== null ? points[hoverIndex] : null;
  const previousPoint = activePoint && hoverIndex !== null && hoverIndex > 0 ? points[hoverIndex - 1] : null;
  const pointChange = activePoint && previousPoint
    ? activePoint.value - previousPoint.value
    : 0;
  const pointChangePct = activePoint && previousPoint && previousPoint.value
    ? (pointChange / previousPoint.value) * 100
    : 0;

  const gradientId = `gmChartFill_${ticker || marketName}_${timeframe}`.replace(/[^a-zA-Z0-9_-]/g, '_');

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Professional chart header */}
      <div className="mb-2 flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold">
              {timeframe === '24U' ? 'Handelssessie · Vanaf marktopening' : 'Price history'}
            </span>
            <span className="text-[9px] text-slate-600 font-mono">{provider}</span>
          </div>
          <div className="mt-1 flex items-baseline gap-3 font-mono-code">
            <span className="text-xl sm:text-2xl font-bold text-white tabular-nums">
              {formatChartPrice(endVal, currency)}
            </span>
            <span className={`text-xs sm:text-sm font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositive ? '+' : ''}{periodChange.toFixed(2)} ({isPositive ? '+' : ''}{periodPct.toFixed(2)}%)
            </span>
          </div>
        </div>
        <div className="text-right text-[10px] text-slate-500 font-mono">
          <div>{marketName} · {timeframe === '24U' ? 'Handelssessie (24U)' : timeframe}</div>
          <div>{points.length} datapunten · {points[0]?.date || ''} – {points[points.length - 1]?.date || ''}</div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#07101c] overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
        <svg
          ref={svgRef}
          className="block w-full h-[260px] sm:h-[320px] cursor-crosshair"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
          role="img"
          aria-label={`${marketName} ${timeframe} price history`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Horizontal price grid */}
          {Array.from({ length: gridCount }, (_, i) => {
            const ratio = i / (gridCount - 1);
            const y = topPad + ratio * plotHeight;
            const value = yMax - ratio * (yMax - yMin);
            return (
              <g key={`grid-${i}`}>
                <line x1={leftPad} y1={y} x2={leftPad + plotWidth} y2={y}
                  stroke="#223047" strokeOpacity={i === gridCount - 1 ? 0.9 : 0.55}
                  strokeWidth="1" />
                <text x={leftPad + plotWidth + 10} y={y + 4}
                  fill="#64748b" fontSize="11" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
                  {formatChartPrice(value, currency)}
                </text>
              </g>
            );
          })}

          {/* Vertical guide lines */}
          {dateTickIndices.map((idx, i) => {
            const p = points[idx];
            return (
              <line key={`v-guideline-${i}-${idx}`} x1={p.x} y1={topPad} x2={p.x} y2={topPad + plotHeight}
                stroke="#1b2a3d" strokeOpacity="0.5" strokeWidth="1" />
            );
          })}

          {/* Volume profile at bottom when the source provides volume */}
          {maxVolume > 1 && points.map((p, i) => {
            const vol = Number(p.volume || 0);
            if (!vol) return null;
            const barWidth = Math.max(1.2, Math.min(5, plotWidth / points.length * 0.65));
            const h = (vol / maxVolume) * volumeHeight;
            return (
              <rect key={`vol-${i}`} x={p.x - barWidth / 2} y={volumeTop - h}
                width={barWidth} height={h} fill="#334155" opacity="0.42" />
            );
          })}

          {/* Price area + primary line */}
          <path d={areaPath} fill={`url(#${gradientId})`} />
          <path d={linePath} fill="none" stroke="#22d3ee" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round" />

          {/* End-price marker */}
          <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y}
            r="4" fill="#22d3ee" stroke="#07101c" strokeWidth="2" />

          {/* Date axis */}
          {dateTickIndices.map((idx, i) => {
            const p = points[idx];
            const isFirst = i === 0;
            const isLast = i === dateTickIndices.length - 1;
            return (
              <text key={`date-label-${i}-${idx}`} x={p.x} y={height - 14}
                textAnchor={isFirst ? 'start' : isLast ? 'end' : 'middle'}
                fill="#64748b" fontSize="10"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
                {p.date}
              </text>
            );
          })}

          {/* TradingView-style crosshair */}
          {activePoint && (
            <g>
              <line x1={activePoint.x} y1={topPad} x2={activePoint.x} y2={topPad + plotHeight}
                stroke="#94a3b8" strokeOpacity="0.55" strokeDasharray="4 4" />
              <line x1={leftPad} y1={activePoint.y} x2={leftPad + plotWidth} y2={activePoint.y}
                stroke="#94a3b8" strokeOpacity="0.35" strokeDasharray="4 4" />
              <circle cx={activePoint.x} cy={activePoint.y} r="5"
                fill="#07101c" stroke="#22d3ee" strokeWidth="2" />

              <g transform={`translate(${Math.max(12, Math.min(width - 190, activePoint.x - 78))}, ${Math.max(10, activePoint.y - 66)})`}>
                <rect width="166" height="52" rx="7" fill="#0b1422" stroke="#334155" />
                <text x="10" y="16" fill="#94a3b8" fontSize="9" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
                  {activePoint.date}
                </text>
                <text x="10" y="32" fill="#fff" fontSize="12" fontWeight="700" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
                  {formatChartPrice(activePoint.value, currency)} {currency}
                </text>
                {previousPoint && (
                  <text x="10" y="45" fill={pointChange >= 0 ? '#34d399' : '#fb7185'} fontSize="9" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
                    {pointChange >= 0 ? '+' : ''}{pointChange.toFixed(2)} ({pointChangePct >= 0 ? '+' : ''}{pointChangePct.toFixed(2)}%)
                  </text>
                )}
              </g>

              <g transform={`translate(${leftPad + plotWidth + 4}, ${activePoint.y - 10})`}>
                <rect width="76" height="20" rx="3" fill="#22d3ee" />
                <text x="38" y="14" textAnchor="middle" fill="#041018" fontSize="10" fontWeight="700"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
                  {formatChartPrice(activePoint.value, currency)}
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
              currency: m.currency || 'USD',
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

  // Historical chart data is fetched only for the selected market/timeframe.
  // This guarantees that the graph uses real Yahoo historical bars instead of
  // generated/synthetic curves.
  const [liveChartData, setLiveChartData] = useState<ChartPoint[]>([]);
  const [chartProvider, setChartProvider] = useState('Yahoo Finance Historical Chart API');
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!selectedMarket) {
      setLiveChartData([]);
      return;
    }

    const loadHistory = async () => {
      setChartLoading(true);
      try {
        const res = await fetch(
          `/api/global-market-history/${encodeURIComponent(selectedMarket.yahooTicker)}?range=${activeTimeframe}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        if (!cancelled && json.success && Array.isArray(json.points)) {
          setLiveChartData(json.points);
          setChartProvider(json.provider || 'Yahoo Finance Historical Chart API');
        } else if (!cancelled) {
          setLiveChartData([]);
        }
      } catch (err) {
        console.warn('Failed to load global market historical chart:', err);
        if (!cancelled) setLiveChartData([]);
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
  }, [selectedMarket?.id, selectedMarket?.yahooTicker, activeTimeframe]);

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
                  <div className="flex flex-col gap-2.5 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-slate-100 font-bold">
                          <BarChart2 className="w-4 h-4 text-cyan-400" />
                          <span>Koersgrafiek ({selectedMarket.name})</span>
                          <span className="px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/70 text-[9px] text-cyan-300 font-mono">
                            LIVE HISTORY
                          </span>
                        </div>
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          Exchange-prijsdata · meer detail op kortere looptijden
                        </p>
                      </div>

                      <div className="flex items-center bg-[#07101c] border border-slate-800 rounded-lg p-0.5 self-start sm:self-auto">
                        {[
                          { id: '24U' as const, label: '24U', title: 'Intraday handelssessie (vanaf beursopening, geen eerdere dagen)' },
                          { id: '1W' as const, label: '1W', title: '15-minuten data' },
                          { id: '3M' as const, label: '3M', title: 'Dagdata' },
                          { id: 'YTD' as const, label: 'YTD', title: 'Dagdata sinds 1 januari' },
                          { id: '1Y' as const, label: '1Y', title: 'Weekdata' },
                          { id: '5Y' as const, label: '5Y', title: 'Maanddata' },
                          { id: '10Y' as const, label: '10Y', title: 'Kwartaaldata' },
                          { id: 'ALL' as const, label: 'ALL', title: 'Maximale beschikbare historie' }
                        ].map(tf => (
                          <button
                            key={tf.id}
                            onClick={() => setActiveTimeframe(tf.id)}
                            title={tf.title}
                            className={`px-2.5 py-1.5 rounded-md text-[10px] font-semibold font-mono transition cursor-pointer ${
                              activeTimeframe === tf.id
                                ? 'bg-slate-700 text-white border border-slate-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-200 border border-transparent'
                            }`}
                          >
                            {tf.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <MarketHistoryChart
                      chartData={currentChartData}
                      currency={selectedMarket.currency}
                      marketName={selectedMarket.name}
                      ticker={selectedMarket.yahooTicker}
                      timeframe={activeTimeframe}
                      loading={chartLoading}
                      provider={chartProvider}
                    />
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
