import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";
import { HapticInteractions } from "../../utils/hapticFeedback";

const buttonVariants = cva(
  "btn-base font-jakarta focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 transform hover:scale-[1.02] active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "btn-primary",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline: "border border-amber-500/30 bg-transparent text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50",
        secondary: "btn-secondary",
        ghost: "btn-ghost",
        link: "text-amber-400 underline-offset-4 hover:underline bg-transparent shadow-none",
        premium: "btn-primary bg-gradient-primary hover:opacity-90",
      },
      size: {
        default: "btn-md",
        sm: "btn-sm",
        md: "btn-md",
        lg: "btn-lg",
        xl: "btn-lg px-8 text-lg",
        icon: "btn-md w-10 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  shortcut?: string;
  shortcutDescription?: string;
  enableHaptic?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, shortcut, shortcutDescription, enableHaptic = true, children, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    // Enhanced click handler with haptic feedback
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      // Trigger haptic feedback if enabled
      if (enableHaptic) {
        HapticInteractions.buttonPress();
      }

      // Call the original onClick handler
      if (onClick) {
        onClick(event);
      }
    };

    // Add keyboard shortcut to aria-label if provided
    let ariaLabel = props['aria-label'] || props.title || '';
    if (shortcut && shortcutDescription) {
      ariaLabel = `${ariaLabel || (typeof children === 'string' ? children : '')} (${shortcutDescription})`.trim();
    }

    // When using asChild, we need to be careful with children
    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          aria-label={ariaLabel || undefined}
          onClick={handleClick}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    // For regular buttons, we can include the shortcut
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        aria-label={ariaLabel || undefined}
        onClick={handleClick}
        {...props}
      >
        <span className="flex items-center">
          {children}
          {shortcut && (
            <kbd className="ml-2 hidden md:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground opacity-70">
              {shortcut}
            </kbd>
          )}
        </span>
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
