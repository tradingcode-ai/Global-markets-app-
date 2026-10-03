import { CompanyMeta, LiveQuote, QuarterlyConsensusSnapshot, QuarterlyResult, Sector } from '../types';
import { TECH_COMPANIES } from '../data/earningsData';
import { SHOVEL_SELLERS_COMPANIES } from '../data/shovelSellersData';
import { HYPERSCALER_COMPANIES, HYPERSCALER_TICKERS } from '../data/hyperscalersData';
import { FINANCIAL_COMPANIES } from '../data/financialsData';
import { AEROSPACE_DEFENSE_COMPANIES } from '../data/aerospaceDefenseData';
import { DEFAULT_RESEARCH_ASSETS } from '../services/marketResearchConfig';

export interface ConsensusMatrixRow extends QuarterlyResult {
  matrixSector: string;
}

// The same equity registries and classification precedence as Global Markets.
// Numeric aliases are hidden there too; SX7P is a sector index, not an equity.
const excluded = new Set(['005930', '005930.KS', '000660', '000660.KS', 'SX7P']);
type MatrixCompany = Pick<CompanyMeta, 'ticker' | 'name' | 'region' | 'country' | 'currency' | 'subSector'> & { sector: string };
const companies: Record<string, MatrixCompany> = {
  ...TECH_COMPANIES, ...SHOVEL_SELLERS_COMPANIES, ...HYPERSCALER_COMPANIES,
  ...FINANCIAL_COMPANIES, ...AEROSPACE_DEFENSE_COMPANIES
};
const researchEquityCategories = new Set(['mega_cap_stocks', 'normal_large_mid_cap', 'small_mid_high_beta']);
for (const asset of Object.values(DEFAULT_RESEARCH_ASSETS)) {
  if (researchEquityCategories.has(asset.categoryKey) && !companies[asset.symbol]) {
    companies[asset.symbol] = { ticker: asset.symbol, name: asset.name, sector: asset.assetClass, subSector: asset.assetClass };
  }
}
export const CONSENSUS_MATRIX_SYMBOLS = Object.keys(companies).filter(ticker => !excluded.has(ticker));
export const MATRIX_SNAPSHOT_MAX_AGE_MS = 12 * 60 * 60 * 1000;

export function isFreshYahooSnapshot(snapshot?: QuarterlyConsensusSnapshot, now = Date.now()): boolean {
  const captured = Date.parse(snapshot?.snapshotDate || '');
  return snapshot?.isLiveFeed === true && Number.isFinite(captured)
    && captured <= now + 5 * 60 * 1000 && now - captured <= MATRIX_SNAPSHOT_MAX_AGE_MS;
}

export function getMatrixReportedFinancials(snapshot?: QuarterlyConsensusSnapshot, now = Date.now()) {
  const actual = snapshot?.reportedFinancials;
  const captured = Date.parse(actual?.snapshotDate || '');
  const fiscalEnd = Date.parse(actual?.fiscalDate || '');
  return actual && Number.isFinite(captured) && captured <= now + 300000
    && now - captured <= MATRIX_SNAPSHOT_MAX_AGE_MS && Number.isFinite(fiscalEnd)
    && fiscalEnd <= now && actual.currency ? actual : undefined;
}

export function matrixSector(ticker: string, sector: string, region?: string): string {
  if (AEROSPACE_DEFENSE_COMPANIES[ticker]) return 'Aerospace & Defense';
  if (HYPERSCALER_TICKERS.has(ticker)) return 'Hyperscalers & Neo Clouds';
  if (SHOVEL_SELLERS_COMPANIES[ticker]) return 'The Shovel Sellers';
  if (sector === 'U.S. Financials' || sector === 'European Financials') return sector;
  if (!TECH_COMPANIES[ticker] && !FINANCIAL_COMPANIES[ticker]) return sector;
  return region === 'Europe' ? 'European Tech Champions' : 'US Mega-Cap Technology';
}

export function buildConsensusMatrixRows(
  results: QuarterlyResult[], snapshots: Record<string, QuarterlyConsensusSnapshot>, now = Date.now()
): ConsensusMatrixRow[] {
  const existing = new Map(results.map(row => [row.ticker, row]));
  return CONSENSUS_MATRIX_SYMBOLS.map<ConsensusMatrixRow>(ticker => {
    const meta = companies[ticker];
    const previous = existing.get(ticker);
    const raw = snapshots[ticker];
    const snapshot = isFreshYahooSnapshot(raw, now) ? raw : undefined;
    const sector = (HYPERSCALER_TICKERS.has(ticker) ? 'Hyperscalers & Neo Clouds' : meta.sector) as Sector;
    const liveDate = previous?.isDateConfirmed && /yahoo|sec edgar/i.test(previous.liveDateProvider || '')
      && !/desk/i.test(previous.liveDateProvider || '');
    return {
      id: `consensus-${ticker}`, ticker, companyName: meta.name, sector,
      matrixSector: matrixSector(ticker, sector, meta.region),
      region: meta.region, country: meta.country,
      subSector: meta.subSector || previous?.subSector || meta.sector,
      currency: snapshot?.consensusCurrency || meta.currency,
      consensusMatrix: true,
      quarter: snapshot?.nextQuarterLabel || 'N/A', fiscalYear: 0,
      reportDate: liveDate ? previous!.reportDate : '',
      reportTime: liveDate ? previous?.reportTime : undefined,
      liveDateProvider: liveDate ? previous?.liveDateProvider : undefined,
      isDateConfirmed: Boolean(liveDate), status: 'upcoming',
      // Required by legacy modal type; missing numbers stay missing (NaN),
      // never a seeded estimate, actual, beat, guidance or market reaction.
      epsEstimate: snapshot?.nextQuarterEps ?? Number.NaN,
      revenueEstimate: snapshot?.nextQuarterRevenue ?? Number.NaN,
      quarterlyConsensus: snapshot
    };
  });
}

export function filterConsensusRows(rows: ConsensusMatrixRow[], sector: string, search: string): ConsensusMatrixRow[] {
  const query = search.trim().toLocaleLowerCase();
  return rows.filter(row => (sector === 'ALL' || row.matrixSector === sector) && (!query ||
    [row.ticker, row.companyName, row.matrixSector, row.sector, row.subSector, row.country]
      .some(value => value?.toLocaleLowerCase().includes(query))));
}

export type MatrixSortField = 'ticker' | 'date' | 'eps' | 'revenue' | 'price';
export function sortConsensusRows(
  rows: ConsensusMatrixRow[], field: MatrixSortField, order: 'asc' | 'desc', quotes: Record<string, LiveQuote>
): ConsensusMatrixRow[] {
  const direction = order === 'asc' ? 1 : -1;
  const value = (row: ConsensusMatrixRow): number | undefined => {
    if (field === 'date') return row.reportDate ? Date.parse(row.reportDate) : undefined;
    if (field === 'eps') return isFreshYahooSnapshot(row.quarterlyConsensus) ? row.quarterlyConsensus?.nextQuarterEps : undefined;
    if (field === 'revenue') return isFreshYahooSnapshot(row.quarterlyConsensus) ? row.quarterlyConsensus?.nextQuarterRevenue : undefined;
    return quotes[row.ticker]?.isLive === true ? quotes[row.ticker]?.price : undefined;
  };
  return [...rows].sort((a, b) => {
    if (field === 'ticker') return direction * a.ticker.localeCompare(b.ticker);
    const left = value(a), right = value(b);
    const hasLeft = typeof left === 'number' && Number.isFinite(left);
    const hasRight = typeof right === 'number' && Number.isFinite(right);
    if (hasLeft !== hasRight) return hasLeft ? -1 : 1;
    return hasLeft && hasRight ? direction * (left! - right!) || a.ticker.localeCompare(b.ticker)
      : a.ticker.localeCompare(b.ticker);
  });
}

export function formatMatrixNumber(value?: number, currency?: string, revenue = false): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || !currency) return 'N/A';
  return `${currency} ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${revenue ? 'B' : ''}`;
}
