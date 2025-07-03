"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, ExternalLink, CheckCircle } from "lucide-react"
import { useUserLimits } from "@/contexts/user-limits-context"
import { createPortalSession } from "@/lib/stripe/client"
import { toast } from "sonner"
import type { getDictionary } from "@/lib/utils/get-dictionary"
import { type Locale } from "@/i18n-config"

// Define the common section interface for type safety
interface DictionaryCommon {
  plan_price_monthly?: string
  pages_per_month?: string
}

// Create a type that extends the base dictionary with explicit common section
type Dictionary = Awaited<ReturnType<typeof getDictionary>> & {
  common: DictionaryCommon
}

interface BillingWorkflowProps {
  lang: Locale
  dictionary: Dictionary
}

export default function BillingWorkflow({ lang, dictionary }: BillingWorkflowProps) {
  const { userLimits, refreshLimits, isLoading: isLoadingPlan } = useUserLimits()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPortalLoading, setIsPortalLoading] = useState(false)

  const t = dictionary.billing_page

  // Check for successful checkout
  useEffect(() => {
    const sessionId = searchParams.get("session_id")
    if (sessionId) {
      toast.success(t.payment_successful)
      // Refresh user limits to get updated plan info
      refreshLimits()
      // Clean up URL
      router.replace(`/${lang}/viewer/billing`)
    }
  }, [searchParams, refreshLimits, router, lang, t.payment_successful])

  const usagePercentage = userLimits.usagePercentage

  // Handle manage subscription button
  const handleManageSubscription = async () => {
    if (userLimits.subscriptionPlan === "free") {
      router.push(`/${lang}/pricing`)
      return
    }

    setIsPortalLoading(true)
    try {
      await createPortalSession()
    } catch (error) {
      // Show more specific error messages
      const errorMessage = error instanceof Error ? error.message : t.billing_portal_error
      toast.error(errorMessage)
      console.error("Error opening billing portal:", error)
    } finally {
      setIsPortalLoading(false)
    }
  }

  // Get plan display name
  const getPlanDisplayName = () => {
    switch (userLimits.subscriptionPlan) {
      case "free":
        return dictionary.plans.free
      case "paid1":
        return dictionary.plans.growth
      case "paid2":
        return dictionary.plans.premium
      default:
        return dictionary.plans.unknown
    }
  }

  // Get subscription status badge variant
  const getStatusVariant = () => {
    if (userLimits.subscriptionPlan === "free") return "secondary"
    return "default"
  }

  // Format plan price
  const getPlanPrice = () => {
    if (userLimits.subscriptionPlan === "free") {
      return t.plan_price_free
    }
    // For paid plans, combine the price with localized frequency text
    const basePrice = userLimits.planPrice || "$0"
    return `${basePrice}${dictionary.common?.plan_price_monthly || "/month"}`
  }

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div>
      <div className="px-6 md:px-0">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{t.title}</h1>
        <p className="text-muted-foreground mb-8">{t.subtitle}</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Current Plan Card Skeleton */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t.current_subscription}</CardTitle>
            <CardDescription>{t.subscription_overview}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-baseline">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-6 w-20" />
            </div>
            <div>
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>{t.page_usage}</span>
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
            <Skeleton className="h-4 w-48" />
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Skeleton className="h-10 w-32" />
          </CardFooter>
        </Card>

        {/* Plan Features Card Skeleton */}
        <Card>
          <CardHeader>
            <CardTitle>{t.plan_features}</CardTitle>
            <CardDescription>{t.plan_features_description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    </div>
  )

  if (isLoadingPlan) {
    return <LoadingSkeleton />
  }

  return (
    <div>
      <div className="px-6 md:px-0">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{t.title}</h1>
        <p className="text-muted-foreground mb-8">{t.subtitle}</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Current Plan Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t.current_subscription}</CardTitle>
            <div className="flex items-center justify-between">
              <CardDescription>{t.subscription_overview}</CardDescription>
              <Badge variant={getStatusVariant()}>
                {userLimits.subscriptionPlan === "free" ? t.status_free : t.status_active}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-baseline">
              <h3 className="text-2xl font-semibold">{getPlanDisplayName()}</h3>
              <p className="text-lg font-medium text-muted-foreground">{getPlanPrice()}</p>
            </div>

            <div>
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>{t.page_usage}</span>
                <span>
                  {userLimits.currentUsage} / {userLimits.limit} pages
                </span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
              {userLimits.isCritical && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md flex items-start text-sm text-red-700">
                  <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                  {t.usage_critical_warning.replace(
                    "{percentage}",
                    Math.round(usagePercentage).toString(),
                  )}
                </div>
              )}
              {userLimits.isNearLimit && !userLimits.isCritical && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start text-sm text-yellow-700">
                  <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                  {t.usage_warning.replace(
                    "{limitType}",
                    userLimits.isMonthlyLimit ? "monthly" : "total",
                  )}
                </div>
              )}
            </div>
            {userLimits.resetDate && (
              <div className="text-sm">
                {userLimits.isCancelled ? (
                  <div className="space-y-1">
                    <p className="text-orange-600 font-medium">{t.subscription_cancelled}</p>
                    <p className="text-muted-foreground">
                      {t.access_until.replace(
                        "{date}",
                        new Date(userLimits.expiresAt || userLimits.resetDate).toLocaleDateString(
                          lang,
                        ),
                      )}
                    </p>
                    {userLimits.cancelledAt && (
                      <p className="text-xs text-muted-foreground">
                        {t.cancelled_on.replace(
                          "{date}",
                          new Date(userLimits.cancelledAt).toLocaleDateString(lang),
                        )}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    {t.plan_renews_on.replace(
                      "{date}",
                      new Date(userLimits.resetDate).toLocaleDateString(lang),
                    )}
                  </p>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              disabled={isPortalLoading}
              className="flex items-center gap-2 cursor-pointer"
            >
              {userLimits.subscriptionPlan === "free" ? (
                <>{t.upgrade_plan}</>
              ) : (
                <>
                  {t.manage_subscription}
                  <ExternalLink className="h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Plan Features Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t.plan_features}</CardTitle>
            <CardDescription>{t.plan_features_description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>
                  {userLimits.limit} pages{" "}
                  {userLimits.isMonthlyLimit ? t.features.pages_monthly : "total"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>{t.features.pdf_csv_support}</span>
              </div>
              {userLimits.subscriptionPlan !== "free" && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>{t.features.priority_support}</span>
                  </div>
                  {userLimits.subscriptionPlan === "paid2" && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>{t.features.advanced_features}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
          {userLimits.subscriptionPlan === "free" && (
            <CardFooter>
              <Button
                className="w-full cursor-pointer"
                onClick={() => router.push(`/${lang}/pricing`)}
              >
                {t.view_all_plans}
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}
