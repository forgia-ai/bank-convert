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
 * Updates the plan_type for current and future billing periods
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
  const { periodStart } = calculateBillingPeriod(subscriptionStartDate || new Date())

  // Update the current billing period record if it exists
  const { error: updateError } = await supabase
    .from("user_usage")
    .update({ plan_type: newPlanType })
    .eq("user_id", userId)
    .eq("billing_period_start", periodStart)

  if (updateError) {
    logger.error({ error: updateError, userId }, "Error updating current period plan")
    throw new Error("Failed to update user plan")
  }

  // Also ensure any future getOrCreateUsageRecord calls will use the new plan
  // This is handled by passing the correct planType to those functions

  logger.info({ userId, newPlanType, periodStart }, "Successfully updated user plan")
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

  // Get the current usage record which contains the plan type
  const usageRecord = await getOrCreateUsageRecord(userId, "free", subscriptionStartDate)

  const planType = usageRecord.plan_type as PlanType

  logger.info({ userId, planType }, "Retrieved user plan from database")
  return planType
}
