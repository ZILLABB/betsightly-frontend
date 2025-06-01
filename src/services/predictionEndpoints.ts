/**
 * Prediction Endpoints Service
 *
 * This file contains functions for interacting with the prediction API endpoints.
 * It provides utility functions for fetching predictions from different categories.
 */

import type { Prediction } from '../types';

/**
 * Get all predictions for all categories
 * @returns A record of predictions by category
 */
export async function getAllCategoryPredictions(): Promise<Record<string, Prediction[]>> {
  try {
    const response = await fetch("api/predictions/categories");
    console.log('Fetching all category predictions');
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
    console.log(`Fetching rollover predictions from categories endpoint for ${days} days`);

    // Use absolute URL to ensure correct endpoint is being called
    const apiUrl = "http://localhost:8000/api/predictions/categories";
    console.log('API URL:', apiUrl);

    // Add timestamp to prevent caching
    const url = `${apiUrl}?_=${new Date().getTime()}`;

    console.log('Sending request to:', url);
    const response = await fetch(url);
    console.log('Response status:', response.status);

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Response data structure:', Object.keys(data));

    // Check if categories exist
    if (!data.categories) {
      console.warn('No categories found in API response');
      console.log('Full response:', data);
      return {};
    }

    console.log('Available categories:', Object.keys(data.categories));

    // Try to get data from different category formats
    // First check for rollover category
    let rolloverData = data.categories?.rollover;

    if (!rolloverData) {
      console.warn('No rollover category found in API response');

      // Try to get data from other categories
      const otherCategories = ['2_odds', '5_odds', '10_odds', 'safe_bets', 'balanced_bets', 'high_reward'];
      for (const category of otherCategories) {
        if (data.categories[category] && Array.isArray(data.categories[category])) {
          console.log(`Found predictions in ${category} category, using as fallback`);

          // Create a synthetic rollover structure using this category's data
          rolloverData = {
            name: `${category} Rollover Challenge`,
            description: `A 10-day rollover challenge using ${category} predictions`,
            target_odds: 3.0,
            days: []
          };

          // Create 10 days with predictions from this category
          for (let i = 1; i <= days; i++) {
            rolloverData.days.push({
              day: i,
              combined_odds: 3.0,
              predictions: data.categories[category].slice(0, 3) // Take up to 3 predictions
            });
          }

          break;
        }
      }

      // If still no data, return empty object
      if (!rolloverData) {
        return {};
      }
    }

    console.log('Rollover data structure:', Object.keys(rolloverData));

    if (!rolloverData.days || !Array.isArray(rolloverData.days)) {
      console.warn('No days array found in rollover data');
      console.log('Rollover data:', rolloverData);
      return {};
    }

    console.log('Found rollover data with', rolloverData.days.length, 'days');

    // Check if any days have predictions
    const daysWithPredictions = rolloverData.days.filter(day =>
      day.predictions && Array.isArray(day.predictions) && day.predictions.length > 0
    );

    if (daysWithPredictions.length === 0) {
      console.warn('No days with predictions found in rollover data');
      return {};
    }

    // Convert to the expected format: Record<number, Prediction[]>
    const result: Record<number, Prediction[]> = {};

    // Process each day's predictions
    rolloverData.days.forEach((day: any) => {
      if (day.day && Array.isArray(day.predictions)) {
        // Skip days with no predictions
        if (day.predictions.length === 0) {
          console.log(`Day ${day.day} has no predictions, skipping`);
          return;
        }

        // Map the API prediction format to our frontend Prediction type
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

    console.log('Processed rollover predictions for', Object.keys(result).length, 'days');

    return result;
  } catch (error) {
    console.error('Error fetching rollover predictions:', error);
    // Return empty object on error - no mock data fallback
    const emptyDays: Record<number, Prediction[]> = {};
    for (let i = 1; i <= days; i++) {
      emptyDays[i] = [];
    }
    return emptyDays;
  }
}



export default {
  getAllCategoryPredictions,
  getRolloverPredictions
};
