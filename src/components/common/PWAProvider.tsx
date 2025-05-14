/**
 * PWA Provider Component - DISABLED
 *
 * This component has been completely disabled to fix service worker issues.
 * It now only serves as a pass-through for children.
 */

import React, { ReactNode } from 'react';

interface PWAProviderProps {
  children: ReactNode;
}

export const PWAProvider: React.FC<PWAProviderProps> = ({ children }) => {
  // Simply return children without any PWA functionality
  return <>{children}</>;
};

// Dummy hook for compatibility
export const usePWA = () => ({
  isOnline: navigator.onLine,
  isUpdateAvailable: false,
  isOfflineReady: false,
  updateServiceWorker: async () => {}
});

export default PWAProvider;
