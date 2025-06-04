/**
 * Bookmaker Service
 *
 * This service handles fetching bookmakers from the BetSightly backend API
 */

import { getBookmakers } from './unifiedApiService';
import type { Bookmaker, PaginatedResponse } from '../types';

// Re-export the Bookmaker type from types
export type { Bookmaker } from '../types';

/**
 * Fetches bookmakers with pagination
 * @param limit Maximum number of bookmakers to return (default: 100)
 * @param skip Number of bookmakers to skip (default: 0)
 * @returns Promise with the paginated bookmakers response
 */
export const getBookmakersList = async (limit: number = 100, skip: number = 0): Promise<PaginatedResponse<Bookmaker>> => {
  try {
    console.log(`Fetching bookmakers: limit=${limit}, skip=${skip}`);

    // Use the unified API service
    const response = await getBookmakers(limit, skip);
    console.log(`Received bookmakers response:`, response);

    // Handle the actual API response format
    if (response && typeof response === 'object') {
      // Check if response has bookmakers array (actual API format)
      if ('bookmakers' in response) {
        return {
          items: (response as any).bookmakers || [],
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
    console.error('Error fetching bookmakers:', error);
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
 * Fetches bookmakers as a simple array (convenience function)
 * @param limit Maximum number of bookmakers to return (default: 100)
 * @param skip Number of bookmakers to skip (default: 0)
 * @returns Promise with array of bookmakers
 */
export const getBookmakersArray = async (limit: number = 100, skip: number = 0): Promise<Bookmaker[]> => {
  try {
    console.log(`Getting bookmakers array: limit=${limit}, skip=${skip}`);
    const response = await getBookmakersList(limit, skip);
    console.log(`Bookmakers array response:`, response);
    return response.items || [];
  } catch (error) {
    console.error('Error fetching bookmakers array:', error);
    // Don't silently fail - let the error bubble up so the UI can show it
    throw error;
  }
};

/**
 * Get popular bookmakers
 * @param limit Maximum number of bookmakers to return (default: 10)
 * @returns Promise with array of popular bookmakers
 */
export const getPopularBookmakers = async (limit: number = 10): Promise<Bookmaker[]> => {
  try {
    console.log(`Getting top ${limit} bookmakers`);
    const bookmakers = await getBookmakersArray(limit, 0);
    
    // Sort by name for now (could be enhanced with popularity metrics later)
    const sortedBookmakers = bookmakers.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });

    return sortedBookmakers.slice(0, limit);
  } catch (error) {
    console.error('Error fetching popular bookmakers:', error);
    return [];
  }
};

export default {
  getBookmakersList,
  getBookmakersArray,
  getPopularBookmakers
};
