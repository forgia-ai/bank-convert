import { clerkMiddleware } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { i18n } from "./i18n-config"
import { match as matchLocale } from "@formatjs/intl-localematcher"
import Negotiator from "negotiator"

function getLocale(request: NextRequest): string {
  const negotiatorHeaders: Record<string, string> = {}
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value))

  // Use spread operator for type compatibility with Negotiator
  const locales: string[] = [...i18n.locales]
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages(locales)
  const defaultLocale = i18n.defaultLocale

  // matchLocale can return undefined, provide a fallback to defaultLocale
  return matchLocale(languages, locales, defaultLocale) || defaultLocale
}

// Define patterns for paths that should bypass i18n locale prefixing.
// This includes API routes, Next.js internal files, and common public files.
// The main `config.matcher` already filters many static assets by extension.
const I18N_BYPASS_PATTERNS: RegExp[] = [
  /^\/api\//, // Standard API routes
  /^\/trpc\//, // TRPC routes
  /^\/_next\//, // Next.js internal files (already handled by matcher, but good for clarity)
  /^\/robots\.txt$/, // robots.txt
  /^\/sitemap\.xml$/, // sitemap.xml
  // favicon.ico and other extension-based static assets are typically excluded by the config.matcher
]

export default clerkMiddleware((auth, request: NextRequest) => {
  const { pathname } = request.nextUrl

  // Check if the path should bypass i18n and go directly to Clerk/app logic
  const shouldBypassI18n = I18N_BYPASS_PATTERNS.some((pattern) => pattern.test(pathname))

  if (shouldBypassI18n) {
    // For these paths, Clerk handles auth based on its config, no i18n redirect.
    return NextResponse.next()
  }

  // Handle i18n localization for all other routes (assumed to be pages)
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`,
  )

  if (pathnameIsMissingLocale) {
    const locale = getLocale(request)

    // Redirect to the same path with the locale prefix
    // e.g., /products -> /en/products, or / -> /en
    return NextResponse.redirect(
      new URL(`/${locale}${pathname === "/" ? "" : pathname}`, request.url),
    )
  }

  // If locale is present, or for routes that bypassed i18n, let Clerk proceed.
  return NextResponse.next()
})

export const config = {
  matcher: [
    // Match all routes except Next.js internals and static files with common extensions.
    // This ensures the middleware runs for pages, API routes, and specific public files (like robots.txt).
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes (ensures Clerk protection if configured, i18n is bypassed for them above)
    "/(api|trpc)(.*)",
  ],
}
