import { Geist, Geist_Mono } from "next/font/google"
import "../globals.css" // Adjusted path for CSS from app/[lang] to app/globals.css
import { ClerkProvider } from "@clerk/nextjs"
import { i18n, type Locale } from "@/i18n-config"
import AppNavbar from "@/components/navigation/AppNavbar"
import Footer from "@/components/layout/Footer"
import { getDictionary } from "@/lib/getDictionary" // Using path alias for i18n-config

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

// This function can be used to generate dynamic metadata based on the locale
// For example, loading titles from your dictionary
// import { getDictionary } from '@/lib/getDictionary'; // Assuming getDictionary is in lib
// export async function generateMetadata({ params }: { params: { lang: Locale } }): Promise<Metadata> {
//   const dictionary = await getDictionary(params.lang);
//   return {
//     title: dictionary.navbar.home, // Example: Using a general title or a specific one
//     description: dictionary.homepage.subtitle, // Example
//   }
// }

// Define static params for Next.js to know which locales to pre-render
export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }))
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: { lang: Locale }
}>) {
  const dictionary = await getDictionary(params.lang)
  return (
    <ClerkProvider afterSignInUrl="/dashboard" afterSignUpUrl="/dashboard">
      {/* Set the lang attribute dynamically */}
      <html lang={params.lang} suppressHydrationWarning={true}>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
        >
          <AppNavbar navStrings={dictionary.navbar} />
          <main className="flex-grow">{children}</main>
          <Footer footerStrings={dictionary.footer} currentLocale={params.lang} />
        </body>
      </html>
    </ClerkProvider>
  )
}
