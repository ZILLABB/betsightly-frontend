import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DataLoadingIndicatorProps {
  isLoading: boolean;
  error?: string | null;
  loadingMessage?: string;
  errorMessage?: string;
  successMessage?: string;
  showSuccess?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  inline?: boolean;
  hideAfter?: number; // in milliseconds
}

/**
 * A component to indicate data loading, error, and success states
 */
const DataLoadingIndicator: React.FC<DataLoadingIndicatorProps> = ({
  isLoading,
  error,
  loadingMessage = 'Loading data...',
  errorMessage = 'Failed to load data',
  successMessage = 'Data loaded successfully',
  showSuccess = false,
  className = '',
  size = 'md',
  inline = false,
  hideAfter = 2000, // 2 seconds
}) => {
  const [visible, setVisible] = useState<boolean>(true);
  const [showSuccessState, setShowSuccessState] = useState<boolean>(false);

  // Handle success state visibility
  useEffect(() => {
    if (!isLoading && !error && showSuccess) {
      setShowSuccessState(true);
      
      // Hide success message after specified time
      const timer = setTimeout(() => {
        setVisible(false);
      }, hideAfter);
      
      return () => clearTimeout(timer);
    }
    
    // Reset visibility when loading or error state changes
    setVisible(true);
    setShowSuccessState(false);
  }, [isLoading, error, showSuccess, hideAfter]);

  // If not visible, don't render anything
  if (!visible) {
    return null;
  }

  // Determine icon and text size based on size prop
  const iconSize = size === 'sm' ? 14 : size === 'md' ? 18 : 24;
  const textSize = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base';

  // Determine container styles based on inline prop
  const containerStyles = inline
    ? 'inline-flex items-center'
    : 'flex items-center justify-center';

  // Loading state
  if (isLoading) {
    return (
      <div className={`${containerStyles} ${className}`}>
        <Loader2 size={iconSize} className="animate-spin mr-2 text-[var(--primary)]" />
        <span className={`${textSize} text-[var(--muted-foreground)]`}>{loadingMessage}</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`${containerStyles} ${className}`}>
        <AlertCircle size={iconSize} className="mr-2 text-red-500" />
        <span className={`${textSize} text-red-500`}>
          {errorMessage}: {error}
        </span>
      </div>
    );
  }

  // Success state (only shown if showSuccess is true)
  if (showSuccessState) {
    return (
      <div className={`${containerStyles} ${className}`}>
        <CheckCircle2 size={iconSize} className="mr-2 text-green-500" />
        <span className={`${textSize} text-green-500`}>{successMessage}</span>
      </div>
    );
  }

  // Default: render nothing
  return null;
};

export default DataLoadingIndicator;
