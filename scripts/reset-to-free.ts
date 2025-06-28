#!/usr/bin/env tsx

import { config } from "dotenv"
config({ path: ".env.local" })

/**
 * Reset User to Free Plan Script
 *
 * This script resets a user back to the free plan, canceling any active subscriptions.
 * Perfect for testing subscription flows without creating multiple test users.
 *
 * Usage: yarn tsx scripts/reset-to-free.ts [USER_ID]
 * If no USER_ID provided, uses default admin user.
 */

import { upsertSubscription, getActiveSubscription } from "@/lib/subscriptions/management"
import { logger } from "@/lib/utils/logger"

// Default admin user ID
const DEFAULT_USER_ID = "user_2xXeIhp0iMJeS5C9wXYfeZxIkMt"

async function resetUserToFree(userId: string) {
  try {
    console.log(`🔄 Resetting user to free plan: ${userId}`)

    // First, check if user has an active subscription
    const activeSubscription = await getActiveSubscription(userId)

    if (!activeSubscription) {
      console.log("ℹ️  User already has no active subscription (likely already on free plan)")
      console.log("   Creating explicit free plan record to ensure clean state...")
    } else {
      console.log(`📋 Found active subscription:`)
      console.log(`   - Plan: ${activeSubscription.plan_type}`)
      console.log(`   - Status: ${activeSubscription.status}`)
      console.log(`   - Subscription ID: ${activeSubscription.id}`)
    }

    // Reset to free plan using the same logic as webhook cancellation
    const resetData = {
      user_id: userId,
      stripe_customer_id: activeSubscription?.stripe_customer_id || `reset_customer_${userId}`,
      stripe_subscription_id: activeSubscription?.stripe_subscription_id || undefined,
      plan_type: "free" as const,
      status: "canceled" as const,
      canceled_at: new Date(),
    }

    const subscription = await upsertSubscription(resetData)

    console.log("✅ SUCCESS! User reset to free plan:")
    console.log(`   - User ID: ${userId}`)
    console.log(`   - Plan: ${subscription.plan_type}`)
    console.log(`   - Status: ${subscription.status}`)
    console.log(`   - Canceled at: ${subscription.canceled_at}`)
    console.log(`   - Subscription ID: ${subscription.id}`)

    logger.info(
      {
        userId,
        subscriptionId: subscription.id,
        planType: subscription.plan_type,
        previousPlan: activeSubscription?.plan_type || "unknown",
      },
      "User reset to free plan successfully",
    )
  } catch (error) {
    console.error("❌ ERROR resetting user to free plan:", error)
    logger.error({ error, userId }, "Failed to reset user to free plan")
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

// Confirm action
console.log("⚠️  This will reset the user to FREE plan and cancel any active subscriptions.")
console.log(`   User ID: ${userId}`)
console.log("")

// Run the script
resetUserToFree(userId).then(() => {
  console.log("🎉 Reset completed successfully!")
  console.log("💡 User can now go through the subscription flow again.")
  process.exit(0)
})
