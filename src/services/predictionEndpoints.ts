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

    // If no predictions were found, provide sample data for testing
    if (Object.keys(result).length === 0) {
      console.log('No rollover predictions found in API response, using sample data');
      return generateSampleRolloverData(days);
    }

    return result;
  } catch (error) {
    console.error('Error fetching rollover predictions:', error);
    console.log('Using sample rollover data as fallback');
    return generateSampleRolloverData(days);
  }
}

/**
 * Generate sample rollover prediction data for testing
 * @param days Number of days to generate data for
 * @returns Sample rollover prediction data
 */
function generateSampleRolloverData(days: number = 10): Record<number, Prediction[]> {
  console.log(`Generating sample rollover data for ${days} days`);
  const result: Record<number, Prediction[]> = {};

  // Sample teams for generating predictions
  const teams = [
    { home: 'Manchester United', away: 'Liverpool' },
    { home: 'Arsenal', away: 'Chelsea' },
    { home: 'Barcelona', away: 'Real Madrid' },
    { home: 'Bayern Munich', away: 'Borussia Dortmund' },
    { home: 'PSG', away: 'Marseille' },
    { home: 'Juventus', away: 'AC Milan' },
    { home: 'Ajax', away: 'PSV' },
    { home: 'Celtic', away: 'Rangers' }
  ];

  // Sample prediction types
  const predictionTypes = ['Match Result', 'Over/Under', 'Both Teams to Score', 'Correct Score'];

  // Generate data for each day
  for (let day = 1; day <= days; day++) {
    // Generate 1-3 predictions per day
    const numPredictions = Math.floor(Math.random() * 3) + 1;
    const predictions: Prediction[] = [];

    for (let i = 0; i < numPredictions; i++) {
      // Pick a random team matchup
      const teamIndex = Math.floor(Math.random() * teams.length);
      const team = teams[teamIndex];

      // Pick a random prediction type
      const predTypeIndex = Math.floor(Math.random() * predictionTypes.length);
      const predictionType = predictionTypes[predTypeIndex];

      // Generate a prediction value based on the type
      let predictionValue = '';
      if (predictionType === 'Match Result') {
        predictionValue = Math.random() > 0.5 ? team.home : team.away;
      } else if (predictionType === 'Over/Under') {
        predictionValue = Math.random() > 0.5 ? 'Over 2.5' : 'Under 2.5';
      } else if (predictionType === 'Both Teams to Score') {
        predictionValue = Math.random() > 0.5 ? 'Yes' : 'No';
      } else {
        predictionValue = `${Math.floor(Math.random() * 3)}-${Math.floor(Math.random() * 3)}`;
      }

      // Generate a random odds value between 1.5 and 3.0
      const odds = 1.5 + Math.random() * 1.5;

      // Generate a random confidence value between 60 and 90
      const confidence = 60 + Math.floor(Math.random() * 30);

      // Create the prediction object
      predictions.push({
        id: `sample-${day}-${i}`,
        gameId: `game-${day}-${i}`,
        game: {
          id: `game-${day}-${i}`,
          homeTeam: { id: `team-home-${day}-${i}`, name: team.home, logo: 'https://via.placeholder.com/30' },
          awayTeam: { id: `team-away-${day}-${i}`, name: team.away, logo: 'https://via.placeholder.com/30' },
          startTime: new Date(new Date().getTime() + day * 24 * 60 * 60 * 1000),
          league: 'Sample League',
          status: 'scheduled',
          sport: 'football'
        },
        predictionType,
        prediction: predictionValue,
        odds,
        status: 'pending',
        createdAt: new Date(),
        description: `${team.home} vs ${team.away} - ${predictionType}: ${predictionValue}`,
        explanation: `This is a sample prediction for testing purposes.`,
        confidence,
        confidencePct: confidence / 100,
        gameCode: `SAMPLE${day}${i}`,
        rolloverDay: day,
        combinedOdds: odds,
        // Add required properties from Prediction type
        predictions: [],
        combined_odds: odds,
        combined_confidence: confidence / 100
      });
    }

    result[day] = predictions;
  }

  console.log(`Generated sample data with ${Object.keys(result).length} days`);
  return result;
}

export default {
  getAllCategoryPredictions,
  getRolloverPredictions
};
