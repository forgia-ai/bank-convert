import AppNavbar from "@/components/navigation/AppNavbar"
import Footer from "@/components/layout/Footer"
import { getDictionary } from "@/lib/getDictionary"
import { type Locale } from "@/i18n-config"

export default async function ViewerLayout({
  children,
  params: paramsPromise, // Accept params for lang
}: {
  children: React.ReactNode
  params: Promise<{ lang: Locale }> // Type params as Promise
}) {
  const { lang } = await paramsPromise // Await lang from params
  const dictionary = await getDictionary(lang)

  return (
    <div className="flex flex-col min-h-screen">
      <AppNavbar navStrings={dictionary.navbar} />
      <main className="flex-grow container mx-auto px-4 md:px-8 py-8">{children}</main>
      <Footer footerStrings={dictionary.footer} currentLocale={lang} />
    </div>
  )
}
