import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AboutPage() {
  return (
    <div className="py-6 md:py-10">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
            About Bank Statement Converter
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Learn more about our mission, vision, and the team dedicated to simplifying your
            financial data management.
          </p>
        </div>

        {/* Our Mission & Vision Section */}
        <section className="mb-12 md:mb-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6 text-center">
              Our Mission & Vision
            </h2>
            <div className="space-y-6 text-muted-foreground">
              <p>
                <strong>Mission:</strong> To empower individuals and businesses by providing an
                intuitive, secure, and accurate tool for converting bank statements into actionable
                data. We aim to save you time and effort in managing your financial records.
              </p>
              <p>
                <strong>Vision:</strong> To be the leading solution for financial document
                conversion and analysis, continuously innovating to meet the evolving needs of our
                users and helping them achieve greater financial clarity and control.
              </p>
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="mb-12 md:mb-16 bg-secondary/50 py-12 md:py-16 rounded-lg">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">Our Story</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Bank Statement Converter was born out of a simple frustration: the tedious and
                time-consuming process of manually transcribing bank statement data. As finance
                professionals and software developers, we knew there had to be a better way.
              </p>
              <p>
                We envisioned a tool that was not only powerful but also accessible and easy to use
                for everyone, regardless of their technical expertise. After months of research,
                development, and user feedback, Bank Statement Converter came to life.
              </p>
              <p>
                Today, we&apos;re proud to help thousands of users streamline their financial
                workflows, and we&apos;re just getting started!
              </p>
            </div>
          </div>
        </section>

        {/* Our Core Values Section */}
        <section className="mb-12 md:mb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-8 text-center">
              Our Core Values
            </h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="p-6 border rounded-lg">
                <h3 className="text-xl font-semibold mb-2">User-Centricity</h3>
                <p className="text-muted-foreground">
                  Our users are at the heart of everything we do. We strive to understand their
                  needs and deliver solutions that genuinely help.
                </p>
              </div>
              <div className="p-6 border rounded-lg">
                <h3 className="text-xl font-semibold mb-2">Security & Privacy</h3>
                <p className="text-muted-foreground">
                  We are committed to protecting your data with the highest security standards and
                  respecting your privacy.
                </p>
              </div>
              <div className="p-6 border rounded-lg">
                <h3 className="text-xl font-semibold mb-2">Accuracy & Reliability</h3>
                <p className="text-muted-foreground">
                  We aim for precision in every conversion, ensuring you can trust the data you
                  work with.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="text-center py-10">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
            Ready to Simplify Your Finances?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of satisfied users and take control of your bank statement data today.
          </p>
          <Button asChild size="lg">
            <Link href="/pricing">View Pricing & Plans</Link>
          </Button>
        </section>
      </div>
    </div>
  )
}
