import * as React from "react";
import { cn } from "../lib/utils";

export interface FormSectionProps extends React.HTMLAttributes<HTMLFieldSetElement> {
  title: string;
  description?: string;
}

function FormSection({
  title,
  description,
  children,
  className,
  ...props
}: FormSectionProps) {
  return (
    <fieldset
      className={cn("space-y-4 rounded-lg border border-border bg-card p-5", className)}
      {...props}
    >
      <div className="mb-4">
        <legend className="text-base font-semibold text-foreground">{title}</legend>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </fieldset>
  );
}

export { FormSection };
