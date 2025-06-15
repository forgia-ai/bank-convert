"use client"

import React from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Zap, ArrowRight, Star } from "lucide-react"
import { type Locale } from "@/i18n-config"
import Link from "next/link"
import { useUserLimits } from "@/contexts/user-limits-context"

interface LimitReachedModalProps {
  isOpen: boolean
  onClose: () => void
  lang: Locale
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dictionary: Record<string, any> // TODO: Type this properly
  userType: "anonymous" | "free" | "paid"
  currentUsage?: number
  limit?: number
}

export default function LimitReachedModal({
  isOpen,
  onClose,
  lang,
  dictionary,
  userType,
  currentUsage = 0,
  limit = 50,
}: LimitReachedModalProps) {
  const router = useRouter()
  const { subscribeToPlan } = useUserLimits()

  // Mock quick upgrade handler
  const handleQuickUpgrade = async () => {
    try {
      await subscribeToPlan("paid1")
      onClose()
      router.push(`/${lang}/viewer`)
    } catch (error) {
      console.error("Failed to upgrade:", error)
    }
  }
  // Get content based on user type
  const getModalContent = () => {
    switch (userType) {
      case "anonymous":
        return {
          icon: Star,
          title: dictionary.limit_reached_modal?.anonymous_title || "Sign Up for Free Pages",
          description:
            dictionary.limit_reached_modal?.anonymous_description ||
            "Create a free account to get 50 pages total and continue processing your bank statements.",
          badge: dictionary.limit_reached_modal?.anonymous_badge || "Free Account",
          badgeVariant: "secondary" as const,
          primaryButton: dictionary.limit_reached_modal?.anonymous_primary || "Sign Up Free",
          primaryHref: `/${lang}/sign-up`,
          secondaryButton: dictionary.limit_reached_modal?.anonymous_secondary || "See Pricing",
          secondaryHref: `/${lang}/pricing`,
          cardClass: "border-blue-200 bg-blue-50",
        }
      case "free":
        return {
          icon: Zap,
          title: dictionary.limit_reached_modal?.free_title || "Free Pages Used Up",
          description:
            dictionary.limit_reached_modal?.free_description ||
            `You've used all ${limit} of your free pages. Upgrade to get monthly page allowances and extract unlimited bank statements.`,
          badge: dictionary.limit_reached_modal?.free_badge || "Upgrade Required",
          badgeVariant: "destructive" as const,
          primaryButton: dictionary.limit_reached_modal?.free_primary || "Increase Limit",
          primaryHref: `/${lang}/pricing`,
          secondaryButton: dictionary.limit_reached_modal?.free_secondary || "View Usage",
          secondaryHref: `/${lang}/viewer`,
          cardClass: "border-red-200 bg-red-50",
        }
      case "paid":
        return {
          icon: AlertTriangle,
          title: dictionary.limit_reached_modal?.paid_title || "Monthly Limit Reached",
          description:
            dictionary.limit_reached_modal?.paid_description ||
            `You've used all ${limit} pages this month. Your limit will reset next month, or upgrade for unlimited pages.`,
          badge: dictionary.limit_reached_modal?.paid_badge || "Monthly Limit",
          badgeVariant: "secondary" as const,
          primaryButton: dictionary.limit_reached_modal?.paid_primary || "Upgrade Plan",
          primaryHref: `/${lang}/pricing`,
          secondaryButton: dictionary.limit_reached_modal?.paid_secondary || "View Usage",
          secondaryHref: `/${lang}/viewer`,
          cardClass: "border-yellow-200 bg-yellow-50",
        }
      default:
        return {
          icon: AlertTriangle,
          title: "Limit Reached",
          description: "You've reached your processing limit.",
          badge: "Limit Reached",
          badgeVariant: "secondary" as const,
          primaryButton: "Upgrade",
          primaryHref: `/${lang}/pricing`,
          secondaryButton: "Close",
          secondaryHref: `/${lang}/viewer`,
          cardClass: "border-gray-200 bg-gray-50",
        }
    }
  }

  const content = getModalContent()
  const IconComponent = content.icon

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-8">
        <div className={`${content.cardClass} rounded-lg p-4 mb-4`}>
          <DialogHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <IconComponent className="h-5 w-5" />
                <DialogTitle className="text-lg font-semibold">{content.title}</DialogTitle>
              </div>
              <Badge variant={content.badgeVariant}>{content.badge}</Badge>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              {content.description}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Usage Stats for authenticated users */}
        {(userType === "free" || userType === "paid") && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                {dictionary.limit_reached_modal?.usage_label || "Pages Used"}:
              </span>
              <span className="font-medium">
                {currentUsage}/{limit} {userType === "paid" ? "this month" : "total"}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-red-500 h-2 rounded-full"
                style={{ width: `${Math.min((currentUsage / limit) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {userType === "free" ? (
            <>
              <Button className="flex-1 cursor-pointer" onClick={handleQuickUpgrade}>
                Upgrade to Growth
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Link href={content.primaryHref} className="flex-1">
                <Button variant="outline" className="w-full cursor-pointer" onClick={onClose}>
                  View All Plans
                </Button>
              </Link>
            </>
          ) : (
            <Link href={content.primaryHref} className="flex-1">
              <Button className="w-full cursor-pointer" onClick={onClose}>
                {content.primaryButton}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>

        {/* Additional messaging for free users */}
        {userType === "free" && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              {dictionary.limit_reached_modal?.free_tip ||
                "💡 Paid plans include monthly page allowances that reset every month, so you never run out."}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
