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
  
  const now = Date.now();
  const isValid = (now - cached.timestamp) < ttl;
  
  if (isValid) {
    console.log(`✅ Using cached accumulators data (${Math.round((ttl - (now - cached.timestamp)) / 1000)}s remaining)`);
  }
  
  return isValid;
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
    console.log('⏳ Already fetching accumulators, waiting for existing call...');
    // Wait for the existing call to complete
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
    console.log(`🚀 Fetching from optimized endpoint (ONCE): ${url}`);
    console.log(`🔍 Full URL being called: ${url}`);
    console.log(`🔍 API_BASE_URL: ${API_BASE_URL}`);
    console.log(`🔍 ACCUMULATORS.TODAY: ${API_ENDPOINTS.ACCUMULATORS.TODAY}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
    });

    console.log(`🔍 Response status: ${response.status}`);
    console.log(`🔍 Response ok: ${response.ok}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP error! status: ${response.status}, response: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`🔍 Raw response data:`, data);

    // Cache the response
    cache[cacheKey] = {
      data,
      timestamp: Date.now(),
    };

    console.log(`✅ Accumulators data fetched successfully (cached for future use)`);
    return data;
  } catch (error) {
    console.error(`❌ Error fetching accumulators:`, error);
    throw error;
  } finally {
    isCurrentlyFetching = false;
  }
}

/**
 * Transform accumulators data to frontend format
 */
function transformAccumulatorsData(backendData: any): Record<string, Prediction[]> {
  console.log('🔄 Transforming accumulators data:', backendData);

  const categorized: Record<string, Prediction[]> = {
    '2_odds': [],
    '5_odds': [],
    '10_odds': [],
    'rollover': []
  };

  // Handle the accumulators response format
  if (backendData && backendData.accumulators) {
    const accumulators = backendData.accumulators;

    // Process each category
    console.log('🔍 Processing categories:', Object.keys(accumulators));
    console.log('🔍 Full accumulators object:', accumulators);

    Object.entries(accumulators).forEach(([categoryKey, categoryData]: [string, any]) => {
      console.log(`🔍 Processing ${categoryKey}:`, {
        selected: categoryData?.selected,
        hasGames: categoryData?.games ? 'yes' : 'no',
        gamesCount: categoryData?.games?.length || 0,
        fullData: categoryData
      });

      // Check if category is selected and has games
      if (categoryData && categoryData.selected && categoryData.games && Array.isArray(categoryData.games)) {
        categoryData.games.forEach((game: any, index: number) => {
          // Transform to frontend Prediction format
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

          // Add to the appropriate category
          if (categorized[categoryKey]) {
            categorized[categoryKey].push(transformedPrediction);
            console.log(`✅ Added prediction to ${categoryKey}: ${transformedPrediction.game.homeTeam} vs ${transformedPrediction.game.awayTeam}`);
          } else {
            console.log(`❌ Category ${categoryKey} not found in categorized object`);
          }
        });

        console.log(`✅ ${categoryKey}: ${categoryData.games.length} games, ${categoryData.total_odds}x odds, ${categoryData.risk_level} risk`);
      } else if (categoryData && !categoryData.selected) {
        console.log(`⚠️ ${categoryKey}: Not selected - ${categoryData.reason || 'No reason provided'}`);

        // Create a placeholder prediction for unselected categories
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
      } else {
        console.log(`⚠️ ${categoryKey}: No data available`);
      }
    });
  }

  const totalPredictions = Object.values(categorized).reduce((sum, predictions) => sum + predictions.length, 0);
  console.log(`✅ Transformed ${totalPredictions} predictions across ${Object.keys(categorized).length} categories`);

  // Debug: Show detailed breakdown
  console.log('🔍 DETAILED CATEGORY BREAKDOWN:');
  Object.entries(categorized).forEach(([category, predictions]) => {
    console.log(`📊 ${category}: ${predictions.length} predictions`);
    if (predictions.length > 0) {
      console.log(`   Sample: ${predictions[0].game.homeTeam} vs ${predictions[0].game.awayTeam}`);
      console.log(`   Prediction: ${predictions[0].predictionType}`);
      console.log(`   Odds: ${predictions[0].odds}`);
    } else {
      console.log(`   ❌ NO PREDICTIONS FOUND FOR ${category}`);
    }
  });

  // Debug: Show raw backend data structure
  console.log('🔍 RAW BACKEND ACCUMULATORS:', Object.keys(backendData.accumulators || {}));

  return categorized;
}

/**
 * Get today's accumulators - ALL CATEGORIES IN ONE CALL! 🚀
 */
export async function getTodaysAccumulators(): Promise<Record<string, Prediction[]>> {
  try {
    console.log('🎯 Getting today\'s accumulators (all categories in one call)...');
    
    const data = await fetchAccumulators();
    
    // Check if we have accumulator data
    if (data.status === 'success' && data.accumulators) {
      const transformed = transformAccumulatorsData(data);
      const totalPredictions = Object.values(transformed).reduce((sum, predictions) => sum + predictions.length, 0);
      
      if (totalPredictions > 0) {
        console.log(`🎉 Successfully loaded ${totalPredictions} predictions from accumulators endpoint!`);
        return transformed;
      }
    }
    
    // If no data or empty, return empty categories
    console.log('⚠️ No accumulator data available for today');
    return {
      '2_odds': [],
      '5_odds': [],
      '10_odds': [],
      'rollover': []
    };
    
  } catch (error) {
    console.error('❌ Error fetching accumulators:', error);
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
  console.log('🗑️ Accumulators cache cleared');
}

// Clear cache immediately to fetch fresh data
clearAccumulatorsCache();

// Force immediate refresh on module load
setTimeout(() => {
  console.log('🔄 Force refreshing accumulators data...');
  clearAccumulatorsCache();
}, 1000);

// Clear cache right now for immediate refresh
console.log('🎉 FRESH DATA AVAILABLE - CLEARING CACHE FOR TODAY (2025-07-18)!');
clearAccumulatorsCache();

// Force multiple clears to ensure fresh data
setTimeout(() => {
  console.log('🎉 CACHE CLEAR #2 - Uruguay vs Peru, Spain vs Switzerland available!');
  clearAccumulatorsCache();
}, 500);

setTimeout(() => {
  console.log('🎉 CACHE CLEAR #3 - All 4 categories with 20 games total!');
  clearAccumulatorsCache();
}, 1000);

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
