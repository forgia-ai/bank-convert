import { getDictionary } from "@/lib/utils/get-dictionary"
import { getNormalizedEnvSiteUrl, normalizeBaseUrl } from "@/lib/utils/url"
import { type Locale } from "@/i18n-config"
import type { Metadata } from "next"

// Get base URL for metadata (normalized)
const getBaseUrl = (): string => {
  const fromEnv = getNormalizedEnvSiteUrl()
  if (fromEnv) return fromEnv
  if (process.env.VERCEL_URL) return normalizeBaseUrl(process.env.VERCEL_URL)
  if (process.env.NODE_ENV === "production") return "https://www.bankstatementconvert.to"
  return "http://localhost:3000"
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
  ): dict is { metadata: { privacy?: { title?: string; description?: string } } } => {
    return !!(
      dict &&
      typeof dict === "object" &&
      dict !== null &&
      "metadata" in dict &&
      (dict as Record<string, unknown>).metadata &&
      typeof (dict as Record<string, unknown>).metadata === "object"
    )
  }

  const hasPrivacyMetadata = (
    metadata: unknown,
  ): metadata is { privacy: { title?: string; description?: string } } => {
    return !!(
      metadata &&
      typeof metadata === "object" &&
      metadata !== null &&
      "privacy" in metadata &&
      (metadata as Record<string, unknown>).privacy &&
      typeof (metadata as Record<string, unknown>).privacy === "object"
    )
  }

  // Safely extract metadata with proper validation
  const metadata = hasMetadata(dictionary) ? dictionary.metadata : null
  const privacyMetadata = metadata && hasPrivacyMetadata(metadata) ? metadata.privacy : null

  const title = privacyMetadata?.title || "Privacy Policy | Bank Statement Convert Data Protection"
  const description =
    privacyMetadata?.description ||
    "Learn how Bank Statement Convert protects your financial data. Our privacy policy explains data handling, security measures, and your rights regarding personal information."

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${lang}/privacy`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${baseUrl}/${lang}/privacy`,
    },
  }
}

export default async function PrivacyPage({
  params: paramsPromise,
}: {
  params: Promise<{ lang: Locale }>
}) {
  const { lang } = await paramsPromise
  const dictionary = await getDictionary(lang)

  return (
    <div className="py-6 md:py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Page Header */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
            {dictionary.privacy_page.title}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {dictionary.privacy_page.subtitle}
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            {dictionary.privacy_page.last_updated}
          </p>
        </div>

        {/* Privacy Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div className="space-y-8">
            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {dictionary.privacy_page.section_1_title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {dictionary.privacy_page.section_1_content}
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {dictionary.privacy_page.section_2_title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {dictionary.privacy_page.section_2_content}
              </p>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {dictionary.privacy_page.section_3_title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {dictionary.privacy_page.section_3_content}
              </p>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {dictionary.privacy_page.section_4_title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {dictionary.privacy_page.section_4_content}
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {dictionary.privacy_page.section_5_title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {dictionary.privacy_page.section_5_content}
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {dictionary.privacy_page.section_6_title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {dictionary.privacy_page.section_6_content}
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {dictionary.privacy_page.section_7_title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {dictionary.privacy_page.section_7_content}
              </p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {dictionary.privacy_page.section_8_title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {dictionary.privacy_page.section_8_content}
              </p>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {dictionary.privacy_page.section_9_title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {dictionary.privacy_page.section_9_content}
              </p>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {dictionary.privacy_page.section_10_title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {dictionary.privacy_page.section_10_content}
              </p>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                {dictionary.privacy_page.section_11_title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {dictionary.privacy_page.section_11_content}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
