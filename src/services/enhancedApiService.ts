import { captureException, addBreadcrumb } from '../utils/errorTracking';
import cache from '../utils/cacheUtils';
import debug from '../utils/debugUtils';
import type {
  Prediction,
  Game,
  RolloverGame,
  StatsOverview,
  SportStats,
  PredictionFilters,
  Punter
} from '../types';
import { getPredictionsForDay as getMockPredictionsForDay } from './dataService';

// API configuration
export const API_BASE_URL = 'http://localhost:8000/api';
const API_TIMEOUT = 15000; // 15 seconds - increased timeout
const MAX_RETRIES = 3; // Increased retries

// Cache TTL constants (in seconds)
const CACHE_TTL = {
  SHORT: 60,          // 1 minute
  MEDIUM: 300,        // 5 minutes
  LONG: 3600,         // 1 hour
  VERY_LONG: 86400    // 24 hours
};

// Force refresh flag - set to true to bypass cache and get fresh data
const FORCE_REFRESH = true;

// Log API configuration
console.log("[API] Configuration:", {
  API_BASE_URL,
  API_TIMEOUT,
  MAX_RETRIES,
  FORCE_REFRESH
});

// API Error class
export class APIError extends Error {
  status: number;
  endpoint: string;

  constructor(message: string, status: number, endpoint: string) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.endpoint = endpoint;
  }
}

/**
 * Enhanced fetch function with error handling, retries, and timeouts
 */
async function fetchWithRetry<T>(
  endpoint: string,
  options?: RequestInit,
  retries: number = MAX_RETRIES,
  timeout: number = API_TIMEOUT
): Promise<T> {
  const method = options?.method || 'GET';
  const url = `${API_BASE_URL}${endpoint}`;

  // Add breadcrumb for error tracking
  addBreadcrumb('api', `Fetching ${endpoint}`, { retries, timeout });

  // Log API request
  debug.logApiRequest(method, url, {
    retries,
    timeout,
    headers: options?.headers,
    body: options?.body ? JSON.parse(options.body as string) : undefined
  });

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const startTime = Date.now();

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      },
      signal: controller.signal
    });

    // Clear timeout
    clearTimeout(timeoutId);

    const responseTime = Date.now() - startTime;

    // Log response time
    debug.logDebug(`API Response time: ${responseTime}ms for ${method} ${url}`, { category: 'api' });

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || `API error: ${response.status}`;

      // Log API error response
      debug.logApiError(method, url, {
        status: response.status,
        errorData,
        responseTime
      });

      // If we have retries left and it's a 5xx error, retry
      if (retries > 0 && response.status >= 500) {
        debug.logWarn(`Retrying ${endpoint} after ${response.status} error. Retries left: ${retries}`, { category: 'api' });
        return fetchWithRetry<T>(endpoint, options, retries - 1, timeout);
      }

      throw new APIError(errorMessage, response.status, endpoint);
    }

    // Parse response
    const responseData = await response.json() as T;

    // Log API success response
    debug.logApiResponse(method, url, response.status, responseData);

    return responseData;
  } catch (error) {
    // Clear timeout
    clearTimeout(timeoutId);

    // Handle abort error (timeout)
    if (error instanceof DOMException && error.name === 'AbortError') {
      debug.logError(`API Timeout: ${method} ${url} (${timeout}ms)`, { category: 'api' });

      if (retries > 0) {
        debug.logWarn(`Retrying ${endpoint} after timeout. Retries left: ${retries}`, { category: 'api' });
        return fetchWithRetry<T>(endpoint, options, retries - 1, timeout);
      }
      throw new APIError(`Request timeout for ${endpoint}`, 408, endpoint);
    }

    // Rethrow API errors
    if (error instanceof APIError) {
      throw error;
    }

    // Handle other errors
    debug.logError(`Error fetching from ${endpoint}:`, { category: 'api', data: error });
    captureException(error as Error, { endpoint });
    throw new APIError(`Failed to fetch from ${endpoint}: ${(error as Error).message}`, 0, endpoint);
  }
}

/**
 * Check API health with fallback
 */
export const checkAPIHealth = async (): Promise<{ status: string; message: string; isLive: boolean }> => {
  try {
    const data = await fetchWithRetry<{ status: string; message: string }>('/health');
    return { ...data, isLive: data.status === 'healthy' };
  } catch (error) {
    console.error('API health check failed:', error);
    return { status: 'error', message: 'API is not available', isLive: false };
  }
};

/**
 * Get daily predictions with fallback to mock data
 */
export const getDailyPredictions = async (): Promise<Record<string, Prediction[]>> => {
  const cacheKey = 'api_daily_predictions';
  const cachedData = cache.get<Record<string, Prediction[]>>(cacheKey);

  if (cachedData && !FORCE_REFRESH) {
    console.log('Cache hit: API daily predictions');
    return cachedData;
  }

  // If force refresh is enabled, log it
  if (FORCE_REFRESH) {
    console.log('Force refresh enabled, bypassing cache');
  }

  try {
    // First check if the API is available
    try {
      const healthCheck = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // Quick timeout for health check
      });

      if (!healthCheck.ok) {
        throw new Error(`API health check failed with status: ${healthCheck.status}`);
      }

      console.log('API health check passed, fetching predictions...');
    } catch (healthError) {
      console.error('API health check failed, backend may not be running:', healthError);
      throw new Error('Backend server is not running or not accessible');
    }

    // Get predictions from the football-json-api endpoint
    const data = await fetchWithRetry<any>('/football-json-api/predictions/daily');

    // Log the data structure to console for debugging
    console.log('Daily predictions data structure:', Object.keys(data));

    // Process the data based on its structure
    let processedData: Record<string, Prediction[]> = {};

    if (data && typeof data === 'object') {
      // Check if the data has the expected structure
      if (data['2_odds'] || data['5_odds'] || data['10_odds'] || data['rollover']) {
        // Map each category to frontend format
        const categories = ['2_odds', '5_odds', '10_odds', 'rollover'];

        for (const category of categories) {
          if (Array.isArray(data[category])) {
            // Direct array format
            processedData[category] = mapAPIPredictionsToFrontend(data[category]);
          } else if (Array.isArray(data[category]?.[0])) {
            // Nested array format (multiple sets)
            // Flatten the nested arrays for now
            const flattenedPredictions = data[category].flat();
            processedData[category] = mapAPIPredictionsToFrontend(flattenedPredictions);
          } else {
            processedData[category] = [];
          }
        }
      } else if (data.categories) {
        // Alternative structure with categories property
        for (const [category, predictions] of Object.entries(data.categories)) {
          if (Array.isArray(predictions)) {
            processedData[category] = mapAPIPredictionsToFrontend(predictions);
          }
        }
      } else if (data.predictions) {
        // Alternative structure with predictions property
        const allPredictions = Array.isArray(data.predictions) ? data.predictions : [];

        // Group by odds
        processedData = {
          "2_odds": mapAPIPredictionsToFrontend(allPredictions.filter(p => p.odds < 2.5)),
          "5_odds": mapAPIPredictionsToFrontend(allPredictions.filter(p => p.odds >= 2.5 && p.odds < 7.5)),
          "10_odds": mapAPIPredictionsToFrontend(allPredictions.filter(p => p.odds >= 7.5)),
          "rollover": mapAPIPredictionsToFrontend(allPredictions.filter(p => p.rollover))
        };
      } else {
        // Unknown structure, try to extract predictions
        console.warn('Unknown API response structure, attempting to extract predictions');

        // Try to find arrays that might contain predictions
        const possiblePredictions = Object.values(data).filter(Array.isArray);
        if (possiblePredictions.length > 0) {
          const allPredictions = possiblePredictions.flat();

          // Group by odds
          processedData = {
            "2_odds": mapAPIPredictionsToFrontend(allPredictions.filter(p => p.odds < 2.5)),
            "5_odds": mapAPIPredictionsToFrontend(allPredictions.filter(p => p.odds >= 2.5 && p.odds < 7.5)),
            "10_odds": mapAPIPredictionsToFrontend(allPredictions.filter(p => p.odds >= 7.5)),
            "rollover": mapAPIPredictionsToFrontend(allPredictions.filter(p => p.rollover))
          };
        }
      }
    }

    // Check if we have any predictions
    const hasPredictions = Object.values(processedData).some(arr => arr.length > 0);

    if (!hasPredictions) {
      console.warn('No predictions found in API response, falling back to mock data');
      throw new Error('No predictions found in API response');
    }

    // Log the processed data
    console.log('Processed daily predictions:',
      Object.entries(processedData).map(([k, v]) => `${k}: ${v.length} predictions`));

    // Cache the result
    cache.set(cacheKey, processedData, CACHE_TTL.SHORT);
    return processedData;
  } catch (error) {
    console.error('Error fetching daily predictions, falling back to mock data:', error);

    // Fall back to mock data
    const today = new Date();
    const mockPredictions = await getMockPredictionsForDay(today);

    // Group by odds categories
    const mockData = {
      "2_odds": mockPredictions.filter(p => p.odds >= 1.5 && p.odds < 3.5),
      "5_odds": mockPredictions.filter(p => p.odds >= 3.5 && p.odds < 7.5),
      "10_odds": mockPredictions.filter(p => p.odds >= 7.5)
    };

    // Log the mock data being used
    console.log('Using mock daily predictions data:',
      Object.entries(mockData).map(([k, v]) => `${k}: ${v.length} predictions`));

    // Cache the mock result
    cache.set(cacheKey, mockData, CACHE_TTL.SHORT);
    return mockData;
  }
};

/**
 * Map API predictions to frontend format
 */
function mapAPIPredictionsToFrontend(apiPredictions: any[]): Prediction[] {
  if (!apiPredictions || !Array.isArray(apiPredictions)) {
    console.warn('Invalid predictions data:', apiPredictions);
    return [];
  }

  return apiPredictions.map(prediction => {
    // Extract team names, handling different API formats
    const homeTeam = prediction.homeTeam || prediction.home_team || '';
    const awayTeam = prediction.awayTeam || prediction.away_team || '';

    // Generate team IDs
    const homeTeamId = homeTeam ? homeTeam.toLowerCase().replace(/\s+/g, '_') : (prediction.home_team_id || `home_${Math.random().toString(36).substring(2, 9)}`);
    const awayTeamId = awayTeam ? awayTeam.toLowerCase().replace(/\s+/g, '_') : (prediction.away_team_id || `away_${Math.random().toString(36).substring(2, 9)}`);

    // Extract match date
    let matchDate = new Date();
    try {
      if (prediction.matchDate || prediction.match_date || prediction.start_time) {
        matchDate = new Date(prediction.matchDate || prediction.match_date || prediction.start_time);
      }
    } catch (e) {
      console.warn('Error parsing match date:', e);
    }

    // Determine sport type
    const sportType = prediction.source === 'balldontlie' || prediction.league?.includes('NBA') ? 'basketball' : 'soccer';

    // Extract logos if available
    const homeLogo = prediction.home_team_logo || prediction.homeTeamLogo || '';
    const awayLogo = prediction.away_team_logo || prediction.awayTeamLogo || '';

    // Extract prediction type and selection
    let predictionType = prediction.predictionType || prediction.prediction_type || '1X2';
    let predictionValue = prediction.prediction || prediction.selection || 'home';

    // Handle different prediction formats
    if (typeof predictionType === 'object' && predictionType !== null) {
      // Handle case where prediction is an object
      predictionValue = predictionType.selection || predictionValue;
      predictionType = predictionType.market || '1X2';
    }

    // Extract confidence
    const confidence = typeof prediction.confidence === 'number' ? prediction.confidence :
      (typeof prediction.confidence === 'string' ? parseFloat(prediction.confidence) : 75);

    // Extract odds
    const odds = typeof prediction.odds === 'number' ? prediction.odds :
      (typeof prediction.odds === 'string' ? parseFloat(prediction.odds) : 1.8);

    // Extract explanation
    const explanation = prediction.explanation || prediction.description || prediction.reason ||
      `Based on statistical analysis, ${predictionValue === 'home' ? homeTeam :
        (predictionValue === 'away' ? awayTeam : 'a draw')} is the predicted outcome.`;

    // Create the formatted prediction object
    return {
      id: prediction.id || `pred_${Math.random().toString(36).substring(2, 9)}`,
      game: {
        id: prediction.game_id || prediction.matchId || `game_${Math.random().toString(36).substring(2, 9)}`,
        sport: sportType,
        homeTeam: {
          id: homeTeamId,
          name: homeTeam || 'Home Team',
          logo: homeLogo
        },
        awayTeam: {
          id: awayTeamId,
          name: awayTeam || 'Away Team',
          logo: awayLogo
        },
        startTime: matchDate,
        league: prediction.league || 'Unknown League',
        status: prediction.match_status || prediction.status || 'scheduled',
        score: prediction.score || { home: 0, away: 0 }
      },
      predictionType: predictionType,
      prediction: predictionValue,
      odds: odds,
      status: prediction.status || 'pending',
      createdAt: new Date(prediction.created_at || prediction.createdAt || new Date()),
      description: explanation,
      explanation: explanation,
      confidence: confidence,
      gameCode: prediction.game_code || prediction.gameCode || '',
      punterId: prediction.punter_id || prediction.punterId || 'ai-system',
      bookmaker: prediction.bookmaker || 'bet365',
      rolloverDay: prediction.rollover ? 1 : (prediction.rolloverDay || null),
      value: prediction.value || null
    };
  });
}

/**
 * Get next set of predictions for a specific category
 */
export const getNextPredictionsForCategory = async (category: string): Promise<Prediction[]> => {
  // Use a consistent cache key if not forcing refresh
  const cacheKey = FORCE_REFRESH
    ? `next_predictions_${category}_${Date.now()}` // Use timestamp to avoid caching when forcing refresh
    : `next_predictions_${category}`; // Use consistent key otherwise

  // Log force refresh status
  if (FORCE_REFRESH) {
    console.log(`Force refresh enabled for category ${category}, bypassing cache`);
  }

  try {
    // Map category name to API format if needed
    const apiCategory = category.replace('odds', '_odds');

    // Call the football-json-api predictions by category endpoint
    const data = await fetchWithRetry<any>(`/football-json-api/predictions/category/${apiCategory}`);

    // Handle different response formats
    let predictionsData = [];
    if (data && data.predictions) {
      // Response has a predictions array
      predictionsData = data.predictions;
    } else if (Array.isArray(data)) {
      // Response is an array directly
      predictionsData = data;
    } else if (typeof data === 'object') {
      // Try to find any array in the response
      const possibleArrays = Object.values(data).filter(Array.isArray);
      if (possibleArrays.length > 0) {
        predictionsData = possibleArrays[0];
      }
    }

    if (!predictionsData || predictionsData.length === 0) {
      console.warn(`No predictions found for category ${category}, falling back to cached data`);

      // Try to get predictions from the main cache
      const allPredictions = cache.get<Record<string, Prediction[]>>('api_daily_predictions');
      if (allPredictions && allPredictions[apiCategory] && allPredictions[apiCategory].length > 0) {
        // Shuffle the predictions to get a "next" set
        const shuffled = [...allPredictions[apiCategory]].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3);
      }

      // If still no predictions, return empty array
      return [];
    }

    // Map to frontend format
    const predictions = mapAPIPredictionsToFrontend(predictionsData);

    // Log the predictions
    console.log(`Got ${predictions.length} next predictions for ${category}`);

    // If we have more than 3 predictions, return a random subset
    if (predictions.length > 3) {
      // Shuffle the predictions to get a "next" set
      const shuffled = [...predictions].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 3);
    }

    return predictions;
  } catch (error) {
    console.error(`Error fetching next predictions for ${category}:`, error);

    // Try to get predictions from the main cache
    try {
      const apiCategory = category.replace('odds', '_odds');
      const allPredictions = cache.get<Record<string, Prediction[]>>('api_daily_predictions');
      if (allPredictions && allPredictions[apiCategory] && allPredictions[apiCategory].length > 0) {
        // Shuffle the predictions to get a "next" set
        const shuffled = [...allPredictions[apiCategory]].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3);
      }
    } catch (cacheError) {
      console.error(`Error getting cached predictions: ${cacheError}`);
    }

    // Return empty array on error
    return [];
  }
};

export default {
  checkAPIHealth,
  getDailyPredictions,
  getNextPredictionsForCategory,
  mapAPIPredictionsToFrontend
};
