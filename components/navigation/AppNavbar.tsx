"use client"

import Link from "next/link"
import type { getDictionary } from "@/lib/getDictionary" // For type only

type NavStringsType = Awaited<ReturnType<typeof getDictionary>>["navbar"]

interface AppNavbarProps {
  navStrings: NavStringsType
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dictionary?: Record<string, any> // TODO: Type this properly
}
import { useRouter, usePathname } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Layers3, CreditCard, Menu, X, Globe, KeyRound, UserPlus } from "lucide-react"
import { SignedIn, SignedOut, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs"
import { i18n, type Locale } from "@/i18n-config"
import UsageTracker from "@/components/dashboard/usage-tracker"

// Helper to extract locale and pathname from the full path
const getLocaleAndPathname = (fullPathname: string, locales: readonly Locale[]) => {
  const segments = fullPathname.split("/").filter(Boolean)
  let currentLocale: Locale = i18n.defaultLocale
  let pathWithoutLocale = fullPathname

  if (segments.length > 0 && (locales as string[]).includes(segments[0])) {
    currentLocale = segments[0] as Locale
    pathWithoutLocale = "/" + segments.slice(1).join("/")
  } else if (fullPathname === "/") {
    pathWithoutLocale = "/"
  }

  // Ensure pathWithoutLocale always starts with a slash, or is just "/"
  if (!pathWithoutLocale.startsWith("/") && pathWithoutLocale !== "") {
    pathWithoutLocale = "/" + pathWithoutLocale
  } else if (pathWithoutLocale === "") {
    pathWithoutLocale = "/" // Handles cases like /en becoming pathWithoutLocale = ""
  }
  if (pathWithoutLocale === "//") pathWithoutLocale = "/" // Additional safeguard

  return { currentLocale, pathWithoutLocale }
}

/**
 * AppNavbar is a unified navigation bar that adapts its content based on
 * the user's authentication status, with responsive behavior for mobile.
 */
export default function AppNavbar({ navStrings, dictionary = {} }: AppNavbarProps) {
  const router = useRouter()
  const fullPathname = usePathname() // e.g., /en/dashboard or /dashboard

  const { currentLocale, pathWithoutLocale } = getLocaleAndPathname(fullPathname, i18n.locales)

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const nativeLanguageNames: Record<Locale, string> = {
    en: "English",
    es: "Español",
    pt: "Português",
  }

  // Generate display languages using native names
  const displayLanguages: { code: Locale; name: string }[] = i18n.locales.map((loc) => {
    return { code: loc, name: nativeLanguageNames[loc] || loc.toUpperCase() } // Fallback to uppercase code if native name missing
  })

  const handleLanguageChange = (targetLang: Locale) => {
    // Always construct the path with the target locale prefix
    let newPath = `/${targetLang}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`

    // Preserve query parameters
    const currentSearch = window.location.search
    if (newPath.endsWith("/") && newPath !== "/") {
      // Avoid double slash for root path, e.g. /es// -> /es/
      newPath = newPath.slice(0, -1)
    }
    if (pathWithoutLocale === "/") newPath = `/${targetLang}` // Ensure root path is just /<lang>

    if (currentSearch) {
      newPath += currentSearch
    }

    router.push(newPath)

    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false)
    }
  }

  const marketingLinks = [
    { href: "/pricing", label: navStrings.pricing },
    { href: "/about", label: navStrings.about_us },
    { href: "/contact", label: navStrings.contact },
    // { href: "/features", label: navStrings.features }, // Example, if added to dictionary
  ]

  const appLinks = [
    { href: "/viewer", label: navStrings.convert, icon: <Layers3 className="h-4 w-4" /> },
    {
      href: "/viewer/billing",
      label: navStrings.billing,
      icon: <CreditCard className="h-4 w-4" />,
    },
  ]

  const commonLinkClasses = "text-muted-foreground hover:text-foreground"
  const activeAppPath = (href: string) => {
    // pathWithoutLocale will be like "/" or "/viewer" or "/viewer/billing"
    if (href === "/") return pathWithoutLocale === href
    if (href === "/viewer")
      return pathWithoutLocale === "/viewer" || pathWithoutLocale.startsWith("/viewer/") // handles /viewer and /viewer/subpage
    return pathWithoutLocale.startsWith(href)
  }

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6 md:px-8 relative">
        {/* Left Section: Logo */}
        <div className="flex items-center gap-2">
          <SignedIn>
            <Link
              href={`/${currentLocale}/viewer`}
              className="flex items-center gap-2 font-bold text-lg"
              onClick={handleLinkClick}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 120 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary"
              >
                <path d="M60 0L120 34.64V103.92L60 120L0 103.92V34.64L60 0Z" fill="currentColor" />
                <path
                  d="M60 120L0 103.92V34.64L60 0L120 34.64V103.92L60 120ZM5 36.93V101.63L58.5 117.19V117.2L60 117.97L61.5 117.2V117.19L115 101.63V36.93L61.5 2.81V2.79L60 2.03L58.5 2.79V2.81L5 36.93Z"
                  fill="white"
                  fillOpacity="0.3"
                />
                <path
                  d="M60 10.3L10 40V90L60 119.7L110 90V40L60 10.3ZM100 85.36L60 109.16L20 85.36V44.64L60 20.84L100 44.64V85.36Z"
                  fill="white"
                  fillOpacity="0.6"
                />
                <path d="M60 60L20 40L60 20L100 40L60 60Z" fill="white" />
                <path
                  d="M20 40V80L60 100L100 80V40"
                  stroke="white"
                  strokeWidth="3"
                  strokeOpacity="0.5"
                />
              </svg>
              <span className="font-semibold">BankConvert</span>
            </Link>
          </SignedIn>
          <SignedOut>
            <Link
              href={`/${currentLocale}`}
              className="flex items-center gap-2 font-bold text-lg"
              onClick={handleLinkClick}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 120 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary"
              >
                <path d="M60 0L120 34.64V103.92L60 120L0 103.92V34.64L60 0Z" fill="currentColor" />
                <path
                  d="M60 120L0 103.92V34.64L60 0L120 34.64V103.92L60 120ZM5 36.93V101.63L58.5 117.19V117.2L60 117.97L61.5 117.2V117.19L115 101.63V36.93L61.5 2.81V2.79L60 2.03L58.5 2.79V2.81L5 36.93Z"
                  fill="white"
                  fillOpacity="0.3"
                />
                <path
                  d="M60 10.3L10 40V90L60 119.7L110 90V40L60 10.3ZM100 85.36L60 109.16L20 85.36V44.64L60 20.84L100 44.64V85.36Z"
                  fill="white"
                  fillOpacity="0.6"
                />
                <path d="M60 60L20 40L60 20L100 40L60 60Z" fill="white" />
                <path
                  d="M20 40V80L60 100L100 80V40"
                  stroke="white"
                  strokeWidth="3"
                  strokeOpacity="0.5"
                />
              </svg>
              <span className="font-semibold">BankConvert</span>
            </Link>
          </SignedOut>
        </div>

        {/* Center Section: Desktop Navigation Links */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 items-center gap-12">
          <SignedIn>
            {appLinks.map((link) => (
              <Button
                key={link.href}
                variant={activeAppPath(link.href) ? "secondary" : "ghost"}
                asChild
                size="sm"
                className="font-medium"
              >
                <Link href={`/${currentLocale}${link.href}`} className="flex items-center gap-2">
                  {link.icon}
                  {link.label}
                </Link>
              </Button>
            ))}
          </SignedIn>
          <SignedOut>
            {marketingLinks.map((link) => (
              <Link
                key={link.href}
                href={`/${currentLocale}${link.href}`}
                className={`${commonLinkClasses} ${activeAppPath(link.href) ? "font-semibold text-foreground" : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </SignedOut>
        </div>

        {/* Right Section: Auth Buttons / User Info & Mobile Menu Toggle */}
        <div className="flex items-center gap-4">
          <SignedIn>
            {/* Usage Tracker - Compact version for navbar */}
            <div className="hidden md:block">
              <UsageTracker
                lang={currentLocale}
                dictionary={dictionary}
                userType="free" // TODO: Get from user context
                context="navbar"
              />
            </div>

            {/* Compact Language Selector for authenticated users */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden md:flex items-center gap-1.5 px-2"
                  aria-label={`Change language, current language ${nativeLanguageNames[currentLocale] || currentLocale.toUpperCase()}`}
                >
                  <Globe className="h-4 w-4" />
                  <span className="text-xs font-medium">{currentLocale.toUpperCase()}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {displayLanguages.map((language) => (
                  <DropdownMenuItem
                    key={language.code}
                    onClick={() => handleLanguageChange(language.code)}
                    className={currentLocale === language.code ? "bg-muted" : ""}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    {language.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="outline" size="sm" asChild className="hidden md:inline-flex">
                <span className="cursor-pointer">{navStrings.login}</span>
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm" asChild>
                <span className="cursor-pointer">{navStrings.signup}</span>
              </Button>
            </SignUpButton>
            {/* Language Selector for non-authenticated users */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden md:flex items-center gap-1.5 w-30"
                  aria-label={`Change language, current language ${nativeLanguageNames[currentLocale] || currentLocale.toUpperCase()}`}
                >
                  <Globe className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    {nativeLanguageNames[currentLocale] || currentLocale.toUpperCase()}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {displayLanguages.map((language) => (
                  <DropdownMenuItem
                    key={language.code}
                    onClick={() => handleLanguageChange(language.code)}
                    className={currentLocale === language.code ? "bg-muted" : ""}
                  >
                    {language.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SignedOut>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <Button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              variant="ghost"
              size="icon"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col items-start gap-2">
            <SignedIn>
              {appLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  locale={currentLocale}
                  onClick={handleLinkClick}
                  className={`flex items-center gap-3 w-full px-3 py-2 rounded-md text-base font-medium ${activeAppPath(link.href) ? "bg-muted text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
              {/* Mobile Usage Tracker */}
              <div className="w-full px-3 py-2">
                <UsageTracker
                  lang={currentLocale}
                  dictionary={dictionary}
                  userType="free" // TODO: Get from user context
                />
              </div>
            </SignedIn>
            <SignedOut>
              {marketingLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  locale={currentLocale}
                  onClick={handleLinkClick}
                  className={`block w-full px-3 py-2 rounded-md text-base font-medium ${pathWithoutLocale === link.href ? "bg-muted text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  {link.label}
                </Link>
              ))}
              {/* Mobile Login Button */}
              <SignInButton mode="modal">
                <button
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <KeyRound className="h-5 w-5" />
                  {navStrings.login}
                </button>
              </SignInButton>
              {/* Mobile Sign Up Button */}
              <SignUpButton mode="modal">
                <button
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <UserPlus className="h-5 w-5" />
                  {navStrings.signup}
                </button>
              </SignUpButton>
              {/* Language Selection for Mobile Menu - Non-authenticated users only */}
              <div className="w-full mt-2 pt-2 border-t">
                {displayLanguages.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => {
                      handleLanguageChange(language.code)
                      setIsMobileMenuOpen(false) // Close menu on selection
                    }}
                    className={`flex items-center gap-3 w-full px-3 py-2 rounded-md text-base font-medium ${currentLocale === language.code ? "bg-muted text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                  >
                    <Globe className="h-5 w-5" />
                    {language.name}
                  </button>
                ))}
              </div>
            </SignedOut>
          </div>
        </div>
      )}
    </nav>
  )
}
