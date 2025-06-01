/**
 * API configuration
 */

// Base URL for API requests
// Use relative URL for development (works with Vite proxy) or full URL for production
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  import.meta.env.DEV ? '/api' : 'http://localhost:8000/api'
);

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

  // Health endpoints
  HEALTH: {
    BASIC: '/health',
    DETAILED: '/health/detailed',
    READY: '/health/ready',
    LIVE: '/health/live',
  },

  // Core Football Prediction endpoints
  PREDICTIONS: {
    // Live football predictions with real-time data
    LIVE: '/predictions',
    // Category-specific predictions
    CATEGORIES: '/predictions/categories',
    CATEGORY: (category: string) => `/predictions/category/${category}`,
    // Best predictions endpoints
    BEST: '/predictions/best',
    BEST_CATEGORY: (category: string) => `/predictions/best/${category}`,
    // Enhanced predictions with AI explanations
    ENHANCED: '/predictions/enhanced',
    // Legacy endpoints
    LIST: '/predictions',
    DETAIL: (id: string | number) => `/predictions/${id}`,
    CREATE: '/predictions',
    UPDATE: (id: string | number) => `/predictions/${id}`,
    DELETE: (id: string | number) => `/predictions/${id}`,
    BY_USER: (userId: string | number) => `/predictions/user/${userId}`,
  },

  // Basketball Prediction endpoints
  BASKETBALL: {
    PREDICTIONS: '/basketball-predictions',
    MODELS_STATUS: '/basketball-models/status',
    BY_DATE: (date: string) => `/basketball-predictions?date=${date}`,
    BY_CONFIDENCE: (confidence: number) => `/basketball-predictions?confidence=${confidence}`,
  },

  // Fixtures endpoints
  FIXTURES: {
    LIST: '/fixtures',
    DETAIL: (id: string | number) => `/fixtures/${id}`,
    UPCOMING: '/fixtures/upcoming',
    BY_DATE: (date: string) => `/fixtures/date/${date}`,
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
  HEALTH_TTL: 1 * 60 * 1000, // 1 minute for health checks
  BASKETBALL_TTL: 5 * 60 * 1000, // 5 minutes for basketball predictions
};

// Auto-refresh configuration
export const AUTO_REFRESH_CONFIG = {
  ENABLED: false, // Disabled while backend has empty data
  PREDICTIONS_INTERVAL: 5 * 60 * 1000, // 5 minutes for predictions
  HEALTH_INTERVAL: 30 * 1000, // 30 seconds for health checks
  BASKETBALL_INTERVAL: 5 * 60 * 1000, // 5 minutes for basketball
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // 2 seconds
};

// Response time expectations (for monitoring)
export const RESPONSE_TIME_EXPECTATIONS = {
  HEALTH_CHECKS: 100, // <100ms
  BASIC_PREDICTIONS: 3000, // 2-3 seconds
  ENHANCED_PREDICTIONS: 5000, // 3-5 seconds
  BASKETBALL_PREDICTIONS: 2000, // 1-2 seconds
  MODEL_STATUS: 500, // <500ms
};

export default {
  API_BASE_URL,
  FOOTBALL_API_KEY,
  API_TIMEOUT,
  API_ENDPOINTS,
  API_VERSION,
  USE_MOCK_DATA,
  API_CACHE_CONFIG,
  AUTO_REFRESH_CONFIG,
  RESPONSE_TIME_EXPECTATIONS,
};
