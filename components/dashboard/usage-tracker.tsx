"use client"

import React from "react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BarChart3 } from "lucide-react"
import { type Locale } from "@/i18n-config"

interface UsageTrackerProps {
  lang: Locale
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dictionary: Record<string, any> // TODO: Type this properly
  userType?: "free" | "paid"
  currentUsage?: number
  totalLimit?: number
  isMonthly?: boolean // true for paid users (monthly reset), false for free users (lifetime)
  context?: "dashboard" | "navbar" // Add navbar context for compact display
}

// Mock function to get usage data - replace with real API call later
const getMockUsageData = (userType: "free" | "paid") => {
  if (userType === "free") {
    return {
      currentUsage: 23,
      totalLimit: 50,
      isMonthly: false,
      planName: "Free",
    }
  } else {
    return {
      currentUsage: 127,
      totalLimit: 500,
      isMonthly: true,
      planName: "Growth",
    }
  }
}

export default function UsageTracker({
  lang, // eslint-disable-line @typescript-eslint/no-unused-vars
  dictionary,
  userType = "free",
  currentUsage,
  totalLimit,
  isMonthly,
  context = "dashboard",
}: UsageTrackerProps) {
  // Use provided props or fall back to mock data
  const mockData = getMockUsageData(userType)
  const usage = currentUsage ?? mockData.currentUsage
  const limit = totalLimit ?? mockData.totalLimit
  const monthly = isMonthly ?? mockData.isMonthly
  const planName = mockData.planName

  const usagePercentage = Math.min((usage / limit) * 100, 100)
  const remainingPages = Math.max(limit - usage, 0)

  // Determine badge variant based on user type
  const getBadgeVariant = () => {
    return userType === "paid" ? "default" : "secondary"
  }

  // Compact navbar version
  if (context === "navbar") {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 border rounded-md bg-card">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          {dictionary.usage_tracker?.pages_unit || "Pages"}:{" "}
          <span className="font-semibold text-foreground">
            {usage}/{limit}
          </span>
        </span>
      </div>
    )
  }

  return (
    <div className="bg-card border rounded-lg p-4 space-y-3">
      {/* Header with plan name and usage */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="font-medium text-sm">{dictionary.usage_tracker?.title || "Usage"}</h3>
          <Badge variant={getBadgeVariant()}>{planName}</Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          {usage}/{limit} {dictionary.usage_tracker?.pages_unit || "pages"}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <Progress value={usagePercentage} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {dictionary.usage_tracker?.remaining_prefix || "Remaining:"} {remainingPages}{" "}
            {dictionary.usage_tracker?.pages_unit || "pages"}
          </span>
          <span>
            {monthly
              ? dictionary.usage_tracker?.monthly_reset || "Resets monthly"
              : dictionary.usage_tracker?.lifetime_limit || "Lifetime limit"}
          </span>
        </div>
      </div>

      {/* Warning message for high usage */}
      {usagePercentage >= 75 && (
        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
          {usagePercentage >= 90
            ? dictionary.usage_tracker?.warning_critical ||
              "You're almost out of pages! Consider upgrading."
            : dictionary.usage_tracker?.warning_high ||
              "You're using most of your page allowance."}
        </div>
      )}

      {/* Upgrade prompt for free users approaching limit */}
      {userType === "free" && usagePercentage >= 60 && (
        <div className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded p-2">
          {dictionary.usage_tracker?.upgrade_prompt ||
            "Need more pages? Upgrade for monthly allowances!"}
        </div>
      )}
    </div>
  )
}
