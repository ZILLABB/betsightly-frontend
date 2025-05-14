/**
 * Offline Notification Component
 * 
 * This component displays a notification when the app is ready to work offline.
 * It also shows a warning when the user is offline and trying to access online-only features.
 */

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, X } from 'lucide-react';

interface OfflineNotificationProps {
  type: 'ready' | 'offline';
  duration?: number; // Duration in ms before auto-dismissing (0 for no auto-dismiss)
  onDismiss?: () => void;
}

const OfflineNotification: React.FC<OfflineNotificationProps> = ({
  type,
  duration = 5000,
  onDismiss,
}) => {
  const [visible, setVisible] = useState(true);

  // Auto-dismiss after duration (if specified)
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onDismiss) onDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  // Handle dismiss click
  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) onDismiss();
  };

  if (!visible) return null;

  return (
    <div 
      className={`fixed bottom-4 left-4 z-50 max-w-sm p-4 rounded-lg shadow-lg animate-in slide-in-from-bottom-5 ${
        type === 'ready' ? 'bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800' : 
        'bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800'
      }`}
    >
      <div className="flex items-start">
        <div className={`rounded-full p-1 mr-3 ${
          type === 'ready' ? 'bg-green-200 dark:bg-green-800' : 'bg-amber-200 dark:bg-amber-800'
        }`}>
          {type === 'ready' ? (
            <Wifi className="h-5 w-5 text-green-700 dark:text-green-300" />
          ) : (
            <WifiOff className="h-5 w-5 text-amber-700 dark:text-amber-300" />
          )}
        </div>
        <div className="flex-1">
          <h3 className={`font-medium ${
            type === 'ready' ? 'text-green-800 dark:text-green-200' : 'text-amber-800 dark:text-amber-200'
          }`}>
            {type === 'ready' ? 'Offline Ready' : 'You\'re Offline'}
          </h3>
          <p className={`text-sm mt-1 ${
            type === 'ready' ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'
          }`}>
            {type === 'ready' 
              ? 'BetSightly is now available offline. You can use most features without an internet connection.'
              : 'Some features may be limited while you\'re offline. We\'ll automatically reconnect when you\'re back online.'}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className={`ml-3 ${
            type === 'ready' ? 'text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-200' : 
            'text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-200'
          }`}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default OfflineNotification;
