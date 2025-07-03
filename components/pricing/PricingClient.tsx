"use client" // For the toggle functionality

import PricingCard from "@/components/marketing/PricingCard"
import { createCheckoutSession } from "@/lib/stripe/client"
import { useUserLimits } from "@/contexts/user-limits-context"
import { type Locale } from "@/i18n-config"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"

interface FAQ {
  question: string
  answer: string
}

interface Dictionary {
  pricing_page?: {
    title?: string
    subtitle?: string
    billing_monthly?: string
    billing_annual?: string
    save_badge?: string
    free_description?: string
    free_features?: string[]
    free_cta?: string
    growth_description?: string
    growth_features?: string[]
    growth_cta?: string
    premium_description?: string
    premium_features?: string[]
    premium_cta?: string
    faq_title?: string
    faq_subtitle?: string
    faqs?: FAQ[]
  }
  common?: {
    plan_price_monthly?: string
    pages_per_month?: string
  }
}

interface PricingClientProps {
  lang: Locale
  dictionary: Dictionary
}

export default function PricingClient({ lang, dictionary }: PricingClientProps) {
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const { subscribeToPlan } = useUserLimits()
  const [isAnnual, setIsAnnual] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Real Stripe subscription handler
  const handlePlanSelection = async (planName: string) => {
    if (!isSignedIn) {
      // Redirect to sign up if not authenticated - preserve language
      router.push(`/${lang}/sign-up`)
      return
    }

    // Handle free plan differently
    if (planName === "Free") {
      setIsLoading(true)
      try {
        await subscribeToPlan("free")
        // Redirect to viewer after successful subscription - preserve language
        router.push(`/${lang}/viewer`)
      } catch (error) {
        console.error("Failed to subscribe to free plan:", error)
        toast.error("Failed to activate free plan")
      } finally {
        setIsLoading(false)
      }
      return
    }

    // Map plan names to Stripe plan types
    const planMap: Record<string, "paid1" | "paid2"> = {
      Lite: "paid1",
      Pro: "paid2",
    }

    const planType = planMap[planName]
    if (planType) {
      setIsLoading(true)
      try {
        // Determine billing cycle based on toggle
        const billingCycle = isAnnual ? "yearly" : "monthly"

        // Create Stripe checkout session and redirect
        await createCheckoutSession(planType, billingCycle, lang)
      } catch (error) {
        console.error("Failed to create checkout session:", error)
        toast.error("Failed to start checkout process")
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Get translations
  const pricingTexts = dictionary.pricing_page || {}
  const monthlyFrequency = dictionary.common?.plan_price_monthly || "/month"
  const pagesPerMonth = dictionary.common?.pages_per_month || "pages/month"

  const plans = [
    {
      name: "Free",
      monthlyPrice: 0,
      annualPrice: 0,
      description: pricingTexts.free_description || "Perfect for quick, occasional conversions.",
      features: pricingTexts.free_features || ["50 pages total", "Basic email support"],
      cta: pricingTexts.free_cta || "Get Started",
      popular: false,
    },
    {
      name: "Lite",
      monthlyPrice: 20,
      annualPrice: 12, // per month, billed annually ($144/year)
      description: pricingTexts.growth_description || "Ideal for regular individual use.",
      features: pricingTexts.growth_features || [
        `500 ${pagesPerMonth}`,
        "Priority email support",
        "Access to all core features",
      ],
      cta: pricingTexts.growth_cta || "Choose Lite",
      popular: true,
    },
    {
      name: "Pro",
      monthlyPrice: 40,
      annualPrice: 24, // per month, billed annually ($288/year)
      description:
        pricingTexts.premium_description || "Best for power users and small businesses.",
      features: pricingTexts.premium_features || [
        `1000 ${pagesPerMonth}`,
        "Dedicated chat support",
        "Advanced analytics",
        "Early access to new features",
      ],
      cta: pricingTexts.premium_cta || "Choose Pro",
      popular: false,
    },
  ]

  const pricingFaqs: FAQ[] = pricingTexts.faqs || [
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
            {pricingTexts.title || "Find the Perfect Plan"}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            {pricingTexts.subtitle ||
              "Start for free, or choose a plan that scales with your needs. No hidden fees, cancel anytime."}
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
              {pricingTexts.billing_monthly || "Monthly"}
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-all cursor-pointer ${
                isAnnual
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {pricingTexts.billing_annual || "Annual"}
            </button>
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
              {pricingTexts.save_badge || "Save 40%"}
            </span>
          </div>
        </div>

        {/* Pricing Tiers Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch mb-10 md:mb-12">
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
                    : `$${plan.monthlyPrice}`
              }
              priceFrequency={
                plan.monthlyPrice > 0
                  ? isAnnual && plan.annualPrice > 0
                    ? monthlyFrequency
                    : monthlyFrequency
                  : undefined
              }
              description={plan.description}
              features={plan.features}
              ctaText={plan.cta}
              isPopular={plan.popular}
              isLoading={isLoading}
              onPlanSelect={handlePlanSelection}
            />
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-12 md:mt-16">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">
              {pricingTexts.faq_title || "Frequently Asked Questions"}
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mt-3">
              {pricingTexts.faq_subtitle || "Have more questions? We're here to help."}
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
      </div>
    </div>
  )
}
