"use client";

import { Toaster as SonnerToaster, toast } from "sonner";

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
}

function Toaster({
  position = "top-right",
  richColors = true,
  dir = "rtl",
  ...props
}: ToasterProps) {
  return (
    <SonnerToaster
      position={position}
      richColors={richColors}
      dir={dir}
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
