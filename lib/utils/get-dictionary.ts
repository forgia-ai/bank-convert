// lib/get-dictionary.ts
import "server-only"
import type { Locale } from "@/i18n-config"
import { i18n } from "@/i18n-config"

// We enumerate all dictionaries here for better linting and typescript support
const dictionaries = {
  en: () => import("@/dictionaries/en.json").then((module) => module.default),
  es: () => import("@/dictionaries/es.json").then((module) => module.default),
  pt: () => import("@/dictionaries/pt.json").then((module) => module.default),
  // Add other locales from i18n.locales here
} as const

export const getDictionary = async (locale: Locale) => {
  // Fallback to defaultLocale if the requested locale's dictionary doesn't exist
  const loadFunction = dictionaries[locale] ?? dictionaries[i18n.defaultLocale]
  if (!loadFunction) {
    console.warn(
      `No dictionary found for locale: ${locale}, falling back to default: ${i18n.defaultLocale}`,
    )
    return dictionaries[i18n.defaultLocale]()
  }
  return loadFunction()
}

// Example type for your dictionary structure for better autocompletion and type safety.
// You can generate this or define it manually based on your JSON files.
/*
export type Dictionary = {
  navbar: {
    home: string;
    dashboard: string;
    // ... other navbar keys
  };
  homepage: {
    welcomeTitle: string;
    welcomeSubtitle: string;
  };
  // ... other page/component keys
};
*/
