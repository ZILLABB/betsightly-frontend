import React, { useState, useEffect, useRef } from 'react';
import { useBreakpoints } from '../../hooks/useMediaQuery';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholderSrc?: string;
  lowResSrc?: string;
  className?: string;
  loadingClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
  threshold?: number;
  rootMargin?: string;
  skipLazyLoading?: boolean;
}

/**
 * LazyImage component that uses Intersection Observer API to lazy load images
 * It also supports progressive loading with low-res placeholder
 */
const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholderSrc,
  lowResSrc,
  className = '',
  loadingClassName = 'opacity-0',
  onLoad,
  onError,
  threshold = 0.1,
  rootMargin = '200px 0px',
  skipLazyLoading = false,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(skipLazyLoading);
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc || lowResSrc || '');
  const imgRef = useRef<HTMLImageElement>(null);
  const { isMobile } = useBreakpoints();

  // Determine if we should use a lower resolution image on mobile
  const targetSrc = isMobile && lowResSrc ? lowResSrc : src;

  // Set up intersection observer to detect when image is visible
  useEffect(() => {
    if (skipLazyLoading) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    const imgElement = imgRef.current;
    if (imgElement) {
      observer.observe(imgElement);
    }

    return () => {
      if (imgElement) {
        observer.unobserve(imgElement);
      }
    };
  }, [skipLazyLoading, threshold, rootMargin]);

  // Load the actual image when the component becomes visible
  useEffect(() => {
    if (!isVisible) return;

    // If we have a low-res version and we're not already showing it, show it first
    if (lowResSrc && currentSrc !== lowResSrc) {
      setCurrentSrc(lowResSrc);
    } else {
      // Otherwise, load the full resolution image
      const img = new Image();
      img.src = targetSrc;
      
      img.onload = () => {
        setCurrentSrc(targetSrc);
        setIsLoaded(true);
        if (onLoad) onLoad();
      };
      
      img.onerror = () => {
        if (onError) onError();
      };
    }
  }, [isVisible, targetSrc, lowResSrc, currentSrc, onLoad, onError]);

  return (
    <img
      ref={imgRef}
      src={currentSrc || placeholderSrc || 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='}
      alt={alt}
      className={`transition-opacity duration-300 ${isLoaded ? className : `${className} ${loadingClassName}`}`}
      loading="lazy"
      {...props}
    />
  );
};

export default LazyImage;
