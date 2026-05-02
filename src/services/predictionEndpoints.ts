/**
 * Prediction Endpoints Service
 *
 * This file contains functions for interacting with the prediction API endpoints.
 * It provides utility functions for fetching predictions from different categories.
 */

import type { Prediction } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

/**
 * Get all predictions for all categories
 * @returns A record of predictions by category
 */
export async function getAllCategoryPredictions(): Promise<Record<string, Prediction[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/predictions/categories`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: Record<string, Prediction[]> = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching all category predictions:', error);
    return {};
  }
}


/**
 * Get rollover predictions from the API
 * @param days Number of days to fetch rollover predictions for (default: 10)
 * @returns A record of rollover predictions by day number
 */
export async function getRolloverPredictions(days: number = 10): Promise<Record<number, Prediction[]>> {
  try {
    const url = `${API_BASE_URL}/predictions/categories`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.categories) {
      return {};
    }

    let rolloverData = data.categories?.rollover;

    if (!rolloverData || !rolloverData.days || !Array.isArray(rolloverData.days)) {
      return {};
    }

    const daysWithPredictions = rolloverData.days.filter((day: any) =>
      day.predictions && Array.isArray(day.predictions) && day.predictions.length > 0
    );

    if (daysWithPredictions.length === 0) {
      return {};
    }

    // Convert to the expected format: Record<number, Prediction[]>
    const result: Record<number, Prediction[]> = {};

    // Process each day's predictions
    rolloverData.days.forEach((day: any) => {
      if (day.day && Array.isArray(day.predictions)) {
        if (day.predictions.length === 0) return;

        const predictions = day.predictions.map((pred: any) => {
          // Generate a unique ID if not provided
          const predId = pred.id || `rollover-${day.day}-${Math.random().toString(36).substring(2, 9)}`;
          const gameId = pred.fixture?.id || pred.id || `game-${Math.random().toString(36).substring(2, 9)}`;

          // Extract home and away team information
          let homeTeam, awayTeam;

          if (pred.fixture) {
            // If fixture data is available
            homeTeam = {
              id: `team-home-${gameId}`,
              name: pred.fixture.home_team || 'Home Team',
              logo: pred.fixture.home_logo || 'https://via.placeholder.com/30'
            };

            awayTeam = {
              id: `team-away-${gameId}`,
              name: pred.fixture.away_team || 'Away Team',
              logo: pred.fixture.away_logo || 'https://via.placeholder.com/30'
            };
          } else {
            // If no fixture data, use home_team and away_team directly
            homeTeam = {
              id: `team-home-${gameId}`,
              name: pred.home_team || 'Home Team',
              logo: 'https://via.placeholder.com/30'
            };

            awayTeam = {
              id: `team-away-${gameId}`,
              name: pred.away_team || 'Away Team',
              logo: 'https://via.placeholder.com/30'
            };
          }

          // Create the prediction object
          return {
            id: predId,
            gameId: gameId,
            game: {
              id: gameId,
              homeTeam: homeTeam,
              awayTeam: awayTeam,
              startTime: pred.fixture?.start_time ? new Date(pred.fixture.start_time) :
                pred.start_time ? new Date(pred.start_time) : new Date(),
              league: pred.fixture?.league || pred.league_name || 'Unknown League',
              status: 'scheduled',
              sport: 'football'
            },
            predictionType: pred.prediction_type || 'Match Result',
            prediction: pred.prediction_text || pred.prediction || '',
            odds: pred.odds || 1.5,
            status: pred.status || 'pending',
            createdAt: new Date(),
            description: pred.description || `${homeTeam.name} vs ${awayTeam.name}`,
            explanation: pred.explanation || `Prediction for ${homeTeam.name} vs ${awayTeam.name}`,
            confidence: pred.confidence ? Math.round(pred.confidence * 100) : 75,
            confidencePct: pred.confidence || 0.75,
            gameCode: pred.game_code || '',
            rolloverDay: day.day,
            combinedOdds: day.combined_odds || 1.0,
            // Add required properties from Prediction type
            predictions: [],
            combined_odds: day.combined_odds || 1.0,
            combined_confidence: pred.confidence || 0.75
          };
        });

        result[day.day] = predictions;
      }
    });

    return result;
  } catch (error) {
    console.error('Error fetching rollover predictions:', error);
    return {};
  }
}

export default {
  getAllCategoryPredictions,
  getRolloverPredictions
};
