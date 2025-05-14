/**
 * useOfflineData Hook
 *
 * This hook provides offline-first data fetching capabilities:
 * 1. Tries to fetch data from the network first
 * 2. Falls back to cached data if network request fails
 * 3. Updates the cache when new data is fetched
 * 4. Provides methods to manually refresh data
 */

import React, { useState, useEffect, useCallback } from 'react';
import { usePWA } from '../components/common/PWAProvider';
import { localStorageCache, CACHE_TTL } from '../utils/cacheUtils';

interface UseOfflineDataOptions<T> {
  cacheKey: string;
  fetchFn: () => Promise<T>;
  initialData?: T;
  cacheTTL?: number;
  dependencies?: any[];
}

interface UseOfflineDataResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  isStale: boolean;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useOfflineData<T>({
  cacheKey,
  fetchFn,
  initialData = null,
  cacheTTL = CACHE_TTL.MEDIUM,
  dependencies = [],
}: UseOfflineDataOptions<T>): UseOfflineDataResult<T> {
  // State
  const [data, setData] = useState<T | null>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Get online status from PWA context
  const { isOnline } = usePWA();

  // Check if cache is stale
  const checkCacheStatus = useCallback(() => {
    const cachedData = localStorageCache.get<{ data: T; timestamp: number }>(cacheKey);
    if (!cachedData) return false;

    const now = Date.now();
    const timestamp = cachedData.timestamp;
    const age = now - timestamp;

    // If cache is older than TTL, mark as stale
    if (age > cacheTTL * 1000) {
      setIsStale(true);
      return true;
    }

    setIsStale(false);
    return false;
  }, [cacheKey, cacheTTL]);

  // Load data from cache
  const loadFromCache = useCallback(() => {
    const cachedData = localStorageCache.get<{ data: T; timestamp: number }>(cacheKey);
    if (cachedData) {
      setData(cachedData.data);
      setLastUpdated(new Date(cachedData.timestamp));
      checkCacheStatus();
      return true;
    }
    return false;
  }, [cacheKey, checkCacheStatus]);

  // Save data to cache
  const saveToCache = useCallback((data: T) => {
    const timestamp = Date.now();
    localStorageCache.set(
      cacheKey,
      { data, timestamp },
      cacheTTL
    );
    setLastUpdated(new Date(timestamp));
    setIsStale(false);
  }, [cacheKey, cacheTTL]);

  // Fetch data from network
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to fetch from network
      const result = await fetchFn();
      setData(result);
      saveToCache(result);
      return true;
    } catch (err) {
      // If network fetch fails, try to load from cache
      const loadedFromCache = loadFromCache();

      // If we couldn't load from cache either, set error
      if (!loadedFromCache) {
        setError(err instanceof Error ? err : new Error('Failed to fetch data'));
      }

      return loadedFromCache;
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, loadFromCache, saveToCache]);

  // Refresh data (manual trigger)
  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Initial data loading
  useEffect(() => {
    // First try to load from cache for immediate display
    const hasCache = loadFromCache();

    // If online, fetch fresh data
    if (isOnline) {
      fetchData();
    } else if (!hasCache) {
      // If offline and no cache, set error
      setError(new Error('You are offline and no cached data is available'));
      setIsLoading(false);
    } else {
      // If offline but has cache, just stop loading
      setIsLoading(false);
    }
  }, [isOnline, loadFromCache, fetchData, ...dependencies]);

  // Return the hook result
  return {
    data,
    isLoading,
    error,
    isStale,
    refresh,
    lastUpdated,
  };
}
