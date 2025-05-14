import { renderHook, act } from '@testing-library/react';
import useDataFetching from '../useDataFetching';

describe('useDataFetching', () => {
  // Mock successful fetch function
  const mockSuccessFetch = jest.fn().mockResolvedValue({ data: 'test data' });
  
  // Mock error fetch function
  const mockErrorFetch = jest.fn().mockRejectedValue(new Error('Test error'));
  
  // Mock callbacks
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with correct initial state', () => {
    const { result } = renderHook(() => 
      useDataFetching(mockSuccessFetch, { 
        initialData: 'initial data',
        fetchOnMount: false
      })
    );

    expect(result.current.data).toBe('initial data');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetches data on mount when fetchOnMount is true', async () => {
    const { result, waitForNextUpdate } = renderHook(() => 
      useDataFetching(mockSuccessFetch, { 
        fetchOnMount: true
      })
    );

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    
    // Wait for fetch to complete
    await waitForNextUpdate();
    
    // After fetch completes
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual({ data: 'test data' });
    expect(result.current.error).toBeNull();
    expect(mockSuccessFetch).toHaveBeenCalledTimes(1);
  });

  it('does not fetch data on mount when fetchOnMount is false', () => {
    renderHook(() => 
      useDataFetching(mockSuccessFetch, { 
        fetchOnMount: false
      })
    );

    expect(mockSuccessFetch).not.toHaveBeenCalled();
  });

  it('handles successful data fetching', async () => {
    const { result } = renderHook(() => 
      useDataFetching(mockSuccessFetch, { 
        fetchOnMount: false,
        onSuccess: mockOnSuccess
      })
    );

    // Manually trigger fetch
    act(() => {
      result.current.fetchData();
    });

    // Should be loading
    expect(result.current.isLoading).toBe(true);
    
    // Wait for fetch to complete
    await act(async () => {
      await mockSuccessFetch();
    });
    
    // After fetch completes
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual({ data: 'test data' });
    expect(result.current.error).toBeNull();
    expect(mockOnSuccess).toHaveBeenCalledWith({ data: 'test data' });
  });

  it('handles fetch errors', async () => {
    const { result } = renderHook(() => 
      useDataFetching(mockErrorFetch, { 
        fetchOnMount: false,
        onError: mockOnError
      })
    );

    // Manually trigger fetch
    act(() => {
      result.current.fetchData();
    });

    // Should be loading
    expect(result.current.isLoading).toBe(true);
    
    // Wait for fetch to complete
    await act(async () => {
      try {
        await mockErrorFetch();
      } catch (error) {
        // Ignore error
      }
    });
    
    // After fetch fails
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Test error');
    expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('allows manual data setting', () => {
    const { result } = renderHook(() => 
      useDataFetching(mockSuccessFetch, { 
        fetchOnMount: false
      })
    );

    // Manually set data
    act(() => {
      result.current.setData('manual data');
    });

    expect(result.current.data).toBe('manual data');
  });

  it('resets state correctly', async () => {
    const { result } = renderHook(() => 
      useDataFetching(mockSuccessFetch, { 
        initialData: 'initial data',
        fetchOnMount: true
      })
    );

    // Wait for fetch to complete
    await act(async () => {
      await mockSuccessFetch();
    });
    
    // Data should be updated
    expect(result.current.data).toEqual({ data: 'test data' });
    
    // Reset state
    act(() => {
      result.current.reset();
    });
    
    // State should be reset
    expect(result.current.data).toBe('initial data');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('refetches when dependencies change', async () => {
    let dependency = 1;
    
    const { result, rerender } = renderHook(() => 
      useDataFetching(mockSuccessFetch, { 
        fetchOnMount: true,
        dependencies: [dependency]
      })
    );

    // Wait for initial fetch
    await act(async () => {
      await mockSuccessFetch();
    });
    
    // Change dependency and rerender
    dependency = 2;
    rerender();
    
    // Should trigger another fetch
    expect(mockSuccessFetch).toHaveBeenCalledTimes(2);
  });

  it('auto retries on error when configured', async () => {
    const { result } = renderHook(() => 
      useDataFetching(mockErrorFetch, { 
        fetchOnMount: true,
        autoRetry: true,
        maxRetries: 2,
        retryDelay: 100
      })
    );

    // Wait for initial fetch and retries
    await act(async () => {
      try {
        await mockErrorFetch();
      } catch (error) {
        // Ignore error
      }
      
      // Wait for retry delay
      await new Promise(resolve => setTimeout(resolve, 300));
    });
    
    // Should have tried 3 times (initial + 2 retries)
    expect(mockErrorFetch).toHaveBeenCalledTimes(3);
  });
});
