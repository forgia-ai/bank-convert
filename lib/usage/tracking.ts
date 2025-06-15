import { createServerSupabaseClient } from "@/lib/integrations/supabase"
import { logger } from "@/lib/utils/logger"

// Plan limits (pages per month)
export const PLAN_LIMITS = {
  free: 50,
  paid1: 500,
  paid2: 1000,
} as const

export type PlanType = keyof typeof PLAN_LIMITS

// Usage data interface
export interface UsageData {
  currentPeriodUsage: number
  planLimit: number
  planType: PlanType
  billingPeriodStart: string
  billingPeriodEnd: string
  remainingPages: number
  usagePercentage: number
}

// Calculate billing period based on subscription start date
export function calculateBillingPeriod(subscriptionStartDate: Date): {
  periodStart: string
  periodEnd: string
} {
  const today = new Date()
  const startDay = subscriptionStartDate.getUTCDate()

  let targetYear: number
  let targetMonth: number

  const currentYear = today.getUTCFullYear()
  const currentMonth = today.getUTCMonth()

  // Try current month first - calculate what the clamped billing date would be
  const maxDaysInCurrentMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0)).getUTCDate()
  const clampedDayForCurrentMonth = Math.min(startDay, maxDaysInCurrentMonth)
  const currentMonthBillingDate = new Date(
    Date.UTC(currentYear, currentMonth, clampedDayForCurrentMonth),
  )

  if (today >= currentMonthBillingDate) {
    // We're on or after the current month's billing date
    targetYear = currentYear
    targetMonth = currentMonth
  } else {
    // We're before the current month's billing date, so use previous month
    targetYear = currentYear
    targetMonth = currentMonth - 1

    // Handle year rollover (December -> January)
    if (targetMonth < 0) {
      targetMonth = 11
      targetYear -= 1
    }
  }

  // Get the maximum number of days in the target month (using UTC)
  const maxDaysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate()

  // Clamp the start day to the maximum available days in the target month
  const clampedStartDay = Math.min(startDay, maxDaysInTargetMonth)

  // Create the period start date with the clamped day (using UTC)
  const periodStart = new Date(Date.UTC(targetYear, targetMonth, clampedStartDay))

  // Calculate end date (day before next period starts)
  // First, calculate what the next period start would be
  let nextPeriodYear = targetYear
  let nextPeriodMonth = targetMonth + 1

  // Handle year rollover
  if (nextPeriodMonth > 11) {
    nextPeriodMonth = 0
    nextPeriodYear += 1
  }

  // Get max days in next month and clamp the start day (using UTC)
  const maxDaysInNextMonth = new Date(
    Date.UTC(nextPeriodYear, nextPeriodMonth + 1, 0),
  ).getUTCDate()
  const clampedNextStartDay = Math.min(startDay, maxDaysInNextMonth)

  // Create next period start date, then subtract one day for period end (using UTC)
  const nextPeriodStart = new Date(Date.UTC(nextPeriodYear, nextPeriodMonth, clampedNextStartDay))
  const periodEnd = new Date(nextPeriodStart)
  periodEnd.setUTCDate(periodEnd.getUTCDate() - 1)

  return {
    periodStart: periodStart.toISOString().split("T")[0], // YYYY-MM-DD format
    periodEnd: periodEnd.toISOString().split("T")[0],
  }
}

// Get or create usage record for current billing period
export async function getOrCreateUsageRecord(
  userId: string,
  planType: PlanType = "free",
  subscriptionStartDate?: Date,
): Promise<{
  id: string
  pages_consumed: number
  billing_period_start: string
  billing_period_end: string
  plan_type: string
}> {
  const supabase = createServerSupabaseClient()

  // Calculate current billing period
  const { periodStart, periodEnd } = calculateBillingPeriod(subscriptionStartDate || new Date())

  logger.info({ userId, periodStart, periodEnd }, "Calculating billing period")

  // Try to get existing record
  const { data: existingRecord, error: selectError } = await supabase
    .from("user_usage")
    .select("*")
    .eq("user_id", userId)
    .eq("billing_period_start", periodStart)
    .maybeSingle()

  if (selectError) {
    logger.error({ error: selectError, userId }, "Error fetching usage record")
    throw new Error("Failed to fetch usage record")
  }

  if (existingRecord) {
    logger.info({ userId, usage: existingRecord }, "Found existing usage record")
    return existingRecord
  }

  // Create new record
  const { data: newRecord, error: insertError } = await supabase
    .from("user_usage")
    .insert({
      user_id: userId,
      billing_period_start: periodStart,
      billing_period_end: periodEnd,
      pages_consumed: 0,
      plan_type: planType,
    })
    .select()
    .maybeSingle()

  if (insertError) {
    logger.error({ error: insertError, userId }, "Error creating usage record")
    throw new Error("Failed to create usage record")
  }

  if (!newRecord) {
    logger.error({ userId }, "No record returned after insert")
    throw new Error("Failed to create usage record: no data returned")
  }

  logger.info({ userId, usage: newRecord }, "Created new usage record")
  return newRecord
}

// Check if user can process additional pages
export async function checkUsageLimit(
  userId: string,
  additionalPages: number,
  planType: PlanType = "free",
  subscriptionStartDate?: Date,
): Promise<{
  canProcess: boolean
  currentUsage: number
  limit: number
  wouldExceed: boolean
}> {
  if (additionalPages <= 0 || !Number.isInteger(additionalPages)) {
    throw new Error("Additional pages must be a positive integer")
  }

  logger.info({ userId, additionalPages, planType }, "Checking usage limit")

  const usageRecord = await getOrCreateUsageRecord(userId, planType, subscriptionStartDate)

  const limit = PLAN_LIMITS[planType]
  const currentUsage = usageRecord.pages_consumed
  const wouldExceed = currentUsage + additionalPages > limit

  const result = {
    canProcess: !wouldExceed,
    currentUsage,
    limit,
    wouldExceed,
  }

  logger.info({ userId, result }, "Usage limit check result")
  return result
}

// Track page usage (increment counter)
export async function trackPageUsage(
  userId: string,
  pagesProcessed: number,
  fileName?: string,
  fileSize?: number,
  planType: PlanType = "free",
  subscriptionStartDate?: Date,
): Promise<void> {
  if (pagesProcessed <= 0 || !Number.isInteger(pagesProcessed)) {
    throw new Error("Pages processed must be a positive integer")
  }

  logger.info({ userId, pagesProcessed, fileName }, "Tracking page usage")

  const supabase = createServerSupabaseClient()

  // Get current usage record
  const usageRecord = await getOrCreateUsageRecord(userId, planType, subscriptionStartDate)

  // Use RPC for atomic increment
  const { error: updateError } = await supabase.rpc("increment_user_usage", {
    usage_id: usageRecord.id,
    increment_by: pagesProcessed,
  })

  if (updateError) {
    logger.error({ error: updateError, userId }, "Error updating usage count")
    throw new Error("Failed to update usage count")
  }

  // Log the usage for audit trail
  const { error: logError } = await supabase.from("usage_logs").insert({
    user_id: userId,
    pages_processed: pagesProcessed,
    file_name: fileName,
    file_size: fileSize,
  })

  if (logError) {
    logger.error({ error: logError, userId }, "Error logging usage")
    // Don't throw here - logging is not critical
  }

  const newUsageCount = usageRecord.pages_consumed + pagesProcessed
  logger.info({ userId, newUsageCount, pagesProcessed }, "Successfully tracked page usage")
}

// Get current usage data for display
export async function getUserUsage(
  userId: string,
  planType: PlanType = "free",
  subscriptionStartDate?: Date,
): Promise<UsageData> {
  logger.info({ userId, planType }, "Getting user usage data")

  const usageRecord = await getOrCreateUsageRecord(userId, planType, subscriptionStartDate)

  const planLimit = PLAN_LIMITS[planType]
  const currentUsage = usageRecord.pages_consumed
  const remainingPages = Math.max(0, planLimit - currentUsage)
  const usagePercentage = Math.min(100, (currentUsage / planLimit) * 100)

  const usageData: UsageData = {
    currentPeriodUsage: currentUsage,
    planLimit,
    planType,
    billingPeriodStart: usageRecord.billing_period_start,
    billingPeriodEnd: usageRecord.billing_period_end,
    remainingPages,
    usagePercentage,
  }

  logger.info({ userId, usageData }, "Retrieved user usage data")
  return usageData
}

// Get usage history for a user (for analytics/debugging)
export async function getUserUsageHistory(
  userId: string,
  limit: number = 10,
): Promise<
  Array<{
    id: string
    pages_processed: number
    file_name: string | null
    file_size: number | null
    created_at: string
  }>
> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from("usage_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    logger.error({ error, userId }, "Error fetching usage history")
    throw new Error("Failed to fetch usage history")
  }

  return data || []
}
