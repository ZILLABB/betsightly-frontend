/**
 * Enhanced Prediction Service
 * 
 * This service handles enhanced prediction features including:
 * - AI explanations (SHAP/LIME)
 * - Meta-stacking ensemble models
 * - Advanced analytics and insights
 */

import { API_BASE_URL, API_ENDPOINTS } from '../config/apiConfig';
import { fetchFromApi } from './unifiedApiService';
import type { Prediction } from '../types';

// Enhanced prediction types
export interface AIExplanation {
  method: 'SHAP' | 'LIME';
  feature_importance: {
    feature_name: string;
    importance_score: number;
    impact: 'positive' | 'negative';
  }[];
  confidence_factors: string[];
  risk_factors: string[];
  explanation_text: string;
}

export interface MetaStackingInfo {
  ensemble_models: string[];
  model_weights: Record<string, number>;
  consensus_score: number;
  disagreement_score: number;
  final_confidence: number;
}

export interface EnhancedPrediction extends Prediction {
  ai_explanation?: AIExplanation;
  meta_stacking?: MetaStackingInfo;
  quality_score: number;
  reliability_index: number;
  market_analysis?: {
    value_bet: boolean;
    expected_value: number;
    market_efficiency: number;
  };
}

export interface EnhancedPredictionResponse {
  predictions: EnhancedPrediction[];
  meta_info: {
    total_models_used: number;
    average_consensus: number;
    explanation_coverage: number;
  };
  performance_metrics: {
    accuracy_last_30_days: number;
    roi_last_30_days: number;
    sharpe_ratio: number;
  };
}

/**
 * Get enhanced predictions with AI explanations
 * @param options Query options for enhanced predictions
 * @returns Promise with enhanced predictions
 */
export async function getEnhancedPredictions(options: {
  date?: string;
  explanations?: boolean;
  meta_stacking?: boolean;
  category?: string;
} = {}): Promise<EnhancedPredictionResponse> {
  try {
    console.log('Fetching enhanced predictions with options:', options);

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (options.date) queryParams.append('date', options.date);
    if (options.explanations !== undefined) queryParams.append('explanations', options.explanations.toString());
    if (options.meta_stacking !== undefined) queryParams.append('meta_stacking', options.meta_stacking.toString());
    if (options.category) queryParams.append('category', options.category);

    const endpoint = `${API_ENDPOINTS.PREDICTIONS.ENHANCED}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const data = await fetchFromApi<EnhancedPredictionResponse>(endpoint);
    
    console.log('Enhanced predictions received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching enhanced predictions:', error);
    // Return empty response on error
    return {
      predictions: [],
      meta_info: {
        total_models_used: 0,
        average_consensus: 0,
        explanation_coverage: 0
      },
      performance_metrics: {
        accuracy_last_30_days: 0,
        roi_last_30_days: 0,
        sharpe_ratio: 0
      }
    };
  }
}

/**
 * Get enhanced predictions for a specific category
 * @param category Prediction category (2_odds, 5_odds, 10_odds, rollover)
 * @param includeExplanations Whether to include AI explanations
 * @returns Promise with enhanced predictions for the category
 */
export async function getEnhancedPredictionsByCategory(
  category: string, 
  includeExplanations: boolean = true
): Promise<EnhancedPrediction[]> {
  try {
    const response = await getEnhancedPredictions({ 
      category, 
      explanations: includeExplanations,
      meta_stacking: true 
    });
    return response.predictions;
  } catch (error) {
    console.error(`Error fetching enhanced predictions for category ${category}:`, error);
    return [];
  }
}

/**
 * Get AI explanation for a specific prediction
 * @param predictionId ID of the prediction
 * @returns Promise with AI explanation
 */
export async function getAIExplanation(predictionId: string): Promise<AIExplanation | null> {
  try {
    console.log(`Fetching AI explanation for prediction ${predictionId}`);
    
    const data = await fetchFromApi<{ explanation: AIExplanation }>(
      `/predictions/${predictionId}/explanation`
    );
    
    return data.explanation;
  } catch (error) {
    console.error(`Error fetching AI explanation for prediction ${predictionId}:`, error);
    return null;
  }
}

/**
 * Get meta-stacking information for predictions
 * @param predictionIds Array of prediction IDs
 * @returns Promise with meta-stacking information
 */
export async function getMetaStackingInfo(predictionIds: string[]): Promise<Record<string, MetaStackingInfo>> {
  try {
    console.log('Fetching meta-stacking info for predictions:', predictionIds);
    
    const data = await fetchFromApi<{ meta_stacking: Record<string, MetaStackingInfo> }>(
      '/predictions/meta-stacking',
      {
        method: 'POST',
        body: JSON.stringify({ prediction_ids: predictionIds }),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    return data.meta_stacking;
  } catch (error) {
    console.error('Error fetching meta-stacking info:', error);
    return {};
  }
}

/**
 * Get prediction quality metrics
 * @returns Promise with overall prediction quality metrics
 */
export async function getPredictionQualityMetrics(): Promise<{
  overall_accuracy: number;
  category_performance: Record<string, number>;
  model_performance: Record<string, number>;
  recent_trends: {
    last_7_days: number;
    last_30_days: number;
    last_90_days: number;
  };
}> {
  try {
    console.log('Fetching prediction quality metrics');
    
    const data = await fetchFromApi<any>('/predictions/quality-metrics');
    
    return data;
  } catch (error) {
    console.error('Error fetching prediction quality metrics:', error);
    return {
      overall_accuracy: 0,
      category_performance: {},
      model_performance: {},
      recent_trends: {
        last_7_days: 0,
        last_30_days: 0,
        last_90_days: 0
      }
    };
  }
}

/**
 * Get live predictions with real-time updates
 * @param options Query options for live predictions
 * @returns Promise with live predictions
 */
export async function getLivePredictions(options: {
  category?: string;
  date?: string;
  limit?: number;
} = {}): Promise<Prediction[]> {
  try {
    console.log('Fetching live predictions with options:', options);

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (options.category) queryParams.append('category', options.category);
    if (options.date) queryParams.append('date', options.date);
    if (options.limit) queryParams.append('limit', options.limit.toString());

    const endpoint = `${API_ENDPOINTS.PREDICTIONS.LIVE}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const data = await fetchFromApi<{ predictions: Prediction[] }>(endpoint);
    
    console.log('Live predictions received:', data);
    return data.predictions || [];
  } catch (error) {
    console.error('Error fetching live predictions:', error);
    return [];
  }
}

export default {
  getEnhancedPredictions,
  getEnhancedPredictionsByCategory,
  getAIExplanation,
  getMetaStackingInfo,
  getPredictionQualityMetrics,
  getLivePredictions
};
