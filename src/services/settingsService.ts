/**
 * Settings Service
 *
 * This service provides functions for managing user settings, including:
 * - API keys
 * - Theme preferences
 * - Currency settings
 * - Notification preferences
 */

// API Key storage keys
const FOOTBALL_DATA_API_KEY = 'football_data_api_key';

/**
 * Save the Football-Data.org API key to localStorage
 *
 * @param apiKey The API key to save
 * @returns A promise that resolves to true if the key was saved successfully
 */
export const saveApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    localStorage.setItem(FOOTBALL_DATA_API_KEY, apiKey);
    return true;
  } catch (error) {
    console.error('Error saving API key:', error);
    return false;
  }
};

/**
 * Get the Football-Data.org API key from localStorage
 *
 * @returns A promise that resolves to the API key or null if not found
 */
export const getApiKey = async (): Promise<string | null> => {
  try {
    return localStorage.getItem(FOOTBALL_DATA_API_KEY);
  } catch (error) {
    console.error('Error getting API key:', error);
    return null;
  }
};

/**
 * Check if the Football-Data.org API key is set
 *
 * @returns A promise that resolves to true if the API key is set
 */
export const hasApiKey = async (): Promise<boolean> => {
  const apiKey = await getApiKey();
  return !!apiKey;
};

/**
 * Clear the Football-Data.org API key from localStorage
 *
 * @returns A promise that resolves to true if the key was cleared successfully
 */
export const clearApiKey = async (): Promise<boolean> => {
  try {
    localStorage.removeItem(FOOTBALL_DATA_API_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing API key:', error);
    return false;
  }
};

/**
 * Validate the Football-Data.org API key by making a test request
 *
 * @param apiKey The API key to validate
 * @returns A promise that resolves to an object with validation status and details
 */
export const validateApiKey = async (apiKey: string): Promise<{
  valid: boolean;
  message: string;
  remainingRequests?: number;
  totalRequests?: number;
}> => {
  try {
    if (!apiKey || apiKey.trim() === '') {
      return {
        valid: false,
        message: 'API key cannot be empty'
      };
    }

    // Make a test request to the Football-Data.org API
    const response = await fetch('https://api.football-data.org/v4/competitions', {
      headers: {
        'X-Auth-Token': apiKey
      }
    });

    // Get rate limit information from headers
    const remainingRequests = parseInt(response.headers.get('X-Requests-Available-Minute') || '0', 10);
    const totalRequests = parseInt(response.headers.get('X-RequestCounter-Reset') || '0', 10);

    if (response.ok) {
      return {
        valid: true,
        message: 'API key is valid',
        remainingRequests,
        totalRequests
      };
    } else if (response.status === 401) {
      return {
        valid: false,
        message: 'Invalid API key'
      };
    } else if (response.status === 429) {
      return {
        valid: false,
        message: 'API rate limit exceeded',
        remainingRequests,
        totalRequests
      };
    } else {
      return {
        valid: false,
        message: `API error: ${response.status}`,
        remainingRequests,
        totalRequests
      };
    }
  } catch (error) {
    console.error('Error validating API key:', error);
    return {
      valid: false,
      message: 'Network error while validating API key'
    };
  }
};

// Export default object for convenience
export default {
  saveApiKey,
  getApiKey,
  hasApiKey,
  clearApiKey,
  validateApiKey
};
