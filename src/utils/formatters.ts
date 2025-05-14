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
  currency: string = 'USD', 
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

export default {
  formatUSD,
  formatNGN,
  formatGBP,
  formatEUR,
  formatPercent,
  formatDate,
  formatTime,
  formatNumber,
  formatCurrency
};
