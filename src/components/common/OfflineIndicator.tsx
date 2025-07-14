import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';
import { usePWA } from './PWAProvider';

interface OfflineIndicatorProps {
  className?: string;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ className = '' }) => {
  const { isOnline, isOfflineReady } = usePWA();
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline && isOnline) {
      // Show "back online" message
      setShowOnlineMessage(true);
      setTimeout(() => {
        setShowOnlineMessage(false);
        setWasOffline(false);
      }, 3000);
    }
  }, [isOnline, wasOffline]);

  // Don't render anything if we're online and not showing the online message
  if (isOnline && !showOnlineMessage) return null;

  return (
    <AnimatePresence>
      {(!isOnline || showOnlineMessage) && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`fixed bottom-4 left-4 z-40 flex items-center p-3 px-4 rounded-xl shadow-xl backdrop-blur-sm border ${
            !isOnline
              ? 'bg-red-500/90 border-red-400/20 text-white'
              : 'bg-green-500/90 border-green-400/20 text-white'
          } ${className}`}
          role="status"
          aria-live="polite"
        >
          {!isOnline ? (
            <>
              <WifiOff size={16} className="mr-2 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">You are offline</span>
                {isOfflineReady && (
                  <span className="text-xs opacity-90">Some features available</span>
                )}
              </div>
            </>
          ) : (
            <>
              <Wifi size={16} className="mr-2 flex-shrink-0" />
              <span className="text-sm font-medium">Back online</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;
