import * as React from "react";
import { cn } from "../lib/utils";

export interface FieldWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

function FieldWrapper({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
  ...props
}: FieldWrapperProps) {
  return (
    <div className={cn("space-y-1.5", className)} {...props}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-foreground"
      >
        {label}
        {required && <span className="text-destructive ms-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      {!error && hint && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export { FieldWrapper };
