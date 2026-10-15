"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  LOCALE_COOKIE,
  type Locale,
  type MessageValues,
  translate,
} from "@/lib/i18n";
import { errorMessage } from "@/lib/i18n/errors";

const LanguageContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, values?: MessageValues) => string;
  errorText: (error: string) => string;
} | null>(null);

export function LanguageProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, updateLocale] = useState(initialLocale);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const setLocale = useCallback((value: Locale) => {
    updateLocale(value);
    // biome-ignore lint/suspicious/noDocumentCookie: Persist a non-sensitive SSR preference in browsers without Cookie Store support.
    document.cookie = `${LOCALE_COOKIE}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  }, []);
  const t = useCallback(
    (key: string, values?: MessageValues) => translate(locale, key, values),
    [locale],
  );
  const errorText = useCallback(
    (error: string) => errorMessage(locale, error),
    [locale],
  );
  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, errorText }}>
      {children}
    </LanguageContext.Provider>
  );
}
export function useI18n() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("LanguageProvider is missing");
  return context;
}
