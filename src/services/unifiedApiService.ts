/**
 * Unified API Service
 *
 * This service provides a centralized interface for all API interactions.
 * It standardizes error handling, caching, and response formatting.
 */

import type { Prediction } from '../types';
import { logApiResponse } from '../utils/logUtils';

// API base URL - try to get from environment or use default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const cache: Record<string, { data: any; timestamp: number }> = {};

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
 * Generic API fetch function with caching and error handling
 * @param endpoint API endpoint to fetch
 * @param options Fetch options
 * @returns Promise with the API response data
 */
export async function fetchFromApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const cacheKey = `${url}:${JSON.stringify(options)}`;

  // Check cache if force refresh is not enabled
  if (!FORCE_REFRESH && cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp) < CACHE_DURATION) {
    console.log(`Using cached data for ${endpoint}`);
    return cache[cacheKey].data as T;
  }

  try {
    console.log(`Fetching from ${url}`);

    // Get auth token if available
    const token = localStorage.getItem('auth_token');

    // Add timeout and proper headers
    const fetchOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
      ...options,
    };

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      // Handle different error types
      if (response.status === 404) {
        throw new Error(`Endpoint not found: ${endpoint}`);
      } else if (response.status === 500) {
        throw new Error(`Server error: ${endpoint}`);
      } else if (response.status === 0) {
        throw new Error(`CORS or network error: ${endpoint}`);
      } else {
        throw new Error(`API returned status ${response.status}: ${response.statusText}`);
      }
    }

    const data = await response.json();

    // Log the API response
    logApiResponse(`fetchFromApi:${endpoint}`, data);

    // Cache the response
    cache[cacheKey] = {
      data,
      timestamp: Date.now()
    };

    return data as T;
  } catch (error) {
    // Enhanced error logging
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error(`Network/CORS error for ${endpoint}:`, error);
      console.error('This usually means:');
      console.error('1. Backend is not running on port 8000');
      console.error('2. Backend CORS is not configured for origin http://localhost:5182');
      console.error('3. Network connectivity issue');
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
 * @returns Whether the API is healthy
 */
export async function checkAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
}

/**
 * Get all predictions for all categories
 * @returns A record of predictions by category
 */
export async function getAllCategoryPredictions(): Promise<Record<string, Prediction[]>> {
  try {
    console.log('Fetching all category predictions from unified endpoint');

    // Use the /api/predictions/categories endpoint as specified
    // This is the sole data source for all prediction sections as per requirements
    const data = await fetchFromApi<any>('/predictions/categories/');
    console.log('API Data received from /predictions/categories');

    // Return the categories data directly from the API
    return data.categories || {};
  } catch (error) {
    console.error('Error fetching all category predictions:', error);
    // Return empty object on error
    return {};
  }
}

/**
 * Get all best predictions from the unified API endpoint
 * @returns A record of predictions by category
 */
export async function getAllBestPredictions(): Promise<Record<string, Prediction[]>> {
  try {
    console.log('Fetching all best predictions from unified endpoint');

    // Use the /api/predictions/best endpoint as specified
    // This endpoint should be used for the main page as per requirements
    const data = await fetchFromApi<Record<string, Prediction[]>>('/predictions/best/');
    console.log('API Data received from /predictions/best');

    // Simply return the data as is from the API
    return data || {};
  } catch (error) {
    console.error('Error fetching all best predictions:', error);
    // Return empty object on error
    return {};
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

    // Convert category format if needed (e.g., "2odds" to "2_odds")
    const apiCategory = category.includes('_') ? category : category.replace('odds', '_odds');

    // Use the /api/predictions/best/{category} endpoint
    // This endpoint is used for category-specific predictions
    const data = await fetchFromApi<any>(`/predictions/best/${apiCategory}/`);
    console.log(`API Data received for category: ${apiCategory}`);

    // Handle different response formats
    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.predictions)) {
      return data.predictions;
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
    const data = await fetchFromApi<any>('/predictions/categories/');
    console.log('API Data received for rollover predictions');

    // Check if rollover data exists in the response
    if (data && data.categories && data.categories.rollover) {
      // Get the rollover days data
      const rolloverData = data.categories.rollover as { days: RolloverDay[] };

      // Log the structure for debugging
      console.log('Rollover data structure:', JSON.stringify(rolloverData).substring(0, 200) + '...');

      // Check if days property exists and is an array
      if (rolloverData.days && Array.isArray(rolloverData.days)) {
        console.log(`Found ${rolloverData.days.length} rollover days`);
        const formattedDays: Record<number, Prediction[]> = {};

        // Process each day in the rollover data
        rolloverData.days.forEach((day: RolloverDay) => {
          if (day && typeof day.day === 'number' && Array.isArray(day.predictions)) {
            // Map each prediction to ensure it has the correct structure
            const mappedPredictions = day.predictions.map((pred: RolloverPrediction) => {
              // Ensure each prediction has the required fields with proper types
              const predictionId = typeof pred.id === 'string'
                ? pred.id
                : `rollover-${day.day}-${Math.random().toString(36).substring(2, 9)}`;

              return {
                ...pred,
                id: predictionId,
                game: {
                  homeTeam: pred.home_team || 'Home Team',
                  awayTeam: pred.away_team || 'Away Team',
                  league: pred.league_name || 'Unknown League',
                  startTime: pred.start_time || new Date(),
                  ...pred.fixture
                },
                odds: pred.odds || 1.0,
                confidence: pred.confidence || 0,
                predictionType: pred.prediction_text || pred.prediction_type || 'Unknown',
                status: pred.status || 'pending'
              } as Prediction;
            });

            formattedDays[day.day] = mappedPredictions;
          }
        });

        console.log(`Processed ${Object.keys(formattedDays).length} rollover days`);
        return formattedDays;
      }
    }

    // Return empty object with default days if no rollover data found
    console.log('No valid rollover data found, returning empty object');
    const emptyDays: Record<number, Prediction[]> = {};
    for (let i = 1; i <= days; i++) {
      emptyDays[i] = [];
    }
    return emptyDays;
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

export default {
  setForceRefresh,
  getForceRefresh,
  clearCache,
  checkAPIHealth,
  fetchFromApi,
  getAllCategoryPredictions,
  getAllBestPredictions,
  getCategoryBestPredictions,
  getRolloverPredictions
};
