/**
 * Prediction Utilities
 *
 * This module provides utility functions and types for working with predictions.
 */

import type { Prediction } from '../types';

// Card display modes
export enum PredictionCardMode {
  STANDARD = "standard",
  COMPACT = "compact",
  DETAILED = "detailed"
}

// Card style variants
export enum PredictionCardVariant {
  DEFAULT = "default",
  PREMIUM = "premium",
  ROLLOVER = "rollover"
}

/**
 * Helper function to get the appropriate CSS class for odds
 */
export const getOddsClass = (odds: number): string => {
  if (odds >= 5) return "text-primary-500";
  if (odds >= 3) return "text-green-500";
  if (odds >= 1.5) return "text-blue-500";
  return "text-[var(--muted-foreground)]";
};

// formatOdds moved to utils/formatters.ts (supports decimal/fractional/american via useFormatOdds hook)

/**
 * Helper function to generate a reason if none exists
 */
export const generateReason = (
  predictionType: string = "",
  homeTeam: string = "",
  awayTeam: string = "",
  odds: number = 0
): string => {
  if (!predictionType && !homeTeam && !awayTeam) {
    return "Based on our analysis, this prediction has a high probability of success.";
  }

  const templates = [
    `${homeTeam} has shown strong form recently, making them likely to perform well against ${awayTeam}.`,
    `Our statistical model indicates a high probability for this outcome based on recent performance metrics.`,
    `Historical data and current form suggest this is a value bet with good odds of ${odds}x.`,
    `${homeTeam} vs ${awayTeam} presents a favorable matchup based on our predictive algorithms.`,
    `Recent team performance and head-to-head statistics support this prediction.`
  ];

  // Use a deterministic selection based on the teams to ensure consistency
  const seed = (homeTeam + awayTeam).length;
  return templates[seed % templates.length];
};

/**
 * Categorize predictions by odds ranges
 * @param predictions The predictions to categorize
 * @returns A record of predictions by category
 */
export function categorizePredictionsByOdds(predictions: Prediction[]): Record<string, Prediction[]> {
  if (!Array.isArray(predictions)) {
    return {};
  }

  // Initialize categories
  const categories: Record<string, Prediction[]> = {
    '2_odds': [],
    '5_odds': [],
    '10_odds': [],
    'rollover': []
  };

  // Categorize each prediction
  for (const prediction of predictions) {
    // Check if it's a rollover prediction
    if (prediction.rolloverDay) {
      categories['rollover'].push(prediction);
      continue;
    }

    // Categorize by odds
    const odds = prediction.odds || 0;

    if (odds <= 2.5) {
      categories['2_odds'].push(prediction);
    } else if (odds <= 5) {
      categories['5_odds'].push(prediction);
    } else {
      categories['10_odds'].push(prediction);
    }
  }

  return categories;
}

/**
 * Get confidence level label based on confidence percentage
 * @param confidence The confidence percentage (0-100)
 * @returns A string label for the confidence level
 */
export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 80) return 'High';
  if (confidence >= 60) return 'Medium';
  if (confidence >= 40) return 'Low';
  return 'Very Low';
}

/**
 * Get confidence variant for UI components
 * @param confidence The confidence percentage (0-100)
 * @returns A string variant for UI components
 */
export function getConfidenceVariant(confidence: number): "success" | "info" | "warning" | "danger" {
  if (confidence >= 80) return 'success';
  if (confidence >= 60) return 'info';
  if (confidence >= 40) return 'warning';
  return 'danger';
}
