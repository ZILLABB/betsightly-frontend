/**
 * StableLayout Component
 * 
 * This component helps prevent Cumulative Layout Shift (CLS) by:
 * 1. Reserving space for content that might change height
 * 2. Using min-height to ensure the container doesn't collapse
 * 3. Providing a skeleton placeholder while content is loading
 * 
 * Use this component for:
 * - Dynamic content that might change height
 * - Content that loads asynchronously
 * - Elements that might appear/disappear
 */

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../utils/classNames';

interface StableLayoutProps {
  /** Content to render */
  children: React.ReactNode;
  /** Minimum height to reserve (in pixels or CSS value) */
  minHeight?: string | number;
  /** Whether content is loading */
  isLoading?: boolean;
  /** Custom skeleton component to show while loading */
  skeleton?: React.ReactNode;
  /** Whether to measure and adapt to content height */
  adaptiveHeight?: boolean;
  /** Additional CSS class names */
  className?: string;
  /** Whether to animate height changes */
  animateHeight?: boolean;
  /** Data attribute for tracking CLS */
  'data-cls-element'?: string;
}

const StableLayout: React.FC<StableLayoutProps> = ({
  children,
  minHeight,
  isLoading = false,
  skeleton,
  adaptiveHeight = false,
  className,
  animateHeight = true,
  'data-cls-element': clsElement,
  ...props
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const [previousHeight, setPreviousHeight] = useState<number | null>(null);
  
  // Convert minHeight to a CSS value
  const minHeightValue = typeof minHeight === 'number' ? `${minHeight}px` : minHeight;
  
  // Measure content height when it changes
  useEffect(() => {
    if (adaptiveHeight && contentRef.current) {
      // Store previous height before updating
      if (contentHeight !== null) {
        setPreviousHeight(contentHeight);
      }
      
      // Use ResizeObserver to track content height changes
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          const height = entry.contentRect.height;
          if (height > 0) {
            setContentHeight(height);
          }
        }
      });
      
      resizeObserver.observe(contentRef.current);
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [adaptiveHeight, children]);
  
  // Determine the height to use
  const heightToUse = adaptiveHeight 
    ? Math.max(contentHeight || 0, previousHeight || 0, minHeight ? parseFloat(minHeightValue || '0') : 0) 
    : minHeightValue;
  
  // Default skeleton if none provided
  const defaultSkeleton = (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2.5"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2.5"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
    </div>
  );
  
  return (
    <div 
      className={cn(
        "relative",
        animateHeight && "transition-[height,min-height] duration-300 ease-in-out",
        className
      )}
      style={{ 
        minHeight: heightToUse || undefined,
        height: adaptiveHeight ? heightToUse || undefined : undefined
      }}
      data-cls-element={clsElement || "true"}
      {...props}
    >
      {/* Actual content */}
      <div 
        ref={contentRef}
        className={cn(
          "w-full",
          isLoading && "invisible"
        )}
      >
        {children}
      </div>
      
      {/* Skeleton placeholder */}
      {isLoading && (
        <div className="absolute inset-0">
          {skeleton || defaultSkeleton}
        </div>
      )}
    </div>
  );
};

export default StableLayout;
