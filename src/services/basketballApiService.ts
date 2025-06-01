/**
 * Basketball API Service
 * 
 * This service handles all basketball-related API interactions including:
 * - NBA predictions
 * - Basketball model status
 * - Seasonal availability checks
 */

import { API_BASE_URL, API_ENDPOINTS, API_CACHE_CONFIG } from '../config/apiConfig';
import { fetchFromApi } from './unifiedApiService';

// Basketball-specific types
export interface BasketballPrediction {
  id: string;
  home_team: string;
  away_team: string;
  league: string;
  start_time: string;
  prediction_type: string;
  prediction: string;
  odds: number;
  confidence: number;
  status: 'pending' | 'won' | 'lost';
  explanation?: string;
  model_version?: string;
}

export interface BasketballModelStatus {
  model_name: string;
  status: 'active' | 'inactive' | 'training' | 'error';
  last_updated: string;
  accuracy: number;
  predictions_today: number;
  version: string;
  performance_metrics?: {
    precision: number;
    recall: number;
    f1_score: number;
  };
}

export interface BasketballApiResponse {
  predictions: BasketballPrediction[];
  total_count: number;
  date: string;
  season_active: boolean;
  models_status: BasketballModelStatus[];
}

// Cache for basketball data
const basketballCache: Record<string, { data: any; timestamp: number }> = {};

/**
 * Get basketball predictions
 * @param options Query options for basketball predictions
 * @returns Promise with basketball predictions
 */
export async function getBasketballPredictions(options: {
  date?: string;
  confidence?: number;
  limit?: number;
} = {}): Promise<BasketballApiResponse> {
  try {
    console.log('Fetching basketball predictions with options:', options);

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (options.date) queryParams.append('date', options.date);
    if (options.confidence) queryParams.append('confidence', options.confidence.toString());
    if (options.limit) queryParams.append('limit', options.limit.toString());

    const endpoint = `${API_ENDPOINTS.BASKETBALL.PREDICTIONS}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const data = await fetchFromApi<BasketballApiResponse>(endpoint);
    
    console.log('Basketball predictions received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching basketball predictions:', error);
    // Return empty response on error
    return {
      predictions: [],
      total_count: 0,
      date: options.date || new Date().toISOString().split('T')[0],
      season_active: false,
      models_status: []
    };
  }
}

/**
 * Get basketball predictions for a specific date
 * @param date Date in YYYY-MM-DD format
 * @returns Promise with basketball predictions for the date
 */
export async function getBasketballPredictionsByDate(date: string): Promise<BasketballPrediction[]> {
  try {
    const response = await getBasketballPredictions({ date });
    return response.predictions;
  } catch (error) {
    console.error(`Error fetching basketball predictions for ${date}:`, error);
    return [];
  }
}

/**
 * Get basketball predictions with minimum confidence
 * @param confidence Minimum confidence threshold (0-1)
 * @returns Promise with filtered basketball predictions
 */
export async function getBasketballPredictionsByConfidence(confidence: number): Promise<BasketballPrediction[]> {
  try {
    const response = await getBasketballPredictions({ confidence });
    return response.predictions;
  } catch (error) {
    console.error(`Error fetching basketball predictions with confidence ${confidence}:`, error);
    return [];
  }
}

/**
 * Get basketball models status
 * @returns Promise with basketball models status
 */
export async function getBasketballModelsStatus(): Promise<BasketballModelStatus[]> {
  try {
    console.log('Fetching basketball models status');
    
    const data = await fetchFromApi<{ models: BasketballModelStatus[] }>(
      API_ENDPOINTS.BASKETBALL.MODELS_STATUS
    );
    
    console.log('Basketball models status received:', data);
    return data.models || [];
  } catch (error) {
    console.error('Error fetching basketball models status:', error);
    return [];
  }
}

/**
 * Check if basketball season is currently active
 * @returns Promise with boolean indicating if season is active
 */
export async function isBasketballSeasonActive(): Promise<boolean> {
  try {
    const response = await getBasketballPredictions({ limit: 1 });
    return response.season_active;
  } catch (error) {
    console.error('Error checking basketball season status:', error);
    return false;
  }
}

/**
 * Get basketball prediction statistics
 * @returns Promise with basketball prediction statistics
 */
export async function getBasketballStats(): Promise<{
  total_predictions: number;
  accuracy: number;
  active_models: number;
  season_active: boolean;
}> {
  try {
    const [predictions, modelsStatus] = await Promise.all([
      getBasketballPredictions({ limit: 1 }),
      getBasketballModelsStatus()
    ]);

    const activeModels = modelsStatus.filter(model => model.status === 'active').length;
    const averageAccuracy = modelsStatus.length > 0 
      ? modelsStatus.reduce((sum, model) => sum + model.accuracy, 0) / modelsStatus.length 
      : 0;

    return {
      total_predictions: predictions.total_count,
      accuracy: averageAccuracy,
      active_models: activeModels,
      season_active: predictions.season_active
    };
  } catch (error) {
    console.error('Error fetching basketball stats:', error);
    return {
      total_predictions: 0,
      accuracy: 0,
      active_models: 0,
      season_active: false
    };
  }
}

/**
 * Clear basketball cache
 */
export function clearBasketballCache(): void {
  Object.keys(basketballCache).forEach(key => delete basketballCache[key]);
  console.log('Basketball cache cleared');
}

export default {
  getBasketballPredictions,
  getBasketballPredictionsByDate,
  getBasketballPredictionsByConfidence,
  getBasketballModelsStatus,
  isBasketballSeasonActive,
  getBasketballStats,
  clearBasketballCache
};
