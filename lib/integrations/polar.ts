// Polar client is handled by the NextJS adapter directly
// This file contains configuration, helpers, and database operations for Polar

import { createServerSupabaseClient } from "@/lib/integrations/supabase"
import { logger } from "@/lib/utils/logger"

// Four separate products following Polar's recommendation
// Using client-accessible environment variables for product IDs
export const POLAR_PLAN_CONFIG = {
  paid1_monthly: {
    productId: process.env.NEXT_PUBLIC_POLAR_PAID1_MONTHLY_PRODUCT_ID!,
    planType: "paid1_monthly" as const,
    name: "Lite Monthly",
    price: 2000, // $20.00 in cents
    billingCycle: "monthly",
    features: ["500 pages/month", "PDF & CSV support", "Priority Email Support"],
  },
  paid1_yearly: {
    productId: process.env.NEXT_PUBLIC_POLAR_PAID1_ANNUAL_PRODUCT_ID!,
    planType: "paid1_yearly" as const,
    name: "Lite Yearly",
    price: 14400, // $144.00 in cents (yearly)
    effectiveMonthlyPrice: 1200, // $12.00 in cents
    billingCycle: "yearly",
    features: ["500 pages/month", "PDF & CSV support", "Priority Email Support"],
  },
  paid2_monthly: {
    productId: process.env.NEXT_PUBLIC_POLAR_PAID2_MONTHLY_PRODUCT_ID!,
    planType: "paid2_monthly" as const,
    name: "Pro Monthly",
    price: 4000, // $40.00 in cents
    billingCycle: "monthly",
    features: ["1000 pages/month", "All Lite features", "API Access", "Dedicated Support"],
  },
  paid2_yearly: {
    productId: process.env.NEXT_PUBLIC_POLAR_PAID2_ANNUAL_PRODUCT_ID!,
    planType: "paid2_yearly" as const,
    name: "Pro Yearly",
    price: 28800, // $288.00 in cents (yearly)
    effectiveMonthlyPrice: 2400, // $24.00 in cents
    billingCycle: "yearly",
    features: ["1000 pages/month", "All Lite features", "API Access", "Dedicated Support"],
  },
} as const

export type PolarPlanType = keyof typeof POLAR_PLAN_CONFIG

// Helper function to get plan config by product ID
export function getPlanConfigByProductId(
  productId: string,
): (typeof POLAR_PLAN_CONFIG)[PolarPlanType] | null {
  return Object.values(POLAR_PLAN_CONFIG).find((config) => config.productId === productId) || null
}

// Helper function to get plan tier (paid1/paid2) from plan type
export function getPlanTier(planType: PolarPlanType): "paid1" | "paid2" {
  return planType.startsWith("paid1") ? "paid1" : "paid2"
}

// Helper function to get billing cycle from plan type
export function getBillingCycle(planType: PolarPlanType): "monthly" | "yearly" {
  return planType.endsWith("yearly") ? "yearly" : "monthly"
}

// Helper function to map legacy plan types to Polar plans
export function mapLegacyPlanToPolar(legacyPlan: string): PolarPlanType | null {
  const mapping: Record<string, PolarPlanType> = {
    paid1: "paid1_monthly", // Default to monthly for legacy compatibility
    paid2: "paid2_monthly",
  }
  return mapping[legacyPlan] || null
}

// Helper function to get plan display information
export function getPlanDisplayInfo(planType: PolarPlanType) {
  const config = POLAR_PLAN_CONFIG[planType]
  if (!config) return null

  return {
    name: config.name,
    price: config.price,
    effectiveMonthlyPrice:
      "effectiveMonthlyPrice" in config ? config.effectiveMonthlyPrice : config.price,
    billingCycle: config.billingCycle,
    features: config.features,
  }
}

// Database operations for Polar subscriptions

// Type definitions for Polar webhook payloads
interface PolarOrder {
  id: string
  customerId: string
  productId: string
}

interface PolarSubscription {
  id: string
  customerId: string
  productId: string
  currentPeriodStart?: string
  currentPeriodEnd?: string
}

export async function getUserPolarCustomerId(userId: string): Promise<string | null> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("polar_customer_id")
    .eq("user_id", userId)
    .single()

  if (error || !data?.polar_customer_id) {
    return null
  }

  return data.polar_customer_id
}

export async function updateUserSubscriptionFromPolar(params: {
  userId: string
  order?: PolarOrder
  subscription?: PolarSubscription
  planType: PolarPlanType | string
  status: string
}) {
  const { userId, order, subscription, planType, status } = params
  const supabase = createServerSupabaseClient()

  try {
    // First, check if a subscription record already exists for this user
    const { data: existingRecord } = await supabase
      .from("user_subscriptions")
      .select("id")
      .eq("user_id", userId)
      .single()

    const now = new Date().toISOString()

    const subscriptionData = {
      user_id: userId,
      plan_type: planType,
      status,
      updated_at: now,
      ...(order && {
        polar_customer_id: order.customerId,
        polar_order_id: order.id,
        polar_product_id: order.productId,
      }),
      ...(subscription && {
        polar_customer_id: subscription.customerId,
        polar_subscription_id: subscription.id,
        polar_product_id: subscription.productId,
        current_period_start: subscription.currentPeriodStart,
        current_period_end: subscription.currentPeriodEnd,
      }),
    }

    if (existingRecord) {
      // Update existing record
      const { error } = await supabase
        .from("user_subscriptions")
        .update(subscriptionData)
        .eq("user_id", userId)

      if (error) {
        throw error
      }

      logger.info(
        { userId, status, planType },
        "Successfully updated existing user subscription from Polar",
      )
    } else {
      // Insert new record with all required fields
      const { error } = await supabase.from("user_subscriptions").insert({
        ...subscriptionData,
        created_at: now,
      })

      if (error) {
        throw error
      }

      logger.info(
        { userId, status, planType },
        "Successfully created new user subscription from Polar",
      )
    }

    logger.info({ userId, status, planType }, "Successfully updated user subscription from Polar")
  } catch (error) {
    logger.error({ error, userId }, "Failed to update user subscription from Polar")
    throw error
  }
}

export async function hasActivePolarSubscription(userId: string): Promise<boolean> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("status, plan_type")
    .eq("user_id", userId)
    .eq("status", "active")
    .single()

  if (error || !data) {
    return false
  }

  return data.plan_type !== "free"
}

export async function getUserPolarSubscription(userId: string) {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (error || !data) {
    return null
  }

  return data
}
