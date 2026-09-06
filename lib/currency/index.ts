// =============================================================================
// Currency Utilities — All amounts in PAISE (1 INR = 100 paise)
// Use integers everywhere to avoid floating-point errors
// =============================================================================

/** Convert rupees (float) to paise (integer) */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/** Convert paise (integer) to rupees (float) */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/** Format paise as readable INR string, e.g. ₹1,250.50 */
export function formatCurrency(paise: number, showSign = false): string {
  const rupees = paiseToRupees(Math.abs(paise));
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees);
  
  if (showSign && paise > 0) return `+${formatted}`;
  if (paise < 0) return `-${formatted}`;
  return formatted;
}

/** Alias for formatCurrency */
export const formatRupees = formatCurrency;

/** Format paise as compact string, e.g. ₹1.25K */
export function formatCurrencyCompact(paise: number): string {
  const rupees = Math.abs(paiseToRupees(paise));
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
  if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(1)}K`;
  return `₹${rupees.toFixed(0)}`;
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
  // Add remainder to largest share
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
