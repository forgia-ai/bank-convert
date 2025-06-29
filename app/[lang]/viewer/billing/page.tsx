import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getDictionary } from "@/lib/utils/get-dictionary"
import { type Locale } from "@/i18n-config"
import BillingWorkflow from "@/components/billing/BillingWorkflow"

interface BillingPageProps {
  params: Promise<{
    lang: Locale
  }>
}

export default async function BillingPage({ params: paramsPromise }: BillingPageProps) {
  const { lang } = await paramsPromise

  // Ensure user is authenticated before accessing billing page
  const { userId } = await auth()
  if (!userId) {
    redirect(`/${lang}/sign-in`)
  }

  const dictionary = await getDictionary(lang)

  return <BillingWorkflow lang={lang} dictionary={dictionary} />
}
