import { useAuth } from "@clerk/nextjs"
import { POLAR_PLAN_CONFIG, type PolarPlanType } from "@/lib/integrations/polar"

// Create Polar checkout using direct URL redirection (Polar's recommended approach)
export async function createPolarCheckout(planType: PolarPlanType, language: string = "en") {
  try {
    // Get plan configuration directly (no API call needed)
    const planConfig = POLAR_PLAN_CONFIG[planType]
    if (!planConfig) {
      throw new Error(`Invalid plan type: ${planType}`)
    }

    // Build checkout URL with query parameters (Polar's recommended approach)
    const checkoutUrl = new URL("/api/polar/checkout", window.location.origin)
    checkoutUrl.searchParams.set("products", planConfig.productId)
    checkoutUrl.searchParams.set("language", language)

    // Direct redirect to Polar checkout
    window.location.href = checkoutUrl.toString()
  } catch (error) {
    console.error("Error creating Polar checkout:", error)
    throw error
  }
}

// Hook for client components to create checkout with user context
export function usePolarCheckout() {
  const { userId, isSignedIn } = useAuth()

  const createCheckout = async (planType: PolarPlanType, language: string = "en") => {
    if (!isSignedIn || !userId) {
      throw new Error("User not authenticated")
    }

    // Get plan configuration directly (no API call needed)
    const planConfig = POLAR_PLAN_CONFIG[planType]
    if (!planConfig) {
      throw new Error(`Invalid plan type: ${planType}`)
    }

    // Build checkout URL with query parameters and metadata
    const checkoutUrl = new URL("/api/polar/checkout", window.location.origin)
    checkoutUrl.searchParams.set("products", planConfig.productId)
    checkoutUrl.searchParams.set("language", language)

    // Encode metadata as URL-encoded JSON string (as per Polar docs)
    const metadata = {
      userId: userId,
      planType: planType,
    }
    checkoutUrl.searchParams.set("metadata", JSON.stringify(metadata))

    // Direct redirect to Polar checkout
    window.location.href = checkoutUrl.toString()
  }

  return { createCheckout, isAuthenticated: isSignedIn }
}

// Access Polar customer portal - simplified
export async function createPolarPortalSession() {
  try {
    // Simple redirect to portal endpoint
    window.location.href = "/api/polar/portal"
  } catch (error) {
    console.error("Error accessing Polar portal:", error)
    throw error
  }
}

// Import the helper function from the main integration file
export { getPlanDisplayInfo } from "@/lib/integrations/polar"
