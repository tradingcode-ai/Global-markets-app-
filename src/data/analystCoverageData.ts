import { QuarterlyConsensusSnapshot, EquityBankOutlook } from '../types';

function emptyConsensus(ticker: string): QuarterlyConsensusSnapshot {
  return {
    ticker,
    quarterKey: 'N/A',
    nextQuarterLabel: 'Geen live consensus beschikbaar',
    snapshotDate: new Date().toISOString(),
    consensusRating: 'Geen consensus',
    recommendationCounts: undefined,
    averagePriceTarget: undefined,
    lowPriceTarget: undefined,
    highPriceTarget: undefined,
    targetCurrency: undefined,
    nextQuarterEps: undefined,
    nextQuarterEpsLow: undefined,
    nextQuarterEpsHigh: undefined,
    nextQuarterRevenue: undefined,
    nextQuarterRevenueLow: undefined,
    nextQuarterRevenueHigh: undefined,
    analystsCount: undefined,
    revenueIsAnalystConsensus: false,
    outlooks: []
  };
}

/**
 * Local fallback intentionally contains no generated analyst figures.
 *
 * The authoritative quarterly consensus is loaded from /api/quarterly-analyst-outlook,
 * which is backed by Yahoo Finance earningsTrend/recommendation data. When that
 * endpoint has no verified snapshot, the UI must show "Geen consensus" rather than
 * inventing targets, recommendation counts, EPS, or revenue estimates.
 */
export function getStockQuarterlyConsensus(
  ticker: string,
  _currentPrice: number,
  _currencySymbol: string,
  _result?: unknown
): QuarterlyConsensusSnapshot {
  return emptyConsensus(ticker);
}

/**
 * Do not manufacture bank-by-bank outlooks from the current share price.
 * Verified Yahoo analyst calls are supplied by the live quarterly snapshot.
 */
export function getStockAnalystOutlooks(
  _ticker: string,
  _currentPrice: number,
  _currencySymbol: string,
  _result?: unknown
): EquityBankOutlook[] {
  return [];
}
