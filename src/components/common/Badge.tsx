import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium font-jakarta transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "border-amber-500/30 bg-amber-500/20 text-amber-400",
        secondary:
          "border-gray-700 bg-gray-800 text-white",
        destructive:
          "border-red-500/30 bg-red-500/20 text-red-400",
        outline:
          "border-amber-500/30 bg-transparent text-amber-400",
        success:
          "border-green-500/30 bg-green-500/20 text-green-400",
        error:
          "border-red-500/30 bg-red-500/20 text-red-400",
        warning:
          "border-amber-500/30 bg-amber-500/20 text-amber-400",
        info:
          "border-blue-500/30 bg-blue-500/20 text-blue-400",
        premium:
          "border-amber-500/50 bg-amber-500/10 text-amber-400",
        live:
          "border-red-500/30 bg-red-500/20 text-red-400",
        upcoming:
          "border-blue-500/30 bg-blue-500/20 text-blue-400",
        completed:
          "border-green-500/30 bg-green-500/20 text-green-400",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
