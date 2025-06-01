/**
 * Unified API Service
 *
 * This service provides a centralized interface for all API interactions.
 * It standardizes error handling, caching, and response formatting.
 */

import type { Prediction } from '../types';
import { logApiResponse } from '../utils/logUtils';
import { API_BASE_URL, API_ENDPOINTS, AUTO_REFRESH_CONFIG, RESPONSE_TIME_EXPECTATIONS } from '../config/apiConfig';

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
/**
 * Fetch with retry logic for timeout errors
 */
async function fetchWithRetry<T>(url: string, options: RequestInit, maxRetries: number = 2): Promise<Response> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries + 1} for ${url}`);
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      lastError = error as Error;

      // Only retry on timeout errors
      if (error instanceof Error && error.name === 'TimeoutError' && attempt <= maxRetries) {
        console.warn(`Timeout on attempt ${attempt}, retrying...`);
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      // Don't retry other errors or if max retries reached
      throw error;
    }
  }

  throw lastError!;
}

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

    // Determine timeout based on endpoint type
    let timeoutMs = 10000; // Default 10 seconds
    if (endpoint.includes('/predictions/')) {
      timeoutMs = 30000; // 30 seconds for prediction endpoints (ML processing takes time)
    } else if (endpoint.includes('/health/')) {
      timeoutMs = 5000; // 5 seconds for health checks
    }

    // Add timeout and proper headers
    const fetchOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      signal: AbortSignal.timeout(timeoutMs),
      ...options,
    };

    // Use retry logic for prediction endpoints
    const maxRetries = endpoint.includes('/predictions/') ? 2 : 0;
    const response = await fetchWithRetry(url, fetchOptions, maxRetries);

    if (!response.ok) {
      // Handle different error types
      if (response.status === 404) {
        console.warn(`Endpoint not found: ${endpoint} - This endpoint may not be implemented yet`);
        throw new Error(`Endpoint not found: ${endpoint}`);
      } else if (response.status === 500) {
        console.warn(`Server error: ${endpoint} - Backend may be having issues`);
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
    if (error instanceof Error && error.name === 'TimeoutError') {
      console.error(`Timeout error for ${endpoint}:`, error);
      console.error('This usually means:');
      console.error('1. Backend is processing ML predictions (can take 20-30 seconds)');
      console.error('2. Backend server is overloaded');
      console.error('3. Network is slow');
      console.error('Consider increasing timeout or checking backend performance');
    } else if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error(`Network/CORS error for ${endpoint}:`, error);
      console.error('This usually means:');
      console.error('1. Backend is not running on port 8000');
      console.error('2. Backend CORS is not configured for origin http://localhost:3000');
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

// Health monitoring types
export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  response_time: number;
}

export interface DetailedHealthStatus extends HealthStatus {
  components: {
    database: HealthStatus;
    ml_models: HealthStatus;
    external_apis: HealthStatus;
    cache: HealthStatus;
  };
  system_info: {
    uptime: number;
    memory_usage: number;
    cpu_usage: number;
    active_connections: number;
  };
}

/**
 * Check basic API health
 * @returns Whether the API is healthy
 */
export async function checkAPIHealth(): Promise<boolean> {
  try {
    const startTime = Date.now();
    const data = await fetchFromApi<{ status: string }>(API_ENDPOINTS.HEALTH.BASIC);

    const responseTime = Date.now() - startTime;
    const isHealthy = responseTime < RESPONSE_TIME_EXPECTATIONS.HEALTH_CHECKS;

    console.log(`Health check: ${isHealthy ? 'PASS' : 'FAIL'} (${responseTime}ms)`);
    return isHealthy;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
}

/**
 * Get detailed health status
 * @returns Detailed health information
 */
export async function getDetailedHealthStatus(): Promise<DetailedHealthStatus | null> {
  try {
    const data = await fetchFromApi<DetailedHealthStatus>(API_ENDPOINTS.HEALTH.DETAILED);
    return data;
  } catch (error) {
    console.error('Detailed health check failed:', error);
    return null;
  }
}

/**
 * Check if API is ready to serve requests
 * @returns Whether the API is ready
 */
export async function checkAPIReadiness(): Promise<boolean> {
  try {
    await fetchFromApi<{ status: string }>(API_ENDPOINTS.HEALTH.READY);
    return true;
  } catch (error) {
    console.error('API readiness check failed:', error);
    return false;
  }
}

/**
 * Check if API is alive and responsive
 * @returns Whether the API is alive
 */
export async function checkAPILiveness(): Promise<boolean> {
  try {
    await fetchFromApi<{ status: string }>(API_ENDPOINTS.HEALTH.LIVE);
    return true;
  } catch (error) {
    console.error('API liveness check failed:', error);
    return false;
  }
}

/**
 * Get all predictions for all categories
 * @returns A record of predictions by category
 */
export async function getAllCategoryPredictions(): Promise<Record<string, Prediction[]>> {
  try {
    console.log('Fetching all category predictions from best endpoint');

    // Use the /api/predictions/best endpoint since it has working data
    // This provides the same data structure as categories but with real predictions
    const data = await fetchFromApi<Record<string, Prediction[]>>('/predictions/best');
    console.log('API Data received from /predictions/best for categories');

    // Transform the API response to match the frontend Prediction format
    const transformedData: Record<string, Prediction[]> = {};

    if (data && typeof data === 'object') {
      Object.entries(data).forEach(([category, apiPredictions]) => {
        if (Array.isArray(apiPredictions)) {
          const transformedPredictions = apiPredictions.map((apiPred: any) => transformApiPrediction(apiPred));

          // Sort by game start time (earliest first)
          transformedPredictions.sort((a, b) => {
            const timeA = a.game?.startTime ? new Date(a.game.startTime).getTime() : Date.now();
            const timeB = b.game?.startTime ? new Date(b.game.startTime).getTime() : Date.now();
            return timeA - timeB; // Ascending order (earliest first)
          });

          transformedData[category] = transformedPredictions;
        } else {
          transformedData[category] = [];
        }
      });
    }

    console.log('Transformed and sorted category data');
    return transformedData;
  } catch (error) {
    console.error('Error fetching all category predictions:', error);
    // Return empty object on error
    return {};
  }
}

/**
 * Transform API prediction format to frontend Prediction format
 */
function transformApiPrediction(apiPred: any): Prediction {
  const fixture = apiPred.fixture || {};
  const predictions = apiPred.predictions || {};

  // Extract the main prediction (prioritize match_result, then over_under, then btts)
  let mainPrediction = predictions.match_result || predictions.over_under || predictions.btts || {};

  // Generate a unique ID
  const id = `pred_${fixture.id || Math.random().toString(36).substr(2, 9)}`;

  // Create the game object
  const game = {
    id: fixture.id?.toString() || id,
    homeTeam: {
      id: `home_${fixture.id || 'unknown'}`,
      name: fixture.home_team || 'Home Team',
      logo: 'https://via.placeholder.com/30'
    },
    awayTeam: {
      id: `away_${fixture.id || 'unknown'}`,
      name: fixture.away_team || 'Away Team',
      logo: 'https://via.placeholder.com/30'
    },
    startTime: new Date(fixture.date || new Date()),
    league: fixture.competition || 'Unknown League',
    status: 'scheduled' as const,
    sport: 'football' as const
  };

  // Determine prediction type and value
  let predictionType = 'Match Result';
  let predictionValue = mainPrediction.prediction || 'Unknown';

  if (predictions.match_result) {
    predictionType = 'Match Result';
    predictionValue = predictions.match_result.prediction;
  } else if (predictions.over_under) {
    predictionType = 'Over/Under';
    predictionValue = predictions.over_under.prediction;
  } else if (predictions.btts) {
    predictionType = 'Both Teams to Score';
    predictionValue = predictions.btts.prediction === 'yes' ? 'Yes' : 'No';
  }

  // Calculate odds from confidence (rough estimation)
  const confidence = mainPrediction.confidence || apiPred.confidence || 50;
  const odds = confidence > 90 ? 1.2 + Math.random() * 0.5 :
               confidence > 70 ? 1.5 + Math.random() * 1.0 :
               confidence > 50 ? 2.0 + Math.random() * 2.0 :
               3.0 + Math.random() * 3.0;

  return {
    id,
    gameId: game.id,
    game,
    predictionType,
    prediction: predictionValue,
    odds: Number(odds.toFixed(2)),
    status: 'pending' as const,
    createdAt: new Date(apiPred.timestamp || new Date()),
    description: `${game.homeTeam.name} vs ${game.awayTeam.name} - ${predictionType}: ${predictionValue}`,
    explanation: `Prediction based on ML analysis with ${confidence.toFixed(1)}% confidence`,
    confidence: confidence,
    confidencePct: confidence / 100,
    gameCode: `${fixture.id || 'UNK'}`,
    // Required array properties
    predictions: [],
    combined_odds: odds,
    combined_confidence: confidence / 100
  };
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
    const data = await fetchFromApi<Record<string, Prediction[]>>('/predictions/best');
    console.log('API Data received from /predictions/best');

    // Transform the API response to match the frontend Prediction format
    const transformedData: Record<string, Prediction[]> = {};

    if (data && typeof data === 'object') {
      Object.entries(data).forEach(([category, apiPredictions]) => {
        if (Array.isArray(apiPredictions)) {
          transformedData[category] = apiPredictions.map((apiPred: any) => transformApiPrediction(apiPred));
        } else {
          transformedData[category] = [];
        }
      });
    }

    // Sort all categories by game start time (earliest first)
    Object.keys(transformedData).forEach(category => {
      if (Array.isArray(transformedData[category])) {
        transformedData[category].sort((a, b) => {
          const timeA = a.game?.startTime ? new Date(a.game.startTime).getTime() : Date.now();
          const timeB = b.game?.startTime ? new Date(b.game.startTime).getTime() : Date.now();
          return timeA - timeB; // Ascending order (earliest first)
        });
      }
    });

    console.log('Transformed and sorted predictions data for UI');
    return transformedData;
  } catch (error) {
    console.error('Error fetching all best predictions:', error);

    // If backend is having issues (500 error), provide helpful message
    if (error instanceof Error && error.message.includes('Server error')) {
      console.warn('Backend server is experiencing issues. This is normal during development.');
      console.warn('The frontend is working correctly - the issue is with the backend endpoints.');
    }

    // Return empty object on error - UI will show "No predictions available"
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

    // Use the /api/predictions/best endpoint and extract the specific category
    // This is more reliable than individual category endpoints
    const data = await fetchFromApi<Record<string, any[]>>('/predictions/best');
    console.log(`API Data received for category extraction: ${apiCategory}`);

    // Extract the specific category from the response
    const categoryData = data[apiCategory] || [];

    if (Array.isArray(categoryData)) {
      // Transform the API predictions to frontend format
      const transformedPredictions = categoryData.map((apiPred: any) => transformApiPrediction(apiPred));

      // Sort by game start time (earliest first)
      transformedPredictions.sort((a, b) => {
        const timeA = a.game?.startTime ? new Date(a.game.startTime).getTime() : Date.now();
        const timeB = b.game?.startTime ? new Date(b.game.startTime).getTime() : Date.now();
        return timeA - timeB; // Ascending order (earliest first)
      });

      console.log(`Transformed and sorted ${transformedPredictions.length} predictions for category ${apiCategory}`);
      return transformedPredictions;
    } else {
      console.warn(`Category ${apiCategory} not found in API response or not an array`);
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

    // Get data from the best endpoint since it has working data
    // Extract rollover predictions from the best endpoint response
    const data = await fetchFromApi<Record<string, any[]>>('/predictions/best');
    console.log('API Data received for rollover predictions from best endpoint');

    // Check if rollover data exists in the response
    if (data && data.rollover && Array.isArray(data.rollover)) {
      console.log(`Found ${data.rollover.length} rollover predictions`);

      // Transform rollover predictions to frontend format
      const transformedRolloverPredictions = data.rollover.map((apiPred: any) => transformApiPrediction(apiPred));

      // Distribute predictions across days (simple distribution for now)
      const formattedDays: Record<number, Prediction[]> = {};

      // Initialize empty days
      for (let i = 1; i <= days; i++) {
        formattedDays[i] = [];
      }

      // Distribute predictions across days
      transformedRolloverPredictions.forEach((prediction, index) => {
        const dayIndex = (index % days) + 1;
        formattedDays[dayIndex].push(prediction);
      });

      console.log(`Distributed ${transformedRolloverPredictions.length} rollover predictions across ${days} days`);
      return formattedDays;
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
  getDetailedHealthStatus,
  checkAPIReadiness,
  checkAPILiveness,
  fetchFromApi,
  getAllCategoryPredictions,
  getAllBestPredictions,
  getCategoryBestPredictions,
  getRolloverPredictions
};
