/**
 * ML Predictions Service
 * 
 * Service for fetching ML predictions and fixtures from the backend API
 */

import { API_BASE_URL, API_ENDPOINTS, API_CACHE_CONFIG } from '../config/apiConfig';
import type { Prediction } from '../types';

// Cache for API responses
const cache: Record<string, { data: any; timestamp: number }> = {};

/**
 * Check if cached data is still valid
 */
function isCacheValid(key: string, ttl: number = API_CACHE_CONFIG.PREDICTIONS_TTL): boolean {
  const cached = cache[key];
  if (!cached) return false;

  const now = Date.now();
  const isValid = (now - cached.timestamp) < ttl;

  if (isValid) {
    console.log(`✅ Using cached data for ${key} (${Math.round((ttl - (now - cached.timestamp)) / 1000)}s remaining)`);
  }

  return isValid;
}

/**
 * Generic fetch function with caching
 */
async function fetchWithCache<T>(endpoint: string, ttl?: number): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const cacheKey = url;

  // Check cache first
  if (isCacheValid(cacheKey, ttl)) {
    console.log(`Using cached data for ${endpoint}`);
    return cache[cacheKey].data as T;
  }

  try {
    console.log(`Fetching from ${url}`);
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Cache the response
    cache[cacheKey] = {
      data,
      timestamp: Date.now(),
    };

    console.log(`Successfully fetched data from ${endpoint}`, data);
    return data as T;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Transform backend prediction data to frontend format
 */
function transformPredictionData(backendData: any): Record<string, Prediction[]> {
  console.log('Transforming backend data:', backendData);

  // If the data is already in the expected format, return it
  if (typeof backendData === 'object' && backendData !== null) {

    // Handle categories endpoint format (already categorized)
    if (backendData.categories) {
      const categorized: Record<string, Prediction[]> = {
        '2_odds': [],
        '5_odds': [],
        '10_odds': [],
        'rollover': []
      };

      Object.entries(backendData.categories).forEach(([categoryKey, categoryItems]: [string, any]) => {
        if (Array.isArray(categoryItems)) {
          categoryItems.forEach((item: any) => {
            const fixture = item.fixture || {};
            const prediction = item.prediction || {};

            const transformedPrediction: Prediction = {
              id: `${fixture.fixture_id}_${categoryKey}_${prediction.model_name}`,
              game: {
                id: fixture.fixture_id?.toString() || Math.random().toString(),
                homeTeam: fixture.home_team || 'Home Team',
                awayTeam: fixture.away_team || 'Away Team',
                league: fixture.league || 'Unknown League',
                sport: 'soccer',
                startTime: fixture.date || new Date().toISOString(),
              },
              predictionType: prediction.model_name?.replace(/_/g, ' ').toUpperCase() || 'Match Result',
              odds: item.expected_odds || 1.5,
              status: 'pending',
              confidence: item.confidence || prediction.confidence || 0.75,
              createdAt: new Date().toISOString(),
              category: categoryKey,
              gameCode: `${fixture.fixture_id}_${categoryKey}`,
              explanation: `${prediction.model_type} model prediction with ${(item.confidence * 100).toFixed(1)}% confidence. Risk level: ${item.risk_level}`,
              predictions: [],
              combined_odds: item.expected_odds || 1.5,
              combined_confidence: item.confidence || prediction.confidence || 0.75
            };

            if (categorized[categoryKey]) {
              categorized[categoryKey].push(transformedPrediction);
            }
          });
        }
      });

      return categorized;
    }

    // Handle today endpoint format (with predictions array)
    if (backendData.predictions && Array.isArray(backendData.predictions)) {
      const categorized: Record<string, Prediction[]> = {
        '2_odds': [],
        '5_odds': [],
        '10_odds': [],
        'rollover': []
      };

      backendData.predictions.forEach((predictionItem: any) => {
        const fixtureInfo = predictionItem.fixture_info || {};
        const bettingCategories = predictionItem.betting_categories || {};

        // Extract fixture information
        const homeTeam = fixtureInfo.home_team || 'Home Team';
        const awayTeam = fixtureInfo.away_team || 'Away Team';
        const league = fixtureInfo.league || 'Unknown League';
        const fixtureId = fixtureInfo.fixture_id || Math.random().toString();
        const startTime = fixtureInfo.date || new Date().toISOString();

        // Create predictions for each betting category
        Object.entries(bettingCategories).forEach(([categoryKey, categoryData]: [string, any]) => {
          if (categoryData.selected && categoryData.prediction) {
            const prediction = categoryData.prediction;

            const transformedPrediction: Prediction = {
              id: `${fixtureId}_${categoryKey}_${prediction.model_name}`,
              game: {
                id: fixtureId.toString(),
                homeTeam: homeTeam,
                awayTeam: awayTeam,
                league: league,
                sport: 'soccer',
                startTime: startTime,
              },
              predictionType: prediction.model_name?.replace(/_/g, ' ').toUpperCase() || 'Match Result',
              odds: categoryData.expected_odds || 1.5,
              status: 'pending',
              confidence: prediction.confidence || 0.75,
              createdAt: new Date().toISOString(),
              category: categoryKey,
              gameCode: `${fixtureId}_${categoryKey}`,
              explanation: `${prediction.model_type} model prediction with ${(prediction.confidence * 100).toFixed(1)}% confidence. Risk level: ${categoryData.risk_level}`,
              predictions: [],
              combined_odds: categoryData.expected_odds || 1.5,
              combined_confidence: prediction.confidence || 0.75
            };

            if (categorized[categoryKey]) {
              categorized[categoryKey].push(transformedPrediction);
            }
          }
        });
      });

      return categorized;
    }
  }

  // Return empty categories if data format is unexpected
  return {
    '2_odds': [],
    '5_odds': [],
    '10_odds': [],
    'rollover': []
  };
}

/**
 * Get today's ML predictions
 */
export async function getTodaysPredictions(): Promise<Record<string, Prediction[]>> {
  try {
    const data = await fetchWithCache<any>(
      API_ENDPOINTS.ML_PREDICTIONS.TODAY,
      API_CACHE_CONFIG.PREDICTIONS_TTL
    );
    
    return transformPredictionData(data);
  } catch (error) {
    console.error('Error fetching today\'s predictions:', error);
    return {
      '2_odds': [],
      '5_odds': [],
      '10_odds': [],
      'rollover': []
    };
  }
}

/**
 * Get ML predictions by categories
 */
export async function getCategorizedPredictions(): Promise<Record<string, Prediction[]>> {
  try {
    const data = await fetchWithCache<any>(
      API_ENDPOINTS.ML_PREDICTIONS.CATEGORIES,
      API_CACHE_CONFIG.PREDICTIONS_TTL
    );
    
    return transformPredictionData(data);
  } catch (error) {
    console.error('Error fetching categorized predictions:', error);
    return {
      '2_odds': [],
      '5_odds': [],
      '10_odds': [],
      'rollover': []
    };
  }
}

/**
 * Get ML models status
 */
export async function getModelsStatus(): Promise<any> {
  try {
    const data = await fetchWithCache<any>(
      API_ENDPOINTS.ML_PREDICTIONS.MODELS_STATUS,
      API_CACHE_CONFIG.PREDICTIONS_TTL
    );
    
    return data;
  } catch (error) {
    console.error('Error fetching models status:', error);
    return { status: 'unknown', models: [] };
  }
}

/**
 * Get daily fixtures
 */
export async function getDailyFixtures(): Promise<any> {
  try {
    const data = await fetchWithCache<any>(
      API_ENDPOINTS.FIXTURES.DAILY,
      API_CACHE_CONFIG.PREDICTIONS_TTL
    );
    
    return data;
  } catch (error) {
    console.error('Error fetching daily fixtures:', error);
    return { fixtures: [] };
  }
}

/**
 * Get live fixtures
 */
export async function getLiveFixtures(): Promise<any> {
  try {
    const data = await fetchWithCache<any>(
      API_ENDPOINTS.FIXTURES.LIVE,
      API_CACHE_CONFIG.PREDICTIONS_TTL / 4 // Shorter cache for live data
    );
    
    return data;
  } catch (error) {
    console.error('Error fetching live fixtures:', error);
    return { fixtures: [] };
  }
}

/**
 * Check if the backend is running
 */
export async function checkBackendHealth(): Promise<{ healthy: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/health/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return { healthy: true, message: 'Backend is running' };
    } else {
      return { healthy: false, message: `Backend returned ${response.status}` };
    }
  } catch (error) {
    return { healthy: false, message: `Backend not reachable: ${error.message}` };
  }
}

/**
 * Clear the cache
 */
export function clearCache(): void {
  Object.keys(cache).forEach(key => delete cache[key]);
  console.log('ML Predictions cache cleared');
}

export default {
  getTodaysPredictions,
  getCategorizedPredictions,
  getModelsStatus,
  getDailyFixtures,
  getLiveFixtures,
  checkBackendHealth,
  clearCache
};
