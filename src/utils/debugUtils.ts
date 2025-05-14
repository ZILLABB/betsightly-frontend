/**
 * Debug Utilities
 * 
 * This module provides utilities for debugging and logging.
 */

// Debug levels
export enum DebugLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  TRACE = 5
}

// Current debug level - set to maximum for now
let currentDebugLevel = DebugLevel.TRACE;

// Debug categories
export type DebugCategory = 'api' | 'cache' | 'ui' | 'data' | 'general';

// Debug options
interface DebugOptions {
  category?: DebugCategory;
  timestamp?: boolean;
  data?: any;
}

/**
 * Set the current debug level
 * @param level Debug level to set
 */
export const setDebugLevel = (level: DebugLevel): void => {
  currentDebugLevel = level;
  console.log(`[DEBUG] Debug level set to ${DebugLevel[level]}`);
};

/**
 * Get the current debug level
 * @returns Current debug level
 */
export const getDebugLevel = (): DebugLevel => currentDebugLevel;

/**
 * Format a debug message
 * @param message Message to format
 * @param options Debug options
 * @returns Formatted message
 */
const formatMessage = (message: string, options?: DebugOptions): string => {
  const parts: string[] = [];
  
  // Add timestamp if requested
  if (options?.timestamp !== false) {
    parts.push(new Date().toISOString());
  }
  
  // Add category if provided
  if (options?.category) {
    parts.push(`[${options.category.toUpperCase()}]`);
  }
  
  // Add message
  parts.push(message);
  
  return parts.join(' ');
};

/**
 * Log an error message
 * @param message Message to log
 * @param options Debug options
 */
export const logError = (message: string, options?: DebugOptions): void => {
  if (currentDebugLevel >= DebugLevel.ERROR) {
    console.error(formatMessage(message, options), options?.data || '');
  }
};

/**
 * Log a warning message
 * @param message Message to log
 * @param options Debug options
 */
export const logWarn = (message: string, options?: DebugOptions): void => {
  if (currentDebugLevel >= DebugLevel.WARN) {
    console.warn(formatMessage(message, options), options?.data || '');
  }
};

/**
 * Log an info message
 * @param message Message to log
 * @param options Debug options
 */
export const logInfo = (message: string, options?: DebugOptions): void => {
  if (currentDebugLevel >= DebugLevel.INFO) {
    console.info(formatMessage(message, options), options?.data || '');
  }
};

/**
 * Log a debug message
 * @param message Message to log
 * @param options Debug options
 */
export const logDebug = (message: string, options?: DebugOptions): void => {
  if (currentDebugLevel >= DebugLevel.DEBUG) {
    console.debug(formatMessage(message, options), options?.data || '');
  }
};

/**
 * Log a trace message
 * @param message Message to log
 * @param options Debug options
 */
export const logTrace = (message: string, options?: DebugOptions): void => {
  if (currentDebugLevel >= DebugLevel.TRACE) {
    console.log(formatMessage(`[TRACE] ${message}`, options), options?.data || '');
  }
};

/**
 * Log an API request
 * @param method HTTP method
 * @param url URL
 * @param options Request options
 */
export const logApiRequest = (method: string, url: string, options?: any): void => {
  logDebug(`API Request: ${method} ${url}`, { category: 'api', data: options });
};

/**
 * Log an API response
 * @param method HTTP method
 * @param url URL
 * @param status Status code
 * @param data Response data
 */
export const logApiResponse = (method: string, url: string, status: number, data?: any): void => {
  logDebug(`API Response: ${method} ${url} (${status})`, { category: 'api', data });
};

/**
 * Log an API error
 * @param method HTTP method
 * @param url URL
 * @param error Error
 */
export const logApiError = (method: string, url: string, error: any): void => {
  logError(`API Error: ${method} ${url}`, { category: 'api', data: error });
};

// Export default object
export default {
  setDebugLevel,
  getDebugLevel,
  logError,
  logWarn,
  logInfo,
  logDebug,
  logTrace,
  logApiRequest,
  logApiResponse,
  logApiError
};
