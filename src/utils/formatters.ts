/**
 * Format a number as USD currency
 * @param value - The number to format
 * @param options - Intl.NumberFormat options
 * @returns Formatted currency string
 */
export const formatUSD = (value: number, options: Intl.NumberFormatOptions = {}): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  }).format(value);
};

/**
 * Format a number as NGN currency
 * @param value - The number to format
 * @param options - Intl.NumberFormat options
 * @returns Formatted currency string
 */
export const formatNGN = (value: number, options: Intl.NumberFormatOptions = {}): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  }).format(value);
};

/**
 * Format a number as GBP currency
 * @param value - The number to format
 * @param options - Intl.NumberFormat options
 * @returns Formatted currency string
 */
export const formatGBP = (value: number, options: Intl.NumberFormatOptions = {}): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  }).format(value);
};

/**
 * Format a number as EUR currency
 * @param value - The number to format
 * @param options - Intl.NumberFormat options
 * @returns Formatted currency string
 */
export const formatEUR = (value: number, options: Intl.NumberFormatOptions = {}): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  }).format(value);
};

/**
 * Format a number as a percentage
 * @param value - The number to format (0-1)
 * @param options - Intl.NumberFormat options
 * @returns Formatted percentage string
 */
export const formatPercent = (value: number, options: Intl.NumberFormatOptions = {}): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
    ...options
  }).format(value);
};

/**
 * Format a date as a string
 * @param date - The date to format
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export const formatDate = (date: Date, options: Intl.DateTimeFormatOptions = {}): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  }).format(date);
};

/**
 * Format a date as a time string
 * @param date - The date to format
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted time string
 */
export const formatTime = (date: Date, options: Intl.DateTimeFormatOptions = {}): string => {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    ...options
  }).format(date);
};

/**
 * Format a number with commas
 * @param value - The number to format
 * @param options - Intl.NumberFormat options
 * @returns Formatted number string
 */
export const formatNumber = (value: number, options: Intl.NumberFormatOptions = {}): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  }).format(value);
};

/**
 * Format a currency value based on the selected currency
 * @param value - The number to format
 * @param currency - The currency code (USD, NGN, GBP, EUR)
 * @param options - Intl.NumberFormat options
 * @returns Formatted currency string
 */
export const formatCurrency = (
  value: number,
  currency: string = 'NGN',
  options: Intl.NumberFormatOptions = {}
): string => {
  switch (currency.toUpperCase()) {
    case 'NGN':
      return formatNGN(value, options);
    case 'GBP':
      return formatGBP(value, options);
    case 'EUR':
      return formatEUR(value, options);
    case 'USD':
    default:
      return formatUSD(value, options);
  }
};

/**
 * Format a date with local timezone
 * @param dateString - The date string to format
 * @returns Formatted date and time string in local timezone
 */
export const formatLocalDateTime = (dateString: string | Date): string => {
  if (!dateString) return '';

  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

  // Force display in user's local timezone
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true // Ensure 12-hour format with AM/PM
  })}`;
};

/**
 * Convert decimal odds to fractional (e.g. 2.50 → "3/2")
 */
const toFractional = (decimal: number): string => {
  if (decimal <= 1) return '0/1';
  const frac = decimal - 1;
  const precision = 1000;
  let num = Math.round(frac * precision);
  let den = precision;
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const d = gcd(num, den);
  num /= d;
  den /= d;
  return `${num}/${den}`;
};

/**
 * Convert decimal odds to American (e.g. 2.50 → "+150", 1.50 → "-200")
 */
const toAmerican = (decimal: number): string => {
  if (decimal >= 2) return `+${Math.round((decimal - 1) * 100)}`;
  if (decimal > 1) return `-${Math.round(100 / (decimal - 1))}`;
  return '+0';
};

/**
 * Format odds value respecting the user's chosen format.
 * @param odds - The decimal odds value
 * @param format - 'decimal' | 'fractional' | 'american' (default: 'decimal')
 * @returns Formatted odds string (without trailing "x" — callers append that if needed)
 */
export const formatOdds = (
  odds: number,
  format: 'decimal' | 'fractional' | 'american' = 'decimal'
): string => {
  if (!odds || odds <= 0) return '0.00';
  switch (format) {
    case 'fractional':
      return toFractional(odds);
    case 'american':
      return toAmerican(odds);
    case 'decimal':
    default:
      return odds.toFixed(2);
  }
};

export default {
  formatUSD,
  formatNGN,
  formatGBP,
  formatEUR,
  formatPercent,
  formatDate,
  formatTime,
  formatNumber,
  formatCurrency,
  formatLocalDateTime,
  formatOdds
};
