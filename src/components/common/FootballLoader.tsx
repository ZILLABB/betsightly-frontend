import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface FootballLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
  text?: string;
}

const FootballLoader: React.FC<FootballLoaderProps> = ({
  size = 'md',
  className = '',
  showText = true,
  text = 'Loading predictions...'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  // Football bouncing animation
  const ballVariants = {
    animate: {
      y: [-20, 0, -20],
      rotate: [0, 180, 360],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Field lines animation
  const lineVariants = {
    animate: {
      scaleX: [0.8, 1.2, 0.8],
      opacity: [0.3, 0.8, 0.3],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Text animation
  const textVariants = {
    animate: {
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className={cn('flex flex-col items-center justify-center space-y-4', className)}>
      {/* Football Field Container */}
      <div className={cn('relative', sizeClasses[size])}>
        {/* Field Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-600 to-green-700 rounded-lg overflow-hidden">
          {/* Field Lines */}
          <motion.div
            variants={lineVariants}
            animate="animate"
            className="absolute top-1/2 left-0 right-0 h-px bg-white/60 transform -translate-y-1/2"
          />
          <motion.div
            variants={lineVariants}
            animate="animate"
            className="absolute top-1/4 left-0 right-0 h-px bg-white/40"
            style={{ animationDelay: '0.5s' }}
          />
          <motion.div
            variants={lineVariants}
            animate="animate"
            className="absolute bottom-1/4 left-0 right-0 h-px bg-white/40"
            style={{ animationDelay: '1s' }}
          />
          
          {/* Center Circle */}
          <div className="absolute top-1/2 left-1/2 w-6 h-6 border border-white/60 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
        </div>

        {/* Football */}
        <motion.div
          variants={ballVariants}
          animate="animate"
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
        >
          <div className="w-3 h-3 bg-white rounded-full relative">
            {/* Football pattern */}
            <div className="absolute inset-0 rounded-full">
              <div className="absolute top-1/2 left-1/2 w-px h-2 bg-black transform -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute top-1/2 left-1/2 w-2 h-px bg-black transform -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
        </motion.div>

        {/* Goal Posts */}
        <div className="absolute top-0 left-1/2 w-px h-2 bg-white/60 transform -translate-x-1/2" />
        <div className="absolute bottom-0 left-1/2 w-px h-2 bg-white/60 transform -translate-x-1/2" />
      </div>

      {/* Loading Text */}
      {showText && text && (
        <motion.p
          variants={textVariants}
          animate="animate"
          className={cn(
            'font-medium text-amber-400',
            textSizeClasses[size]
          )}
        >
          {text}
        </motion.p>
      )}

      {/* Animated Dots */}
      <div className="flex space-x-1">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.2
            }}
            className="w-1 h-1 bg-amber-400 rounded-full"
          />
        ))}
      </div>
    </div>
  );
};

// Specialized variants
export const FootballLoaderSmall: React.FC<Omit<FootballLoaderProps, 'size'>> = (props) => (
  <FootballLoader {...props} size="sm" />
);

export const FootballLoaderLarge: React.FC<Omit<FootballLoaderProps, 'size'>> = (props) => (
  <FootballLoader {...props} size="lg" />
);

export default FootballLoader;
