import { describe, it, expect, beforeEach, vi } from "vitest"

// Mock environment variables and dependencies
const { mockUpdateUserSubscriptionFromPolar, mockUpdateUserPlan, mockGetPlanConfigByProductId } =
  vi.hoisted(() => {
    // Set environment variables
    process.env.POLAR_WEBHOOK_SECRET = "whsec_test_123"
    process.env.NEXT_PUBLIC_POLAR_PAID1_MONTHLY_PRODUCT_ID = "prod_paid1_monthly_test"
    process.env.NEXT_PUBLIC_POLAR_PAID1_ANNUAL_PRODUCT_ID = "prod_paid1_yearly_test"
    process.env.NEXT_PUBLIC_POLAR_PAID2_MONTHLY_PRODUCT_ID = "prod_paid2_monthly_test"
    process.env.NEXT_PUBLIC_POLAR_PAID2_ANNUAL_PRODUCT_ID = "prod_paid2_yearly_test"

    // Create mock functions
    return {
      mockUpdateUserSubscriptionFromPolar: vi.fn(),
      mockUpdateUserPlan: vi.fn(),
      mockGetPlanConfigByProductId: vi.fn(),
    }
  })

vi.mock("@/lib/integrations/polar", () => ({
  updateUserSubscriptionFromPolar: mockUpdateUserSubscriptionFromPolar,
  getPlanConfigByProductId: mockGetPlanConfigByProductId,
}))

vi.mock("@/lib/subscriptions/management", () => ({
  updateUserPlan: mockUpdateUserPlan,
}))

vi.mock("@/lib/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock Supabase
const mockSupabaseFrom = vi.fn()
vi.mock("@/lib/integrations/supabase", () => ({
  createServerSupabaseClient: vi.fn(() => ({
    from: mockSupabaseFrom,
  })),
}))

// Mock Polar SDK - we'll test the handlers indirectly by importing and calling them
vi.mock("@polar-sh/nextjs", () => ({
  Webhooks: vi.fn((config) => {
    // Store the handlers for testing
    ;(global as any).polarWebhookHandlers = config
    return vi.fn() // Return a mock function for the POST handler
  }),
}))

import { logger } from "@/lib/utils/logger"

// Import the webhook route to trigger the Webhooks() call and capture handlers
import "@/app/api/polar/webhooks/route"

describe("Polar Webhook Handlers", () => {
  let handlers: any

  beforeEach(() => {
    vi.clearAllMocks()
    handlers = (global as any).polarWebhookHandlers

    // Default mock implementations
    mockGetPlanConfigByProductId.mockReturnValue({
      planType: "paid1_monthly",
      productId: "prod_paid1_monthly_test",
    })
    mockUpdateUserSubscriptionFromPolar.mockResolvedValue(undefined)
    mockUpdateUserPlan.mockResolvedValue(undefined)

    // Default Supabase mock - returns same plan type (no plan change)
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { plan_type: "paid1" },
          }),
        }),
      }),
    })
  })

  describe("onPayload - subscription.uncanceled", () => {
    const createUncanceledPayload = (overrides = {}) => ({
      type: "subscription.uncanceled",
      data: {
        id: "sub_test_123",
        customerId: "cust_test_123",
        productId: "prod_paid1_monthly_test",
        status: "active",
        canceledAt: null,
        cancelAtPeriodEnd: false,
        currentPeriodStart: new Date("2024-01-01"),
        currentPeriodEnd: new Date("2024-02-01"),
        metadata: {
          userId: "user_test_123",
        },
        ...overrides,
      },
    })

    it("should process valid uncancellation event", async () => {
      const payload = createUncanceledPayload()

      await handlers.onPayload(payload)

      expect(mockUpdateUserSubscriptionFromPolar).toHaveBeenCalledWith({
        userId: "user_test_123",
        subscription: {
          id: "sub_test_123",
          customerId: "cust_test_123",
          productId: "prod_paid1_monthly_test",
          currentPeriodStart: "2024-01-01T00:00:00.000Z",
          currentPeriodEnd: "2024-02-01T00:00:00.000Z",
          canceledAt: null,
        },
        planType: "paid1",
        status: "active",
      })

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "uncancellation_completed",
        }),
        "Subscription uncancellation processed successfully via onPayload",
      )
    })

    it("should skip processing when userId is missing", async () => {
      const payload = createUncanceledPayload({
        metadata: {},
      })

      await handlers.onPayload(payload)

      expect(mockUpdateUserSubscriptionFromPolar).not.toHaveBeenCalled()
      expect(logger.warn).toHaveBeenCalledWith(
        { subscriptionId: "sub_test_123" },
        "Subscription uncanceled without userId",
      )
    })

    it("should skip processing when uncancellation is invalid", async () => {
      const payload = createUncanceledPayload({
        canceledAt: "2024-01-15T10:00:00Z", // Should be null for valid uncancellation
      })

      await handlers.onPayload(payload)

      expect(mockUpdateUserSubscriptionFromPolar).not.toHaveBeenCalled()
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          canceledAt: "2024-01-15T10:00:00Z",
        }),
        "Received subscription.uncanceled event but payload doesn't indicate valid uncancellation",
      )
    })

    it("should handle paid2 plan type correctly", async () => {
      mockGetPlanConfigByProductId.mockReturnValue({
        planType: "paid2_monthly",
        productId: "prod_paid2_monthly_test",
      })

      const payload = createUncanceledPayload({
        productId: "prod_paid2_monthly_test",
      })

      await handlers.onPayload(payload)

      expect(mockUpdateUserSubscriptionFromPolar).toHaveBeenCalledWith(
        expect.objectContaining({
          planType: "paid2",
        }),
      )
    })

    it("should handle errors gracefully", async () => {
      mockUpdateUserSubscriptionFromPolar.mockRejectedValue(new Error("Database error"))

      const payload = createUncanceledPayload()

      await handlers.onPayload(payload)

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error),
          subscriptionId: "sub_test_123",
        }),
        "Failed to process subscription uncancellation in onPayload",
      )
    })

    it("should ignore non-uncanceled events", async () => {
      const payload = {
        type: "subscription.updated",
        data: {},
      }

      await handlers.onPayload(payload)

      expect(mockUpdateUserSubscriptionFromPolar).not.toHaveBeenCalled()
      expect(logger.info).toHaveBeenCalledWith(
        { eventType: "subscription.updated" },
        "Polar webhook received",
      )
    })
  })

  describe("onOrderCreated", () => {
    const createOrderPayload = (overrides = {}) => ({
      data: {
        id: "order_test_123",
        customerId: "cust_test_123",
        productId: "prod_paid1_monthly_test",
        metadata: {
          userId: "user_test_123",
        },
        ...overrides,
      },
    })

    it("should process valid order creation", async () => {
      const payload = createOrderPayload()

      await handlers.onOrderCreated(payload)

      expect(mockUpdateUserSubscriptionFromPolar).toHaveBeenCalledWith({
        userId: "user_test_123",
        order: {
          id: "order_test_123",
          customerId: "cust_test_123",
          productId: "prod_paid1_monthly_test",
        },
        planType: "paid1",
        status: "active",
      })

      expect(mockUpdateUserPlan).toHaveBeenCalledWith("user_test_123", "paid1")

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: "order_test_123",
          planType: "paid1_monthly",
        }),
        "Order processed and subscription activated",
      )
    })

    it("should skip processing when userId is missing", async () => {
      const payload = createOrderPayload({
        metadata: {},
      })

      await handlers.onOrderCreated(payload)

      expect(mockUpdateUserSubscriptionFromPolar).not.toHaveBeenCalled()
      expect(mockUpdateUserPlan).not.toHaveBeenCalled()
      expect(logger.warn).toHaveBeenCalledWith(
        { orderId: "order_test_123" },
        "Order created without userId in metadata",
      )
    })

    it("should skip processing when product ID is unknown", async () => {
      mockGetPlanConfigByProductId.mockReturnValue(null)

      const payload = createOrderPayload({
        productId: "unknown_product",
      })

      await handlers.onOrderCreated(payload)

      expect(mockUpdateUserSubscriptionFromPolar).not.toHaveBeenCalled()
      expect(logger.error).toHaveBeenCalledWith(
        { productId: "unknown_product" },
        "Unknown product ID in order",
      )
    })

    it("should handle paid2 plan correctly", async () => {
      mockGetPlanConfigByProductId.mockReturnValue({
        planType: "paid2_yearly",
        productId: "prod_paid2_yearly_test",
      })

      const payload = createOrderPayload({
        productId: "prod_paid2_yearly_test",
      })

      await handlers.onOrderCreated(payload)

      expect(mockUpdateUserSubscriptionFromPolar).toHaveBeenCalledWith(
        expect.objectContaining({
          planType: "paid2",
        }),
      )
      expect(mockUpdateUserPlan).toHaveBeenCalledWith("user_test_123", "paid2")
    })

    it("should handle errors gracefully", async () => {
      mockUpdateUserSubscriptionFromPolar.mockRejectedValue(new Error("Database error"))

      const payload = createOrderPayload()

      await handlers.onOrderCreated(payload)

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error),
          orderId: "order_test_123",
        }),
        "Failed to process order",
      )
    })
  })

  describe("onSubscriptionUpdated", () => {
    const createSubscriptionPayload = (overrides = {}) => ({
      data: {
        id: "sub_test_123",
        customerId: "cust_test_123",
        productId: "prod_paid1_monthly_test",
        status: "active",
        currentPeriodStart: new Date("2024-01-01"),
        currentPeriodEnd: new Date("2024-02-01"),
        metadata: {
          userId: "user_test_123",
        },
        ...overrides,
      },
    })

    it("should update subscription without changing status when no plan change", async () => {
      // Default mock already returns same plan type (paid1)
      const payload = createSubscriptionPayload()

      await handlers.onSubscriptionUpdated(payload)

      expect(mockUpdateUserSubscriptionFromPolar).toHaveBeenCalledWith({
        userId: "user_test_123",
        subscription: {
          id: "sub_test_123",
          customerId: "cust_test_123",
          productId: "prod_paid1_monthly_test",
          currentPeriodStart: "2024-01-01T00:00:00.000Z",
          currentPeriodEnd: "2024-02-01T00:00:00.000Z",
        },
        planType: "paid1",
        status: undefined, // Should preserve existing status
      })

      expect(mockUpdateUserPlan).not.toHaveBeenCalled() // No plan change
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "period_update_only",
        }),
        "Subscription updated (billing period only, no plan change)",
      )
    })

    it("should handle plan upgrade from paid1 to paid2", async () => {
      // Current subscription is paid1 (default mock), new subscription is paid2
      mockGetPlanConfigByProductId.mockReturnValue({
        planType: "paid2_monthly",
        productId: "prod_paid2_monthly_test",
      })

      const payload = createSubscriptionPayload({
        productId: "prod_paid2_monthly_test",
      })

      await handlers.onSubscriptionUpdated(payload)

      expect(mockUpdateUserSubscriptionFromPolar).toHaveBeenCalledWith(
        expect.objectContaining({
          planType: "paid2",
        }),
      )

      expect(mockUpdateUserPlan).toHaveBeenCalledWith("user_test_123", "paid2")
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          oldPlan: "paid1",
          newPlan: "paid2",
          changeType: "upgrade",
        }),
        "Plan upgraded successfully",
      )
    })

    it("should handle plan downgrade from paid2 to paid1", async () => {
      // Override default mock to return paid2 as current plan
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { plan_type: "paid2" },
            }),
          }),
        }),
      })

      mockGetPlanConfigByProductId.mockReturnValue({
        planType: "paid1_monthly",
        productId: "prod_paid1_monthly_test",
      })

      const payload = createSubscriptionPayload({
        productId: "prod_paid1_monthly_test",
      })

      await handlers.onSubscriptionUpdated(payload)

      expect(mockUpdateUserSubscriptionFromPolar).toHaveBeenCalledWith(
        expect.objectContaining({
          planType: "paid1",
        }),
      )

      expect(mockUpdateUserPlan).toHaveBeenCalledWith("user_test_123", "paid1")
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          oldPlan: "paid2",
          newPlan: "paid1",
          changeType: "downgrade",
        }),
        "Plan downgraded successfully",
      )
    })

    it("should skip processing when userId is missing", async () => {
      const payload = createSubscriptionPayload({
        metadata: {},
      })

      await handlers.onSubscriptionUpdated(payload)

      expect(mockUpdateUserSubscriptionFromPolar).not.toHaveBeenCalled()
      expect(logger.warn).toHaveBeenCalledWith(
        { subscriptionId: "sub_test_123" },
        "Subscription updated without userId",
      )
    })

    it("should handle free plan correctly", async () => {
      mockGetPlanConfigByProductId.mockReturnValue({
        planType: "free",
        productId: "free_product",
      })

      const payload = createSubscriptionPayload({
        productId: "free_product",
      })

      await handlers.onSubscriptionUpdated(payload)

      expect(mockUpdateUserSubscriptionFromPolar).toHaveBeenCalledWith(
        expect.objectContaining({
          planType: "free",
        }),
      )
    })

    it("should handle errors gracefully", async () => {
      mockUpdateUserSubscriptionFromPolar.mockRejectedValue(new Error("Database error"))

      const payload = createSubscriptionPayload()

      await handlers.onSubscriptionUpdated(payload)

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error),
          subscriptionId: "sub_test_123",
        }),
        "Failed to update subscription",
      )
    })
  })

  describe("onSubscriptionCanceled", () => {
    const createCanceledPayload = (overrides = {}) => ({
      data: {
        id: "sub_test_123",
        customerId: "cust_test_123",
        productId: "prod_paid1_monthly_test",
        currentPeriodStart: new Date("2024-01-01"),
        currentPeriodEnd: new Date("2024-02-01"),
        metadata: {
          userId: "user_test_123",
        },
        ...overrides,
      },
    })

    it("should cancel subscription but keep active until period end", async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30) // 30 days in future

      const payload = createCanceledPayload({
        currentPeriodEnd: futureDate,
      })

      await handlers.onSubscriptionCanceled(payload)

      expect(mockUpdateUserSubscriptionFromPolar).toHaveBeenCalledWith({
        userId: "user_test_123",
        subscription: expect.objectContaining({
          id: "sub_test_123",
          canceledAt: expect.any(String),
        }),
        planType: "paid1",
        status: "active", // Should remain active until period end
      })

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          planType: "paid1",
        }),
        "Subscription canceled but user retains access until period end",
      )
    })

    it("should downgrade to free plan if subscription is already expired", async () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1) // 1 day in past

      const payload = createCanceledPayload({
        currentPeriodEnd: pastDate,
      })

      await handlers.onSubscriptionCanceled(payload)

      expect(mockUpdateUserPlan).toHaveBeenCalledWith("user_test_123", "free")
      expect(mockUpdateUserSubscriptionFromPolar).toHaveBeenCalledWith(
        expect.objectContaining({
          planType: "free",
          status: "canceled",
        }),
      )

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionId: "sub_test_123",
        }),
        "Expired subscription canceled, user downgraded to free plan",
      )
    })

    it("should skip processing when userId is missing", async () => {
      const payload = createCanceledPayload({
        metadata: {},
      })

      await handlers.onSubscriptionCanceled(payload)

      expect(mockUpdateUserSubscriptionFromPolar).not.toHaveBeenCalled()
      expect(mockUpdateUserPlan).not.toHaveBeenCalled()
      expect(logger.warn).toHaveBeenCalledWith(
        { subscriptionId: "sub_test_123" },
        "Subscription canceled without userId",
      )
    })

    it("should handle paid2 plan correctly", async () => {
      mockGetPlanConfigByProductId.mockReturnValue({
        planType: "paid2_monthly",
        productId: "prod_paid2_monthly_test",
      })

      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)

      const payload = createCanceledPayload({
        productId: "prod_paid2_monthly_test",
        currentPeriodEnd: futureDate,
      })

      await handlers.onSubscriptionCanceled(payload)

      expect(mockUpdateUserSubscriptionFromPolar).toHaveBeenCalledWith(
        expect.objectContaining({
          planType: "paid2",
        }),
      )
    })

    it("should handle errors gracefully", async () => {
      mockUpdateUserSubscriptionFromPolar.mockRejectedValue(new Error("Database error"))

      const payload = createCanceledPayload()

      await handlers.onSubscriptionCanceled(payload)

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error),
          subscriptionId: "sub_test_123",
        }),
        "Failed to cancel subscription",
      )
    })
  })

  describe("onCheckoutCreated", () => {
    it("should log checkout creation", async () => {
      const payload = {
        data: {
          id: "checkout_test_123",
        },
      }

      await handlers.onCheckoutCreated(payload)

      expect(logger.info).toHaveBeenCalledWith(
        { checkoutId: "checkout_test_123" },
        "Polar checkout created",
      )
    })
  })

  describe("onCheckoutUpdated", () => {
    it("should log checkout updates", async () => {
      const payload = {
        data: {
          id: "checkout_test_123",
          status: "open",
        },
      }

      await handlers.onCheckoutUpdated(payload)

      expect(logger.info).toHaveBeenCalledWith(
        {
          checkoutId: "checkout_test_123",
          status: "open",
        },
        "Polar checkout updated",
      )
    })

    it("should log successful checkout completion", async () => {
      const payload = {
        data: {
          id: "checkout_test_123",
          status: "succeeded",
        },
      }

      await handlers.onCheckoutUpdated(payload)

      expect(logger.info).toHaveBeenCalledWith(
        { checkoutId: "checkout_test_123" },
        "Checkout completed successfully",
      )
    })
  })

  describe("Plan Type Mapping", () => {
    it("should correctly map paid1 plan types", async () => {
      const paid1Plans = ["paid1_monthly", "paid1_yearly"]

      for (const planType of paid1Plans) {
        mockGetPlanConfigByProductId.mockReturnValue({
          planType,
          productId: `prod_${planType}_test`,
        })

        const payload = {
          data: {
            id: "order_test",
            customerId: "cust_test",
            productId: `prod_${planType}_test`,
            metadata: { userId: "user_test" },
          },
        }

        await handlers.onOrderCreated(payload)

        expect(mockUpdateUserSubscriptionFromPolar).toHaveBeenCalledWith(
          expect.objectContaining({
            planType: "paid1",
          }),
        )
        expect(mockUpdateUserPlan).toHaveBeenCalledWith("user_test", "paid1")

        vi.clearAllMocks()
      }
    })

    it("should correctly map paid2 plan types", async () => {
      const paid2Plans = ["paid2_monthly", "paid2_yearly"]

      for (const planType of paid2Plans) {
        mockGetPlanConfigByProductId.mockReturnValue({
          planType,
          productId: `prod_${planType}_test`,
        })

        const payload = {
          data: {
            id: "order_test",
            customerId: "cust_test",
            productId: `prod_${planType}_test`,
            metadata: { userId: "user_test" },
          },
        }

        await handlers.onOrderCreated(payload)

        expect(mockUpdateUserSubscriptionFromPolar).toHaveBeenCalledWith(
          expect.objectContaining({
            planType: "paid2",
          }),
        )
        expect(mockUpdateUserPlan).toHaveBeenCalledWith("user_test", "paid2")

        vi.clearAllMocks()
      }
    })
  })
})
