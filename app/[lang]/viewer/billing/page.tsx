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
import { Separator } from "@/components/ui/separator"
import { CreditCard, FileText, AlertTriangle, ExternalLink, CheckCircle } from "lucide-react"
import { useUserLimits } from "@/contexts/user-limits-context"
import { createPortalSession } from "@/lib/stripe/client"
import { toast } from "sonner"

export default function BillingPage() {
  const { userLimits, refreshLimits } = useUserLimits()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)

  // Check for successful checkout
  useEffect(() => {
    const sessionId = searchParams.get("session_id")
    if (sessionId) {
      toast.success("Payment successful! Your subscription is now active.")
      // Refresh user limits to get updated plan info
      refreshLimits()
      // Clean up URL
      router.replace("/en/viewer/billing")
    }
  }, [searchParams, refreshLimits, router])

  const usagePercentage = userLimits.usagePercentage

  // Handle manage subscription button
  const handleManageSubscription = async () => {
    if (userLimits.subscriptionPlan === "free") {
      router.push("/en/pricing")
      return
    }

    setIsLoading(true)
    try {
      await createPortalSession()
    } catch (error) {
      // Show more specific error messages
      const errorMessage = error instanceof Error ? error.message : "Failed to open billing portal"
      toast.error(errorMessage)
      console.error("Error opening billing portal:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Get plan display name
  const getPlanDisplayName = () => {
    switch (userLimits.subscriptionPlan) {
      case "free":
        return "Free Plan"
      case "paid1":
        return "Growth Plan"
      case "paid2":
        return "Premium Plan"
      default:
        return "Unknown Plan"
    }
  }

  // Get subscription status badge variant
  const getStatusVariant = () => {
    if (userLimits.subscriptionPlan === "free") return "secondary"
    return "default"
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Billing & Subscription</h1>
      <p className="text-muted-foreground mb-8">
        Manage your subscription, view billing history, and update payment methods.
      </p>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Current Plan Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <div className="flex items-center justify-between">
              <CardDescription>Overview of your active plan and usage.</CardDescription>
              <Badge variant={getStatusVariant()}>
                {userLimits.subscriptionPlan === "free" ? "Free" : "Active"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-baseline">
              <h3 className="text-2xl font-semibold">{getPlanDisplayName()}</h3>
              <p className="text-lg font-medium text-muted-foreground">{userLimits.planPrice}</p>
            </div>

            <div>
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>Page Usage</span>
                <span>
                  {userLimits.currentUsage} / {userLimits.limit} pages
                </span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
              {userLimits.isCritical && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md flex items-start text-sm text-red-700">
                  <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                  You are at {Math.round(usagePercentage)}% of your limit. Upgrade your plan to
                  continue processing documents.
                </div>
              )}
              {userLimits.isNearLimit && !userLimits.isCritical && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start text-sm text-yellow-700">
                  <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                  You are approaching your {userLimits.isMonthlyLimit ? "monthly" : "total"} page
                  limit. Consider upgrading to avoid service interruptions.
                </div>
              )}
            </div>
            {userLimits.resetDate && (
              <p className="text-sm text-muted-foreground">
                Your plan renews on {new Date(userLimits.resetDate).toLocaleDateString()}.
              </p>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              disabled={isLoading}
              className="flex items-center gap-2 cursor-pointer"
            >
              {userLimits.subscriptionPlan === "free" ? (
                <>Upgrade Plan</>
              ) : (
                <>
                  Manage Subscription
                  <ExternalLink className="h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Plan Features Card */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Features</CardTitle>
            <CardDescription>What&apos;s included in your current plan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>
                  {userLimits.limit} pages {userLimits.isMonthlyLimit ? "per month" : "total"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>PDF & CSV support</span>
              </div>
              {userLimits.subscriptionPlan !== "free" && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Priority support</span>
                  </div>
                  {userLimits.subscriptionPlan === "paid2" && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Advanced features</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
          {userLimits.subscriptionPlan === "free" && (
            <CardFooter>
              <Button className="w-full cursor-pointer" onClick={() => router.push("/en/pricing")}>
                View All Plans
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Billing Management Notice */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Management</CardTitle>
          <CardDescription>
            {userLimits.subscriptionPlan === "free"
              ? "Upgrade to a paid plan to access billing features."
              : "View your billing history, update payment methods, and manage your subscription."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userLimits.subscriptionPlan === "free" ? (
            <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg">
              <CreditCard className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold mb-1">No Billing Information</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You&apos;re currently on the free plan. Upgrade to access billing features and
                increased limits.
              </p>
              <Button className="cursor-pointer" onClick={() => router.push("/en/pricing")}>
                View Pricing Plans
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg">
              <FileText className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold mb-1">Manage Your Subscription</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Access your billing history, update payment methods, and manage your subscription
                through Stripe&apos;s secure portal.
              </p>
              <Button
                onClick={handleManageSubscription}
                disabled={isLoading}
                className="flex items-center gap-2 cursor-pointer"
              >
                Open Billing Portal
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
