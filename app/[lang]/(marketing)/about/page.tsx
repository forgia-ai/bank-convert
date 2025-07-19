import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getDictionary } from "@/lib/utils/get-dictionary"
import { type Locale } from "@/i18n-config"
import type { Metadata } from "next"

// Get base URL for metadata
const getBaseUrl = (): string => {
  if (process.env.NODE_ENV === "production") {
    return "https://www.bankstatementconvert.to"
  }
  return "http://localhost:3000"
}

// Generate metadata for about page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const baseUrl = getBaseUrl()
  const dictionary = await getDictionary(lang)

  const title =
    dictionary.metadata?.about?.title || "About Bank Statement Convert | Our Story & Mission"
  const description =
    dictionary.metadata?.about?.description ||
    "Learn about Bank Statement Convert - the AI-powered tool trusted by thousands to convert PDF bank statements to Excel. Our mission is to simplify financial data processing for everyone."

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${lang}/about`,
      type: "website",
      images: [
        {
          url: `${baseUrl}/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&lang=${lang}&type=about`,
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
        `${baseUrl}/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&lang=${lang}&type=about`,
      ],
    },
  }
}

export default async function AboutPage({
  params: paramsPromise,
}: {
  params: Promise<{ lang: Locale }>
}) {
  const { lang } = await paramsPromise
  const dictionary = await getDictionary(lang)

  return (
    <div className="py-6 md:py-10">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
            {dictionary.about_page.title}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {dictionary.about_page.subtitle}
          </p>
        </div>

        {/* Our Mission & Vision Section */}
        <section className="mb-12 md:mb-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6 text-center">
              {dictionary.about_page.mission_vision_title}
            </h2>
            <div className="space-y-6 text-muted-foreground">
              <p>
                <strong>Mission:</strong> {dictionary.about_page.mission_text}
              </p>
              <p>
                <strong>Vision:</strong> {dictionary.about_page.vision_text}
              </p>
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="mb-12 md:mb-16 bg-secondary/50 py-12 md:py-16 rounded-lg">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">
              {dictionary.about_page.our_story_title}
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>{dictionary.about_page.story_paragraph_1}</p>
              <p>{dictionary.about_page.story_paragraph_2}</p>
              <p>{dictionary.about_page.story_paragraph_3}</p>
            </div>
          </div>
        </section>

        {/* Our Core Values Section */}
        <section className="mb-12 md:mb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-8 text-center">
              {dictionary.about_page.core_values_title}
            </h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="p-6 border rounded-lg">
                <h3 className="text-xl font-semibold mb-2">
                  {dictionary.about_page.value_1_title}
                </h3>
                <p className="text-muted-foreground">
                  {dictionary.about_page.value_1_description}
                </p>
              </div>
              <div className="p-6 border rounded-lg">
                <h3 className="text-xl font-semibold mb-2">
                  {dictionary.about_page.value_2_title}
                </h3>
                <p className="text-muted-foreground">
                  {dictionary.about_page.value_2_description}
                </p>
              </div>
              <div className="p-6 border rounded-lg">
                <h3 className="text-xl font-semibold mb-2">
                  {dictionary.about_page.value_3_title}
                </h3>
                <p className="text-muted-foreground">
                  {dictionary.about_page.value_3_description}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="text-center py-10">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
            {dictionary.about_page.cta_title}
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            {dictionary.about_page.cta_description}
          </p>
          <Button asChild size="lg">
            <Link href={`/${lang}/pricing`}>{dictionary.about_page.cta_button}</Link>
          </Button>
        </section>
      </div>
    </div>
  )
}
