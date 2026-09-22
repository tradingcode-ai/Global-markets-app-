/**
 * Global Market & Currency Formatters
 * Provides institutional currency symbols, price formatting, and rate presentation.
 */

export function getCurrencySymbol(currency?: string): string {
  if (!currency) return '$';
  const c = currency.trim().toUpperCase();
  if (c === 'EUR') return '€';
  if (c === 'GBP' || c === 'GBP') return '£';
  if (c === 'HKD') return 'HK$';
  if (c === 'CNY' || c === 'JPY') return '¥';
  if (c === 'KRW') return '₩';
  if (c === 'TWD') return 'NT$';
  if (c === '%') return '';
  return '$';
}

export function formatPriceWithCurrency(price: number, currency?: string): string {
  const sym = getCurrencySymbol(currency);
  const c = (currency || 'USD').toUpperCase();
  if (c === 'JPY' || c === 'KRW') {
    return `${sym}${Math.round(price).toLocaleString()}`;
  }
  return `${sym}${price.toFixed(2)}`;
}
