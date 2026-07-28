import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-accent)]/10 text-[var(--color-accent-text)]",
        secondary:
          "bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]",
        destructive:
          "bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
        success:
          "bg-[var(--color-success)]/10 text-[var(--color-success)]",
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
