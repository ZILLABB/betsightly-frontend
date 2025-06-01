/**
 * Input validation and sanitization utilities
 */

/**
 * Sanitize string input to prevent XSS attacks
 * @param input The input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/[<>]/g, '') // Remove < and > characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers like onclick=
    .trim();
}

/**
 * Validate email format
 * @param email Email to validate
 * @returns True if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate username format
 * @param username Username to validate
 * @returns True if valid username format
 */
export function isValidUsername(username: string): boolean {
  // Username should be 3-30 characters, alphanumeric and underscores only
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
}

/**
 * Validate password strength
 * @param password Password to validate
 * @returns Object with validation result and message
 */
export function validatePassword(password: string): { isValid: boolean; message: string } {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  return { isValid: true, message: 'Password is valid' };
}

/**
 * Validate numeric input
 * @param value Value to validate
 * @param min Minimum value (optional)
 * @param max Maximum value (optional)
 * @returns True if valid number within range
 */
export function isValidNumber(value: any, min?: number, max?: number): boolean {
  const num = Number(value);
  
  if (isNaN(num)) {
    return false;
  }
  
  if (min !== undefined && num < min) {
    return false;
  }
  
  if (max !== undefined && num > max) {
    return false;
  }
  
  return true;
}

/**
 * Sanitize and validate form data
 * @param data Form data object
 * @returns Sanitized form data
 */
export function sanitizeFormData<T extends Record<string, any>>(data: T): T {
  const sanitized = { ...data };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key]);
    }
  }
  
  return sanitized;
}

/**
 * Validate API response structure
 * @param response API response
 * @param requiredFields Array of required field names
 * @returns True if response has all required fields
 */
export function validateApiResponse(response: any, requiredFields: string[]): boolean {
  if (!response || typeof response !== 'object') {
    return false;
  }
  
  return requiredFields.every(field => response.hasOwnProperty(field));
}

export default {
  sanitizeString,
  isValidEmail,
  isValidUsername,
  validatePassword,
  isValidNumber,
  sanitizeFormData,
  validateApiResponse,
};
