"use client"

import { exportTransactionsToXLSX, generateXLSXFilename } from "@/lib/export/xlsx-export"
import { type PreviewData } from "@/components/marketing/FileUploadModule"
import DataTable from "@/components/viewer/DataTable"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle, ArrowRight, Users, Star, Download } from "lucide-react"
import React, { useState, useEffect } from "react"
import Link from "next/link"
import { type Locale } from "@/i18n-config"

interface PreviewWorkflowProps {
  lang: Locale
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dictionary: Record<string, any> // TODO: Type this properly
}

export default function PreviewWorkflow({ lang, dictionary }: PreviewWorkflowProps) {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Get localized pages per month text
  const pagesPerMonth = dictionary.common?.pages_per_month || "pages/month"

  useEffect(() => {
    // Get preview data from localStorage
    if (typeof window !== "undefined") {
      const storedData = localStorage.getItem("previewData")
      if (storedData) {
        try {
          const data = JSON.parse(storedData) as PreviewData
          setPreviewData(data)
        } catch (error) {
          console.error("Error parsing preview data:", error)
        }
      }
      setIsLoading(false)
    }
  }, [])

  // Convert preview data to DataTable format
  const convertToDataTableFormat = (previewData: PreviewData) => {
    return previewData.previewTransactions.map((transaction) => {
      const convertedType =
        transaction.type === "debit"
          ? (dictionary.viewer_page?.transaction_type_debit as string) || "Debit"
          : (dictionary.viewer_page?.transaction_type_credit as string) || "Credit"

      return {
        date: transaction.date,
        description: transaction.description,
        amount: transaction.amount,
        currency: transaction.currency,
        type: convertedType,
        originalType: transaction.type as "credit" | "debit", // Add originalType for proper styling
      }
    })
  }

  // Helper function to truncate filename
  const truncateFilename = (filename: string, maxLength: number = 30) => {
    if (filename.length <= maxLength) return filename
    const extension = filename.split(".").pop()
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf("."))
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension!.length - 4)
    return `${truncatedName}...${extension}`
  }

  // Download handler for preview - downloads limited data
  const handleDownloadXLSX = async () => {
    if (!previewData) return

    try {
      // Convert preview transaction data to export format
      const transactionsForExport = previewData.previewTransactions.map((transaction) => ({
        date: transaction.date,
        description: transaction.description,
        amount: transaction.amount,
        currency: transaction.currency,
        type: transaction.type,
      }))

      // Generate filename based on original file
      const baseFilename = previewData.filename.replace(/\.[^/.]+$/, "") || "bank-statement"
      const filename = generateXLSXFilename(`${baseFilename}_preview`, true)

      // Export to XLSX
      await exportTransactionsToXLSX(transactionsForExport, {
        filename,
        sheetName: "Preview Transactions",
        includeHeader: true,
        columnHeaders: dictionary.viewer_page?.table_columns as {
          date: string
          description: string
          amount: string
          currency: string
          type: string
        },
      })
    } catch (error) {
      console.error("Error generating preview XLSX file:", error)
      // Could show a toast notification here if needed
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!previewData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">
          {dictionary.preview_page?.no_data_title || "No Preview Data Available"}
        </h2>
        <p className="text-muted-foreground mb-6">
          {dictionary.preview_page?.no_data_description ||
            "Please upload a file from the homepage to see a preview."}
        </p>
        <Link href={`/${lang}`}>
          <Button>{dictionary.preview_page?.go_to_homepage || "Go to Homepage"}</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Action Buttons - Responsive layout */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
        <div className="text-center lg:text-left">
          <p className="text-lg text-green-600 font-medium">
            {dictionary.preview_page?.success_message
              ?.replace("{transactions}", previewData.totalTransactions.toString())
              ?.replace("{pages}", previewData.totalPages.toString()) ||
              `✅ Analysis Complete: Found ${previewData.totalTransactions} transactions across ${previewData.totalPages} pages`}
          </p>
          <p className="text-sm text-muted-foreground">
            {dictionary.viewer_page?.results_for_prefix || "Results for: "}
            {truncateFilename(previewData.filename)}
          </p>
        </div>
        <div className="flex justify-center lg:justify-end">
          <Button
            variant="outline"
            onClick={handleDownloadXLSX}
            className="flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>{dictionary.preview_page?.download_preview_csv || "Download Preview XLSX"}</span>
          </Button>
        </div>
      </div>

      {/* Data Table - Same as viewer but with custom footer message */}
      <DataTable
        data={convertToDataTableFormat(previewData)}
        locale={lang}
        columns={
          (dictionary.viewer_page
            ?.table_columns as unknown as import("@/components/viewer/DataTable").ColumnLabels) || {
            date: "Date",
            description: "Description",
            amount: "Amount",
            currency: "Currency",
            type: "Type",
          }
        }
        transactionCountStrings={{
          singular: dictionary.viewer_page?.transaction_count_singular || "1 transaction found.",
          plural:
            dictionary.viewer_page?.transaction_count_plural || "{count} transactions found.",
        }}
        customFooterMessage={
          dictionary.preview_page?.limited_preview_message?.replace(
            "{total}",
            previewData.totalTransactions.toString(),
          ) ||
          `🔒 Limited Preview! You're seeing the first 10 transactions of the ${previewData.totalTransactions} found.`
        }
      />

      {/* Conversion CTAs */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Free Signup CTA */}
        <Card className="border-primary/20 bg-primary/5">
          <div className="px-4">
            <Link href={`/${lang}/sign-up`}>
              <Button className="w-full cursor-pointer mb-3" size="lg">
                <Users className="mr-2 h-4 w-4" />
                {dictionary.preview_page?.signup_button || "Sign Up Free - Get 50 Pages"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            {/* <p className="text-sm text-muted-foreground text-center mb-3">
              Get immediate access to all your data
            </p> */}
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>
                  {dictionary.preview_page?.feature_extract_pages || "Extract 50 pages for free"}
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>{dictionary.preview_page?.feature_excel_export || "Full Excel export"}</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>
                  {dictionary.preview_page?.feature_no_credit_card || "No credit card required"}
                </span>
              </li>
            </ul>
          </div>
        </Card>

        {/* Pricing CTA */}
        <Card>
          <div className="px-4">
            <Link href={`/${lang}/pricing`}>
              <Button variant="outline" className="w-full cursor-pointer mb-3" size="lg">
                <Star className="mr-2 h-4 w-4 text-yellow-500" />
                {dictionary.preview_page?.pricing_button || "View Pricing Plans"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            {/* <p className="text-sm text-muted-foreground text-center mb-3">
              Monthly page allowances for regular users
            </p> */}
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>
                  {dictionary.preview_page?.feature_growth_plan?.replace(
                    "{pages_per_month}",
                    pagesPerMonth,
                  ) || `Lite: 500 ${pagesPerMonth}`}
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>
                  {dictionary.preview_page?.feature_premium_plan?.replace(
                    "{pages_per_month}",
                    pagesPerMonth,
                  ) || `Pro: 1000 ${pagesPerMonth}`}
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>
                  {dictionary.preview_page?.feature_priority_support || "Priority support"}
                </span>
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}
