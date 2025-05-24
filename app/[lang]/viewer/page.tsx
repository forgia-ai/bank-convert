import ConversionWorkflow from "@/components/viewer/conversion-workflow"
import { getDictionary } from "@/lib/getDictionary"
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
