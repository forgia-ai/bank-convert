"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, ArrowRight, Star, Calendar } from "lucide-react"
import { type Locale } from "@/i18n-config"
import Link from "next/link"

interface RateLimitModalProps {
  isOpen: boolean
  onClose: () => void
  lang: Locale
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dictionary: Record<string, any> // TODO: Type this properly
  resetDate?: string // When the rate limit resets
}

export default function RateLimitModal({
  isOpen,
  onClose,
  lang,
  dictionary,
  resetDate,
}: RateLimitModalProps) {
  // Calculate days until reset (mock for now)
  const getDaysUntilReset = () => {
    if (!resetDate) return 30 // Default to 30 days
    const reset = new Date(resetDate)
    const now = new Date()
    const diffTime = reset.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(diffDays, 1)
  }

  const daysUntilReset = getDaysUntilReset()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-8">
        <div className="border-orange-200 bg-orange-50 rounded-lg p-4 mb-4">
          <DialogHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <DialogTitle className="text-lg font-semibold">
                  {dictionary.rate_limit_modal?.title || "Monthly Limit Reached"}
                </DialogTitle>
              </div>
              <Badge variant="secondary">
                {dictionary.rate_limit_modal?.badge || "Rate Limited"}
              </Badge>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              {dictionary.rate_limit_modal?.description ||
                "You've used your free monthly analysis. Sign up for immediate access to 50 pages total with no waiting."}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Rate Limit Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-3 mb-3">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">
              {dictionary.rate_limit_modal?.reset_info || "Limit Reset Information"}
            </span>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>{dictionary.rate_limit_modal?.current_limit || "Free analyses used"}:</span>
              <span className="font-medium">1/1 this month</span>
            </div>
            <div className="flex justify-between">
              <span>{dictionary.rate_limit_modal?.reset_in || "Resets in"}:</span>
              <span className="font-medium">
                {daysUntilReset} {daysUntilReset === 1 ? "day" : "days"}
              </span>
            </div>
          </div>
        </div>

        {/* Benefits of Signing Up */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            {dictionary.rate_limit_modal?.benefits_title || "Sign Up Benefits"}
          </h4>
          <ul className="space-y-1 text-xs text-blue-700">
            <li className="flex items-center space-x-2">
              <Star className="h-3 w-3" />
              <span>
                {dictionary.rate_limit_modal?.benefit_1 || "50 pages total (no monthly waiting)"}
              </span>
            </li>
            <li className="flex items-center space-x-2">
              <Star className="h-3 w-3" />
              <span>
                {dictionary.rate_limit_modal?.benefit_2 || "Full transaction extraction"}
              </span>
            </li>
            <li className="flex items-center space-x-2">
              <Star className="h-3 w-3" />
              <span>{dictionary.rate_limit_modal?.benefit_3 || "Clean Excel/CSV downloads"}</span>
            </li>
            <li className="flex items-center space-x-2">
              <Star className="h-3 w-3" />
              <span>
                {dictionary.rate_limit_modal?.benefit_4 || "No rate limits or waiting periods"}
              </span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href={`/${lang}/sign-up`} className="flex-1">
            <Button className="w-full cursor-pointer" onClick={onClose}>
              {dictionary.rate_limit_modal?.primary_button || "Sign Up Free"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Additional messaging */}
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            {dictionary.rate_limit_modal?.footer_text ||
              "Free signup takes 30 seconds. No credit card required."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
