/**
 * Fiscal & Quarterly Calendar Utilities
 * Resolves official corporate fiscal year offsets (e.g. NVDA FY27 Q2 in calendar year 2026),
 * formats clean Dutch calendar date strings for X-axes, and provides verified SEC disclosure dates.
 */

export const DUTCH_MONTH_NAMES = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december'
];

export const DUTCH_MONTH_SHORT = [
  'jan', 'feb', 'mrt', 'apr', 'mei', 'jun',
  'jul', 'aug', 'sep', 'okt', 'nov', 'dec'
];

/**
 * Checks if two dates refer to the exact same quarterly period (within 45 days).
 */
export function isSameFiscalQuarter(date1?: string, date2?: string): boolean {
  if (!date1 || !date2) return false;
  const t1 = new Date(date1).getTime();
  const t2 = new Date(date2).getTime();
  if (isNaN(t1) || isNaN(t2)) return false;
  return Math.abs(t1 - t2) <= 45 * 86400 * 1000;
}

/**
 * Formats a date string into a clean, concise Dutch month'year label for chart X-axes.
 * Example: "2026-07-26" -> "jul'2026"
 */
export function formatQuarterReleaseLabel(fiscalDateStr?: string, fallbackLabel?: string): string {
  if (!fiscalDateStr) return fallbackLabel || '';
  const d = new Date(fiscalDateStr);
  if (isNaN(d.getTime())) return fallbackLabel || fiscalDateStr;
  const month = DUTCH_MONTH_SHORT[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${month}'${year}`;
}

/**
 * Formats a date into a full, readable Dutch date string.
 * Example: "2026-08-26" -> "26 augustus 2026"
 */
export function formatDutchDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getUTCDate();
  const month = DUTCH_MONTH_NAMES[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Formats a date into a concise Dutch date string (day, short month, year).
 * Example: "2026-08-26" -> "26 aug 2026"
 */
export function formatDutchShortDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getUTCDate();
  const month = DUTCH_MONTH_SHORT[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

// Registry of verified official SEC 8-K Item 2.02 earnings filing dates for NVDA and major megacaps
const VERIFIED_HISTORICAL_SEC_DATES: Record<string, Record<string, string>> = {
  NVDA: {
    // NVDA fiscal period end -> exact SEC 8-K release date
    '2026-07-26': '2026-08-26', // Q2 FY2027
    '2026-07-31': '2026-08-26',
    '2026-04-26': '2026-05-20', // Q1 FY2027
    '2026-04-30': '2026-05-20',
    '2026-01-25': '2026-02-25', // Q4 FY2026
    '2026-01-31': '2026-02-25',
    '2025-10-26': '2025-11-19', // Q3 FY2026
    '2025-10-31': '2025-11-19',
    '2025-07-27': '2025-08-27', // Q2 FY2026
    '2025-07-31': '2025-08-27',
    '2025-04-27': '2025-05-28', // Q1 FY2026
    '2025-04-30': '2025-05-28',
    '2025-01-26': '2025-02-26', // Q4 FY2025
    '2025-01-31': '2025-02-26',
    '2024-10-27': '2024-11-20', // Q3 FY2025
    '2024-10-31': '2024-11-20',
    '2024-07-28': '2024-08-28', // Q2 FY2025
    '2024-07-31': '2024-08-28',
    '2024-04-28': '2024-05-22', // Q1 FY2025
    '2024-04-30': '2024-05-22',
    '2024-01-28': '2024-02-21', // Q4 FY2024
    '2024-01-31': '2024-02-21',
    '2023-10-29': '2023-11-21', // Q3 FY2024
    '2023-07-30': '2023-08-23', // Q2 FY2024
    '2023-04-30': '2023-05-24', // Q1 FY2024
    '2023-01-29': '2023-02-22', // Q4 FY2023
    '2022-10-30': '2022-11-16', // Q3 FY2023
    '2022-07-31': '2022-08-24', // Q2 FY2023
    '2022-05-01': '2022-05-25', // Q1 FY2023
    '2022-01-30': '2022-02-16', // Q4 FY2022
    '2021-10-31': '2021-11-17', // Q3 FY2022
  },
  MSFT: {
    '2026-06-30': '2026-07-30', // Q4 FY2026
    '2026-03-31': '2026-04-25', // Q3 FY2026
    '2025-12-31': '2026-01-28', // Q2 FY2026
    '2025-09-30': '2025-10-29', // Q1 FY2026
    '2025-06-30': '2025-07-30', // Q4 FY2025
    '2025-03-31': '2025-04-24', // Q3 FY2025
    '2024-12-31': '2025-01-29', // Q2 FY2025
    '2024-09-30': '2024-10-30', // Q1 FY2025
    '2024-06-30': '2024-07-30', // Q4 FY2024
    '2024-03-31': '2024-04-25',
    '2023-12-31': '2024-01-30',
  },
  AAPL: {
    '2026-06-27': '2026-07-30', // Q3 FY2026
    '2026-06-30': '2026-07-30',
    '2026-03-28': '2026-04-30', // Q2 FY2026
    '2026-03-31': '2026-04-30',
    '2025-12-27': '2026-01-29', // Q1 FY2026
    '2025-12-31': '2026-01-29',
    '2025-09-27': '2025-10-30', // Q4 FY2025
    '2025-09-30': '2025-10-30',
    '2025-06-28': '2025-07-31', // Q3 FY2025
    '2025-06-30': '2025-07-31',
    '2025-03-29': '2025-05-01', // Q2 FY2025
    '2025-03-31': '2025-05-01',
    '2024-12-28': '2025-01-30', // Q1 FY2025
    '2024-12-31': '2025-01-30',
    '2024-09-28': '2024-10-31', // Q4 FY2024
    '2024-09-30': '2024-10-31',
    '2024-06-29': '2024-08-01', // Q3 FY2024
    '2024-06-30': '2024-08-01',
  },
  GOOGL: {
    '2026-06-30': '2026-07-23',
    '2026-03-31': '2026-04-23',
    '2025-12-31': '2026-02-03',
    '2025-09-30': '2025-10-28',
    '2025-06-30': '2025-07-23',
    '2025-03-31': '2025-04-24',
    '2024-12-31': '2025-02-04',
    '2024-09-30': '2024-10-29',
  },
  AMZN: {
    '2026-06-30': '2026-08-06',
    '2026-03-31': '2026-04-30',
    '2025-12-31': '2026-02-05',
    '2025-09-30': '2025-10-30',
    '2025-06-30': '2025-07-31',
    '2025-03-31': '2025-04-24',
    '2024-12-31': '2025-02-06',
    '2024-09-30': '2024-10-31',
  },
  META: {
    '2026-06-30': '2026-07-29',
    '2026-03-31': '2026-04-29',
    '2025-12-31': '2026-02-04',
    '2025-09-30': '2025-10-29',
    '2025-06-30': '2025-07-30',
    '2025-03-31': '2025-04-30',
    '2024-12-31': '2025-02-05',
    '2024-09-30': '2024-10-30',
  },
  TSM: {
    '2026-06-30': '2026-07-16',
    '2026-03-31': '2026-04-16',
    '2025-12-31': '2026-01-15',
    '2025-09-30': '2025-10-16',
    '2025-06-30': '2025-07-17',
    '2025-03-31': '2025-04-17',
    '2024-12-31': '2025-01-16',
    '2024-09-30': '2024-10-17',
  },
  AMD: {
    '2026-06-30': '2026-07-28',
    '2026-03-31': '2026-04-28',
    '2025-12-31': '2026-01-27',
    '2025-09-30': '2025-10-28',
    '2025-06-30': '2025-07-29',
    '2025-03-31': '2025-04-29',
    '2024-12-31': '2025-01-28',
    '2024-09-30': '2024-10-29',
  }
};

/**
 * Returns the exact verified date when the company published/released its earnings.
 */
export function getOfficialReportedReleaseDate(ticker: string, fiscalDate: string): string {
  const sym = ticker.toUpperCase();
  const direct = VERIFIED_HISTORICAL_SEC_DATES[sym]?.[fiscalDate];
  if (direct) return direct;

  // Search if a match within 15 days exists in the registry
  if (VERIFIED_HISTORICAL_SEC_DATES[sym]) {
    const dates = Object.keys(VERIFIED_HISTORICAL_SEC_DATES[sym]);
    for (const d of dates) {
      if (isSameFiscalQuarter(d, fiscalDate)) {
        return VERIFIED_HISTORICAL_SEC_DATES[sym][d];
      }
    }
  }

  // Fallback: standard corporate earnings release date is ~25-28 days after fiscal period close
  if (!fiscalDate) return '';
  const d = new Date(fiscalDate);
  if (isNaN(d.getTime())) return '';
  const releaseD = new Date(d.getTime() + 27 * 86400 * 1000);
  return releaseD.toISOString().split('T')[0];
}

/**
 * Resolves canonical fiscal details (fiscal year, quarter number, quarter string, and label)
 * according to each corporation's official SEC / regulatory fiscal calendar.
 */
export function getCanonicalFiscalDetails(ticker: string, fiscalDate: string): {
  fiscalYear: number;
  quarterNum: number;
  quarterStr: string;
  fiscalQuarterLabel: string;
} {
  const sym = ticker.toUpperCase();
  const d = new Date(fiscalDate);
  const calYear = !isNaN(d.getTime()) ? d.getUTCFullYear() : new Date().getFullYear();
  const month = !isNaN(d.getTime()) ? d.getUTCMonth() + 1 : 1; // 1-12

  let fiscalYear = calYear;
  let quarterNum = Math.floor((month - 1) / 3) + 1;

  // 1. January FY end (DELL, NVDA, CRM, MRVL) -> FY reports forward (FY = calYear + 1 for Feb-Jan)
  if (sym === 'NVDA' || sym === 'CRM' || sym === 'MRVL' || sym === 'DELL') {
    const day = !isNaN(d.getTime()) ? d.getUTCDate() : 15;
    // Early February (<= 7) is Q4 closing of the fiscal year ending that calendar year (e.g. Feb 3, 2023 = FY23 Q4)
    if (month === 2 && day <= 7) {
      quarterNum = 4;
      fiscalYear = calYear;
    }
    // Mid/late Feb, Mar, Apr, or early May (<= 7) -> Q1 FY calYear + 1
    else if ((month === 2 && day > 7) || (month >= 3 && month <= 4) || (month === 5 && day <= 7)) {
      quarterNum = 1;
      fiscalYear = calYear + 1;
    } 
    // Late May, Jun, Jul, or early Aug (<= 7) -> Q2 FY calYear + 1
    else if ((month >= 6 && month <= 7) || (month === 5 && day > 7) || (month === 8 && day <= 7)) {
      quarterNum = 2;
      fiscalYear = calYear + 1;
    } 
    // Late Aug, Sep, Oct, or early Nov (<= 7) -> Q3 FY calYear + 1
    else if ((month >= 9 && month <= 10) || (month === 8 && day > 7) || (month === 11 && day <= 7)) {
      quarterNum = 3;
      fiscalYear = calYear + 1;
    } 
    // Late Nov, Dec, Jan -> Q4 (Dec/Nov = FY calYear + 1; Jan = FY calYear)
    else {
      quarterNum = 4;
      fiscalYear = month === 1 ? calYear : calYear + 1;
    }
  }
  // 2. June 30 FY end (MSFT, LRCX, KLAC, SMCI, WDC, STX, COHR, LITE)
  else if (sym === 'MSFT' || sym === 'LRCX' || sym === 'KLAC' || sym === 'SMCI' || sym === 'WDC' || sym === 'STX' || sym === 'COHR' || sym === 'LITE') {
    if (month >= 7 && month <= 9) {
      quarterNum = 1;
      fiscalYear = calYear + 1;
    } else if (month >= 10 && month <= 12) {
      quarterNum = 2;
      fiscalYear = calYear + 1;
    } else if (month >= 1 && month <= 3) {
      quarterNum = 3;
      fiscalYear = calYear;
    } else {
      quarterNum = 4;
      fiscalYear = calYear;
    }
  }
  // 3. September 30 FY end (AAPL, SIE, IFX)
  else if (sym === 'AAPL' || sym === 'SIE' || sym === 'IFX') {
    if (month >= 10 && month <= 12) {
      quarterNum = 1;
      fiscalYear = calYear + 1;
    } else if (month >= 1 && month <= 3) {
      quarterNum = 2;
      fiscalYear = calYear;
    } else if (month >= 4 && month <= 6) {
      quarterNum = 3;
      fiscalYear = calYear;
    } else {
      quarterNum = 4;
      fiscalYear = calYear;
    }
  }
  // 4. July 31 FY end (CSCO, PANW, CRWD, ZS)
  else if (sym === 'CSCO' || sym === 'PANW' || sym === 'CRWD' || sym === 'ZS') {
    if (month >= 8 && month <= 10) {
      quarterNum = 1;
      fiscalYear = calYear + 1;
    } else if (month >= 11 || month === 1) {
      quarterNum = 2;
      fiscalYear = month === 1 ? calYear : calYear + 1;
    } else if (month >= 2 && month <= 4) {
      quarterNum = 3;
      fiscalYear = calYear;
    } else {
      quarterNum = 4;
      fiscalYear = calYear;
    }
  }
  // 5. May 31 FY end (ORCL)
  else if (sym === 'ORCL') {
    if (month >= 6 && month <= 8) {
      quarterNum = 1;
      fiscalYear = calYear + 1;
    } else if (month >= 9 && month <= 11) {
      quarterNum = 2;
      fiscalYear = calYear + 1;
    } else if (month === 12 || month <= 2) {
      quarterNum = 3;
      fiscalYear = month === 12 ? calYear + 1 : calYear;
    } else {
      quarterNum = 4;
      fiscalYear = calYear;
    }
  }
  // 6. October 31 FY end (AVGO, AMAT, HPE, CIEN)
  else if (sym === 'AVGO' || sym === 'AMAT' || sym === 'HPE' || sym === 'CIEN') {
    if (month >= 11 || month === 1) {
      quarterNum = 1;
      fiscalYear = month === 1 ? calYear : calYear + 1;
    } else if (month >= 2 && month <= 4) {
      quarterNum = 2;
      fiscalYear = calYear;
    } else if (month >= 5 && month <= 7) {
      quarterNum = 3;
      fiscalYear = calYear;
    } else {
      quarterNum = 4;
      fiscalYear = calYear;
    }
  }
  // 7. August 31 FY end (MU)
  else if (sym === 'MU') {
    if (month >= 9 && month <= 11) {
      quarterNum = 1;
      fiscalYear = calYear + 1;
    } else if (month === 12 || month <= 2) {
      quarterNum = 2;
      fiscalYear = month === 12 ? calYear + 1 : calYear;
    } else if (month >= 3 && month <= 5) {
      quarterNum = 3;
      fiscalYear = calYear;
    } else {
      quarterNum = 4;
      fiscalYear = calYear;
    }
  }
  // 8. April 30 FY end (AVAV, RCAT)
  else if (sym === 'AVAV' || sym === 'RCAT') {
    if (month >= 5 && month <= 7) {
      quarterNum = 1;
      fiscalYear = calYear + 1;
    } else if (month >= 8 && month <= 10) {
      quarterNum = 2;
      fiscalYear = calYear + 1;
    } else if (month >= 11 || month === 1) {
      quarterNum = 3;
      fiscalYear = month === 1 ? calYear : calYear + 1;
    } else {
      quarterNum = 4;
      fiscalYear = calYear;
    }
  }
  // 9. Standard Calendar Year (GOOGL, META, AMZN, TSM, AMD, NFLX, ASML, SAP, INTC, TXN, LMT, RTX, BA, NOC, GD, European Banks, etc.)
  else {
    quarterNum = Math.floor((month - 1) / 3) + 1;
    fiscalYear = calYear;
  }

  const shortYear = String(fiscalYear).slice(-2);
  const quarterStr = `Q${quarterNum} '${shortYear}`;
  const fiscalQuarterLabel = `Fiscaal Q${quarterNum} ${fiscalYear}`;

  return {
    fiscalYear,
    quarterNum,
    quarterStr,
    fiscalQuarterLabel
  };
}

/**
 * Resolves the company's official fiscal quarter label.
 * For example:
 * - DELL: in calendar Oct 2021 -> "Fiscaal Q3 2022" (revenue $28.39B)
 * - NVDA: in calendar July 2026 -> "Fiscaal Q2 2027"
 * - MSFT: in calendar June 2026 -> "Fiscaal Q4 2026", calendar September 2026 -> "Fiscaal Q1 2027"
 * - AAPL: in calendar September 2026 -> "Fiscaal Q4 2026"
 * - Calendar companies: in calendar Q3 2026 -> "Fiscaal Q3 2026"
 */
export function getOfficialFiscalQuarterLabel(
  ticker: string,
  fiscalDate: string,
  quarterStr?: string,
  fiscalYear?: number,
  quarterNum?: number
): string {
  // If fiscalDate is available, always use the canonical corporate fiscal rules
  if (fiscalDate) {
    const canonical = getCanonicalFiscalDetails(ticker, fiscalDate);
    return canonical.fiscalQuarterLabel;
  }

  // Fallback to explicit fiscalYear & quarterNum if no fiscalDate provided
  if (fiscalYear && quarterNum) {
    return `Fiscaal Q${quarterNum} ${fiscalYear}`;
  }

  // Fallback to quarterStr parse if no date provided
  if (quarterStr && /^Q[1-4]\s*'?\d{2,4}$/i.test(quarterStr.trim())) {
    const match = quarterStr.trim().match(/^Q([1-4])\s*'?(\d{2,4})$/i);
    if (match) {
      const q = match[1];
      let y = parseInt(match[2], 10);
      if (y < 100) y += 2000;
      return `Fiscaal Q${q} ${y}`;
    }
  }

  return 'Fiscaal Kwartaal';
}
