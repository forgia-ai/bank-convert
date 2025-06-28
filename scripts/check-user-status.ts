#!/usr/bin/env tsx

import { config } from "dotenv"
config({ path: ".env.local" })

/**
 * Check User Subscription Status Script
 *
 * This script displays a user's current subscription status and plan details.
 * Useful for testing and verifying subscription changes.
 *
 * Usage: yarn tsx scripts/check-user-status.ts [USER_ID]
 * If no USER_ID provided, uses default admin user.
 */

import { getUserPlan, getActiveSubscription } from "@/lib/subscriptions/management"
import { getOrCreateUsageRecord } from "@/lib/usage/tracking"
import { logger } from "@/lib/utils/logger"

// Default admin user ID
const DEFAULT_USER_ID = "user_2xXeIhp0iMJeS5C9wXYfeZxIkMt"

async function checkUserStatus(userId: string) {
  try {
    console.log(`🔍 Checking subscription status for user: ${userId}`)
    console.log("═".repeat(60))

    // Get current plan from the authoritative source
    const currentPlan = await getUserPlan(userId)
    console.log(`📋 Current Plan: ${currentPlan.toUpperCase()}`)

    // Get active subscription details
    const activeSubscription = await getActiveSubscription(userId)

    if (activeSubscription) {
      console.log(`✅ Active Subscription Found:`)
      console.log(`   - Subscription ID: ${activeSubscription.id}`)
      console.log(`   - Plan Type: ${activeSubscription.plan_type}`)
      console.log(`   - Status: ${activeSubscription.status}`)
      console.log(`   - Stripe Customer ID: ${activeSubscription.stripe_customer_id}`)
      console.log(
        `   - Stripe Subscription ID: ${activeSubscription.stripe_subscription_id || "N/A"}`,
      )

      if (activeSubscription.current_period_start) {
        console.log(
          `   - Period Start: ${new Date(activeSubscription.current_period_start).toLocaleString()}`,
        )
      }
      if (activeSubscription.current_period_end) {
        console.log(
          `   - Period End: ${new Date(activeSubscription.current_period_end).toLocaleString()}`,
        )
      }
      if (activeSubscription.canceled_at) {
        console.log(
          `   - Canceled At: ${new Date(activeSubscription.canceled_at).toLocaleString()}`,
        )
      }

      console.log(`   - Created: ${new Date(activeSubscription.created_at).toLocaleString()}`)
      console.log(`   - Updated: ${new Date(activeSubscription.updated_at).toLocaleString()}`)
    } else {
      console.log(`ℹ️  No Active Subscription`)
      console.log(`   - User is on free plan by default`)
    }

    // Get usage record for current period
    try {
      const usageRecord = await getOrCreateUsageRecord(userId, currentPlan)

      console.log(`\n📊 Usage Information:`)
      console.log(`   - Usage Record ID: ${usageRecord.id}`)
      console.log(`   - Plan Type: ${usageRecord.plan_type}`)
      console.log(`   - Pages Consumed: ${usageRecord.pages_consumed}`)
      console.log(
        `   - Billing Period: ${usageRecord.billing_period_start} to ${usageRecord.billing_period_end}`,
      )

      // Show plan limits
      const planLimits = {
        free: "50 pages total",
        paid1: "500 pages/month",
        paid2: "1000 pages/month",
      }

      console.log(
        `   - Plan Limit: ${planLimits[currentPlan as keyof typeof planLimits] || "Unknown"}`,
      )
    } catch (usageError) {
      console.log(`⚠️  Could not retrieve usage information: ${usageError}`)
    }

    console.log("═".repeat(60))

    // Provide next step suggestions
    if (currentPlan === "free") {
      console.log(`💡 Next Steps:`)
      if (userId === DEFAULT_USER_ID) {
        console.log(`   - Grant admin access: yarn tsx scripts/grant-admin-access.ts`)
      } else {
        console.log(`   - Grant admin access: yarn tsx scripts/grant-admin-access.ts ${userId}`)
      }
      console.log(`   - Or test subscription flow through the UI`)
    } else {
      console.log(`💡 Next Steps:`)
      if (userId === DEFAULT_USER_ID) {
        console.log(`   - Reset to free: yarn tsx scripts/reset-to-free.ts`)
      } else {
        console.log(`   - Reset to free: yarn tsx scripts/reset-to-free.ts ${userId}`)
      }
      console.log(`   - Or manage through Stripe Customer Portal`)
    }

    logger.info(
      {
        userId,
        currentPlan,
        hasActiveSubscription: !!activeSubscription,
        subscriptionStatus: activeSubscription?.status || "none",
      },
      "User status check completed",
    )
  } catch (error) {
    console.error("❌ ERROR checking user status:", error)
    logger.error({ error, userId }, "Failed to check user status")
    process.exit(1)
  }
}

// Get user ID from command line arguments or use default
const userId = process.argv[2] || DEFAULT_USER_ID

if (userId === DEFAULT_USER_ID) {
  console.log(`🎯 Using default admin user: ${DEFAULT_USER_ID}`)
} else {
  console.log(`🎯 Using provided user: ${userId}`)
}

// Run the script
checkUserStatus(userId).then(() => {
  console.log("✅ Status check completed!")
  process.exit(0)
})
