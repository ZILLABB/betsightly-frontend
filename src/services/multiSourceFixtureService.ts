/**
 * Fixture Service
 *
 * This file contains functions for fetching fixture data from the unified API endpoint.
 * It extracts fixture information from the predictions data.
 * All data comes from the single API endpoint at http://localhost:8000/api/predictions/categories
 */

import { getAllCategoryPredictions } from './predictionEndpoints';
import type { Prediction } from '../types';

// Define the Fixture type with predictions
export interface Fixture {
  id: string;
  homeTeam: any;
  awayTeam: any;
  startTime: Date;
  matchDate: string;
  league: string;
  status: string;
  sport: string;
  predictions: Prediction[]; // Add predictions array to store all predictions for this fixture
}

/**
 * Get fixtures for a specific date
 * @param date The date to get fixtures for
 * @param forceRefresh Whether to force refresh the data
 * @returns An object with fixtures and source information
 */
export async function getFixtures(date: string, forceRefresh: boolean = false): Promise<{ fixtures: Fixture[], source: string }> {
  try {
    console.log(`Fetching fixtures for ${date} from unified endpoint`);

    // Get all predictions from the unified endpoint
    const allCategories = await getAllCategoryPredictions();

    // Extract unique fixtures from all predictions
    const fixtureMap = new Map<string, Fixture>();
    const predictionsByFixture = new Map<string, Prediction[]>();

    // Process each category
    for (const [category, predictions] of Object.entries(allCategories)) {
      if (Array.isArray(predictions)) {
        console.log(`Processing ${predictions.length} predictions from category ${category}`);

        for (const prediction of predictions) {
          if (prediction.game) {
            const fixtureId = prediction.game.id;

            // Store the prediction for this fixture
            if (!predictionsByFixture.has(fixtureId)) {
              predictionsByFixture.set(fixtureId, []);
            }
            predictionsByFixture.get(fixtureId)?.push(prediction);

            // Create or update the fixture
            if (!fixtureMap.has(fixtureId)) {
              // Convert startTime to Date if it's a string
              let startTime: Date;
              if (typeof prediction.game.startTime === 'string') {
                startTime = new Date(prediction.game.startTime);
              } else {
                startTime = prediction.game.startTime || new Date();
              }

              // Format match date for display
              const matchDate = startTime.toLocaleString();

              fixtureMap.set(fixtureId, {
                id: fixtureId,
                homeTeam: prediction.game.homeTeam,
                awayTeam: prediction.game.awayTeam,
                startTime: startTime,
                matchDate: matchDate,
                league: prediction.game.league || 'Unknown League',
                status: prediction.game.status || 'scheduled',
                sport: prediction.game.sport || 'football',
                predictions: [] // Initialize empty predictions array
              });
            }
          }
        }
      }
    }

    // Add predictions to each fixture
    for (const [fixtureId, fixture] of fixtureMap.entries()) {
      const predictions = predictionsByFixture.get(fixtureId) || [];
      fixture.predictions = predictions;
    }

    console.log(`Extracted ${fixtureMap.size} unique fixtures with predictions from unified endpoint`);

    return {
      fixtures: Array.from(fixtureMap.values()),
      source: 'API'
    };
  } catch (error) {
    console.error(`Error fetching fixtures:`, error);
    return {
      fixtures: [],
      source: 'Error'
    };
  }
}

export default {
  getFixtures
};
