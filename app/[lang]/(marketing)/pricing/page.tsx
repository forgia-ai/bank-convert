"use client" // For the toggle functionality later

import PricingCard from "@/components/marketing/PricingCard"
import { createCheckoutSession } from "@/lib/stripe/client"
import { useUserLimits } from "@/contexts/user-limits-context"
import { i18n, type Locale } from "@/i18n-config"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"

export default function PricingPage() {
  const router = useRouter()
  const pathname = usePathname()
  const { isSignedIn } = useAuth()
  const { subscribeToPlan } = useUserLimits()
  const [isAnnual, setIsAnnual] = useState(false)

  // Extract current language from pathname
  const getCurrentLocale = (): Locale => {
    const segments = pathname.split("/").filter(Boolean)
    if (segments.length > 0 && ([...i18n.locales] as string[]).includes(segments[0])) {
      return segments[0] as Locale
    }
    return i18n.defaultLocale
  }

  const currentLang = getCurrentLocale()

  // Real Stripe subscription handler
  const handlePlanSelection = async (planName: string) => {
    if (!isSignedIn) {
      // Redirect to sign up if not authenticated - preserve language
      router.push(`/${currentLang}/sign-up`)
      return
    }

    // Handle free plan differently
    if (planName === "Free") {
      try {
        await subscribeToPlan("free")
        // Redirect to viewer after successful subscription - preserve language
        router.push(`/${currentLang}/viewer`)
      } catch (error) {
        console.error("Failed to subscribe to free plan:", error)
        toast.error("Failed to activate free plan")
      }
      return
    }

    // Map plan names to Stripe plan types
    const planMap: Record<string, "paid1" | "paid2"> = {
      Growth: "paid1",
      Premium: "paid2",
    }

    const planType = planMap[planName]
    if (planType) {
      try {
        // Determine billing cycle based on toggle
        const billingCycle = isAnnual ? "yearly" : "monthly"

        // Create Stripe checkout session and redirect
        await createCheckoutSession(planType, billingCycle, currentLang)
      } catch (error) {
        console.error("Failed to create checkout session:", error)
        toast.error("Failed to start checkout process")
      }
    }
  }

  const plans = [
    {
      name: "Free",
      monthlyPrice: 0,
      annualPrice: 0,
      description: "Perfect for quick, occasional conversions.",
      features: ["50 pages total", "Basic email support"],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Growth",
      monthlyPrice: 13.33,
      annualPrice: 8, // per month, billed annually ($96/year)
      description: "Ideal for regular individual use.",
      features: ["500 pages/month", "Priority email support", "Access to all core features"],
      cta: "Choose Growth",
      popular: true,
    },
    {
      name: "Premium",
      monthlyPrice: 23.33,
      annualPrice: 14, // per month, billed annually ($168/year)
      description: "Best for power users and small businesses.",
      features: [
        "1000 pages/month",
        "Dedicated chat support",
        "Advanced analytics",
        "Early access to new features",
      ],
      cta: "Choose Premium",
      popular: false,
    },
  ]

  const pricingFaqs = [
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards, including Visa, Mastercard, American Express, and Discover. Payments are processed securely via Stripe.",
    },
    {
      question: "Can I change my plan later?",
      answer:
        "Yes, you can upgrade or downgrade your plan at any time from your account settings. Changes will be prorated.",
    },
    {
      question: "Is there a discount for annual billing?",
      answer:
        "Yes! You can save significantly (up to ~40% depending on the plan) by choosing to pay annually instead of monthly.",
    },
    {
      question: "What counts as a 'page' for billing?",
      answer:
        "A 'page' refers to one page of a processed bank statement document. For example, a 5-page PDF statement will count as 5 pages towards your monthly limit.",
    },
    {
      question: "What happens if I exceed my monthly page limit?",
      answer:
        "If you exceed your monthly page limit, you'll be prompted to upgrade to a higher plan. Alternatively, you can wait until your next billing cycle for your quota to reset.",
    },
    {
      question: "Do you offer refunds?",
      answer:
        "We offer a 7-day money-back guarantee on new subscriptions if you're not satisfied. Please contact support for assistance.",
    },
  ]

  return (
    <div className="py-6 md:py-10">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-3">
            Find the Perfect Plan
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Start for free, or choose a plan that scales with your needs. No hidden fees, cancel
            anytime.
          </p>

          {/* Enhanced Billing Toggle */}
          <div className="inline-flex items-center p-1 bg-muted rounded-lg relative mb-8">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-all cursor-pointer ${
                !isAnnual
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-all cursor-pointer ${
                isAnnual
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annual
            </button>
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
              Save 40%
            </span>
          </div>
        </div>

        {/* Pricing Tiers Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch mb-10 md:mb-12">
          {" "}
          {/* items-stretch for equal height cards */}
          {plans.map((plan) => (
            <PricingCard
              key={plan.name}
              planName={plan.name}
              price={
                plan.monthlyPrice === 0
                  ? "$0"
                  : isAnnual
                    ? `$${plan.annualPrice}`
                    : `$${plan.monthlyPrice.toFixed(2)}`
              }
              priceFrequency={
                plan.monthlyPrice > 0
                  ? isAnnual && plan.annualPrice > 0
                    ? "/month"
                    : "/month"
                  : undefined
              }
              description={plan.description}
              features={plan.features}
              ctaText={plan.cta}
              isPopular={plan.popular}
              onPlanSelect={handlePlanSelection}
            />
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-12 md:mt-16">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mt-3">
              Have more questions? We&apos;re here to help.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
            {pricingFaqs.map((faq, index) => (
              <AccordionItem value={`item-${index + 1}`} key={index}>
                <AccordionTrigger className="text-lg text-left hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Features Comparison Table (Placeholder) */}
      </div>
    </div>
  )
}
