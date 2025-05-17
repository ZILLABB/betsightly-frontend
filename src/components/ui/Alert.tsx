import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const alertVariants = cva(
  "relative w-full rounded-lg border p-4",
  {
    variants: {
      variant: {
        default: "bg-[var(--background)] border-[var(--border)] text-[var(--foreground)]",
        primary: "bg-[var(--primary)]/10 border-[var(--primary)]/20 text-[var(--primary)]",
        secondary: "bg-[var(--secondary)]/10 border-[var(--secondary)]/20 text-[var(--secondary)]",
        success: "bg-green-500/10 border-green-500/20 text-green-500",
        danger: "bg-red-500/10 border-red-500/20 text-red-500",
        warning: "bg-amber-500/10 border-amber-500/20 text-amber-500",
        info: "bg-blue-500/10 border-blue-500/20 text-blue-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /**
   * Whether to show an icon before the alert content
   * Note: This is not used if you provide your own icon in children
   */
  showIcon?: boolean;
}

/**
 * Alert Component
 *
 * Displays important messages to the user with different visual styles based on the context.
 *
 * Usage examples:
 *
 * Basic usage:
 * <Alert variant="info">This is an informational message</Alert>
 *
 * With custom content:
 * <Alert variant="danger" className="flex items-center justify-between">
 *   <div className="flex items-center">
 *     <AlertCircle className="mr-2 h-5 w-5" />
 *     <span>Error message</span>
 *   </div>
 *   <Button variant="outline" size="sm">Try Again</Button>
 * </Alert>
 */
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", showIcon = false, children, ...props }, ref) => {
    // Get default icon based on variant
    const getDefaultIcon = () => {
      switch (variant) {
        case "success":
          return <CheckCircle className="h-5 w-5 mr-2" />;
        case "danger":
          return <AlertTriangle className="h-5 w-5 mr-2" />;
        case "warning":
          return <AlertTriangle className="h-5 w-5 mr-2" />;
        case "info":
          return <Info className="h-5 w-5 mr-2" />;
        default:
          return <AlertCircle className="h-5 w-5 mr-2" />;
      }
    };

    // If showIcon is true and children is a string, wrap it with an icon
    const content = typeof children === 'string' && showIcon
      ? (
        <div className="flex items-center">
          {getDefaultIcon()}
          <span>{children}</span>
        </div>
      )
      : children;

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {content}
      </div>
    );
  }
);

Alert.displayName = "Alert";

export default Alert;
