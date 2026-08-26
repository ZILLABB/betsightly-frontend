/**
 * API configuration for BetSightly Backend Integration
 */

// Base URL for API requests
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://betsightly-api.onrender.com/api';

// API request timeout in milliseconds (30 seconds for ML predictions)
export const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000');

// API endpoints (updated to match your backend)
export const API_ENDPOINTS = {
  // Health check
  HEALTH: '/health/',

  // Accumulators endpoint (single optimized endpoint for everything)
  ACCUMULATORS: {
    // Today's accumulators - gets all 4 categories in one call
    TODAY: '/accumulators/today',
  },

  // ML Predictions endpoints (legacy - keeping for fallback)
  ML_PREDICTIONS: {
    // Today's predictions endpoint
    TODAY: '/ml-predictions/today',
    // All categories endpoint
    CATEGORIES: '/ml-predictions/categories',
    // Models status endpoint
    MODELS_STATUS: '/ml-predictions/models/status',
  },

  // Fixtures endpoints (from API Football)
  FIXTURES: {
    // Daily fixtures
    DAILY: '/fixtures/apifootball/daily',
    // Live fixtures
    LIVE: '/fixtures/apifootball/live',
    // By date
    BY_DATE: (date: string) => `/fixtures/apifootball/daily?date=${date}`,
  },

  // Legacy predictions endpoints (now pointing to optimized accumulators)
  PREDICTIONS: {
    // Main endpoint for all categories (now uses accumulators)
    CATEGORIES: '/accumulators/today',
    // Best predictions endpoint (now uses accumulators)
    BEST: '/accumulators/today',
    // Category-specific endpoints
    CATEGORY_2_ODDS: '/predictions/category/2_odds/',
    CATEGORY_5_ODDS: '/predictions/category/5_odds/',
    CATEGORY_10_ODDS: '/predictions/category/10_odds/',
    CATEGORY_ROLLOVER: '/predictions/category/rollover/',
    // Best predictions for specific category
    BEST_CATEGORY: (category: string) => `/predictions/best/${category}/`,
    // Individual prediction
    DETAIL: (id: string | number) => `/predictions/${id}/`,
  },

  // Betting codes endpoints
  BETTING_CODES: {
    LIST: '/betting-codes/',
    LATEST: '/betting-codes/latest/',
    DETAIL: (id: string | number) => `/betting-codes/${id}/`,
    CREATE: '/betting-codes/',
    UPDATE: (id: string | number) => `/betting-codes/${id}/`,
    DELETE: (id: string | number) => `/betting-codes/${id}/`,
  },

  // Punters endpoints
  PUNTERS: {
    LIST: '/punters/',
    DETAIL: (id: string | number) => `/punters/${id}/`,
    CREATE: '/punters/',
    UPDATE: (id: string | number) => `/punters/${id}/`,
    DELETE: (id: string | number) => `/punters/${id}/`,
  },

  // Bookmakers endpoints
  BOOKMAKERS: {
    LIST: '/bookmakers/',
    DETAIL: (id: string | number) => `/bookmakers/${id}/`,
    CREATE: '/bookmakers/',
    UPDATE: (id: string | number) => `/bookmakers/${id}/`,
    DELETE: (id: string | number) => `/bookmakers/${id}/`,
  },



  // Dashboard endpoint
  DASHBOARD: '/dashboard/',
};

// API version
export const API_VERSION = 'v1';

// Whether to use mock data when API is unavailable (always false for real backend)
export const USE_MOCK_DATA = false;

// Cache configuration (respecting backend cache headers)
export const API_CACHE_CONFIG = {
  ENABLED: true,
  // Default cache duration (backend sets cache-control headers)
  TTL: parseInt(import.meta.env.VITE_CACHE_DURATION || '3600000'), // 1 hour default
  // Predictions cache (backend caches for 60 minutes)
  PREDICTIONS_TTL: 60 * 60 * 1000, // 1 hour
  // Betting codes cache
  BETTING_CODES_TTL: 5 * 60 * 1000, // 5 minutes
  // Static data cache
  PUNTERS_TTL: 30 * 60 * 1000, // 30 minutes
  BOOKMAKERS_TTL: 60 * 60 * 1000, // 1 hour
};

// Request headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

// Rate limiting configuration
export const RATE_LIMIT = {
  MAX_REQUESTS: 1000, // per hour
  RETRY_AFTER: 60000, // 1 minute
};

export default {
  API_BASE_URL,
  API_TIMEOUT,
  API_ENDPOINTS,
  API_VERSION,
  USE_MOCK_DATA,
  API_CACHE_CONFIG,
  DEFAULT_HEADERS,
  RATE_LIMIT,
};
