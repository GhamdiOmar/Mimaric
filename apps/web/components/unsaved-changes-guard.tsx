"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui";
import { useLanguage } from "./LanguageProvider";

interface UnsavedChangesGuardProps {
  isDirty: boolean;
}

const LABELS = {
  ar: {
    title: "تغييرات غير محفوظة",
    description: "لديك تغييرات غير محفوظة. هل تريد المغادرة بدون حفظ؟",
    stay: "البقاء",
    leave: "مغادرة",
  },
  en: {
    title: "Unsaved Changes",
    description: "You have unsaved changes. Are you sure you want to leave without saving?",
    stay: "Stay",
    leave: "Leave",
  },
};

/**
 * Guard component that warns users when navigating away with unsaved changes.
 * Uses both browser beforeunload (for tab close/refresh) and Next.js router
 * interception (for client-side navigation).
 */
export function UnsavedChangesGuard({ isDirty }: UnsavedChangesGuardProps) {
  const { lang } = useLanguage();
  const t = LABELS[lang];
  const [showDialog, setShowDialog] = React.useState(false);
  const pendingUrlRef = React.useRef<string | null>(null);
  const router = useRouter();

  // Browser beforeunload for tab close / hard navigation
  React.useEffect(() => {
    if (!isDirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Chrome requires returnValue to be set
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Intercept Next.js client-side navigation via popstate
  React.useEffect(() => {
    if (!isDirty) return;

    const handler = (e: PopStateEvent) => {
      if (isDirty) {
        // Push the current URL back to prevent navigation
        window.history.pushState(null, "", window.location.href);
        setShowDialog(true);
      }
    };

    // Push current state so we can intercept back button
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handler);

    return () => window.removeEventListener("popstate", handler);
  }, [isDirty]);

  const handleLeave = () => {
    setShowDialog(false);
    if (pendingUrlRef.current) {
      router.push(pendingUrlRef.current);
      pendingUrlRef.current = null;
    } else {
      // Allow back navigation
      window.history.back();
    }
  };

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.title}</AlertDialogTitle>
          <AlertDialogDescription>{t.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.stay}</AlertDialogCancel>
          <AlertDialogAction onClick={handleLeave} className="bg-destructive text-destructive-foreground">
            {t.leave}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
