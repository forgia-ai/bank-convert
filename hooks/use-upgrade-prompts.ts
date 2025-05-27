import { useUserLimits } from "@/contexts/user-limits-context"

export type UpgradePromptVariant = "subtle" | "prominent" | "urgent"
export type UpgradePromptContext = "dashboard" | "processing" | "limit-reached"

export interface UpgradePromptConfig {
  shouldShow: boolean
  variant: UpgradePromptVariant
  context: UpgradePromptContext
  message?: string
  urgencyLevel: number // 1-10, where 10 is most urgent
}

export function useUpgradePrompts() {
  const { userLimits, getUpgradePromptVariant } = useUserLimits()

  // Determine if upgrade prompts should be shown
  const shouldShowUpgradePrompt = (context: UpgradePromptContext = "dashboard"): boolean => {
    // Never show for paid users
    if (userLimits.userType === "paid") return false

    // Always show for anonymous users in limit-reached context
    if (userLimits.userType === "anonymous" && context === "limit-reached") return true

    // For free users, show based on usage thresholds
    if (userLimits.userType === "free") {
      switch (context) {
        case "limit-reached":
          return userLimits.isAtLimit
        case "processing":
          return userLimits.isNearLimit // 75%+
        case "dashboard":
          return (
            userLimits.usagePercentage >= 60 && !userLimits.isAtLimit && !userLimits.isCritical
          ) // Show at 60%+ for dashboard, but not when at limit or critical
        default:
          return false
      }
    }

    return false
  }

  // Get upgrade prompt configuration
  const getUpgradePromptConfig = (
    context: UpgradePromptContext = "dashboard",
  ): UpgradePromptConfig => {
    const shouldShow = shouldShowUpgradePrompt(context)
    const variant = getUpgradePromptVariant()

    // Calculate urgency level (1-10)
    let urgencyLevel = 1
    if (userLimits.userType === "anonymous") {
      urgencyLevel = context === "limit-reached" ? 8 : 5
    } else if (userLimits.userType === "free") {
      if (userLimits.isAtLimit) urgencyLevel = 10
      else if (userLimits.isCritical) urgencyLevel = 9
      else if (userLimits.isNearLimit) urgencyLevel = 7
      else urgencyLevel = Math.floor(userLimits.usagePercentage / 10) + 1
    }

    // Generate contextual message
    let message: string | undefined
    if (shouldShow) {
      switch (userLimits.userType) {
        case "anonymous":
          message = "Sign up for free to get 50 pages total"
          break
        case "free":
          if (userLimits.isAtLimit) {
            message = "You've used all your free pages. Upgrade for monthly allowances."
          } else if (userLimits.isCritical) {
            message = `Only ${userLimits.limit - userLimits.currentUsage} pages left. Upgrade now!`
          } else if (userLimits.isNearLimit) {
            message = "Running low on pages. Consider upgrading for monthly allowances."
          } else {
            message = "Upgrade for monthly page allowances and unlimited processing."
          }
          break
      }
    }

    return {
      shouldShow,
      variant,
      context,
      message,
      urgencyLevel,
    }
  }

  // Check if user should see upgrade prompt in specific scenarios
  const shouldShowInNavbar = (): boolean => {
    return shouldShowUpgradePrompt("dashboard") && userLimits.usagePercentage >= 75
  }

  const shouldShowInProcessing = (): boolean => {
    return shouldShowUpgradePrompt("processing")
  }

  const shouldShowLimitReachedModal = (): boolean => {
    return userLimits.isAtLimit || shouldShowUpgradePrompt("limit-reached")
  }

  // Get the most appropriate upgrade prompt for current state
  const getPrimaryUpgradePrompt = (): UpgradePromptConfig => {
    if (shouldShowLimitReachedModal()) {
      return getUpgradePromptConfig("limit-reached")
    } else if (shouldShowInProcessing()) {
      return getUpgradePromptConfig("processing")
    } else {
      return getUpgradePromptConfig("dashboard")
    }
  }

  return {
    // Configuration getters
    getUpgradePromptConfig,
    getPrimaryUpgradePrompt,

    // Specific context checks
    shouldShowUpgradePrompt,
    shouldShowInNavbar,
    shouldShowInProcessing,
    shouldShowLimitReachedModal,

    // Current user state
    userLimits,
  }
}
