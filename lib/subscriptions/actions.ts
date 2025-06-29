"use server"

import { auth } from "@clerk/nextjs/server"
import { updateUserPlan, getUserPlan } from "@/lib/subscriptions/management"
import { type PlanType, calculateBillingPeriod, PLAN_LIMITS } from "@/lib/usage/tracking"
import { logger } from "@/lib/utils/logger"
import { createServerSupabaseClient } from "@/lib/integrations/supabase"

/**
 * Server action to update user's subscription plan
 * Called when user clicks pricing page buttons (mock implementation)
 */
export async function updateUserSubscriptionPlan(newPlanType: PlanType): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        success: false,
        error: "User not authenticated",
      }
    }

    // Validate plan type
    if (!["free", "paid1", "paid2"].includes(newPlanType)) {
      return {
        success: false,
        error: "Invalid plan type",
      }
    }

    await updateUserPlan(userId, newPlanType)

    logger.info({ userId, newPlanType }, "Successfully updated user subscription plan")

    return {
      success: true,
    }
  } catch (error) {
    logger.error({ error, newPlanType }, "Error updating user subscription plan")
    return {
      success: false,
      error: "Failed to update subscription plan",
    }
  }
}

/**
 * Server action to get user's current plan from database
 * Called from context to get authoritative plan data
 */
export async function getUserCurrentPlan(): Promise<{
  success: boolean
  data?: PlanType
  error?: string
}> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        success: false,
        error: "User not authenticated",
      }
    }

    const planType = await getUserPlan(userId)

    return {
      success: true,
      data: planType,
    }
  } catch (error) {
    logger.error({ error }, "Error getting user current plan")
    return {
      success: false,
      error: "Failed to get current plan",
    }
  }
}

/**
 * Optimized server action to get user's plan and usage data in a single call
 * Reduces database round trips for better performance
 */
export async function getUserPlanAndUsage(): Promise<{
  success: boolean
  data?: {
    planType: PlanType
    currentUsage: number
    planLimit: number
    usagePercentage: number
    billingPeriodStart: string
    billingPeriodEnd: string
    remainingPages: number
    isMonthlyLimit: boolean
    resetDate?: string
    isCancelled: boolean
    cancelledAt?: string
    expiresAt?: string
  }
  error?: string
}> {
  try {
    const { userId } = await auth()

    if (!userId) {
      return {
        success: false,
        error: "User not authenticated",
      }
    }

    const supabase = createServerSupabaseClient()

    // Single query to get active subscription if exists (including cancellation info)
    const { data: activeSubscriptions, error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .select("*, canceled_at, current_period_end")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)

    if (subscriptionError) {
      logger.error({ error: subscriptionError, userId }, "Error querying active subscription")
      return {
        success: false,
        error: "Failed to retrieve subscription data",
      }
    }

    // Determine plan type
    const activeSubscription =
      activeSubscriptions && activeSubscriptions.length > 0 ? activeSubscriptions[0] : null
    const planType: PlanType = activeSubscription?.plan_type || "free"
    const subscriptionStartDate = activeSubscription?.current_period_start
      ? new Date(activeSubscription.current_period_start)
      : new Date()

    // Calculate billing period
    const { periodStart, periodEnd } = calculateBillingPeriod(subscriptionStartDate)

    // Single query to get or create usage record
    let usageRecord
    const { data: existingUsage, error: usageSelectError } = await supabase
      .from("user_usage")
      .select("*")
      .eq("user_id", userId)
      .eq("billing_period_start", periodStart)
      .maybeSingle()

    if (usageSelectError) {
      logger.error({ error: usageSelectError, userId }, "Error fetching usage record")
      return {
        success: false,
        error: "Failed to retrieve usage data",
      }
    }

    if (existingUsage) {
      usageRecord = existingUsage
    } else {
      // Create new usage record
      const { data: newUsage, error: usageInsertError } = await supabase
        .from("user_usage")
        .insert({
          user_id: userId,
          billing_period_start: periodStart,
          billing_period_end: periodEnd,
          pages_consumed: 0,
          plan_type: planType,
        })
        .select()
        .single()

      if (usageInsertError) {
        logger.error({ error: usageInsertError, userId }, "Error creating usage record")
        return {
          success: false,
          error: "Failed to create usage record",
        }
      }

      usageRecord = newUsage
    }

    // Calculate derived values
    const planLimit = PLAN_LIMITS[planType]
    const currentUsage = usageRecord.pages_consumed
    const remainingPages = Math.max(0, planLimit - currentUsage)
    const usagePercentage = Math.min(100, (currentUsage / planLimit) * 100)
    const isMonthlyLimit = planType !== "free"

    // Calculate reset date and cancellation info
    let resetDate: string | undefined
    let isCancelled = false
    let cancelledAt: string | undefined
    let expiresAt: string | undefined

    if (isMonthlyLimit && activeSubscription?.current_period_end) {
      resetDate = new Date(activeSubscription.current_period_end).toISOString()
      expiresAt = resetDate // For cancelled subscriptions, this is when access ends
    }

    if (activeSubscription?.canceled_at) {
      isCancelled = true
      cancelledAt = new Date(activeSubscription.canceled_at).toISOString()
    }

    return {
      success: true,
      data: {
        planType,
        currentUsage,
        planLimit,
        usagePercentage,
        billingPeriodStart: usageRecord.billing_period_start,
        billingPeriodEnd: usageRecord.billing_period_end,
        remainingPages,
        isMonthlyLimit,
        resetDate,
        isCancelled,
        cancelledAt,
        expiresAt,
      },
    }
  } catch (error) {
    logger.error({ error }, "Error getting user plan and usage")
    return {
      success: false,
      error: "Failed to get user data",
    }
  }
}
