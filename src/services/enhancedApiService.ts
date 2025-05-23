/**
 * Enhanced API Service
 *
 * This file contains functions for interacting with the enhanced API endpoints.
 * It provides utility functions for API interactions.
 * All data is fetched from the unified endpoint at http://localhost:8000/api/predictions/best
 */

import type { Prediction } from '../types';
import { logApiResponse } from '../utils/logUtils';

// API base URL - try to get from environment or use default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Flag to force refresh of API data
let FORCE_REFRESH = false;

/**
 * Set the force refresh flag
 * @param value Whether to force refresh API data
 */
export function setForceRefresh(value: boolean): void {
  FORCE_REFRESH = value;
  console.log(`Force refresh set to: ${FORCE_REFRESH}`);
}

/**
 * Check if force refresh is enabled
 * @returns Whether force refresh is enabled
 */
export function getForceRefresh(): boolean {
  return FORCE_REFRESH;
}

/**
 * Check API health
 * @returns Whether the API is healthy
 */
export async function checkAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health/`);
    return response.ok;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
}

/**
 * Get all best predictions from the unified API endpoint
 * @returns A record of predictions by category
 */
export async function getAllBestPredictions(): Promise<Record<string, Prediction[]>> {
  return new Promise((resolve) => {
    console.log('Fetching all best predictions from unified endpoint');

    // Use the /api/predictions/best endpoint as specified
    fetch(`${API_BASE_URL}/predictions/best/`)
      .then(response => {
        console.log('API Response:', response);
        console.log(response)
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('API Data:', data);

        // If the API returns an empty object or null, return an empty object
        if (!data) {
          console.warn('API returned empty data');
          resolve({});
          return;
        }

        // Log the API response using our utility
        logApiResponse('getAllBestPredictions', data);

        // Process the data to match our expected format
        const processedData: Record<string, Prediction[]> = {};

        Object.entries(data).forEach(([categoryKey, predictions]) => {
          if (predictions && Array.isArray(predictions) && predictions.length > 0) {
            // Convert the predictions to our Prediction type
            processedData[categoryKey] = predictions as any[];
          }
        });

        console.log('Processed data:', processedData);
        resolve(processedData);
      })
      .catch(error => {
        console.error('Error fetching all best predictions:', error);
        // Return empty object instead of throwing to prevent app crashes
        resolve({});
      });
  });
}



export default {
  setForceRefresh,
  getForceRefresh,
  checkAPIHealth,
  getAllBestPredictions,
};
