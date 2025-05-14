import type { Currency } from '../contexts/PreferencesTypes';

// Exchange rates relative to USD (as of current date)
// These would ideally come from an API in a production app
const EXCHANGE_RATES: Record<Currency, number> = {
  'USD': 1,
  'EUR': 0.92,  // 1 USD = 0.92 EUR
  'GBP': 0.79,  // 1 USD = 0.79 GBP
  'NGN': 1550,  // 1 USD = 1550 NGN (approximate)
};

// Cache for exchange rates with timestamp
interface ExchangeRateCache {
  rates: Record<Currency, number>;
  timestamp: number;
  expiresIn: number; // in milliseconds
}

// In-memory cache for exchange rates
let exchangeRateCache: ExchangeRateCache = {
  rates: EXCHANGE_RATES,
  timestamp: Date.now(),
  expiresIn: 24 * 60 * 60 * 1000 // 24 hours
};

// Currency symbols
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'NGN': '₦',
};

/**
 * Get the current exchange rates, refreshing the cache if needed
 * In a real app, this would fetch from an API
 * @returns Current exchange rates
 */
export const getExchangeRates = (): Record<Currency, number> => {
  const now = Date.now();

  // Check if cache is expired
  if (now - exchangeRateCache.timestamp > exchangeRateCache.expiresIn) {
    // In a real app, this would be an API call
    // For now, we'll just use the static rates
    exchangeRateCache = {
      rates: EXCHANGE_RATES,
      timestamp: now,
      expiresIn: 24 * 60 * 60 * 1000 // 24 hours
    };
  }

  return exchangeRateCache.rates;
};

/**
 * Convert an amount from USD to the target currency
 * @param amount Amount in USD
 * @param targetCurrency Currency to convert to
 * @returns Converted amount
 */
export const convertCurrency = (
  amount: number,
  targetCurrency: Currency = 'USD'
): number => {
  if (!amount || isNaN(amount)) return 0;

  // Get the exchange rate for the target currency
  const rates = getExchangeRates();
  const rate = rates[targetCurrency] || 1;

  // Convert the amount
  return amount * rate;
};

/**
 * Format a monetary value with the appropriate currency symbol
 * @param amount Amount to format
 * @param currency Currency to use
 * @param options Formatting options
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  currency: Currency = 'USD',
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    useSymbol?: boolean;
    compact?: boolean;
  } = {}
): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `${CURRENCY_SYMBOLS[currency]}0.00`;
  }

  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    useSymbol = true,
    compact = false
  } = options;

  // Currency-specific formatting adjustments
  let adjustedMaxFractionDigits = maximumFractionDigits;
  let adjustedMinFractionDigits = minimumFractionDigits;

  // For NGN, adjust decimal places based on amount
  if (currency === 'NGN') {
    if (amount >= 10000) {
      adjustedMaxFractionDigits = 0;
      adjustedMinFractionDigits = 0;
    } else if (amount >= 1000) {
      adjustedMaxFractionDigits = 0;
      adjustedMinFractionDigits = 0;
    }
  }

  // For large amounts in any currency, consider compact notation
  if (compact && amount >= 1000000) {
    // Use compact notation (e.g., 1.2M)
    const compactAmount = amount / 1000000;
    const formattedCompact = compactAmount.toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
    return useSymbol
      ? `${CURRENCY_SYMBOLS[currency]}${formattedCompact}M`
      : `${formattedCompact}M`;
  } else if (compact && amount >= 1000) {
    // Use compact notation (e.g., 1.2K)
    const compactAmount = amount / 1000;
    const formattedCompact = compactAmount.toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
    return useSymbol
      ? `${CURRENCY_SYMBOLS[currency]}${formattedCompact}K`
      : `${formattedCompact}K`;
  }

  // Format the number
  const formattedNumber = amount.toLocaleString(undefined, {
    minimumFractionDigits: adjustedMinFractionDigits,
    maximumFractionDigits: adjustedMaxFractionDigits
  });

  // Add the currency symbol
  return useSymbol ? `${CURRENCY_SYMBOLS[currency]}${formattedNumber}` : formattedNumber;
};

/**
 * Hook-friendly function to format currency based on user preferences
 * @param amount Amount in USD
 * @param currency Target currency
 * @param options Formatting options
 * @returns Formatted currency string in the target currency
 */
export const formatWithCurrency = (
  amount: number,
  currency: Currency = 'USD',
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    useSymbol?: boolean;
    compact?: boolean;
  } = {}
): string => {
  // Convert the amount to the target currency
  const convertedAmount = convertCurrency(amount, currency);

  // Format the converted amount
  return formatCurrency(convertedAmount, currency, options);
};

/**
 * Convert an amount from one currency to another
 * @param amount Amount to convert
 * @param fromCurrency Source currency
 * @param toCurrency Target currency
 * @returns Converted amount
 */
export const convertBetweenCurrencies = (
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number => {
  if (!amount || isNaN(amount)) return 0;

  // If currencies are the same, no conversion needed
  if (fromCurrency === toCurrency) return amount;

  // Get exchange rates
  const rates = getExchangeRates();

  // Convert to USD first (as base currency)
  const amountInUSD = amount / rates[fromCurrency];

  // Then convert from USD to target currency
  return amountInUSD * rates[toCurrency];
};
