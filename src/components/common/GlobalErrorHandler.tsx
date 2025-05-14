import React, { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from './Button';
import { captureException } from '../../utils/errorTracking';
import { checkApiAvailability } from '../../services/unifiedDataService';

interface GlobalErrorHandlerProps {
  children: React.ReactNode;
}

/**
 * Global error handler component that:
 * 1. Catches unhandled promise rejections
 * 2. Monitors network connectivity
 * 3. Checks API availability
 * 4. Provides UI for error states
 */
const GlobalErrorHandler: React.FC<GlobalErrorHandlerProps> = ({ children }) => {
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isApiAvailable, setIsApiAvailable] = useState<boolean>(true);
  const [isCheckingApi, setIsCheckingApi] = useState<boolean>(false);

  // Handle unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      captureException(event.reason);
      
      // Only show global error for critical errors
      if (event.reason?.name === 'FatalError') {
        setHasError(true);
        setErrorMessage(event.reason.message || 'An unexpected error occurred');
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkApiHealth();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setIsApiAvailable(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check API health on mount and when network status changes
  useEffect(() => {
    if (isOnline) {
      checkApiHealth();
    }
  }, [isOnline]);

  // Function to check API health
  const checkApiHealth = async () => {
    if (isCheckingApi) return;
    
    setIsCheckingApi(true);
    try {
      const isAvailable = await checkApiAvailability();
      setIsApiAvailable(isAvailable);
    } catch (error) {
      console.error('Error checking API health:', error);
      setIsApiAvailable(false);
    } finally {
      setIsCheckingApi(false);
    }
  };

  // Reset error state
  const resetError = () => {
    setHasError(false);
    setErrorMessage('');
  };

  // Retry API connection
  const retryApiConnection = () => {
    checkApiHealth();
  };

  // If there's a critical error, show error UI
  if (hasError) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--background)]/95 z-50 p-4">
        <div className="max-w-md w-full bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg p-6">
          <div className="text-center">
            <AlertTriangle size={48} className="mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-[var(--muted-foreground)] mb-6">{errorMessage || 'An unexpected error occurred. Please try again.'}</p>
            <Button onClick={resetError} className="w-full">
              <RefreshCw size={16} className="mr-2" />
              Reload Application
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If offline, show offline banner
  if (!isOnline) {
    return (
      <>
        <div className="fixed top-0 inset-x-0 bg-red-500 text-white py-2 px-4 z-50 flex items-center justify-center">
          <WifiOff size={16} className="mr-2" />
          <span>You are offline. Some features may not be available.</span>
        </div>
        <div className="pt-10">{children}</div>
      </>
    );
  }

  // If API is unavailable but online, show API unavailable banner
  if (isOnline && !isApiAvailable) {
    return (
      <>
        <div className="fixed top-0 inset-x-0 bg-yellow-500 text-black py-2 px-4 z-50 flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle size={16} className="mr-2" />
            <span>API is currently unavailable. Using cached data.</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={retryApiConnection}
            disabled={isCheckingApi}
            className="text-xs bg-white/20 border-white/40"
          >
            {isCheckingApi ? (
              <>
                <div className="animate-spin mr-1 h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
                Checking...
              </>
            ) : (
              <>
                <RefreshCw size={12} className="mr-1" />
                Retry
              </>
            )}
          </Button>
        </div>
        <div className="pt-10">{children}</div>
      </>
    );
  }

  // All good, render children
  return <>{children}</>;
};

export default GlobalErrorHandler;
