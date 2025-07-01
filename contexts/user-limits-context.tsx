"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useAuth } from "@clerk/nextjs"
import { checkUserUsageLimit, recordUserPageUsage, getCurrentUserUsage } from "@/lib/usage/actions"
import {
  updateUserSubscriptionPlan,
  getUserCurrentPlan,
  getUserPlanAndUsage,
} from "@/lib/subscriptions/actions"
import { type PlanType } from "@/lib/usage/tracking"

// Types
export type UserType = "anonymous" | "free" | "paid"
export type SubscriptionPlan = "free" | "paid1" | "paid2"

export interface UserLimitsData {
  userType: UserType
  subscriptionPlan: SubscriptionPlan
  currentUsage: number
  limit: number
  usagePercentage: number
  isAtLimit: boolean
  isNearLimit: boolean // 75%+
  isCritical: boolean // 90%+
  resetDate?: string // For paid users (monthly reset)
  isMonthlyLimit: boolean // true for paid, false for free (lifetime)
  planName: string // Plan key for the plan (e.g., 'free', 'paid1', 'paid2')
  planPrice: string // Display price for the plan
  isCancelled: boolean // true if subscription has been cancelled
  cancelledAt?: string // when subscription was cancelled
  expiresAt?: string // when access ends for cancelled subscriptions
}

export interface UserLimitsContextType {
  // Current state
  userLimits: UserLimitsData
  isLoading: boolean

  // Actions
  incrementUsage: (pages: number) => void
  refreshLimits: (planType?: SubscriptionPlan) => Promise<void>

  // Mock subscription actions
  subscribeToPlan: (plan: SubscriptionPlan) => Promise<void>
  processDocument: (pageCount: number) => Promise<boolean> // Returns success/failure

  // Helpers
  canProcessPages: (pages: number) => boolean
  getRemainingPages: () => number
  getUpgradePromptVariant: () => "subtle" | "prominent" | "urgent"
}

// Initial/default state
const getDefaultUserLimits = (): UserLimitsData => ({
  userType: "free",
  subscriptionPlan: "free",
  currentUsage: 0,
  limit: 50,
  usagePercentage: 0,
  isAtLimit: false,
  isNearLimit: false,
  isCritical: false,
  resetDate: undefined,
  isMonthlyLimit: false,
  planName: "free",
  planPrice: "$0",
  isCancelled: false,
  cancelledAt: undefined,
  expiresAt: undefined,
})

// Context
const UserLimitsContext = createContext<UserLimitsContextType | undefined>(undefined)

// Provider component
interface UserLimitsProviderProps {
  children: ReactNode
}

export function UserLimitsProvider({ children }: UserLimitsProviderProps) {
  const { isSignedIn, isLoaded } = useAuth()
  const [userLimits, setUserLimits] = useState<UserLimitsData>(getDefaultUserLimits())
  const [isLoading, setIsLoading] = useState(true)

  // Function to convert plan type to user type
  const planTypeToUserType = (planType: SubscriptionPlan): UserType => {
    switch (planType) {
      case "free":
        return "free"
      case "paid1":
      case "paid2":
        return "paid"
      default:
        return "free"
    }
  }

  // Function to get plan details
  const getPlanDetails = (plan: SubscriptionPlan) => {
    const planDetails = {
      free: { planKey: "free", price: "$0", limit: 50 },
      paid1: { planKey: "paid1", price: "$8/month", limit: 500 },
      paid2: { planKey: "paid2", price: "$14/month", limit: 1000 },
    }
    return planDetails[plan]
  }

  // Function to increment usage locally (optimistic update)
  const incrementUsage = (pages: number) => {
    setUserLimits((prev) => {
      const newUsage = prev.currentUsage + pages
      const newPercentage = (newUsage / prev.limit) * 100

      // Log when usage exceeds limit to track over-usage
      if (newUsage > prev.limit && prev.currentUsage <= prev.limit) {
        console.warn(`Usage exceeded limit: ${newUsage} pages used, limit is ${prev.limit}`)
      }

      return {
        ...prev,
        currentUsage: newUsage,
        usagePercentage: newPercentage,
        isAtLimit: newUsage >= prev.limit,
        isNearLimit: newPercentage >= 75,
        isCritical: newPercentage >= 90,
      }
    })
  }

  // Function to refresh limits from server (OPTIMIZED - single database call)
  const refreshLimits = async (planType?: SubscriptionPlan) => {
    try {
      setIsLoading(true)

      // Check if user is authenticated before making API call
      if (!isSignedIn) {
        setUserLimits(getDefaultUserLimits())
        setIsLoading(false)
        return
      }

      // Use optimized action that gets both plan and usage in one call
      const result = await getUserPlanAndUsage()

      if (result.success && result.data) {
        const data = result.data
        const planDetails = getPlanDetails(data.planType as SubscriptionPlan)
        const userType = planTypeToUserType(data.planType as SubscriptionPlan)

        setUserLimits({
          userType,
          subscriptionPlan: data.planType as SubscriptionPlan,
          currentUsage: data.currentUsage,
          limit: data.planLimit,
          usagePercentage: data.usagePercentage,
          isAtLimit: data.currentUsage >= data.planLimit,
          isNearLimit: data.usagePercentage >= 75,
          isCritical: data.usagePercentage >= 90,
          resetDate: data.resetDate,
          isMonthlyLimit: data.isMonthlyLimit,
          planName: planDetails.planKey,
          planPrice: planDetails.price,
          isCancelled: data.isCancelled,
          cancelledAt: data.cancelledAt,
          expiresAt: data.expiresAt,
        })
      } else {
        // Fallback to default state on error
        console.error("Failed to get user data:", result.error)
        setUserLimits(getDefaultUserLimits())
      }
    } catch (error) {
      console.error("Failed to refresh user limits:", error)
      // Fallback to default state on error
      setUserLimits(getDefaultUserLimits())
    } finally {
      setIsLoading(false)
    }
  }

  // Subscribe to a plan - handles both free plan updates and Stripe redirects
  const subscribeToPlan = async (plan: SubscriptionPlan) => {
    try {
      // Check authentication before proceeding
      if (!isSignedIn) {
        throw new Error("User must be authenticated to subscribe to a plan")
      }

      // For free plan, update directly in database
      if (plan === "free") {
        const result = await updateUserSubscriptionPlan(plan as PlanType)

        if (!result.success) {
          console.error("Failed to update plan:", result.error)
          throw new Error(result.error || "Failed to update plan")
        }

        // Update local state optimistically
        const planDetails = getPlanDetails(plan)
        const userType = planTypeToUserType(plan)

        setUserLimits((prev) => ({
          ...prev,
          userType,
          subscriptionPlan: plan,
          limit: planDetails.limit,
          planName: planDetails.planKey,
          planPrice: planDetails.price,
          isMonthlyLimit: userType === "paid",
          resetDate: undefined,
          isCancelled: false, // Free plan is never cancelled
          cancelledAt: undefined,
          expiresAt: undefined,
          // Recalculate percentages with new limit
          usagePercentage: (prev.currentUsage / planDetails.limit) * 100,
          isAtLimit: prev.currentUsage >= planDetails.limit,
          isNearLimit: (prev.currentUsage / planDetails.limit) * 100 >= 75,
          isCritical: (prev.currentUsage / planDetails.limit) * 100 >= 90,
        }))

        // Refresh from server to get authoritative data with the new plan
        await refreshLimits(plan)
      } else {
        // For paid plans, this should redirect to Stripe Checkout
        // The actual subscription will be handled by webhook
        throw new Error("Paid plan subscriptions should use Stripe Checkout")
      }
    } catch (error) {
      console.error("Error subscribing to plan:", error)
      throw error
    }
  }

  // Function to process a document with usage tracking
  const processDocument = async (pageCount: number): Promise<boolean> => {
    try {
      // Check authentication before proceeding
      if (!isSignedIn) {
        return false
      }

      // Check if user can process this many pages
      if (!canProcessPages(pageCount)) {
        return false
      }

      // Check usage limit via server action
      const currentPlanType = userLimits.subscriptionPlan as PlanType
      const limitCheck = await checkUserUsageLimit(pageCount, currentPlanType)

      if (!limitCheck.success || !limitCheck.data?.canProcess) {
        return false
      }

      // Record the usage via server action
      const recordResult = await recordUserPageUsage(
        pageCount,
        undefined,
        undefined,
        currentPlanType,
      )

      if (!recordResult.success) {
        console.error("Failed to record usage:", recordResult.error)
        return false
      }

      // Update local state optimistically
      incrementUsage(pageCount)

      return true
    } catch (error) {
      console.error("Failed to process document:", error)
      return false
    }
  }

  // Helper to check if user can process pages
  const canProcessPages = (pages: number): boolean => {
    return userLimits.currentUsage + pages <= userLimits.limit
  }

  // Helper to get remaining pages
  const getRemainingPages = (): number => {
    return Math.max(0, userLimits.limit - userLimits.currentUsage)
  }

  // Helper to determine upgrade prompt variant based on usage
  const getUpgradePromptVariant = (): "subtle" | "prominent" | "urgent" => {
    if (userLimits.isCritical) return "urgent"
    if (userLimits.isNearLimit) return "prominent"
    return "subtle"
  }

  // Initialize data on mount - only for authenticated users
  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        refreshLimits()
      } else {
        // User is not signed in, use default limits and stop loading
        setIsLoading(false)
      }
    }
  }, [isLoaded, isSignedIn])

  const contextValue: UserLimitsContextType = {
    userLimits,
    isLoading,
    incrementUsage,
    refreshLimits,
    subscribeToPlan,
    processDocument,
    canProcessPages,
    getRemainingPages,
    getUpgradePromptVariant,
  }

  return <UserLimitsContext.Provider value={contextValue}>{children}</UserLimitsContext.Provider>
}

// Hook to use the context
export function useUserLimits(): UserLimitsContextType {
  const context = useContext(UserLimitsContext)
  if (context === undefined) {
    throw new Error("useUserLimits must be used within a UserLimitsProvider")
  }
  return context
}
