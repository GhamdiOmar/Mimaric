"use client";

import { Toaster as SonnerToaster, toast } from "sonner";

let useThemeHook: (() => { theme?: string }) | undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  useThemeHook = require("next-themes").useTheme;
} catch {
  /* next-themes is an optional peer dependency */
}

interface ToasterProps {
  position?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "top-center"
    | "bottom-center";
  richColors?: boolean;
  dir?: "ltr" | "rtl";
  theme?: "light" | "dark" | "system";
}

function Toaster({
  position = "top-right",
  richColors = true,
  dir = "rtl",
  theme: themeProp,
  ...props
}: ToasterProps) {
  const resolvedTheme = useThemeHook?.()?.theme ?? themeProp ?? "system";

  return (
    <SonnerToaster
      position={position}
      richColors={richColors}
      dir={dir}
      theme={resolvedTheme as "light" | "dark" | "system"}
      toastOptions={{
        classNames: {
          toast:
            "group border-border bg-card text-card-foreground shadow-lg rounded-md",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
          success: "border-l-4 border-l-success",
          error: "border-l-4 border-l-destructive",
          warning: "border-l-4 border-l-warning",
          info: "border-l-4 border-l-info",
        },
        duration: 4000,
      }}
      {...props}
    />
  );
}

export { Toaster, toast };
