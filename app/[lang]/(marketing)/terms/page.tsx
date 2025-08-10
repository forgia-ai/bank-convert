// This page displays the Terms and Conditions for the application.

import { getDictionary } from "@/lib/utils/get-dictionary"
import { type Locale } from "@/i18n-config"
import type { Metadata } from "next"

// Get base URL for metadata
const getBaseUrl = (): string => {
  if (process.env.NODE_ENV === "production") {
    return process.env.NEXT_PUBLIC_SITE_URL || "https://www.bankstatementconvert.to"
  }
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
}

export async function generateMetadata({
  params: paramsPromise,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await paramsPromise
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
  ): dict is { metadata: { terms?: { title?: string; description?: string } } } => {
    return !!(
      dict &&
      typeof dict === "object" &&
      dict !== null &&
      "metadata" in dict &&
      (dict as Record<string, unknown>).metadata &&
      typeof (dict as Record<string, unknown>).metadata === "object"
    )
  }

  const hasTermsMetadata = (
    metadata: unknown,
  ): metadata is { terms: { title?: string; description?: string } } => {
    return !!(
      metadata &&
      typeof metadata === "object" &&
      metadata !== null &&
      "terms" in metadata &&
      (metadata as Record<string, unknown>).terms &&
      typeof (metadata as Record<string, unknown>).terms === "object"
    )
  }

  // Safely extract metadata with proper validation
  const metadata = hasMetadata(dictionary) ? dictionary.metadata : null
  const termsMetadata = metadata && hasTermsMetadata(metadata) ? metadata.terms : null

  const title = termsMetadata?.title || "Terms of Service | Bank Statement Convert Legal Terms"
  const description =
    termsMetadata?.description ||
    "Read the terms of service for Bank Statement Convert. Understand your rights and responsibilities when using our PDF to Excel conversion service."

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${lang}/terms`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${baseUrl}/${lang}/terms`,
    },
  }
}

interface TermsPageProps {
  params: Promise<{
    lang: Locale
  }>
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <div className="py-6 md:py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Page Header */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
            {dictionary.terms_page.title}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {dictionary.terms_page.subtitle}
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            {dictionary.terms_page.last_updated}
          </p>
        </div>

        {/* Terms Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div className="space-y-8">
            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {dictionary.terms_page.section_1_title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {dictionary.terms_page.section_1_content}
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {dictionary.terms_page.section_2_title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {dictionary.terms_page.section_2_content}
              </p>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {dictionary.terms_page.section_3_title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {dictionary.terms_page.section_3_content}
              </p>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {dictionary.terms_page.section_4_title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {dictionary.terms_page.section_4_content}
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {dictionary.terms_page.section_5_title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {dictionary.terms_page.section_5_content}
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {dictionary.terms_page.section_6_title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {dictionary.terms_page.section_6_content}
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {dictionary.terms_page.section_7_title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {dictionary.terms_page.section_7_content}
              </p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {dictionary.terms_page.section_8_title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {dictionary.terms_page.section_8_content}
              </p>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {dictionary.terms_page.section_9_title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {dictionary.terms_page.section_9_content}
              </p>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {dictionary.terms_page.section_10_title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {dictionary.terms_page.section_10_content}
              </p>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {dictionary.terms_page.section_11_title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {dictionary.terms_page.section_11_content}
              </p>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {dictionary.terms_page.section_12_title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {dictionary.terms_page.section_12_content}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
