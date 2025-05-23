/**
 * Unified Data Service
 *
 * This file contains functions for checking API availability and other utility functions.
 */

import { checkAPIHealth } from './unifiedApiService';

/**
 * Check if the API is available
 * @returns A promise that resolves to a boolean indicating whether the API is available
 */
export async function checkApiAvailability(): Promise<boolean> {
  try {
    return await checkAPIHealth();
  } catch (error) {
    console.error('Error checking API availability:', error);
    return false;
  }
}

// Export a default object with all functions
export default {
  checkApiAvailability
};
