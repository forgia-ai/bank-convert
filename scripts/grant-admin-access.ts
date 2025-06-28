#!/usr/bin/env tsx

import { config } from "dotenv"
config({ path: ".env.local" })

/**
 * Grant Admin Access Script
 *
 * This script grants a user Premium plan access without going through Stripe payment.
 * Perfect for giving admin users full access when moving to production.
 *
 * Usage: yarn tsx scripts/grant-admin-access.ts [USER_ID]
 * If no USER_ID provided, uses default admin user.
 */

import { createTestSubscription } from "@/lib/subscriptions/management"
import { logger } from "@/lib/utils/logger"

// Default admin user ID
const DEFAULT_USER_ID = "user_2xXeIhp0iMJeS5C9wXYfeZxIkMt"

async function grantAdminAccess(userId: string) {
  try {
    console.log(`🚀 Granting Premium plan access to user: ${userId}`)

    // Grant Premium plan (paid2) without Stripe payment
    const subscription = await createTestSubscription(
      userId,
      "paid2", // Premium plan
      `admin_customer_${userId}`, // Custom customer ID for admin
    )

    console.log("✅ SUCCESS! Admin access granted:")
    console.log(`   - User ID: ${userId}`)
    console.log(`   - Plan: Premium (paid2)`)
    console.log(`   - Status: ${subscription.status}`)
    console.log(`   - Subscription ID: ${subscription.id}`)
    console.log(`   - Valid until: ${subscription.current_period_end}`)

    logger.info(
      {
        userId,
        subscriptionId: subscription.id,
        planType: subscription.plan_type,
      },
      "Admin access granted successfully",
    )
  } catch (error) {
    console.error("❌ ERROR granting admin access:", error)
    logger.error({ error, userId }, "Failed to grant admin access")
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
grantAdminAccess(userId).then(() => {
  console.log("🎉 Script completed successfully!")
  process.exit(0)
})
