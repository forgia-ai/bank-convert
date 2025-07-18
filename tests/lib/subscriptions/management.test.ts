import {
  updateUserPlan,
  getUserPlan,
  getActiveSubscription,
  upsertSubscription,
  createTestSubscription,
} from "@/lib/subscriptions/management"
import { getOrCreateUsageRecord } from "@/lib/usage/tracking"
import { describe, it, expect, beforeEach, vi } from "vitest"

// Mock external dependencies
let mockSupabaseClient: any

beforeEach(() => {
  // Create a fresh mock for each test
  const createChainableMock = () => {
    const mock = {
      data: null,
      error: null,
      eq: vi.fn(() => createChainableMock()),
      in: vi.fn(() => createChainableMock()),
      select: vi.fn(() => createChainableMock()),
      update: vi.fn(() => createChainableMock()),
      insert: vi.fn(() => createChainableMock()),
      upsert: vi.fn(() => createChainableMock()),
      single: vi.fn(() => ({ data: null, error: null })),
      maybeSingle: vi.fn(() => ({ data: null, error: null })),
      order: vi.fn(() => createChainableMock()),
      limit: vi.fn(() => createChainableMock()),
    }
    return mock
  }

  mockSupabaseClient = {
    from: vi.fn(() => createChainableMock()),
  }
})

vi.mock("@/lib/integrations/supabase", () => ({
  createServerSupabaseClient: () => mockSupabaseClient,
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

  describe("getActiveSubscription", () => {
    it("should return null when no active subscription exists", async () => {
      const subscription = await getActiveSubscription("test-user")
      expect(subscription).toBeNull()
    })
  })

  describe("getUserPlan", () => {
    it("should return free plan when no active subscription", async () => {
      // Mock returns free plan by default
      vi.mocked(getOrCreateUsageRecord).mockResolvedValueOnce({
        id: "mock-id",
        pages_consumed: 0,
        billing_period_start: "2024-01-01",
        billing_period_end: "2024-01-31",
        plan_type: "free",
      })

      const planType = await getUserPlan("test-user")
      expect(planType).toBe("free")
    })
  })
})
