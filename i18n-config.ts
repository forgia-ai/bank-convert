// i18n-config.ts
export const i18n = {
  defaultLocale: "en",
  locales: ["en", "es"], // Add other locales here e.g. ['en', 'de', 'es']
} as const

export type Locale = (typeof i18n)["locales"][number]
