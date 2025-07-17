import { Webhooks } from "@polar-sh/nextjs"
import {
  updateUserSubscriptionFromPolar,
  getPlanConfigByProductId,
} from "@/lib/integrations/polar"
import { updateUserPlan } from "@/lib/subscriptions/management"
import { createServerSupabaseClient } from "@/lib/integrations/supabase"
import { logger } from "@/lib/utils/logger"

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,

  // Handle all webhook payloads - used for events without specific handlers
  onPayload: async (payload) => {
    logger.info({ eventType: payload.type }, "Polar webhook received")

    // Handle subscription.uncanceled specifically since the dedicated handler isn't firing
    if (payload.type === "subscription.uncanceled") {
      const subscription = payload.data
      const userId = subscription.metadata?.userId

      logger.info(
        {
          userId,
          subscriptionId: subscription.id,
          action: "uncancellation_event_received",
          eventType: payload.type,
          canceledAt: subscription.canceledAt,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          status: subscription.status,
        },
        "Processing subscription.uncanceled event in onPayload handler",
      )

      if (!userId) {
        logger.warn({ subscriptionId: subscription.id }, "Subscription uncanceled without userId")
        return
      }

      // Validate this is actually an uncancellation by checking payload fields
      const isValidUncancellation =
        subscription.canceledAt === null && subscription.cancelAtPeriodEnd === false

      if (!isValidUncancellation) {
        logger.warn(
          {
            userId,
            subscriptionId: subscription.id,
            canceledAt: subscription.canceledAt,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          },
          "Received subscription.uncanceled event but payload doesn't indicate valid uncancellation",
        )
        return
      }

      try {
        // Get plan information from product ID
        const planConfig = getPlanConfigByProductId(subscription.productId)
        const currentPlanType = planConfig?.planType.startsWith("paid1") ? "paid1" : "paid2"

        // Clear cancellation and restore active subscription
        logger.info(
          {
            userId,
            subscriptionId: subscription.id,
            action: "clearing_cancellation",
            currentPlanType,
            payloadCanceledAt: subscription.canceledAt,
            payloadCancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          },
          "DEBUG: About to clear cancellation timestamp via onPayload uncanceled handler",
        )

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
            canceledAt: null, // Clear cancellation timestamp
          },
          planType: currentPlanType,
          status: "active",
        })

        logger.info(
          {
            userId,
            subscriptionId: subscription.id,
            action: "uncancellation_completed",
          },
          "Subscription uncancellation processed successfully via onPayload",
        )
      } catch (error) {
        logger.error(
          { error, userId, subscriptionId: subscription.id },
          "Failed to process subscription uncancellation in onPayload",
        )
      }
    }
  },

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
      const legacyPlanType = planConfig.planType.startsWith("paid1") ? "paid1" : "paid2"

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
        planType === "free" ? "free" : planConfig?.planType.startsWith("paid1") ? "paid1" : "paid2"

      // Get current subscription to detect plan changes
      const supabase = createServerSupabaseClient()
      const { data: currentSubscription } = await supabase
        .from("user_subscriptions")
        .select("plan_type")
        .eq("user_id", userId)
        .single()

      const currentPlanType = currentSubscription?.plan_type
      const isUpgrade = currentPlanType === "paid1" && legacyPlanType === "paid2"
      const isDowngrade = currentPlanType === "paid2" && legacyPlanType === "paid1"
      const isPlanChange = currentPlanType && currentPlanType !== legacyPlanType

      // For subscription updates, only update essential fields, NOT status or cancellation state
      // Status changes are handled by specific cancel/uncancel events
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
          // DO NOT include canceledAt field at all - this preserves existing value
        },
        planType: legacyPlanType,
        // Don't update status here - let specific cancel/uncancel events handle status changes
        status: undefined, // This will preserve existing status in the database
      })

      // CRITICAL: Update user plan in usage tracking for plan changes
      if (isPlanChange) {
        await updateUserPlan(String(userId), legacyPlanType)

        logger.info(
          {
            userId,
            subscriptionId: subscription.id,
            oldPlan: currentPlanType,
            newPlan: legacyPlanType,
            changeType: isUpgrade ? "upgrade" : isDowngrade ? "downgrade" : "change",
            productId: subscription.productId,
          },
          `Plan ${isUpgrade ? "upgraded" : isDowngrade ? "downgraded" : "changed"} successfully`,
        )
      } else {
        logger.info(
          {
            userId,
            subscriptionId: subscription.id,
            planType: legacyPlanType,
            action: "period_update_only",
          },
          "Subscription updated (billing period only, no plan change)",
        )
      }
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
      // Get plan information from product ID to maintain current plan until period ends
      const planConfig = getPlanConfigByProductId(subscription.productId)
      const currentPlanType = planConfig?.planType.startsWith("paid1") ? "paid1" : "paid2"

      // Check if subscription has already expired
      const periodEnd = subscription.currentPeriodEnd
      const isExpired = periodEnd && new Date(periodEnd) <= new Date()

      if (isExpired) {
        // If already expired, downgrade to free immediately
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
          planType: "free",
          status: "canceled",
        })

        logger.info(
          { userId, subscriptionId: subscription.id },
          "Expired subscription canceled, user downgraded to free plan",
        )
      } else {
        // If not expired, keep status as "active" but set canceled_at timestamp
        // User retains access until period end (cancelled but active)
        const canceledAtTimestamp = new Date().toISOString()

        logger.info(
          {
            userId,
            subscriptionId: subscription.id,
            action: "setting_cancellation",
            canceledAt: canceledAtTimestamp,
            currentPlanType,
            periodEnd: subscription.currentPeriodEnd,
          },
          "DEBUG: About to set cancellation timestamp",
        )

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
            canceledAt: canceledAtTimestamp, // Set cancellation timestamp
          },
          planType: currentPlanType, // Keep current plan until period ends
          status: "active", // Keep status as active - cancellation is indicated by canceled_at timestamp
        })

        logger.info(
          {
            userId,
            subscriptionId: subscription.id,
            planType: currentPlanType,
            periodEnd: subscription.currentPeriodEnd,
          },
          "Subscription canceled but user retains access until period end",
        )
      }
    } catch (error) {
      logger.error(
        { error, userId, subscriptionId: subscription.id },
        "Failed to cancel subscription",
      )
      // Don't throw - let webhook complete successfully
    }
  },
})
