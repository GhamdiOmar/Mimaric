import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex flex-nowrap items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 w-fit active:scale-95 select-none",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary/95 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5",
        secondary: "border-1.5 border-primary bg-white text-primary hover:bg-primary/10",
        success: "bg-secondary text-white shadow-md shadow-secondary/20 hover:bg-secondary/95 hover:shadow-lg hover:shadow-secondary/30 hover:-translate-y-0.5",
        danger: "bg-destructive text-white shadow-md shadow-destructive/20 hover:bg-destructive/95 hover:shadow-lg hover:shadow-destructive/30 hover:-translate-y-0.5",
        ghost: "hover:bg-muted hover:text-muted-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-5 py-2",
        lg: "h-12 px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={{ display: "inline-flex", flexWrap: "nowrap", ...props.style }}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
