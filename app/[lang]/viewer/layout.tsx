import AppNavbar from "@/components/navigation/AppNavbar"
import Footer from "@/components/layout/Footer"
import ViewerBottomSection from "@/components/viewer/ViewerBottomSection"
import { getDictionary } from "@/lib/utils/get-dictionary"
import { type Locale } from "@/i18n-config"

export default async function ViewerLayout({
  children,
  params: paramsPromise,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang: langParam } = await paramsPromise
  const lang = langParam as Locale
  const dictionary = await getDictionary(lang)

  return (
    <div className="flex flex-col min-h-screen">
      <AppNavbar navStrings={dictionary.navbar} dictionary={dictionary} />
      <main className="flex-grow container mx-auto px-4 md:px-8 py-8">{children}</main>
      <ViewerBottomSection lang={lang} dictionary={dictionary} />
      <Footer footerStrings={dictionary.footer} currentLocale={lang} />
    </div>
  )
}
