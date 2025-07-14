import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import ConversionWorkflow from "@/components/viewer/ConversionWorkflow"
import { getDictionary } from "@/lib/utils/get-dictionary"
import { type Locale } from "@/i18n-config"
import type { Metadata } from "next"

// Get base URL for OG images
const getBaseUrl = (): string => {
  if (process.env.NODE_ENV === "production") {
    return "https://www.bankstatementconvert.to"
  }
  return "http://localhost:3000"
}

interface ViewerPageProps {
  params: Promise<{
    lang: Locale
  }>
}

// Generate metadata for viewer page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const baseUrl = getBaseUrl()

  const title = "Bank Statement Converter - Convert Your Files"
  const description =
    "Convert your bank statements to Excel format with our AI-powered tool. Upload PDF files and get structured data instantly."

  return {
    title,
    description,
    robots: {
      index: false, // Don't index authenticated pages
      follow: false,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${lang}/viewer`,
      type: "website",
      images: [
        {
          url: `${baseUrl}/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&lang=${lang}&type=viewer`,
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
        `${baseUrl}/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&lang=${lang}&type=viewer`,
      ],
    },
  }
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
