import React, { forwardRef } from 'react';
import { generateId } from '../../utils/accessibility';

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The content of the button
   */
  children: React.ReactNode;
  
  /**
   * The variant of the button
   */
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'premium';
  
  /**
   * The size of the button
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
  
  /**
   * Whether the button is loading
   */
  loading?: boolean;
  
  /**
   * The icon to display before the button text
   */
  startIcon?: React.ReactNode;
  
  /**
   * The icon to display after the button text
   */
  endIcon?: React.ReactNode;
  
  /**
   * Additional description for screen readers
   */
  ariaDescription?: string;
  
  /**
   * Whether the button is expanded (for dropdown buttons)
   */
  expanded?: boolean;
  
  /**
   * The ID of the element controlled by this button
   */
  controls?: string;
  
  /**
   * Additional class names
   */
  className?: string;
}

/**
 * An accessible button component that follows WAI-ARIA best practices
 */
const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    {
      children,
      variant = 'default',
      size = 'md',
      disabled = false,
      loading = false,
      startIcon,
      endIcon,
      ariaDescription,
      expanded,
      controls,
      className = '',
      ...props
    },
    ref
  ) => {
    // Generate unique IDs for accessibility
    const buttonId = props.id || generateId('button');
    const descriptionId = ariaDescription ? generateId('button-desc') : undefined;
    
    // Base styles
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#F5A623] focus:ring-offset-2 focus:ring-offset-[#121219]';
    
    // Variant styles
    const variantStyles = {
      default: 'bg-[#F5A623] text-black hover:bg-[#F8BD4F] active:bg-[#E09000]',
      outline: 'bg-transparent border border-[#2A2A3C] text-white hover:bg-[#1A1A27] active:bg-[#2A2A3C]',
      ghost: 'bg-transparent text-white hover:bg-[#1A1A27] active:bg-[#2A2A3C]',
      link: 'bg-transparent text-[#F5A623] hover:underline p-0 h-auto',
      premium: 'bg-gradient-to-r from-[#F5A623] to-[#F8BD4F] text-black hover:from-[#F8BD4F] hover:to-[#F5A623]'
    };
    
    // Size styles
    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5 rounded-md',
      md: 'text-sm px-4 py-2 rounded-lg',
      lg: 'text-base px-5 py-2.5 rounded-lg'
    };
    
    // Disabled styles
    const disabledStyles = disabled || loading
      ? 'opacity-50 cursor-not-allowed pointer-events-none'
      : '';
    
    // Combine all styles
    const buttonStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`;
    
    return (
      <>
        <button
          id={buttonId}
          ref={ref}
          disabled={disabled || loading}
          className={buttonStyles}
          aria-disabled={disabled || loading}
          aria-describedby={descriptionId}
          aria-expanded={expanded}
          aria-controls={controls}
          {...props}
        >
          {loading && (
            <span className="mr-2 inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          )}
          
          {startIcon && !loading && (
            <span className="mr-2">{startIcon}</span>
          )}
          
          {children}
          
          {endIcon && (
            <span className="ml-2">{endIcon}</span>
          )}
        </button>
        
        {ariaDescription && (
          <span id={descriptionId} className="sr-only">
            {ariaDescription}
          </span>
        )}
      </>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

export default AccessibleButton;
