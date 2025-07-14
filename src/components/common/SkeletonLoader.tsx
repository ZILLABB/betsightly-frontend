import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface SkeletonLoaderProps {
  variant?: 'card' | 'text' | 'circle' | 'rectangle' | 'prediction-card';
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
  animate?: boolean;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'rectangle',
  width,
  height,
  className = '',
  count = 1,
  animate = true
}) => {
  const shimmerVariants = {
    initial: {
      backgroundPosition: '-200px 0'
    },
    animate: {
      backgroundPosition: 'calc(200px + 100%) 0',
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'linear'
      }
    }
  };

  const pulseVariants = {
    initial: {
      opacity: 0.6
    },
    animate: {
      opacity: [0.6, 1, 0.6],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  const baseClasses = cn(
    'bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800',
    'bg-[length:200px_100%]',
    animate && 'animate-pulse',
    className
  );

  const getVariantClasses = () => {
    switch (variant) {
      case 'circle':
        return 'rounded-full';
      case 'text':
        return 'rounded h-4';
      case 'card':
        return 'rounded-lg';
      case 'prediction-card':
        return 'rounded-xl';
      default:
        return 'rounded';
    }
  };

  const getDefaultSize = () => {
    switch (variant) {
      case 'circle':
        return { width: '40px', height: '40px' };
      case 'text':
        return { width: '100%', height: '16px' };
      case 'card':
        return { width: '100%', height: '200px' };
      case 'prediction-card':
        return { width: '100%', height: '300px' };
      default:
        return { width: '100%', height: '20px' };
    }
  };

  const defaultSize = getDefaultSize();
  const style = {
    width: width || defaultSize.width,
    height: height || defaultSize.height
  };

  const SkeletonElement = () => (
    <motion.div
      variants={animate ? shimmerVariants : pulseVariants}
      initial="initial"
      animate="animate"
      className={cn(baseClasses, getVariantClasses())}
      style={style}
    />
  );

  // Prediction card specific skeleton
  if (variant === 'prediction-card') {
    return (
      <div className={cn('space-y-4 p-4 border border-gray-700 rounded-xl bg-gray-900/50', className)}>
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <SkeletonLoader variant="text" width="60%" height="20px" />
            <SkeletonLoader variant="text" width="40%" height="14px" />
          </div>
          <SkeletonLoader variant="rectangle" width="60px" height="30px" />
        </div>
        
        {/* Confidence bar */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <SkeletonLoader variant="text" width="80px" height="12px" />
            <SkeletonLoader variant="text" width="40px" height="12px" />
          </div>
          <SkeletonLoader variant="rectangle" width="100%" height="6px" />
        </div>
        
        {/* Quality section */}
        <div className="space-y-2">
          <SkeletonLoader variant="text" width="50px" height="12px" />
          <div className="flex space-x-2">
            <SkeletonLoader variant="rectangle" width="40px" height="20px" />
            <SkeletonLoader variant="rectangle" width="60px" height="20px" />
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-between items-center pt-2">
          <SkeletonLoader variant="text" width="100px" height="12px" />
          <SkeletonLoader variant="circle" width="24px" height="24px" />
        </div>
      </div>
    );
  }

  // Render multiple skeletons if count > 1
  if (count > 1) {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              transition: {
                delay: index * 0.1,
                duration: 0.3
              }
            }}
          >
            <SkeletonElement />
          </motion.div>
        ))}
      </div>
    );
  }

  return <SkeletonElement />;
};

// Predefined skeleton components for common use cases
export const PredictionCardSkeleton: React.FC<{ count?: number; className?: string }> = ({ 
  count = 1, 
  className 
}) => (
  <SkeletonLoader variant="prediction-card" count={count} className={className} />
);

export const TextSkeleton: React.FC<{ 
  lines?: number; 
  className?: string;
  width?: string | number;
}> = ({ 
  lines = 1, 
  className,
  width 
}) => (
  <SkeletonLoader variant="text" count={lines} className={className} width={width} />
);

export const CircleSkeleton: React.FC<{ 
  size?: string | number; 
  className?: string;
}> = ({ 
  size = '40px', 
  className 
}) => (
  <SkeletonLoader 
    variant="circle" 
    width={size} 
    height={size} 
    className={className} 
  />
);

export default SkeletonLoader;
