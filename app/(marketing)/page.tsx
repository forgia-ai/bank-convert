import Link from "next/link"
import { Button } from "@/components/ui/button"
import InteractiveHeroSection from "@/components/marketing/interactive-hero-section"
import FeatureCard from "@/components/marketing/feature-card"
import TestimonialCard from "@/components/marketing/testimonial-card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function MarketingHomePage() {
  return (
    <>
      <main>
        <InteractiveHeroSection />
        {/* Other homepage sections will go here */}
        {/* Placeholder for 'How It Works' section */}
        <section id="how-it-works" className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              How It Works in 3 Simple Steps
            </h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-5xl text-primary mb-4">1.</div>
                <h3 className="text-xl font-semibold mb-2">Upload Your Statement</h3>
                <p className="text-muted-foreground">
                  Securely upload your PDF or CSV bank statement.
                </p>
              </div>
              <div>
                <div className="text-5xl text-primary mb-4">2.</div>
                <h3 className="text-xl font-semibold mb-2">AI Extracts Data</h3>
                <p className="text-muted-foreground">
                  Our smart AI processes and structures your transaction data accurately.
                </p>
              </div>
              <div>
                <div className="text-5xl text-primary mb-4">3.</div>
                <h3 className="text-xl font-semibold mb-2">Download Excel</h3>
                <p className="text-muted-foreground">
                  Get a clean, organized Excel file ready for your needs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Key Features Section */}
        <section id="features" className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Unlock Powerful Features
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon="📄➡️📊" // Placeholder icon (Emoji)
                title="Multi-Format Support"
                description="Effortlessly convert PDF and CSV bank statements into clean Excel files."
              />
              <FeatureCard
                icon="🧠✨" // Placeholder icon (Emoji)
                title="AI-Powered Accuracy"
                description="Leverage advanced AI to ensure precise extraction of all transaction details."
              />
              <FeatureCard
                icon="🛡️🔒" // Placeholder icon (Emoji)
                title="Secure & Confidential"
                description="Your financial data is encrypted and processed with utmost privacy."
              />
              <FeatureCard
                icon="⏱️⚡" // Placeholder icon (Emoji)
                title="Blazing Fast Speed"
                description="Get your converted files in seconds, not minutes. Save valuable time."
              />
              <FeatureCard
                icon="🌐🌍" // Placeholder icon (Emoji)
                title="Multi-Language Interface"
                description="Access and use the converter in your preferred language for a better experience."
              />
              <FeatureCard
                icon="📈📉" // Placeholder icon (Emoji)
                title="Consolidated View"
                description="Merge data from multiple statements for a comprehensive financial overview."
              />
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Loved by Users Like You
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <TestimonialCard
                quote="This tool saved me hours of manual data entry! Converting PDF statements to Excel is now a breeze."
                author="Sarah L."
                role="Freelance Accountant"
                // avatar="https://i.pravatar.cc/150?u=sarah" // Example using pravatar
              />
              <TestimonialCard
                quote="Finally, a simple and accurate way to get my bank transactions into a spreadsheet. Highly recommend!"
                author="John B."
                role="Small Business Owner"
                // avatar="https://i.pravatar.cc/150?u=john"
              />
              <TestimonialCard
                quote="The AI-powered extraction is impressively accurate. It handles different bank statement formats surprisingly well."
                author="Mike P."
                role="Financial Analyst"
                // avatar="https://i.pravatar.cc/150?u=mike"
              />
            </div>
          </div>
        </section>

        {/* Pricing Plans Callout Section */}
        <section id="pricing-cta" className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Choose the plan that&apos;s right for you. Convert your first page for free, or
              unlock more power with our affordable Growth and Premium plans.
            </p>
            <Button size="lg" asChild>
              <Link href="/pricing">View Pricing Plans</Link>
            </Button>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>What file formats can I upload?</AccordionTrigger>
                  <AccordionContent>
                    Currently, we support PDF and CSV file formats for bank statements. We are
                    working on adding support for more formats in the future.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Is my financial data secure?</AccordionTrigger>
                  <AccordionContent>
                    Absolutely. We prioritize your data security. All uploaded files and extracted
                    data are encrypted and handled with strict confidentiality. We do not store
                    your files long-term after processing.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>How accurate is the data extraction?</AccordionTrigger>
                  <AccordionContent>
                    Our AI-powered extraction is highly accurate for most common bank statement
                    layouts. However, complex or unusual formats might occasionally see variations.
                    We continuously improve our AI models.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>What are the limits on the Free plan?</AccordionTrigger>
                  <AccordionContent>
                    The Free plan allows you to convert up to 1 page per day. For higher limits and
                    more features, please consider our Growth or Premium plans.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                  <AccordionTrigger>Can I cancel my subscription anytime?</AccordionTrigger>
                  <AccordionContent>
                    Yes, you can cancel your monthly or annual subscription at any time. Your
                    access will continue until the end of your current billing period.
                  </AccordionContent>
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
