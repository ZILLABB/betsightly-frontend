/**
 * Offline Status Bar Component
 *
 * This component displays the current online/offline status and provides
 * information about when data was last updated.
 */

import React from 'react';
import { Wifi, WifiOff, RefreshCw, Clock } from 'lucide-react';
import { usePWA } from './PWAProvider';
import { Button } from './Button';

interface OfflineStatusBarProps {
  lastUpdated: Date | null;
  isStale: boolean;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

const OfflineStatusBar: React.FC<OfflineStatusBarProps> = ({
  lastUpdated,
  isStale,
  onRefresh,
  isRefreshing = false,
}) => {
  // Get online status from PWA context or navigator
  const pwaContext = usePWA();
  const isOnline = pwaContext?.isOnline ?? navigator.onLine;

  // Format the last updated time
  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Never';

    const now = new Date();
    const diff = now.getTime() - lastUpdated.getTime();

    // Less than a minute
    if (diff < 60 * 1000) {
      return 'Just now';
    }

    // Less than an hour
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }

    // Less than a day
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }

    // Format as date
    return lastUpdated.toLocaleString();
  };

  return (
    <div className={`flex items-center justify-between px-4 py-2 text-sm ${
      isOnline
        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
    }`}>
      <div className="flex items-center">
        {isOnline ? (
          <Wifi className="h-4 w-4 mr-2" />
        ) : (
          <WifiOff className="h-4 w-4 mr-2" />
        )}
        <span>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      <div className="flex items-center">
        <Clock className="h-4 w-4 mr-1" />
        <span className={isStale ? 'text-amber-600 dark:text-amber-400' : ''}>
          {isStale ? 'Stale data • ' : ''}
          Last updated: {formatLastUpdated()}
        </span>

        <Button
          variant="ghost"
          size="sm"
          className="ml-2 h-7 px-2"
          onClick={onRefresh}
          disabled={isRefreshing || !isOnline}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="sr-only">Refresh</span>
        </Button>
      </div>
    </div>
  );
};

export default OfflineStatusBar;
