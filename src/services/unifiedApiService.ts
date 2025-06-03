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
  PredictionCategoriesResponse,
  BettingCodesResponse,
  ApiResponse,
  PaginatedResponse
} from '../types';
import {
  API_BASE_URL,
  API_TIMEOUT,
  DEFAULT_HEADERS,
  API_ENDPOINTS,
  API_CACHE_CONFIG
} from '../config/apiConfig';
import { logApiResponse } from '../utils/logUtils';
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
  console.log(`Force refresh set to: ${FORCE_REFRESH}`);
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

  // Check cache if force refresh is not enabled
  if (isCacheValid(cacheKey, customTTL)) {
    console.log(`Using cached data for ${endpoint}`);
    return cache[cacheKey].data as T;
  }

  try {
    console.log(`Fetching from ${url}`);

    // Prepare fetch options with proper headers and timeout
    const fetchOptions: RequestInit = {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        'Accept': 'application/json',
        ...options.headers,
      },
      signal: AbortSignal.timeout(API_TIMEOUT),
      ...options,
    };

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      // Handle different error types
      if (response.status === 404) {
        throw new Error(`Endpoint not found: ${endpoint}`);
      } else if (response.status === 429) {
        throw new Error(`Rate limit exceeded for: ${endpoint}`);
      } else if (response.status === 500) {
        throw new Error(`Server error: ${endpoint}`);
      } else if (response.status === 502) {
        throw new Error(`External API error: ${endpoint}`);
      } else if (response.status === 503) {
        throw new Error(`Service unavailable (ML models may be down): ${endpoint}`);
      } else {
        // Log additional context for 500 errors
        if (response.status === 500) {
          console.warn(`Server error on ${endpoint} - this endpoint may not have data yet or have database issues`);
        }
        throw new Error(`API returned status ${response.status}: ${response.statusText}`);
      }
    }

    const data = await response.json();

    // Log the API response
    logApiResponse(`fetchFromApi:${endpoint}`, data);

    // Cache the response with headers
    cache[cacheKey] = {
      data,
      timestamp: Date.now(),
      headers: response.headers
    };

    return data as T;
  } catch (error) {
    // Enhanced error logging
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error(`Network/CORS error for ${endpoint}:`, error);
      console.error('This usually means:');
      console.error('1. Backend is not running on port 8000');
      console.error('2. Backend CORS is not configured for this origin');
      console.error('3. Network connectivity issue');
    } else if (error instanceof DOMException && error.name === 'AbortError') {
      console.error(`Request timeout for ${endpoint}:`, error);
    } else {
      console.error(`Error fetching from ${endpoint}:`, error);
    }
    throw error;
  }
}

/**
 * Clear the API cache
 */
export function clearCache(): void {
  Object.keys(cache).forEach(key => delete cache[key]);
  console.log('API cache cleared');
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
    console.error('API health check failed:', error);
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
    console.log('Fetching all category predictions from unified endpoint');

    // Use the /api/predictions/categories/ endpoint as specified
    // This is the sole data source for all prediction sections as per requirements
    const rawData = await fetchFromApi<any>(
      API_ENDPOINTS.PREDICTIONS.CATEGORIES,
      {},
      API_CACHE_CONFIG.PREDICTIONS_TTL
    );
    console.log('Raw API Data received from /predictions/categories/', rawData);

    // Transform backend data to frontend format using adapter
    const categories = adaptPredictionData(rawData);

    console.log('Processed categories:', Object.keys(categories).map(key => `${key}: ${categories[key].length} predictions`));
    return categories;
  } catch (error) {
    console.error('Error fetching all category predictions:', error);
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
    console.log('Fetching all best predictions from unified endpoint');

    // Use the /api/predictions/best/ endpoint as specified
    // This endpoint should be used for the main page as per requirements
    const rawData = await fetchFromApi<any>(
      API_ENDPOINTS.PREDICTIONS.BEST,
      {},
      API_CACHE_CONFIG.PREDICTIONS_TTL
    );
    console.log('Raw API Data received from /predictions/best/', rawData);

    // Transform backend data to frontend format using adapter
    const categories = adaptPredictionData(rawData);

    console.log('Processed best predictions:', Object.keys(categories).map(key => `${key}: ${categories[key].length} predictions`));
    return categories;
  } catch (error) {
    console.error('Error fetching all best predictions:', error);
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
    console.log(`Fetching best predictions for category: ${category}`);

    // Ensure category format is correct (e.g., "2_odds")
    const apiCategory = category.includes('_') ? category : category.replace('odds', '_odds');

    // Use the /api/predictions/best/{category}/ endpoint
    const data = await fetchFromApi<Prediction[]>(
      API_ENDPOINTS.PREDICTIONS.BEST_CATEGORY(apiCategory),
      {},
      API_CACHE_CONFIG.PREDICTIONS_TTL
    );
    console.log(`API Data received for category: ${apiCategory}`, data);

    // Backend should return an array of predictions directly
    if (Array.isArray(data)) {
      return data;
    } else {
      console.warn(`Unexpected data format for category ${apiCategory}:`, data);
      return [];
    }
  } catch (error) {
    console.error(`Error fetching best predictions for ${category}:`, error);
    // Return empty array on error
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
    console.log(`Fetching rollover predictions for ${days} days`);

    // Get data from the categories endpoint as specified in the requirements
    // This is the sole data source for all prediction sections including rollover
    const rawData = await fetchFromApi<any>(
      API_ENDPOINTS.PREDICTIONS.CATEGORIES,
      {},
      API_CACHE_CONFIG.PREDICTIONS_TTL
    );
    console.log('Raw API Data received for rollover predictions', rawData);

    // Transform backend data to frontend format using adapter
    const categories = adaptPredictionData(rawData);

    // Get rollover predictions from the transformed response
    const rolloverPredictions = categories.rollover || [];
    console.log(`Found ${rolloverPredictions.length} rollover predictions`);

    // For now, organize predictions by day (this may need adjustment based on actual backend structure)
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

    console.log(`Processed rollover predictions across ${days} days`);
    return formattedDays;
  } catch (error) {
    console.error('Error fetching rollover predictions:', error);
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
    console.log(`Fetching betting codes: limit=${limit}, skip=${skip}`);

    // Build query parameters
    const params = new URLSearchParams({
      limit: limit.toString(),
      skip: skip.toString(),
      ...filters
    });

    const data = await fetchFromApi<BettingCodesResponse>(
      `${API_ENDPOINTS.BETTING_CODES.LIST}?${params}`,
      {},
      API_CACHE_CONFIG.BETTING_CODES_TTL
    );
    console.log('API Data received for betting codes', data);

    return data;
  } catch (error) {
    console.error('Error fetching betting codes:', error);
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
    console.log(`Getting latest betting codes: limit=${limit}, skip=${skip}`);
    const response = await getBettingCodes(limit, skip);
    console.log(`Latest betting codes response:`, response);
    return response.betting_codes || [];
  } catch (error) {
    console.error('Error fetching latest betting codes:', error);
    // Don't silently fail - let the error bubble up so the UI can show it
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
    console.log(`Fetching punters: limit=${limit}, skip=${skip}`);

    const params = new URLSearchParams({
      limit: limit.toString(),
      skip: skip.toString()
    });

    const data = await fetchFromApi<PaginatedResponse<Punter>>(
      `${API_ENDPOINTS.PUNTERS.LIST}?${params}`,
      {},
      API_CACHE_CONFIG.PUNTERS_TTL
    );
    console.log('API Data received for punters', data);

    return data;
  } catch (error) {
    console.error('Error fetching punters:', error);
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
    console.log(`Fetching bookmakers: limit=${limit}, skip=${skip}`);

    const params = new URLSearchParams({
      limit: limit.toString(),
      skip: skip.toString()
    });

    const data = await fetchFromApi<PaginatedResponse<Bookmaker>>(
      `${API_ENDPOINTS.BOOKMAKERS.LIST}?${params}`,
      {},
      API_CACHE_CONFIG.BOOKMAKERS_TTL
    );
    console.log('API Data received for bookmakers', data);

    return data;
  } catch (error) {
    console.error('Error fetching bookmakers:', error);
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
