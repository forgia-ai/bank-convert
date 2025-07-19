import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import InteractiveHeroSection from "@/components/marketing/InteractiveHeroSection"
import FeatureCard from "@/components/marketing/FeatureCard"
import StructuredData from "@/components/seo/StructuredData"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { getDictionary } from "@/lib/utils/get-dictionary"
import { type Locale } from "@/i18n-config"
import { Metadata } from "next"

export async function generateMetadata({
  params: paramsPromise,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await paramsPromise

  return {
    title: "Convert Bank Statement to XLS - Free PDF to XLS Converter",
    description:
      "Convert your bank statements to XLS format instantly. Upload PDF bank statements and get structured XLS files in seconds. Free tool with 99% accuracy.",
    keywords:
      "convert bank statement to xls, pdf to xls, bank statement converter, xls converter, pdf bank statement to xls",
    alternates: {
      canonical: `/${lang}/xls`,
    },
    openGraph: {
      title: "Convert Bank Statement to XLS - Free PDF to XLS Converter",
      description:
        "Convert your bank statements to XLS format instantly. Upload PDF bank statements and get structured XLS files in seconds. Free tool with 99% accuracy.",
      type: "website",
      url: `/${lang}/xls`,
    },
  }
}

export default async function XlsConvertPage({
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
    <>
      {/* Structured Data for SEO */}
      <StructuredData dictionary={dictionary} lang={lang} />

      <main>
        <InteractiveHeroSection
          heroTitle={dictionary.xls_page.heroTitle}
          heroSubtitle={dictionary.xls_page.heroSubtitle}
          heroCtaButton={dictionary.xls_page.heroCtaButton}
          heroTrustText={dictionary.xls_page.heroTrustText}
          lang={lang}
          fileUploadModuleStrings={dictionary.xls_page.file_upload_module_strings}
        />

        {/* How It Works Section */}
        <section id="how-it-works" className="py-12 md:py-16 bg-muted/30">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              {dictionary.xls_page.howItWorksTitle}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                    1
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">{dictionary.xls_page.step1Title}</h3>
                <p className="text-muted-foreground">{dictionary.xls_page.step1Description}</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                    2
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">{dictionary.xls_page.step2Title}</h3>
                <p className="text-muted-foreground">{dictionary.xls_page.step2Description}</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                    3
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">{dictionary.xls_page.step3Title}</h3>
                <p className="text-muted-foreground">{dictionary.xls_page.step3Description}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              {dictionary.xls_page.featuresTitle}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                title={dictionary.xls_page.feature1Title}
                description={dictionary.xls_page.feature1Description}
                icon="📊"
              />
              <FeatureCard
                title={dictionary.xls_page.feature2Title}
                description={dictionary.xls_page.feature2Description}
                icon="🤖"
              />
              <FeatureCard
                title={dictionary.xls_page.feature3Title}
                description={dictionary.xls_page.feature3Description}
                icon="🔐"
              />
              <FeatureCard
                title={dictionary.xls_page.feature4Title}
                description={dictionary.xls_page.feature4Description}
                icon="⚡"
              />
              <FeatureCard
                title={dictionary.xls_page.feature5Title}
                description={dictionary.xls_page.feature5Description}
                icon="🌍"
              />
              <FeatureCard
                title={dictionary.xls_page.feature6Title}
                description={dictionary.xls_page.feature6Description}
                icon="💰"
              />
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-12 md:py-16 bg-muted/30">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              {dictionary.xls_page.faqTitle}
            </h2>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionTrigger>{dictionary.xls_page.faq1Question}</AccordionTrigger>
                  <AccordionContent>{dictionary.xls_page.faq1Answer}</AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>{dictionary.xls_page.faq2Question}</AccordionTrigger>
                  <AccordionContent>{dictionary.xls_page.faq2Answer}</AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>{dictionary.xls_page.faq3Question}</AccordionTrigger>
                  <AccordionContent>{dictionary.xls_page.faq3Answer}</AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>{dictionary.xls_page.faq4Question}</AccordionTrigger>
                  <AccordionContent>{dictionary.xls_page.faq4Answer}</AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                  <AccordionTrigger>{dictionary.xls_page.faq5Question}</AccordionTrigger>
                  <AccordionContent>{dictionary.xls_page.faq5Answer}</AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{dictionary.xls_page.ctaTitle}</h2>
            <p className="text-xl text-muted-foreground mb-8">
              {dictionary.xls_page.ctaDescription}
            </p>
            <a
              href={`/${lang}#upload`}
              className="inline-flex items-center px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-lg font-semibold"
            >
              {dictionary.xls_page.ctaButton}
            </a>
          </div>
        </section>
      </main>
    </>
  )
}
