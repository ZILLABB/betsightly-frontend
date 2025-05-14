import { renderHook, act } from '@testing-library/react';
import usePaginatedData from '../usePaginatedData';

// Mock the dependencies
jest.mock('../useDataFetching', () => {
  return jest.fn().mockImplementation(
    (fetchFunction, options) => {
      const { initialData = [], fetchOnMount = true, dependencies = [] } = options || {};
      
      return {
        data: initialData,
        isLoading: false,
        error: null,
        fetchData: jest.fn().mockImplementation(fetchFunction),
        setData: jest.fn(),
        reset: jest.fn()
      };
    }
  );
});

jest.mock('../usePagination', () => {
  return jest.fn().mockImplementation(
    (options) => {
      const { initialPage = 1, initialPageSize = 10, totalItems = 0 } = options || {};
      
      return {
        page: initialPage,
        pageSize: initialPageSize,
        totalPages: Math.ceil(totalItems / initialPageSize),
        setPage: jest.fn(),
        setPageSize: jest.fn(),
        nextPage: jest.fn(),
        previousPage: jest.fn(),
        firstPage: jest.fn(),
        lastPage: jest.fn()
      };
    }
  );
});

// Mock the error handler
jest.mock('../../utils/errorTracking', () => ({
  errorHandler: {
    trackError: jest.fn()
  }
}));

describe('usePaginatedData', () => {
  // Mock fetch function
  const mockFetchFunction = jest.fn().mockResolvedValue({
    data: [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }],
    totalItems: 2
  });
  
  // Mock callbacks
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with correct default values', () => {
    const { result } = renderHook(() => 
      usePaginatedData({
        fetchFunction: mockFetchFunction
      })
    );

    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.totalItems).toBe(0);
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(10);
    expect(result.current.filters).toBeUndefined();
  });

  it('initializes with custom values', () => {
    const initialFilters = { category: 'test' };
    
    const { result } = renderHook(() => 
      usePaginatedData({
        fetchFunction: mockFetchFunction,
        initialPage: 2,
        initialPageSize: 20,
        initialFilters
      })
    );

    expect(result.current.page).toBe(2);
    expect(result.current.pageSize).toBe(20);
    expect(result.current.filters).toEqual(initialFilters);
  });

  it('fetches data with correct parameters', async () => {
    const { result } = renderHook(() => 
      usePaginatedData({
        fetchFunction: mockFetchFunction,
        initialPage: 2,
        initialPageSize: 20,
        initialFilters: { category: 'test' }
      })
    );

    // Manually trigger fetch
    await act(async () => {
      await result.current.refresh();
    });

    // Check that fetch function was called with correct parameters
    expect(mockFetchFunction).toHaveBeenCalledWith(2, 20, { category: 'test' });
  });

  it('updates filters correctly', async () => {
    const { result } = renderHook(() => 
      usePaginatedData({
        fetchFunction: mockFetchFunction
      })
    );

    // Set filters
    act(() => {
      result.current.setFilters({ category: 'new' });
    });

    expect(result.current.filters).toEqual({ category: 'new' });
  });

  it('resets to initial state', () => {
    const initialFilters = { category: 'test' };
    
    const { result } = renderHook(() => 
      usePaginatedData({
        fetchFunction: mockFetchFunction,
        initialPage: 2,
        initialPageSize: 20,
        initialFilters
      })
    );

    // Change state
    act(() => {
      result.current.setFilters({ category: 'new' });
      result.current.setPage(3);
      result.current.setPageSize(30);
    });

    // Reset
    act(() => {
      result.current.reset();
    });

    // Should be back to initial state
    expect(result.current.filters).toEqual(initialFilters);
    expect(result.current.page).toBe(2);
    expect(result.current.pageSize).toBe(20);
  });

  it('calls success callback when data is fetched', async () => {
    const { result } = renderHook(() => 
      usePaginatedData({
        fetchFunction: mockFetchFunction,
        onSuccess: mockOnSuccess
      })
    );

    // Manually trigger fetch
    await act(async () => {
      await result.current.refresh();
    });

    // Success callback should be called with data and totalItems
    expect(mockOnSuccess).toHaveBeenCalledWith(
      [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }],
      2
    );
  });

  it('calls error callback when fetch fails', async () => {
    const mockErrorFetch = jest.fn().mockRejectedValue(new Error('Test error'));
    
    const { result } = renderHook(() => 
      usePaginatedData({
        fetchFunction: mockErrorFetch,
        onError: mockOnError
      })
    );

    // Manually trigger fetch
    await act(async () => {
      try {
        await result.current.refresh();
      } catch (error) {
        // Ignore error
      }
    });

    // Error callback should be called with error
    expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
  });
});
