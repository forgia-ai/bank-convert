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

  // Error handling for dictionary fetching
  let dictionary
  try {
    dictionary = await getDictionary(lang)
  } catch (error) {
    console.error("Failed to load dictionary for metadata:", error)
    // Fallback to empty dictionary structure
    dictionary = { metadata: {} }
  }

  // Type guard to safely check dictionary structure
  const hasMetadata = (
    dict: unknown,
  ): dict is { metadata: { preview?: { title?: string; description?: string } } } => {
    return !!(
      dict &&
      typeof dict === "object" &&
      dict !== null &&
      "metadata" in dict &&
      (dict as Record<string, unknown>).metadata &&
      typeof (dict as Record<string, unknown>).metadata === "object"
    )
  }

  const hasPreviewMetadata = (
    metadata: unknown,
  ): metadata is { preview: { title?: string; description?: string } } => {
    return !!(
      metadata &&
      typeof metadata === "object" &&
      metadata !== null &&
      "preview" in metadata &&
      (metadata as Record<string, unknown>).preview &&
      typeof (metadata as Record<string, unknown>).preview === "object"
    )
  }

  // Safely extract metadata with proper validation
  const metadata = hasMetadata(dictionary) ? dictionary.metadata : null
  const previewMetadata = metadata && hasPreviewMetadata(metadata) ? metadata.preview : null

  const title =
    previewMetadata?.title || "Preview Bank Statement Conversion | Try Free Before Signing Up"
  const description =
    previewMetadata?.description ||
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
