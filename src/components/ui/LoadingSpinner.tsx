import React from 'react';
import { cn } from '../../lib/utils';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className = '',
  text,
  fullScreen = false
}) => {
  // Size mappings
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4'
  };

  // Variant mappings
  const variantClasses = {
    primary: 'border-t-amber-500',
    secondary: 'border-t-blue-500',
    success: 'border-t-green-500',
    danger: 'border-t-red-500',
    warning: 'border-t-amber-500',
    info: 'border-t-blue-500'
  };

  const spinnerClasses = cn(
    'animate-spin rounded-full border-white/20',
    sizeClasses[size],
    variantClasses[variant],
    className
  );

  // If fullScreen, render a centered spinner with overlay
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <div className="flex flex-col items-center">
          <div className={spinnerClasses}></div>
          {text && <p className="mt-4 text-white font-medium">{text}</p>}
        </div>
      </div>
    );
  }

  // If text is provided, render spinner with text
  if (text) {
    return (
      <div className="flex flex-col items-center">
        <div className={spinnerClasses}></div>
        <p className="mt-2 text-white/70 text-sm">{text}</p>
      </div>
    );
  }

  // Otherwise, just render the spinner
  return <div className={spinnerClasses}></div>;
};

export default LoadingSpinner;
