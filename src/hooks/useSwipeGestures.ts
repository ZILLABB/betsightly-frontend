import { useEffect, useRef, useCallback } from 'react';
import { useBreakpoints } from './useMediaQuery';
import { HapticInteractions } from '../utils/hapticFeedback';

interface UseSwipeGesturesOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  enabled?: boolean;
  enableHaptic?: boolean;
}

interface SwipeState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isSwipping: boolean;
}

export const useSwipeGestures = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  enabled = true,
  enableHaptic = true
}: UseSwipeGesturesOptions) => {
  const { isMobile } = useBreakpoints();
  const elementRef = useRef<HTMLDivElement>(null);
  const swipeState = useRef<SwipeState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isSwipping: false
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || !isMobile) return;

    const touch = e.touches[0];
    swipeState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isSwipping: true
    };
  }, [enabled, isMobile]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !isMobile || !swipeState.current.isSwipping) return;

    const touch = e.touches[0];
    swipeState.current.currentX = touch.clientX;
    swipeState.current.currentY = touch.clientY;
  }, [enabled, isMobile]);

  const handleTouchEnd = useCallback(() => {
    if (!enabled || !isMobile || !swipeState.current.isSwipping) return;

    const { startX, startY, currentX, currentY } = swipeState.current;
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Reset swipe state
    swipeState.current.isSwipping = false;

    // Check if the swipe distance meets the threshold
    if (Math.max(absDeltaX, absDeltaY) < threshold) {
      return;
    }

    // Determine swipe direction (prioritize the larger delta)
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (deltaX > 0) {
        // Swipe right
        if (enableHaptic) {
          HapticInteractions.swipeAction();
        }
        onSwipeRight?.();
      } else {
        // Swipe left
        if (enableHaptic) {
          HapticInteractions.swipeAction();
        }
        onSwipeLeft?.();
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        // Swipe down
        if (enableHaptic) {
          HapticInteractions.swipeAction();
        }
        onSwipeDown?.();
      } else {
        // Swipe up
        if (enableHaptic) {
          HapticInteractions.swipeAction();
        }
        onSwipeUp?.();
      }
    }
  }, [enabled, isMobile, threshold, enableHaptic, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled || !isMobile) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, enabled, isMobile]);

  return {
    elementRef,
    isSwipping: swipeState.current.isSwipping
  };
};

export default useSwipeGestures;
