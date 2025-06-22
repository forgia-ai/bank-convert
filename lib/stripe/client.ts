import { loadStripe } from "@stripe/stripe-js"
import { getStripePublishableKey } from "@/lib/integrations/stripe"

// Initialize Stripe client
let stripePromise: ReturnType<typeof loadStripe>

export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(getStripePublishableKey())
  }
  return stripePromise
}

// Create checkout session and redirect to Stripe
export async function createCheckoutSession(
  planType: "paid1" | "paid2",
  billingCycle: "monthly" | "yearly",
) {
  try {
    const response = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        planType,
        billingCycle,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to create checkout session")
    }

    const { url } = await response.json()

    // Redirect to Stripe Checkout
    if (url) {
      window.location.href = url
    } else {
      throw new Error("No checkout URL returned")
    }
  } catch (error) {
    console.error("Error creating checkout session:", error)
    throw error
  }
}

// Create customer portal session and redirect
export async function createPortalSession() {
  try {
    const response = await fetch("/api/stripe/create-portal-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to create portal session")
    }

    const { url } = await response.json()

    // Redirect to Stripe Customer Portal
    if (url) {
      window.location.href = url
    } else {
      throw new Error("No portal URL returned")
    }
  } catch (error) {
    console.error("Error creating portal session:", error)
    throw error
  }
}
