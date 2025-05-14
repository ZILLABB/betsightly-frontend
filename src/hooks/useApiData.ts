import { useState, useEffect, useCallback } from 'react';

interface UseApiDataOptions<T> {
  /**
   * Initial data to use before the API call completes
   */
  initialData?: T;

  /**
   * Whether to fetch data immediately when the hook is called
   * @default true
   */
  fetchOnMount?: boolean;

  /**
   * Cache key to use for storing the data in localStorage
   * If not provided, caching will be disabled
   */
  cacheKey?: string;

  /**
   * Cache expiration time in milliseconds
   * @default 15 minutes
   */
  cacheExpiration?: number;

  /**
   * Whether to use cached data while fetching fresh data
   * @default true
   */
  useCacheWhileFetching?: boolean;

  /**
   * Callback to run when data is successfully fetched
   */
  onSuccess?: (data: T) => void;

  /**
   * Callback to run when an error occurs
   */
  onError?: (error: Error) => void;

  /**
   * Dependencies array for refetching data when values change
   */
  dependencies?: any[];
}

interface CachedData<T> {
  data: T;
  timestamp: number;
}

/**
 * Custom hook for fetching data from an API with caching, loading states, and error handling
 * @param fetchFn The function to call to fetch data
 * @param options Options for the hook
 * @returns An object with the data, loading state, error, and a function to refetch the data
 */
export function useApiData<T>(
  fetchFn: () => Promise<T>,
  options: UseApiDataOptions<T> = {}
) {
  const {
    initialData,
    fetchOnMount = true,
    cacheKey,
    cacheExpiration = 15 * 60 * 1000, // 15 minutes
    useCacheWhileFetching = true,
    onSuccess,
    onError,
    dependencies = [],
  } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState<boolean>(fetchOnMount);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);

  // Function to get data from cache
  const getFromCache = useCallback((): T | undefined => {
    if (!cacheKey) return undefined;

    try {
      const cachedDataString = localStorage.getItem(`betsightly_${cacheKey}`);
      if (!cachedDataString) return undefined;

      const cachedData: CachedData<T> = JSON.parse(cachedDataString);
      const now = Date.now();

      // Check if cache is expired
      if (now - cachedData.timestamp > cacheExpiration) {
        localStorage.removeItem(`betsightly_${cacheKey}`);
        return undefined;
      }

      return cachedData.data;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return undefined;
    }
  }, [cacheKey, cacheExpiration]);

  // Function to save data to cache
  const saveToCache = useCallback((data: T): void => {
    if (!cacheKey) return;

    try {
      const cachedData: CachedData<T> = {
        data,
        timestamp: Date.now(),
      };

      localStorage.setItem(`betsightly_${cacheKey}`, JSON.stringify(cachedData));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }, [cacheKey]);

  // Function to check if data is stale
  const checkIfDataIsStale = useCallback((): boolean => {
    if (!lastUpdated || !cacheKey) return true;

    const now = new Date();
    const timeDiff = now.getTime() - lastUpdated.getTime();

    if (timeDiff > cacheExpiration) {
      setIsStale(true);
      return true;
    }

    setIsStale(false);
    return false;
  }, [lastUpdated, cacheKey, cacheExpiration]);

  // Function to fetch data
  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Try to get data from cache first if useCacheWhileFetching is true
      if (useCacheWhileFetching && cacheKey) {
        const cachedData = getFromCache();
        if (cachedData) {
          setData(cachedData);
        }
      }

      // Fetch fresh data
      const freshData = await fetchFn();

      // Update state with fresh data
      setData(freshData);
      setLastUpdated(new Date());
      setIsStale(false);

      // Save to cache if cacheKey is provided
      if (cacheKey) {
        saveToCache(freshData);
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(freshData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);

      // Set error state
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);

      // Try to get data from cache as a fallback
      if (cacheKey) {
        const cachedData = getFromCache();
        if (cachedData) {
          setData(cachedData);
          setIsStale(true);
        } else {
          // If no cached data is available, throw the error
          throw error;
        }
      } else {
        // If no cache key is provided, throw the error
        throw error;
      }

      // Call onError callback if provided
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFn, cacheKey, getFromCache, saveToCache, useCacheWhileFetching, onSuccess, onError]);

  // Fetch data when the hook is mounted or dependencies change
  useEffect(() => {
    if (fetchOnMount) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchOnMount, ...dependencies]);

  // Check if data is stale periodically
  useEffect(() => {
    // Check initially
    checkIfDataIsStale();

    // Set up interval to check every minute
    const intervalId = setInterval(() => {
      checkIfDataIsStale();
    }, 60000); // 1 minute

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [checkIfDataIsStale]);

  return {
    data,
    loading,
    error,
    isStale,
    lastUpdated,
    refetch: fetchData,
  };
}

export default useApiData;
