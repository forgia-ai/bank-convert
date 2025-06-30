import type { MetadataRoute } from "next"
import { i18n } from "@/i18n-config"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NODE_ENV === "production"
      ? "https://bankstatementconverter.com" // Replace with your actual domain
      : "http://localhost:3000"

  // Define pages with their properties
  const pages = [
    {
      path: "",
      priority: 1.0,
      changeFrequency: "weekly" as const,
    },
    {
      path: "/pricing",
      priority: 0.9,
      changeFrequency: "monthly" as const,
    },
    {
      path: "/about",
      priority: 0.7,
      changeFrequency: "monthly" as const,
    },
    {
      path: "/contact",
      priority: 0.6,
      changeFrequency: "monthly" as const,
    },
    {
      path: "/preview",
      priority: 0.8,
      changeFrequency: "weekly" as const,
    },
  ]

  // Generate sitemap entries for all locales and pages
  const sitemapEntries: MetadataRoute.Sitemap = []

  pages.forEach((page) => {
    i18n.locales.forEach((locale) => {
      const url = `${baseUrl}/${locale}${page.path}`

      // Create alternates for hreflang
      const alternates: { [key: string]: string } = {}
      i18n.locales.forEach((altLocale) => {
        alternates[altLocale] = `${baseUrl}/${altLocale}${page.path}`
      })
      // Add x-default pointing to English
      alternates["x-default"] = `${baseUrl}/en${page.path}`

      sitemapEntries.push({
        url,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: alternates,
        },
      })
    })
  })

  // Add bank-specific landing pages (future implementation)
  // These will be added when we create the bank-specific pages in Phase 3
  // const futurePages = [
  //   '/banks/chase',
  //   '/banks/bank-of-america',
  //   '/banks/wells-fargo',
  //   '/banks/citi',
  //   '/for/accountants',
  //   '/for/small-business',
  // ]

  // Uncomment when these pages are created:
  /*
  futurePages.forEach(path => {
    i18n.locales.forEach(locale => {
      const url = `${baseUrl}/${locale}${path}`
      const alternates: { [key: string]: string } = {}
      i18n.locales.forEach(altLocale => {
        alternates[altLocale] = `${baseUrl}/${altLocale}${path}`
      })
      alternates['x-default'] = `${baseUrl}/en${path}`

      sitemapEntries.push({
        url,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
        alternates: {
          languages: alternates,
        },
      })
    })
  })
  */

  return sitemapEntries
}
