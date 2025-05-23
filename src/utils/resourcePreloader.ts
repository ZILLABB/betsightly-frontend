/**
 * Resource preloader utility for preloading assets and improving performance
 */

// List of critical resources to preload
const CRITICAL_IMAGES = [
  // Add critical images here if needed
];

const CRITICAL_FONTS = [
  // Add critical fonts here if needed
];

/**
 * Initialize resource preloading
 */
export function initResourcePreloading(): void {
  console.log('Resource preloading initialized');
  
  // Preload critical images
  preloadImages(CRITICAL_IMAGES);
  
  // Preload critical fonts
  preloadFonts(CRITICAL_FONTS);
  
  // Preload critical routes
  preloadRoutes([
    '/',
    '/predictions',
    '/fixtures'
  ]);
}

/**
 * Preload a list of images
 * @param urls - Array of image URLs to preload
 */
export function preloadImages(urls: string[]): void {
  urls.forEach(url => {
    if (!url) return;
    
    const img = new Image();
    img.src = url;
  });
}

/**
 * Preload a list of fonts
 * @param urls - Array of font URLs to preload
 */
export function preloadFonts(urls: string[]): void {
  urls.forEach(url => {
    if (!url) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = 'font';
    link.type = 'font/woff2'; // Adjust as needed
    link.crossOrigin = 'anonymous';
    
    document.head.appendChild(link);
  });
}

/**
 * Preload JavaScript for specific routes
 * @param routes - Array of routes to preload
 */
export function preloadRoutes(routes: string[]): void {
  // This is a simplified implementation
  // In a real app, you might use more sophisticated code splitting and preloading
  
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      console.log(`Preloading ${routes.length} routes during idle time`);
      // Actual preloading would happen here
    });
  } else {
    setTimeout(() => {
      console.log(`Preloading ${routes.length} routes with setTimeout fallback`);
      // Actual preloading would happen here
    }, 1000);
  }
}

/**
 * Dynamically preload a resource
 * @param url - URL of the resource to preload
 * @param type - Type of resource ('image', 'style', 'script', 'font')
 */
export function preloadResource(url: string, type: 'image' | 'style' | 'script' | 'font'): void {
  if (!url) return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  
  switch (type) {
    case 'image':
      link.as = 'image';
      break;
    case 'style':
      link.as = 'style';
      break;
    case 'script':
      link.as = 'script';
      break;
    case 'font':
      link.as = 'font';
      link.type = 'font/woff2'; // Adjust as needed
      link.crossOrigin = 'anonymous';
      break;
  }
  
  document.head.appendChild(link);
}
