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
  const dictionary = await getDictionary(lang)

  return <ConversionWorkflow lang={lang} dictionary={dictionary} />
}
