/**
 * Betting Code Service
 *
 * This service handles fetching betting codes from the API
 */

import { API_BASE_URL } from '../config/apiConfig';

export interface BettingCode {
  id: string | number;
  code: string;
  punter_id: string | number;
  punter_name: string;
  bookmaker_id?: string | number;
  bookmaker_name?: string;
  odds?: number;
  event_date?: string | null;
  expiry_date?: string | null;
  status: 'pending' | 'won' | 'lost' | 'void';
  confidence?: number;
  featured: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fetches the latest betting codes from the API
 * @param limit Maximum number of codes to return (default: 100)
 * @param skip Number of codes to skip (default: 0)
 * @returns Promise with the betting codes
 */
export const getLatestBettingCodes = async (limit: number = 100, skip: number = 0): Promise<BettingCode[]> => {
  try {
    // Use the general betting-codes endpoint with query parameters
    const url = `${API_BASE_URL}/betting-codes?limit=${limit}&skip=${skip}`;
    console.log('Fetching betting codes from:', url);

    const response = await fetch(url);
    console.log('Response status:', response.status);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('API Response:', data);

    // Check the structure of the data based on the API response
    if (data.status === 'success' && Array.isArray(data.betting_codes)) {
      console.log('Found betting_codes array with length:', data.betting_codes.length);
      return data.betting_codes;
    } else if (data.betting_codes) {
      // If status is missing but betting_codes is present
      console.log('Found betting_codes array with length:', data.betting_codes.length);
      return data.betting_codes;
    } else if (Array.isArray(data)) {
      // If the API returns an array directly
      console.log('Response is an array with length:', data.length);
      return data;
    } else {
      console.log('Unexpected API response format. Response keys:', Object.keys(data));

      // Check if there's any array property in the response
      for (const key in data) {
        if (Array.isArray(data[key])) {
          console.log(`Found array in property '${key}' with length:`, data[key].length);
          return data[key];
        }
      }

      // If we can't find any array in the response, return empty array
      console.log('No valid data found in API response');
      return [];
    }
  } catch (error) {
    console.error('Error fetching betting codes:', error);
    return [];
  }
};
