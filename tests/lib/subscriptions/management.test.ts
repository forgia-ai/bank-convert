import { updateUserPlan, getUserPlan } from "@/lib/subscriptions/management"
import { getOrCreateUsageRecord } from "@/lib/usage/tracking"
import { describe, it, expect, beforeEach, vi } from "vitest"

// Mock external dependencies
vi.mock("@/lib/integrations/supabase", () => ({
  createServerSupabaseClient: () => ({
    from: () => ({
      update: () => ({
        eq: () => ({
          eq: () => ({ error: null }),
        }),
      }),
      upsert: () => ({ error: null }),
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => ({
              maybeSingle: () => ({ data: null, error: null }),
            }),
          }),
        }),
      }),
    }),
  }),
}))

vi.mock("@/lib/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock("@/lib/usage/tracking", async () => {
  const actual = await vi.importActual("@/lib/usage/tracking")
  return {
    ...actual,
    getOrCreateUsageRecord: vi.fn().mockResolvedValue({
      id: "mock-id",
      pages_consumed: 0,
      billing_period_start: "2024-01-01",
      billing_period_end: "2024-01-31",
      plan_type: "free",
    }),
  }
})

describe("Subscription Management", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("updateUserPlan", () => {
    it("should validate required user ID", async () => {
      await expect(updateUserPlan("", "paid1")).rejects.toThrow("User ID is required")
    })

    it("should validate plan type", async () => {
      await expect(updateUserPlan("user-123", "invalid" as any)).rejects.toThrow(
        "Invalid plan type: invalid",
      )
    })

    it("should accept valid plan types", async () => {
      // These should not throw
      await expect(updateUserPlan("user-123", "free")).resolves.toBeUndefined()
      await expect(updateUserPlan("user-123", "paid1")).resolves.toBeUndefined()
      await expect(updateUserPlan("user-123", "paid2")).resolves.toBeUndefined()
    })
  })

  describe("getUserPlan", () => {
    it("should return plan type for existing user", async () => {
      // Mock the getOrCreateUsageRecord to return paid1 plan
      vi.mocked(getOrCreateUsageRecord).mockResolvedValueOnce({
        id: "mock-id",
        pages_consumed: 0,
        billing_period_start: "2024-01-01",
        billing_period_end: "2024-01-31",
        plan_type: "paid1",
      })

      const planType = await getUserPlan("test-user")
      expect(planType).toBe("paid1")
    })

    it("should return free plan for new user", async () => {
      // Mock returns free plan by default
      vi.mocked(getOrCreateUsageRecord).mockResolvedValueOnce({
        id: "mock-id",
        pages_consumed: 0,
        billing_period_start: "2024-01-01",
        billing_period_end: "2024-01-31",
        plan_type: "free",
      })

      const planType = await getUserPlan("new-user")
      expect(planType).toBe("free")
    })

    it("should handle subscription start date", async () => {
      const startDate = new Date("2024-01-15")
      const planType = await getUserPlan("user-with-start-date", startDate)
      expect(typeof planType).toBe("string")
      expect(["free", "paid1", "paid2"]).toContain(planType)
    })
  })
})
