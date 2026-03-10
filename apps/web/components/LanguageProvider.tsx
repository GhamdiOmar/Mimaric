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
