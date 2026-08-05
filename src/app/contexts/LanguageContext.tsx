import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import {
  translations, LANGUAGES,
  type LangCode, type TranslationKeys, type Language,
} from "../i18n/translations";

interface LanguageContextValue {
  lang: LangCode;
  setLang: (code: LangCode) => void;
  t: (key: keyof TranslationKeys) => string;
  currentLanguage: Language;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  t: (key) => key as string,
  currentLanguage: LANGUAGES[0],
  isRTL: false,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(() => {
    try {
      return (localStorage.getItem("chitfund_lang") as LangCode) || "en";
    } catch {
      return "en";
    }
  });

  const setLang = (code: LangCode) => {
    setLangState(code);
    try {
      localStorage.setItem("chitfund_lang", code);
    } catch {}
  };

  const currentLanguage = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];
  const isRTL = currentLanguage.rtl ?? false;

  // Apply RTL direction to document
  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang, isRTL]);

  const t = (key: keyof TranslationKeys): string => {
    const dict = translations[lang];
    // Try current language → fall back to English → fall back to key string
    return (dict?.[key] ?? translations.en[key] ?? key) as string;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, currentLanguage, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
