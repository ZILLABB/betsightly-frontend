import { fetchFromBackend } from "./api";
import cache from "../utils/cacheUtils";
import type {
  Game,
  Prediction,
  RolloverGame,
  SportType,
  StatsOverview,
  PredictionFilters,
  DailyPredictions,
  Punter,
  SportStats
} from "../types";

// API functions to fetch data from the backend

// Cache TTL constants (in seconds)
const CACHE_TTL = {
  SHORT: 60,          // 1 minute
  MEDIUM: 300,        // 5 minutes
  LONG: 3600,         // 1 hour
  VERY_LONG: 86400    // 24 hours
};

/**
 * Get all games
 */
export const getGames = async (): Promise<Game[]> => {
  const cacheKey = 'all_games';
  const cachedData = cache.get<Game[]>(cacheKey);

  if (cachedData) {
    console.log('Cache hit: all games');
    return cachedData;
  }

  try {
    const data = await fetchFromBackend('/games');

    // Cache the result
    cache.set(cacheKey, data, CACHE_TTL.MEDIUM);
    return data;
  } catch (error) {
    console.error('Error fetching games:', error);
    return [];
  }
};

/**
 * Get games by sport
 */
export const getGamesBySport = async (sport: SportType): Promise<Game[]> => {
  const cacheKey = `games_by_sport_${sport}`;
  const cachedData = cache.get<Game[]>(cacheKey);

  if (cachedData) {
    console.log(`Cache hit: games by sport (${sport})`);
    return cachedData;
  }

  try {
    const data = await fetchFromBackend(`/games/sport/${sport}`);

    // Cache the result
    cache.set(cacheKey, data, CACHE_TTL.MEDIUM);
    return data;
  } catch (error) {
    console.error(`Error fetching games by sport (${sport}):`, error);
    return [];
  }
};

/**
 * Get games for today
 */
export const getTodayGames = async (): Promise<Game[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Use date string in cache key to ensure it's refreshed daily
  const dateStr = today.toISOString().split('T')[0];
  const cacheKey = `today_games_${dateStr}`;
  const cachedData = cache.get<Game[]>(cacheKey);

  if (cachedData) {
    console.log('Cache hit: today games');
    return cachedData;
  }

  try {
    const data = await fetchFromBackend('/games/today');

    // Cache the result - shorter TTL since today's games change frequently
    cache.set(cacheKey, data, CACHE_TTL.SHORT);
    return data;
  } catch (error) {
    console.error('Error fetching today\'s games:', error);
    return [];
  }
};

/**
 * Get a specific game by ID
 */
export const getGameById = async (id: string): Promise<Game | undefined> => {
  try {
    const data = await fetchFromBackend(`/games/${id}`);
    return data;
  } catch (error) {
    console.error(`Error fetching game with ID ${id}:`, error);
    return undefined;
  }
};

/**
 * Get all predictions
 */
export const getPredictions = async (): Promise<Prediction[]> => {
  try {
    const data = await fetchFromBackend('/predictions');
    return data;
  } catch (error) {
    console.error('Error fetching predictions:', error);
    return [];
  }
};

/**
 * Get predictions with filters
 */
export const getPredictionsWithFilters = async (
  filters: PredictionFilters
): Promise<Prediction[]> => {
  try {
    // Convert filters to query parameters
    const queryParams = new URLSearchParams();

    if (filters.sport && filters.sport !== "mixed") {
      queryParams.append('sport', filters.sport);
    }

    if (filters.status) {
      queryParams.append('status', filters.status);
    }

    if (filters.dateRange) {
      queryParams.append('start_date', filters.dateRange.start.toISOString());
      queryParams.append('end_date', filters.dateRange.end.toISOString());
    }

    if (filters.odds) {
      queryParams.append('min_odds', filters.odds.min.toString());
      queryParams.append('max_odds', filters.odds.max.toString());
    }

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/predictions/filter?${queryString}` : '/predictions';

    const data = await fetchFromBackend(endpoint);
    return data;
  } catch (error) {
    console.error('Error fetching filtered predictions:', error);
    return [];
  }
};

/**
 * Get predictions for a specific day
 */
export const getPredictionsForDay = async (date: Date): Promise<Prediction[]> => {
  try {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const dateStr = targetDate.toISOString().split('T')[0];
    const data = await fetchFromBackend(`/predictions/date/${dateStr}`);
    return data;
  } catch (error) {
    console.error(`Error fetching predictions for date:`, error);
    return [];
  }
};

/**
 * Get daily predictions for the last N days
 */
export const getDailyPredictions = async (days: number): Promise<DailyPredictions[]> => {
  try {
    const data = await fetchFromBackend(`/predictions/daily/${days}`);
    return data;
  } catch (error) {
    console.error(`Error fetching daily predictions for ${days} days:`, error);

    // Fallback to fetching each day individually if the bulk endpoint fails
    const result: DailyPredictions[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      try {
        const predictions = await getPredictionsForDay(date);
        result.push({
          date,
          predictions,
        });
      } catch (innerError) {
        console.error(`Error fetching predictions for day ${i}:`, innerError);
        result.push({
          date,
          predictions: [],
        });
      }
    }

    return result;
  }
};

/**
 * Get rollover games
 */
export const getRolloverGames = async (): Promise<RolloverGame[]> => {
  try {
    const data = await fetchFromBackend('/rollover-games');
    return data;
  } catch (error) {
    console.error('Error fetching rollover games:', error);
    return [];
  }
};

/**
 * Get active rollover game
 */
export const getActiveRolloverGame = async (): Promise<RolloverGame | undefined> => {
  try {
    const data = await fetchFromBackend('/rollover-games/active');
    return data;
  } catch (error) {
    console.error('Error fetching active rollover game:', error);
    return undefined;
  }
};

/**
 * Get stats overview
 */
export const getStatsOverview = async (): Promise<StatsOverview> => {
  try {
    const data = await fetchFromBackend('/stats/overview');
    return data;
  } catch (error) {
    console.error('Error fetching stats overview:', error);
    return {
      totalPredictions: 0,
      wonPredictions: 0,
      lostPredictions: 0,
      pendingPredictions: 0,
      successRate: 0,
      averageOdds: 0
    };
  }
};

/**
 * Get sport-specific statistics
 */
export const getSportStats = async (): Promise<SportStats[]> => {
  try {
    const data = await fetchFromBackend('/stats/sports');
    return data;
  } catch (error) {
    console.error('Error fetching sport stats:', error);
    return [
      {
        sport: "soccer",
        totalPredictions: 0,
        successRate: 0
      },
      {
        sport: "basketball",
        totalPredictions: 0,
        successRate: 0
      },
      {
        sport: "mixed",
        totalPredictions: 0,
        successRate: 0
      }
    ];
  }
};

/**
 * Get predictions grouped by odds categories
 */
export const getPredictionsByOddsCategory = async (
  filters?: PredictionFilters
): Promise<{ [key: string]: Prediction[] }> => {
  try {
    let endpoint = '/predictions/odds-categories';

    if (filters) {
      // Convert filters to query parameters
      const queryParams = new URLSearchParams();

      if (filters.sport && filters.sport !== "mixed") {
        queryParams.append('sport', filters.sport);
      }

      if (filters.status) {
        queryParams.append('status', filters.status);
      }

      if (filters.dateRange) {
        queryParams.append('start_date', filters.dateRange.start.toISOString());
        queryParams.append('end_date', filters.dateRange.end.toISOString());
      }

      if (filters.odds) {
        queryParams.append('min_odds', filters.odds.min.toString());
        queryParams.append('max_odds', filters.odds.max.toString());
      }

      const queryString = queryParams.toString();
      if (queryString) {
        endpoint += `?${queryString}`;
      }
    }

    const data = await fetchFromBackend(endpoint);
    return data;
  } catch (error) {
    console.error('Error fetching predictions by odds category:', error);

    // Fallback to client-side filtering if the endpoint fails
    try {
      const predictions = filters
        ? await getPredictionsWithFilters(filters)
        : await getPredictions();

      return {
        "2odds": predictions.filter(p => p.odds >= 1.5 && p.odds < 3.5),
        "5odds": predictions.filter(p => p.odds >= 3.5 && p.odds < 7.5),
        "10odds": predictions.filter(p => p.odds >= 7.5)
      };
    } catch (fallbackError) {
      console.error('Fallback filtering also failed:', fallbackError);
      return {
        "2odds": [],
        "5odds": [],
        "10odds": []
      };
    }
  }
};

/**
 * Get all punters
 */
export const getPunters = async (): Promise<Punter[]> => {
  const cacheKey = 'all_punters';
  const cachedData = cache.get<Punter[]>(cacheKey);

  if (cachedData) {
    console.log('Cache hit: all punters');
    return cachedData;
  }

  try {
    const data = await fetchFromBackend('/punters');

    // Cache the result - punters don't change often
    cache.set(cacheKey, data, CACHE_TTL.LONG);
    return data;
  } catch (error) {
    console.error('Error fetching punters:', error);
    return [];
  }
};

/**
 * Get a specific punter by ID
 */
export const getPunterById = async (id: string): Promise<Punter | undefined> => {
  try {
    const data = await fetchFromBackend(`/punters/${id}`);
    return data;
  } catch (error) {
    console.error(`Error fetching punter with ID ${id}:`, error);
    return undefined;
  }
};

/**
 * Get predictions by punter ID
 */
export const getPredictionsByPunter = async (punterId: string): Promise<Prediction[]> => {
  try {
    const data = await fetchFromBackend(`/predictions/punter/${punterId}`);
    return data;
  } catch (error) {
    console.error(`Error fetching predictions for punter ${punterId}:`, error);
    return [];
  }
};

/**
 * Get daily predictions by punter ID
 */
export const getDailyPredictionsByPunter = async (punterId: string, days: number): Promise<DailyPredictions[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateStr = today.toISOString().split('T')[0];

  const cacheKey = `daily_predictions_${punterId}_${days}_${dateStr}`;
  const cachedData = cache.get<DailyPredictions[]>(cacheKey);

  if (cachedData) {
    console.log(`Cache hit: daily predictions for punter ${punterId}`);
    return cachedData;
  }

  try {
    const data = await fetchFromBackend(`/predictions/punter/${punterId}/daily/${days}`);

    // Cache the result - medium TTL since predictions can change
    cache.set(cacheKey, data, CACHE_TTL.MEDIUM);
    return data;
  } catch (error) {
    console.error(`Error fetching daily predictions for punter ${punterId}:`, error);

    // Fallback to fetching each day individually if the bulk endpoint fails
    const result: DailyPredictions[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      try {
        const allPredictions = await getPredictionsForDay(date);
        const punterPredictions = allPredictions.filter(prediction => prediction.punterId === punterId);

        result.push({
          date,
          predictions: punterPredictions,
        });
      } catch (innerError) {
        console.error(`Error fetching predictions for day ${i} for punter ${punterId}:`, innerError);
        result.push({
          date,
          predictions: [],
        });
      }
    }

    // Cache the fallback result
    cache.set(cacheKey, result, CACHE_TTL.MEDIUM);
    return result;
  }
};
