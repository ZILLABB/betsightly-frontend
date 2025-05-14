import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './Card';
import { useBreakpoints } from '../../hooks/useMediaQuery';

interface MobileOptimizedCardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  variant?: 'default' | 'premium';
  isCollapsible?: boolean;
  defaultCollapsed?: boolean;
  collapseThreshold?: number;
  lazyRender?: boolean;
}

/**
 * A card component optimized for mobile devices with features like:
 * - Collapsible content for long cards
 * - Lazy rendering of content when visible
 * - Optimized rendering for mobile devices
 */
const MobileOptimizedCard: React.FC<MobileOptimizedCardProps> = ({
  children,
  title,
  footer,
  className = '',
  contentClassName = '',
  headerClassName = '',
  footerClassName = '',
  variant = 'default',
  isCollapsible = false,
  defaultCollapsed = false,
  collapseThreshold = 300, // Height in pixels before collapsing
  lazyRender = true,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [contentHeight, setContentHeight] = useState(0);
  const [isVisible, setIsVisible] = useState(!lazyRender);
  const [shouldRenderContent, setShouldRenderContent] = useState(!lazyRender);
  const contentRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useBreakpoints();

  // Measure content height to determine if collapsing is needed
  useEffect(() => {
    if (contentRef.current && isCollapsible) {
      const height = contentRef.current.scrollHeight;
      setContentHeight(height);
    }
  }, [children, isCollapsible]);

  // Set up intersection observer for lazy rendering
  useEffect(() => {
    if (!lazyRender) return;

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
        threshold: 0.1,
        rootMargin: '200px 0px',
      }
    );

    const cardElement = cardRef.current;
    if (cardElement) {
      observer.observe(cardElement);
    }

    return () => {
      if (cardElement) {
        observer.unobserve(cardElement);
      }
    };
  }, [lazyRender]);

  // Render content when visible
  useEffect(() => {
    if (isVisible && !shouldRenderContent) {
      setShouldRenderContent(true);
    }
  }, [isVisible, shouldRenderContent]);

  // Toggle collapse state
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Determine if we should show collapse UI
  const showCollapseUI = isCollapsible && contentHeight > collapseThreshold;

  return (
    <Card
      ref={cardRef}
      variant={variant}
      className={`transition-all duration-300 ${className}`}
    >
      {title && (
        <CardHeader className={headerClassName}>
          {typeof title === 'string' ? <CardTitle>{title}</CardTitle> : title}
        </CardHeader>
      )}

      <CardContent
        ref={contentRef}
        className={`${contentClassName} ${
          showCollapseUI && isCollapsed
            ? 'max-h-[200px] overflow-hidden relative'
            : ''
        }`}
      >
        {shouldRenderContent ? (
          children
        ) : (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-[var(--secondary)]/50 rounded w-3/4"></div>
            <div className="h-4 bg-[var(--secondary)]/50 rounded"></div>
            <div className="h-4 bg-[var(--secondary)]/50 rounded w-5/6"></div>
          </div>
        )}

        {showCollapseUI && isCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[var(--card)] to-transparent pointer-events-none"></div>
        )}
      </CardContent>

      {(footer || showCollapseUI) && (
        <CardFooter className={`flex justify-between items-center ${footerClassName}`}>
          {footer}
          
          {showCollapseUI && (
            <button
              onClick={toggleCollapse}
              className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors px-2 py-1 rounded-md hover:bg-[var(--secondary)]"
            >
              {isCollapsed ? 'Show more' : 'Show less'}
            </button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default MobileOptimizedCard;
