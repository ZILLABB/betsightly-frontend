import { renderHook, act } from '@testing-library/react';
import usePagination from '../usePagination';

describe('usePagination', () => {
  it('initializes with correct default values', () => {
    const { result } = renderHook(() => usePagination());

    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(10);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.startIndex).toBe(0);
    expect(result.current.endIndex).toBe(-1); // No items
    expect(result.current.hasNextPage).toBe(false);
    expect(result.current.hasPreviousPage).toBe(false);
  });

  it('initializes with custom values', () => {
    const { result } = renderHook(() => 
      usePagination({
        initialPage: 2,
        initialPageSize: 20,
        totalItems: 100
      })
    );

    expect(result.current.page).toBe(2);
    expect(result.current.pageSize).toBe(20);
    expect(result.current.totalPages).toBe(5); // 100 items / 20 per page = 5 pages
    expect(result.current.startIndex).toBe(20); // (2-1) * 20 = 20
    expect(result.current.endIndex).toBe(39); // 20 + 20 - 1 = 39
    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.hasPreviousPage).toBe(true);
  });

  it('calculates indices correctly', () => {
    const { result } = renderHook(() => 
      usePagination({
        initialPage: 3,
        initialPageSize: 15,
        totalItems: 100
      })
    );

    expect(result.current.startIndex).toBe(30); // (3-1) * 15 = 30
    expect(result.current.endIndex).toBe(44); // 30 + 15 - 1 = 44
  });

  it('handles page navigation correctly', () => {
    const { result } = renderHook(() => 
      usePagination({
        initialPage: 2,
        initialPageSize: 10,
        totalItems: 100
      })
    );

    // Next page
    act(() => {
      result.current.nextPage();
    });
    expect(result.current.page).toBe(3);

    // Previous page
    act(() => {
      result.current.previousPage();
    });
    expect(result.current.page).toBe(2);

    // First page
    act(() => {
      result.current.firstPage();
    });
    expect(result.current.page).toBe(1);

    // Last page
    act(() => {
      result.current.lastPage();
    });
    expect(result.current.page).toBe(10); // 100 items / 10 per page = 10 pages
  });

  it('prevents navigation beyond boundaries', () => {
    const { result } = renderHook(() => 
      usePagination({
        initialPage: 1,
        initialPageSize: 10,
        totalItems: 30
      })
    );

    // Try to go to previous page when on first page
    act(() => {
      result.current.previousPage();
    });
    expect(result.current.page).toBe(1); // Should stay on first page

    // Go to last page
    act(() => {
      result.current.lastPage();
    });
    expect(result.current.page).toBe(3); // 30 items / 10 per page = 3 pages

    // Try to go to next page when on last page
    act(() => {
      result.current.nextPage();
    });
    expect(result.current.page).toBe(3); // Should stay on last page
  });

  it('sets page safely within bounds', () => {
    const { result } = renderHook(() => 
      usePagination({
        initialPage: 1,
        initialPageSize: 10,
        totalItems: 30
      })
    );

    // Try to set page to 0 (below minimum)
    act(() => {
      result.current.setPage(0);
    });
    expect(result.current.page).toBe(1); // Should be clamped to 1

    // Try to set page to 5 (above maximum)
    act(() => {
      result.current.setPage(5);
    });
    expect(result.current.page).toBe(3); // Should be clamped to 3 (max pages)

    // Set page to valid value
    act(() => {
      result.current.setPage(2);
    });
    expect(result.current.page).toBe(2);
  });

  it('handles page size changes correctly', () => {
    const { result } = renderHook(() => 
      usePagination({
        initialPage: 5,
        initialPageSize: 10,
        totalItems: 100
      })
    );

    // Initially on page 5 with 10 items per page (items 41-50)
    expect(result.current.startIndex).toBe(40);

    // Change page size to 20
    act(() => {
      result.current.setPageSize(20);
    });

    // Should adjust page to keep same items visible
    // With 20 items per page, items 41-50 would be on page 3
    expect(result.current.page).toBe(3);
    expect(result.current.pageSize).toBe(20);
    expect(result.current.totalPages).toBe(5); // 100 items / 20 per page = 5 pages
  });

  it('generates visible pages correctly', () => {
    const { result } = renderHook(() => 
      usePagination({
        initialPage: 5,
        initialPageSize: 10,
        totalItems: 100
      })
    );

    // Get visible pages with default max (5)
    const visiblePages = result.current.getVisiblePages();
    expect(visiblePages).toEqual([3, 4, 5, 6, 7]);

    // Get visible pages with custom max
    const visiblePages2 = result.current.getVisiblePages(3);
    expect(visiblePages2).toEqual([4, 5, 6]);

    // Test edge case (first page)
    act(() => {
      result.current.setPage(1);
    });
    const visiblePagesStart = result.current.getVisiblePages(5);
    expect(visiblePagesStart).toEqual([1, 2, 3, 4, 5]);

    // Test edge case (last page)
    act(() => {
      result.current.setPage(10);
    });
    const visiblePagesEnd = result.current.getVisiblePages(5);
    expect(visiblePagesEnd).toEqual([6, 7, 8, 9, 10]);
  });

  it('handles small total pages correctly', () => {
    const { result } = renderHook(() => 
      usePagination({
        initialPage: 1,
        initialPageSize: 10,
        totalItems: 25
      })
    );

    expect(result.current.totalPages).toBe(3);
    
    // Get visible pages when total pages is less than max visible
    const visiblePages = result.current.getVisiblePages(5);
    expect(visiblePages).toEqual([1, 2, 3]);
  });
});
