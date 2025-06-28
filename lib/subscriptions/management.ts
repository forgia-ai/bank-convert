import { createServerSupabaseClient } from "@/lib/integrations/supabase"
import { logger } from "@/lib/utils/logger"
import {
  calculateBillingPeriod,
  getOrCreateUsageRecord,
  type PlanType,
  PLAN_LIMITS,
} from "@/lib/usage/tracking"

// Subscription status types matching Stripe webhook events
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "past_due"
  | "trialing"
  | "unpaid"

// Subscription record interface
export interface SubscriptionRecord {
  id: string
  user_id: string
  stripe_customer_id: string
  stripe_subscription_id: string | null
  plan_type: PlanType
  status: SubscriptionStatus
  current_period_start: string | null
  current_period_end: string | null
  canceled_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Update user's plan type in database
 * Updates both subscription and usage tables for consistency
 */
export async function updateUserPlan(
  userId: string,
  newPlanType: PlanType,
  subscriptionStartDate?: Date,
): Promise<void> {
  if (!userId) {
    throw new Error("User ID is required")
  }

  if (!Object.keys(PLAN_LIMITS).includes(newPlanType)) {
    throw new Error(`Invalid plan type: ${newPlanType}`)
  }

  logger.info({ userId, newPlanType }, "Updating user plan")

  const supabase = createServerSupabaseClient()

  // Calculate current billing period to identify which records to update
  const { periodStart, periodEnd } = calculateBillingPeriod(subscriptionStartDate || new Date())

  // First, try to update existing record for the current billing period
  const { data: updateData, error: updateError } = await supabase
    .from("user_usage")
    .update({ plan_type: newPlanType })
    .eq("user_id", userId)
    .eq("billing_period_start", periodStart)
    .select()

  if (updateError) {
    logger.error({ error: updateError, userId }, "Error updating existing user plan record")
    throw new Error("Failed to update user plan")
  }

  // If no rows were updated (updateData is empty), insert a new record
  if (!updateData || updateData.length === 0) {
    logger.info(
      { userId, periodStart },
      "No existing record found, creating new user_usage record",
    )

    const { error: insertError } = await supabase.from("user_usage").insert({
      user_id: userId,
      billing_period_start: periodStart,
      billing_period_end: periodEnd,
      plan_type: newPlanType,
      pages_consumed: 0,
    })

    if (insertError) {
      logger.error({ error: insertError, userId }, "Error inserting new user plan record")
      throw new Error("Failed to create user plan record")
    }

    logger.info({ userId, newPlanType, periodStart }, "Successfully created new user plan record")
  } else {
    logger.info(
      { userId, newPlanType, periodStart },
      "Successfully updated existing user plan record",
    )
  }

  logger.info({ userId, newPlanType }, "Successfully updated user plan")
}

/**
 * Create a subscription record for testing/manual setup
 * This function allows creating subscription records without Stripe integration
 */
export async function createTestSubscription(
  userId: string,
  planType: PlanType,
  stripeCustomerId?: string,
): Promise<SubscriptionRecord> {
  logger.info({ userId, planType }, "Creating test subscription")

  const subscriptionData = {
    user_id: userId,
    stripe_customer_id: stripeCustomerId || `test_customer_${userId}`,
    stripe_subscription_id: undefined, // No Stripe subscription for test
    plan_type: planType,
    status: "active" as SubscriptionStatus,
    current_period_start: new Date(),
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  }

  return await upsertSubscription(subscriptionData)
}

/**
 * Get user's active subscription record from user_subscriptions table
 * Returns null if no active subscription found
 * Uses order + limit to handle multiple active records gracefully
 */
export async function getActiveSubscription(userId: string): Promise<SubscriptionRecord | null> {
  const supabase = createServerSupabaseClient()

  const { data: subscriptions, error } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (error) {
    logger.error({ error, userId }, "Error querying active subscription")
    throw new Error("Failed to retrieve active subscription")
  }

  if (!subscriptions || subscriptions.length === 0) {
    return null
  }

  // Check for multiple active subscriptions (data consistency issue)
  if (subscriptions.length > 1) {
    logger.warn(
      {
        userId,
        count: subscriptions.length,
        subscriptionIds: subscriptions.map((s) => s.id),
      },
      "Multiple active subscriptions found - using most recent",
    )

    // TODO: Consider cleaning up old active subscriptions here
    // For now, we'll use the most recent one
  }

  return subscriptions[0] as SubscriptionRecord
}

/**
 * Create or update subscription record in user_subscriptions table
 * This is the authoritative source for subscription data
 */
export async function upsertSubscription(
  subscriptionData: {
    user_id: string
    stripe_customer_id: string
    stripe_subscription_id?: string
    plan_type: PlanType
    status: SubscriptionStatus
    current_period_start?: Date
    current_period_end?: Date
    canceled_at?: Date
  },
  options?: {
    deactivateOldSubscriptions?: boolean
  },
): Promise<SubscriptionRecord> {
  const supabase = createServerSupabaseClient()

  logger.info(
    {
      userId: subscriptionData.user_id,
      planType: subscriptionData.plan_type,
      status: subscriptionData.status,
    },
    "Upserting subscription record",
  )

  const subscriptionRecord = {
    user_id: subscriptionData.user_id,
    stripe_customer_id: subscriptionData.stripe_customer_id,
    stripe_subscription_id: subscriptionData.stripe_subscription_id || null,
    plan_type: subscriptionData.plan_type,
    status: subscriptionData.status,
    current_period_start: subscriptionData.current_period_start?.toISOString() || null,
    current_period_end: subscriptionData.current_period_end?.toISOString() || null,
    canceled_at: subscriptionData.canceled_at?.toISOString() || null,
  }

  // Use upsert with ON CONFLICT to handle race conditions
  const { data, error } = await supabase
    .from("user_subscriptions")
    .upsert(subscriptionRecord, {
      onConflict: "stripe_customer_id",
    })
    .select()
    .single()

  const result = { data, error }

  if (result.error) {
    logger.error(
      { error: result.error, userId: subscriptionData.user_id },
      "Error upserting subscription",
    )
    throw new Error("Failed to upsert subscription")
  }

  const subscription = result.data as SubscriptionRecord

  // If this is a new active subscription and cleanup is requested, deactivate old ones
  if (options?.deactivateOldSubscriptions && subscriptionData.status === "active") {
    await deactivateOldSubscriptions(subscriptionData.user_id, subscription.id)
  }

  // Sync user_usage table with subscription data
  await syncUsageWithSubscription(subscription)

  logger.info(
    {
      userId: subscriptionData.user_id,
      subscriptionId: subscription.id,
      planType: subscription.plan_type,
      status: subscription.status,
    },
    "Successfully upserted subscription record",
  )

  return subscription
}

/**
 * Sync user_usage table with subscription data
 * Ensures usage tracking reflects current subscription status
 */
async function syncUsageWithSubscription(subscription: SubscriptionRecord): Promise<void> {
  const subscriptionStart = subscription.current_period_start
    ? new Date(subscription.current_period_start)
    : new Date()

  // Update user_usage to reflect current subscription
  await updateUserPlan(subscription.user_id, subscription.plan_type, subscriptionStart)
}

/**
 * Get user's current plan from database (SINGLE SOURCE OF TRUTH)
 * Simple logic: active subscription → plan type, no active subscription → free
 */
export async function getUserPlan(
  userId: string,
  subscriptionStartDate?: Date,
): Promise<PlanType> {
  logger.info({ userId }, "Getting user plan from database")

  // Check for active subscription (AUTHORITATIVE SOURCE)
  try {
    const activeSubscription = await getActiveSubscription(userId)

    if (activeSubscription) {
      logger.info(
        {
          userId,
          planType: activeSubscription.plan_type,
          subscriptionId: activeSubscription.id,
          status: activeSubscription.status,
        },
        "Found active subscription - using as authoritative plan",
      )

      // Ensure user_usage is synced with subscription
      await syncUsageWithSubscription(activeSubscription)

      return activeSubscription.plan_type as PlanType
    }
  } catch (error) {
    logger.error({ error, userId }, "Error checking active subscription")
    // Continue to fallback
  }

  // No active subscription - user is on free plan
  logger.info({ userId }, "No active subscription found - defaulting to free plan")

  // Ensure user has a usage record for the current period
  const usageRecord = await getOrCreateUsageRecord(userId, "free", subscriptionStartDate)

  logger.info({ userId, planType: "free" }, "Retrieved user plan from database")
  return usageRecord.plan_type as PlanType
}

/**
 * Deactivate old active subscriptions for a user
 * Called when creating a new active subscription (plan changes)
 */
async function deactivateOldSubscriptions(
  userId: string,
  excludeSubscriptionId?: string,
): Promise<void> {
  const supabase = createServerSupabaseClient()

  logger.info({ userId, excludeSubscriptionId }, "Deactivating old active subscriptions")

  let query = supabase
    .from("user_subscriptions")
    .update({ status: "canceled", canceled_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("status", "active")

  // If we're updating an existing subscription, exclude it from deactivation
  if (excludeSubscriptionId) {
    query = query.neq("id", excludeSubscriptionId)
  }

  const { data, error } = await query.select()

  if (error) {
    logger.error({ error, userId }, "Error deactivating old subscriptions")
    // Don't throw - this is cleanup, shouldn't block main operation
    return
  }

  if (data && data.length > 0) {
    logger.info(
      { userId, deactivatedCount: data.length },
      "Successfully deactivated old active subscriptions",
    )
  }
}
