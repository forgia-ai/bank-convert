import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { i18n } from "@/i18n-config"
import { match as matchLocale } from "@formatjs/intl-localematcher"
import Negotiator from "negotiator"

const isProtectedRoute = createRouteMatcher([
  "/:lang/dashboard(.*)", // Matches /en/dashboard, /es/dashboard/profile, etc.
  "/:lang/viewer(.*)", // Matches /en/viewer, /es/viewer/billing, etc.
])

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

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { pathname } = request.nextUrl

  // Check if the path should bypass i18n (e.g., Clerk routes, API routes)
  const shouldBypassI18n = I18N_BYPASS_PATTERNS.some((pattern) => pattern.test(pathname))

  if (shouldBypassI18n) {
    // For these paths, Clerk handles auth based on its config, no i18n redirect.
    // The rest of the middleware (including auth.protect if applicable via Clerk's internal config) will run.
    return NextResponse.next()
  }

  // Check if the route is one of the protected dashboard routes
  if (isProtectedRoute(request)) {
    await auth.protect() // Redirects if unauthenticated. Execution stops here for unauth.
  }

  // If the route is not protected, or if auth.protect() allowed the request (user is authenticated),
  // proceed with the i18n localization logic.
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`,
  )

  if (pathnameIsMissingLocale) {
    const locale = getLocale(request)

    // Redirect to the same path with the locale prefix
    return NextResponse.redirect(
      new URL(`/${locale}${pathname === "/" ? "" : pathname}`, request.url),
    )
  }

  // If locale is present and the route was not protected (or user was authenticated),
  // let the request proceed.
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
