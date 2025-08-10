import Stripe from "stripe"

// Server-side Stripe client
export function createStripeClient(): Stripe {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY

  if (!stripeSecretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable")
  }

  const apiVersion = process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion | undefined

  return new Stripe(stripeSecretKey, {
    apiVersion,
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
    monthlyPriceIdBRL: process.env.STRIPE_PAID1_MONTHLY_PRICE_ID_BRL,
    yearlyPriceIdBRL: process.env.STRIPE_PAID1_YEARLY_PRICE_ID_BRL,
    planType: "paid1" as const,
    name: "Lite",
    monthlyPrice: 2000, // $20.00 in cents
    yearlyPrice: 1200, // $12.00 in cents (billed annually)
    monthlyPriceBRL: 10000, // R$100.00 in cents (approximate)
    yearlyPriceBRL: 6000, // R$60.00 in cents (approximate)
  },
  paid2: {
    monthlyPriceId: process.env.STRIPE_PAID2_MONTHLY_PRICE_ID,
    yearlyPriceId: process.env.STRIPE_PAID2_YEARLY_PRICE_ID,
    monthlyPriceIdBRL: process.env.STRIPE_PAID2_MONTHLY_PRICE_ID_BRL,
    yearlyPriceIdBRL: process.env.STRIPE_PAID2_YEARLY_PRICE_ID_BRL,
    planType: "paid2" as const,
    name: "Pro",
    monthlyPrice: 4000, // $40.00 in cents
    yearlyPrice: 2400, // $24.00 in cents (billed annually)
    monthlyPriceBRL: 20000, // R$200.00 in cents (approximate)
    yearlyPriceBRL: 12000, // R$120.00 in cents (approximate)
  },
} as const

// Helper function to get plan configuration by plan type and currency
export function getPlanConfig(planType: "paid1" | "paid2", currency: "USD" | "BRL" = "USD") {
  const config = STRIPE_PLAN_CONFIG[planType]
  if (currency === "BRL") {
    return {
      ...config,
      monthlyPriceId: config.monthlyPriceIdBRL,
      yearlyPriceId: config.yearlyPriceIdBRL,
    }
  }
  return config
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
