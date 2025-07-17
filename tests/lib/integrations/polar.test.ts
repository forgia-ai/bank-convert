import { describe, it, expect, beforeEach, vi } from "vitest"

// Mock environment variables at the very top using vi.hoisted
const mockEnv = vi.hoisted(() => ({
  NEXT_PUBLIC_POLAR_PAID1_MONTHLY_PRODUCT_ID: "prod_paid1_monthly_test",
  NEXT_PUBLIC_POLAR_PAID1_ANNUAL_PRODUCT_ID: "prod_paid1_yearly_test",
  NEXT_PUBLIC_POLAR_PAID2_MONTHLY_PRODUCT_ID: "prod_paid2_monthly_test",
  NEXT_PUBLIC_POLAR_PAID2_ANNUAL_PRODUCT_ID: "prod_paid2_yearly_test",
  POLAR_WEBHOOK_SECRET: "whsec_polar_test_123",
}))

// Set environment variables before any imports
vi.hoisted(() => {
  Object.entries(mockEnv).forEach(([key, value]) => {
    process.env[key] = value
  })
})

import {
  POLAR_PLAN_CONFIG,
  getPlanConfigByProductId,
  getPlanTier,
  getBillingCycle,
  mapLegacyPlanToPolar,
  getPlanDisplayInfo,
  type PolarPlanType,
} from "@/lib/integrations/polar"

describe("Polar Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("POLAR_PLAN_CONFIG", () => {
    it("should have correct plan configuration structure", () => {
      expect(POLAR_PLAN_CONFIG).toHaveProperty("paid1_monthly")
      expect(POLAR_PLAN_CONFIG).toHaveProperty("paid1_yearly")
      expect(POLAR_PLAN_CONFIG).toHaveProperty("paid2_monthly")
      expect(POLAR_PLAN_CONFIG).toHaveProperty("paid2_yearly")

      expect(POLAR_PLAN_CONFIG.paid1_monthly).toMatchObject({
        productId: "prod_paid1_monthly_test",
        planType: "paid1_monthly",
        name: "Lite Monthly",
        price: 2000,
        billingCycle: "monthly",
        features: expect.arrayContaining(["500 pages/month"]),
      })

      expect(POLAR_PLAN_CONFIG.paid1_yearly).toMatchObject({
        productId: "prod_paid1_yearly_test",
        planType: "paid1_yearly",
        name: "Lite Yearly",
        price: 14400,
        effectiveMonthlyPrice: 1200,
        billingCycle: "yearly",
        features: expect.arrayContaining(["500 pages/month"]),
      })

      expect(POLAR_PLAN_CONFIG.paid2_monthly).toMatchObject({
        productId: "prod_paid2_monthly_test",
        planType: "paid2_monthly",
        name: "Pro Monthly",
        price: 4000,
        billingCycle: "monthly",
        features: expect.arrayContaining(["1000 pages/month"]),
      })

      expect(POLAR_PLAN_CONFIG.paid2_yearly).toMatchObject({
        productId: "prod_paid2_yearly_test",
        planType: "paid2_yearly",
        name: "Pro Yearly",
        price: 28800,
        effectiveMonthlyPrice: 2400,
        billingCycle: "yearly",
        features: expect.arrayContaining(["1000 pages/month"]),
      })
    })

    it("should have all required properties for each plan", () => {
      Object.entries(POLAR_PLAN_CONFIG).forEach(([key, config]) => {
        expect(config).toHaveProperty("productId")
        expect(config).toHaveProperty("planType")
        expect(config).toHaveProperty("name")
        expect(config).toHaveProperty("price")
        expect(config).toHaveProperty("billingCycle")
        expect(config).toHaveProperty("features")
        expect(Array.isArray(config.features)).toBe(true)
        expect(typeof config.productId).toBe("string")
        expect(typeof config.planType).toBe("string")
        expect(typeof config.name).toBe("string")
        expect(typeof config.price).toBe("number")
        expect(["monthly", "yearly"]).toContain(config.billingCycle)
      })
    })
  })

  describe("getPlanConfigByProductId", () => {
    it("should return correct plan config for valid product IDs", () => {
      const paid1Monthly = getPlanConfigByProductId("prod_paid1_monthly_test")
      expect(paid1Monthly).toBe(POLAR_PLAN_CONFIG.paid1_monthly)

      const paid1Yearly = getPlanConfigByProductId("prod_paid1_yearly_test")
      expect(paid1Yearly).toBe(POLAR_PLAN_CONFIG.paid1_yearly)

      const paid2Monthly = getPlanConfigByProductId("prod_paid2_monthly_test")
      expect(paid2Monthly).toBe(POLAR_PLAN_CONFIG.paid2_monthly)

      const paid2Yearly = getPlanConfigByProductId("prod_paid2_yearly_test")
      expect(paid2Yearly).toBe(POLAR_PLAN_CONFIG.paid2_yearly)
    })

    it("should return null for unknown product IDs", () => {
      expect(getPlanConfigByProductId("unknown_product")).toBeNull()
      expect(getPlanConfigByProductId("")).toBeNull()
      expect(getPlanConfigByProductId("prod_invalid")).toBeNull()
    })
  })

  describe("getPlanTier", () => {
    it("should return correct tier for paid1 plans", () => {
      expect(getPlanTier("paid1_monthly")).toBe("paid1")
      expect(getPlanTier("paid1_yearly")).toBe("paid1")
    })

    it("should return correct tier for paid2 plans", () => {
      expect(getPlanTier("paid2_monthly")).toBe("paid2")
      expect(getPlanTier("paid2_yearly")).toBe("paid2")
    })
  })

  describe("getBillingCycle", () => {
    it("should return monthly for monthly plans", () => {
      expect(getBillingCycle("paid1_monthly")).toBe("monthly")
      expect(getBillingCycle("paid2_monthly")).toBe("monthly")
    })

    it("should return yearly for yearly plans", () => {
      expect(getBillingCycle("paid1_yearly")).toBe("yearly")
      expect(getBillingCycle("paid2_yearly")).toBe("yearly")
    })
  })

  describe("mapLegacyPlanToPolar", () => {
    it("should map legacy plans to default monthly Polar plans", () => {
      expect(mapLegacyPlanToPolar("paid1")).toBe("paid1_monthly")
      expect(mapLegacyPlanToPolar("paid2")).toBe("paid2_monthly")
    })

    it("should return null for unknown legacy plans", () => {
      expect(mapLegacyPlanToPolar("unknown")).toBeNull()
      expect(mapLegacyPlanToPolar("free")).toBeNull()
      expect(mapLegacyPlanToPolar("")).toBeNull()
    })
  })

  describe("getPlanDisplayInfo", () => {
    it("should return correct display info for monthly plans", () => {
      const info = getPlanDisplayInfo("paid1_monthly")
      expect(info).toEqual({
        name: "Lite Monthly",
        price: 2000,
        effectiveMonthlyPrice: 2000,
        billingCycle: "monthly",
        features: expect.arrayContaining(["500 pages/month"]),
      })
    })

    it("should return correct display info for yearly plans", () => {
      const info = getPlanDisplayInfo("paid1_yearly")
      expect(info).toEqual({
        name: "Lite Yearly",
        price: 14400,
        effectiveMonthlyPrice: 1200,
        billingCycle: "yearly",
        features: expect.arrayContaining(["500 pages/month"]),
      })
    })

    it("should return null for invalid plan types", () => {
      expect(getPlanDisplayInfo("invalid" as PolarPlanType)).toBeNull()
    })
  })
})
