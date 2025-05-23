/**
 * Logging Utilities
 * 
 * This file contains utility functions for logging.
 */

/**
 * Log a message with a timestamp
 * @param message The message to log
 */
export function logWithTimestamp(message: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

/**
 * Log an error with a timestamp
 * @param message The error message
 * @param error The error object
 */
export function logErrorWithTimestamp(message: string, error?: any): void {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${message}`, error);
}

/**
 * Log API response data in a structured way
 * @param endpoint The API endpoint
 * @param data The response data
 */
export function logApiResponse(endpoint: string, data: any): void {
  console.group(`🌐 API Response from ${endpoint}`);
  
  try {
    // Log basic info
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Endpoint: ${endpoint}`);
    
    // Log data type
    console.log(`Data type: ${typeof data}`);
    
    if (data === null) {
      console.log('Data is null');
    } else if (data === undefined) {
      console.log('Data is undefined');
    } else if (Array.isArray(data)) {
      console.log(`Array length: ${data.length}`);
      
      if (data.length > 0) {
        console.log('First item:', data[0]);
        console.log('Last item:', data[data.length - 1]);
      }
      
      // Log array item types
      const types = new Set(data.map(item => typeof item));
      console.log(`Item types: ${Array.from(types).join(', ')}`);
      
      // Log keys of first object if it's an object
      if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
        console.log('First item keys:', Object.keys(data[0]));
      }
    } else if (typeof data === 'object') {
      console.log('Keys:', Object.keys(data));
      
      // If it's a record/map of arrays, log each array's length
      const arrayEntries = Object.entries(data).filter(([_, value]) => Array.isArray(value));
      if (arrayEntries.length > 0) {
        console.log('Array entries:');
        arrayEntries.forEach(([key, value]) => {
          console.log(`- ${key}: ${(value as any[]).length} items`);
        });
      }
    }
    
    // Log full data (limited to avoid console overload)
    console.log('Full data (truncated):', JSON.stringify(data, null, 2).substring(0, 1000) + '...');
  } catch (error) {
    console.error('Error logging API response:', error);
  }
  
  console.groupEnd();
}
