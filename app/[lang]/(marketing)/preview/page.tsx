import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { getDictionary } from "@/lib/utils/get-dictionary"
import { type Locale } from "@/i18n-config"
import PreviewWorkflow from "@/components/preview/PreviewWorkflow"
import type { Metadata } from "next"

// Get base URL for metadata
const getBaseUrl = (): string => {
  if (process.env.NODE_ENV === "production") {
    return "https://www.bankstatementconvert.to"
  }
  return "http://localhost:3000"
}

// Generate metadata for preview page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const baseUrl = getBaseUrl()
  const dictionary = await getDictionary(lang)

  const title =
    (dictionary as { metadata?: { preview?: { title?: string; description?: string } } }).metadata
      ?.preview?.title || "Preview Bank Statement Conversion | Try Free Before Signing Up"
  const description =
    (dictionary as { metadata?: { preview?: { title?: string; description?: string } } }).metadata
      ?.preview?.description ||
    "Try our bank statement converter for free! Upload your PDF statement and see instant results. No signup required for preview. Extract transactions with AI accuracy."

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${lang}/preview`,
      type: "website",
      images: [
        {
          url: `${baseUrl}/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&lang=${lang}&type=preview`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        `${baseUrl}/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&lang=${lang}&type=preview`,
      ],
    },
  }
}

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
