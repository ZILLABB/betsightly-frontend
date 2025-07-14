import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Prediction } from '../types';
import {
  getAllBestPredictions,
  getAllCategoryPredictions,
  getRolloverPredictions
} from '../services/unifiedApiService';
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
    try {
      setLoading(true);
      setError(null);

      console.log("Loading all predictions from context");

      // Since we're not running the backend, directly use mock data
      console.log("Loading mock predictions data");
      const mockResponse = await mockDataService.getPredictionCategories();

      if (!mockResponse.data) {
        console.error('No mock data available');
        setError('No predictions available');
        return;
      }

      const data = mockResponse.data;
      setAllPredictions(data);
      console.log("✅ Categories loaded:", Object.keys(data).map(key => `${key}: ${data[key].length} items`).join(', '));

      toast({
        title: 'Predictions loaded',
        description: `Loaded predictions for ${Object.keys(data).length} categories`,
        variant: 'success',
        duration: 3000
      });
    } catch (err) {
      console.error('Error loading all predictions:', err);
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
    try {
      setLoading(true);
      setError(null);

      console.log("Loading best predictions from context");

      // Since we're not running the backend, directly use mock data
      console.log("Loading mock best predictions");
      const mockResponse = await mockDataService.getBestPredictions();
      if (!mockResponse.data) {
        console.error('No mock best predictions available');
        setError('No best predictions available');
        return;
      }

      // Convert array to the expected format
      const data = { 'best': mockResponse.data };
      console.log("Best predictions loaded:", data.best.length, "items");

      if (!data || Object.keys(data).length === 0) {
        console.error('No best predictions available');
        setError('No best predictions available');
        return;
      }

      setBestPredictions(data);
      console.log("Best predictions set:", data);
    } catch (err) {
      console.error('Error loading best predictions:', err);
      setError('Failed to load best predictions');
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

      // Since we're not running the backend, use mock data directly
      // Generate rollover predictions for the specified number of days
      const mockRolloverData: Record<number, Prediction[]> = {};

      // Get rollover predictions from allPredictions if available
      if (allPredictions.rollover && allPredictions.rollover.length > 0) {
        // Distribute rollover predictions across days
        for (let day = 1; day <= days; day++) {
          const dayPredictions = allPredictions.rollover.slice(0, Math.min(3, allPredictions.rollover.length));
          mockRolloverData[day] = dayPredictions.map(pred => ({
            ...pred,
            rolloverDay: day,
            id: pred.id + day * 1000 // Ensure unique IDs
          }));
        }
      } else {
        console.warn('No rollover predictions available in allPredictions');
      }

      console.log("Rollover predictions data:", mockRolloverData);
      setRolloverPredictions(mockRolloverData);
      console.log("Rollover predictions set successfully");
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

      toast({
        title: 'Refreshing predictions',
        description: 'Getting the latest data...',
        variant: 'info',
        duration: 2000
      });

      // Since we're not running the backend, refresh with mock data
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
