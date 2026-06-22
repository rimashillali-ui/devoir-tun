import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { translations, type Lang, type Dict } from "./translations";

type Ctx = {
  lang: Lang;
  dir: "rtl" | "ltr";
  t: Dict;
  setLang: (l: Lang) => void;
  toggle: () => void;
};

const LanguageContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "devoiratouna-lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (stored === "ar" || stored === "fr") setLangState(stored);
    } catch {}
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  }, []);

  const toggle = useCallback(() => setLang(lang === "ar" ? "fr" : "ar"), [lang, setLang]);

  return (
    <LanguageContext.Provider value={{ lang, dir: lang === "ar" ? "rtl" : "ltr", t: translations[lang], setLang, toggle }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}

export function pickTitle(lang: Lang, ar: string, fr?: string | null) {
  if (lang === "ar") return ar;
  return fr && fr.trim() ? fr : ar;
}
