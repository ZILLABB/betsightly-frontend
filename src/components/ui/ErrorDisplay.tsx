import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ErrorVariant = 'danger' | 'warning' | 'info';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  variant?: ErrorVariant;
  onRetry?: () => void;
  className?: string;
  retryText?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title = 'Error',
  message,
  variant = 'danger',
  onRetry,
  className = '',
  retryText = 'Try Again'
}) => {
  // Variant mappings
  const variantClasses = {
    danger: 'bg-red-500/10 border-red-500/30 text-red-500',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-500'
  };

  return (
    <div className={cn(
      'rounded-lg border p-4 shadow-sm',
      variantClasses[variant],
      className
    )}>
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          {title && <h4 className="font-medium mb-1">{title}</h4>}
          <p className="text-sm text-white/70">{message}</p>
          
          {onRetry && (
            <button
              onClick={onRetry}
              className={cn(
                'mt-3 flex items-center px-3 py-1.5 rounded-md text-sm font-medium',
                variant === 'danger' ? 'bg-red-500/20 hover:bg-red-500/30' :
                variant === 'warning' ? 'bg-amber-500/20 hover:bg-amber-500/30' :
                'bg-blue-500/20 hover:bg-blue-500/30'
              )}
            >
              <RefreshCw size={14} className="mr-1.5" />
              {retryText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;
