"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { checkUserUsageLimit, recordUserPageUsage, getCurrentUserUsage } from "@/lib/usage/actions"
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
}

export interface UserLimitsContextType {
  // Current state
  userLimits: UserLimitsData

  // Actions
  incrementUsage: (pages: number) => void
  refreshLimits: () => Promise<void>

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
})

// Context
const UserLimitsContext = createContext<UserLimitsContextType | undefined>(undefined)

// Provider component
interface UserLimitsProviderProps {
  children: ReactNode
}

export function UserLimitsProvider({ children }: UserLimitsProviderProps) {
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
      paid1: { planKey: "paid1", price: "$8/mês", limit: 500 },
      paid2: { planKey: "paid2", price: "$15/mês", limit: 1000 },
    }
    return planDetails[plan]
  }

  // Function to increment usage locally (optimistic update)
  const incrementUsage = (pages: number) => {
    setUserLimits((prev) => {
      const newUsage = Math.min(prev.currentUsage + pages, prev.limit)
      const newPercentage = (newUsage / prev.limit) * 100

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

  // Function to refresh limits from server
  const refreshLimits = async () => {
    try {
      setIsLoading(true)

      // Get current plan type from state (or default to free)
      const currentPlanType = userLimits.subscriptionPlan as PlanType

      const result = await getCurrentUserUsage(currentPlanType)

      if (result.success && result.data) {
        const usageData = result.data
        const planDetails = getPlanDetails(usageData.planType as SubscriptionPlan)
        const userType = planTypeToUserType(usageData.planType as SubscriptionPlan)

        setUserLimits({
          userType,
          subscriptionPlan: usageData.planType as SubscriptionPlan,
          currentUsage: usageData.currentPeriodUsage,
          limit: usageData.planLimit,
          usagePercentage: usageData.usagePercentage,
          isAtLimit: usageData.currentPeriodUsage >= usageData.planLimit,
          isNearLimit: usageData.usagePercentage >= 75,
          isCritical: usageData.usagePercentage >= 90,
          resetDate:
            userType === "paid"
              ? new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
              : undefined,
          isMonthlyLimit: userType === "paid",
          planName: planDetails.planKey,
          planPrice: planDetails.price,
        })
      }
    } catch (error) {
      console.error("Failed to refresh user limits:", error)
      // Keep existing state on error
    } finally {
      setIsLoading(false)
    }
  }

  // Mock function to subscribe to a plan - TODO: Replace with Stripe integration
  const subscribeToPlan = async (plan: SubscriptionPlan) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

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
      resetDate:
        userType === "paid"
          ? new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
          : undefined,
      // Recalculate percentages with new limit
      usagePercentage: (prev.currentUsage / planDetails.limit) * 100,
      isAtLimit: prev.currentUsage >= planDetails.limit,
      isNearLimit: (prev.currentUsage / planDetails.limit) * 100 >= 75,
      isCritical: (prev.currentUsage / planDetails.limit) * 100 >= 90,
    }))

    // Refresh from server to get authoritative data
    await refreshLimits()
  }

  // Function to process a document with usage tracking
  const processDocument = async (pageCount: number): Promise<boolean> => {
    try {
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

  // Initialize data on mount
  useEffect(() => {
    refreshLimits()
  }, [])

  const contextValue: UserLimitsContextType = {
    userLimits,
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
