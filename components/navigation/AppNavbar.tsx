"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Layers3, Settings, CreditCard, BarChart3, Menu, X } from "lucide-react" // Icons for app nav
import { SignedIn, SignedOut, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs"

/**
 * AppNavbar is a unified navigation bar that adapts its content based on
 * the user's authentication status, with responsive behavior for mobile.
 */
export default function AppNavbar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const marketingLinks = [
    { href: "/pricing", label: "Pricing" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
    // { href: "/features", label: "Features" }, // Example, can be added back
  ]

  const appLinks = [
    { href: "/dashboard", label: "Convert", icon: <Layers3 className="h-4 w-4" /> },
    { href: "/dashboard/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
    { href: "/dashboard/billing", label: "Billing", icon: <CreditCard className="h-4 w-4" /> },
  ]

  const commonLinkClasses = "text-muted-foreground hover:text-foreground"
  const activeAppPath = (href: string) => {
    if (href === "/dashboard") return pathname === href
    return pathname.startsWith(href)
  }

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6 md:px-8 relative">
        {/* Left Section: Logo */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
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
        </div>

        {/* Center Section: Desktop Navigation Links */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 items-center gap-1">
          <SignedIn>
            {appLinks.map((link) => (
              <Button
                key={link.href}
                variant={activeAppPath(link.href) ? "secondary" : "ghost"}
                asChild
                size="sm"
                className="font-medium"
              >
                <Link href={link.href} className="flex items-center gap-2">
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
                href={link.href}
                className={`${commonLinkClasses} px-3 py-2 text-sm font-medium rounded-md hover:bg-muted`}
              >
                {link.label}
              </Link>
            ))}
          </SignedOut>
        </div>

        {/* Right Section: Auth Buttons / User Info & Mobile Menu Toggle */}
        <div className="flex items-center gap-2">
          <SignedIn>
            {/* Placeholder: Usage Tracker - can be part of app layout or specific pages */}
            <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Pages: <span className="font-semibold text-foreground">0/500</span>{" "}
                {/* TODO: Dynamic data */}
              </span>
            </Button>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="outline" size="sm" asChild>
                <span className="cursor-pointer">Login</span>
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm" asChild>
                <span className="cursor-pointer">Sign Up</span>
              </Button>
            </SignUpButton>
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
                  onClick={handleLinkClick}
                  className={`flex items-center gap-3 w-full px-3 py-2 rounded-md text-base font-medium ${activeAppPath(link.href) ? "bg-muted text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </SignedIn>
            <SignedOut>
              {marketingLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={handleLinkClick}
                  className={`block w-full px-3 py-2 rounded-md text-base font-medium ${pathname === link.href ? "bg-muted text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  {link.label}
                </Link>
              ))}
            </SignedOut>
          </div>
        </div>
      )}
    </nav>
  )
}
