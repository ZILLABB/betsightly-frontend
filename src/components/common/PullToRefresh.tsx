import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ChevronDown } from 'lucide-react';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { HapticInteractions } from '../../utils/hapticFeedback';
import { cn } from '../../lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  resistance?: number;
  enabled?: boolean;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  className = '',
  threshold = 80,
  resistance = 2.5,
  enabled = true
}) => {
  const {
    containerRef,
    isPulling,
    pullDistance,
    isRefreshing,
    canRefresh,
    pullProgress
  } = usePullToRefresh({
    onRefresh,
    threshold,
    resistance,
    enabled
  });

  const indicatorVariants = {
    hidden: { 
      opacity: 0, 
      y: -50,
      scale: 0.8
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    refreshing: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20
      }
    }
  };

  const iconVariants = {
    pulling: {
      rotate: pullProgress * 180,
      scale: 0.8 + (pullProgress * 0.4),
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    canRefresh: {
      rotate: 180,
      scale: 1.2,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    },
    refreshing: {
      rotate: 360,
      scale: 1,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  const getIconVariant = () => {
    if (isRefreshing) return 'refreshing';
    if (canRefresh) return 'canRefresh';
    return 'pulling';
  };

  const getIndicatorText = () => {
    if (isRefreshing) return 'Refreshing...';
    if (canRefresh) return 'Release to refresh';
    return 'Pull to refresh';
  };

  const getIndicatorColor = () => {
    if (isRefreshing) return 'text-blue-400';
    if (canRefresh) return 'text-green-400';
    return 'text-amber-400';
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        'relative overflow-auto overscroll-contain',
        className
      )}
      style={{
        transform: isPulling || isRefreshing ? `translateY(${Math.min(pullDistance, threshold)}px)` : 'translateY(0)',
        transition: isPulling ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {/* Pull to Refresh Indicator */}
      <AnimatePresence>
        {(isPulling || isRefreshing) && (
          <motion.div
            variants={indicatorVariants}
            initial="hidden"
            animate={isRefreshing ? "refreshing" : "visible"}
            exit="hidden"
            className="absolute top-0 left-0 right-0 z-50 flex flex-col items-center justify-center py-4 bg-gradient-to-b from-black/90 to-transparent"
            style={{
              transform: `translateY(-${threshold}px)`
            }}
          >
            <motion.div
              variants={iconVariants}
              animate={getIconVariant()}
              className={cn(
                'mb-2 transition-colors duration-200',
                getIndicatorColor()
              )}
            >
              {isRefreshing ? (
                <RefreshCw size={24} />
              ) : (
                <ChevronDown size={24} />
              )}
            </motion.div>
            
            <motion.p
              className={cn(
                'text-sm font-medium transition-colors duration-200',
                getIndicatorColor()
              )}
              animate={{
                scale: canRefresh ? 1.05 : 1,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }
              }}
            >
              {getIndicatorText()}
            </motion.p>

            {/* Progress indicator */}
            {!isRefreshing && (
              <motion.div
                className="mt-2 w-16 h-1 bg-white/20 rounded-full overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <motion.div
                  className={cn(
                    'h-full rounded-full transition-colors duration-200',
                    canRefresh ? 'bg-green-400' : 'bg-amber-400'
                  )}
                  style={{
                    width: `${pullProgress * 100}%`,
                    transition: 'width 0.1s ease-out'
                  }}
                />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
