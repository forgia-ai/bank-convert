"use client"

import React from "react"
import { type Locale } from "@/i18n-config"
import UpgradePrompt from "@/components/dashboard/upgrade-prompt"
import UsageTracker from "@/components/dashboard/usage-tracker"

interface ViewerBottomSectionProps {
  lang: Locale
  dictionary: Record<string, Record<string, unknown>>
}

export default function ViewerBottomSection({ lang, dictionary }: ViewerBottomSectionProps) {
  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
        <UsageTracker
          lang={lang}
          dictionary={dictionary}
          userType="free" // TODO: Get from user context
        />
        <UpgradePrompt
          lang={lang}
          dictionary={dictionary}
          userType="free" // TODO: Get from user context
          usagePercentage={46} // TODO: Get from actual usage context
          context="dashboard"
        />
      </div>
    </div>
  )
}
