/**
 * Betting Code Service
 *
 * This service handles fetching betting codes from the BetSightly backend API
 */

import { getLatestBettingCodes as getLatestBettingCodesFromAPI, getBettingCodes } from './unifiedApiService';
import type { BettingCode, BettingCodesResponse } from '../types';

// Re-export the BettingCode type from types
export type { BettingCode } from '../types';

/**
 * Fetches the latest betting codes from the API
 * @param limit Maximum number of codes to return (default: 100)
 * @param skip Number of codes to skip (default: 0)
 * @returns Promise with the betting codes
 */
export const getLatestBettingCodes = async (limit: number = 100, skip: number = 0): Promise<BettingCode[]> => {
  try {
    console.log(`Fetching latest betting codes: limit=${limit}, skip=${skip}`);

    // Use the unified API service
    const codes = await getLatestBettingCodesFromAPI(limit, skip);
    console.log(`Received ${codes.length} betting codes from API`);

    return codes;
  } catch (error) {
    console.error('Error fetching latest betting codes:', error);
    // Let the error bubble up to the UI so it can display proper error messages
    throw error;
  }
};

/**
 * Fetches betting codes with full response metadata
 * @param limit Maximum number of codes to return (default: 100)
 * @param skip Number of codes to skip (default: 0)
 * @param filters Optional filters
 * @returns Promise with the full betting codes response
 */
export const getBettingCodesWithMetadata = async (
  limit: number = 100,
  skip: number = 0,
  filters?: Record<string, any>
): Promise<BettingCodesResponse> => {
  try {
    console.log(`Fetching betting codes with metadata: limit=${limit}, skip=${skip}`, filters);

    // Use the unified API service
    const response = await getBettingCodes(limit, skip, filters);
    console.log(`Received betting codes response:`, response);

    return response;
  } catch (error) {
    console.error('Error fetching betting codes with metadata:', error);
    // Return empty response on error
    return {
      betting_codes: [],
      total: 0,
      skip,
      limit,
      has_more: false
    };
  }
};
