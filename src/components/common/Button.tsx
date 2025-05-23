import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium font-jakarta ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-amber-500 text-black hover:bg-amber-600",
        destructive:
          "bg-red-500 text-white hover:bg-red-600",
        outline:
          "border border-amber-500/30 bg-transparent text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50",
        secondary:
          "bg-gray-800 text-white hover:bg-gray-700",
        ghost: "hover:bg-gray-800 hover:text-white",
        link: "text-amber-400 underline-offset-4 hover:underline",
        premium: "bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:opacity-90",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-8 rounded-md px-3 text-xs",
        md: "h-9 rounded-md px-4 text-sm",
        lg: "h-11 rounded-md px-6 text-base",
        xl: "h-12 rounded-md px-8 text-lg",
        icon: "h-10 w-10 text-sm",
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, shortcut, shortcutDescription, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

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
