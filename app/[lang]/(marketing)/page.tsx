import InteractiveHeroSection from "@/components/marketing/interactive-hero-section"
import FeatureCard from "@/components/marketing/feature-card"
import TestimonialCard from "@/components/marketing/testimonial-card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { getDictionary } from "@/lib/getDictionary"
import { type Locale } from "@/i18n-config"

export default async function MarketingHomePage({
  params: paramsPromise, // Renamed to avoid conflict
}: {
  params: Promise<{ lang: Locale }>
}) {
  const { lang } = await paramsPromise
  const dictionary = await getDictionary(lang)

  return (
    <>
      <main>
        <InteractiveHeroSection
          heroTitle={dictionary.marketing_homepage.heroTitle}
          heroSubtitle={dictionary.marketing_homepage.heroSubtitle}
          heroCtaButton={dictionary.marketing_homepage.heroCtaButton}
          heroTrustText={dictionary.marketing_homepage.heroTrustText}
          fileUploadModuleStrings={dictionary.marketing_homepage.file_upload_module_strings}
        />
        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 md:py-24 bg-muted/30">
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
                icon="📄➡️📊"
                title={dictionary.marketing_homepage.feature1Title}
                description={dictionary.marketing_homepage.feature1Description}
              />
              <FeatureCard
                icon="🧠✨"
                title={dictionary.marketing_homepage.feature2Title}
                description={dictionary.marketing_homepage.feature2Description}
              />
              <FeatureCard
                icon="🛡️🔒"
                title={dictionary.marketing_homepage.feature3Title}
                description={dictionary.marketing_homepage.feature3Description}
              />
              <FeatureCard
                icon="⏱️⚡"
                title={dictionary.marketing_homepage.feature4Title}
                description={dictionary.marketing_homepage.feature4Description}
              />
              <FeatureCard
                icon="🌐🌍"
                title={dictionary.marketing_homepage.feature5Title}
                description={dictionary.marketing_homepage.feature5Description}
              />
              <FeatureCard
                icon="📈📉"
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
