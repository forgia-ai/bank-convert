import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import ConversionWorkflow from "@/components/viewer/ConversionWorkflow"
import { getDictionary } from "@/lib/utils/get-dictionary"
import { type Locale } from "@/i18n-config"

interface ViewerPageProps {
  params: Promise<{
    lang: Locale
  }>
}

export default async function ViewerPage({ params: paramsPromise }: ViewerPageProps) {
  const { lang } = await paramsPromise

  // Ensure user is authenticated before accessing viewer
  const { userId } = await auth()
  if (!userId) {
    redirect(`/${lang}/sign-in`)
  }

  const dictionary = await getDictionary(lang)

  return <ConversionWorkflow lang={lang} dictionary={dictionary} />
}
