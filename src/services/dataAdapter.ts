/**
 * Data Adapter for BetSightly Backend
 * 
 * This service transforms backend data to match frontend expectations
 */

import type { Prediction, Fixture } from '../types';

// Backend prediction format (simplified)
interface BackendPrediction {
  home_team: string;
  away_team: string;
  prediction: string;
  odds: number;
  confidence: number;
}

// Backend categories response
interface BackendCategoriesResponse {
  "2_odds": BackendPrediction[];
  "5_odds": BackendPrediction[];
  "10_odds": BackendPrediction[];
  "rollover": BackendPrediction[];
}

/**
 * Transform backend prediction to frontend prediction format
 * @param backendPred Backend prediction object
 * @param category Category name for ID generation
 * @param index Index for unique ID generation
 * @returns Frontend-compatible prediction
 */
export function transformBackendPrediction(
  backendPred: BackendPrediction, 
  category: string, 
  index: number
): Prediction {
  // Generate unique ID
  const id = `${category}-${index}-${Date.now()}`;
  
  // Create fixture object from backend data
  const fixture: Fixture = {
    id: parseInt(id.replace(/\D/g, '').slice(0, 8)) || index,
    home_team: backendPred.home_team,
    away_team: backendPred.away_team,
    league: 'Premier League', // Default league - backend should provide this
    match_datetime: new Date().toISOString(), // Default to current time
    status: 'scheduled'
  };

  // Transform to frontend prediction format
  const prediction: Prediction = {
    id: parseInt(id.replace(/\D/g, '').slice(0, 8)) || index,
    fixture,
    prediction_type: getPredictionType(backendPred.prediction),
    prediction: backendPred.prediction,
    odds: backendPred.odds,
    confidence: backendPred.confidence,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'pending',
    
    // Legacy compatibility fields
    game: {
      id: id,
      homeTeam: backendPred.home_team,
      awayTeam: backendPred.away_team,
      league: 'Premier League',
      startTime: new Date().toISOString(),
      fixture
    },
    gameId: id,
    predictionType: backendPred.prediction,
    createdAt: new Date().toISOString()
  };

  return prediction;
}

/**
 * Determine prediction type from prediction text
 * @param predictionText The prediction text
 * @returns Prediction type
 */
function getPredictionType(predictionText: string): string {
  const text = predictionText.toLowerCase();
  
  if (text.includes('win') || text.includes('victory')) {
    return 'match_result';
  } else if (text.includes('over') || text.includes('under') || text.includes('goals')) {
    return 'over_under';
  } else if (text.includes('btts') || text.includes('both teams')) {
    return 'btts';
  } else {
    return 'match_result'; // Default
  }
}

/**
 * Transform backend categories response to frontend format
 * @param backendData Backend categories response
 * @returns Frontend-compatible categories
 */
export function transformCategoriesResponse(backendData: BackendCategoriesResponse): Record<string, Prediction[]> {
  const categories: Record<string, Prediction[]> = {};
  
  Object.entries(backendData).forEach(([category, predictions]) => {
    categories[category] = predictions.map((pred, index) => 
      transformBackendPrediction(pred, category, index)
    );
  });
  
  return categories;
}

/**
 * Check if data is in backend format
 * @param data Data to check
 * @returns Whether data is in backend format
 */
export function isBackendFormat(data: any): data is BackendCategoriesResponse {
  return (
    data &&
    typeof data === 'object' &&
    data['2_odds'] &&
    Array.isArray(data['2_odds']) &&
    data['2_odds'].length > 0 &&
    data['2_odds'][0].home_team &&
    data['2_odds'][0].away_team &&
    !data['2_odds'][0].fixture // No fixture object means backend format
  );
}

/**
 * Transform any prediction data to frontend format
 * @param data Raw data from backend
 * @returns Frontend-compatible data
 */
export function adaptPredictionData(data: any): Record<string, Prediction[]> {
  if (isBackendFormat(data)) {
    console.log('🔄 Transforming backend format to frontend format');
    return transformCategoriesResponse(data);
  } else if (data && typeof data === 'object') {
    console.log('✅ Data already in frontend format');
    return data;
  } else {
    console.warn('⚠️ Unknown data format, returning empty categories');
    return {
      '2_odds': [],
      '5_odds': [],
      '10_odds': [],
      'rollover': []
    };
  }
}

export default {
  transformBackendPrediction,
  transformCategoriesResponse,
  isBackendFormat,
  adaptPredictionData
};
