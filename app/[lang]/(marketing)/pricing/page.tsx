"use client" // For the toggle functionality later

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import PricingCard from "@/components/marketing/PricingCard" // New import
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion" // New import
import { useUserLimits, type SubscriptionPlan } from "@/contexts/user-limits-context"
import { useAuth } from "@clerk/nextjs"
import { i18n, type Locale } from "@/i18n-config"

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

  // Mock subscription handler
  const handlePlanSelection = async (planName: string) => {
    if (!isSignedIn) {
      // Redirect to sign up if not authenticated - preserve language
      router.push(`/${currentLang}/sign-up`)
      return
    }

    // Map plan names to subscription plans
    const planMap: Record<string, SubscriptionPlan> = {
      Free: "free",
      Growth: "paid1",
      Premium: "paid2",
    }

    const plan = planMap[planName]
    if (plan) {
      try {
        await subscribeToPlan(plan)
        // Redirect to viewer after successful subscription - preserve language
        router.push(`/${currentLang}/viewer`)
      } catch (error) {
        console.error("Failed to subscribe to plan:", error)
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
        "Unlimited pages/month",
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
    <div className="py-12 md:py-20">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
            Find the Perfect Plan
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Start for free, or choose a plan that scales with your needs. No hidden fees, cancel
            anytime.
          </p>
          <div className="mt-8 flex items-center justify-center space-x-2">
            <Label
              htmlFor="billing-cycle"
              className={!isAnnual ? "font-semibold text-primary" : "text-muted-foreground"}
            >
              Monthly
            </Label>
            <Switch
              id="billing-cycle"
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              aria-label="Toggle billing cycle"
            />
            <Label
              htmlFor="billing-cycle"
              className={isAnnual ? "font-semibold text-primary" : "text-muted-foreground"}
            >
              Annual <span className="text-sm font-normal text-green-600">(Save up to ~40%)</span>
            </Label>
          </div>
        </div>

        {/* Pricing Tiers Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch mb-16 md:mb-24">
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
        <div className="mt-16 md:mt-24">
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
