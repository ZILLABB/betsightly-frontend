import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface EnhancedLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'accent';
  text?: string;
  showText?: boolean;
  className?: string;
}

const EnhancedLoadingSpinner: React.FC<EnhancedLoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  text = 'Loading...',
  showText = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  const variantClasses = {
    primary: 'text-amber-400',
    secondary: 'text-blue-400',
    accent: 'text-purple-400'
  };

  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  const dotVariants = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

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

  const containerVariants = {
    initial: {
      opacity: 0,
      scale: 0.8
    },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className={cn(
        'flex flex-col items-center justify-center space-y-3',
        className
      )}
    >
      {/* Enhanced Spinner */}
      <div className="relative">
        {/* Outer ring */}
        <motion.div
          variants={spinnerVariants}
          animate="animate"
          className={cn(
            'border-2 border-transparent rounded-full',
            sizeClasses[size],
            `border-t-current border-r-current`,
            variantClasses[variant]
          )}
        />
        
        {/* Inner ring - counter rotation */}
        <motion.div
          variants={{
            animate: {
              rotate: -360,
              transition: {
                duration: 1.5,
                repeat: Infinity,
                ease: "linear"
              }
            }
          }}
          animate="animate"
          className={cn(
            'absolute inset-1 border border-transparent rounded-full',
            `border-b-current border-l-current opacity-60`,
            variantClasses[variant]
          )}
        />

        {/* Center dot */}
        <motion.div
          variants={dotVariants}
          animate="animate"
          className={cn(
            'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
            'w-1 h-1 rounded-full',
            variantClasses[variant]
          )}
        />
      </div>

      {/* Loading text with animation */}
      {showText && text && (
        <motion.p
          variants={textVariants}
          animate="animate"
          className={cn(
            'font-medium',
            textSizeClasses[size],
            variantClasses[variant]
          )}
        >
          {text}
        </motion.p>
      )}

      {/* Animated dots */}
      {showText && (
        <div className="flex space-x-1">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              variants={{
                animate: {
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3],
                  transition: {
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.2
                  }
                }
              }}
              animate="animate"
              className={cn(
                'w-1 h-1 rounded-full',
                variantClasses[variant]
              )}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default EnhancedLoadingSpinner;
