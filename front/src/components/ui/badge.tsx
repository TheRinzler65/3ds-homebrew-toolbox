import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-accent-muted)] text-[var(--color-accent-text)]",
        secondary:
          "bg-[var(--color-surface-raised)] text-[var(--color-text-muted)]",
        destructive:
          "bg-red-900/40 text-red-400",
        success:
          "bg-green-900/40 text-green-400",
        outline:
          "border border-[var(--color-border)] text-[var(--color-text-muted)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
