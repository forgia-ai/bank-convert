import Stripe from "stripe"

// Server-side Stripe client
export function createStripeClient(): Stripe {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY

  if (!stripeSecretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable")
  }

  return new Stripe(stripeSecretKey, {
    apiVersion: "2025-05-28.basil",
    typescript: true,
  })
}

// Client-side Stripe configuration
export function getStripePublishableKey(): string {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

  if (!publishableKey) {
    throw new Error("Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable")
  }

  return publishableKey
}

// Stripe webhook secret
export function getStripeWebhookSecret(): string {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET environment variable")
  }

  return webhookSecret
}

// Plan mapping configuration
export const STRIPE_PLAN_CONFIG = {
  paid1: {
    monthlyPriceId: process.env.STRIPE_PAID1_MONTHLY_PRICE_ID,
    yearlyPriceId: process.env.STRIPE_PAID1_YEARLY_PRICE_ID,
    planType: "paid1" as const,
    name: "Growth",
    monthlyPrice: 1333, // $13.33 in cents
    yearlyPrice: 800, // $8.00 in cents (billed annually)
  },
  paid2: {
    monthlyPriceId: process.env.STRIPE_PAID2_MONTHLY_PRICE_ID,
    yearlyPriceId: process.env.STRIPE_PAID2_YEARLY_PRICE_ID,
    planType: "paid2" as const,
    name: "Premium",
    monthlyPrice: 2333, // $23.33 in cents
    yearlyPrice: 1400, // $14.00 in cents (billed annually)
  },
} as const

// Helper function to get plan configuration by plan type
export function getPlanConfig(planType: "paid1" | "paid2") {
  return STRIPE_PLAN_CONFIG[planType]
}

// Helper function to get plan type from Stripe price ID
export function getPlanTypeFromPriceId(priceId: string): "paid1" | "paid2" | null {
  for (const [planType, config] of Object.entries(STRIPE_PLAN_CONFIG)) {
    if (config.monthlyPriceId === priceId || config.yearlyPriceId === priceId) {
      return planType as "paid1" | "paid2"
    }
  }
  return null
}

// Helper function to check if price ID is for yearly billing
export function isYearlyPriceId(priceId: string): boolean {
  return Object.values(STRIPE_PLAN_CONFIG).some((config) => config.yearlyPriceId === priceId)
}
