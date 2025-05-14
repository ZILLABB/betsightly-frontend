/**
 * Web Vitals Dashboard Component
 * 
 * This component displays Core Web Vitals metrics in a dashboard.
 * It's intended for development use only and should not be included in production.
 */

import React, { useState, useEffect } from 'react';
import { 
  type WebVitalName, 
  type WebVitalMetric, 
  getWebVitalRating, 
  formatWebVitalValue,
  getWebVitalsThresholds
} from '../../utils/webVitals';
import { X } from 'lucide-react';

interface WebVitalsDashboardProps {
  onClose?: () => void;
}

const WebVitalsDashboard: React.FC<WebVitalsDashboardProps> = ({ onClose }) => {
  // State for metrics
  const [metrics, setMetrics] = useState<Record<WebVitalName, number | null>>({
    LCP: null,
    FID: null,
    CLS: null,
    FCP: null,
    TTFB: null,
    INP: null,
  });
  
  // Listen for web vitals metrics
  useEffect(() => {
    // Create a custom event listener for web vitals
    const handleWebVitals = (event: CustomEvent<WebVitalMetric>) => {
      const { name, value } = event.detail;
      
      setMetrics(prev => ({
        ...prev,
        [name]: value,
      }));
    };
    
    // Add event listener
    window.addEventListener('web-vitals', handleWebVitals as EventListener);
    
    // Clean up
    return () => {
      window.removeEventListener('web-vitals', handleWebVitals as EventListener);
    };
  }, []);
  
  // Get color for metric based on rating
  const getMetricColor = (name: WebVitalName, value: number | null): string => {
    if (value === null) return 'bg-gray-200 dark:bg-gray-700';
    
    const rating = getWebVitalRating(name, value);
    
    switch (rating) {
      case 'good':
        return 'bg-green-500 dark:bg-green-600';
      case 'needs-improvement':
        return 'bg-yellow-500 dark:bg-yellow-600';
      case 'poor':
        return 'bg-red-500 dark:bg-red-600';
      default:
        return 'bg-gray-200 dark:bg-gray-700';
    }
  };
  
  // Get percentage for progress bar
  const getMetricPercentage = (name: WebVitalName, value: number | null): number => {
    if (value === null) return 0;
    
    const thresholds = getWebVitalsThresholds();
    const poorThreshold = thresholds[name].needsImprovement * 2;
    
    // Calculate percentage (0-100)
    const percentage = (value / poorThreshold) * 100;
    
    // Cap at 100%
    return Math.min(percentage, 100);
  };
  
  return (
    <div className="fixed bottom-4 left-4 z-50 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Core Web Vitals</h3>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        )}
      </div>
      
      <div className="space-y-3">
        {Object.entries(metrics).map(([name, value]) => (
          <div key={name} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {name}
              </span>
              <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                {value !== null ? formatWebVitalValue(name as WebVitalName, value) : 'Measuring...'}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${getMetricColor(name as WebVitalName, value)}`}
                style={{ width: `${getMetricPercentage(name as WebVitalName, value)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Good</span>
          <span>Needs Improvement</span>
          <span>Poor</span>
        </div>
        <div className="flex mt-1">
          <div className="flex-1 h-1 bg-green-500 dark:bg-green-600 rounded-l"></div>
          <div className="flex-1 h-1 bg-yellow-500 dark:bg-yellow-600"></div>
          <div className="flex-1 h-1 bg-red-500 dark:bg-red-600 rounded-r"></div>
        </div>
      </div>
    </div>
  );
};

export default WebVitalsDashboard;


