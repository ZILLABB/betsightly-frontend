/**
 * PWA Update Notification Component
 *
 * This component displays a notification when a new version of the app is available.
 * It provides options to refresh the page to get the latest version or dismiss the notification.
 */

import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw, X } from 'lucide-react';
import { Button } from './Button';

interface PWAUpdateNotificationProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

const PWAUpdateNotification: React.FC<PWAUpdateNotificationProps> = ({
  onUpdate,
  onDismiss,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  // Handle update click
  const handleUpdate = () => {
    setIsUpdating(true);
    onUpdate();
  };

  // Reset updating state if component is still mounted after 5 seconds
  useEffect(() => {
    if (isUpdating) {
      const timer = setTimeout(() => {
        setIsUpdating(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isUpdating]);

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-card border border-[var(--border)] shadow-lg rounded-lg p-4 animate-in slide-in-from-bottom-5">
      <div className="flex items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">Update Available</h3>
          <p className="text-sm text-muted-foreground mt-1">
            A new version of BetSightly is available. Update now for the latest features and improvements.
          </p>
          <div className="mt-3 flex space-x-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleUpdate}
              disabled={isUpdating}
              className="flex items-center"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-1 h-4 w-4" />
                  Update Now
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDismiss}
              disabled={isUpdating}
            >
              Later
            </Button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="ml-4 text-muted-foreground hover:text-foreground"
          disabled={isUpdating}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default PWAUpdateNotification;
