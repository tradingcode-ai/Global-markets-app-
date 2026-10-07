import React, { useEffect, useRef } from 'react';

export interface TradingViewChartWidgetProps {
  ticker: string;
  className?: string;
}

// Mapping of application tickers to primary/native TradingView symbols
const TRADINGVIEW_SYMBOL_MAP: Record<string, string> = {
  // Asia-Pacific primary listings
  'TSM': 'TWSE:2330',
  '2330': 'TWSE:2330',
  '2330.TW': 'TWSE:2330',
  'ATEYY': 'TSE:6857',
  '6857': 'TSE:6857',
  '6857.T': 'TSE:6857',
  'TOELY': 'TSE:8035',
  '8035': 'TSE:8035',
  '8035.T': 'TSE:8035',
  'SSNLF': 'KRX:005930',
  '005930': 'KRX:005930',
  '005930.KS': 'KRX:005930',
  'HXSCF': 'KRX:000660',
  '000660': 'KRX:000660',
  '000660.KS': 'KRX:000660',
  'SMIC': 'HKEX:981',
  'SMICY': 'HKEX:981',
  '0981': 'HKEX:981',
  '0981.HK': 'HKEX:981',
  'KIOXIA': 'TSE:285A',
  '285A': 'TSE:285A',
  '285A.T': 'TSE:285A',
  'CXMT': 'SSE:688825',
  'CMXT': 'SSE:688825',
  '688825': 'SSE:688825',
  '688825.SS': 'SSE:688825',
  'TCEHY': 'HKEX:700',
  '0700': 'HKEX:700',
  '0700.HK': 'HKEX:700',
  'NTDOY': 'TSE:7974',
  '7974': 'TSE:7974',
  '7974.T': 'TSE:7974',
  'DRO': 'ASX:DRO',
  'DRO.AX': 'ASX:DRO',

  // European Champions, ADRs & Native Listings
  'RNMBY': 'XETR:RHM',
  'RHM': 'XETR:RHM',
  'RHM.DE': 'XETR:RHM',
  'BCS': 'LSE:BARC',
  'BARC': 'LSE:BARC',
  'BARC.L': 'LSE:BARC',
  'RKGRY': 'XETR:R3NK',
  'R3NK': 'XETR:R3NK',
  'R3NK.DE': 'XETR:R3NK',
  'RYCEY': 'LSE:RR',
  'RR': 'LSE:RR',
  'RR.L': 'LSE:RR',
  'EADSY': 'EURONEXT:AIR',
  'AIR': 'EURONEXT:AIR',
  'AIR.PA': 'EURONEXT:AIR',
  'BDRBF': 'TSX:BBD.B',
  'BBD.B': 'TSX:BBD.B',
  'ASML': 'AEX:ASML',
  'ASML.AS': 'AEX:ASML',
  'SAP': 'XETR:SAP',
  'SAP.DE': 'XETR:SAP',
  'PRX': 'AEX:PRX',
  'PRX.AS': 'AEX:PRX',
  'ADYEN': 'AEX:ADYEN',
  'ADYEN.AS': 'AEX:ADYEN',
  'IFX': 'XETR:IFX',
  'IFX.DE': 'XETR:IFX',
  'SU': 'EURONEXT:SU',
  'SU.PA': 'EURONEXT:SU',
  'SIE': 'XETR:SIE',
  'SIE.DE': 'XETR:SIE',
  'STM': 'EURONEXT:STMPA',
  'STMPA': 'EURONEXT:STMPA',
  'STMPA.PA': 'EURONEXT:STMPA',
  'BESI': 'AEX:BESI',
  'ASMI': 'AEX:ASM',
  'HSBC': 'LSE:HSBA',
  'HSBA.L': 'LSE:HSBA',
  'BNP': 'EURONEXT:BNP',
  'GLE': 'EURONEXT:GLE',
  'SAN': 'BME:SAN',
  'BBVA': 'BME:BBVA',
  'ING': 'AEX:INGA',
  'ABN': 'AEX:ABN',
};

// Known NYSE tickers in our coverage universe
const NYSE_TICKERS = new Set([
  'ORCL', 'CRM', 'NOW', 'PLTR', 'SNOW', 'IBM', 'UBER', 'DELL', 'HPE', 'SPOT',
  'JPM', 'BAC', 'C', 'WFC', 'GS', 'MS', 'BX', 'KKR', 'RTX', 'GE', 'BA', 'LMT',
  'RDW', 'UMAC'
]);

export function resolveTradingViewSymbol(ticker: string): string {
  if (!ticker) return 'NASDAQ:NVDA';
  const clean = ticker.trim().toUpperCase();

  // Explicit mapped tickers
  if (TRADINGVIEW_SYMBOL_MAP[clean]) {
    return TRADINGVIEW_SYMBOL_MAP[clean];
  }

  // Already prefixed with exchange (e.g. NASDAQ:AAPL, NYSE:IBM, TWSE:2330)
  if (clean.includes(':')) {
    return clean;
  }

  // US NYSE stocks
  if (NYSE_TICKERS.has(clean)) {
    return `NYSE:${clean}`;
  }

  // Standard US tech / default NASDAQ
  return `NASDAQ:${clean}`;
}

export const TradingViewChartWidget: React.FC<TradingViewChartWidgetProps> = ({
  ticker,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const resolvedSymbol = resolveTradingViewSymbol(ticker);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Reset container DOM before mounting widget
    container.innerHTML = '';

    const widgetHolder = document.createElement('div');
    widgetHolder.className = 'tradingview-widget-container__widget';
    widgetHolder.style.height = '100%';
    widgetHolder.style.width = '100%';
    container.appendChild(widgetHolder);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: resolvedSymbol,
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: 'rgba(10, 25, 47, 1)',
      gridColor: 'rgba(30, 41, 59, 0.4)',
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      hide_volume: false,
      support_host: 'https://www.tradingview.com'
    });

    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [resolvedSymbol]);

  return (
    <div
      className={`tradingview-widget-container h-[380px] sm:h-[420px] w-full ${className}`}
      ref={containerRef}
    />
  );
};

export default TradingViewChartWidget;

