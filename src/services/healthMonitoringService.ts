/**
 * Health Monitoring Service
 * 
 * This service provides comprehensive health monitoring capabilities including:
 * - Real-time system health checks
 * - Component status monitoring
 * - Performance metrics tracking
 * - Auto-refresh health monitoring
 */

import { 
  checkAPIHealth, 
  getDetailedHealthStatus, 
  checkAPIReadiness, 
  checkAPILiveness,
  type DetailedHealthStatus 
} from './unifiedApiService';
import { getBasketballModelsStatus } from './basketballApiService';
import { AUTO_REFRESH_CONFIG } from '../config/apiConfig';

// Health monitoring types
export interface SystemHealthStatus {
  overall_status: 'healthy' | 'degraded' | 'unhealthy';
  last_updated: string;
  api_health: boolean;
  api_ready: boolean;
  api_alive: boolean;
  detailed_status?: DetailedHealthStatus;
  basketball_models_active: boolean;
  response_times: {
    health_check: number;
    readiness_check: number;
    liveness_check: number;
  };
}

export interface HealthMonitoringConfig {
  enabled: boolean;
  interval: number;
  retries: number;
  timeout: number;
}

// Health monitoring state
let healthMonitoringInterval: NodeJS.Timeout | null = null;
let currentHealthStatus: SystemHealthStatus | null = null;
let healthStatusCallbacks: ((status: SystemHealthStatus) => void)[] = [];

/**
 * Start health monitoring with auto-refresh
 * @param config Health monitoring configuration
 */
export function startHealthMonitoring(config: HealthMonitoringConfig = {
  enabled: AUTO_REFRESH_CONFIG.ENABLED,
  interval: AUTO_REFRESH_CONFIG.HEALTH_INTERVAL,
  retries: AUTO_REFRESH_CONFIG.MAX_RETRIES,
  timeout: 5000
}): void {
  if (!config.enabled) {
    console.log('Health monitoring disabled');
    return;
  }

  console.log(`Starting health monitoring with ${config.interval}ms interval`);

  // Clear existing interval if any
  if (healthMonitoringInterval) {
    clearInterval(healthMonitoringInterval);
  }

  // Perform initial health check
  performHealthCheck();

  // Set up recurring health checks
  healthMonitoringInterval = setInterval(() => {
    performHealthCheck();
  }, config.interval);
}

/**
 * Stop health monitoring
 */
export function stopHealthMonitoring(): void {
  if (healthMonitoringInterval) {
    clearInterval(healthMonitoringInterval);
    healthMonitoringInterval = null;
    console.log('Health monitoring stopped');
  }
}

/**
 * Perform comprehensive health check
 */
async function performHealthCheck(): Promise<void> {
  try {
    console.log('Performing health check...');
    const startTime = Date.now();

    // Perform all health checks in parallel
    const [
      apiHealthResult,
      apiReadyResult,
      apiAliveResult,
      detailedStatusResult,
      basketballModelsResult
    ] = await Promise.allSettled([
      measureResponseTime(checkAPIHealth),
      measureResponseTime(checkAPIReadiness),
      measureResponseTime(checkAPILiveness),
      getDetailedHealthStatus(),
      getBasketballModelsStatus()
    ]);

    // Extract results and response times
    const apiHealth = apiHealthResult.status === 'fulfilled' ? apiHealthResult.value.result : false;
    const apiReady = apiReadyResult.status === 'fulfilled' ? apiReadyResult.value.result : false;
    const apiAlive = apiAliveResult.status === 'fulfilled' ? apiAliveResult.value.result : false;
    const detailedStatus = detailedStatusResult.status === 'fulfilled' ? detailedStatusResult.value : null;
    const basketballModels = basketballModelsResult.status === 'fulfilled' ? basketballModelsResult.value : [];

    // Calculate overall status
    const overallStatus = calculateOverallStatus(apiHealth, apiReady, apiAlive, detailedStatus);

    // Create health status object
    const healthStatus: SystemHealthStatus = {
      overall_status: overallStatus,
      last_updated: new Date().toISOString(),
      api_health: apiHealth,
      api_ready: apiReady,
      api_alive: apiAlive,
      detailed_status: detailedStatus || undefined,
      basketball_models_active: basketballModels.some(model => model.status === 'active'),
      response_times: {
        health_check: apiHealthResult.status === 'fulfilled' ? apiHealthResult.value.responseTime : -1,
        readiness_check: apiReadyResult.status === 'fulfilled' ? apiReadyResult.value.responseTime : -1,
        liveness_check: apiAliveResult.status === 'fulfilled' ? apiAliveResult.value.responseTime : -1,
      }
    };

    // Update current status
    currentHealthStatus = healthStatus;

    // Notify all callbacks
    healthStatusCallbacks.forEach(callback => {
      try {
        callback(healthStatus);
      } catch (error) {
        console.error('Error in health status callback:', error);
      }
    });

    console.log(`Health check completed in ${Date.now() - startTime}ms - Status: ${overallStatus}`);
  } catch (error) {
    console.error('Error performing health check:', error);
  }
}

/**
 * Measure response time for a function
 * @param fn Function to measure
 * @returns Result and response time
 */
async function measureResponseTime<T>(fn: () => Promise<T>): Promise<{ result: T; responseTime: number }> {
  const startTime = Date.now();
  const result = await fn();
  const responseTime = Date.now() - startTime;
  return { result, responseTime };
}

/**
 * Calculate overall system status
 * @param apiHealth API health status
 * @param apiReady API readiness status
 * @param apiAlive API liveness status
 * @param detailedStatus Detailed status information
 * @returns Overall system status
 */
function calculateOverallStatus(
  apiHealth: boolean,
  apiReady: boolean,
  apiAlive: boolean,
  detailedStatus: DetailedHealthStatus | null
): 'healthy' | 'degraded' | 'unhealthy' {
  // If API is not alive, system is unhealthy
  if (!apiAlive) {
    return 'unhealthy';
  }

  // If API is alive but not ready or healthy, system is degraded
  if (!apiReady || !apiHealth) {
    return 'degraded';
  }

  // Check detailed status if available
  if (detailedStatus) {
    const componentStatuses = Object.values(detailedStatus.components);
    const unhealthyComponents = componentStatuses.filter(comp => comp.status === 'unhealthy').length;
    const degradedComponents = componentStatuses.filter(comp => comp.status === 'degraded').length;

    if (unhealthyComponents > 0) {
      return 'unhealthy';
    }
    if (degradedComponents > 0) {
      return 'degraded';
    }
  }

  return 'healthy';
}

/**
 * Get current health status
 * @returns Current health status or null if not available
 */
export function getCurrentHealthStatus(): SystemHealthStatus | null {
  return currentHealthStatus;
}

/**
 * Subscribe to health status updates
 * @param callback Function to call when health status changes
 * @returns Unsubscribe function
 */
export function subscribeToHealthStatus(callback: (status: SystemHealthStatus) => void): () => void {
  healthStatusCallbacks.push(callback);
  
  // If we have current status, call the callback immediately
  if (currentHealthStatus) {
    callback(currentHealthStatus);
  }

  // Return unsubscribe function
  return () => {
    const index = healthStatusCallbacks.indexOf(callback);
    if (index > -1) {
      healthStatusCallbacks.splice(index, 1);
    }
  };
}

/**
 * Force a health check
 * @returns Promise that resolves when health check is complete
 */
export async function forceHealthCheck(): Promise<SystemHealthStatus | null> {
  await performHealthCheck();
  return currentHealthStatus;
}

/**
 * Get health monitoring status
 * @returns Whether health monitoring is active
 */
export function isHealthMonitoringActive(): boolean {
  return healthMonitoringInterval !== null;
}

export default {
  startHealthMonitoring,
  stopHealthMonitoring,
  getCurrentHealthStatus,
  subscribeToHealthStatus,
  forceHealthCheck,
  isHealthMonitoringActive
};
