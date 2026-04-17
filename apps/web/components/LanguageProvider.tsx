"use client";

import * as React from "react";

type Lang = "ar" | "en";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  dir: "rtl" | "ltr";
}

const LanguageContext = React.createContext<LanguageContextValue>({
  lang: "ar",
  setLang: () => {},
  dir: "rtl",
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>("ar");
  const [hydrated, setHydrated] = React.useState(false);

  // Read from localStorage AFTER hydration to avoid SSR mismatch
  React.useEffect(() => {
    const stored = localStorage.getItem("mimaric-lang") as Lang | null;
    if (stored === "en" || stored === "ar") {
      setLangState(stored);
    }
    setHydrated(true);
  }, []);

  // Persist changes to localStorage (skip initial hydration write)
  React.useEffect(() => {
    if (hydrated) {
      localStorage.setItem("mimaric-lang", lang);
    }
  }, [lang, hydrated]);

  // Sync the <html> element so Tailwind's rtl: variants and CSS logical
  // properties align with the user's language choice across every page.
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const nextDir = lang === "ar" ? "rtl" : "ltr";
    if (root.getAttribute("dir") !== nextDir) root.setAttribute("dir", nextDir);
    if (root.getAttribute("lang") !== lang) root.setAttribute("lang", lang);
  }, [lang]);

  const setLang = React.useCallback((newLang: Lang) => {
    setLangState(newLang);
  }, []);

  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <LanguageContext.Provider value={{ lang, setLang, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return React.useContext(LanguageContext);
}
