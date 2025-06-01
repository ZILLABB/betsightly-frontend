import { API_BASE_URL } from '../config/apiConfig';
import { User } from '../contexts/AuthContext';
import { sanitizeString, isValidEmail, isValidUsername, validateApiResponse } from '../utils/validation';

/**
 * Login user
 * @param username Username
 * @param password Password
 * @returns User data and token
 */
export const login = async (username: string, password: string): Promise<{ user: User; access_token: string }> => {
  // Input validation and sanitization
  if (!username?.trim()) {
    throw new Error('Username is required');
  }

  if (!password?.trim()) {
    throw new Error('Password is required');
  }

  // Sanitize username input
  const sanitizedUsername = sanitizeString(username.trim());

  // Validate username format
  if (!isValidUsername(sanitizedUsername)) {
    throw new Error('Invalid username format');
  }

  try {
    // Create form data
    const formData = new FormData();
    formData.append('username', sanitizedUsername);
    formData.append('password', password);

    // Make API request
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Login failed. Please check your credentials.');
    }

    const data = await response.json();

    // Validate response structure
    if (!validateApiResponse(data, ['user', 'access_token'])) {
      throw new Error('Invalid response from server');
    }

    // Validate user data structure
    if (!validateApiResponse(data.user, ['id', 'username', 'email'])) {
      throw new Error('Invalid user data received');
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error instanceof Error ? error : new Error('An unexpected error occurred');
  }
};

/**
 * Get current user
 * @param token JWT token
 * @returns User data
 */
export const getCurrentUser = async (token: string): Promise<User> => {
  if (!token?.trim()) {
    throw new Error('Token is required');
  }

  try {
    // Make API request
    const response = await fetch(`${API_BASE_URL}/auth/me/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid or expired token');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to get user data');
    }

    const data = await response.json();

    // Validate response structure
    if (!validateApiResponse(data, ['id', 'username', 'email'])) {
      throw new Error('Invalid user data received');
    }

    return data;
  } catch (error) {
    console.error('Get current user error:', error);
    throw error instanceof Error ? error : new Error('Failed to get user data');
  }
};

/**
 * Verify token
 * @param token JWT token
 * @returns Whether token is valid
 */
export const verifyToken = async (token: string): Promise<boolean> => {
  if (!token?.trim()) {
    return false;
  }

  try {
    // Make API request
    const response = await fetch(`${API_BASE_URL}/auth/verify-token/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return Boolean(data.valid);
  } catch (error) {
    console.error('Token verification error:', error);
    return false;
  }
};

export default {
  login,
  getCurrentUser,
  verifyToken,
};
