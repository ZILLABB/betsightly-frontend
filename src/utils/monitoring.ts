/**
 * Enhanced monitoring and alerting system
 */

interface MonitoringConfig {
  apiUrl?: string;
  enableRealTimeAlerts: boolean;
  performanceThresholds: {
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
    fcp: number; // First Contentful Paint
    ttfb: number; // Time to First Byte
  };
  errorThresholds: {
    maxErrorsPerMinute: number;
    maxConsecutiveErrors: number;
  };
}

const defaultConfig: MonitoringConfig = {
  enableRealTimeAlerts: import.meta.env.PROD,
  performanceThresholds: {
    lcp: 2500, // 2.5 seconds
    fid: 100,  // 100ms
    cls: 0.1,  // 0.1
    fcp: 1800, // 1.8 seconds
    ttfb: 800, // 800ms
  },
  errorThresholds: {
    maxErrorsPerMinute: 10,
    maxConsecutiveErrors: 5,
  },
};

class MonitoringService {
  private config: MonitoringConfig;
  private errorCount = 0;
  private consecutiveErrors = 0;
  private lastErrorTime = 0;
  private performanceMetrics: Record<string, number[]> = {};

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.initializeMonitoring();
  }

  private initializeMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor unhandled errors
    window.addEventListener('error', this.handleError.bind(this));
    window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));

    // Monitor performance
    this.initializePerformanceMonitoring();

    // Monitor network failures
    this.initializeNetworkMonitoring();
  }

  private initializePerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      // Monitor Core Web Vitals
      try {
        import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
          onLCP(this.handlePerformanceMetric.bind(this, 'lcp'));
          onFID(this.handlePerformanceMetric.bind(this, 'fid'));
          onCLS(this.handlePerformanceMetric.bind(this, 'cls'));
          onFCP(this.handlePerformanceMetric.bind(this, 'fcp'));
          onTTFB(this.handlePerformanceMetric.bind(this, 'ttfb'));
        });
      } catch (error) {
        console.warn('Web Vitals monitoring not available:', error);
      }

      // Monitor long tasks
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 50) {
              this.reportPerformanceIssue('long-task', {
                duration: entry.duration,
                startTime: entry.startTime,
              });
            }
          });
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.warn('Long task monitoring not available:', error);
      }
    }
  }

  private initializeNetworkMonitoring(): void {
    // Monitor fetch failures
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok) {
          this.reportNetworkError(args[0], response.status);
        }
        return response;
      } catch (error) {
        this.reportNetworkError(args[0], 0, error);
        throw error;
      }
    };
  }

  private handleError(event: ErrorEvent): void {
    this.incrementErrorCount();
    this.reportError({
      type: 'javascript-error',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
    });
  }

  private handlePromiseRejection(event: PromiseRejectionEvent): void {
    this.incrementErrorCount();
    this.reportError({
      type: 'unhandled-promise-rejection',
      message: event.reason?.message || 'Unhandled promise rejection',
      stack: event.reason?.stack,
    });
  }

  private handlePerformanceMetric(metricName: string, metric: any): void {
    const value = metric.value;
    const threshold = this.config.performanceThresholds[metricName as keyof typeof this.config.performanceThresholds];

    if (!this.performanceMetrics[metricName]) {
      this.performanceMetrics[metricName] = [];
    }
    this.performanceMetrics[metricName].push(value);

    if (value > threshold) {
      this.reportPerformanceIssue(metricName, {
        value,
        threshold,
        rating: metric.rating,
      });
    }
  }

  private incrementErrorCount(): void {
    const now = Date.now();
    
    // Reset error count if more than a minute has passed
    if (now - this.lastErrorTime > 60000) {
      this.errorCount = 0;
      this.consecutiveErrors = 0;
    }

    this.errorCount++;
    this.consecutiveErrors++;
    this.lastErrorTime = now;

    // Check if we've exceeded thresholds
    if (this.errorCount > this.config.errorThresholds.maxErrorsPerMinute) {
      this.reportCriticalIssue('high-error-rate', {
        errorCount: this.errorCount,
        timeWindow: '1 minute',
      });
    }

    if (this.consecutiveErrors > this.config.errorThresholds.maxConsecutiveErrors) {
      this.reportCriticalIssue('consecutive-errors', {
        consecutiveErrors: this.consecutiveErrors,
      });
    }
  }

  private reportError(error: any): void {
    if (import.meta.env.DEV) {
      console.error('Monitoring: Error detected', error);
    }

    this.sendToMonitoringService('error', error);
  }

  private reportPerformanceIssue(metric: string, data: any): void {
    if (import.meta.env.DEV) {
      console.warn(`Monitoring: Performance issue detected - ${metric}`, data);
    }

    this.sendToMonitoringService('performance', { metric, ...data });
  }

  private reportNetworkError(url: any, status: number, error?: any): void {
    if (import.meta.env.DEV) {
      console.error('Monitoring: Network error', { url, status, error });
    }

    this.sendToMonitoringService('network', {
      url: typeof url === 'string' ? url : url?.toString(),
      status,
      error: error?.message,
    });
  }

  private reportCriticalIssue(type: string, data: any): void {
    if (import.meta.env.DEV) {
      console.error(`Monitoring: CRITICAL ISSUE - ${type}`, data);
    }

    this.sendToMonitoringService('critical', { type, ...data });
  }

  private sendToMonitoringService(level: string, data: any): void {
    if (!this.config.enableRealTimeAlerts) return;

    // In a real implementation, this would send to your monitoring service
    // For now, we'll just log to console in development
    if (import.meta.env.DEV) {
      console.log(`[MONITORING] ${level.toUpperCase()}:`, data);
    }

    // Example: Send to external monitoring service
    // fetch('/api/monitoring', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ level, data, timestamp: Date.now() })
    // }).catch(console.error);
  }

  public getMetrics(): Record<string, number[]> {
    return { ...this.performanceMetrics };
  }

  public resetMetrics(): void {
    this.performanceMetrics = {};
    this.errorCount = 0;
    this.consecutiveErrors = 0;
  }
}

// Export singleton instance
export const monitoring = new MonitoringService();

export default monitoring;
