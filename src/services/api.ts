/**
 * API Service
 *
 * This file contains the base API configuration and helper functions
 * for making HTTP requests to the backend.
 */

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const FOOTBALL_API_KEY = import.meta.env.VITE_FOOTBALL_API_KEY || 'f9ed94ba8dde4a57b742ce7075057310';
const FOOTBALL_API_URL = 'https://api.football-data.org/v4';

// Cache configuration
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const cache: Record<string, { data: any; timestamp: number }> = {};

/**
 * Fetch data from the API with caching
 * @param url The URL to fetch
 * @param options Fetch options
 * @returns The fetched data
 */
export async function fetchWithCache(url: string, options: RequestInit = {}): Promise<any> {
  const cacheKey = `${url}-${JSON.stringify(options)}`;

  // Check if we have a valid cached response
  if (cache[cacheKey]) {
    const { data, timestamp } = cache[cacheKey];
    const now = Date.now();

    // If the cache is still valid, return the cached data
    if (now - timestamp < CACHE_DURATION) {
      console.log(`Using cached data for ${url}`);
      return data;
    }
  }

  try {
    // Make the API request
    const response = await fetch(url, options);

    // Check if the response is OK
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    // Parse the response as JSON
    const data = await response.json();

    // Cache the response
    cache[cacheKey] = {
      data,
      timestamp: Date.now(),
    };

    return data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}

/**
 * Clear the API cache
 */
export function clearCache(): void {
  Object.keys(cache).forEach((key) => {
    delete cache[key];
  });
  console.log('API cache cleared');
}

/**
 * Fetch data from the backend API
 * @param endpoint The API endpoint
 * @param options Fetch options
 * @returns The fetched data
 */
export async function fetchFromBackend(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  return fetchWithCache(url, { ...defaultOptions, ...options });
}

/**
 * Fetch data from the Football Data API
 * @param endpoint The API endpoint
 * @param options Fetch options
 * @returns The fetched data
 */
export async function fetchFootballData(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = `${FOOTBALL_API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultOptions: RequestInit = {
    headers: {
      'X-Auth-Token': FOOTBALL_API_KEY,
      ...options.headers,
    },
  };

  return fetchWithCache(url, { ...defaultOptions, ...options });
}

/**
 * Handle API errors
 * @param error The error object
 * @returns A standardized error object
 */
export function handleApiError(error: any): { message: string; status?: number; details?: any } {
  console.error('API Error:', error);

  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    return {
      message: error.response.data?.message || 'Server error',
      status: error.response.status,
      details: error.response.data,
    };
  } else if (error.request) {
    // The request was made but no response was received
    return {
      message: 'No response from server. Please check your connection.',
    };
  } else {
    // Something happened in setting up the request that triggered an Error
    return {
      message: error.message || 'An unexpected error occurred',
    };
  }
}

export default {
  fetchWithCache,
  fetchFromBackend,
  fetchFootballData,
  clearCache,
  handleApiError,
};
