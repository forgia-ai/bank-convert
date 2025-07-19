import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import InteractiveHeroSection from "@/components/marketing/InteractiveHeroSection"
import FeatureCard from "@/components/marketing/FeatureCard"
import TestimonialCard from "@/components/marketing/TestimonialCard"
import StructuredData from "@/components/seo/StructuredData"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { getDictionary } from "@/lib/utils/get-dictionary"
import { type Locale } from "@/i18n-config"
import type { Metadata } from "next"

// Get base URL for metadata
const getBaseUrl = (): string => {
  if (process.env.NODE_ENV === "production") {
    return process.env.NEXT_PUBLIC_SITE_URL || "https://bankstatementconvert.com"
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
  ): dict is {
    metadata: { homepage?: { title?: string; description?: string; keywords?: string } }
  } => {
    return !!(
      dict &&
      typeof dict === "object" &&
      dict !== null &&
      "metadata" in dict &&
      (dict as Record<string, unknown>).metadata &&
      typeof (dict as Record<string, unknown>).metadata === "object"
    )
  }

  const hasHomepageMetadata = (
    metadata: unknown,
  ): metadata is { homepage: { title?: string; description?: string; keywords?: string } } => {
    return !!(
      metadata &&
      typeof metadata === "object" &&
      metadata !== null &&
      "homepage" in metadata &&
      (metadata as Record<string, unknown>).homepage &&
      typeof (metadata as Record<string, unknown>).homepage === "object"
    )
  }

  // Safely extract metadata with proper validation
  const metadata = hasMetadata(dictionary) ? dictionary.metadata : null
  const homepageMetadata = metadata && hasHomepageMetadata(metadata) ? metadata.homepage : null

  const title =
    homepageMetadata?.title || "Convert Bank Statements to Excel | Free PDF to Excel Converter"
  const description =
    homepageMetadata?.description ||
    "Transform PDF bank statements into Excel spreadsheets instantly. AI-powered extraction with 99% accuracy. Free tool trusted by thousands worldwide."
  const keywords =
    homepageMetadata?.keywords ||
    "bank statement converter, pdf to excel, convert bank statement, excel converter, pdf bank statement to excel"

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `${baseUrl}/${lang}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${baseUrl}/${lang}`,
    },
  }
}

export default async function MarketingHomePage({
  params: paramsPromise, // Renamed to avoid conflict
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
    <>
      {/* Structured Data for SEO */}
      <StructuredData dictionary={dictionary} lang={lang} />

      <main>
        <InteractiveHeroSection
          heroTitle={dictionary.marketing_homepage.heroTitle}
          heroSubtitle={dictionary.marketing_homepage.heroSubtitle}
          heroCtaButton={dictionary.marketing_homepage.heroCtaButton}
          heroTrustText={dictionary.marketing_homepage.heroTrustText}
          lang={lang} // Ensure this line is present
          fileUploadModuleStrings={dictionary.marketing_homepage.file_upload_module_strings}
        />
        {/* How It Works Section */}
        <section id="how-it-works" className="py-12 md:py-16 bg-muted/30">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              {dictionary.marketing_homepage.howItWorksTitle}
            </h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-5xl text-primary mb-4">1.</div>
                <h3 className="text-xl font-semibold mb-2">
                  {dictionary.marketing_homepage.step1Title}
                </h3>
                <p className="text-muted-foreground">
                  {dictionary.marketing_homepage.step1Description}
                </p>
              </div>
              <div>
                <div className="text-5xl text-primary mb-4">2.</div>
                <h3 className="text-xl font-semibold mb-2">
                  {dictionary.marketing_homepage.step2Title}
                </h3>
                <p className="text-muted-foreground">
                  {dictionary.marketing_homepage.step2Description}
                </p>
              </div>
              <div>
                <div className="text-5xl text-primary mb-4">3.</div>
                <h3 className="text-xl font-semibold mb-2">
                  {dictionary.marketing_homepage.step3Title}
                </h3>
                <p className="text-muted-foreground">
                  {dictionary.marketing_homepage.step3Description}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Key Features Section */}
        <section id="features" className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              {dictionary.marketing_homepage.featuresTitle}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-8 h-8">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                }
                title={dictionary.marketing_homepage.feature1Title}
                description={dictionary.marketing_homepage.feature1Description}
              />
              <FeatureCard
                icon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-8 h-8">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                }
                title={dictionary.marketing_homepage.feature2Title}
                description={dictionary.marketing_homepage.feature2Description}
              />
              <FeatureCard
                icon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-8 h-8">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                }
                title={dictionary.marketing_homepage.feature3Title}
                description={dictionary.marketing_homepage.feature3Description}
              />
              <FeatureCard
                icon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-8 h-8">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                }
                title={dictionary.marketing_homepage.feature4Title}
                description={dictionary.marketing_homepage.feature4Description}
              />
              <FeatureCard
                icon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-8 h-8">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                    />
                  </svg>
                }
                title={dictionary.marketing_homepage.feature5Title}
                description={dictionary.marketing_homepage.feature5Description}
              />
              <FeatureCard
                icon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-8 h-8">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                }
                title={dictionary.marketing_homepage.feature6Title}
                description={dictionary.marketing_homepage.feature6Description}
              />
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              {dictionary.marketing_homepage.testimonialsTitle}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <TestimonialCard
                quote={dictionary.marketing_homepage.testimonial1Quote}
                author={dictionary.marketing_homepage.testimonial1Author}
              />
              <TestimonialCard
                quote={dictionary.marketing_homepage.testimonial2Quote}
                author={dictionary.marketing_homepage.testimonial2Author}
              />
              <TestimonialCard
                quote={dictionary.marketing_homepage.testimonial3Quote}
                author={dictionary.marketing_homepage.testimonial3Author}
              />
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              {dictionary.marketing_homepage.faqTitle}
            </h2>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>{dictionary.marketing_homepage.faq1Question}</AccordionTrigger>
                  <AccordionContent>{dictionary.marketing_homepage.faq1Answer}</AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>{dictionary.marketing_homepage.faq2Question}</AccordionTrigger>
                  <AccordionContent>{dictionary.marketing_homepage.faq2Answer}</AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>{dictionary.marketing_homepage.faq3Question}</AccordionTrigger>
                  <AccordionContent>{dictionary.marketing_homepage.faq3Answer}</AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>{dictionary.marketing_homepage.faq4Question}</AccordionTrigger>
                  <AccordionContent>{dictionary.marketing_homepage.faq4Answer}</AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                  <AccordionTrigger>{dictionary.marketing_homepage.faq5Question}</AccordionTrigger>
                  <AccordionContent>{dictionary.marketing_homepage.faq5Answer}</AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* Further sections will be added below */}
      </main>
    </>
  )
}
