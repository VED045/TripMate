// =============================================================================
// Currency Utilities — All amounts in PAISE (smallest unit, 100 = 1 major unit)
// Use integers everywhere to avoid floating-point errors.
// Currency is configurable per trip — do NOT hardcode INR.
// =============================================================================

export const CURRENCY_CONFIG: Record<string, { symbol: string; locale: string; code: string; name: string }> = {
  INR: { symbol: '₹', locale: 'en-IN', code: 'INR', name: 'Indian Rupee' },
  USD: { symbol: '$', locale: 'en-US', code: 'USD', name: 'US Dollar' },
  EUR: { symbol: '€', locale: 'de-DE', code: 'EUR', name: 'Euro' },
  GBP: { symbol: '£', locale: 'en-GB', code: 'GBP', name: 'British Pound' },
  AED: { symbol: 'د.إ', locale: 'ar-AE', code: 'AED', name: 'UAE Dirham' },
  SGD: { symbol: 'S$', locale: 'en-SG', code: 'SGD', name: 'Singapore Dollar' },
  JPY: { symbol: '¥', locale: 'ja-JP', code: 'JPY', name: 'Japanese Yen' },
  CAD: { symbol: 'C$', locale: 'en-CA', code: 'CAD', name: 'Canadian Dollar' },
  AUD: { symbol: 'A$', locale: 'en-AU', code: 'AUD', name: 'Australian Dollar' },
  THB: { symbol: '฿', locale: 'th-TH', code: 'THB', name: 'Thai Baht' },
};

export const SUPPORTED_CURRENCIES = Object.entries(CURRENCY_CONFIG).map(([code, cfg]) => ({
  code,
  symbol: cfg.symbol,
  name: cfg.name,
}));

/** Convert major units (e.g. rupees, dollars) to minor units (paise, cents) */
export function toPaise(amount: number): number {
  return Math.round(amount * 100);
}

/** Convert minor units (paise, cents) to major units */
export function fromPaise(paise: number): number {
  return paise / 100;
}

// Backward compat aliases
export const rupeesToPaise = toPaise;
export const paiseToRupees = fromPaise;

/** Get currency symbol for a given currency code */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_CONFIG[currency]?.symbol ?? currency;
}

/**
 * Format paise as a readable currency string.
 * Uses the trip's actual currency — not hardcoded INR.
 *
 * @param paise - Amount in minor units (paise, cents, etc.)
 * @param currency - ISO 4217 currency code (e.g. 'INR', 'USD')
 * @param showSign - Prefix positive values with '+'
 */
export function formatCurrency(paise: number, currency = 'INR', showSign = false): string {
  const cfg = CURRENCY_CONFIG[currency];
  const major = fromPaise(Math.abs(paise));

  let formatted: string;
  if (cfg) {
    formatted = new Intl.NumberFormat(cfg.locale, {
      style: 'currency',
      currency: cfg.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(major);
  } else {
    // Fallback for unknown currencies
    formatted = `${currency} ${major.toFixed(2)}`;
  }

  if (paise < 0) return `-${formatted}`;
  if (showSign && paise > 0) return `+${formatted}`;
  return formatted;
}

/** Alias — formatRupees kept for backward compatibility (passes currency through) */
export function formatRupees(paise: number, currency = 'INR'): string {
  return formatCurrency(paise, currency);
}

/**
 * Format with currency code appended for clarity in multi-currency contexts.
 * e.g. "$1,250 USD" or "₹1,250 INR"
 */
export function formatCurrencyWithCode(paise: number, currency = 'INR'): string {
  const cfg = CURRENCY_CONFIG[currency];
  const major = fromPaise(Math.abs(paise));
  const symbol = cfg?.symbol ?? currency;
  const formatted = major.toFixed(0);
  return `${symbol}${Number(formatted).toLocaleString()}`;
}

/** Format paise as compact string, e.g. ₹1.25K */
export function formatCurrencyCompact(paise: number, currency = 'INR'): string {
  const symbol = getCurrencySymbol(currency);
  const major = Math.abs(fromPaise(paise));
  if (major >= 100000) return `${symbol}${(major / 100000).toFixed(1)}L`;
  if (major >= 1000) return `${symbol}${(major / 1000).toFixed(1)}K`;
  return `${symbol}${major.toFixed(0)}`;
}

/** Divide paise amount by n people, returning array of paise (handles remainders) */
export function divideEquallyPaise(totalPaise: number, n: number): number[] {
  if (n <= 0) throw new Error('Cannot divide by zero or negative number');
  const base = Math.floor(totalPaise / n);
  const remainder = totalPaise % n;
  return Array.from({ length: n }, (_, i) => base + (i < remainder ? 1 : 0));
}

/** Validate that splits sum to total (with 1 paise tolerance for rounding) */
export function validateSplitsSum(splits: number[], totalPaise: number): boolean {
  const sum = splits.reduce((a, b) => a + b, 0);
  return Math.abs(sum - totalPaise) <= 1;
}

/** Validate percentages sum to 100 */
export function validatePercentagesSum(percentages: number[]): boolean {
  const sum = percentages.reduce((a, b) => a + b, 0);
  return Math.abs(sum - 100) < 0.01;
}

/** Calculate splits from percentages */
export function calculatePercentageSplits(totalPaise: number, percentages: number[]): number[] {
  const splits = percentages.map(p => Math.floor((totalPaise * p) / 100));
  const remainder = totalPaise - splits.reduce((a, b) => a + b, 0);
  const maxIdx = splits.indexOf(Math.max(...splits));
  splits[maxIdx] += remainder;
  return splits;
}

/** Calculate splits from shares */
export function calculateSharesSplits(totalPaise: number, shares: number[]): number[] {
  const totalShares = shares.reduce((a, b) => a + b, 0);
  if (totalShares <= 0) throw new Error('Total shares must be positive');
  const splits = shares.map(s => Math.floor((totalPaise * s) / totalShares));
  const remainder = totalPaise - splits.reduce((a, b) => a + b, 0);
  const maxIdx = splits.indexOf(Math.max(...splits));
  splits[maxIdx] += remainder;
  return splits;
}
