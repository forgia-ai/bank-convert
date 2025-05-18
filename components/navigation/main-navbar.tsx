import Link from "next/link"
import { Button } from "@/components/ui/button" // Assuming shadcn/ui button is here
import { SignedIn, SignedOut, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs"

export default function MainNavbar() {
  return (
    <nav className="flex items-center justify-between p-4 bg-background border-b">
      {/* Left: Logo */}
      <Link href="/" className="text-xl font-bold">
        BankConvert
      </Link>

      {/* Center: Navigation Links */}
      <div className="hidden md:flex gap-4">
        {/* <Link href="/features" className="text-muted-foreground hover:text-foreground">Features</Link> */}
        <Link href="/pricing" className="text-muted-foreground hover:text-foreground">
          Pricing
        </Link>
        <Link href="/about" className="text-muted-foreground hover:text-foreground">
          About Us
        </Link>
        <Link href="/contact" className="text-muted-foreground hover:text-foreground">
          Contact
        </Link>
      </div>

      {/* Right: Auth Buttons */}
      <div className="flex items-center gap-2">
        <SignedOut>
          <SignInButton mode="modal">
            <Button variant="outline" asChild>
              <span className="cursor-pointer">Login</span>
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button asChild>
              <span className="cursor-pointer">Sign Up</span>
            </Button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>

      {/* Mobile Menu Button (placeholder) */}
      <div className="md:hidden">
        <Button variant="outline" size="icon">
          {/* Placeholder for Menu Icon, e.g., <MenuIcon className="h-5 w-5" /> */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </Button>
      </div>
    </nav>
  )
}

// Placeholder for MenuIcon if you want to use a specific icon library later
// const MenuIcon = (props) => (
//   <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <line x1="4" x2="20" y1="12" y2="12"/>
//     <line x1="4" x2="20" y1="6" y2="6"/>
//     <line x1="4" x2="20" y1="18" y2="18"/>
//   </svg>
// );
