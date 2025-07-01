import { Geist, Geist_Mono } from "next/font/google"
import "../globals.css" // Adjusted path for CSS from app/[lang] to app/globals.css
import { ClerkProvider } from "@clerk/nextjs"
import { i18n, type Locale } from "@/i18n-config"
import { UserLimitsProvider } from "@/contexts/user-limits-context"
import { getDictionary } from "@/lib/utils/get-dictionary"
import type { Metadata } from "next"
// AppNavbar and Footer will be imported by specific route group layouts
// import { getDictionary } from "@/lib/get-dictionary" // No longer needed here

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

// Get base URL for canonical URLs and Open Graph
const getBaseUrl = (): string => {
  // In production, always use the production domain regardless of VERCEL_URL
  if (process.env.NODE_ENV === "production") {
    return "https://www.bankstatementconvert.to"
  }
  // For local development
  return "http://localhost:3000"
}

// Generate dynamic metadata based on locale
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const baseUrl = getBaseUrl()

  // Get localized title and description from dictionary
  const title =
    dictionary.marketing_homepage?.heroTitle || "Convert Bank Statements to Excel in Seconds"
  const description =
    dictionary.marketing_homepage?.heroSubtitle ||
    "Upload PDF, get structured data instantly. Try it free!"

  // Create localized metadata
  const metadata: Metadata = {
    title: {
      template: "%s | Bank Statement Converter",
      default: title,
    },
    description,
    keywords: [
      "bank statement converter",
      "PDF to Excel converter",
      "bank statement to Excel",
      "convert bank statement PDF",
      "financial data extraction",
      "free bank statement converter",
      "AI-powered data extraction",
    ],
    authors: [{ name: "Bank Statement Converter" }],
    creator: "Bank Statement Converter",
    publisher: "Bank Statement Converter",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },

    // Canonical URL and language alternates
    alternates: {
      canonical: `${baseUrl}/${lang}`,
      languages: {
        en: `${baseUrl}/en`,
        es: `${baseUrl}/es`,
        pt: `${baseUrl}/pt`,
        "x-default": `${baseUrl}/en`,
      },
    },

    // Open Graph metadata for social media
    openGraph: {
      type: "website",
      locale: lang,
      url: `${baseUrl}/${lang}`,
      siteName: "Bank Statement Converter",
      title,
      description,
      images: [
        {
          url: `${baseUrl}/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&lang=${lang}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },

    // Twitter metadata
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: "@bankstatementconvert", // Update with actual Twitter handle
      images: [
        `${baseUrl}/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&lang=${lang}`,
      ],
    },

    // Verification for search engines
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
      yahoo: process.env.YAHOO_VERIFICATION,
    },

    // PWA and app metadata
    applicationName: "Bank Statement Converter",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Bank Statement Converter",
    },
    formatDetection: {
      telephone: false,
    },

    // Additional metadata
    category: "finance",
  }

  return metadata
}

// Define static params for Next.js to know which locales to pre-render
export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }))
}

export default async function RootLayout({
  children,
  params: paramsPromise, // Renamed to avoid conflict with destructured params
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ lang: Locale }>
}>) {
  const { lang } = await paramsPromise

  // Configure language-aware redirect URLs for Clerk
  const signInUrl = `/${lang}/sign-in`
  const signUpUrl = `/${lang}/sign-up`
  const afterSignInUrl = `/${lang}/viewer`
  const afterSignUpUrl = `/${lang}/viewer`
  const afterSignOutUrl = `/${lang}`

  return (
    <ClerkProvider
      signInUrl={signInUrl}
      signUpUrl={signUpUrl}
      afterSignInUrl={afterSignInUrl}
      afterSignUpUrl={afterSignUpUrl}
      afterSignOutUrl={afterSignOutUrl}
    >
      {/* Set the lang attribute dynamically */}
      <html lang={lang} suppressHydrationWarning={true}>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
        >
          <UserLimitsProvider>
            {/* AppNavbar will be rendered by the specific route group layout */}
            <main className="flex-grow">{children}</main>
            {/* Footer will be rendered by the specific route group layout */}
          </UserLimitsProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
