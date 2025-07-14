/**
 * PWA Update Notification Component
 *
 * This component displays a notification when a new version of the app is available.
 * It provides options to refresh the page to get the latest version or dismiss the notification.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCw, X, Zap } from 'lucide-react';
import { Button } from './Button';
import { usePWA } from './PWAProvider';
import { HapticInteractions } from '../../utils/hapticFeedback';

const PWAUpdateNotification: React.FC = () => {
  const { isUpdateAvailable, updateServiceWorker } = usePWA();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Handle update click
  const handleUpdate = async () => {
    setIsUpdating(true);
    HapticInteractions.buttonPress();

    try {
      await updateServiceWorker(true);
      HapticInteractions.success();
    } catch (error) {
      console.error('Update failed:', error);
      HapticInteractions.error();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    HapticInteractions.buttonPress();
    setIsDismissed(true);
  };

  // Reset dismissed state when update becomes available
  useEffect(() => {
    if (isUpdateAvailable) {
      setIsDismissed(false);
    }
  }, [isUpdateAvailable]);

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
    <AnimatePresence>
      {isUpdateAvailable && !isDismissed && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 right-4 z-50 max-w-sm"
        >
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 shadow-xl border border-green-400/20">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm">
                  Update Available
                </h3>
                <p className="text-white/90 text-xs mt-1">
                  A new version with improvements and bug fixes is ready
                </p>

                <div className="flex space-x-2 mt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    className="bg-white text-green-600 hover:bg-white/90 text-xs px-3 py-1.5 h-auto"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Update Now
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    disabled={isUpdating}
                    className="text-white hover:bg-white/10 text-xs px-2 py-1.5 h-auto"
                  >
                    Later
                  </Button>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                disabled={isUpdating}
                className="flex-shrink-0 text-white/70 hover:text-white transition-colors p-1 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAUpdateNotification;
