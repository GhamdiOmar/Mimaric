import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 uppercase",
  {
    variants: {
      variant: {
        /* Domain-specific */
        available: "bg-secondary/10 text-secondary border-transparent",
        reserved: "bg-accent/10 text-accent border-transparent",
        sold: "bg-primary/10 text-primary border-transparent",
        rented: "bg-secondary/10 text-secondary border-transparent",
        maintenance: "bg-warning/10 text-warning border-transparent",
        overdue: "bg-destructive/10 text-destructive border-transparent",
        draft: "bg-muted text-muted-foreground border-transparent",
        /* Generic semantic */
        success: "bg-success/10 text-success border-transparent",
        info: "bg-info/10 text-info border-transparent",
        warning: "bg-warning/10 text-warning border-transparent",
        pending: "bg-accent/10 text-accent border-transparent",
        error: "bg-destructive/10 text-destructive border-transparent",
        /* Neutral */
        default: "bg-muted text-muted-foreground border-transparent",
        outline: "border border-border text-muted-foreground bg-transparent",
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
