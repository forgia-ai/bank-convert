# Stripe to Polar Migration Plan

## Executive Summary

This document outlines the comprehensive migration plan to switch the Bank Statement Convert application's billing system from Stripe to Polar. Polar offers a more developer-friendly approach with 20% lower fees (4% + 40¢ vs Stripe's typical 4.4% + 30¢) and promises "integrate with 5 lines of code" simplicity.

### 🔍 Current Database Schema Analysis

**Analysis of `user_subscriptions` table reveals**:

**Current Columns:**

- Core fields: `id`, `user_id`, `plan_type`, `status`, timestamps
- **Stripe fields**: `stripe_customer_id`, `stripe_subscription_id`
- **Paddle fields**: `paddle_customer_id`, `paddle_subscription_id`, `paddle_transaction_id`

**Current Indexes:**

- **Stripe indexes**:
  - `idx_user_subscriptions_stripe_customer_id`
  - `idx_user_subscriptions_stripe_subscription_id`
  - `user_subscriptions_stripe_subscription_id_key` (unique)
- **Paddle indexes**:
  - `idx_user_subscriptions_paddle_customer_id`
  - `idx_user_subscriptions_paddle_customer_id_unique`
  - `idx_user_subscriptions_paddle_subscription_id`
  - `idx_user_subscriptions_paddle_subscription_id_unique`
  - `idx_user_subscriptions_paddle_transaction_id`

**Migration Strategy**: Clean up both Stripe and Paddle legacy infrastructure during Polar migration.

## Migration Overview

### Why Polar?

1. **Lower Fees**: 4% + 40¢ vs Stripe's higher fees
2. **Developer-First**: Built specifically for developers and startups
3. **Simplified Integration**: NextJS adapter handles most complexity
4. **Open Source**: Transparent development and community-driven
5. **Merchant of Record**: Built-in tax handling and compliance

### Current Stripe Implementation Analysis

The existing implementation is comprehensive and production-ready:

- ✅ Complete API routes (`/api/stripe/*`)
- ✅ Database schema (`user_subscriptions` table)
- ✅ UI components (pricing page, billing dashboard)
- ✅ Webhook processing and event handling
- ✅ 109 passing tests with comprehensive coverage
- ✅ Client-side integration with context management

## Migration Strategy

### Phase 1: Setup and Preparation (1-2 days)

#### 1.1 Polar Account Setup

- [x] Create Polar account at https://polar.sh/signup
- [x] Create organization for the Bank Statement Convert application
- [x] Generate Organization Access Token (OAT)
- [ ] Configure products in Polar dashboard:
  - Lite Plan: $12/month (yearly) or $20/month
  - Pro Plan: $24/month (yearly) or $40/month

#### 1.2 Environment Configuration

**Required Polar Environment Variables:**

```bash
# Core Polar configuration
POLAR_ACCESS_TOKEN=polar_xxx                    # Organization Access Token from Polar dashboard
POLAR_WEBHOOK_SECRET=whsec_xxx                  # Webhook signing secret

# Four separate product IDs (following Polar's recommendation)
POLAR_LITE_MONTHLY_PRODUCT_ID=prod_xxx         # Lite Monthly ($20/month)
POLAR_LITE_YEARLY_PRODUCT_ID=prod_xxx          # Lite Yearly ($144/year)
POLAR_PRO_MONTHLY_PRODUCT_ID=prod_xxx          # Pro Monthly ($40/month)
POLAR_PRO_YEARLY_PRODUCT_ID=prod_xxx           # Pro Yearly ($288/year)

# Application configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000       # Your app URL for redirects
NODE_ENV=development                            # Affects Polar server endpoint (sandbox vs production)

# Optional: Organization ID (if needed for advanced features)
POLAR_ORGANIZATION_ID=org_xxx

# Remove Stripe environment variables (after migration complete)
# STRIPE_SECRET_KEY (remove)
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (remove)
# STRIPE_WEBHOOK_SECRET (remove)
# STRIPE_PAID1_MONTHLY_PRICE_ID (remove)
# STRIPE_PAID1_YEARLY_PRICE_ID (remove)
# STRIPE_PAID2_MONTHLY_PRICE_ID (remove)
# STRIPE_PAID2_YEARLY_PRICE_ID (remove)
```

#### 1.3 Dependencies Update

```bash
# Remove Stripe dependencies
yarn remove stripe @stripe/stripe-js

# Add Polar dependencies (zod already exists in project)
yarn add @polar-sh/nextjs
```

### Phase 2: Database Schema Migration (1 day)

#### 2.1 Create New Migration

**Note**: Current table contains legacy Stripe and Paddle columns from previous testing that will be cleaned up at the end.

Create `005_add_polar_support.sql`:

```sql
-- Add Polar-specific columns to user_subscriptions table
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS polar_customer_id TEXT,
ADD COLUMN IF NOT EXISTS polar_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS polar_product_id TEXT,
ADD COLUMN IF NOT EXISTS polar_order_id TEXT;

-- Create indexes for Polar IDs for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_polar_customer_id
ON user_subscriptions(polar_customer_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_polar_subscription_id
ON user_subscriptions(polar_subscription_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_polar_product_id
ON user_subscriptions(polar_product_id);

-- Update plan_type enum to support new Polar plan types
-- Keep existing values for backward compatibility during migration
ALTER TABLE user_subscriptions
DROP CONSTRAINT IF EXISTS user_subscriptions_plan_type_check;

ALTER TABLE user_subscriptions
ADD CONSTRAINT user_subscriptions_plan_type_check
CHECK (plan_type IN ('free', 'paid1', 'paid2', 'lite_monthly', 'lite_yearly', 'pro_monthly', 'pro_yearly'));

-- Add migration tracking columns
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS migration_status TEXT DEFAULT 'pending'
CHECK (migration_status IN ('pending', 'migrating', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS migrated_at TIMESTAMP WITH TIME ZONE;
```

#### 2.2 Data Migration Strategy

- Keep existing Stripe data intact during migration
- Gradually migrate users to Polar
- Maintain dual system support during transition period

### Phase 3: Core Integration Implementation (3-4 days)

#### 3.1 Create Polar Integration Layer

**File: `lib/integrations/polar.ts`**

```typescript
import { PolarApi } from "@polar-sh/nextjs"

// Initialize Polar client with environment-based server selection
export const polar = new PolarApi({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
})

// Four separate products following Polar's recommendation
export const POLAR_PLAN_CONFIG = {
  lite_monthly: {
    productId: process.env.POLAR_LITE_MONTHLY_PRODUCT_ID!,
    planType: "lite_monthly" as const,
    name: "Lite Monthly",
    price: 2000, // $20.00 in cents
    billingCycle: "monthly",
    features: ["500 pages/month", "PDF & CSV support", "Priority Email Support"],
  },
  lite_yearly: {
    productId: process.env.POLAR_LITE_YEARLY_PRODUCT_ID!,
    planType: "lite_yearly" as const,
    name: "Lite Yearly",
    price: 14400, // $144.00 in cents (yearly)
    effectiveMonthlyPrice: 1200, // $12.00 in cents
    billingCycle: "yearly",
    features: ["500 pages/month", "PDF & CSV support", "Priority Email Support"],
  },
  pro_monthly: {
    productId: process.env.POLAR_PRO_MONTHLY_PRODUCT_ID!,
    planType: "pro_monthly" as const,
    name: "Pro Monthly",
    price: 4000, // $40.00 in cents
    billingCycle: "monthly",
    features: ["1000 pages/month", "All Lite features", "API Access", "Dedicated Support"],
  },
  pro_yearly: {
    productId: process.env.POLAR_PRO_YEARLY_PRODUCT_ID!,
    planType: "pro_yearly" as const,
    name: "Pro Yearly",
    price: 28800, // $288.00 in cents (yearly)
    effectiveMonthlyPrice: 2400, // $24.00 in cents
    billingCycle: "yearly",
    features: ["1000 pages/month", "All Lite features", "API Access", "Dedicated Support"],
  },
} as const

export type PolarPlanType = keyof typeof POLAR_PLAN_CONFIG

// Helper function to get plan config by product ID
export function getPlanConfigByProductId(
  productId: string,
): (typeof POLAR_PLAN_CONFIG)[PolarPlanType] | null {
  return Object.values(POLAR_PLAN_CONFIG).find((config) => config.productId === productId) || null
}

// Helper function to get plan tier (lite/pro) from plan type
export function getPlanTier(planType: PolarPlanType): "lite" | "pro" {
  return planType.startsWith("lite") ? "lite" : "pro"
}

// Helper function to get billing cycle from plan type
export function getBillingCycle(planType: PolarPlanType): "monthly" | "yearly" {
  return planType.endsWith("yearly") ? "yearly" : "monthly"
}
```

#### 3.2 Replace API Routes

**File: `app/api/polar/checkout/route.ts`**

```typescript
import { Checkout } from "@polar-sh/nextjs"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/integrations/supabase"
import { logger } from "@/lib/utils/logger"
import { i18n } from "@/i18n-config"

// Simple checkout handler using Polar's NextJS adapter
export const GET = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/viewer/billing?success=true`,

  // Optional: Customize the checkout with user data
  async getCheckoutRequest(req, { productId, customerId, ...params }) {
    const url = new URL(req.url!)
    const userLanguage = url.searchParams.get("language") || i18n.defaultLocale

    return {
      productId,
      customerId,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/${userLanguage}/viewer/billing?success=true`,
      metadata: {
        language: userLanguage,
        source: "web_app",
        ...params,
      },
    }
  },
})

// Alternative: Custom checkout creation for complex scenarios
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { productId, language = i18n.defaultLocale } = body

    logger.info({ userId, productId, language }, "Creating Polar checkout session")

    const supabase = createServerSupabaseClient()

    // Get or create customer information
    let customerId = ""
    const { data: existingUser } = await supabase
      .from("user_subscriptions")
      .select("polar_customer_id")
      .eq("user_id", userId)
      .maybeSingle()

    if (existingUser?.polar_customer_id) {
      customerId = existingUser.polar_customer_id
    } else {
      // Get user email from Clerk for customer creation
      try {
        const clerk = await clerkClient()
        const user = await clerk.users.getUser(userId)
        const userEmail = user.emailAddresses[0]?.emailAddress

        if (userEmail) {
          customerId = userEmail // Polar will create customer from email
        }
      } catch (error) {
        logger.warn({ userId, error }, "Failed to get user email from Clerk")
      }
    }

    // Build checkout URL with proper parameters
    const checkoutUrl = new URL("/api/polar/checkout", process.env.NEXT_PUBLIC_APP_URL!)
    checkoutUrl.searchParams.set("productId", productId)
    if (customerId) checkoutUrl.searchParams.set("customerId", customerId)
    checkoutUrl.searchParams.set("language", language)
    checkoutUrl.searchParams.set("metadata[userId]", userId)

    return Response.json({ checkoutUrl: checkoutUrl.toString() })
  } catch (error) {
    logger.error({ error }, "Failed to create Polar checkout")
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
```

**File: `app/api/polar/portal/route.ts`**

```typescript
import { CustomerPortal } from "@polar-sh/nextjs"
import { NextRequest } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "@/lib/integrations/supabase"

export const GET = CustomerPortal({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
  getCustomerId: async (req: NextRequest) => {
    const { userId } = await auth()
    if (!userId) {
      throw new Error("User not authenticated")
    }

    const supabase = createServerSupabaseClient()
    const { data: user } = await supabase
      .from("user_subscriptions")
      .select("polar_customer_id")
      .eq("user_id", userId)
      .single()

    if (!user?.polar_customer_id) {
      throw new Error("No customer found")
    }

    return user.polar_customer_id
  },
})
```

**File: `app/api/polar/webhooks/route.ts`**

```typescript
import { Webhooks } from "@polar-sh/nextjs"
import { updateUserSubscriptionFromPolar } from "@/lib/subscriptions/polar-service"
import { updateUserPlan } from "@/lib/subscriptions/management"
import { logger } from "@/lib/utils/logger"
import { getPlanConfigByProductId } from "@/lib/integrations/polar"

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,

  // Handle checkout creation (initial step)
  onCheckoutCreated: async (payload) => {
    const { checkout } = payload
    logger.info({ checkoutId: checkout.id }, "Polar checkout created")
  },

  // Handle successful order creation (payment completed)
  onOrderCreated: async (payload) => {
    const { order } = payload
    const userId = order.metadata?.userId

    if (!userId) {
      logger.warn({ orderId: order.id }, "Order created without userId in metadata")
      return
    }

    try {
      // Get plan information from product ID
      const planConfig = getPlanConfigByProductId(order.productId)
      if (!planConfig) {
        logger.error({ productId: order.productId }, "Unknown product ID in order")
        return
      }

      // Update user subscription in database
      await updateUserSubscriptionFromPolar({
        userId,
        order,
        planType: planConfig.planType,
        status: "active",
      })

      // Update user plan in usage tracking
      await updateUserPlan(userId, planConfig.planType)

      logger.info(
        { userId, orderId: order.id, planType: planConfig.planType },
        "Order processed and subscription activated",
      )
    } catch (error) {
      logger.error({ error, userId, orderId: order.id }, "Failed to process order")
    }
  },

  // Handle subscription creation (for recurring subscriptions)
  onSubscriptionCreated: async (payload) => {
    const { subscription } = payload
    const userId = subscription.metadata?.userId

    if (!userId) {
      logger.warn({ subscriptionId: subscription.id }, "Subscription created without userId")
      return
    }

    try {
      const planConfig = getPlanConfigByProductId(subscription.productId)
      if (!planConfig) {
        logger.error({ productId: subscription.productId }, "Unknown product ID in subscription")
        return
      }

      await updateUserSubscriptionFromPolar({
        userId,
        subscription,
        planType: planConfig.planType,
        status: "active",
      })

      logger.info(
        { userId, subscriptionId: subscription.id, planType: planConfig.planType },
        "Subscription created and activated",
      )
    } catch (error) {
      logger.error(
        { error, userId, subscriptionId: subscription.id },
        "Failed to create subscription",
      )
    }
  },

  // Handle subscription updates (plan changes, cancellations, etc.)
  onSubscriptionUpdated: async (payload) => {
    const { subscription } = payload
    const userId = subscription.metadata?.userId

    if (!userId) {
      logger.warn({ subscriptionId: subscription.id }, "Subscription updated without userId")
      return
    }

    try {
      const planConfig = getPlanConfigByProductId(subscription.productId)
      const planType = planConfig?.planType || "free"

      await updateUserSubscriptionFromPolar({
        userId,
        subscription,
        planType,
        status: subscription.status,
      })

      // Update user plan based on subscription status
      if (subscription.status === "active") {
        await updateUserPlan(userId, planType)
      } else if (subscription.status === "canceled") {
        await updateUserPlan(userId, "free")
      }

      logger.info(
        { userId, subscriptionId: subscription.id, status: subscription.status, planType },
        "Subscription updated",
      )
    } catch (error) {
      logger.error(
        { error, userId, subscriptionId: subscription.id },
        "Failed to update subscription",
      )
    }
  },

  // Handle subscription cancellations
  onSubscriptionCanceled: async (payload) => {
    const { subscription } = payload
    const userId = subscription.metadata?.userId

    if (!userId) {
      logger.warn({ subscriptionId: subscription.id }, "Subscription canceled without userId")
      return
    }

    try {
      // Revert user to free plan
      await updateUserPlan(userId, "free")

      await updateUserSubscriptionFromPolar({
        userId,
        subscription,
        planType: "free",
        status: "canceled",
      })

      logger.info(
        { userId, subscriptionId: subscription.id },
        "Subscription canceled, user reverted to free plan",
      )
    } catch (error) {
      logger.error(
        { error, userId, subscriptionId: subscription.id },
        "Failed to cancel subscription",
      )
    }
  },

  // General error handler
  onPayload: async (payload) => {
    logger.info({ eventType: payload.type }, "Polar webhook received")
  },
})
```

#### 3.3 Create Polar Service Layer

**File: `lib/subscriptions/polar-service.ts`**

```typescript
import { polar } from "@/lib/integrations/polar"
import { createServerSupabaseClient } from "@/lib/integrations/supabase"
import { logger } from "@/lib/utils/logger"

export async function createPolarCheckout(
  userId: string,
  planType: "lite" | "pro",
  billingCycle: "monthly" | "yearly",
) {
  try {
    const checkout = await polar.checkouts.create({
      productId: POLAR_PLAN_CONFIG[planType].productId,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      metadata: {
        userId,
        planType,
        billingCycle,
      },
    })

    return { success: true, checkoutUrl: checkout.url }
  } catch (error) {
    logger.error({ error, userId, planType }, "Failed to create Polar checkout")
    return { success: false, error: "Failed to create checkout session" }
  }
}

export async function getUserPolarCustomerId(userId: string): Promise<string | null> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("polar_customer_id")
    .eq("user_id", userId)
    .single()

  if (error || !data?.polar_customer_id) {
    return null
  }

  return data.polar_customer_id
}

export async function updateUserSubscriptionFromPolar(params: {
  userId: string
  checkout?: any
  subscription?: any
  status: string
}) {
  const { userId, checkout, subscription, status } = params
  const supabase = createServerSupabaseClient()

  try {
    await supabase.from("user_subscriptions").upsert({
      user_id: userId,
      polar_customer_id: checkout?.customerId || subscription?.customerId,
      polar_subscription_id: subscription?.id,
      polar_checkout_id: checkout?.id,
      plan_type: checkout?.metadata?.planType || subscription?.metadata?.planType,
      status,
      migration_status: "completed",
      updated_at: new Date().toISOString(),
    })

    // Update user plan in usage table
    await updateUserPlan(userId, checkout?.metadata?.planType || subscription?.metadata?.planType)

    logger.info({ userId, status }, "Successfully updated user subscription from Polar")
  } catch (error) {
    logger.error({ error, userId }, "Failed to update user subscription from Polar")
    throw error
  }
}
```

#### 3.4 Update Client-Side Integration

**File: `lib/polar/client.ts`**

```typescript
import { POLAR_PLAN_CONFIG, type PolarPlanType } from "@/lib/integrations/polar"

// Create Polar checkout using the simplified approach
export async function createPolarCheckout(planType: PolarPlanType, language: string = "en") {
  try {
    const planConfig = POLAR_PLAN_CONFIG[planType]
    if (!planConfig) {
      throw new Error(`Invalid plan type: ${planType}`)
    }

    // Use the GET endpoint with query parameters (simplest approach)
    const checkoutUrl = new URL("/api/polar/checkout", window.location.origin)
    checkoutUrl.searchParams.set("productId", planConfig.productId)
    checkoutUrl.searchParams.set("language", language)
    checkoutUrl.searchParams.set("metadata[planType]", planType)
    checkoutUrl.searchParams.set("metadata[billingCycle]", planConfig.billingCycle)

    // Redirect to Polar checkout
    window.location.href = checkoutUrl.toString()
  } catch (error) {
    console.error("Error creating Polar checkout:", error)
    throw error
  }
}

// Alternative: Use POST endpoint for more control
export async function createPolarCheckoutWithCustomLogic(
  planType: PolarPlanType,
  language: string = "en",
) {
  try {
    const planConfig = POLAR_PLAN_CONFIG[planType]
    if (!planConfig) {
      throw new Error(`Invalid plan type: ${planType}`)
    }

    const response = await fetch("/api/polar/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: planConfig.productId,
        language,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to create checkout session")
    }

    const { checkoutUrl } = await response.json()

    if (checkoutUrl) {
      window.location.href = checkoutUrl
    } else {
      throw new Error("No checkout URL returned")
    }
  } catch (error) {
    console.error("Error creating Polar checkout:", error)
    throw error
  }
}

// Access Polar customer portal
export async function createPolarPortalSession() {
  try {
    // Simple redirect to portal endpoint
    window.location.href = "/api/polar/portal"
  } catch (error) {
    console.error("Error accessing Polar portal:", error)
    throw error
  }
}

// Helper function to get plan display information
export function getPlanDisplayInfo(planType: PolarPlanType) {
  const config = POLAR_PLAN_CONFIG[planType]
  if (!config) return null

  return {
    name: config.name,
    price: config.price,
    effectiveMonthlyPrice: config.effectiveMonthlyPrice || config.price,
    billingCycle: config.billingCycle,
    features: config.features,
  }
}
```

### Phase 4: UI Components Update (2 days)

#### 4.1 Update Pricing Component

**File: `components/pricing/PricingClient.tsx`**

```typescript
// Replace Stripe imports
import { createPolarCheckout, type PolarPlanType } from "@/lib/polar/client"

// Update plan selection handler
const handlePlanSelection = async (planName: string) => {
  if (!isSignedIn) {
    router.push(`/${lang}/sign-up`)
    return
  }

  if (planName === "Free") {
    // Handle free plan
    setIsLoading(true)
    try {
      await subscribeToPlan("free")
      router.push(`/${lang}/viewer`)
    } catch (error) {
      console.error("Failed to subscribe to free plan:", error)
      toast.error("Failed to activate free plan")
    } finally {
      setIsLoading(false)
    }
    return
  }

  // Map plan names to Polar plan types (including billing cycle)
  const planMap: Record<string, PolarPlanType> = {
    Lite_monthly: "lite_monthly",
    Lite_yearly: "lite_yearly",
    Pro_monthly: "pro_monthly",
    Pro_yearly: "pro_yearly",
  }

  // Build plan key based on name and billing cycle
  const billingCycle = isAnnual ? "yearly" : "monthly"
  const planKey = `${planName}_${billingCycle}`
  const planType = planMap[planKey]

  if (planType) {
    setIsLoading(true)
    try {
      await createPolarCheckout(planType, lang)
    } catch (error) {
      console.error("Failed to create checkout session:", error)
      toast.error("Failed to start checkout process")
    } finally {
      setIsLoading(false)
    }
  }
}
```

#### 4.2 Update Billing Dashboard

**File: `app/[lang]/viewer/billing/page.tsx`**

```typescript
// Replace Stripe portal with Polar portal
import { createPolarPortalSession } from "@/lib/polar/client"

const handleManageSubscription = async () => {
  try {
    await createPolarPortalSession()
  } catch (error) {
    console.error("Failed to open customer portal:", error)
    toast.error("Failed to open subscription management")
  }
}
```

#### 4.3 Update Context Management

**File: `contexts/user-limits-context.tsx`**

```typescript
// Update subscribeToPlan function to use Polar for paid plans
const subscribeToPlan = async (plan: SubscriptionPlan) => {
  try {
    if (!isSignedIn) {
      throw new Error("User must be authenticated to subscribe to a plan")
    }

    if (plan === "free") {
      // Handle free plan directly
      const result = await updateUserSubscriptionPlan(plan as PlanType)
      // ... existing free plan logic
    } else {
      // For paid plans, redirect to Polar checkout
      // Map legacy plan types to new Polar plan types
      const planMap: Record<string, PolarPlanType> = {
        paid1: "lite_monthly", // Default to monthly for legacy compatibility
        paid2: "pro_monthly",
        lite_monthly: "lite_monthly",
        lite_yearly: "lite_yearly",
        pro_monthly: "pro_monthly",
        pro_yearly: "pro_yearly",
      }

      const polarPlan = planMap[plan]
      if (polarPlan) {
        await createPolarCheckout(polarPlan, lang || "en")
      } else {
        throw new Error(`Invalid plan type: ${plan}`)
      }
    }
  } catch (error) {
    console.error("Error subscribing to plan:", error)
    throw error
  }
}
```

### Phase 5: Testing and Validation (2-3 days)

#### 5.1 Create Polar-Specific Tests

**File: `tests/lib/polar/client.test.ts`**

```typescript
import { createPolarCheckout, createPolarPortalSession } from "@/lib/polar/client"

// Mock fetch
global.fetch = jest.fn()

describe("Polar Client", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    })
  })

  describe("createPolarCheckout", () => {
    it("should create checkout and redirect to Polar", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ checkoutUrl: "https://polar.sh/checkout/123" }),
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      await createPolarCheckout("lite", "monthly")

      expect(fetch).toHaveBeenCalledWith("/api/polar/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType: "lite", billingCycle: "monthly" }),
      })

      expect(window.location.href).toBe("https://polar.sh/checkout/123")
    })

    it("should handle checkout creation errors", async () => {
      const mockResponse = {
        ok: false,
        json: async () => ({ error: "Invalid plan" }),
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      await expect(createPolarCheckout("lite", "monthly")).rejects.toThrow("Invalid plan")
    })
  })

  describe("createPolarPortalSession", () => {
    it("should create portal session and redirect", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ url: "https://polar.sh/portal/123" }),
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      await createPolarPortalSession()

      expect(fetch).toHaveBeenCalledWith("/api/polar/portal", {
        method: "GET",
      })

      expect(window.location.href).toBe("https://polar.sh/portal/123")
    })
  })
})
```

#### 5.2 Update Integration Tests

**File: `tests/lib/integrations/polar.test.ts`**

```typescript
import { polar, POLAR_PLAN_CONFIG } from "@/lib/integrations/polar"

describe("Polar Integration", () => {
  describe("POLAR_PLAN_CONFIG", () => {
    it("should have correct plan configurations", () => {
      expect(POLAR_PLAN_CONFIG.lite).toEqual({
        productId: expect.any(String),
        name: "Lite",
        monthlyPrice: 2000,
        yearlyPrice: 1200,
        features: expect.arrayContaining(["500 pages/month"]),
      })

      expect(POLAR_PLAN_CONFIG.pro).toEqual({
        productId: expect.any(String),
        name: "Pro",
        monthlyPrice: 4000,
        yearlyPrice: 2400,
        features: expect.arrayContaining(["1000 pages/month"]),
      })
    })
  })

  describe("polar client", () => {
    it("should be properly configured", () => {
      expect(polar).toBeDefined()
      expect(polar.accessToken).toBe(process.env.POLAR_ACCESS_TOKEN)
    })
  })
})
```

#### 5.3 End-to-End Testing

**Test Scenarios:**

1. **Checkout Flow**

   - [ ] User can select Lite plan and complete checkout
   - [ ] User can select Pro plan and complete checkout
   - [ ] Monthly and yearly billing cycles work correctly
   - [ ] Success/cancel redirects work properly

2. **Subscription Management**

   - [ ] User can access customer portal
   - [ ] Plan upgrades/downgrades work correctly
   - [ ] Subscription cancellation works properly

3. **Webhook Processing**

   - [ ] Checkout completion updates database correctly
   - [ ] Subscription updates are processed properly
   - [ ] User plan limits are updated correctly

4. **Error Handling**
   - [ ] Invalid plans are handled gracefully
   - [ ] Network errors don't break the UI
   - [ ] Authentication errors are handled properly

### Phase 6: Deployment and Migration (1-2 days)

#### 6.1 Deployment Strategy

**Staging Environment:**

1. Deploy Polar integration to staging
2. Test with Polar sandbox environment
3. Validate all functionality works correctly
4. Run automated test suite

**Production Deployment:**

1. **Blue-Green Deployment Approach:**
   - Keep Stripe integration running (blue)
   - Deploy Polar integration alongside (green)
   - Feature flag to control which system to use
   - Gradual migration of users

#### 6.2 Migration Execution

**Week 1: Soft Launch**

- Enable Polar for new user registrations only
- Keep existing Stripe users on Stripe
- Monitor error rates and performance

**Week 2-3: Gradual Migration**

- Migrate 25% of existing users to Polar
- Monitor subscription renewals and billing
- Address any issues that arise

**Week 4: Full Migration**

- Migrate remaining users to Polar
- Disable Stripe checkout for new subscriptions
- Keep Stripe portal active for existing subscriptions

**Week 5-6: Cleanup**

- Cancel remaining Stripe subscriptions
- Remove Stripe code and dependencies
- Archive Stripe-related database columns

#### 6.3 Rollback Plan

**Immediate Rollback (if critical issues):**

- Feature flag to switch back to Stripe
- Database rollback scripts available
- User communication strategy

**Gradual Rollback (if needed):**

- Move users back to Stripe in batches
- Preserve all billing data
- Communicate changes to users

### Phase 7: Cleanup and Optimization (1 day)

#### 7.1 Remove Stripe Dependencies

**Remove Files:**

- `lib/integrations/stripe.ts`
- `lib/stripe/client.ts`
- `app/api/stripe/` (entire directory)
- All Stripe-related test files

**Update Package.json:**

```bash
# Remove from package.json dependencies
yarn remove stripe @stripe/stripe-js
```

#### 7.2 Database Cleanup

**Create Final Migration: `006_cleanup_legacy_billing.sql`**

```sql
-- Remove Stripe indexes first
DROP INDEX IF EXISTS idx_user_subscriptions_stripe_customer_id;
DROP INDEX IF EXISTS idx_user_subscriptions_stripe_subscription_id;
DROP INDEX IF EXISTS user_subscriptions_stripe_subscription_id_key;

-- Remove Paddle indexes
DROP INDEX IF EXISTS idx_user_subscriptions_paddle_customer_id;
DROP INDEX IF EXISTS idx_user_subscriptions_paddle_customer_id_unique;
DROP INDEX IF EXISTS idx_user_subscriptions_paddle_subscription_id;
DROP INDEX IF EXISTS idx_user_subscriptions_paddle_subscription_id_unique;
DROP INDEX IF EXISTS idx_user_subscriptions_paddle_transaction_id;

-- Remove Stripe-specific columns (after ensuring all users migrated)
ALTER TABLE user_subscriptions
DROP COLUMN IF EXISTS stripe_customer_id,
DROP COLUMN IF EXISTS stripe_subscription_id;

-- Remove Paddle-specific columns from previous testing
ALTER TABLE user_subscriptions
DROP COLUMN IF EXISTS paddle_customer_id,
DROP COLUMN IF EXISTS paddle_subscription_id,
DROP COLUMN IF EXISTS paddle_transaction_id;

-- Update plan_type constraint to only include Polar plans
ALTER TABLE user_subscriptions
DROP CONSTRAINT IF EXISTS user_subscriptions_plan_type_check;

ALTER TABLE user_subscriptions
ADD CONSTRAINT user_subscriptions_plan_type_check
CHECK (plan_type IN ('free', 'lite', 'pro'));

-- Remove migration status column
ALTER TABLE user_subscriptions
DROP COLUMN IF EXISTS migration_status;
```

#### 7.3 Documentation Updates

**Update Files:**

- `docs/billing-system-plan.md` → Update to reflect Polar integration
- `README.md` → Update setup instructions
- Environment variable documentation

## Risk Assessment and Mitigation

### High Risk Areas

1. **Revenue Disruption**

   - **Risk**: Failed subscriptions during migration
   - **Mitigation**: Gradual migration, rollback plan, dual system support

2. **Data Loss**

   - **Risk**: Subscription data corruption
   - **Mitigation**: Database backups, staged migration, data validation

3. **User Experience**
   - **Risk**: Broken checkout flows, confused users
   - **Mitigation**: Thorough testing, clear communication, support preparation

### Medium Risk Areas

1. **Webhook Reliability**

   - **Risk**: Missed webhook events
   - **Mitigation**: Webhook retry logic, monitoring, manual reconciliation

2. **Integration Complexity**
   - **Risk**: Polar integration more complex than expected
   - **Mitigation**: Proof of concept first, fallback to Stripe

### Low Risk Areas

1. **Performance Impact**
   - **Risk**: Polar API slower than Stripe
   - **Mitigation**: Performance monitoring, caching strategies

## Conclusion

This migration plan provides a comprehensive approach to switching from Stripe to Polar while minimizing risk and ensuring business continuity. The phased approach allows for thorough testing and validation at each step, with clear rollback procedures if issues arise.

The key to success will be:

1. **Thorough Testing**: Comprehensive test coverage before deployment
2. **Gradual Migration**: Staged rollout to minimize risk
3. **Clear Communication**: Keeping users and team informed throughout
4. **Monitoring**: Continuous monitoring of key metrics during migration
5. **Support Readiness**: Prepared support team for any user issues

The estimated timeline of 2.5-3.5 weeks provides adequate buffer for thorough testing and validation, ensuring a smooth transition to Polar's developer-friendly billing platform.

## Tasks

- [x] Test all plans
- [x] Test cancel and upgrade (including uncancellation)
- [x] Add comprehensive unit tests (73 tests total)
- [x] Test plan changes (upgrades/downgrades) ✨

### Plan Change Handling ✨ NEW

The webhook system now properly handles plan upgrades and downgrades:

**✅ Plan Change Detection:**

- Compares current subscription plan with new plan from webhook
- Detects upgrades (paid1 → paid2) and downgrades (paid2 → paid1)
- Handles billing cycle changes (monthly ↔ yearly)

**✅ Usage Tracking Updates:**

- Calls `updateUserPlan()` when plan changes are detected
- Updates user limits immediately (500 pages → 1000 pages for upgrades)
- Preserves subscription status during plan changes

**✅ Comprehensive Logging:**

- Logs upgrade/downgrade events with plan details
- Tracks old plan → new plan transitions
- Distinguishes between plan changes vs billing period updates

**✅ Test Coverage:**

- 27 webhook handler tests including plan change scenarios
- Tests upgrade, downgrade, and no-change scenarios
- Validates usage tracking integration
