"use client"

import React from "react"
import { type Locale } from "@/i18n-config"
import UpgradePrompt from "@/components/dashboard/UpgradePrompt"

interface ViewerBottomSectionProps {
  lang: Locale
  dictionary: Record<string, Record<string, unknown>>
}

export default function ViewerBottomSection({ lang, dictionary }: ViewerBottomSectionProps) {
  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <div className="max-w-4xl mx-auto flex justify-center">
        <div className="w-full max-w-2xl">
          <UpgradePrompt lang={lang} dictionary={dictionary} context="dashboard" />
        </div>
      </div>
    </div>
  )
}
