import { Geist, Geist_Mono } from "next/font/google"
import "../globals.css" // Adjusted path for CSS from app/[lang] to app/globals.css
import { ClerkProvider } from "@clerk/nextjs"
import { i18n, type Locale } from "@/i18n-config"
// AppNavbar and Footer will be imported by specific route group layouts
// import { getDictionary } from "@/lib/getDictionary" // No longer needed here

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
  params: paramsPromise, // Renamed to avoid conflict with destructured params
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ lang: Locale }>
}>) {
  const { lang } = await paramsPromise
  // const dictionary = await getDictionary(lang) // Dictionary will be fetched by route group layouts
  return (
    <ClerkProvider>
      {/* Set the lang attribute dynamically */}
      <html lang={lang} suppressHydrationWarning={true}>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
        >
          {/* AppNavbar will be rendered by the specific route group layout */}
          <main className="flex-grow">{children}</main>
          {/* Footer will be rendered by the specific route group layout */}
        </body>
      </html>
    </ClerkProvider>
  )
}
