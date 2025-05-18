import Link from "next/link"

export default function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} BankConvert. All rights reserved.</p>
        <div className="flex gap-4 mt-4 md:mt-0">
          <Link href="/terms-of-service" className="hover:text-foreground">
            Terms of Service
          </Link>
          <Link href="/privacy-policy" className="hover:text-foreground">
            Privacy Policy
          </Link>
          {/* Optional: Add social media links/icons here */}
        </div>
      </div>
    </footer>
  )
}
