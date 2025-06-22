import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import {
  createStripeClient,
  getStripeWebhookSecret,
  getPlanTypeFromPriceId,
} from "@/lib/integrations/stripe"

import { upsertSubscription } from "@/lib/subscriptions/management"
import { logger } from "@/lib/utils/logger"
import Stripe from "stripe"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get("stripe-signature")

    if (!signature) {
      logger.error("Missing stripe-signature header")
      return NextResponse.json({ error: "Missing signature" }, { status: 400 })
    }

    // Verify webhook signature
    const stripe = createStripeClient()
    const webhookSecret = getStripeWebhookSecret()

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      logger.error({ error: err }, "Webhook signature verification failed")
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    logger.info({ eventType: event.type, eventId: event.id }, "Processing Stripe webhook")

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      default:
        logger.info({ eventType: event.type }, "Unhandled webhook event type")
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error({ error }, "Error processing webhook")
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id || session.metadata?.userId

  if (!userId) {
    logger.error({ sessionId: session.id }, "No user ID found in checkout session")
    return
  }

  logger.info({ userId, sessionId: session.id }, "Processing checkout completion")

  // Create or update subscription using the new management system
  const planType = (session.metadata?.planType as "free" | "paid1" | "paid2") || "free"

  try {
    await upsertSubscription({
      user_id: userId,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      plan_type: planType,
      status: "active",
    })

    logger.info({ userId, planType }, "Successfully processed checkout completion")
  } catch (error) {
    logger.error({ error, userId }, "Failed to process checkout completion")
    throw error
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId

  if (!userId) {
    logger.error({ subscriptionId: subscription.id }, "No user ID found in subscription metadata")
    return
  }

  // Determine plan type from the subscription items
  let planType: "free" | "paid1" | "paid2" = "free"

  if (subscription.items.data.length > 0) {
    const priceId = subscription.items.data[0].price.id
    const detectedPlanType = getPlanTypeFromPriceId(priceId)
    if (detectedPlanType) {
      planType = detectedPlanType
    }
  }

  logger.info(
    { userId, subscriptionId: subscription.id, planType },
    "Processing subscription update",
  )

  // Update subscription using the new management system
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscriptionAny = subscription as any

    await upsertSubscription({
      user_id: userId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      plan_type: planType,
      status: subscription.status as
        | "active"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "past_due"
        | "trialing"
        | "unpaid",
      current_period_start: subscriptionAny.current_period_start
        ? new Date(subscriptionAny.current_period_start * 1000)
        : undefined,
      current_period_end: subscriptionAny.current_period_end
        ? new Date(subscriptionAny.current_period_end * 1000)
        : undefined,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : undefined,
    })

    logger.info(
      { userId, planType, status: subscription.status },
      "Successfully processed subscription update",
    )
  } catch (error) {
    logger.error({ error, userId }, "Failed to process subscription update")
    throw error
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId

  if (!userId) {
    logger.error({ subscriptionId: subscription.id }, "No user ID found in subscription metadata")
    return
  }

  logger.info({ userId, subscriptionId: subscription.id }, "Processing subscription deletion")

  // Update subscription to canceled using the new management system
  try {
    await upsertSubscription({
      user_id: userId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      plan_type: "free", // Revert to free plan
      status: "canceled",
      canceled_at: new Date(),
    })

    logger.info({ userId }, "Successfully processed subscription deletion")
  } catch (error) {
    logger.error({ error, userId }, "Failed to process subscription deletion")
    throw error
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // For subscription renewals, we might want to log successful payments
  // or update billing history in the future
  logger.info({ invoiceId: invoice.id, customerId: invoice.customer }, "Payment succeeded")
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Handle failed payments - might want to update subscription status
  // or send notifications to users
  logger.warn({ invoiceId: invoice.id, customerId: invoice.customer }, "Payment failed")

  // You might want to update subscription status to 'past_due' here
  // based on your business logic
}
