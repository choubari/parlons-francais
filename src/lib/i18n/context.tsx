"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { MESSAGES, type Locale, type Messages } from "./messages";
import type { Localized } from "@/lib/exercises/types";

type I18n = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Messages;
  /** Pick the right string from a localized data field. */
  L: (val: Localized) => string;
};

const Ctx = createContext<I18n | null>(null);
const KEY = "cct.locale";

function detect(): Locale {
  if (typeof navigator === "undefined") return "fr";
  return navigator.language?.toLowerCase().startsWith("en") ? "en" : "fr";
}

/**
 * The user's chosen locale, read straight from storage. Use this for
 * locale-dependent server calls (judge, token) made in mount effects, where
 * the provider's async load may not have applied the saved value yet.
 */
export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "fr";
  const v = window.localStorage.getItem(KEY);
  if (v === "fr" || v === "en") return v;
  return detect();
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");

  useEffect(() => {
    const saved = (localStorage.getItem(KEY) as Locale | null) ?? detect();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocaleState(saved);
    document.documentElement.lang = saved;
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem(KEY, l);
    document.documentElement.lang = l;
  }

  const value: I18n = {
    locale,
    setLocale,
    t: MESSAGES[locale],
    L: (val) => val[locale],
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used within LocaleProvider");
  return ctx;
}
