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

// API configuration
export const API_BASE_URL = 'http://localhost:8000/api';
console.log('Using API base URL:', API_BASE_URL);
const API_TIMEOUT = 15000; // 15 seconds - increased timeout
const MAX_RETRIES = 3; // Increased retries

// Cache for fixtures to avoid multiple requests for the same fixture
const fixtureCache: Record<number, any> = {};

// Cache TTL constants (in seconds)
const CACHE_TTL = {
  SHORT: 60,          // 1 minute
  MEDIUM: 300,        // 5 minutes
  LONG: 3600,         // 1 hour
  VERY_LONG: 86400    // 24 hours
};

// Force refresh flag - can be set to true to bypass cache
let FORCE_REFRESH = false;

// Function to set force refresh flag
export const setForceRefresh = (value: boolean) => {
  FORCE_REFRESH = value;
  console.log(`Force refresh set to: ${FORCE_REFRESH}`);
};

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
    console.log('Checking API health at:', `${API_BASE_URL}/health`);

    // Try to fetch the health endpoint
    try {
      const data = await fetchWithRetry<{ status: string; message: string }>('/health');
      console.log('API health check response:', data);
      return { ...data, isLive: data.status === 'ok' || data.status === 'healthy' };
    } catch (healthError) {
      console.warn('Health endpoint failed, trying predictions endpoint as fallback');

      // Try predictions endpoint as fallback
      const predictionsResponse = await fetchWithRetry<any>('/predictions?categorized=true');
      if (predictionsResponse) {
        console.log('Predictions endpoint is available, API is working');
        return {
          status: 'ok',
          message: 'API is available (via predictions endpoint)',
          isLive: true
        };
      }

      throw healthError; // Re-throw if predictions endpoint also fails
    }
  } catch (error) {
    console.error('API health check failed:', error);

    // Try the root endpoint as a last resort
    try {
      console.log('Trying root endpoint as last resort');
      const rootResponse = await fetch(`${API_BASE_URL.split('/api')[0]}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (rootResponse.ok) {
        console.log('Root endpoint is available, API might be partially working');
        return {
          status: 'warning',
          message: 'API root is available but endpoints may not be working',
          isLive: true
        };
      }
    } catch (rootError) {
      console.error('Root endpoint also failed:', rootError);
    }

    return { status: 'error', message: 'API is not available', isLive: false };
  }
};

/**
 * Get daily predictions using only the /predictions/best endpoint
 */
export const getDailyPredictions = async (bestOnly: boolean = true): Promise<Record<string, Prediction[]>> => {
  const cacheKey = `api_daily_predictions_${bestOnly ? 'best' : 'all'}`;
  const cachedData = cache.get<Record<string, Prediction[]>>(cacheKey);

  if (cachedData && !FORCE_REFRESH) {
    console.log(`Cache hit: API daily predictions (bestOnly=${bestOnly})`);
    return cachedData;
  }

  // If force refresh is enabled, log it
  if (FORCE_REFRESH) {
    console.log('Force refresh enabled, bypassing cache');
  }

  try {
    // First check if the API is available
    try {
      const healthResult = await checkAPIHealth();

      if (!healthResult.isLive) {
        throw new Error(`API health check failed: ${healthResult.message}`);
      }

      console.log('API health check passed, fetching predictions...');
    } catch (healthError) {
      console.error('API health check failed, backend may not be running:', healthError);
      // Continue anyway - we'll try to fetch predictions and fall back to mock data if needed
    }

    // Use the best predictions endpoint to get all categories at once
    console.log('Fetching best predictions for all categories...');
    const allBestPredictions = await getAllBestPredictions();

    // Check if we have any predictions
    const hasPredictions = Object.values(allBestPredictions).some(arr => arr.length > 0);

    if (!hasPredictions) {
      console.warn('No predictions found in API response, falling back to mock data');
      throw new Error('No predictions found in API response');
    }

    // Convert category names to match expected format
    const processedData: Record<string, Prediction[]> = {};
    for (const [category, predictions] of Object.entries(allBestPredictions)) {
      // Convert frontend category names (2odds) to API format (2_odds)
      const apiCategory = category.includes('_') ? category : category.replace('odds', '_odds');
      processedData[apiCategory] = predictions;
    }

    // Log the processed data
    console.log('Processed daily predictions:',
      Object.entries(processedData).map(([k, v]) => `${k}: ${v.length} predictions`));

    // Cache the result
    cache.set(cacheKey, processedData, CACHE_TTL.SHORT);
    return processedData;
  } catch (error) {
    console.error('Error fetching daily predictions:', error);

    // Return empty data instead of mock data
    const emptyData = {
      "2_odds": [],
      "5_odds": [],
      "10_odds": [],
      "rollover": []
    };

    console.log('Returning empty predictions data due to API error');

    return emptyData;
  }
};

/**
 * Map API predictions to frontend format
 */
async function mapAPIPredictionsToFrontend(apiPredictions: any[]): Promise<Prediction[]> {
  if (!apiPredictions || !Array.isArray(apiPredictions)) {
    console.warn('Invalid predictions data:', apiPredictions);
    return [];
  }

  // Log the first prediction to understand the structure
  if (apiPredictions.length > 0) {
    console.log('Sample prediction structure:', JSON.stringify(apiPredictions[0], null, 2));
  }

  // Fetch fixture details for all predictions in parallel
  const fixturePromises = apiPredictions.map(async (prediction) => {
    if (prediction.fixture_id) {
      return getFixtureById(prediction.fixture_id);
    }
    return null;
  });

  const fixtures = await Promise.all(fixturePromises);

  // Create a map of fixture_id to fixture details
  const fixtureMap: Record<number, any> = {};
  fixtures.forEach((fixture, index) => {
    if (fixture && apiPredictions[index].fixture_id) {
      fixtureMap[apiPredictions[index].fixture_id] = fixture;
    }
  });

  // Map predictions to frontend format
  const mappedPredictions = apiPredictions.map((prediction, index) => {
    // Get fixture details if available
    const fixture = prediction.fixture_id ? fixtureMap[prediction.fixture_id] : null;

    // Extract team names, handling different API formats
    const homeTeam = fixture?.home_team || prediction.homeTeam || prediction.home_team || '';
    const awayTeam = fixture?.away_team || prediction.awayTeam || prediction.away_team || '';

    // Generate team IDs
    const homeTeamId = fixture?.home_team_id || (homeTeam ? homeTeam.toLowerCase().replace(/\s+/g, '_') : (prediction.home_team_id || `home_${Math.random().toString(36).substring(2, 9)}`));
    const awayTeamId = fixture?.away_team_id || (awayTeam ? awayTeam.toLowerCase().replace(/\s+/g, '_') : (prediction.away_team_id || `away_${Math.random().toString(36).substring(2, 9)}`));

    // Extract match date
    let matchDate = new Date();
    try {
      if (fixture?.date) {
        matchDate = new Date(fixture.date);
      } else if (prediction.matchDate || prediction.match_date || prediction.start_time) {
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

    // Extract league information
    const league = fixture?.league_name || prediction.league || 'Unknown League';

    // Extract prediction type and selection
    let predictionType = prediction.predictionType || prediction.prediction_type || '1X2';
    let predictionValue = prediction.prediction || prediction.selection || 'home';

    // Handle different prediction formats
    if (typeof predictionType === 'object' && predictionType !== null) {
      // Handle case where prediction is an object
      predictionValue = predictionType.selection || predictionValue;
      predictionType = predictionType.market || '1X2';
    }

    // Map prediction types from backend format
    if (prediction.btts_pred) {
      predictionType = 'btts';
      predictionValue = prediction.btts_pred;
    } else if (prediction.over_under_pred) {
      predictionType = prediction.over_under_pred === 'OVER' ? 'over_2_5' : 'under_2_5';
      predictionValue = prediction.over_under_pred;
    } else if (prediction.match_result_pred) {
      if (prediction.match_result_pred === 'HOME') {
        predictionType = 'home_win';
        predictionValue = 'Home Win';
      } else if (prediction.match_result_pred === 'DRAW') {
        predictionType = 'draw';
        predictionValue = 'Draw';
      } else if (prediction.match_result_pred === 'AWAY') {
        predictionType = 'away_win';
        predictionValue = 'Away Win';
      }
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

    // Extract prediction percentages
    const homeWinPct = prediction.home_win_pct || prediction.homeWinPct || Math.round((prediction.home_win_pred || 0) * 100);
    const drawPct = prediction.draw_pct || prediction.drawPct || Math.round((prediction.draw_pred || 0) * 100);
    const awayWinPct = prediction.away_win_pct || prediction.awayWinPct || Math.round((prediction.away_win_pred || 0) * 100);
    const over25Pct = prediction.over_2_5_pct || prediction.over25Pct || Math.round((prediction.over_2_5_pred || 0) * 100);
    const under25Pct = prediction.under_2_5_pct || prediction.under25Pct || Math.round((prediction.under_2_5_pred || 0) * 100);
    const bttsYesPct = prediction.btts_yes_pct || prediction.bttsYesPct || Math.round((prediction.btts_yes_pred || 0) * 100);
    const bttsNoPct = prediction.btts_no_pct || prediction.bttsNoPct || Math.round((prediction.btts_no_pred || 0) * 100);

    // Extract quality metrics
    const qualityRating = prediction.quality_rating;
    const predictionQuality = prediction.prediction_quality;
    const matchResultConfidence = prediction.match_result_confidence;
    const overUnderConfidence = prediction.over_under_confidence;
    const bttsConfidence = prediction.btts_confidence;
    const matchResultCertainty = prediction.match_result_certainty;
    const overUnderCertainty = prediction.over_under_certainty;
    const bttsCertainty = prediction.btts_certainty;

    // Calculate confidence percentage
    const confidencePct = prediction.confidence_pct || prediction.confidencePct || Math.round(confidence * 100);

    // Create the formatted prediction object
    return {
      id: prediction.id || `pred_${Math.random().toString(36).substring(2, 9)}`,
      game: {
        id: prediction.fixture_id || prediction.game_id || prediction.matchId || `game_${Math.random().toString(36).substring(2, 9)}`,
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
        league: league,
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
      confidencePct: confidencePct,
      gameCode: prediction.game_code || prediction.gameCode || '',
      punterId: prediction.punter_id || prediction.punterId || 'ai-system',
      bookmaker: prediction.bookmaker || 'bet365',
      rolloverDay: prediction.rollover ? 1 : (prediction.rolloverDay || null),
      value: prediction.value || null,

      // Add prediction percentages
      homeWinPct: homeWinPct,
      drawPct: drawPct,
      awayWinPct: awayWinPct,
      over25Pct: over25Pct,
      under25Pct: under25Pct,
      bttsYesPct: bttsYesPct,
      bttsNoPct: bttsNoPct,

      // Add quality metrics
      quality_rating: qualityRating,
      prediction_quality: predictionQuality,
      match_result_confidence: matchResultConfidence,
      over_under_confidence: overUnderConfidence,
      btts_confidence: bttsConfidence,
      match_result_certainty: matchResultCertainty,
      over_under_certainty: overUnderCertainty,
      btts_certainty: bttsCertainty,

      // Required fields for Prediction type
      predictions: [],
      combined_odds: prediction.combined_odds || 0,
      combined_confidence: prediction.combined_confidence || 0
    };
  });

  return mappedPredictions;
}

/**
 * Get next set of predictions for a specific category
 * Uses only the /predictions/best/{category} endpoint
 */
export const getNextPredictionsForCategory = async (category: string): Promise<Prediction[]> => {
  // Use a consistent cache key if not forcing refresh
  const cacheKey = FORCE_REFRESH
    ? `next_predictions_${category}_${Date.now()}` // Use timestamp to avoid caching when forcing refresh
    : `next_predictions_${category}`; // Use consistent key otherwise

  // Check cache first
  const cachedData = cache.get<Prediction[]>(cacheKey);
  if (cachedData && !FORCE_REFRESH) {
    console.log(`Cache hit: Next predictions for ${category}`);
    return cachedData;
  }

  // Log force refresh status
  if (FORCE_REFRESH) {
    console.log(`Force refresh enabled for category ${category}, bypassing cache`);
  }

  try {
    // Map category name to API format if needed
    const apiCategory = category.replace('odds', '_odds');

    // Use only the dedicated best predictions endpoint
    console.log(`Fetching best predictions for ${category}...`);
    const bestData = await fetchWithRetry<any>(`/predictions/best/${apiCategory}`);

    // Handle different response formats
    let predictionsData = [];
    if (bestData && Array.isArray(bestData)) {
      predictionsData = bestData;
    } else if (bestData && bestData.predictions) {
      predictionsData = bestData.predictions;
    }

    // Map to frontend format
    const predictions = await mapAPIPredictionsToFrontend(predictionsData);
    console.log(`Got ${predictions.length} best predictions for ${category}`);

    // Cache the result
    cache.set(cacheKey, predictions, CACHE_TTL.SHORT);
    return predictions;
  } catch (error) {
    console.error(`Error fetching next predictions for ${category}:`, error);

    // Return empty array on error
    return [];
  }
};

/**
 * Get best predictions for a specific category
 * Uses only the /predictions/best/{category} endpoint
 */
export const getBestPredictionsByCategory = async (category: string): Promise<Prediction[]> => {
  // Use a consistent cache key
  const cacheKey = FORCE_REFRESH
    ? `best_predictions_${category}_${Date.now()}` // Use timestamp to avoid caching when forcing refresh
    : `best_predictions_${category}`; // Use consistent key otherwise

  // Check cache first
  const cachedData = cache.get<Prediction[]>(cacheKey);
  if (cachedData && !FORCE_REFRESH) {
    console.log(`Cache hit: Best predictions for ${category}`);
    return cachedData;
  }

  try {
    // Map category name to API format if needed
    const apiCategory = category.replace('odds', '_odds');

    // Use only the dedicated best predictions endpoint
    console.log(`Fetching best predictions for ${category} from dedicated endpoint...`);
    const data = await fetchWithRetry<any>(`/predictions/best/${apiCategory}`);

    // Log the raw data for debugging
    console.log(`Raw API response for ${apiCategory}:`, data);

    // Handle different response formats
    let predictionsData = [];
    if (data && Array.isArray(data)) {
      predictionsData = data;
      console.log(`Found array of predictions with ${data.length} items`);
    } else if (data && data.predictions && Array.isArray(data.predictions)) {
      predictionsData = data.predictions;
      console.log(`Found predictions array in data object with ${data.predictions.length} items`);
    } else if (data && typeof data === 'object') {
      console.log(`Data is an object with keys: ${Object.keys(data).join(', ')}`);
      // Try to find any arrays in the response
      for (const key in data) {
        if (Array.isArray(data[key])) {
          console.log(`Found array in key ${key} with ${data[key].length} items`);
          predictionsData = data[key];
          break;
        }
      }
    }

    // If we have predictions with fixture_ids, fetch the fixture details
    if (predictionsData.length > 0 && predictionsData[0].fixture_id) {
      console.log(`Fetching fixture details for ${predictionsData.length} predictions...`);

      // Fetch fixture details for each prediction
      const fixturePromises = predictionsData.map(async (prediction: any) => {
        if (prediction.fixture_id) {
          const fixture = await getFixtureById(prediction.fixture_id);
          if (fixture) {
            // Enhance prediction with fixture details
            return {
              ...prediction,
              homeTeam: fixture.home_team,
              awayTeam: fixture.away_team,
              league: fixture.league_name,
              matchDate: fixture.date
            };
          }
        }
        return prediction;
      });

      // Wait for all fixture details to be fetched
      predictionsData = await Promise.all(fixturePromises);
      console.log(`Enhanced ${predictionsData.length} predictions with fixture details`);
    }

    // Map to frontend format
    const predictions = await mapAPIPredictionsToFrontend(predictionsData);
    console.log(`Got ${predictions.length} best predictions for ${category}`);

    // Cache the result
    cache.set(cacheKey, predictions, CACHE_TTL.SHORT);
    return predictions;
  } catch (error) {
    console.error(`Error fetching best predictions for ${category}:`, error);
    return [];
  }
};

/**
 * Get all best predictions for all categories
 * Uses only the /predictions/best endpoint
 */
export const getAllBestPredictions = async (): Promise<Record<string, Prediction[]>> => {
  // Use a consistent cache key
  const cacheKey = FORCE_REFRESH
    ? `all_best_predictions_${Date.now()}` // Use timestamp to avoid caching when forcing refresh
    : 'all_best_predictions'; // Use consistent key otherwise

  // Check cache first
  const cachedData = cache.get<Record<string, Prediction[]>>(cacheKey);
  if (cachedData && !FORCE_REFRESH) {
    console.log('Cache hit: All best predictions');
    return cachedData;
  }

  try {
    // Create result object
    const result: Record<string, Prediction[]> = {};

    // Use only the dedicated best predictions endpoint
    console.log('Fetching all best predictions...');
    const data = await fetchWithRetry<any>(`/predictions/best`);

    if (data) {
      // Log the raw data structure for debugging
      console.log('Raw API response structure:', Object.keys(data));

      // Process each category
      for (const [category, predictions] of Object.entries(data)) {
        // Map the category name to frontend format
        const frontendCategory = category.replace('_odds', 'odds');

        console.log(`Processing category ${category} with ${Array.isArray(predictions) ? predictions.length : 'non-array'} predictions`);

        // Process predictions for this category
        if (Array.isArray(predictions)) {
          // If we have predictions with fixture_ids, fetch the fixture details
          if (predictions.length > 0 && predictions[0].fixture_id) {
            console.log(`Fetching fixture details for ${predictions.length} predictions in ${category}...`);

            // Fetch fixture details for each prediction
            const fixturePromises = predictions.map(async (prediction: any) => {
              if (prediction.fixture_id) {
                const fixture = await getFixtureById(prediction.fixture_id);
                if (fixture) {
                  // Enhance prediction with fixture details
                  return {
                    ...prediction,
                    homeTeam: fixture.home_team,
                    awayTeam: fixture.away_team,
                    league: fixture.league_name,
                    matchDate: fixture.date
                  };
                }
              }
              return prediction;
            });

            // Wait for all fixture details to be fetched
            const enhancedPredictions = await Promise.all(fixturePromises);
            console.log(`Enhanced ${enhancedPredictions.length} predictions with fixture details for ${category}`);

            // Map the enhanced predictions to frontend format
            result[frontendCategory] = await mapAPIPredictionsToFrontend(enhancedPredictions);
          } else {
            // No fixture_ids, just map the predictions to frontend format
            result[frontendCategory] = await mapAPIPredictionsToFrontend(predictions as any[]);
          }
        } else {
          console.warn(`Predictions for category ${category} is not an array:`, predictions);
          result[frontendCategory] = [];
        }
      }
    } else {
      console.warn('No data returned from /predictions/best endpoint');
    }

    // Cache the result
    cache.set(cacheKey, result, CACHE_TTL.SHORT);
    return result;
  } catch (error) {
    console.error(`Error fetching all best predictions:`, error);
    // Return empty object with categories
    return {
      "2odds": [],
      "5odds": [],
      "10odds": [],
      "rollover": []
    };
  }
};

/**
 * Fetch fixture details by ID
 */
async function getFixtureById(fixtureId: number): Promise<any> {
  // Check cache first
  if (fixtureCache[fixtureId]) {
    console.log(`Cache hit: Fixture ${fixtureId}`);
    return fixtureCache[fixtureId];
  }

  try {
    console.log(`Fetching fixture details for ID ${fixtureId}...`);
    const fixture = await fetchWithRetry<any>(`/fixtures/${fixtureId}`);

    // Cache the result
    fixtureCache[fixtureId] = fixture;

    return fixture;
  } catch (error) {
    console.error(`Error fetching fixture ${fixtureId}:`, error);
    return null;
  }
}

export default {
  checkAPIHealth,
  getDailyPredictions,
  getNextPredictionsForCategory,
  getBestPredictionsByCategory,
  getAllBestPredictions,
  mapAPIPredictionsToFrontend,
  setForceRefresh
};
