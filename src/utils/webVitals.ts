/**
 * Web Vitals Utility
 *
 * This utility measures and reports Core Web Vitals metrics:
 * - Largest Contentful Paint (LCP): measures loading performance
 * - First Input Delay (FID): measures interactivity
 * - Cumulative Layout Shift (CLS): measures visual stability
 * - First Contentful Paint (FCP): measures when content first appears
 * - Time to Interactive (TTI): measures when the page becomes interactive
 */

// Type import used for casting in implementation
import type { Metric as WebVitalsMetric } from 'web-vitals';

// Define metric names
export type WebVitalName = 'CLS' | 'FCP' | 'FID' | 'LCP' | 'TTFB' | 'INP';

// Define metric data
export interface WebVitalMetric {
  id: string;
  name: WebVitalName;
  value: number;
  delta: number;
  entries: PerformanceEntry[];
}

export type ReportHandler = (metric: WebVitalMetric) => void;

/**
 * Report Web Vitals metrics
 *
 * @param onPerfEntry - Callback function to handle performance entries
 */
export function reportWebVitals(onPerfEntry?: ReportHandler): void {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
      // Measure CLS
      onCLS(metric => {
        console.log('CLS:', metric.value);
        onPerfEntry(metric as WebVitalMetric);
      });

      // Measure FID
      onFID(metric => {
        console.log('FID:', metric.value);
        onPerfEntry(metric as WebVitalMetric);
      });

      // Measure FCP
      onFCP(metric => {
        console.log('FCP:', metric.value);
        onPerfEntry(metric as WebVitalMetric);
      });

      // Measure LCP
      onLCP(metric => {
        console.log('LCP:', metric.value);
        onPerfEntry(metric as WebVitalMetric);
      });

      // Measure TTFB
      onTTFB(metric => {
        console.log('TTFB:', metric.value);
        onPerfEntry(metric as WebVitalMetric);
      });

      // Measure INP (Interaction to Next Paint)
      onINP(metric => {
        console.log('INP:', metric.value);
        onPerfEntry(metric as WebVitalMetric);
      });
    });
  }
}

/**
 * Send Web Vitals metrics to analytics
 *
 * @param metric - Web Vitals metric
 */
export function sendToAnalytics(metric: WebVitalMetric): void {
  // Get the metric name and value
  const { name, value, id } = metric;

  // Format the value based on the metric
  let formattedValue = value;
  if (name === 'CLS') {
    // CLS values are typically very small (e.g., 0.1)
    formattedValue = Math.round(value * 1000) / 1000;
  } else {
    // Other metrics are in milliseconds, round to nearest integer
    formattedValue = Math.round(value);
  }

  // In a real app, you would send this to your analytics service
  // For now, we'll just log it to the console
  console.log(`Web Vitals: ${name} = ${formattedValue}`);

  // Dispatch a custom event for the dashboard
  const webVitalsEvent = new CustomEvent('web-vitals', {
    detail: metric
  });
  window.dispatchEvent(webVitalsEvent);

  // Example of sending to Google Analytics 4
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'web_vitals', {
      event_category: 'Web Vitals',
      event_label: id,
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      metric_id: id,
      metric_name: name,
      metric_value: formattedValue,
    });
  }
}

// Add gtag to window type
declare global {
  interface Window {
    gtag?: (command: string, action: string, params?: Record<string, unknown>) => void;
  }
}

/**
 * Get threshold values for Web Vitals metrics
 *
 * @returns Object with threshold values for each metric
 */
export function getWebVitalsThresholds() {
  return {
    LCP: {
      good: 2500, // ms
      needsImprovement: 4000, // ms
    },
    FID: {
      good: 100, // ms
      needsImprovement: 300, // ms
    },
    CLS: {
      good: 0.1,
      needsImprovement: 0.25,
    },
    FCP: {
      good: 1800, // ms
      needsImprovement: 3000, // ms
    },
    TTFB: {
      good: 800, // ms
      needsImprovement: 1800, // ms
    },
    INP: {
      good: 200, // ms
      needsImprovement: 500, // ms
    },
  };
}

/**
 * Get rating for a Web Vitals metric
 *
 * @param name - Metric name
 * @param value - Metric value
 * @returns Rating: 'good', 'needs-improvement', or 'poor'
 */
export function getWebVitalRating(name: WebVitalName, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = getWebVitalsThresholds();
  const metricThresholds = thresholds[name];

  if (value <= metricThresholds.good) {
    return 'good';
  } else if (value <= metricThresholds.needsImprovement) {
    return 'needs-improvement';
  } else {
    return 'poor';
  }
}

/**
 * Format Web Vitals metric value for display
 *
 * @param name - Metric name
 * @param value - Metric value
 * @returns Formatted value with units
 */
export function formatWebVitalValue(name: WebVitalName, value: number): string {
  if (name === 'CLS') {
    return value.toFixed(3);
  } else {
    return `${Math.round(value)}ms`;
  }
}






