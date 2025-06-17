"use server"

import { auth } from "@clerk/nextjs/server"
import { updateUserPlan, getUserPlan } from "@/lib/subscriptions/management"
import { type PlanType } from "@/lib/usage/tracking"
import { logger } from "@/lib/utils/logger"

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
