import AppNavbar from "@/components/navigation/AppNavbar"
import Footer from "@/components/layout/Footer" // Corrected path
import TopAuthorityBar from "@/components/marketing/top-authority-bar"
import { getDictionary } from "@/lib/getDictionary"
import { type Locale } from "@/i18n-config"

export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { lang: Locale }
}) {
  const dictionary = await getDictionary(params.lang)
  return (
    <div className="flex flex-col min-h-screen">
      <TopAuthorityBar />
      <AppNavbar navStrings={dictionary.navbar} />
      <main className="flex-grow container mx-auto px-4 py-8">
        {" "}
        {/* Added some basic content styling */}
        {children}
      </main>
      <Footer footerStrings={dictionary.footer} currentLocale={params.lang} />
    </div>
  )
}
