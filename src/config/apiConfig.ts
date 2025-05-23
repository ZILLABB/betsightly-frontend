/**
 * API configuration
 */

// Base URL for API requests
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Football API key
export const FOOTBALL_API_KEY = import.meta.env.VITE_FOOTBALL_API_KEY || '';

// API request timeout in milliseconds
export const API_TIMEOUT = 30000;

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY: '/auth/verify-token',
    ME: '/auth/me',
  },

  // Fixtures endpoints
  FIXTURES: {
    LIST: '/fixtures',
    DETAIL: (id: string | number) => `/fixtures/${id}`,
    UPCOMING: '/fixtures/upcoming',
    BY_DATE: (date: string) => `/fixtures/date/${date}`,
  },

  // Predictions endpoints
  PREDICTIONS: {
    LIST: '/predictions',
    DETAIL: (id: string | number) => `/predictions/${id}`,
    CREATE: '/predictions',
    UPDATE: (id: string | number) => `/predictions/${id}`,
    DELETE: (id: string | number) => `/predictions/${id}`,
    BY_USER: (userId: string | number) => `/predictions/user/${userId}`,
  },

  // Results endpoints
  RESULTS: {
    LIST: '/results',
    DETAIL: (id: string | number) => `/results/${id}`,
    BY_DATE: (date: string) => `/results/date/${date}`,
  },

  // Users/Punters endpoints
  USERS: {
    LIST: '/users',
    DETAIL: (id: string | number) => `/users/${id}`,
    STATS: '/users/stats',
  },

  // Analytics endpoints
  ANALYTICS: {
    SUMMARY: '/analytics/summary',
    TRENDS: '/analytics/trends',
    PERFORMANCE: '/analytics/performance',
  },

  // Betting codes endpoints
  BETTING_CODES: {
    LIST: '/betting-codes',
    LATEST: '/betting-codes/latest/',
    DETAIL: (id: string | number) => `/betting-codes/${id}`,
    CREATE: '/betting-codes',
    UPDATE: (id: string | number) => `/betting-codes/${id}`,
    DELETE: (id: string | number) => `/betting-codes/${id}`,
  },
};

// API version
export const API_VERSION = 'v1';

// Whether to use mock data when API is unavailable
export const USE_MOCK_DATA = false;

// Cache configuration
export const API_CACHE_CONFIG = {
  ENABLED: true,
  TTL: 5 * 60 * 1000, // 5 minutes in milliseconds
  FIXTURES_TTL: 60 * 60 * 1000, // 1 hour for fixtures
  RESULTS_TTL: 24 * 60 * 60 * 1000, // 24 hours for results
};

export default {
  API_BASE_URL,
  FOOTBALL_API_KEY,
  API_TIMEOUT,
  API_ENDPOINTS,
  API_VERSION,
  USE_MOCK_DATA,
  API_CACHE_CONFIG,
};
