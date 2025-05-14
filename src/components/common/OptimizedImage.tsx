/**
 * OptimizedImage Component
 *
 * A component for rendering optimized, responsive images with lazy loading,
 * proper aspect ratio preservation, and modern image formats.
 *
 * Optimized for Core Web Vitals:
 * - Improves LCP by preloading priority images
 * - Prevents CLS by reserving space with aspect ratio
 * - Uses native lazy loading for non-priority images
 * - Supports modern image formats (WebP, AVIF)
 */

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../utils/classNames';

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** The source URL of the image */
  src: string;
  /** Alternative text for the image */
  alt: string;
  /** Width of the image in pixels */
  width?: number;
  /** Height of the image in pixels */
  height?: number;
  /** Optional WebP source URL for better performance */
  webpSrc?: string;
  /** Optional AVIF source URL for even better performance */
  avifSrc?: string;
  /** Whether to lazy load the image */
  lazyLoad?: boolean;
  /** Aspect ratio to maintain (e.g., "16/9", "4/3", "1/1") */
  aspectRatio?: string;
  /** Optional blur hash for a nice loading effect */
  blurHash?: string;
  /** Whether to use a blur-up effect while loading */
  blurUp?: boolean;
  /** Optional object-fit property */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  /** Optional object-position property */
  objectPosition?: string;
  /**
   * Optional loading priority - when true:
   * - Sets loading="eager"
   * - Adds preload link to head
   * - Disables blur-up effect
   */
  priority?: boolean;
  /** Optional fetchpriority attribute */
  fetchPriority?: 'high' | 'low' | 'auto';
  /** Optional callback when image is loaded */
  onLoad?: () => void;
  /** Optional callback when image fails to load */
  onError?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  webpSrc,
  avifSrc,
  lazyLoad = true,
  aspectRatio = 'auto',
  blurHash,
  blurUp = false,
  objectFit = 'cover',
  objectPosition = 'center',
  priority = false,
  fetchPriority = priority ? 'high' : 'auto',
  className,
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Add preload link for priority images
  useEffect(() => {
    if (priority && src) {
      // Check if preload link already exists
      const existingPreload = document.head.querySelector(`link[rel="preload"][href="${src}"]`);

      if (!existingPreload) {
        const preloadLink = document.createElement('link');
        preloadLink.rel = 'preload';
        preloadLink.href = src;
        preloadLink.as = 'image';

        // Add imagesrcset and imagesizes if we have width
        if (width) {
          const srcSet = generateSrcSet(src);
          if (srcSet) {
            preloadLink.setAttribute('imagesrcset', srcSet);
            preloadLink.setAttribute('imagesizes', `${width}px`);
          }
        }

        document.head.appendChild(preloadLink);

        // Clean up
        return () => {
          document.head.removeChild(preloadLink);
        };
      }
    }
  }, [priority, src]);

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  // Handle image error
  const handleError = () => {
    setError(true);
    if (onError) onError();
  };

  // Generate srcset for responsive images
  const generateSrcSet = (baseSrc: string) => {
    if (!baseSrc) return undefined;

    // Extract file extension and path
    const lastDotIndex = baseSrc.lastIndexOf('.');
    if (lastDotIndex === -1) return undefined;

    const extension = baseSrc.substring(lastDotIndex);
    const basePath = baseSrc.substring(0, lastDotIndex);

    // Generate srcset with different sizes
    return `${basePath}-sm${extension} 640w, ${basePath}${extension} 1280w, ${basePath}-lg${extension} 1920w`;
  };

  // Determine loading attribute
  const loadingAttr = priority ? 'eager' : (lazyLoad ? 'lazy' : 'eager');

  // Calculate aspect ratio style
  const aspectRatioStyle = aspectRatio !== 'auto'
    ? { aspectRatio, overflow: 'hidden' }
    : {};

  // If width and height are provided but no aspectRatio, calculate it
  const calculatedStyle = {...aspectRatioStyle};
  if (width && height && aspectRatio === 'auto') {
    calculatedStyle.aspectRatio = `${width} / ${height}`;
  }

  // Determine if we should show a blur placeholder
  // Don't show for priority images to improve LCP
  const showBlurPlaceholder = blurUp && !isLoaded && blurHash && !priority;

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        className
      )}
      style={{
        ...calculatedStyle,
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
      }}
      data-lcp-element={priority ? 'true' : undefined}
    >
      {/* Blur placeholder */}
      {showBlurPlaceholder && (
        <div
          className="absolute inset-0 z-0 blur-md transform scale-110"
          style={{
            backgroundImage: `url(${blurHash})`,
            backgroundSize: 'cover',
            backgroundPosition: objectPosition,
          }}
        />
      )}

      {/* Actual image with picture element for format fallbacks */}
      <picture>
        {/* AVIF format - best compression, modern browsers */}
        {avifSrc && (
          <source
            srcSet={generateSrcSet(avifSrc)}
            type="image/avif"
          />
        )}

        {/* WebP format - good compression, wide support */}
        {webpSrc && (
          <source
            srcSet={generateSrcSet(webpSrc)}
            type="image/webp"
          />
        )}

        {/* Original format fallback */}
        <img
          ref={imgRef}
          src={src}
          srcSet={generateSrcSet(src)}
          alt={alt}
          loading={loadingAttr}
          fetchPriority={fetchPriority}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "w-full h-full transition-opacity duration-500",
            objectFit === 'contain' ? 'object-contain' :
            objectFit === 'cover' ? 'object-cover' :
            objectFit === 'fill' ? 'object-fill' :
            objectFit === 'none' ? 'object-none' : 'object-scale-down',
            isLoaded ? 'opacity-100' : (priority ? 'opacity-100' : 'opacity-0'),
            error ? 'hidden' : 'block'
          )}
          style={{ objectPosition }}
          width={width}
          height={height}
          decoding={priority ? 'sync' : 'async'}
          {...props}
        />
      </picture>

      {/* Error fallback */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Failed to load image
          </span>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
