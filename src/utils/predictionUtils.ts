/**
 * Prediction Utilities
 * 
 * This module provides utility functions and types for working with predictions.
 */

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
  if (odds >= 5) return "text-[#F5A623]";
  if (odds >= 3) return "text-[#6FCF97]";
  if (odds >= 1.5) return "text-[#56CCF2]";
  return "text-[#A1A1AA]";
};

/**
 * Helper function to format odds with proper precision
 */
export const formatOdds = (odds: number): string => {
  return odds.toFixed(odds % 1 === 0 ? 0 : 2);
};

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
