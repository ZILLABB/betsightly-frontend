/**
 * Accumulators Service
 * 
 * Optimized service using the single /accumulators/today endpoint
 * Gets all 4 categories in one call - fast and efficient!
 */

import { API_BASE_URL, API_ENDPOINTS, API_CACHE_CONFIG } from '../config/apiConfig';
import type { Prediction } from '../types';

// Cache for API responses
const cache: Record<string, { data: any; timestamp: number }> = {};

// Flag to prevent multiple simultaneous calls
let isCurrentlyFetching = false;

/**
 * Check if cached data is still valid
 */
function isCacheValid(key: string, ttl: number = API_CACHE_CONFIG.PREDICTIONS_TTL): boolean {
  const cached = cache[key];
  if (!cached) return false;
  return (Date.now() - cached.timestamp) < ttl;
}

/**
 * Fetch from accumulators endpoint with caching and duplicate call prevention
 */
async function fetchAccumulators(): Promise<any> {
  const url = `${API_BASE_URL}${API_ENDPOINTS.ACCUMULATORS.TODAY}`;
  const cacheKey = 'accumulators_today';

  // Check cache first
  if (isCacheValid(cacheKey)) {
    return cache[cacheKey].data;
  }

  // Prevent multiple simultaneous calls
  if (isCurrentlyFetching) {
    while (isCurrentlyFetching) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    // Check cache again after waiting
    if (isCacheValid(cacheKey)) {
      return cache[cacheKey].data;
    }
  }

  try {
    isCurrentlyFetching = true;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    cache[cacheKey] = {
      data,
      timestamp: Date.now(),
    };

    return data;
  } catch (error) {
    console.error('Error fetching accumulators:', error);
    throw error;
  } finally {
    isCurrentlyFetching = false;
  }
}

/**
 * Transform accumulators data to frontend format
 */
function transformAccumulatorsData(backendData: any): Record<string, Prediction[]> {
  const categorized: Record<string, Prediction[]> = {
    '2_odds': [],
    '5_odds': [],
    '10_odds': [],
    'rollover': []
  };

  if (backendData && backendData.accumulators) {
    const accumulators = backendData.accumulators;

    Object.entries(accumulators).forEach(([categoryKey, categoryData]: [string, any]) => {
      if (categoryData && categoryData.selected && categoryData.games && Array.isArray(categoryData.games)) {
        categoryData.games.forEach((game: any, index: number) => {
          const transformedPrediction: Prediction = {
            id: `${categoryKey}_${game.fixture_id}_${Date.now()}_${index}`,
            game: {
              id: game.fixture_id?.toString() || `game_${index}`,
              homeTeam: game.home_team || 'Home Team',
              awayTeam: game.away_team || 'Away Team',
              league: game.league || 'European Competition',
              sport: 'soccer',
              startTime: game.date || new Date().toISOString(),
            },
            predictionType: game.readable_prediction || game.prediction_type?.replace(/_/g, ' ').toUpperCase() || 'Match Result',
            odds: game.estimated_odds || categoryData.total_odds || 1.5,
            status: 'pending',
            confidence: game.confidence || 0.75,
            createdAt: new Date().toISOString(),
            category: categoryKey,
            gameCode: `${categoryKey}_${game.fixture_id}`,
            explanation: `${game.model_type?.toUpperCase() || 'ML'} model: ${game.readable_prediction || game.prediction_value} with ${(game.confidence * 100).toFixed(1)}% confidence. ${categoryData.risk_level} risk accumulator (${categoryData.total_odds}x odds).`,
            predictions: [],
            combined_odds: categoryData.total_odds || game.estimated_odds || 1.5,
            combined_confidence: game.confidence || 0.75
          };

          if (categorized[categoryKey]) {
            categorized[categoryKey].push(transformedPrediction);
          }
        });

      } else if (categoryData && !categoryData.selected) {
        const placeholderPrediction: Prediction = {
          id: `${categoryKey}_placeholder_${Date.now()}`,
          game: {
            id: 'placeholder',
            homeTeam: 'No Accumulator Available',
            awayTeam: '',
            league: categoryData.reason || 'No combination found',
            sport: 'soccer',
            startTime: new Date().toISOString(),
          },
          predictionType: 'NO DATA',
          odds: 0,
          status: 'unavailable',
          confidence: 0,
          createdAt: new Date().toISOString(),
          category: categoryKey,
          gameCode: `${categoryKey}_placeholder`,
          explanation: categoryData.reason || 'No accumulator combination found for this odds range',
          predictions: [],
          combined_odds: 0,
          combined_confidence: 0
        };

        if (categorized[categoryKey]) {
          categorized[categoryKey].push(placeholderPrediction);
        }
      }
    });
  }

  return categorized;
}

/**
 * Get today's accumulators - ALL CATEGORIES IN ONE CALL! 🚀
 */
export async function getTodaysAccumulators(): Promise<Record<string, Prediction[]>> {
  try {
    const data = await fetchAccumulators();

    if (data.status === 'success' && data.accumulators) {
      const transformed = transformAccumulatorsData(data);
      const totalPredictions = Object.values(transformed).reduce((sum, preds) => sum + preds.length, 0);
      if (totalPredictions > 0) return transformed;
    }

    return { '2_odds': [], '5_odds': [], '10_odds': [], 'rollover': [] };
  } catch (error) {
    console.error('Error fetching accumulators:', error);
    throw error;
  }
}

/**
 * Get accumulator summary (odds and counts for each category)
 */
export async function getAccumulatorSummary(): Promise<Record<string, { count: number; combinedOdds: number; totalStake?: number }>> {
  try {
    const data = await fetchAccumulators();
    const summary: Record<string, { count: number; combinedOdds: number; totalStake?: number }> = {};
    
    if (data.accumulators) {
      Object.entries(data.accumulators).forEach(([categoryKey, categoryData]: [string, any]) => {
        summary[categoryKey] = {
          count: categoryData.selections?.length || 0,
          combinedOdds: categoryData.combined_odds || 1.0,
          totalStake: categoryData.total_stake || undefined
        };
      });
    }
    
    return summary;
  } catch (error) {
    console.error('❌ Error fetching accumulator summary:', error);
    return {};
  }
}

/**
 * Clear the cache
 */
export function clearAccumulatorsCache(): void {
  Object.keys(cache).forEach(key => delete cache[key]);
}


/**
 * Check if the accumulators endpoint is available
 */
export async function checkAccumulatorsHealth(): Promise<{ healthy: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ACCUMULATORS.TODAY}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return { healthy: true, message: 'Accumulators endpoint is working' };
    } else {
      return { healthy: false, message: `Accumulators endpoint returned ${response.status}` };
    }
  } catch (error) {
    return { healthy: false, message: `Accumulators endpoint not reachable: ${error.message}` };
  }
}

export default {
  getTodaysAccumulators,
  getAccumulatorSummary,
  clearAccumulatorsCache,
  checkAccumulatorsHealth
};
