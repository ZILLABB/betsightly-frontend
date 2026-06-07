/**
 * Unified API Service for BetSightly Backend Integration
 *
 * This service provides a centralized interface for all API interactions.
 * It standardizes error handling, caching, response formatting, and integrates
 * with the BetSightly backend API structure.
 */

import type {
  Prediction,
  BettingCode,
  Punter,
  Bookmaker,
  HealthResponse,
  BettingCodesResponse,
  PaginatedResponse
} from '../types';
import {
  API_BASE_URL,
  API_TIMEOUT,
  DEFAULT_HEADERS,
  API_ENDPOINTS,
  API_CACHE_CONFIG
} from '../config/apiConfig';
import { adaptPredictionData } from './dataAdapter';

// Cache configuration
const cache: Record<string, { data: any; timestamp: number; headers?: Headers }> = {};

// Force refresh flag to bypass cache
let FORCE_REFRESH = false;

// Define types for rollover data structure
interface RolloverPrediction {
  id?: string;
  home_team?: string;
  away_team?: string;
  league_name?: string;
  start_time?: string | Date;
  odds?: number;
  confidence?: number;
  prediction_text?: string;
  prediction_type?: string;
  status?: string;
  fixture?: any;
  [key: string]: any;
}

interface RolloverDay {
  day: number;
  predictions: RolloverPrediction[];
  combined_odds?: number;
  avg_confidence?: number;
  status?: string;
  [key: string]: any;
}

interface RolloverData {
  days: RolloverDay[];
  name?: string;
  description?: string;
  target_odds?: number;
  [key: string]: any;
}

/**
 * Set the force refresh flag
 * @param value Whether to force refresh API data
 */
export function setForceRefresh(value: boolean): void {
  FORCE_REFRESH = value;
}

/**
 * Check if force refresh is enabled
 * @returns Whether force refresh is enabled
 */
export function getForceRefresh(): boolean {
  return FORCE_REFRESH;
}

/**
 * Check if cached data is still valid
 * @param cacheKey Cache key to check
 * @param customTTL Custom TTL to use instead of default
 * @returns Whether the cached data is valid
 */
function isCacheValid(cacheKey: string, customTTL?: number): boolean {
  if (!cache[cacheKey] || FORCE_REFRESH) return false;

  const ttl = customTTL || API_CACHE_CONFIG.TTL;
  const isValid = (Date.now() - cache[cacheKey].timestamp) < ttl;

  if (!isValid) {
    delete cache[cacheKey];
  }

  return isValid;
}

/**
 * Generic API fetch function with caching and error handling
 * @param endpoint API endpoint to fetch
 * @param options Fetch options
 * @param customTTL Custom cache TTL
 * @returns Promise with the API response data
 */
export async function fetchFromApi<T>(
  endpoint: string,
  options: RequestInit = {},
  customTTL?: number
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const cacheKey = `${url}:${JSON.stringify(options)}`;

  if (isCacheValid(cacheKey, customTTL)) {
    return cache[cacheKey].data as T;
  }

  const fetchOptions: RequestInit = {
    method: 'GET',
    headers: {
      ...DEFAULT_HEADERS,
      'Accept': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const MAX_RETRIES = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

      const response = await fetch(url, { ...fetchOptions, signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        if (response.status === 404) throw new Error(`Endpoint not found: ${endpoint}`);
        if (response.status === 429) throw new Error('Rate limit exceeded');
        if (response.status >= 500 && attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        throw new Error(`API error ${response.status}`);
      }

      const data = await response.json();
      cache[cacheKey] = { data, timestamp: Date.now(), headers: response.headers };
      return data as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (lastError.name === 'AbortError') lastError = new Error('Request timed out');
      if (attempt < MAX_RETRIES && !lastError.message.includes('not found')) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
    }
  }

  throw lastError!;
}

/**
 * Clear the API cache
 */
export function clearCache(): void {
  Object.keys(cache).forEach(key => delete cache[key]);
}

/**
 * Check API health
 * @returns Health response from the API
 */
export async function checkAPIHealth(): Promise<HealthResponse | null> {
  try {
    const response = await fetchFromApi<HealthResponse>(API_ENDPOINTS.HEALTH, {}, 60000); // 1 minute cache
    return response;
  } catch (error) {
    if (import.meta.env.DEV) console.error('API health check failed:', error);
    return null;
  }
}

/**
 * Check if API is available (simple boolean check)
 * @returns Whether the API is healthy
 */
export async function isAPIHealthy(): Promise<boolean> {
  const health = await checkAPIHealth();
  return health?.status === 'healthy';
}

/**
 * Get all predictions for all categories
 * @returns A record of predictions by category
 */
export async function getAllCategoryPredictions(): Promise<Record<string, Prediction[]>> {
  try {
    const rawData = await fetchFromApi<any>(
      API_ENDPOINTS.ML_PREDICTIONS.CATEGORIES,
      {},
      API_CACHE_CONFIG.PREDICTIONS_TTL
    );
    return adaptPredictionData(rawData);
  } catch (error) {
    // Return empty object on error
    return {
      '2_odds': [],
      '5_odds': [],
      '10_odds': [],
      'rollover': []
    };
  }
}

/**
 * Get all best predictions from the unified API endpoint
 * @returns A record of predictions by category
 */
export async function getAllBestPredictions(): Promise<Record<string, Prediction[]>> {
  try {
    const rawData = await fetchFromApi<any>(
      API_ENDPOINTS.ML_PREDICTIONS.TODAY,
      {},
      API_CACHE_CONFIG.PREDICTIONS_TTL
    );
    return adaptPredictionData(rawData);
  } catch (error) {
    // Return empty object on error
    return {
      '2_odds': [],
      '5_odds': [],
      '10_odds': [],
      'rollover': []
    };
  }
}

/**
 * Get best predictions for a specific category
 * @param category Category to get predictions for
 * @returns Array of predictions for the category
 */
export async function getCategoryBestPredictions(category: string): Promise<Prediction[]> {
  try {
    const apiCategory = category.includes('_') ? category : category.replace('odds', '_odds');
    const data = await fetchFromApi<Prediction[]>(
      API_ENDPOINTS.PREDICTIONS.BEST_CATEGORY(apiCategory),
      {},
      API_CACHE_CONFIG.PREDICTIONS_TTL
    );
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

/**
 * Get rollover predictions
 * @param days Number of days to get predictions for
 * @returns Record of predictions by day
 */
export async function getRolloverPredictions(days: number = 10): Promise<Record<number, Prediction[]>> {
  try {
    const rawData = await fetchFromApi<any>(
      API_ENDPOINTS.PREDICTIONS.CATEGORIES,
      {},
      API_CACHE_CONFIG.PREDICTIONS_TTL
    );

    const categories = adaptPredictionData(rawData);
    const rolloverPredictions = categories.rollover || [];
    const formattedDays: Record<number, Prediction[]> = {};

    // Initialize empty days
    for (let i = 1; i <= days; i++) {
      formattedDays[i] = [];
    }

    // If we have rollover predictions, distribute them across days
    if (rolloverPredictions.length > 0) {
      rolloverPredictions.forEach((prediction, index) => {
        const dayNumber = (index % days) + 1;
        formattedDays[dayNumber].push(prediction);
      });
    }

    return formattedDays;
  } catch (error) {
    // Return empty object with default days on error
    const emptyDays: Record<number, Prediction[]> = {};
    for (let i = 1; i <= days; i++) {
      emptyDays[i] = [];
    }
    return emptyDays;
  }
}

/**
 * Get betting codes with pagination
 * @param limit Maximum number of codes to return
 * @param skip Number of codes to skip
 * @param filters Optional filters
 * @returns Paginated betting codes response
 */
export async function getBettingCodes(
  limit: number = 100,
  skip: number = 0,
  filters?: Record<string, any>
): Promise<BettingCodesResponse> {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      skip: skip.toString(),
      ...filters
    });

    return await fetchFromApi<BettingCodesResponse>(
      `${API_ENDPOINTS.BETTING_CODES.LIST}?${params}`,
      {},
      API_CACHE_CONFIG.BETTING_CODES_TTL
    );
  } catch (error) {
    // Return empty response on error
    return {
      betting_codes: [],
      total: 0,
      skip,
      limit,
      has_more: false
    };
  }
}

/**
 * Get latest betting codes (convenience function)
 * @param limit Maximum number of codes to return
 * @param skip Number of codes to skip
 * @returns Array of betting codes
 */
export async function getLatestBettingCodes(limit: number = 100, skip: number = 0): Promise<BettingCode[]> {
  try {
    const response = await getBettingCodes(limit, skip);
    return response.betting_codes || [];
  } catch (error) {
    throw error;
  }
}

/**
 * Get punters list
 * @param limit Maximum number of punters to return
 * @param skip Number of punters to skip
 * @returns Paginated punters response
 */
export async function getPunters(limit: number = 100, skip: number = 0): Promise<PaginatedResponse<Punter>> {
  try {
    const params = new URLSearchParams({ limit: limit.toString(), skip: skip.toString() });
    return await fetchFromApi<PaginatedResponse<Punter>>(
      `${API_ENDPOINTS.PUNTERS.LIST}?${params}`,
      {},
      API_CACHE_CONFIG.PUNTERS_TTL
    );
  } catch (error) {
    return {
      items: [],
      total: 0,
      skip,
      limit,
      has_more: false
    };
  }
}

/**
 * Get bookmakers list
 * @param limit Maximum number of bookmakers to return
 * @param skip Number of bookmakers to skip
 * @returns Paginated bookmakers response
 */
export async function getBookmakers(limit: number = 100, skip: number = 0): Promise<PaginatedResponse<Bookmaker>> {
  try {
    const params = new URLSearchParams({ limit: limit.toString(), skip: skip.toString() });
    return await fetchFromApi<PaginatedResponse<Bookmaker>>(
      `${API_ENDPOINTS.BOOKMAKERS.LIST}?${params}`,
      {},
      API_CACHE_CONFIG.BOOKMAKERS_TTL
    );
  } catch (error) {
    return {
      items: [],
      total: 0,
      skip,
      limit,
      has_more: false
    };
  }
}

export default {
  setForceRefresh,
  getForceRefresh,
  clearCache,
  checkAPIHealth,
  isAPIHealthy,
  fetchFromApi,
  getAllCategoryPredictions,
  getAllBestPredictions,
  getCategoryBestPredictions,
  getRolloverPredictions,
  getBettingCodes,
  getLatestBettingCodes,
  getPunters,
  getBookmakers
};
