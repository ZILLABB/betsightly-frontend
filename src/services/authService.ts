import { API_BASE_URL } from '../config/apiConfig';
import { User } from '../contexts/AuthContext';

// Hardcoded admin credentials for immediate use
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_USER: User = {
  id: 1,
  username: ADMIN_USERNAME,
  email: 'admin@betsightly.com',
  role: 'admin'
};

// Generate a simple token (in a real app, this would be a JWT)
const generateToken = (user: User): string => {
  return btoa(JSON.stringify({
    id: user.id,
    username: user.username,
    role: user.role,
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours from now
  }));
};

/**
 * Login user
 * @param username Username
 * @param password Password
 * @returns User data and token
 */
export const login = async (username: string, password: string): Promise<{ user: User; access_token: string }> => {
  try {
    // Check if using hardcoded admin credentials
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      console.log('Logging in with hardcoded admin credentials');
      const token = generateToken(ADMIN_USER);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        user: ADMIN_USER,
        access_token: token
      };
    }

    // If not using hardcoded credentials, try the API
    try {
      // Create form data
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      // Make API request
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Login failed. Please check your credentials.');
      }

      const data = await response.json();
      return data;
    } catch (apiError) {
      console.error('API login error:', apiError);
      throw new Error('Login failed. Please check your credentials.');
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Get current user
 * @param token JWT token
 * @returns User data
 */
export const getCurrentUser = async (token: string): Promise<User> => {
  try {
    // First, check if it's our hardcoded admin token
    try {
      const decodedData = JSON.parse(atob(token));

      // Check if it's an admin token
      if (decodedData.role === 'admin') {
        console.log('Retrieved hardcoded admin user');

        // Return the admin user
        return ADMIN_USER;
      }
    } catch (decodeError) {
      // Not our hardcoded token, continue to API
      console.log('Not a hardcoded token, trying API');
    }

    // If not our hardcoded token, try the API
    try {
      // Make API request
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to get user data.');
      }

      const data = await response.json();
      return data;
    } catch (apiError) {
      console.error('API get current user error:', apiError);
      throw new Error('Failed to get user data.');
    }
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
};

/**
 * Verify token
 * @param token JWT token
 * @returns Whether token is valid
 */
export const verifyToken = async (token: string): Promise<boolean> => {
  try {
    // First, check if it's our hardcoded admin token
    try {
      const decodedData = JSON.parse(atob(token));

      // Check if it's an admin token and not expired
      if (decodedData.role === 'admin' && decodedData.exp > Date.now()) {
        console.log('Verified hardcoded admin token');
        return true;
      }
    } catch (decodeError) {
      // Not our hardcoded token, continue to API verification
      console.log('Not a hardcoded token, trying API verification');
    }

    // If not our hardcoded token, try the API
    try {
      // Make API request
      const response = await fetch(`${API_BASE_URL}/auth/verify-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.valid;
    } catch (apiError) {
      console.error('API token verification error:', apiError);
      return false;
    }
  } catch (error) {
    console.error('Verify token error:', error);
    return false;
  }
};

export default {
  login,
  getCurrentUser,
  verifyToken,
};
