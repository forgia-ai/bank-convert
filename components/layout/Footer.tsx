import Link from "next/link"
import type { getDictionary } from "@/lib/get-dictionary"

type FooterStringsType = Awaited<ReturnType<typeof getDictionary>>["footer"]

interface FooterProps {
  footerStrings: FooterStringsType
  currentLocale: string // To construct locale-aware links
}

/**
 * Footer component displaying copyright information and legal links.
 */
export default function Footer({ footerStrings, currentLocale }: FooterProps) {
  return (
    <footer className="py-8 bg-muted/50 border-t">
      <div className="container mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
        <p>{footerStrings.copyright}</p>
        <nav className="flex gap-4 mt-4 md:mt-0">
          <Link href={`/${currentLocale}/terms`} className="hover:text-foreground">
            {footerStrings.terms}
          </Link>
          <Link href={`/${currentLocale}/privacy`} className="hover:text-foreground">
            {footerStrings.privacy}
          </Link>
        </nav>
      </div>
    </footer>
  )
}
