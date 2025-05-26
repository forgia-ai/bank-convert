"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"

// Types
export type UserType = "anonymous" | "free" | "paid"

export interface UserLimitsData {
  userType: UserType
  currentUsage: number
  limit: number
  usagePercentage: number
  isAtLimit: boolean
  isNearLimit: boolean // 75%+
  isCritical: boolean // 90%+
  resetDate?: string // For paid users (monthly reset)
  isMonthlyLimit: boolean // true for paid, false for free (lifetime)
}

export interface UserLimitsContextType {
  // Current state
  userLimits: UserLimitsData

  // Actions
  incrementUsage: (pages: number) => void
  refreshLimits: () => Promise<void>

  // Helpers
  canProcessPages: (pages: number) => boolean
  getRemainingPages: () => number
  getUpgradePromptVariant: () => "subtle" | "prominent" | "urgent"
}

// Mock data - TODO: Replace with real API calls
const getMockUserLimits = (mockUserType: UserType = "free"): UserLimitsData => {
  // TODO: Get from authentication context or API
  const userType = mockUserType

  // Mock usage data - TODO: Fetch from API
  const mockUsage = {
    anonymous: { current: 0, limit: 1 }, // 1 document per month
    free: { current: 23, limit: 50 }, // 50 pages total
    paid: { current: 127, limit: 500 }, // 500 pages per month
  }

  const { current, limit } = mockUsage[userType]
  const usagePercentage = (current / limit) * 100

  return {
    userType,
    currentUsage: current,
    limit,
    usagePercentage,
    isAtLimit: current >= limit,
    isNearLimit: usagePercentage >= 75,
    isCritical: usagePercentage >= 90,
    resetDate:
      userType === "paid"
        ? new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
    isMonthlyLimit: userType === "paid",
  }
}

// Context
const UserLimitsContext = createContext<UserLimitsContextType | undefined>(undefined)

// Provider component
interface UserLimitsProviderProps {
  children: ReactNode
}

export function UserLimitsProvider({ children }: UserLimitsProviderProps) {
  const [userLimits, setUserLimits] = useState<UserLimitsData>(getMockUserLimits())

  // Mock function to increment usage - TODO: Replace with API call
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

    // TODO: Send usage update to backend
    // await updateUsageAPI(pages)
  }

  // Mock function to refresh limits - TODO: Replace with API call
  const refreshLimits = async () => {
    // TODO: Fetch fresh data from API
    // const freshData = await fetchUserLimitsAPI()
    // setUserLimits(freshData)

    // For now, just refresh with mock data
    setUserLimits(getMockUserLimits())
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
    // TODO: Fetch initial user limits from API
    refreshLimits()
  }, [])

  const contextValue: UserLimitsContextType = {
    userLimits,
    incrementUsage,
    refreshLimits,
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
