"use server"

import { auth } from "@clerk/nextjs/server"
import {
  checkUsageLimit,
  trackPageUsage,
  getUserUsage,
  getUserUsageHistory,
  type PlanType,
  type UsageData,
} from "@/lib/usage/tracking"
import { logger } from "@/lib/utils/logger"

/**
 * Server action to check if user can process additional pages
 * Called from client components before file processing
 */
export async function checkUserUsageLimit(
  additionalPages: number,
  planType: PlanType = "free",
): Promise<{
  success: boolean
  data?: {
    canProcess: boolean
    currentUsage: number
    limit: number
    wouldExceed: boolean
  }
  error?: string
}> {
  try {
    // Validate additional pages parameter
    if (additionalPages <= 0 || !Number.isInteger(additionalPages)) {
      return {
        success: false,
        error: "Additional pages must be a positive integer",
      }
    }

    const { userId } = await auth()

    if (!userId) {
      return {
        success: false,
        error: "User not authenticated",
      }
    }

    const result = await checkUsageLimit(userId, additionalPages, planType)

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    logger.error({ error, additionalPages }, "Error checking user usage limit")
    return {
      success: false,
      error: "Failed to check usage limit",
    }
  }
}

/**
 * Server action to track page usage after successful processing
 * Called from file processing workflow
 */
export async function recordUserPageUsage(
  pagesProcessed: number,
  fileName?: string,
  fileSize?: number,
  planType: PlanType = "free",
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Validate pages processed parameter
    if (pagesProcessed <= 0 || !Number.isInteger(pagesProcessed)) {
      return {
        success: false,
        error: "Pages processed must be a positive integer",
      }
    }

    const { userId } = await auth()

    if (!userId) {
      return {
        success: false,
        error: "User not authenticated",
      }
    }

    await trackPageUsage(userId, pagesProcessed, fileName, fileSize, planType)

    logger.info({ userId, pagesProcessed, fileName }, "Successfully recorded page usage")

    return {
      success: true,
    }
  } catch (error) {
    logger.error({ error, pagesProcessed, fileName }, "Error recording page usage")
    return {
      success: false,
      error: "Failed to record page usage",
    }
  }
}

/**
 * Server action to get current user usage data
 * Called from dashboard/UI components to display usage stats
 */
export async function getCurrentUserUsage(planType: PlanType = "free"): Promise<{
  success: boolean
  data?: UsageData
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

    const usageData = await getUserUsage(userId, planType)

    return {
      success: true,
      data: usageData,
    }
  } catch (error) {
    logger.error({ error }, "Error getting user usage")
    return {
      success: false,
      error: "Failed to get usage data",
    }
  }
}

/**
 * Server action to get user usage history
 * Called from settings/analytics pages
 */
export async function getUserUsageHistoryData(limit: number = 10): Promise<{
  success: boolean
  data?: Array<{
    id: string
    pages_processed: number
    file_name: string | null
    file_size: number | null
    created_at: string
  }>
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

    const history = await getUserUsageHistory(userId, limit)

    return {
      success: true,
      data: history,
    }
  } catch (error) {
    logger.error({ error, limit }, "Error getting user usage history")
    return {
      success: false,
      error: "Failed to get usage history",
    }
  }
}
