/**
 * Development Tools Component
 * 
 * This component provides development tools like the Web Vitals dashboard.
 * It only renders in development mode (import.meta.env.DEV is true).
 */

import React, { useState } from 'react';
import WebVitalsDashboard from './WebVitalsDashboard';
import { Activity, X } from 'lucide-react';

const DevTools: React.FC = () => {
  const [showWebVitals, setShowWebVitals] = useState<boolean>(false);
  const [showDevTools, setShowDevTools] = useState<boolean>(true);
  
  // Don't render anything in production
  if (!import.meta.env.DEV) {
    return null;
  }
  
  if (!showDevTools) {
    return (
      <button
        onClick={() => setShowDevTools(true)}
        className="fixed bottom-4 right-4 z-50 p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
        aria-label="Show developer tools"
      >
        <Activity size={20} />
      </button>
    );
  }
  
  return (
    <>
      {/* Dev Tools Panel */}
      <div className="fixed bottom-4 right-4 z-50 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Dev Tools</h3>
          <button
            onClick={() => setShowDevTools(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close dev tools"
          >
            <X size={16} />
          </button>
        </div>
        
        <div className="space-y-2">
          <button
            onClick={() => setShowWebVitals(!showWebVitals)}
            className={`w-full px-3 py-1.5 text-sm rounded-md transition-colors ${
              showWebVitals 
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {showWebVitals ? 'Hide' : 'Show'} Web Vitals
          </button>
        </div>
      </div>
      
      {/* Web Vitals Dashboard */}
      {showWebVitals && (
        <WebVitalsDashboard onClose={() => setShowWebVitals(false)} />
      )}
    </>
  );
};

export default DevTools;
