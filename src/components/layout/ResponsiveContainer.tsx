import React from 'react';
import { useBreakpoints } from '../../hooks/useMediaQuery';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  mobileClassName?: string;
  tabletClassName?: string;
  desktopClassName?: string;
}

/**
 * A container component that applies different classes based on screen size
 */
const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  mobileClassName = '',
  tabletClassName = '',
  desktopClassName = '',
}) => {
  const { isMobile, isTablet, isDesktop } = useBreakpoints();

  // Determine which class to apply based on screen size
  const responsiveClass = isMobile
    ? mobileClassName
    : isTablet
    ? tabletClassName
    : desktopClassName;

  return (
    <div className={`${className} ${responsiveClass}`}>
      {children}
    </div>
  );
};

export default ResponsiveContainer;
