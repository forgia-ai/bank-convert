import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createStripeClient, getPlanConfig } from "@/lib/integrations/stripe"
import { createServerSupabaseClient } from "@/lib/integrations/supabase"
import { logger } from "@/lib/utils/logger"
import { z } from "zod"

// Request validation schema
const CreateCheckoutSessionSchema = z.object({
  planType: z.enum(["paid1", "paid2"]),
  billingCycle: z.enum(["monthly", "yearly"]),
})

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { planType, billingCycle } = CreateCheckoutSessionSchema.parse(body)

    logger.info({ userId, planType, billingCycle }, "Creating Stripe checkout session")

    // Get plan configuration
    const planConfig = getPlanConfig(planType)
    if (!planConfig) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 })
    }

    // Get the appropriate price ID based on billing cycle
    const priceId =
      billingCycle === "yearly" ? planConfig.yearlyPriceId : planConfig.monthlyPriceId

    if (!priceId) {
      logger.error({ planType, billingCycle }, "Missing price ID for plan configuration")
      return NextResponse.json({ error: "Plan configuration error" }, { status: 500 })
    }

    // Initialize Stripe and Supabase clients
    const stripe = createStripeClient()
    const supabase = createServerSupabaseClient()

    // Check if user already has a Stripe customer ID
    const { data: existingSubscription } = await supabase
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle()

    let customerId = existingSubscription?.stripe_customer_id

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      // Get user details from Clerk (you might want to get email from Clerk user)
      const customer = await stripe.customers.create({
        metadata: {
          userId: userId,
        },
      })
      customerId = customer.id

      // Store customer ID in database
      await supabase.from("user_subscriptions").upsert(
        {
          user_id: userId,
          stripe_customer_id: customerId,
          plan_type: "free", // Will be updated by webhook
          status: "incomplete",
        },
        {
          onConflict: "user_id",
          ignoreDuplicates: false,
        },
      )

      logger.info({ userId, customerId }, "Created new Stripe customer")
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${request.nextUrl.origin}/en/viewer/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/en/pricing`,
      client_reference_id: userId,
      metadata: {
        userId: userId,
        planType: planType,
        billingCycle: billingCycle,
      },
      subscription_data: {
        metadata: {
          userId: userId,
          planType: planType,
        },
      },
    })

    logger.info({ userId, sessionId: session.id }, "Created Stripe checkout session")

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error({ error: error.errors }, "Invalid request data")
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    logger.error({ error }, "Error creating checkout session")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
