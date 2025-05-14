import { captureException, addBreadcrumb, errorHandler } from '../utils/errorTracking';
import cache from '../utils/cacheUtils';
import type {
  Game,
  Prediction,
  RolloverGame,
  StatsOverview,
  SportStats,
  PredictionFilters,
  Punter,
  DailyPredictions,
  SportType,
  PredictionStatus
} from '../types';

// Import data services
import * as apiService from './enhancedApiService';
import * as extendedSportsService from './extendedSportsService';

// Import API base URL from enhancedApiService
const API_BASE_URL = apiService.API_BASE_URL || 'http://localhost:8000/api';

// API availability state
let isApiAvailable = true;

/**
 * Check if the API is available
 * @returns Promise<boolean> indicating if the API is available
 */
export const checkApiAvailability = async (): Promise<boolean> => {
  try {
    const health = await apiService.checkAPIHealth();
    isApiAvailable = health.isLive;
    return isApiAvailable;
  } catch (error) {
    console.error('API health check failed:', error);
    isApiAvailable = false;
    return false;
  }
};

/**
 * Get all games with fallback to mock data
 */
export const getGames = async (): Promise<Game[]> => {
  try {
    const cacheKey = 'unified_all_games';
    const cachedData = cache.get<Game[]>(cacheKey);

    if (cachedData) {
      console.log('Cache hit: unified all games');
      return cachedData;
    }

    try {
      // Try to get data from API if it's available
      if (isApiAvailable) {
        // TODO: Implement API call when endpoint is available
        throw new Error('API endpoint not implemented yet');
      } else {
        throw new Error('API is not available');
      }
    } catch (error) {
      console.error('Error fetching games from API:', error);
      addBreadcrumb('data', 'Failed to fetch games data', { error: (error as Error).message });
      throw error;
    }
  } catch (error) {
    // Handle any errors in the outer function
    const errorMessage = errorHandler(error, 'getGames');
    console.error(`Failed to get games: ${errorMessage}`);

    // Return empty array as fallback
    return [];
  }
};

/**
 * Get games by sport with fallback to mock data
 */
export const getGamesBySport = async (sport: SportType): Promise<Game[]> => {
  try {
    const cacheKey = `unified_games_by_sport_${sport}`;
    const cachedData = cache.get<Game[]>(cacheKey);

    if (cachedData) {
      console.log(`Cache hit: unified games by sport (${sport})`);
      return cachedData;
    }

    try {
      // First try to get data from API if it's available
      if (isApiAvailable) {
        if (sport === 'soccer') {
          // Get football matches from football-data-uk
          const footballMatches = await extendedSportsService.getFootballMatches();

          // Cache the result
          cache.set(cacheKey, footballMatches, 300); // 5 minutes
          return footballMatches;
        } else if (sport === 'basketball') {
          // Get basketball games from balldontlie
          const basketballGames = await extendedSportsService.getBasketballGames();

          // Cache the result
          cache.set(cacheKey, basketballGames, 300); // 5 minutes
          return basketballGames;
        } else if (sport === 'mixed') {
          // Get both football and basketball games
          const [footballMatches, basketballGames] = await Promise.all([
            extendedSportsService.getFootballMatches(),
            extendedSportsService.getBasketballGames()
          ]);

          const mixedGames = [...footballMatches, ...basketballGames];

          // Cache the result
          cache.set(cacheKey, mixedGames, 300); // 5 minutes
          return mixedGames;
        }
      }
    } catch (error) {
      console.error(`Error fetching games by sport (${sport}) from API:`, error);
      addBreadcrumb('data', `Failed to fetch games by sport (${sport}) data`, { error: (error as Error).message });
      throw error;
    }
  } catch (error) {
    // Handle any errors in the outer function
    const errorMessage = errorHandler(error, 'getGamesBySport');
    console.error(`Failed to get games by sport (${sport}): ${errorMessage}`);

    // Return empty array as fallback
    return [];
  }
};

/**
 * Get predictions for a specific day with fallback to mock data
 */
export const getPredictionsForDay = async (date: Date): Promise<Prediction[]> => {
  try {
    // Ensure date is a valid Date object
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('Invalid date provided to getPredictionsForDay');
    }

    const dateStr = date.toISOString().split('T')[0];
    const cacheKey = `unified_predictions_for_day_${dateStr}`;
    const cachedData = cache.get<Prediction[]>(cacheKey);

    if (cachedData) {
      console.log(`Cache hit: unified predictions for day (${dateStr})`);
      return cachedData;
    }

    try {
      // First try to get data from API if it's available
      if (isApiAvailable) {
        const apiPredictions = await apiService.getDailyPredictions();

        // Combine all categories
        const allPredictions = [
          ...(apiPredictions["2_odds"] || []),
          ...(apiPredictions["5_odds"] || []),
          ...(apiPredictions["10_odds"] || [])
        ];

        // Cache the result
        cache.set(cacheKey, allPredictions, 300); // 5 minutes
        return allPredictions;
      }
    } catch (error) {
      console.error(`Error fetching predictions for day (${dateStr}) from API:`, error);
      addBreadcrumb('data', `Failed to fetch predictions for day (${dateStr}) data`, { error: (error as Error).message });
      throw error;
    }
  } catch (error) {
    // Handle any errors in the outer function
    const errorMessage = errorHandler(error, 'getPredictionsForDay');
    console.error(`Failed to get predictions: ${errorMessage}`);

    // Return empty array as fallback
    return [];
  }
};

/**
   * Get predictions by odds category with fallback to mock data
   */
export const getPredictionsByOddsCategory = async (
  filters?: PredictionFilters
): Promise<{ [key: string]: Prediction[] }> => {
  try {
    const cacheKey = `unified_predictions_by_odds_category_${JSON.stringify(filters || {})}`;
    const cachedData = cache.get<{ [key: string]: Prediction[] }>(cacheKey);

    if (cachedData) {
      console.log('Cache hit: unified predictions by odds category');
      return cachedData;
    }

    try {
      // First try to get data from API if it's available
      if (isApiAvailable) {
        const apiPredictions = await apiService.getDailyPredictions();

        // Map to frontend format
        const result = {
          "2odds": apiPredictions["2_odds"] || [],
          "5odds": apiPredictions["5_odds"] || [],
          "10odds": apiPredictions["10_odds"] || []
        };

        // Cache the result
        cache.set(cacheKey, result, 300); // 5 minutes
        return result;
      }
    } catch (error) {
      console.error('Error fetching predictions by odds category from API:', error);
      addBreadcrumb('data', 'Failed to fetch predictions by odds category data', { error: (error as Error).message });
      throw error;
    }
  } catch (error) {
    // Handle any errors in the outer function
    const errorMessage = errorHandler(error, 'getPredictionsByOddsCategory');
    console.error(`Failed to get predictions by odds category: ${errorMessage}`);

    // Return empty object as fallback
    return { "2odds": [], "5odds": [], "10odds": [] };
  }
};

/**
 * Get stats overview with fallback to mock data
 */
export const getStatsOverview = async (): Promise<StatsOverview> => {
  try {
    const cacheKey = 'unified_stats_overview';
    const cachedData = cache.get<StatsOverview>(cacheKey);

    if (cachedData) {
      console.log('Cache hit: unified stats overview');
      return cachedData;
    }

    try {
      // First try to get data from API if it's available
      if (isApiAvailable) {
        const response = await fetch(`${API_BASE_URL}/daily-predictions/stats-overview`);
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }
        const data = await response.json();

        // Cache the result
        cache.set(cacheKey, data, 3600); // 1 hour
        return data;
      }
    } catch (error) {
      console.error('Error fetching stats overview from API:', error);
      addBreadcrumb('data', 'Failed to fetch stats overview data', { error: (error as Error).message });
      throw error;
    }
  } catch (error) {
    // Handle any errors in the outer function
    const errorMessage = errorHandler(error, 'getStatsOverview');
    console.error(`Failed to get stats overview: ${errorMessage}`);

    // Return empty stats object as fallback
    return {
      totalPredictions: 0,
      successRate: 0,
      averageOdds: 0,
      sportStats: []
    };
  }
};

// Initialize by checking API availability
checkApiAvailability().then(available => {
  console.log(`API availability: ${available ? 'Available' : 'Not available'}`);
});

/**
 * Get daily predictions for a number of days
 * @param days Number of days to get predictions for
 * @returns Array of DailyPredictions objects
 */
export const getDailyPredictions = async (days: number = 10): Promise<DailyPredictions[]> => {
  try {
    const cacheKey = `unified_daily_predictions_${days}`;
    const cachedData = cache.get<DailyPredictions[]>(cacheKey);

    if (cachedData) {
      console.log(`Cache hit: unified daily predictions (${days} days)`);
      return cachedData;
    }

    try {
      // First try to get data from API if it's available
      if (isApiAvailable) {
        // Get predictions by odds category
        const predictionsByCategory = await getPredictionsByOddsCategory();

        // Create a DailyPredictions object for today
        const today = new Date();
        const allPredictions = [
          ...(predictionsByCategory["2odds"] || []),
          ...(predictionsByCategory["5odds"] || []),
          ...(predictionsByCategory["10odds"] || [])
        ];

        const result: DailyPredictions[] = [{
          date: today,
          predictions: allPredictions
        }];

        // Cache the result
        cache.set(cacheKey, result, 300); // 5 minutes
        return result;
      }
    } catch (error) {
      console.error(`Error fetching daily predictions from API:`, error);
      addBreadcrumb('data', `Failed to fetch daily predictions data`, { error: (error as Error).message });
      throw error;
    }
  } catch (error) {
    // Handle any errors in the outer function
    const errorMessage = errorHandler(error, 'getDailyPredictions');
    console.error(`Failed to get daily predictions: ${errorMessage}`);

    // Return empty array as fallback
    return [];
  }
};

// Implement these functions directly with API calls
export const getGameById = async (id: string): Promise<Game | null> => {
  try {
    if (!isApiAvailable) {
      throw new Error('API is not available');
    }

    const response = await fetch(`${API_BASE_URL}/games/${id}`);
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    const errorMessage = errorHandler(error, 'getGameById');
    console.error(`Failed to get game by ID: ${errorMessage}`);
    throw error;
  }
};

export const getActiveRolloverGame = async (): Promise<RolloverGame | null> => {
  try {
    if (!isApiAvailable) {
      throw new Error('API is not available');
    }

    const response = await fetch(`${API_BASE_URL}/rollover/active`);
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    const errorMessage = errorHandler(error, 'getActiveRolloverGame');
    console.error(`Failed to get active rollover game: ${errorMessage}`);
    throw error;
  }
};
