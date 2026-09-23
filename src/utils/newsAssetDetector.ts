import { MarketNewsItem } from '../types/marketNews';

export type DetectedAssetType = 'equity' | 'commodity' | 'bond';

export interface DetectedAsset {
  type: DetectedAssetType;
  symbol: string;
  name: string;
  targetId?: string; // id inside COMMODITIES_DATA or SOVEREIGN_BONDS_DATA
  deskLabel: string;
}

// Sovereign bond definitions
const BOND_SYMBOLS: Record<string, { symbol: string; name: string; targetId: string }> = {
  'US10Y': { symbol: 'US10Y', name: 'U.S. 10Y Treasury', targetId: 'us-10y-treasury' },
  'US2Y': { symbol: 'US2Y', name: 'U.S. 2Y Treasury', targetId: 'us-2y-treasury' },
  'US30Y': { symbol: 'US30Y', name: 'U.S. 30Y Treasury', targetId: 'us-30y-treasury' },
  'US30YMORT': { symbol: 'US30YFRM', name: 'U.S. 30Y Mortgage Rate', targetId: 'us-30y-mortgage' },
  'US30YFRM': { symbol: 'US30YFRM', name: 'U.S. 30Y Mortgage Benchmark', targetId: 'us-30y-mortgage' },
  'CN10Y': { symbol: 'CN10Y', name: 'China 10Y CGB', targetId: 'cn-10y-cgb' },
  'CN30Y': { symbol: 'CN30Y', name: 'China 30Y CGB', targetId: 'cn-30y-cgb' },
  'DE10Y': { symbol: 'DE10Y', name: 'Germany 10Y Bund', targetId: 'de-10y-bund' },
  'DE30Y': { symbol: 'DE30Y', name: 'Germany 30Y Bund', targetId: 'de-30y-bund' },
  'JP10Y': { symbol: 'JP10Y', name: 'Japan 10Y JGB', targetId: 'jp-10y-jgb' },
  'JP30Y': { symbol: 'JP30Y', name: 'Japan 30Y JGB', targetId: 'jp-30y-jgb' },
  'GB10Y': { symbol: 'GB10Y', name: 'UK 10Y Gilt', targetId: 'gb-10y-gilt' },
  'GB30Y': { symbol: 'GB30Y', name: 'UK 30Y Gilt', targetId: 'gb-30y-gilt' },
  'FR10Y': { symbol: 'FR10Y', name: 'France 10Y OAT', targetId: 'fr-10y-oat' },
  'FR30Y': { symbol: 'FR30Y', name: 'France 30Y OAT', targetId: 'fr-30y-oat' },
  'IT10Y': { symbol: 'IT10Y', name: 'Italy 10Y BTP', targetId: 'it-10y-btp' },
  'IT30Y': { symbol: 'IT30Y', name: 'Italy 30Y BTP', targetId: 'it-30y-btp' },
  'ES10Y': { symbol: 'ES10Y', name: 'Spain 10Y Bonos', targetId: 'es-10y-bonos' },
  'ES30Y': { symbol: 'ES30Y', name: 'Spain 30Y Bonos', targetId: 'es-30y-bonos' }
};

// Commodity definitions
const COMMODITY_SYMBOLS: Record<string, { symbol: string; name: string; targetId: string }> = {
  'WTI': { symbol: 'WTI', name: 'WTI Light Sweet Crude', targetId: 'wti-crude' },
  'CL': { symbol: 'WTI', name: 'WTI Light Sweet Crude', targetId: 'wti-crude' },
  'BRENT': { symbol: 'BRENT', name: 'Brent Crude Oil', targetId: 'brent-crude' },
  'BZ': { symbol: 'BRENT', name: 'Brent Crude Oil', targetId: 'brent-crude' },
  'MURBAN': { symbol: 'MURBAN', name: 'Murban Crude Oil', targetId: 'murban-crude' },
  'TTF': { symbol: 'TTF', name: 'Dutch TTF Natural Gas', targetId: 'dutch-ttf' },
  'NG': { symbol: 'NG', name: 'Henry Hub Natural Gas', targetId: 'henry-hub' },
  'JKM': { symbol: 'JKM', name: 'JKM Spot LNG', targetId: 'jkm-lng' },
  'GOLD': { symbol: 'GOLD', name: 'Gold Bullion', targetId: 'gold' },
  'GC': { symbol: 'GOLD', name: 'Gold Bullion', targetId: 'gold' },
  'XAU': { symbol: 'GOLD', name: 'Gold Bullion', targetId: 'gold' },
  'SILVER': { symbol: 'SILVER', name: 'Silver Bullion', targetId: 'silver' },
  'SI': { symbol: 'SILVER', name: 'Silver Bullion', targetId: 'silver' },
  'XAG': { symbol: 'SILVER', name: 'Silver Bullion', targetId: 'silver' },
  'COPPER': { symbol: 'COPPER', name: 'COMEX High Grade Copper', targetId: 'copper' },
  'HG': { symbol: 'COPPER', name: 'COMEX High Grade Copper', targetId: 'copper' },
  'URANIUM': { symbol: 'URANIUM', name: 'U3O8 Uranium Oxide', targetId: 'uranium' },
  'LITHIUM': { symbol: 'LITHIUM', name: 'Lithium Carbonate', targetId: 'lithium' },
  'WHEAT': { symbol: 'WHEAT', name: 'Milling Wheat', targetId: 'milling-wheat' },
  'CORN': { symbol: 'CORN', name: 'Corn Futures', targetId: 'corn' }
};

export function detectNewsAsset(item: MarketNewsItem): DetectedAsset | null {
  const rawTicker = (item.ticker || '').trim().toUpperCase();
  const text = `${item.headline || ''} ${item.company || ''} ${item.summary || ''} ${item.fact || ''} ${item.market_reaction || ''}`.toLowerCase();

  // 1. Explicit Bond Ticker
  if (rawTicker && BOND_SYMBOLS[rawTicker]) {
    const b = BOND_SYMBOLS[rawTicker];
    return {
      type: 'bond',
      symbol: b.symbol,
      name: b.name,
      targetId: b.targetId,
      deskLabel: 'Treasury & Sovereign Bond Desk'
    };
  }

  // 2. Explicit Commodity Ticker
  if (rawTicker && COMMODITY_SYMBOLS[rawTicker]) {
    const c = COMMODITY_SYMBOLS[rawTicker];
    return {
      type: 'commodity',
      symbol: c.symbol,
      name: c.name,
      targetId: c.targetId,
      deskLabel: 'Commodities Desk'
    };
  }

  // 3. Fallback: Contextual extraction if item is in COMMODITIES category or contains commodity keywords
  if (item.category === 'COMMODITIES' || text.includes('crude oil') || text.includes('brent') || text.includes('wti') || text.includes('natural gas') || text.includes('ttf') || text.includes('gold') || text.includes('copper')) {
    if (text.includes('wti') || text.includes('west texas intermediate') || text.includes('cushing')) {
      const c = COMMODITY_SYMBOLS['WTI'];
      return { type: 'commodity', symbol: c.symbol, name: c.name, targetId: c.targetId, deskLabel: 'Commodities Desk' };
    }
    if (text.includes('brent')) {
      const c = COMMODITY_SYMBOLS['BRENT'];
      return { type: 'commodity', symbol: c.symbol, name: c.name, targetId: c.targetId, deskLabel: 'Commodities Desk' };
    }
    if (text.includes('ttf') || text.includes('dutch ttf') || text.includes('dutch gas')) {
      const c = COMMODITY_SYMBOLS['TTF'];
      return { type: 'commodity', symbol: c.symbol, name: c.name, targetId: c.targetId, deskLabel: 'Commodities Desk' };
    }
    if (text.includes('henry hub') || (text.includes('gas') && text.includes('mmbtu'))) {
      const c = COMMODITY_SYMBOLS['NG'];
      return { type: 'commodity', symbol: c.symbol, name: c.name, targetId: c.targetId, deskLabel: 'Commodities Desk' };
    }
    if (text.includes('jkm') || text.includes('lng')) {
      const c = COMMODITY_SYMBOLS['JKM'];
      return { type: 'commodity', symbol: c.symbol, name: c.name, targetId: c.targetId, deskLabel: 'Commodities Desk' };
    }
    if (text.includes('gold') || text.includes('goud') || text.includes('xau')) {
      const c = COMMODITY_SYMBOLS['GOLD'];
      return { type: 'commodity', symbol: c.symbol, name: c.name, targetId: c.targetId, deskLabel: 'Commodities Desk' };
    }
    if (text.includes('copper') || text.includes('koper')) {
      const c = COMMODITY_SYMBOLS['COPPER'];
      return { type: 'commodity', symbol: c.symbol, name: c.name, targetId: c.targetId, deskLabel: 'Commodities Desk' };
    }
    if (text.includes('uranium')) {
      const c = COMMODITY_SYMBOLS['URANIUM'];
      return { type: 'commodity', symbol: c.symbol, name: c.name, targetId: c.targetId, deskLabel: 'Commodities Desk' };
    }
  }

  // 4. Fallback: Contextual extraction if item is in CENTRAL_BANK, MACRO, or mentions sovereign yields
  if (item.category === 'CENTRAL_BANK' || item.category === 'MACRO' || text.includes('treasury') || text.includes('yield') || text.includes('bund') || text.includes('gilt') || text.includes('rentecurve')) {
    if (text.includes('10-jaars bund') || text.includes('10-year bund') || text.includes('bund yield') || text.includes('bunds')) {
      const b = BOND_SYMBOLS['DE10Y'];
      return { type: 'bond', symbol: b.symbol, name: b.name, targetId: b.targetId, deskLabel: 'Treasury & Sovereign Bond Desk' };
    }
    if (text.includes('10-jaars treasury') || text.includes('10-year treasury') || text.includes('10y treasury') || text.includes('10-year yield') || text.includes('10 year yield') || text.includes('us 10-year')) {
      const b = BOND_SYMBOLS['US10Y'];
      return { type: 'bond', symbol: b.symbol, name: b.name, targetId: b.targetId, deskLabel: 'Treasury & Sovereign Bond Desk' };
    }
    if (text.includes('2-jaars treasury') || text.includes('2-year treasury') || text.includes('2y yield') || text.includes('2-year yield')) {
      const b = BOND_SYMBOLS['US2Y'];
      return { type: 'bond', symbol: b.symbol, name: b.name, targetId: b.targetId, deskLabel: 'Treasury & Sovereign Bond Desk' };
    }
    if (text.includes('gilt')) {
      const b = BOND_SYMBOLS['GB10Y'];
      return { type: 'bond', symbol: b.symbol, name: b.name, targetId: b.targetId, deskLabel: 'Treasury & Sovereign Bond Desk' };
    }
    if (text.includes('oat')) {
      const b = BOND_SYMBOLS['FR10Y'];
      return { type: 'bond', symbol: b.symbol, name: b.name, targetId: b.targetId, deskLabel: 'Treasury & Sovereign Bond Desk' };
    }
    if (text.includes('btp')) {
      const b = BOND_SYMBOLS['IT10Y'];
      return { type: 'bond', symbol: b.symbol, name: b.name, targetId: b.targetId, deskLabel: 'Treasury & Sovereign Bond Desk' };
    }
  }

  // 5. Default Equity Ticker
  if (rawTicker && rawTicker !== 'NONE' && rawTicker !== 'ALL' && rawTicker !== 'MARKET') {
    return {
      type: 'equity',
      symbol: rawTicker,
      name: item.company || rawTicker,
      deskLabel: 'Consensus & Financials'
    };
  }

  return null;
}
