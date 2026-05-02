import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Prediction } from '../types';
import {
  getAllBestPredictions,
  getAllCategoryPredictions,
  getRolloverPredictions
} from '../services/unifiedApiService';
import {
  getTodaysPredictions,
  getCategorizedPredictions,
  getModelsStatus
} from '../services/mlPredictionsService';
import {
  getTodaysAccumulators,
  clearAccumulatorsCache
} from '../services/accumulatorsService';
import { mockDataService } from '../services/mockDataService';
import { useToast } from '../hooks/useToast';

// Define the context state type
interface PredictionsState {
  // Prediction data
  allPredictions: Record<string, Prediction[]>;
  bestPredictions: Record<string, Prediction[]>;
  rolloverPredictions: Record<number, Prediction[]>;

  // Loading states
  loading: boolean;
  refreshing: boolean;

  // Error states
  error: string | null;

  // Filter states
  filters: {
    category: string | null;
    minOdds: number;
    maxOdds: number;
    minConfidence: number;
    searchQuery: string;
  };

  // Actions
  loadAllPredictions: () => Promise<void>;
  loadBestPredictions: () => Promise<void>;
  loadRolloverPredictions: (days?: number) => Promise<void>;
  refreshPredictions: () => Promise<void>;
  setFilter: (filterName: string, value: any) => void;
  resetFilters: () => void;

  // Derived data
  getFilteredPredictions: (category?: string) => Prediction[];
  getSortedPredictions: (predictions: Prediction[], sortBy: string, sortOrder: 'asc' | 'desc') => Prediction[];
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
};

// Provider component
export const PredictionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State for prediction data
  const [allPredictions, setAllPredictions] = useState<Record<string, Prediction[]>>({});
  const [bestPredictions, setBestPredictions] = useState<Record<string, Prediction[]>>({});
  const [rolloverPredictions, setRolloverPredictions] = useState<Record<number, Prediction[]>>({});

  // Loading and error states
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState({ ...defaultFilters });

  // Get toast notification function
  const { toast } = useToast();

  // Load all predictions
  const loadAllPredictions = useCallback(async () => {
    if (loading) return;

    try {
      setLoading(true);
      setError(null);

      // Try the optimized accumulators endpoint first
      try {
        const data = await getTodaysAccumulators();
        const totalPredictions = Object.values(data).reduce((sum, preds) => sum + preds.length, 0);

        if (totalPredictions > 0) {
          setAllPredictions(data);
          toast({
            title: 'Predictions loaded',
            description: `Loaded ${totalPredictions} predictions`,
            variant: 'success',
            duration: 3000
          });
          return;
        }
      } catch (accError) {
        console.error('Accumulators endpoint failed:', accError);
      }

      // Fallback to ML predictions endpoint
      try {
        const mlData = await getCategorizedPredictions();
        const mlTotal = Object.values(mlData).reduce((sum, preds) => sum + preds.length, 0);

        if (mlTotal > 0) {
          setAllPredictions(mlData);
          toast({
            title: 'Predictions loaded',
            description: `Loaded ${mlTotal} predictions`,
            variant: 'success',
            duration: 3000
          });
          return;
        }
      } catch (mlError) {
        console.error('ML predictions fallback failed:', mlError);
      }

      // Last resort: mock data
      const mockResponse = await mockDataService.getPredictionCategories();
      if (!mockResponse.data) {
        setError('No predictions available');
        return;
      }
      setAllPredictions(mockResponse.data);
    } catch (err) {
      console.error('Error loading predictions:', err);
      setError('Failed to load predictions');
      toast({
        title: 'Error',
        description: 'Failed to load predictions',
        variant: 'error',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load best predictions
  const loadBestPredictions = useCallback(async () => {
    // Derive from existing data if available
    const totalExisting = Object.values(allPredictions).reduce((sum, preds) => sum + preds.length, 0);
    if (totalExisting > 0) {
      const allPreds = Object.values(allPredictions).flat();
      const bestPreds = allPreds.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
      setBestPredictions(bestPreds);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      try {
        const data = await getTodaysAccumulators();
        const total = Object.values(data).reduce((sum, preds) => sum + preds.length, 0);
        if (total > 0) {
          setBestPredictions(data);
          return;
        }
      } catch (err) {
        console.error('Best predictions fetch failed:', err);
      }

      const mockResponse = await mockDataService.getBestPredictions();
      if (!mockResponse.data) {
        setError('No best predictions available');
        return;
      }
      setBestPredictions({ 'best': mockResponse.data });
    } catch (err) {
      console.error('Error loading best predictions:', err);
      setError('Failed to load best predictions');
    } finally {
      setLoading(false);
    }
  }, [allPredictions]);

  // Load rollover predictions
  const loadRolloverPredictions = useCallback(async (days = 10) => {
    try {
      setLoading(true);
      setError(null);

      const mockRolloverData: Record<number, Prediction[]> = {};

      if (allPredictions.rollover && allPredictions.rollover.length > 0) {
        for (let day = 1; day <= days; day++) {
          const dayPredictions = allPredictions.rollover.slice(0, Math.min(3, allPredictions.rollover.length));
          mockRolloverData[day] = dayPredictions.map(pred => ({
            ...pred,
            rolloverDay: day,
            id: pred.id + day * 1000
          }));
        }
      }

      setRolloverPredictions(mockRolloverData);
    } catch (err) {
      console.error('Error loading rollover predictions:', err);
      setError('Failed to load rollover predictions');
    } finally {
      setLoading(false);
    }
  }, [allPredictions]);

  // Refresh all predictions
  const refreshPredictions = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      clearAccumulatorsCache();

      await Promise.all([
        loadAllPredictions(),
        loadBestPredictions(),
        loadRolloverPredictions()
      ]);

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

    if (category === 'rollover' || filters.category === 'rollover') {
      predictionsToFilter = Object.values(rolloverPredictions).flat();
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

  // Force refresh function
  const forceRefresh = useCallback(async () => {
    clearAccumulatorsCache();
    setAllPredictions({ '2_odds': [], '5_odds': [], '10_odds': [], 'rollover': [] });
    setBestPredictions([]);
    setRolloverPredictions([]);
    await loadAllPredictions();
    await loadBestPredictions();
    await loadRolloverPredictions();
  }, [loadAllPredictions, loadBestPredictions, loadRolloverPredictions]);

  // Load initial data
  useEffect(() => {
    loadAllPredictions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Create the context value
  const contextValue: PredictionsState = {
    // Data
    allPredictions,
    bestPredictions,
    rolloverPredictions,

    // Loading states
    loading,
    refreshing,

    // Error state
    error,

    // Filters
    filters,

    // Actions
    loadAllPredictions,
    loadBestPredictions,
    loadRolloverPredictions,
    refreshPredictions,
    forceRefresh,
    setFilter,
    resetFilters,

    // Derived data
    getFilteredPredictions,
    getSortedPredictions
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
