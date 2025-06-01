import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Prediction } from '../types';
import {
  getAllBestPredictions,
  getAllCategoryPredictions,
  getRolloverPredictions
} from '../services/unifiedApiService';
import { getBasketballPredictions, type BasketballPrediction } from '../services/basketballApiService';
import { getEnhancedPredictions, type EnhancedPrediction } from '../services/enhancedPredictionService';
import { AUTO_REFRESH_CONFIG } from '../config/apiConfig';
import { useToast } from '../hooks/useToast';

// Define the context state type
interface PredictionsState {
  // Prediction data
  allPredictions: Record<string, Prediction[]>;
  bestPredictions: Record<string, Prediction[]>;
  rolloverPredictions: Record<number, Prediction[]>;
  basketballPredictions: BasketballPrediction[];
  enhancedPredictions: EnhancedPrediction[];

  // Loading states
  loading: boolean;
  refreshing: boolean;
  basketballLoading: boolean;
  enhancedLoading: boolean;

  // Error states
  error: string | null;
  basketballError: string | null;
  enhancedError: string | null;

  // Auto-refresh states
  autoRefreshEnabled: boolean;
  lastRefresh: Date | null;

  // Filter states
  filters: {
    category: string | null;
    minOdds: number;
    maxOdds: number;
    minConfidence: number;
    searchQuery: string;
    sport: 'football' | 'basketball' | 'all';
  };

  // Actions
  loadAllPredictions: () => Promise<void>;
  loadBestPredictions: () => Promise<void>;
  loadRolloverPredictions: (days?: number) => Promise<void>;
  loadBasketballPredictions: (options?: { date?: string; confidence?: number }) => Promise<void>;
  loadEnhancedPredictions: (options?: { category?: string; explanations?: boolean }) => Promise<void>;
  refreshPredictions: () => Promise<void>;
  refreshAllData: () => Promise<void>;
  setFilter: (filterName: string, value: any) => void;
  resetFilters: () => void;
  toggleAutoRefresh: () => void;

  // Derived data
  getFilteredPredictions: (category?: string) => Prediction[];
  getSortedPredictions: (predictions: Prediction[], sortBy: string, sortOrder: 'asc' | 'desc') => Prediction[];
  getBasketballPredictions: () => BasketballPrediction[];
  getEnhancedPredictions: (category?: string) => EnhancedPrediction[];
}

// Create the context with a default value
const PredictionsContext = createContext<PredictionsState | undefined>(undefined);

// Default filter values
const defaultFilters = {
  category: null,
  minOdds: 1.0,
  maxOdds: 10.0,
  minConfidence: 0,
  searchQuery: '',
  sport: 'all' as const,
};

// Provider component
export const PredictionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State for prediction data
  const [allPredictions, setAllPredictions] = useState<Record<string, Prediction[]>>({});
  const [bestPredictions, setBestPredictions] = useState<Record<string, Prediction[]>>({});
  const [rolloverPredictions, setRolloverPredictions] = useState<Record<number, Prediction[]>>({});
  const [basketballPredictions, setBasketballPredictions] = useState<BasketballPrediction[]>([]);
  const [enhancedPredictions, setEnhancedPredictions] = useState<EnhancedPrediction[]>([]);

  // Loading and error states
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [basketballLoading, setBasketballLoading] = useState<boolean>(false);
  const [enhancedLoading, setEnhancedLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [basketballError, setBasketballError] = useState<string | null>(null);
  const [enhancedError, setEnhancedError] = useState<string | null>(null);

  // State for auto-refresh
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(AUTO_REFRESH_CONFIG.ENABLED);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // Filter state
  const [filters, setFilters] = useState({ ...defaultFilters });

  // Get toast notification function
  const { toast } = useToast();

  // Load basketball predictions
  const loadBasketballPredictions = useCallback(async (options: { date?: string; confidence?: number } = {}) => {
    try {
      setBasketballLoading(true);
      setBasketballError(null);

      console.log("Loading basketball predictions from context");
      const data = await getBasketballPredictions(options);
      console.log("Basketball predictions data:", data);

      setBasketballPredictions(data.predictions);
      console.log("Basketball predictions set successfully");
    } catch (error) {
      console.error('Error loading basketball predictions:', error);
      setBasketballError('Failed to load basketball predictions');
    } finally {
      setBasketballLoading(false);
    }
  }, []);

  // Load enhanced predictions
  const loadEnhancedPredictions = useCallback(async (options: { category?: string; explanations?: boolean } = {}) => {
    try {
      setEnhancedLoading(true);
      setEnhancedError(null);

      console.log("Loading enhanced predictions from context");
      const data = await getEnhancedPredictions(options);
      console.log("Enhanced predictions data:", data);

      setEnhancedPredictions(data.predictions);
      console.log("Enhanced predictions set successfully");
    } catch (error) {
      console.error('Error loading enhanced predictions:', error);
      setEnhancedError('Failed to load enhanced predictions');
    } finally {
      setEnhancedLoading(false);
    }
  }, []);

  // Load all predictions
  const loadAllPredictions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Loading all predictions from context");
      const data = await getAllCategoryPredictions();
      console.log("All predictions data:", data);

      // Always set the data, even if empty - this is not an error condition
      setAllPredictions(data || {});
      console.log("All predictions set successfully");

      const categoryCount = Object.keys(data || {}).length;
      if (categoryCount > 0) {
        toast({
          title: 'Predictions loaded',
          description: `Loaded predictions for ${categoryCount} categories`,
          variant: 'success',
          duration: 3000
        });
      }
    } catch (err) {
      console.error('Error loading all predictions:', err);

      // Handle different types of errors
      let errorMessage = 'Failed to load predictions';
      if (err instanceof Error && err.name === 'TimeoutError') {
        errorMessage = 'Prediction service timeout. ML models may be processing data.';
      } else if (err instanceof Error && err.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to prediction service.';
      }

      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'error',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load best predictions
  const loadBestPredictions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Loading best predictions from context");
      const data = await getAllBestPredictions();
      console.log("Best predictions data received");

      // Always set the data, even if empty - this is not an error condition
      setBestPredictions(data || {});

      // Check if any category has predictions
      const totalPredictions = Object.values(data || {}).reduce((total, categoryPredictions) => {
        return total + (Array.isArray(categoryPredictions) ? categoryPredictions.length : 0);
      }, 0);

      if (totalPredictions === 0) {
        console.log('API returned empty prediction data - this is normal when no predictions are available');
      } else {
        console.log(`Loaded ${totalPredictions} predictions across all categories`);
      }

      console.log("Best predictions set successfully");
    } catch (err) {
      console.error('Error loading best predictions:', err);

      // Handle different types of errors
      if (err instanceof Error && err.name === 'TimeoutError') {
        setError('Prediction service is taking longer than expected. The ML models may be processing data. Please try again in a moment.');
      } else if (err instanceof Error && err.message.includes('Failed to fetch')) {
        setError('Unable to connect to prediction service. Please check your connection and try again.');
      } else {
        setError('Failed to load best predictions. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load rollover predictions
  const loadRolloverPredictions = useCallback(async (days = 10) => {
    try {
      setLoading(true);
      setError(null);

      console.log("Loading rollover predictions from context");
      const data = await getRolloverPredictions(days);
      console.log("Rollover predictions data:", data);

      // Always set the data, even if empty - this is not an error condition
      setRolloverPredictions(data || {});
      console.log("Rollover predictions set successfully");
    } catch (err) {
      console.error('Error loading rollover predictions:', err);
      setError('Failed to load rollover predictions');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh all predictions
  const refreshPredictions = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);

      toast({
        title: 'Refreshing predictions',
        description: 'Getting the latest data...',
        variant: 'info',
        duration: 2000
      });

      // Load all types of predictions
      const [allData, bestData, rolloverData] = await Promise.all([
        getAllCategoryPredictions(),
        getAllBestPredictions(),
        getRolloverPredictions()
      ]);

      // Update state with new data
      setAllPredictions(allData);
      setBestPredictions(bestData);
      setRolloverPredictions(rolloverData);

      toast({
        title: 'Predictions refreshed',
        description: 'All prediction data has been updated',
        variant: 'success',
        duration: 3000
      });
    } catch (err) {
      console.error('Error refreshing predictions:', err);
      setError('Failed to refresh predictions');
      toast({
        title: 'Error',
        description: 'Failed to refresh predictions',
        variant: 'error',
        duration: 5000
      });
    } finally {
      setRefreshing(false);
    }
  }, [toast]);

  // Set a specific filter
  const setFilter = useCallback((filterName: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  }, []);

  // Reset all filters to default values
  const resetFilters = useCallback(() => {
    setFilters({ ...defaultFilters });
  }, []);

  // Get filtered predictions for a specific category or all categories
  const getFilteredPredictions = useCallback((category?: string) => {
    // Determine which predictions to use
    let predictionsToFilter: Prediction[] = [];

    // Special handling for rollover category
    if (category === 'rollover' || filters.category === 'rollover') {
      // If we're specifically looking for rollover predictions, use the rollover data
      // Convert the rollover predictions object to an array
      const rolloverArray = Object.values(rolloverPredictions).flat();
      console.log('Using rollover predictions:', rolloverArray.length);
      predictionsToFilter = rolloverArray;
    } else if (category) {
      // Use predictions from a specific category
      predictionsToFilter = allPredictions[category] || [];
    } else if (filters.category) {
      // Use predictions from the filtered category
      predictionsToFilter = allPredictions[filters.category] || [];
    } else {
      // Use all predictions flattened into a single array
      predictionsToFilter = Object.values(allPredictions).flat();
    }

    // Apply filters
    return predictionsToFilter.filter(prediction => {
      // Filter by odds
      const odds = prediction.odds || 0;
      if (odds < filters.minOdds || odds > filters.maxOdds) {
        return false;
      }

      // Filter by confidence
      const confidence = prediction.confidence || 0;
      if (confidence < filters.minConfidence) {
        return false;
      }

      // Filter by search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();

        // Safely get team names with proper type checking
        let homeTeam = '';
        if (prediction.game?.homeTeam) {
          if (typeof prediction.game.homeTeam === 'string') {
            homeTeam = prediction.game.homeTeam.toLowerCase();
          } else if (prediction.game.homeTeam.name) {
            homeTeam = prediction.game.homeTeam.name.toLowerCase();
          }
        }

        let awayTeam = '';
        if (prediction.game?.awayTeam) {
          if (typeof prediction.game.awayTeam === 'string') {
            awayTeam = prediction.game.awayTeam.toLowerCase();
          } else if (prediction.game.awayTeam.name) {
            awayTeam = prediction.game.awayTeam.name.toLowerCase();
          }
        }

        const league = (prediction.game?.league || '').toLowerCase();
        const predictionType = (prediction.predictionType || '').toLowerCase();

        if (!homeTeam.includes(query) &&
            !awayTeam.includes(query) &&
            !league.includes(query) &&
            !predictionType.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [allPredictions, rolloverPredictions, filters]);

  // Sort predictions by a specific field
  const getSortedPredictions = useCallback((predictions: Prediction[], sortBy: string, sortOrder: 'asc' | 'desc') => {
    return [...predictions].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      // Extract the values to compare based on sortBy
      switch (sortBy) {
        case 'odds':
          valueA = a.odds || 0;
          valueB = b.odds || 0;
          break;
        case 'confidence':
          valueA = a.confidence || 0;
          valueB = b.confidence || 0;
          break;
        case 'time':
          valueA = a.game?.startTime ? new Date(a.game.startTime).getTime() : 0;
          valueB = b.game?.startTime ? new Date(b.game.startTime).getTime() : 0;
          break;
        default:
          return 0;
      }

      // Apply sort order
      return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    });
  }, []);

  // Get basketball predictions
  const getBasketballPredictions = useCallback(() => {
    return basketballPredictions;
  }, [basketballPredictions]);

  // Get enhanced predictions
  const getEnhancedPredictions = useCallback((category?: string) => {
    if (category) {
      return enhancedPredictions.filter(pred =>
        pred.predictionType?.toLowerCase().includes(category.toLowerCase())
      );
    }
    return enhancedPredictions;
  }, [enhancedPredictions]);

  // Refresh all data
  const refreshAllData = useCallback(async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        loadAllPredictions(),
        loadBestPredictions(),
        loadRolloverPredictions(),
        loadBasketballPredictions(),
        loadEnhancedPredictions()
      ]);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error refreshing all data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadAllPredictions, loadBestPredictions, loadRolloverPredictions, loadBasketballPredictions, loadEnhancedPredictions]);

  // Toggle auto-refresh
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled(prev => !prev);
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefreshEnabled && AUTO_REFRESH_CONFIG.ENABLED) {
      console.log('Starting auto-refresh with interval:', AUTO_REFRESH_CONFIG.PREDICTIONS_INTERVAL);

      autoRefreshInterval.current = setInterval(() => {
        console.log('Auto-refreshing predictions...');
        refreshAllData();
      }, AUTO_REFRESH_CONFIG.PREDICTIONS_INTERVAL);

      return () => {
        if (autoRefreshInterval.current) {
          clearInterval(autoRefreshInterval.current);
          autoRefreshInterval.current = null;
        }
      };
    }
  }, [autoRefreshEnabled, refreshAllData]);

  // Load initial data
  useEffect(() => {
    loadAllPredictions();
    loadBestPredictions();
    loadRolloverPredictions();
  }, [loadAllPredictions, loadBestPredictions, loadRolloverPredictions]);

  // Create the context value
  const contextValue: PredictionsState = {
    // Data
    allPredictions,
    bestPredictions,
    rolloverPredictions,
    basketballPredictions,
    enhancedPredictions,

    // Loading states
    loading,
    refreshing,
    basketballLoading,
    enhancedLoading,

    // Error states
    error,
    basketballError,
    enhancedError,

    // Auto-refresh states
    autoRefreshEnabled,
    lastRefresh,

    // Filters
    filters,

    // Actions
    loadAllPredictions,
    loadBestPredictions,
    loadRolloverPredictions,
    loadBasketballPredictions,
    loadEnhancedPredictions,
    refreshPredictions,
    refreshAllData,
    setFilter,
    resetFilters,
    toggleAutoRefresh,

    // Derived data
    getFilteredPredictions,
    getSortedPredictions,
    getBasketballPredictions,
    getEnhancedPredictions
  };

  return (
    <PredictionsContext.Provider value={contextValue}>
      {children}
    </PredictionsContext.Provider>
  );
};

// Custom hook to use the predictions context
export const usePredictions = () => {
  const context = useContext(PredictionsContext);
  if (context === undefined) {
    throw new Error('usePredictions must be used within a PredictionsProvider');
  }
  return context;
};

export default PredictionsContext;
