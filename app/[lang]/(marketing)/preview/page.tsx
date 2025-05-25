import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { getDictionary } from "@/lib/getDictionary"
import { type Locale } from "@/i18n-config"
import PreviewWorkflow from "@/components/preview/preview-workflow"

export default async function PreviewPage({
  params: paramsPromise,
}: {
  params: Promise<{ lang: Locale }>
}) {
  const { lang } = await paramsPromise

  // Check if user is signed in - if so, redirect to viewer
  const { userId } = await auth()
  if (userId) {
    redirect(`/${lang}/viewer`)
  }

  const dictionary = await getDictionary(lang)

  return (
    <div className="container mx-auto px-4 md:px-8 pb-8">
      <PreviewWorkflow lang={lang} dictionary={dictionary} />
    </div>
  )
}
