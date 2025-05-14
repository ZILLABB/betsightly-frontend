/**
 * Paginated Data Hook
 * 
 * This hook combines data fetching with pagination functionality.
 * It handles loading states, error handling, and pagination controls.
 */

import { useState, useCallback, useEffect } from "react";
import useDataFetching from "./useDataFetching";
import usePagination from "./usePagination";
import { errorHandler } from "../utils/errorTracking";

interface PaginatedDataOptions<T, F = any> {
  // Fetch function
  fetchFunction: (page: number, pageSize: number, filters?: F) => Promise<{
    data: T[];
    totalItems: number;
  }>;
  
  // Pagination options
  initialPage?: number;
  initialPageSize?: number;
  
  // Filtering options
  initialFilters?: F;
  
  // Callbacks
  onSuccess?: (data: T[], totalItems: number) => void;
  onError?: (error: Error) => void;
  
  // Auto-fetch options
  fetchOnMount?: boolean;
  dependencies?: any[];
}

interface PaginatedDataResult<T, F = any> {
  // Data and state
  data: T[];
  isLoading: boolean;
  error: Error | null;
  totalItems: number;
  
  // Pagination controls
  page: number;
  pageSize: number;
  totalPages: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  
  // Filtering
  filters: F | undefined;
  setFilters: (filters: F) => void;
  
  // Actions
  refresh: () => Promise<void>;
  reset: () => void;
}

/**
 * Hook for fetching paginated data with filtering
 */
function usePaginatedData<T, F = any>(
  options: PaginatedDataOptions<T, F>
): PaginatedDataResult<T, F> {
  // Extract options with defaults
  const {
    fetchFunction,
    initialPage = 1,
    initialPageSize = 10,
    initialFilters,
    onSuccess,
    onError,
    fetchOnMount = true,
    dependencies = []
  } = options;
  
  // State for filters
  const [filters, setFilters] = useState<F | undefined>(initialFilters);
  
  // State for total items
  const [totalItems, setTotalItems] = useState<number>(0);
  
  // Create the fetch function
  const fetchData = useCallback(async (page: number, pageSize: number) => {
    try {
      const result = await fetchFunction(page, pageSize, filters);
      setTotalItems(result.totalItems);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(result.data, result.totalItems);
      }
      
      return result.data;
    } catch (error) {
      // Handle error
      const typedError = error instanceof Error ? error : new Error(String(error));
      
      // Track error
      errorHandler.trackError(typedError, {
        page,
        pageSize,
        filters
      });
      
      // Call error callback if provided
      if (onError) {
        onError(typedError);
      }
      
      throw typedError;
    }
  }, [fetchFunction, filters, onSuccess, onError]);
  
  // Use pagination hook
  const pagination = usePagination({
    initialPage,
    initialPageSize,
    totalItems
  });
  
  // Use data fetching hook
  const {
    data,
    isLoading,
    error,
    fetchData: fetchDataWithState,
    reset: resetData
  } = useDataFetching<T[]>(
    () => fetchData(pagination.page, pagination.pageSize),
    {
      initialData: [],
      fetchOnMount,
      dependencies: [pagination.page, pagination.pageSize, filters, ...dependencies]
    }
  );
  
  // Handle filter changes
  useEffect(() => {
    // Reset to first page when filters change
    if (pagination.page !== 1) {
      pagination.setPage(1);
    }
  }, [filters]);
  
  // Refresh function
  const refresh = useCallback(async () => {
    await fetchDataWithState();
  }, [fetchDataWithState]);
  
  // Reset function
  const reset = useCallback(() => {
    setFilters(initialFilters);
    pagination.setPage(1);
    pagination.setPageSize(initialPageSize);
    resetData();
  }, [initialFilters, initialPageSize, pagination, resetData]);
  
  return {
    // Data and state
    data,
    isLoading,
    error,
    totalItems,
    
    // Pagination controls
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: pagination.totalPages,
    setPage: pagination.setPage,
    setPageSize: pagination.setPageSize,
    nextPage: pagination.nextPage,
    previousPage: pagination.previousPage,
    firstPage: pagination.firstPage,
    lastPage: pagination.lastPage,
    
    // Filtering
    filters,
    setFilters,
    
    // Actions
    refresh,
    reset
  };
}

export default usePaginatedData;
