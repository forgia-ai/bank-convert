import { Webhooks } from "@polar-sh/nextjs"
import {
  updateUserSubscriptionFromPolar,
  getPlanConfigByProductId,
} from "@/lib/integrations/polar"
import { updateUserPlan } from "@/lib/subscriptions/management"
import { logger } from "@/lib/utils/logger"

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,

  // Handle checkout completion (payment completed)
  onCheckoutCreated: async (payload) => {
    const checkout = payload.data
    logger.info({ checkoutId: checkout.id }, "Polar checkout created")
  },

  // Handle checkout updates (CRITICAL for completing checkout flow)
  onCheckoutUpdated: async (payload) => {
    const checkout = payload.data
    logger.info(
      {
        checkoutId: checkout.id,
        status: checkout.status,
      },
      "Polar checkout updated",
    )

    // This event allows Polar to mark the checkout as succeeded
    if (checkout.status === "succeeded") {
      logger.info({ checkoutId: checkout.id }, "Checkout completed successfully")
    }
  },

  // Handle successful order creation (payment completed)
  onOrderCreated: async (payload) => {
    const order = payload.data
    const userId = order.metadata?.userId

    if (!userId) {
      logger.warn({ orderId: order.id }, "Order created without userId in metadata")
      return
    }

    try {
      // Get plan information from product ID
      const planConfig = getPlanConfigByProductId(order.productId)
      if (!planConfig) {
        logger.error({ productId: order.productId }, "Unknown product ID in order")
        return
      }

      // Map Polar plan type to legacy plan type for usage tracking
      const legacyPlanType = planConfig.planType.startsWith("lite") ? "paid1" : "paid2"

      // Update user subscription in database
      await updateUserSubscriptionFromPolar({
        userId: String(userId),
        order: {
          id: String(order.id),
          customerId: String(order.customerId),
          productId: String(order.productId),
        },
        planType: legacyPlanType, // Use legacy plan type for UI compatibility
        status: "active",
      })

      // Update user plan in usage tracking
      await updateUserPlan(String(userId), legacyPlanType)

      logger.info(
        { userId, orderId: order.id, planType: planConfig.planType },
        "Order processed and subscription activated",
      )
    } catch (error) {
      logger.error({ error, userId, orderId: order.id }, "Failed to process order")
      // Don't throw - let webhook complete successfully
    }
  },

  // Handle subscription updates
  onSubscriptionUpdated: async (payload) => {
    const subscription = payload.data
    const userId = subscription.metadata?.userId

    if (!userId) {
      logger.warn({ subscriptionId: subscription.id }, "Subscription updated without userId")
      return
    }

    try {
      const planConfig = getPlanConfigByProductId(subscription.productId)
      const planType = planConfig?.planType || "free"
      const legacyPlanType =
        planType === "free" ? "free" : planConfig?.planType.startsWith("lite") ? "paid1" : "paid2"

      await updateUserSubscriptionFromPolar({
        userId: String(userId),
        subscription: {
          id: String(subscription.id),
          customerId: String(subscription.customerId),
          productId: String(subscription.productId),
          currentPeriodStart: subscription.currentPeriodStart
            ? subscription.currentPeriodStart.toISOString()
            : undefined,
          currentPeriodEnd: subscription.currentPeriodEnd
            ? subscription.currentPeriodEnd.toISOString()
            : undefined,
        },
        planType: legacyPlanType, // Use legacy plan type for UI compatibility
        status: subscription.status,
      })

      // Update user plan based on subscription status
      if (subscription.status === "active") {
        await updateUserPlan(String(userId), legacyPlanType)
      } else if (subscription.status === "canceled") {
        await updateUserPlan(String(userId), "free")
      }

      logger.info(
        {
          userId,
          subscriptionId: subscription.id,
          status: subscription.status,
          planType: legacyPlanType,
        },
        "Subscription updated",
      )
    } catch (error) {
      logger.error(
        { error, userId, subscriptionId: subscription.id },
        "Failed to update subscription",
      )
      // Don't throw - let webhook complete successfully
    }
  },

  // Handle subscription cancellations
  onSubscriptionCanceled: async (payload) => {
    const subscription = payload.data
    const userId = subscription.metadata?.userId

    if (!userId) {
      logger.warn({ subscriptionId: subscription.id }, "Subscription canceled without userId")
      return
    }

    try {
      // Revert user to free plan
      await updateUserPlan(String(userId), "free")

      await updateUserSubscriptionFromPolar({
        userId: String(userId),
        subscription: {
          id: String(subscription.id),
          customerId: String(subscription.customerId),
          productId: String(subscription.productId),
          currentPeriodStart: subscription.currentPeriodStart
            ? subscription.currentPeriodStart.toISOString()
            : undefined,
          currentPeriodEnd: subscription.currentPeriodEnd
            ? subscription.currentPeriodEnd.toISOString()
            : undefined,
        },
        planType: "free", // Canceled subscriptions are always free
        status: "canceled",
      })

      logger.info(
        { userId, subscriptionId: subscription.id },
        "Subscription canceled, user reverted to free plan",
      )
    } catch (error) {
      logger.error(
        { error, userId, subscriptionId: subscription.id },
        "Failed to cancel subscription",
      )
      // Don't throw - let webhook complete successfully
    }
  },

  // General event handler for logging
  onPayload: async (payload) => {
    logger.info({ eventType: payload.type }, "Polar webhook received")
  },
})
