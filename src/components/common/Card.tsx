import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const cardVariants = cva(
  "rounded-lg border shadow-sm transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-b from-gray-900 to-black border-amber-500/20",
        premium: "bg-gradient-to-r from-amber-500/10 to-amber-600/10 border-amber-500/30",
        dark: "bg-black border-gray-800",
        surface: "bg-[#1A1A27] border-[#2A2A3C]/30",
      },
      hover: {
        default: "hover:shadow-md",
        lift: "hover:shadow-md hover:-translate-y-1",
        glow: "hover:shadow-amber-500/20 hover:border-amber-500/40",
        none: "",
      }
    },
    defaultVariants: {
      variant: "default",
      hover: "default",
    },
  }
);

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>
>(({ className, variant, hover, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(cardVariants({ variant, hover, className }))}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { noPadding?: boolean }
>(({ className, noPadding = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5",
      noPadding ? "" : "p-4 md:p-6",
      className
    )}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    font?: 'clash' | 'outfit' | 'jakarta';
  }
>(({ className, size = 'md', font = 'clash', ...props }, ref) => {
  const sizeClasses = {
    sm: "text-lg md:text-xl",
    md: "text-xl md:text-2xl",
    lg: "text-2xl md:text-3xl",
    xl: "text-3xl md:text-4xl"
  };

  const fontClasses = {
    clash: "font-clash",
    outfit: "font-outfit",
    jakarta: "font-jakarta"
  };

  return (
    <h3
      ref={ref}
      className={cn(
        "font-semibold leading-tight tracking-tight",
        sizeClasses[size],
        fontClasses[font],
        className
      )}
      {...props}
    />
  );
});
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    size?: 'xs' | 'sm' | 'md';
    opacity?: 'high' | 'medium' | 'low';
  }
>(({ className, size = 'sm', opacity = 'medium', ...props }, ref) => {
  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base"
  };

  const opacityClasses = {
    high: "text-white",
    medium: "text-white/70",
    low: "text-white/50"
  };

  return (
    <p
      ref={ref}
      className={cn(
        "font-jakarta",
        sizeClasses[size],
        opacityClasses[opacity],
        className
      )}
      {...props}
    />
  );
});
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { noPadding?: boolean }
>(({ className, noPadding = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      noPadding ? "" : "p-4 md:p-6",
      className
    )}
    {...props}
  />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { noPadding?: boolean }
>(({ className, noPadding = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center",
      noPadding ? "" : "px-4 md:px-6 pb-4 md:pb-6",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
