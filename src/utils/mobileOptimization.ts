import { useBreakpoints } from '../hooks/useMediaQuery';

/**
 * Utility functions for mobile optimization
 */

/**
 * Determines if an image should be loaded in low resolution based on device type and network
 * @returns Boolean indicating if low resolution images should be used
 */
export const shouldUseLowResImages = (): boolean => {
  // Check if the device is on a slow connection
  const connection = (navigator as any).connection;
  
  if (connection) {
    // Use low res images on slow connections or when data saver is enabled
    if (connection.saveData || 
        connection.effectiveType === 'slow-2g' || 
        connection.effectiveType === '2g' || 
        connection.effectiveType === '3g') {
      return true;
    }
  }
  
  // Check if the device is mobile
  const isMobile = window.matchMedia('(max-width: 639px)').matches;
  
  return isMobile;
};

/**
 * Optimizes data for mobile devices by reducing the amount of data loaded
 * @param data Array of data items
 * @param isMobile Boolean indicating if the device is mobile
 * @param limit Optional limit for the number of items to return
 * @returns Optimized data array
 */
export const optimizeDataForMobile = <T>(
  data: T[],
  isMobile: boolean,
  limit?: number
): T[] => {
  if (!data || !Array.isArray(data)) return [];
  
  // If not mobile or no limit specified, return the original data
  if (!isMobile || !limit) return data;
  
  // Return a limited subset of data for mobile devices
  return data.slice(0, limit);
};

/**
 * Hook to get optimized data for the current device
 * @param data Array of data items
 * @param mobileLimit Limit for mobile devices
 * @param tabletLimit Limit for tablet devices
 * @returns Optimized data array
 */
export const useOptimizedData = <T>(
  data: T[],
  mobileLimit: number = 5,
  tabletLimit: number = 10
): T[] => {
  const { isMobile, isTablet } = useBreakpoints();
  
  if (isMobile) {
    return optimizeDataForMobile(data, true, mobileLimit);
  } else if (isTablet) {
    return optimizeDataForMobile(data, false, tabletLimit);
  }
  
  return data;
};

/**
 * Debounces a function call for better performance on mobile
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>): void => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
};

/**
 * Throttles a function call for better performance on mobile
 * @param func Function to throttle
 * @param limit Limit time in milliseconds
 * @returns Throttled function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number = 300
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false;
  
  return (...args: Parameters<T>): void => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * Checks if the device has a touch screen
 * @returns Boolean indicating if the device has a touch screen
 */
export const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * Checks if the device is in portrait orientation
 * @returns Boolean indicating if the device is in portrait orientation
 */
export const isPortraitOrientation = (): boolean => {
  return window.matchMedia('(orientation: portrait)').matches;
};

/**
 * Checks if the device is on a slow network connection
 * @returns Boolean indicating if the device is on a slow connection
 */
export const isSlowConnection = (): boolean => {
  const connection = (navigator as any).connection;
  
  if (!connection) return false;
  
  return connection.saveData || 
         connection.effectiveType === 'slow-2g' || 
         connection.effectiveType === '2g' || 
         connection.effectiveType === '3g';
};

export default {
  shouldUseLowResImages,
  optimizeDataForMobile,
  useOptimizedData,
  debounce,
  throttle,
  isTouchDevice,
  isPortraitOrientation,
  isSlowConnection
};
