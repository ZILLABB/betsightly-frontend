/**
 * Virtualized List Component
 *
 * This component renders only the items that are visible in the viewport,
 * improving performance for long lists.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useBreakpoints } from '../../hooks/useMediaQuery';
import { errorHandler } from '../../utils/errorTracking';

interface VirtualizedListProps<T> {
  // Data
  items: T[];
  keyExtractor?: (item: T, index: number) => string;

  // Dimensions
  height: number | { mobile: number; tablet: number; desktop: number };
  itemHeight: number | { mobile: number; tablet: number; desktop: number };

  // Rendering
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;

  // Styling
  className?: string;
  itemClassName?: string;

  // Infinite scrolling
  onEndReached?: () => void;
  endReachedThreshold?: number;

  // Loading
  loading?: boolean;
  loadingComponent?: React.ReactNode;

  // Empty state
  emptyComponent?: React.ReactNode;

  // Scroll behavior
  scrollRestoration?: boolean;
  initialScrollIndex?: number;

  // Performance
  useWindowScroll?: boolean;
}

/**
 * Virtualized List Component
 */
function VirtualizedList<T>({
  // Data
  items,
  keyExtractor,

  // Dimensions
  height,
  itemHeight,

  // Rendering
  renderItem,
  overscan = 5,

  // Styling
  className = '',
  itemClassName = '',

  // Infinite scrolling
  onEndReached,
  endReachedThreshold = 0.8,

  // Loading
  loading = false,
  loadingComponent = <div className="p-4 text-center">Loading...</div>,

  // Empty state
  emptyComponent = (
    <div className="flex items-center justify-center h-full">
      <p className="text-[var(--muted-foreground)] text-sm">No items to display</p>
    </div>
  ),

  // Scroll behavior
  scrollRestoration = true,
  initialScrollIndex,

  // Performance
  useWindowScroll = false
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [hasCalledEndReached, setHasCalledEndReached] = useState(false);
  const { isMobile, isTablet, isDesktop } = useBreakpoints();
  const [scrollPosition, setScrollPosition] = useState<number | null>(null);
  const listId = useRef(`virtualized-list-${Math.random().toString(36).substring(2, 9)}`).current;

  // Determine the actual height based on screen size
  const getResponsiveValue = useCallback((value: number | { mobile: number; tablet: number; desktop: number }): number => {
    if (typeof value === 'number') {
      return value;
    }

    if (isMobile) return value.mobile;
    if (isTablet) return value.tablet;
    return value.desktop;
  }, [isMobile, isTablet]);

  const actualHeight = getResponsiveValue(height);
  const actualItemHeight = getResponsiveValue(itemHeight);

  // Calculate the range of visible items
  const totalHeight = items.length * actualItemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / actualItemHeight) - overscan);
  const visibleItemCount = Math.ceil(actualHeight / actualItemHeight) + 2 * overscan;
  const endIndex = Math.min(items.length - 1, startIndex + visibleItemCount);

  // Handle scroll events
  const handleScroll = () => {
    if (containerRef.current) {
      const currentScrollTop = containerRef.current.scrollTop;
      setScrollTop(currentScrollTop);

      // Save scroll position for restoration
      if (scrollRestoration) {
        sessionStorage.setItem(`${listId}-scroll`, currentScrollTop.toString());
      }

      // Check if we've reached the end
      if (onEndReached && !loading && !hasCalledEndReached) {
        const scrollPosition = currentScrollTop + containerRef.current.clientHeight;
        const threshold = totalHeight * endReachedThreshold;

        if (scrollPosition >= threshold) {
          setHasCalledEndReached(true);
          onEndReached();
        }
      }
    }
  };

  // Throttled scroll handler for better performance on mobile
  const throttledScrollHandler = useCallback(() => {
    let ticking = false;
    return () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
  }, [handleScroll]);

  // Reset the end reached flag when items change
  useEffect(() => {
    setHasCalledEndReached(false);
  }, [items.length]);

  // Restore scroll position when component mounts or items change
  useEffect(() => {
    if (scrollRestoration && containerRef.current) {
      const savedScrollTop = sessionStorage.getItem(`${listId}-scroll`);
      if (savedScrollTop) {
        containerRef.current.scrollTop = parseFloat(savedScrollTop);
        setScrollTop(parseFloat(savedScrollTop));
      }
    }
  }, [scrollRestoration, listId, items.length]);

  // Scroll to initial index if provided
  useEffect(() => {
    if (initialScrollIndex !== undefined && containerRef.current) {
      const scrollTo = initialScrollIndex * actualItemHeight;
      containerRef.current.scrollTop = scrollTo;
      setScrollTop(scrollTo);
    }
  }, [initialScrollIndex, actualItemHeight]);

  // Generate a key for each item
  const getItemKey = useCallback((item: T, index: number): string => {
    if (keyExtractor) {
      return keyExtractor(item, index);
    }

    // Default key extraction
    if (item && typeof item === 'object' && 'id' in item) {
      return String((item as any).id);
    }

    return `item-${index}`;
  }, [keyExtractor]);

  // Render only the visible items
  const visibleItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    if (i >= 0 && i < items.length) {
      try {
        visibleItems.push(
          <div
            key={getItemKey(items[i], i)}
            className={itemClassName}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${actualItemHeight}px`,
              transform: `translateY(${i * actualItemHeight}px)`,
              willChange: 'transform', // Optimization for mobile
              contain: 'content', // Optimization for mobile
            }}
            data-index={i}
          >
            {renderItem(items[i], i)}
          </div>
        );
      } catch (error) {
        // Handle rendering errors gracefully
        errorHandler.trackError(error instanceof Error ? error : new Error(String(error)), {
          component: 'VirtualizedList',
          itemIndex: i
        });

        // Render an error fallback
        visibleItems.push(
          <div
            key={`error-${i}`}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${actualItemHeight}px`,
              transform: `translateY(${i * actualItemHeight}px)`,
            }}
            data-index={i}
          >
            <div className="p-2 text-xs text-red-500 bg-red-500/10 rounded border border-red-500/20">
              Error rendering item
            </div>
          </div>
        );
      }
    }
  }

  // Create a memoized scroll handler
  const memoizedScrollHandler = useCallback(throttledScrollHandler(), [throttledScrollHandler]);

  // Intersection Observer for lazy loading images
  useEffect(() => {
    if ('IntersectionObserver' in window) {
      const options = {
        root: containerRef.current,
        rootMargin: '100px',
        threshold: 0.1
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Trigger any lazy loading needed for the item
            const index = parseInt(entry.target.getAttribute('data-index') || '0', 10);
            // You could dispatch an event or call a callback here
          }
        });
      }, options);

      // Observe all item elements
      const itemElements = containerRef.current?.querySelectorAll('[data-index]');
      itemElements?.forEach(el => observer.observe(el));

      return () => {
        itemElements?.forEach(el => observer.unobserve(el));
        observer.disconnect();
      };
    }
  }, [visibleItems.length]);

  return (
    <div
      id={listId}
      ref={containerRef}
      className={`virtualized-list-container overflow-auto overscroll-contain ${className}`}
      style={{
        height: `${actualHeight}px`,
        position: 'relative',
        WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
      }}
      onScroll={memoizedScrollHandler}
    >
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        {visibleItems}
      </div>
      {loading && loadingComponent}

      {/* Empty state for no items */}
      {items.length === 0 && !loading && emptyComponent}

      {/* Scroll to top button - only shown when scrolled down */}
      {scrollTop > actualHeight && (
        <button
          className="fixed bottom-4 right-4 bg-primary text-primary-foreground rounded-full p-2 shadow-lg z-10"
          onClick={() => {
            if (containerRef.current) {
              containerRef.current.scrollTop = 0;
              setScrollTop(0);
            }
          }}
          aria-label="Scroll to top"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m18 15-6-6-6 6"/>
          </svg>
        </button>
      )}
    </div>
  );
}

export default VirtualizedList;
