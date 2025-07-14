import { useEffect, useRef, useState, useCallback } from 'react';
import { useBreakpoints } from './useMediaQuery';
import { HapticInteractions } from '../utils/hapticFeedback';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  resistance?: number;
  enabled?: boolean;
}

interface PullToRefreshState {
  isPulling: boolean;
  pullDistance: number;
  isRefreshing: boolean;
  canRefresh: boolean;
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
  enabled = true
}: UsePullToRefreshOptions) => {
  const { isMobile } = useBreakpoints();
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    pullDistance: 0,
    isRefreshing: false,
    canRefresh: false
  });

  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || !isMobile || state.isRefreshing) return;
    
    const container = containerRef.current;
    if (!container) return;

    // Only trigger if we're at the top of the scroll container
    if (container.scrollTop > 0) return;

    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  }, [enabled, isMobile, state.isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging.current || !enabled || !isMobile || state.isRefreshing) return;

    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;

    currentY.current = e.touches[0].clientY;
    const pullDistance = Math.max(0, (currentY.current - startY.current) / resistance);

    if (pullDistance > 0) {
      e.preventDefault(); // Prevent default scroll behavior

      const wasCanRefresh = state.canRefresh;
      const nowCanRefresh = pullDistance >= threshold;

      // Trigger haptic feedback when crossing the threshold
      if (!wasCanRefresh && nowCanRefresh) {
        HapticInteractions.pullToRefresh();
      }

      setState(prev => ({
        ...prev,
        isPulling: true,
        pullDistance,
        canRefresh: nowCanRefresh
      }));
    }
  }, [enabled, isMobile, resistance, threshold, state.isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current || !enabled || !isMobile) return;

    isDragging.current = false;

    if (state.canRefresh && !state.isRefreshing) {
      // Trigger haptic feedback for refresh start
      HapticInteractions.refresh();

      setState(prev => ({
        ...prev,
        isRefreshing: true,
        isPulling: false,
        pullDistance: threshold
      }));

      try {
        await onRefresh();
        // Trigger success haptic feedback
        HapticInteractions.success();
      } catch (error) {
        console.error('Pull to refresh error:', error);
        // Trigger error haptic feedback
        HapticInteractions.error();
      } finally {
        setState(prev => ({
          ...prev,
          isRefreshing: false,
          pullDistance: 0,
          canRefresh: false
        }));
      }
    } else {
      setState(prev => ({
        ...prev,
        isPulling: false,
        pullDistance: 0,
        canRefresh: false
      }));
    }
  }, [enabled, isMobile, state.canRefresh, state.isRefreshing, threshold, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled || !isMobile) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, enabled, isMobile]);

  return {
    containerRef,
    ...state,
    pullProgress: Math.min(state.pullDistance / threshold, 1)
  };
};

export default usePullToRefresh;
