/**
 * Performance monitoring utility for tracking application performance metrics
 */

import { reportWebVitals } from './webVitals';

// Performance metrics storage
interface PerformanceMetrics {
  pageLoads: Record<string, number[]>;
  apiCalls: Record<string, number[]>;
  renderTimes: Record<string, number[]>;
}

// Initialize metrics storage
const metrics: PerformanceMetrics = {
  pageLoads: {},
  apiCalls: {},
  renderTimes: {},
};

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring(): void {
  console.log('Performance monitoring initialized');
  
  // Set up web vitals reporting
  reportWebVitals(({ name, value }) => {
    console.log(`Web Vital: ${name} - ${value}`);
  });

  // Set up performance observer for long tasks (only in development)
  if ('PerformanceObserver' in window && import.meta.env.DEV) {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 100) { // Only warn for tasks longer than 100ms
            console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`);
          }
        });
      });

      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      console.error('Performance observer not supported', e);
    }
  }
}

/**
 * Record page load time
 * @param pageName - Name of the page being loaded
 * @param loadTime - Time taken to load the page in ms
 */
export function recordPageLoad(pageName: string, loadTime: number): void {
  if (!metrics.pageLoads[pageName]) {
    metrics.pageLoads[pageName] = [];
  }
  metrics.pageLoads[pageName].push(loadTime);
}

/**
 * Record API call time
 * @param endpoint - API endpoint being called
 * @param callTime - Time taken for the API call in ms
 */
export function recordApiCall(endpoint: string, callTime: number): void {
  if (!metrics.apiCalls[endpoint]) {
    metrics.apiCalls[endpoint] = [];
  }
  metrics.apiCalls[endpoint].push(callTime);
}

/**
 * Record component render time
 * @param componentName - Name of the component being rendered
 * @param renderTime - Time taken to render the component in ms
 */
export function recordRenderTime(componentName: string, renderTime: number): void {
  if (!metrics.renderTimes[componentName]) {
    metrics.renderTimes[componentName] = [];
  }
  metrics.renderTimes[componentName].push(renderTime);
}

/**
 * Get all collected performance metrics
 * @returns The current performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  return metrics;
}

/**
 * Clear all performance metrics
 */
export function clearPerformanceMetrics(): void {
  Object.keys(metrics).forEach((key) => {
    const metricKey = key as keyof PerformanceMetrics;
    metrics[metricKey] = {};
  });
}
