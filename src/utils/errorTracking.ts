/**
 * This file contains utility functions for error tracking and reporting.
 * In a real application, this would integrate with Sentry or another error tracking service.
 */

interface User {
  id: string;
  email?: string;
  username?: string;
}

/**
 * Initialize error tracking
 */
export function initErrorTracking(): void {
  // In a real application, this would initialize Sentry or another error tracking service
  console.log('Error tracking initialized');
}

/**
 * Set user information for error tracking
 * @param user User information
 */
export function setUser(user: User): void {
  // In a real application, this would set user information in Sentry or another error tracking service
  console.log('User set for error tracking:', user);
}

/**
 * Capture an exception for error tracking
 * @param error The error to capture
 * @param context Additional context for the error
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  // In a real application, this would send the error to Sentry or another error tracking service
  console.error('Error captured for tracking:', error, context);
}

/**
 * Capture a message for error tracking
 * @param message The message to capture
 * @param level The level of the message (info, warning, error)
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  // In a real application, this would send the message to Sentry or another error tracking service
  console.log(`Message captured for tracking (${level}):`, message);
}

/**
 * Add breadcrumb for error tracking
 * @param category The category of the breadcrumb
 * @param message The message for the breadcrumb
 * @param data Additional data for the breadcrumb
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>
): void {
  // In a real application, this would add a breadcrumb to Sentry or another error tracking service
  console.log(`Breadcrumb added (${category}):`, message, data);
}

/**
 * Global error handler function for use with API calls and async operations
 * @param error The error to handle
 * @param component Optional component name for context
 * @returns The error message
 */
export function errorHandler(error: unknown, component?: string): string {
  let errorMessage = 'An unexpected error occurred';

  if (error instanceof Error) {
    errorMessage = error.message;
    captureException(error, { component });
  } else if (typeof error === 'string') {
    errorMessage = error;
    captureMessage(error, 'error');
  } else {
    captureException(new Error('Unknown error type'), {
      component,
      errorType: typeof error,
      errorValue: String(error)
    });
  }

  console.error(`Error in ${component || 'application'}:`, error);
  return errorMessage;
}

