import TopAuthorityBar from "@/components/marketing/TopAuthorityBar"
import AppNavbar from "@/components/navigation/AppNavbar"
import Footer from "@/components/layout/Footer"
import { getDictionary } from "@/lib/utils/get-dictionary"
import { type Locale } from "@/i18n-config"

export default async function MarketingLayout({
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
      <TopAuthorityBar topAuthorityBarStrings={dictionary.marketing_homepage.top_authority_bar} />
      <AppNavbar navStrings={dictionary.navbar} dictionary={dictionary} />
      <main className="flex-grow pt-8 pb-16">{children}</main>
      <Footer footerStrings={dictionary.footer} currentLocale={lang} />
    </div>
  )
}
