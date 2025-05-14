import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

interface OfflineIndicatorProps {
  className?: string;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ className = '' }) => {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Set initial state
    setOffline(!navigator.onLine);

    // Add event listeners for online/offline events
    const handleOnline = () => {
      setOffline(false);
      setVisible(true);
      // Hide the indicator after 3 seconds
      setTimeout(() => setVisible(false), 3000);
    };

    const handleOffline = () => {
      setOffline(true);
      setVisible(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // If we're offline on mount, show the indicator
    if (!navigator.onLine) {
      setVisible(true);
    }

    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't render anything if we're online and the indicator is not visible
  if (!offline && !visible) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 flex items-center p-2 px-3 rounded-full shadow-lg transition-opacity duration-300 ${
        offline ? 'bg-red-500/90' : 'bg-green-500/90'
      } ${className}`}
      role="status"
      aria-live="polite"
    >
      {offline ? (
        <>
          <WifiOff size={16} className="mr-2" />
          <span className="text-xs font-medium">You are offline</span>
        </>
      ) : (
        <>
          <Wifi size={16} className="mr-2" />
          <span className="text-xs font-medium">Back online</span>
        </>
      )}
    </div>
  );
};

export default OfflineIndicator;
