import { useCallback } from 'react';
import { usePreferences } from '../hooks/usePreferences';
import {
  convertCurrency,
  formatCurrency,
  formatWithCurrency,
  convertBetweenCurrencies,
  CURRENCY_SYMBOLS,
  getExchangeRates
} from '../utils/currencyUtils';
import type { Currency } from '../contexts/PreferencesTypes';

/**
 * Custom hook for currency conversion and formatting
 *
 * This hook provides functions to convert and format monetary values
 * based on the user's preferred currency.
 */
export const useCurrency = () => {
  const { preferences } = usePreferences();
  const currentCurrency = preferences.currency;

  /**
   * Get the current currency symbol
   */
  const getCurrencySymbol = useCallback(() => {
    return CURRENCY_SYMBOLS[currentCurrency] || '$';
  }, [currentCurrency]);

  /**
   * Get all available currency symbols
   */
  const getAllCurrencySymbols = useCallback(() => {
    return CURRENCY_SYMBOLS;
  }, []);

  /**
   * Get current exchange rates
   */
  const getExchangeRatesForCurrency = useCallback(() => {
    return getExchangeRates();
  }, []);

  /**
   * Convert an amount from USD to the user's preferred currency
   */
  const convert = useCallback((amount: number, targetCurrency?: Currency) => {
    return convertCurrency(amount, targetCurrency || currentCurrency);
  }, [currentCurrency]);

  /**
   * Convert an amount from one currency to another
   */
  const convertBetween = useCallback((amount: number, fromCurrency: Currency, toCurrency?: Currency) => {
    return convertBetweenCurrencies(amount, fromCurrency, toCurrency || currentCurrency);
  }, [currentCurrency]);

  /**
   * Format a monetary value with the appropriate currency symbol
   */
  const format = useCallback((amount: number, options = {}) => {
    return formatCurrency(amount, currentCurrency, options);
  }, [currentCurrency]);

  /**
   * Format a monetary value with a specific currency
   */
  const formatWithSpecificCurrency = useCallback((amount: number, currency: Currency, options = {}) => {
    return formatCurrency(amount, currency, options);
  }, []);

  /**
   * Convert and format a monetary value in one step (from USD to current currency)
   */
  const formatUSD = useCallback((amountInUSD: number, options = {}) => {
    return formatWithCurrency(amountInUSD, currentCurrency, options);
  }, [currentCurrency]);

  /**
   * Format a monetary value with compact notation for large numbers
   */
  const formatCompact = useCallback((amount: number) => {
    return formatCurrency(amount, currentCurrency, { compact: true });
  }, [currentCurrency]);

  return {
    currency: currentCurrency,
    symbol: getCurrencySymbol(),
    symbols: getAllCurrencySymbols(),
    rates: getExchangeRatesForCurrency(),
    convert,
    convertBetween,
    format,
    formatWithCurrency: formatWithSpecificCurrency,
    formatUSD,
    formatCompact
  };
};

export default useCurrency;

