import React from 'react';
import { cn } from '../../lib/utils';

interface ProgressBarProps {
  now: number;
  min?: number;
  max?: number;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  height?: number;
  animated?: boolean;
  striped?: boolean;
  label?: string | React.ReactNode;
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  now,
  min = 0,
  max = 100,
  variant = 'primary',
  height = 8,
  animated = false,
  striped = false,
  label,
  showLabel = false,
  className
}) => {
  // Ensure now is within min and max
  const normalizedNow = Math.max(min, Math.min(max, now));
  
  // Calculate percentage
  const percentage = ((normalizedNow - min) / (max - min)) * 100;
  
  const variantClasses = {
    primary: 'bg-[var(--primary)]',
    secondary: 'bg-[var(--secondary)]',
    success: 'bg-[var(--success)]',
    danger: 'bg-[var(--danger)]',
    warning: 'bg-[var(--warning)]',
    info: 'bg-blue-500'
  };
  
  const stripedClass = striped ? 'bg-stripes' : '';
  const animatedClass = animated ? 'animate-progress' : '';
  
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-[var(--muted)]', className)}>
      <div
        className={cn(
          'h-full rounded-full transition-all duration-300',
          variantClasses[variant],
          stripedClass,
          animatedClass
        )}
        style={{ 
          width: `${percentage}%`,
          height: `${height}px`
        }}
        role="progressbar"
        aria-valuenow={normalizedNow}
        aria-valuemin={min}
        aria-valuemax={max}
      >
        {showLabel && (
          <span className="px-2 text-xs text-white">{label || `${Math.round(percentage)}%`}</span>
        )}
      </div>
    </div>
  );
};

export default ProgressBar;
