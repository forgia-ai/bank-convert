import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createStripeClient } from "@/lib/integrations/stripe"
import { createServerSupabaseClient } from "@/lib/integrations/supabase"
import { logger } from "@/lib/utils/logger"

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    logger.info({ userId }, "Creating Stripe customer portal session")

    // Initialize clients
    const stripe = createStripeClient()
    const supabase = createServerSupabaseClient()

    // Get user's Stripe customer ID
    const { data: subscription, error } = await supabase
      .from("user_subscriptions")
      .select("stripe_customer_id, stripe_subscription_id, status")
      .eq("user_id", userId)
      .maybeSingle()

    if (error) {
      logger.error({ userId, error }, "Database error fetching subscription")
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!subscription?.stripe_customer_id) {
      logger.error({ userId }, "User has no Stripe customer ID")
      return NextResponse.json(
        { error: "No subscription found. Please subscribe to a plan first." },
        { status: 404 },
      )
    }

    // Check if customer actually exists in Stripe
    try {
      await stripe.customers.retrieve(subscription.stripe_customer_id)
    } catch (stripeError) {
      logger.error(
        { userId, customerId: subscription.stripe_customer_id, stripeError },
        "Stripe customer not found",
      )
      return NextResponse.json(
        { error: "Invalid customer. Please contact support." },
        { status: 400 },
      )
    }

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${request.nextUrl.origin}/en/viewer/billing`,
    })

    logger.info({ userId, sessionId: portalSession.id }, "Created Stripe portal session")

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    logger.error({ error }, "Error creating portal session")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
