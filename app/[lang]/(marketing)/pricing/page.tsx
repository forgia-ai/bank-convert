import { type Locale } from "@/i18n-config"
import { getDictionary } from "@/lib/utils/get-dictionary"
import type { Metadata } from "next"
import PricingClient from "@/components/pricing/PricingClient"

// Get base URL for metadata
const getBaseUrl = (): string => {
  if (process.env.NODE_ENV === "production") {
    return "https://www.bankstatementconvert.to"
  }
  return "http://localhost:3000"
}

// Generate metadata for pricing page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const baseUrl = getBaseUrl()

  // Get dictionary for metadata translations
  const dictionary = await getDictionary(lang)

  const title =
    dictionary.metadata?.pricing?.title || "Bank Statement Convert Pricing | Free & Premium Plans"
  const description =
    dictionary.metadata?.pricing?.description ||
    "Choose the perfect plan for your needs. Free plan includes 50 pages. Premium plans offer unlimited conversions, priority support & advanced features. No hidden fees."

  return {
    title,
    description,
    keywords: [
      "bank statement convert pricing",
      "PDF to Excel pricing",
      "free plan",
      "premium plans",
      "bank statement pricing",
      "subscription plans",
      "financial tool pricing",
    ],
    alternates: {
      canonical: `${baseUrl}/${lang}/pricing`,
      languages: {
        en: `${baseUrl}/en/pricing`,
        es: `${baseUrl}/es/pricing`,
        pt: `${baseUrl}/pt/pricing`,
        "x-default": `${baseUrl}/en/pricing`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${lang}/pricing`,
      type: "website",
      images: [
        {
          url: `${baseUrl}/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&lang=${lang}&type=pricing`,
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
        `${baseUrl}/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&lang=${lang}&type=pricing`,
      ],
    },
  }
}

export default async function PricingPage({
  params: paramsPromise,
}: {
  params: Promise<{ lang: Locale }>
}) {
  const { lang } = await paramsPromise
  const dictionary = await getDictionary(lang)

  return <PricingClient lang={lang} dictionary={dictionary} />
}
