import { createServerSupabaseClient } from "@/lib/integrations/supabase"
import { logger } from "@/lib/utils/logger"
import {
  calculateBillingPeriod,
  getOrCreateUsageRecord,
  type PlanType,
  PLAN_LIMITS,
} from "@/lib/usage/tracking"

/**
 * Update user's plan type in database
 * Uses upsert to update existing records or create new ones for current billing period
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

  // Use upsert to ensure the plan change is persisted even if no record exists
  const { error: upsertError } = await supabase.from("user_usage").upsert(
    {
      user_id: userId,
      billing_period_start: periodStart,
      billing_period_end: periodEnd,
      plan_type: newPlanType,
      pages_consumed: 0, // Default for new records, ignored for existing ones
    },
    {
      onConflict: "user_id,billing_period_start",
      ignoreDuplicates: false, // Update existing records
    },
  )

  if (upsertError) {
    logger.error({ error: upsertError, userId }, "Error upserting user plan")
    throw new Error("Failed to update user plan")
  }

  // Also ensure any future getOrCreateUsageRecord calls will use the new plan
  // This is handled by passing the correct planType to those functions

  logger.info(
    { userId, newPlanType, periodStart },
    "Successfully updated/created user plan record",
  )
}

/**
 * Get user's current plan from database
 * Returns the plan type from the most recent usage record
 */
export async function getUserPlan(
  userId: string,
  subscriptionStartDate?: Date,
): Promise<PlanType> {
  logger.info({ userId }, "Getting user plan from database")

  const supabase = createServerSupabaseClient()

  // First, try to determine the user's actual plan type from existing records
  // Query the most recent usage record to get the current plan
  const { data: latestRecord, error: queryError } = await supabase
    .from("user_usage")
    .select("plan_type")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (queryError) {
    logger.error({ error: queryError, userId }, "Error querying existing usage records")
    throw new Error("Failed to retrieve user plan")
  }

  // Determine the correct plan type to use
  const currentPlanType = (latestRecord?.plan_type as PlanType) || "free"

  logger.info({ userId, currentPlanType }, "Determined current plan type for user")

  // Get the current usage record, using the correct plan type
  const usageRecord = await getOrCreateUsageRecord(userId, currentPlanType, subscriptionStartDate)

  const planType = usageRecord.plan_type as PlanType

  logger.info({ userId, planType }, "Retrieved user plan from database")
  return planType
}
