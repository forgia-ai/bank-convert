import { describe, it, expect, beforeEach, vi } from "vitest"

// Mock environment variables at the very top using vi.hoisted
const mockEnv = vi.hoisted(() => ({
  STRIPE_SECRET_KEY: "sk_test_123",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_123",
  STRIPE_WEBHOOK_SECRET: "whsec_123",
  STRIPE_PAID1_MONTHLY_PRICE_ID: "price_paid1_monthly",
  STRIPE_PAID1_YEARLY_PRICE_ID: "price_paid1_yearly",
  STRIPE_PAID2_MONTHLY_PRICE_ID: "price_paid2_monthly",
  STRIPE_PAID2_YEARLY_PRICE_ID: "price_paid2_yearly",
}))

// Set environment variables before any imports
vi.hoisted(() => {
  Object.entries(mockEnv).forEach(([key, value]) => {
    process.env[key] = value
  })
})

// Mock the stripe module
vi.mock("stripe", () => {
  const mockStripe = vi.fn().mockImplementation(() => ({}))
  return {
    default: mockStripe,
  }
})

import {
  createStripeClient,
  getStripePublishableKey,
  getStripeWebhookSecret,
  getPlanConfig,
  getPlanTypeFromPriceId,
  isYearlyPriceId,
  STRIPE_PLAN_CONFIG,
} from "@/lib/integrations/stripe"

describe("Stripe Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("createStripeClient", () => {
    it("should create a Stripe client with correct configuration", () => {
      const stripe = createStripeClient()
      expect(stripe).toBeDefined()
    })

    it("should throw error if STRIPE_SECRET_KEY is missing", () => {
      const originalValue = process.env.STRIPE_SECRET_KEY
      try {
        delete process.env.STRIPE_SECRET_KEY
        expect(() => createStripeClient()).toThrow(
          "Missing STRIPE_SECRET_KEY environment variable",
        )
      } finally {
        if (originalValue !== undefined) {
          process.env.STRIPE_SECRET_KEY = originalValue
        }
      }
    })
  })

  describe("getStripePublishableKey", () => {
    it("should return the publishable key", () => {
      const key = getStripePublishableKey()
      expect(key).toBe("pk_test_123")
    })

    it("should throw error if publishable key is missing", () => {
      const originalValue = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      try {
        delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        expect(() => getStripePublishableKey()).toThrow(
          "Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable",
        )
      } finally {
        if (originalValue !== undefined) {
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = originalValue
        }
      }
    })
  })

  describe("getStripeWebhookSecret", () => {
    it("should return the webhook secret", () => {
      const secret = getStripeWebhookSecret()
      expect(secret).toBe("whsec_123")
    })

    it("should throw error if webhook secret is missing", () => {
      const originalValue = process.env.STRIPE_WEBHOOK_SECRET
      try {
        delete process.env.STRIPE_WEBHOOK_SECRET
        expect(() => getStripeWebhookSecret()).toThrow(
          "Missing STRIPE_WEBHOOK_SECRET environment variable",
        )
      } finally {
        if (originalValue !== undefined) {
          process.env.STRIPE_WEBHOOK_SECRET = originalValue
        }
      }
    })
  })

  describe("Plan Configuration", () => {
    it("should have correct plan configuration structure", () => {
      expect(STRIPE_PLAN_CONFIG).toHaveProperty("paid1")
      expect(STRIPE_PLAN_CONFIG).toHaveProperty("paid2")

      expect(STRIPE_PLAN_CONFIG.paid1).toMatchObject({
        planType: "paid1",
        name: "Lite",
        monthlyPrice: 2000,
        yearlyPrice: 1200,
      })

      expect(STRIPE_PLAN_CONFIG.paid2).toMatchObject({
        planType: "paid2",
        name: "Pro",
        monthlyPrice: 4000,
        yearlyPrice: 2400,
      })
    })

    it("should get plan config correctly", () => {
      const paid1Config = getPlanConfig("paid1")
      expect(paid1Config).toBe(STRIPE_PLAN_CONFIG.paid1)

      const paid2Config = getPlanConfig("paid2")
      expect(paid2Config).toBe(STRIPE_PLAN_CONFIG.paid2)
    })
  })

  describe("getPlanTypeFromPriceId", () => {
    it("should return correct plan type for monthly price IDs", () => {
      expect(getPlanTypeFromPriceId(mockEnv.STRIPE_PAID1_MONTHLY_PRICE_ID)).toBe("paid1")
      expect(getPlanTypeFromPriceId(mockEnv.STRIPE_PAID2_MONTHLY_PRICE_ID)).toBe("paid2")
    })

    it("should return correct plan type for yearly price IDs", () => {
      expect(getPlanTypeFromPriceId(mockEnv.STRIPE_PAID1_YEARLY_PRICE_ID)).toBe("paid1")
      expect(getPlanTypeFromPriceId(mockEnv.STRIPE_PAID2_YEARLY_PRICE_ID)).toBe("paid2")
    })

    it("should return null for unknown price IDs", () => {
      expect(getPlanTypeFromPriceId("unknown_price")).toBeNull()
      expect(getPlanTypeFromPriceId("")).toBeNull()
    })
  })

  describe("isYearlyPriceId", () => {
    it("should correctly identify yearly price IDs", () => {
      expect(isYearlyPriceId(mockEnv.STRIPE_PAID1_YEARLY_PRICE_ID)).toBe(true)
      expect(isYearlyPriceId(mockEnv.STRIPE_PAID2_YEARLY_PRICE_ID)).toBe(true)
    })

    it("should return false for monthly price IDs", () => {
      expect(isYearlyPriceId(mockEnv.STRIPE_PAID1_MONTHLY_PRICE_ID)).toBe(false)
      expect(isYearlyPriceId(mockEnv.STRIPE_PAID2_MONTHLY_PRICE_ID)).toBe(false)
    })

    it("should return false for unknown price IDs", () => {
      expect(isYearlyPriceId("unknown_price")).toBe(false)
      expect(isYearlyPriceId("")).toBe(false)
    })
  })
})
