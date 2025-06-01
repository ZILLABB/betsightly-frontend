/**
 * Prediction Data Extraction Utilities
 * 
 * Provides consistent data extraction patterns for prediction objects
 * across all components, ensuring compatibility with the API response structure.
 */

import { safeGet } from './nullChecks';
import type { Prediction, Fixture, PredictionsObject, IndividualPrediction } from '../types';

/**
 * Extract fixture data from prediction object
 * Handles both new API format (fixture) and legacy format (game)
 */
export function extractFixtureData(prediction: any): Fixture | null {
  if (!prediction) return null;

  // Method 1: Direct access to fixture property (new API format)
  if (prediction.fixture && typeof prediction.fixture === 'object') {
    return {
      id: prediction.fixture.id || 0,
      home_team: prediction.fixture.home_team || 'Home Team',
      away_team: prediction.fixture.away_team || 'Away Team',
      date: prediction.fixture.date || new Date().toISOString(),
      competition: prediction.fixture.competition || 'Unknown League'
    };
  }

  // Method 2: Extract from legacy game object
  const game = safeGet(prediction, 'game', {});
  if (game && typeof game === 'object') {
    const homeTeam = typeof game.homeTeam === 'string' ? game.homeTeam : 
                    typeof game.homeTeam === 'object' ? game.homeTeam?.name : 'Home Team';
    const awayTeam = typeof game.awayTeam === 'string' ? game.awayTeam : 
                    typeof game.awayTeam === 'object' ? game.awayTeam?.name : 'Away Team';

    return {
      id: game.id || 0,
      home_team: homeTeam,
      away_team: awayTeam,
      date: game.startTime || new Date().toISOString(),
      competition: game.league || 'Unknown League'
    };
  }

  return null;
}

/**
 * Extract predictions object from prediction
 * Handles multiple API formats and provides fallbacks
 */
export function extractPredictionsData(prediction: any): PredictionsObject | null {
  if (!prediction) return null;

  let predictions = {} as Record<string, any>;

  // Method 1: Direct access to predictions property (new API format)
  if (prediction.predictions && typeof prediction.predictions === 'object') {
    predictions = prediction.predictions;
  }
  // Method 2: Use safeGet as fallback
  else {
    predictions = safeGet(prediction, 'predictions', {}) as Record<string, any>;
  }

  // Validate that we have the expected structure
  if (predictions && typeof predictions === 'object' && 
      (predictions.match_result || predictions.over_under || predictions.btts)) {
    return predictions as PredictionsObject;
  }

  return null;
}

/**
 * Create fallback predictions data when API data is missing
 * Uses available prediction data to generate realistic fallbacks
 */
export function createFallbackPredictions(prediction: any): PredictionsObject {
  const confidence = safeGet(prediction, 'confidence', 0.8) as number;
  const predictionText = safeGet(prediction, 'prediction', 'home') as string;
  
  // Ensure confidence is in percentage format (0-100)
  const confidencePercent = confidence > 1 ? confidence : confidence * 100;

  return {
    match_result: {
      prediction: predictionText,
      confidence: confidencePercent,
      probabilities: predictionText === 'home' ? [0.1, 0.2, 0.7] : 
                    predictionText === 'away' ? [0.7, 0.2, 0.1] : [0.2, 0.6, 0.2]
    },
    over_under: {
      prediction: 'over',
      confidence: Math.max(confidencePercent - 5, 70),
      probabilities: [0.3, 0.7]
    },
    btts: {
      prediction: 'yes',
      confidence: Math.max(confidencePercent - 3, 75),
      probabilities: [0.25, 0.75]
    }
  };
}

/**
 * Extract overall confidence from prediction object
 * Handles multiple confidence field formats
 */
export function extractOverallConfidence(prediction: any): number {
  if (!prediction) return 0;

  // Try different confidence field names
  const confidence = prediction.confidence || 
                    prediction.confidencePct || 
                    prediction.overall_confidence ||
                    0;

  // Ensure confidence is in percentage format (0-100)
  return confidence > 1 ? confidence : confidence * 100;
}

/**
 * Extract league/competition name from prediction
 */
export function extractLeagueName(prediction: any): string {
  if (!prediction) return 'Unknown League';

  // Try fixture.competition first (new API format)
  if (prediction.fixture?.competition) {
    return prediction.fixture.competition;
  }

  // Try game.league (legacy format)
  if (prediction.game?.league) {
    return prediction.game.league;
  }

  // Try other possible fields
  return prediction.league || 
         prediction.competition || 
         prediction.league_name ||
         'Unknown League';
}

/**
 * Extract game time from prediction
 * Returns the raw date string or Date object for proper processing
 */
export function extractGameTime(prediction: any): string | Date {
  if (!prediction) return new Date(); // Return current date as fallback

  // Try fixture.date first (new API format)
  if (prediction.fixture?.date) {
    try {
      // Return the raw ISO string for proper Date parsing
      return prediction.fixture.date;
    } catch {
      return new Date();
    }
  }

  // Try game.startTime (legacy format)
  if (prediction.game?.startTime) {
    try {
      // Return the startTime as-is for proper processing
      return prediction.game.startTime;
    } catch {
      return new Date();
    }
  }

  // Try timestamp field
  if (prediction.timestamp) {
    try {
      return prediction.timestamp;
    } catch {
      return new Date();
    }
  }

  return new Date(); // Return current date as final fallback
}

/**
 * Format game time for display
 */
export function formatGameTime(gameTime: string | Date): string {
  try {
    const date = typeof gameTime === 'string' ? new Date(gameTime) : gameTime;

    if (isNaN(date.getTime())) {
      return 'Time N/A';
    }

    // Get current time for comparison
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const gameDate = new Date(date);
    gameDate.setHours(0, 0, 0, 0);

    const isToday = gameDate.getTime() === today.getTime();

    // Format time with AM/PM
    const timeString = date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    if (isToday) {
      return timeString;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  } catch {
    return 'Time N/A';
  }
}

/**
 * Format prediction text for display
 */
export function formatPredictionText(
  predictionType: 'match_result' | 'over_under' | 'btts',
  prediction: IndividualPrediction,
  homeTeam?: string,
  awayTeam?: string
): string {
  switch (predictionType) {
    case 'match_result':
      if (prediction.prediction === 'home' && homeTeam) {
        return `${homeTeam} Win`;
      } else if (prediction.prediction === 'away' && awayTeam) {
        return `${awayTeam} Win`;
      } else if (prediction.prediction === 'draw') {
        return 'Draw';
      }
      return prediction.prediction;

    case 'over_under':
      return prediction.prediction === 'over' ? 'Over 2.5' : 'Under 2.5';

    case 'btts':
      return prediction.prediction === 'yes' ? 'Yes' : 'No';

    default:
      return prediction.prediction;
  }
}

/**
 * Get confidence color class based on confidence level
 */
export function getConfidenceColorClass(confidence: number): string {
  if (confidence >= 90) return 'text-green-500';
  if (confidence >= 80) return 'text-blue-500';
  if (confidence >= 70) return 'text-yellow-500';
  return 'text-orange-500';
}

/**
 * Get reliability indicator based on confidence level
 */
export function getReliabilityIndicator(confidence: number): { icon: string; text: string; color: string } {
  if (confidence >= 90) {
    return { icon: '🔥', text: 'Very High', color: 'text-green-500' };
  } else if (confidence >= 80) {
    return { icon: '⭐', text: 'High', color: 'text-blue-500' };
  } else if (confidence >= 70) {
    return { icon: '✅', text: 'Good', color: 'text-yellow-500' };
  } else {
    return { icon: '⚠️', text: 'Moderate', color: 'text-orange-500' };
  }
}

/**
 * Main extraction function that combines all extraction methods
 * Use this for consistent data extraction across all components
 */
export function extractPredictionData(prediction: any) {
  const fixture = extractFixtureData(prediction);
  const predictions = extractPredictionsData(prediction) || createFallbackPredictions(prediction);
  const overallConfidence = extractOverallConfidence(prediction);
  const league = extractLeagueName(prediction);
  const gameTime = extractGameTime(prediction);

  return {
    fixture,
    predictions,
    overallConfidence,
    league,
    gameTime,
    homeTeam: fixture?.home_team || 'Home Team',
    awayTeam: fixture?.away_team || 'Away Team'
  };
}
