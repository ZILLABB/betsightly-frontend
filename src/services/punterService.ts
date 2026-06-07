/**
 * Punter Service
 *
 * This service handles fetching punters from the BetSightly backend API
 */

import { getPunters } from './unifiedApiService';
import type { Punter, PaginatedResponse } from '../types';

// Re-export the Punter type from types
export type { Punter } from '../types';

/**
 * Fetches punters with pagination
 * @param limit Maximum number of punters to return (default: 100)
 * @param skip Number of punters to skip (default: 0)
 * @returns Promise with the paginated punters response
 */
export const getPuntersList = async (limit: number = 100, skip: number = 0): Promise<PaginatedResponse<Punter>> => {
  try {

    // Use the unified API service
    const response = await getPunters(limit, skip);

    // Handle the actual API response format
    if (response && typeof response === 'object') {
      // Check if response has punters array (actual API format)
      if ('punters' in response) {
        return {
          items: (response as any).punters || [],
          total: (response as any).total || 0,
          skip: (response as any).skip || skip,
          limit: (response as any).limit || limit,
          has_more: (response as any).has_more || false
        };
      }
      // Check if response already has items array (expected format)
      if ('items' in response) {
        return response;
      }
    }

    // Fallback for unexpected format
    return {
      items: [],
      total: 0,
      skip,
      limit,
      has_more: false
    };
  } catch (error) {
    console.error('Error fetching punters:', error);
    // Return empty response on error
    return {
      items: [],
      total: 0,
      skip,
      limit,
      has_more: false
    };
  }
};

/**
 * Fetches punters as a simple array (convenience function)
 * @param limit Maximum number of punters to return (default: 100)
 * @param skip Number of punters to skip (default: 0)
 * @returns Promise with array of punters
 */
export const getPuntersArray = async (limit: number = 100, skip: number = 0): Promise<Punter[]> => {
  try {
    const response = await getPuntersList(limit, skip);
    return response.items || [];
  } catch (error) {
    console.error('Error fetching punters array:', error);
    // Don't silently fail - let the error bubble up so the UI can show it
    throw error;
  }
};

/**
 * Get top punters by success rate
 * @param limit Maximum number of punters to return (default: 10)
 * @returns Promise with array of top punters
 */
export const getTopPunters = async (limit: number = 10): Promise<Punter[]> => {
  try {
    const punters = await getPuntersArray(limit, 0);
    
    // Sort by success rate (descending) and popularity
    const sortedPunters = punters.sort((a, b) => {
      const successRateA = a.success_rate || 0;
      const successRateB = b.success_rate || 0;
      const popularityA = a.popularity || 0;
      const popularityB = b.popularity || 0;
      
      // First sort by success rate, then by popularity
      if (successRateB !== successRateA) {
        return successRateB - successRateA;
      }
      return popularityB - popularityA;
    });

    return sortedPunters.slice(0, limit);
  } catch (error) {
    console.error('Error fetching top punters:', error);
    return [];
  }
};

export default {
  getPuntersList,
  getPuntersArray,
  getTopPunters
};
