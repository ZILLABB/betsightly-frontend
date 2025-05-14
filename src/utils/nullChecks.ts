/**
 * Null Check Utilities
 *
 * This module provides utilities for safely handling null and undefined values,
 * preventing common runtime errors and providing graceful fallbacks.
 */

/**
 * Safely access nested properties of an object without throwing errors
 * @param obj The object to access properties from
 * @param path The path to the property, using dot notation (e.g., 'user.address.street')
 * @param defaultValue The default value to return if the property doesn't exist
 * @returns The value at the specified path or the default value
 */
export function safeGet<T, D = undefined>(
  obj: unknown,
  path: string,
  defaultValue: D = undefined as unknown as D
): T | D {
  if (!obj || !path) return defaultValue;

  const keys = path.split('.');
  let result: unknown = obj;

  for (const key of keys) {
    if (result === null || result === undefined || typeof result !== 'object') {
      return defaultValue;
    }
    result = (result as Record<string, unknown>)[key];
  }

  return (result === undefined || result === null) ? defaultValue : result as T;
}

/**
 * Safely render a component or fallback if conditions aren't met
 * @param condition The condition to check
 * @param component The component to render if condition is true
 * @param fallback The fallback to render if condition is false
 * @returns The component or fallback
 */
export function safeRender<T>(
  condition: boolean,
  component: T,
  fallback: React.ReactNode = null
): T | React.ReactNode {
  return condition ? component : fallback;
}

/**
 * Check if a value is null, undefined, or empty
 * @param value The value to check
 * @returns True if the value is null, undefined, or empty
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value as object).length === 0;
  return false;
}

/**
 * Safely parse a JSON string without throwing errors
 * @param jsonString The JSON string to parse
 * @param defaultValue The default value to return if parsing fails
 * @returns The parsed JSON or the default value
 */
export function safeParseJSON<T>(jsonString: string, defaultValue: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return defaultValue;
  }
}

/**
 * Safely convert a value to a number
 * @param value The value to convert
 * @param defaultValue The default value to return if conversion fails
 * @returns The converted number or the default value
 */
export function safeNumber(value: unknown, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Safely format a date without throwing errors
 * @param date The date to format
 * @param options Intl.DateTimeFormatOptions for formatting
 * @param fallback The fallback string to return if formatting fails
 * @returns The formatted date string or the fallback
 */
export function safeFormatDate(
  date: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  },
  fallback: string = 'Unknown date'
): string {
  try {
    if (!date) return fallback;
    const dateObj = typeof date === 'object' && date instanceof Date ? date : new Date(date);

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return fallback;
    }

    return new Intl.DateTimeFormat('en-US', options).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return fallback;
  }
}

/**
 * Safely access an array element without throwing errors
 * @param array The array to access
 * @param index The index to access
 * @param defaultValue The default value to return if the element doesn't exist
 * @returns The element at the specified index or the default value
 */
export function safeArrayAccess<T, D = undefined>(
  array: T[] | null | undefined,
  index: number,
  defaultValue: D = undefined as unknown as D
): T | D {
  if (!array || !Array.isArray(array) || index < 0 || index >= array.length) {
    return defaultValue;
  }

  return array[index] ?? defaultValue;
}

/**
 * Safely call a function without throwing errors
 * @param fn The function to call
 * @param args The arguments to pass to the function
 * @param defaultValue The default value to return if the function throws an error
 * @returns The result of the function or the default value
 */
export function safeCall<T, D = undefined>(
  fn: (...args: any[]) => T,
  args: any[] = [],
  defaultValue: D = undefined as unknown as D
): T | D {
  try {
    if (typeof fn !== 'function') {
      return defaultValue;
    }

    return fn(...args) as T;
  } catch (error) {
    console.error('Error calling function:', error);
    return defaultValue;
  }
}

/**
 * Safely convert a value to a string
 * @param value The value to convert
 * @param defaultValue The default value to return if conversion fails
 * @returns The converted string or the default value
 */
export function safeString(
  value: unknown,
  defaultValue: string = ''
): string {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  try {
    return String(value);
  } catch (error) {
    console.error('Error converting to string:', error);
    return defaultValue;
  }
}

/**
 * Safely execute a callback with error handling
 * @param callback The callback to execute
 * @param errorHandler The function to handle errors
 */
export function safeExecute<T>(
  callback: () => T,
  errorHandler?: (error: Error) => void
): T | undefined {
  try {
    return callback();
  } catch (error) {
    if (errorHandler && error instanceof Error) {
      errorHandler(error);
    } else {
      console.error('Error in safeExecute:', error);
    }
    return undefined;
  }
}

/**
 * Create a safe version of a function that won't throw errors
 * @param fn The function to make safe
 * @param defaultValue The default value to return if the function throws an error
 * @returns A safe version of the function
 */
export function makeSafe<T, D = undefined>(
  fn: (...args: any[]) => T,
  defaultValue: D = undefined as unknown as D
): (...args: any[]) => T | D {
  return (...args: any[]): T | D => {
    try {
      return fn(...args);
    } catch (error) {
      console.error('Error in makeSafe function:', error);
      return defaultValue;
    }
  };
}
