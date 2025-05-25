"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Zap, Star, TrendingUp } from "lucide-react"
import { type Locale } from "@/i18n-config"
import Link from "next/link"

interface UpgradePromptProps {
  lang: Locale
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dictionary: Record<string, any> // TODO: Type this properly
  variant?: "subtle" | "prominent" | "urgent"
  userType?: "free" | "paid"
  usagePercentage?: number
  context?: "dashboard" | "limit-reached" | "processing"
}

export default function UpgradePrompt({
  lang,
  dictionary,
  variant = "subtle",
  userType = "free",
  usagePercentage = 0,
  context = "dashboard",
}: UpgradePromptProps) {
  // Don't show upgrade prompts for paid users
  if (userType === "paid") {
    return null
  }

  // Determine the appropriate variant based on usage if not explicitly set
  const getVariantFromUsage = () => {
    if (usagePercentage >= 90) return "urgent"
    if (usagePercentage >= 75) return "prominent"
    return "subtle"
  }

  const effectiveVariant = variant === "subtle" ? getVariantFromUsage() : variant

  // Get content based on variant and context
  const getPromptContent = () => {
    switch (effectiveVariant) {
      case "urgent":
        return {
          icon: Zap,
          title: dictionary.upgrade_prompt?.urgent_title || "Almost Out of Pages!",
          description:
            dictionary.upgrade_prompt?.urgent_description ||
            "You've used most of your free pages. Upgrade now to continue processing documents.",
          buttonText: dictionary.upgrade_prompt?.urgent_button || "Upgrade Now",
          buttonVariant: "default" as const,
          cardClass: "border-red-200 bg-red-50",
          badge: dictionary.upgrade_prompt?.urgent_badge || "Action Required",
          badgeVariant: "destructive" as const,
        }
      case "prominent":
        return {
          icon: TrendingUp,
          title: dictionary.upgrade_prompt?.prominent_title || "Running Low on Pages",
          description:
            dictionary.upgrade_prompt?.prominent_description ||
            "You're using most of your free allowance. Upgrade for unlimited monthly pages.",
          buttonText: dictionary.upgrade_prompt?.prominent_button || "View Plans",
          buttonVariant: "default" as const,
          cardClass: "border-yellow-200 bg-yellow-50",
          badge: dictionary.upgrade_prompt?.prominent_badge || "Recommended",
          badgeVariant: "secondary" as const,
        }
      default: // subtle
        return {
          icon: Star,
          title: dictionary.upgrade_prompt?.subtle_title || "Unlock More Features",
          description:
            dictionary.upgrade_prompt?.subtle_description ||
            "Get monthly page allowances and priority support with our paid plans.",
          buttonText: dictionary.upgrade_prompt?.subtle_button || "See Pricing",
          buttonVariant: "default" as const,
          cardClass: "border-blue-200 bg-blue-50",
          badge: dictionary.upgrade_prompt?.subtle_badge || "Pro Tip",
          badgeVariant: "secondary" as const,
        }
    }
  }

  const content = getPromptContent()
  const IconComponent = content.icon

  // Different layouts based on context
  if (context === "limit-reached") {
    return (
      <Card className={`${content.cardClass} border-2`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <IconComponent className="h-5 w-5" />
              <CardTitle className="text-lg">{content.title}</CardTitle>
            </div>
            <Badge variant={content.badgeVariant}>{content.badge}</Badge>
          </div>
          <CardDescription>{content.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href={`/${lang}/pricing`} className="flex-1">
              <Button variant={content.buttonVariant} className="w-full cursor-pointer">
                {content.buttonText}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Compact version for dashboard/processing contexts
  return (
    <div className={`${content.cardClass} border rounded-lg p-4`}>
      <div className="flex items-center justify-between min-h-[60px]">
        <div className="flex items-center space-x-3">
          <IconComponent className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium leading-tight">{content.title}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-tight">
              {content.description}
            </p>
          </div>
        </div>
        <div className="flex items-center ml-4">
          <Link href={`/${lang}/pricing`}>
            <Button
              variant={content.buttonVariant}
              size="sm"
              className="whitespace-nowrap cursor-pointer"
            >
              {content.buttonText}
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
