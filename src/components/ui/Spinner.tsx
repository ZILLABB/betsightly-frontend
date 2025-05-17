import React from 'react';
import { cn } from '../../lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  className?: string;
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className,
  label = 'Loading...'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  const variantClasses = {
    primary: 'border-[var(--primary)] border-b-transparent',
    secondary: 'border-[var(--secondary)] border-b-transparent',
    success: 'border-[var(--success)] border-b-transparent',
    danger: 'border-[var(--danger)] border-b-transparent',
    warning: 'border-[var(--warning)] border-b-transparent',
    info: 'border-blue-500 border-b-transparent'
  };

  return (
    <div className="inline-flex flex-col items-center justify-center">
      <div
        className={cn(
          'rounded-full animate-spin',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        role="status"
        aria-label={label}
      />
      {label && (
        <span className="sr-only">{label}</span>
      )}
    </div>
  );
};

export default Spinner;
