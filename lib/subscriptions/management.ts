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
 */
export async function getActiveSubscription(userId: string): Promise<SubscriptionRecord | null> {
  const supabase = createServerSupabaseClient()

  const { data: subscription, error } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle()

  if (error) {
    logger.error({ error, userId }, "Error querying active subscription")
    throw new Error("Failed to retrieve active subscription")
  }

  return subscription as SubscriptionRecord | null
}

/**
 * Create or update subscription record in user_subscriptions table
 * This is the authoritative source for subscription data
 */
export async function upsertSubscription(subscriptionData: {
  user_id: string
  stripe_customer_id: string
  stripe_subscription_id?: string
  plan_type: PlanType
  status: SubscriptionStatus
  current_period_start?: Date
  current_period_end?: Date
  canceled_at?: Date
}): Promise<SubscriptionRecord> {
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

  // Try to update existing subscription first
  const { data: existingSubscription, error: selectError } = await supabase
    .from("user_subscriptions")
    .select("id")
    .eq("user_id", subscriptionData.user_id)
    .eq("stripe_customer_id", subscriptionData.stripe_customer_id)
    .maybeSingle()

  if (selectError) {
    logger.error(
      { error: selectError, userId: subscriptionData.user_id },
      "Error checking existing subscription",
    )
    throw new Error("Failed to check existing subscription")
  }

  let result
  if (existingSubscription) {
    // Update existing subscription
    const { data, error } = await supabase
      .from("user_subscriptions")
      .update(subscriptionRecord)
      .eq("id", existingSubscription.id)
      .select()
      .single()

    result = { data, error }
  } else {
    // Insert new subscription
    const { data, error } = await supabase
      .from("user_subscriptions")
      .insert(subscriptionRecord)
      .select()
      .single()

    result = { data, error }
  }

  if (result.error) {
    logger.error(
      { error: result.error, userId: subscriptionData.user_id },
      "Error upserting subscription",
    )
    throw new Error("Failed to upsert subscription")
  }

  const subscription = result.data as SubscriptionRecord

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
