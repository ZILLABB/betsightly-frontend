import cache from "../utils/cacheUtils";
import type { DailyPredictions, Prediction, Game } from "../types";
import { getApiKey } from "./settingsService";

// API base URL
const API_BASE_URL = "http://localhost:8002/api";

// Log API base URL for debugging
console.log("API Service - Using API base URL:", API_BASE_URL);

// API endpoints
const MULTI_API_BASE = `${API_BASE_URL}/multi-api`;
const FOOTBALL_JSON_API_BASE = `${API_BASE_URL}/football-json`;
const FOOTBALL_JSON_API_V2_BASE = `${API_BASE_URL}/football-json-api`;
const PREDICTIONS_API_BASE = `${API_BASE_URL}/predictions`;

// Cache TTL constants (in seconds)
const CACHE_TTL = {
  SHORT: 60,          // 1 minute
  MEDIUM: 300,        // 5 minutes
  LONG: 3600,         // 1 hour
  VERY_LONG: 86400    // 24 hours
};

/**
 * Generic fetch function with error handling
 */
async function fetchFromAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    // Get API key from settings
    const apiKey = await getApiKey();

    // Prepare headers with API key if available
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    };

    // Add Football-Data.org API key if available
    if (apiKey && endpoint.includes('/football-data')) {
      headers['X-Auth-Token'] = apiKey;
    }

    // Make the request
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API error: ${response.status}`);
    }

    return await response.json() as T;
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Check API health
 */
export const checkAPIHealth = async (): Promise<{ status: string; message: string }> => {
  return fetchFromAPI<{ status: string; message: string }>('/health');
};

/**
 * Get fixtures for a specific date
 */
export const getFixtures = async (date?: string, forceRefresh: boolean = false): Promise<any> => {
  const formattedDate = date || new Date().toISOString().split('T')[0];
  const cacheKey = `fixtures_${formattedDate}`;

  // Check cache first if not forcing refresh
  if (!forceRefresh) {
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log(`Cache hit: Fixtures for ${formattedDate}`);
      return cachedData;
    }
  }

  // Fetch from API
  const endpoint = `/fixtures?date=${formattedDate}${forceRefresh ? '&force_refresh=true' : ''}`;
  const data = await fetchFromAPI<any>(`${MULTI_API_BASE}${endpoint}`);

  // Cache the result
  cache.set(cacheKey, data, CACHE_TTL.MEDIUM);
  return data;
};

/**
 * Get daily predictions grouped by odds category from the new multi-API
 */
export const getMultiAPIPredictions = async (date?: string, forceRefresh: boolean = false): Promise<Record<string, any[]>> => {
  const formattedDate = date || new Date().toISOString().split('T')[0];
  const cacheKey = `multi_api_predictions_${formattedDate}`;

  // Check cache first if not forcing refresh
  if (!forceRefresh) {
    const cachedData = cache.get<Record<string, any[]>>(cacheKey);
    if (cachedData) {
      console.log(`Cache hit: Multi-API predictions for ${formattedDate}`);
      return cachedData;
    }
  }

  // Fetch from API
  const endpoint = `/predictions/daily?date=${formattedDate}${forceRefresh ? '&force_refresh=true' : ''}`;
  const data = await fetchFromAPI<Record<string, any[]>>(`${MULTI_API_BASE}${endpoint}`);

  // Cache the result
  cache.set(cacheKey, data, CACHE_TTL.SHORT);
  return data;
};

/**
 * Get predictions by category from the new multi-API
 */
export const getMultiAPIPredictionsByCategory = async (category: string, date?: string): Promise<any[]> => {
  const formattedDate = date || new Date().toISOString().split('T')[0];
  const cacheKey = `multi_api_predictions_${category}_${formattedDate}`;
  const cachedData = cache.get<any[]>(cacheKey);

  if (cachedData) {
    console.log(`Cache hit: Multi-API predictions for ${category} on ${formattedDate}`);
    return cachedData;
  }

  const endpoint = `/predictions/category/${category}${date ? `?date=${formattedDate}` : ''}`;
  const data = await fetchFromAPI<any[]>(`${MULTI_API_BASE}${endpoint}`);

  // Cache the result
  cache.set(cacheKey, data, CACHE_TTL.SHORT);
  return data;
};

/**
 * Get rollover predictions from the new multi-API
 */
export const getMultiAPIRolloverPredictions = async (days: number = 10): Promise<Record<string, any[]>> => {
  const cacheKey = `multi_api_rollover_predictions_${days}`;
  const cachedData = cache.get<Record<string, any[]>>(cacheKey);

  if (cachedData) {
    console.log(`Cache hit: Multi-API rollover predictions for ${days} days`);
    return cachedData;
  }

  const endpoint = `/predictions/rollover?days=${days}`;
  const data = await fetchFromAPI<Record<string, any[]>>(`${MULTI_API_BASE}${endpoint}`);

  // Cache the result
  cache.set(cacheKey, data, CACHE_TTL.MEDIUM);
  return data;
};

/**
 * Refresh predictions for the current day
 */
export const refreshPredictions = async (date?: string): Promise<any> => {
  const formattedDate = date || new Date().toISOString().split('T')[0];

  try {
    // First try to refresh football.json predictions
    await refreshFootballJsonPredictions(formattedDate);
    console.log("Successfully refreshed football.json predictions");
  } catch (error) {
    console.error("Error refreshing football.json predictions:", error);
  }

  try {
    // Then refresh multi-API predictions
    const endpoint = `/refresh${date ? `?date=${formattedDate}` : ''}`;

    // This is a POST request
    const data = await fetchFromAPI<any>(`${MULTI_API_BASE}${endpoint}`, {
      method: 'POST'
    });

    console.log("Successfully refreshed multi-API predictions");

    // Clear cache for this date
    cache.remove(`multi_api_predictions_${formattedDate}`);
    cache.remove(`fixtures_${formattedDate}`);
    cache.remove(`football_json_predictions_${formattedDate}`);

    return data;
  } catch (error) {
    console.error("Error refreshing multi-API predictions:", error);
    throw error;
  }
};

/**
 * Legacy function: Get daily predictions grouped by odds category
 * This uses the old API endpoint for backward compatibility
 */
export const getDailyPredictions = async (): Promise<Record<string, Prediction[]>> => {
  try {
    // Try to use the new multi-API endpoint first
    const multiApiData = await getMultiAPIPredictions();

    // Convert to the expected format
    const convertedData: Record<string, Prediction[]> = {};

    for (const [category, predictions] of Object.entries(multiApiData)) {
      convertedData[category] = mapAPIPredictionsToFrontend(predictions);
    }

    return convertedData;
  } catch (error) {
    console.error("Error using multi-API, falling back to old API:", error);

    // Fall back to the old API
    const cacheKey = 'api_daily_predictions';
    const cachedData = cache.get<Record<string, Prediction[]>>(cacheKey);

    if (cachedData) {
      console.log('Cache hit: API daily predictions');
      return cachedData;
    }

    const data = await fetchFromAPI<Record<string, Prediction[]>>('/predictions/daily');

    // Cache the result
    cache.set(cacheKey, data, CACHE_TTL.SHORT);
    return data;
  }
};

/**
 * Legacy function: Get predictions by category
 * This uses the old API endpoint for backward compatibility
 */
export const getPredictionsByCategory = async (category: string): Promise<Prediction[]> => {
  try {
    // Try to use the new multi-API endpoint first
    const multiApiData = await getMultiAPIPredictionsByCategory(category);

    // Convert to the expected format
    return mapAPIPredictionsToFrontend(multiApiData);
  } catch (error) {
    console.error(`Error using multi-API for category ${category}, falling back to old API:`, error);

    // Fall back to the old API
    const cacheKey = `api_predictions_${category}`;
    const cachedData = cache.get<Prediction[]>(cacheKey);

    if (cachedData) {
      console.log(`Cache hit: API predictions for ${category}`);
      return cachedData;
    }

    const data = await fetchFromAPI<Prediction[]>(`/predictions/category/${category}`);

    // Cache the result
    cache.set(cacheKey, data, CACHE_TTL.SHORT);
    return data;
  }
};

/**
 * Map API predictions to frontend format
 * This function helps convert the backend prediction format to match your frontend types
 */
export const mapAPIPredictionsToFrontend = (predictions: any[]): Prediction[] => {
  if (!predictions || !Array.isArray(predictions)) {
    console.warn("Invalid predictions data:", predictions);
    return [];
  }

  return predictions.map(prediction => {
    // Handle different API response formats
    const homeTeam = prediction.homeTeam ||
      (prediction.game && prediction.game.homeTeam) ||
      "Unknown";

    const awayTeam = prediction.awayTeam ||
      (prediction.game && prediction.game.awayTeam) ||
      "Unknown";

    const league = prediction.league ||
      (prediction.game && prediction.game.league) ||
      "Unknown League";

    const matchDate = prediction.matchDate ||
      (prediction.game && prediction.game.startTime) ||
      new Date().toISOString();

    // Create a proper Game object
    const game: Game = {
      id: `game-${prediction.id}`,
      homeTeam: typeof homeTeam === 'string' ? { id: `team-home-${prediction.id}`, name: homeTeam, logo: '' } : homeTeam,
      awayTeam: typeof awayTeam === 'string' ? { id: `team-away-${prediction.id}`, name: awayTeam, logo: '' } : awayTeam,
      league: league,
      sport: getSportFromLeague(league),
      startTime: new Date(matchDate),
      score: { home: 0, away: 0 },
      status: "scheduled"
    };

    return {
      id: prediction.id,
      game: game,
      predictionType: prediction.predictionType || prediction.type || "unknown",
      prediction: prediction.prediction || "unknown",
      odds: prediction.odds || 1.0,
      confidence: prediction.confidence || 0,
      uncertainty: prediction.uncertainty || null, // Include uncertainty if available
      status: prediction.status || "pending",
      createdAt: new Date(),
      punterId: "ai-system", // Since these are AI-generated predictions
      explanation: prediction.explanation || null, // Include explanation if available
      rolloverDay: prediction.rolloverDay || null, // Include rollover day if available
      gameCode: generateGameCode(prediction) // Generate a game code
    };
  });
};

/**
 * Generate a game code for a prediction
 */
function generateGameCode(prediction: any): string {
  // Format: LEAGUE-HOMETEAM-AWAYTEAM-PREDICTIONTYPE-ODDS
  const league = (prediction.league || "UNK").substring(0, 3).toUpperCase();
  const homeTeam = (prediction.homeTeam || "UNK").substring(0, 3).toUpperCase();
  const awayTeam = (prediction.awayTeam || "UNK").substring(0, 3).toUpperCase();
  const predType = (prediction.predictionType || "UNK").substring(0, 3).toUpperCase();
  const odds = prediction.odds ? prediction.odds.toFixed(2) : "0.00";

  return `${league}-${homeTeam}-${awayTeam}-${predType}-${odds}`;
};

/**
 * Helper function to determine sport from league
 */
function getSportFromLeague(league: string): "soccer" | "basketball" | "mixed" {
  const soccerLeagues = ["Premier League", "La Liga", "Bundesliga", "Serie A", "Ligue 1"];
  const basketballLeagues = ["NBA", "EuroLeague", "ACB"];

  if (soccerLeagues.includes(league)) return "soccer";
  if (basketballLeagues.includes(league)) return "basketball";
  return "mixed";
}

/**
 * Get predictions for a specific day in the frontend format
 */
export const getPredictionsForDay = async (date?: Date): Promise<Prediction[]> => {
  try {
    // Format date if provided
    const formattedDate = date ? date.toISOString().split('T')[0] : undefined;

    // Try to use the advanced predictions API endpoint first
    try {
      const advancedData = await getAdvancedPredictions(formattedDate);

      // Combine all categories
      const allPredictions = [
        ...(advancedData.categories?.["2_odds"] || []),
        ...(advancedData.categories?.["5_odds"] || []),
        ...(advancedData.categories?.["10_odds"] || [])
      ];

      // Convert to frontend format
      return mapAPIPredictionsToFrontend(allPredictions);
    } catch (error) {
      console.error("Error using advanced predictions API, falling back to football.json API:", error);

      // Fall back to the football.json API endpoint
      try {
        const footballJsonData = await getFootballJsonPredictions(formattedDate);

        // Combine all categories
        const allPredictions = [
          ...(footballJsonData["2_odds"] || []),
          ...(footballJsonData["5_odds"] || []),
          ...(footballJsonData["10_odds"] || [])
        ];

        // Convert to frontend format
        return mapAPIPredictionsToFrontend(allPredictions);
      } catch (footballJsonError) {
        console.error("Error using football.json API for daily predictions, falling back to multi-API:", footballJsonError);

        // Fall back to the multi-API endpoint
        try {
          const multiApiData = await getMultiAPIPredictions(formattedDate);

          // Combine all categories
          const allPredictions = [
            ...(multiApiData["2_odds"] || []),
            ...(multiApiData["5_odds"] || []),
            ...(multiApiData["10_odds"] || [])
          ];

          // Convert to frontend format
          return mapAPIPredictionsToFrontend(allPredictions);
        } catch (multiApiError) {
          console.error("Error using multi-API for daily predictions, falling back to old API:", multiApiError);

          // Fall back to the old API
          const apiPredictions = await getDailyPredictions();

          // Combine all categories
          const allPredictions = [
            ...(apiPredictions["2_odds"] || []),
            ...(apiPredictions["5_odds"] || []),
            ...(apiPredictions["10_odds"] || [])
          ];

          // Convert to frontend format
          return mapAPIPredictionsToFrontend(allPredictions);
        }
      }
    }
  } catch (error) {
    console.error("Error fetching predictions for day:", error);
    throw error;
  }
};

/**
 * Get predictions by odds categories in the frontend format
 */
export const getPredictionsByOddsCategory = async (date?: Date): Promise<{ [key: string]: Prediction[] }> => {
  try {
    // Format date if provided
    const formattedDate = date ? date.toISOString().split('T')[0] : undefined;

    // Try to use the advanced predictions API endpoint first
    try {
      const advancedData = await getAdvancedPredictions(formattedDate);

      return {
        "2odds": mapAPIPredictionsToFrontend(advancedData.categories?.["2_odds"] || []),
        "5odds": mapAPIPredictionsToFrontend(advancedData.categories?.["5_odds"] || []),
        "10odds": mapAPIPredictionsToFrontend(advancedData.categories?.["10_odds"] || [])
      };
    } catch (error) {
      console.error("Error using advanced predictions API, falling back to football.json API:", error);

      // Fall back to the football.json API endpoint
      try {
        const footballJsonData = await getFootballJsonPredictions(formattedDate);

        return {
          "2odds": mapAPIPredictionsToFrontend(footballJsonData["2_odds"] || []),
          "5odds": mapAPIPredictionsToFrontend(footballJsonData["5_odds"] || []),
          "10odds": mapAPIPredictionsToFrontend(footballJsonData["10_odds"] || [])
        };
      } catch (footballJsonError) {
        console.error("Error using football.json API for odds categories, falling back to multi-API:", footballJsonError);

        // Fall back to the multi-API endpoint
        try {
          const multiApiData = await getMultiAPIPredictions(formattedDate);

          return {
            "2odds": mapAPIPredictionsToFrontend(multiApiData["2_odds"] || []),
            "5odds": mapAPIPredictionsToFrontend(multiApiData["5_odds"] || []),
            "10odds": mapAPIPredictionsToFrontend(multiApiData["10_odds"] || [])
          };
        } catch (multiApiError) {
          console.error("Error using multi-API for odds categories, falling back to old API:", multiApiError);

          // Fall back to the old API
          const apiPredictions = await getDailyPredictions();

          return {
            "2odds": mapAPIPredictionsToFrontend(apiPredictions["2_odds"] || []),
            "5odds": mapAPIPredictionsToFrontend(apiPredictions["5_odds"] || []),
            "10odds": mapAPIPredictionsToFrontend(apiPredictions["10_odds"] || [])
          };
        }
      }
    }
  } catch (error) {
    console.error("Error fetching predictions by odds category:", error);
    throw error;
  }
};

/**
 * Get rollover predictions in the frontend format
 */
export const getRolloverPredictions = async (days: number = 10): Promise<{ [key: number]: Prediction[] }> => {
  try {
    const rolloverData = await getMultiAPIRolloverPredictions(days);

    // Convert to frontend format
    const result: { [key: number]: Prediction[] } = {};

    for (const [day, predictions] of Object.entries(rolloverData)) {
      const dayNumber = parseInt(day, 10);
      result[dayNumber] = mapAPIPredictionsToFrontend(predictions).map(pred => ({
        ...pred,
        rolloverDay: dayNumber
      }));
    }

    return result;
  } catch (error) {
    console.error("Error fetching rollover predictions:", error);
    throw error;
  }
};

/**
 * Get advanced predictions using the more sophisticated ML models
 */
export const getAdvancedPredictions = async (date?: string, forceRefresh: boolean = false): Promise<Record<string, any[]>> => {
  const formattedDate = date || new Date().toISOString().split('T')[0];
  const cacheKey = `advanced_predictions_${formattedDate}`;

  // Check cache first if not forcing refresh
  if (!forceRefresh) {
    const cachedData = cache.get<Record<string, any[]>>(cacheKey);
    if (cachedData) {
      console.log(`Cache hit: Advanced predictions for ${formattedDate}`);
      return cachedData;
    }
  }

  // Fetch from API
  const endpoint = `/advanced?date=${formattedDate}${forceRefresh ? '&force_update=true' : ''}`;
  const data = await fetchFromAPI<Record<string, any[]>>(`${PREDICTIONS_API_BASE}${endpoint}`);

  // Cache the result
  cache.set(cacheKey, data, CACHE_TTL.SHORT);
  return data;
};

/**
 * Get advanced predictions by category
 */
export const getAdvancedPredictionsByCategory = async (category: string, date?: string): Promise<any[]> => {
  const formattedDate = date || new Date().toISOString().split('T')[0];
  const cacheKey = `advanced_predictions_${category}_${formattedDate}`;
  const cachedData = cache.get<any[]>(cacheKey);

  if (cachedData) {
    console.log(`Cache hit: Advanced predictions for ${category} on ${formattedDate}`);
    return cachedData;
  }

  const endpoint = `/advanced/best/${category}${date ? `?date=${formattedDate}` : ''}`;
  const data = await fetchFromAPI<any[]>(`${PREDICTIONS_API_BASE}${endpoint}`);

  // Cache the result
  cache.set(cacheKey, data, CACHE_TTL.SHORT);
  return data;
};

/**
 * Get football.json predictions grouped by odds category
 */
export const getFootballJsonPredictions = async (date?: string, forceRefresh: boolean = false): Promise<Record<string, any[]>> => {
  const formattedDate = date || new Date().toISOString().split('T')[0];
  const cacheKey = `football_json_predictions_${formattedDate}`;

  // Check cache first if not forcing refresh
  if (!forceRefresh) {
    const cachedData = cache.get<Record<string, any[]>>(cacheKey);
    if (cachedData) {
      console.log(`Cache hit: Football JSON predictions for ${formattedDate}`);
      return cachedData;
    }
  }

  try {
    // Get API key from settings
    const apiKey = await getApiKey();

    // Prepare headers with API key if available
    const headers: HeadersInit = {};
    if (apiKey) {
      headers['X-Auth-Token'] = apiKey;
    }

    // Try the new V2 API first
    console.log(`Fetching football.json predictions from V2 API for ${formattedDate}`);
    const endpoint = `/predictions/daily?date=${formattedDate}${forceRefresh ? '&force_refresh=true' : ''}`;
    const data = await fetchFromAPI<Record<string, any[]>>(
      `${FOOTBALL_JSON_API_V2_BASE}${endpoint}`,
      { headers }
    );

    // Cache the result
    cache.set(cacheKey, data, CACHE_TTL.SHORT);
    return data;
  } catch (error) {
    console.error(`Error fetching from V2 API: ${error}`);

    try {
      // Fall back to the original API
      console.log(`Falling back to original API for ${formattedDate}`);
      const endpoint = `/predictions/daily?date=${formattedDate}${forceRefresh ? '&force_refresh=true' : ''}`;
      const data = await fetchFromAPI<Record<string, any[]>>(
        `${FOOTBALL_JSON_API_BASE}${endpoint}`,
        { headers }
      );

      // Cache the result
      cache.set(cacheKey, data, CACHE_TTL.SHORT);
      return data;
    } catch (fallbackError) {
      console.error(`Error fetching from original API: ${fallbackError}`);
      throw fallbackError;
    }
  }
};

/**
 * Get football.json predictions by category
 */
export const getFootballJsonPredictionsByCategory = async (category: string, date?: string): Promise<any[]> => {
  const formattedDate = date || new Date().toISOString().split('T')[0];
  const cacheKey = `football_json_predictions_${category}_${formattedDate}`;
  const cachedData = cache.get<any[]>(cacheKey);

  if (cachedData) {
    console.log(`Cache hit: Football JSON predictions for ${category} on ${formattedDate}`);
    return cachedData;
  }

  try {
    // Try the new V2 API first
    console.log(`Fetching football.json predictions for ${category} from V2 API`);
    const endpoint = `/predictions/category/${category}${date ? `?date=${formattedDate}` : ''}`;
    const data = await fetchFromAPI<any[]>(`${FOOTBALL_JSON_API_V2_BASE}${endpoint}`);

    // Cache the result
    cache.set(cacheKey, data, CACHE_TTL.SHORT);
    return data;
  } catch (error) {
    console.error(`Error fetching from V2 API: ${error}`);

    try {
      // Fall back to the original API
      console.log(`Falling back to original API for ${category}`);
      const endpoint = `/predictions/category/${category}${date ? `?date=${formattedDate}` : ''}`;
      const data = await fetchFromAPI<any[]>(`${FOOTBALL_JSON_API_BASE}${endpoint}`);

      // Cache the result
      cache.set(cacheKey, data, CACHE_TTL.SHORT);
      return data;
    } catch (fallbackError) {
      console.error(`Error fetching from original API: ${fallbackError}`);
      throw fallbackError;
    }
  }
};

/**
 * Refresh football.json predictions
 */
export const refreshFootballJsonPredictions = async (date?: string): Promise<any> => {
  const formattedDate = date || new Date().toISOString().split('T')[0];
  const endpoint = `/predictions/refresh?date=${formattedDate}`;

  try {
    // Get API key from settings
    const apiKey = await getApiKey();

    // Prepare headers with API key if available
    const headers: HeadersInit = {};
    if (apiKey) {
      headers['X-Auth-Token'] = apiKey;
    }

    // Try the new V2 API first
    console.log(`Refreshing football.json predictions from V2 API for ${formattedDate}`);
    const data = await fetchFromAPI<any>(
      `${FOOTBALL_JSON_API_V2_BASE}${endpoint}`,
      { headers }
    );

    // Clear cache for this date
    cache.remove(`football_json_predictions_${formattedDate}`);

    return data;
  } catch (error) {
    console.error(`Error refreshing from V2 API: ${error}`);

    try {
      // Fall back to the original API
      console.log(`Falling back to original API for refreshing predictions for ${formattedDate}`);
      const data = await fetchFromAPI<any>(
        `${FOOTBALL_JSON_API_BASE}${endpoint}`,
        { headers }
      );

      // Clear cache for this date
      cache.remove(`football_json_predictions_${formattedDate}`);

      return data;
    } catch (fallbackError) {
      console.error(`Error refreshing from original API: ${fallbackError}`);
      throw fallbackError;
    }
  }
};
