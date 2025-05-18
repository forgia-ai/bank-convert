// components/navigation/user-navbar.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Layers3, Settings, CreditCard, BarChart3 } from "lucide-react" // Icons
import { UserButton } from "@clerk/nextjs"

/**
 * UserNavbar is displayed for authenticated users, providing access to dashboard,
 * settings, and user-specific controls like profile and logout.
 */
export default function UserNavbar() {
  const pathname = usePathname()
  // Clerk's UserButton handles auth state internally

  const navLinks = [
    { href: "/dashboard", label: "Convert", icon: <Layers3 className="h-4 w-4" /> },
    { href: "/dashboard/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
    { href: "/dashboard/billing", label: "Billing", icon: <CreditCard className="h-4 w-4" /> },
  ]

  // In a real app, middleware would typically protect dashboard routes
  // For now, if not signed in, this component won't render its main content
  // or could redirect. Let's rely on page/layout protection for now.
  // if (!isSignedIn) {
  //   return null; // Or a loader, or redirect via useEffect
  // }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left Section: Logo and Main Nav */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
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
            <span>BankConvert</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Button
                key={link.href}
                variant={
                  pathname === link.href ||
                  (link.href !== "/dashboard" && pathname.startsWith(link.href))
                    ? "secondary"
                    : "ghost"
                }
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
          </div>
        </div>

        {/* Right Section: Usage, Language, User Profile */}
        <div className="flex items-center gap-3">
          {/* Placeholder: Usage Tracker */}
          <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Pages: <span className="font-semibold text-foreground">0/500</span>
            </span>
          </Button>

          {/* Placeholder: Language Selector */}
          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Languages className="h-4 w-4" />
                <span className="sr-only">Select Language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>English</DropdownMenuItem>
              <DropdownMenuItem disabled>Español (Soon)</DropdownMenuItem>
              <DropdownMenuItem disabled>Français (Soon)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}

          {/* User Button from Clerk - this will be the primary user interaction point */}
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  )
}
