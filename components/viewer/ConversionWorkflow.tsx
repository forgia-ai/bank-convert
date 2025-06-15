"use client"

import React, { useState, useRef } from "react"
import FileUploadModule, {
  type FileUploadModuleRef,
} from "@/components/marketing/FileUploadModule"
import DataTable from "@/components/viewer/DataTable"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Download, Zap, ArrowRight } from "lucide-react"
import { type Locale } from "@/i18n-config"
import { useUserLimits } from "@/contexts/user-limits-context"
import { type BankingData } from "@/lib/upload/actions"
import { formatDateForLocale } from "@/lib/upload/locale-formatting"
import { exportTransactionsToXLSX, generateXLSXFilename } from "@/lib/export/xlsx-export"
import { recordUserPageUsage } from "@/lib/usage/actions"
import { type PlanType } from "@/lib/usage/tracking"
import { logger } from "@/lib/utils/logger"

// Define the possible states for the conversion process
type UploadState = "idle" | "uploading" | "processing" | "completed" | "error"

// Transaction data structure
interface Transaction {
  date: string
  description: string
  amount: number
  currency?: string
  type?: string
  originalType?: "credit" | "debit"
}

interface ConversionWorkflowProps {
  lang: Locale
  dictionary: Record<string, Record<string, unknown>>
}

// Processing result with metadata from server
interface ProcessingResult {
  data: BankingData
  fileName?: string
  fileSize?: number
  pageCount?: number
}

// Utility function to truncate filename in the middle
const truncateFilename = (filename: string, maxLength: number = 50): string => {
  if (filename.length <= maxLength) {
    return filename
  }

  const extension = filename.substring(filename.lastIndexOf("."))
  const nameWithoutExtension = filename.substring(0, filename.lastIndexOf("."))

  // Calculate how much space we have for the name part
  const availableLength = maxLength - extension.length - 3 // 3 for "..."

  if (availableLength <= 0) {
    return `...${extension}`
  }

  // Split the available length between beginning and end
  const beginLength = Math.ceil(availableLength * 0.6) // 60% for beginning
  const endLength = availableLength - beginLength // 40% for end

  const beginning = nameWithoutExtension.substring(0, beginLength)
  const ending = nameWithoutExtension.substring(nameWithoutExtension.length - endLength)

  return `${beginning}...${ending}${extension}`
}

/**
 * Converts BankingData from Gemini AI to Transaction array format expected by the table
 * Now handles new schema with format detection and standardized data
 * Applies locale-aware formatting for display
 * Note: Account balance is not displayed nor counted as a transaction
 */
const convertBankingDataToTransactions = (
  data: BankingData,
  locale: Locale,
  dictionary: Record<string, Record<string, unknown>>,
): { transactions: Transaction[]; totalCount: number } => {
  const transactions: Transaction[] = []

  // Add actual transactions (now pre-standardized by LLM)
  // Note: Account balance is not counted as a transaction
  if (data.transactions && data.transactions.length > 0) {
    const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD format

    data.transactions.forEach((transaction) => {
      // Skip future dates (backup filter)
      if (transaction.date > today) {
        return
      }

      // Use the standardized amount for calculations but format for display
      const parsedAmount = parseFloat(transaction.amount) || 0 // LLM should return standardized amounts

      const formattedDate = formatDateForLocale(transaction.date, locale)

      transactions.push({
        date: formattedDate,
        description: transaction.description,
        amount: parsedAmount, // Keep numeric for calculations
        currency: data.currency || "USD",
        type:
          transaction.type === "debit"
            ? (dictionary.viewer_page?.transaction_type_debit as string) || "Debit"
            : (dictionary.viewer_page?.transaction_type_credit as string) || "Credit",
        originalType: transaction.type,
      })
    })
  }

  // Total count is just the number of actual transactions (no balance)
  const totalCount = transactions.length

  return { transactions, totalCount }
}

export default function ConversionWorkflow({ lang, dictionary }: ConversionWorkflowProps) {
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [, setProcessingResult] = useState<ProcessingResult | null>(null)
  const [transactionData, setTransactionData] = useState<Transaction[]>([])
  const [totalTransactionCount, setTotalTransactionCount] = useState<number>(0)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [isLimitError, setIsLimitError] = useState<boolean>(false)
  const fileUploadRef = useRef<FileUploadModuleRef>(null)

  // Get user limits context for processing
  const { canProcessPages, userLimits, refreshLimits } = useUserLimits()

  // Helper function to format transaction count message
  const formatTransactionCountMessage = (count: number) => {
    const transactionCountStrings = {
      singular:
        (dictionary.viewer_page?.transaction_count_singular as string) || "1 transaction found.",
      plural:
        (dictionary.viewer_page?.transaction_count_plural as string) ||
        "{count} transactions found.",
    }

    if (count === 1) {
      return transactionCountStrings.singular
    } else {
      return transactionCountStrings.plural.replace("{count}", count.toString())
    }
  }

  // Handle file upload from FileUploadModule
  const handleFileUpload = (file: File) => {
    setCurrentFile(file)
    setErrorMessage("")
    setProcessingResult(null)

    // Note: We can't check page limits here because we need server-side processing
    // to get the actual page count. The FileUploadModule will handle the processing
    // and we'll validate limits when we receive the result.
  }

  // Handle processing completion from FileUploadModule
  const handleProcessingComplete = (
    data: BankingData,
    metadata?: { fileName?: string; fileSize?: number; pageCount?: number },
  ) => {
    // Store the complete processing result
    const result: ProcessingResult = {
      data,
      fileName: metadata?.fileName || currentFile?.name,
      fileSize: metadata?.fileSize || currentFile?.size,
      pageCount: metadata?.pageCount || 1, // Fallback to 1 page if not provided
    }

    setProcessingResult(result)

    // Check if the page count would exceed user's limits
    if (result.pageCount && !canProcessPages(result.pageCount)) {
      setUploadState("error")
      setIsLimitError(true)
      setErrorMessage("You've reached your page limit. Please upgrade to process more documents.")
      return
    }

    // Convert banking data to transaction format with locale formatting
    const { transactions, totalCount } = convertBankingDataToTransactions(data, lang, dictionary)

    // ✅ SUCCESSFUL EXTRACTION: LLM processed the PDF successfully
    // Even if 0 transactions are found, this is still a successful extraction that should be charged
    // Set the state first, then handle usage tracking
    setTransactionData(transactions)
    setTotalTransactionCount(totalCount)

    if (transactions.length === 0) {
      // Show success state but with a message about no transactions
      setUploadState("completed")
      // We'll show a special message in the UI for this case
    } else {
      // Normal success with transactions found
      setUploadState("completed")
    }

    // Handle usage tracking in the background for ALL successful extractions (async, non-blocking)
    const trackUsage = async () => {
      try {
        if (result.pageCount && result.pageCount > 0) {
          logger.info(
            {
              fileName: result.fileName,
              fileSize: result.fileSize,
              pageCount: result.pageCount,
              transactionCount: totalCount,
            },
            "Recording actual page usage for successful extraction",
          )

          const trackingResult = await recordUserPageUsage(
            result.pageCount,
            result.fileName,
            result.fileSize,
            userLimits.subscriptionPlan as PlanType,
          )

          if (!trackingResult.success) {
            logger.warn({ error: trackingResult.error }, "Failed to record page usage")
          } else {
            logger.info(
              { pageCount: result.pageCount, transactionCount: totalCount },
              "Successfully recorded actual page usage",
            )

            // ✅ REFRESH USER LIMITS: Update the navbar after successful usage tracking
            try {
              await refreshLimits()
              logger.info({}, "Successfully refreshed user limits after usage tracking")
            } catch (refreshError) {
              logger.warn(
                { error: refreshError },
                "Failed to refresh user limits after usage tracking",
              )
            }
          }
        } else {
          logger.warn({ result }, "Missing page count for usage tracking")
        }
      } catch (error) {
        logger.warn({ error }, "Usage tracking failed")
        // Don't show error to user since the main processing succeeded
      }
    }
    trackUsage()
  }

  // Handle XLSX download
  const handleDownloadXLSX = async () => {
    if (transactionData.length === 0) {
      return
    }

    try {
      // Convert transaction data to export format
      const transactionsForExport = transactionData.map((tx) => ({
        date: tx.date,
        description: tx.description,
        amount: tx.amount,
        currency: tx.currency || "USD",
        type: tx.type || "",
      }))

      // Generate filename based on original file
      const baseFilename = currentFile?.name?.replace(/\.[^/.]+$/, "") || "bank-statement"
      const filename = generateXLSXFilename(baseFilename, true)

      // Export to XLSX
      await exportTransactionsToXLSX(transactionsForExport, {
        filename,
        sheetName: "Bank Transactions",
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
      console.error("Error generating XLSX file:", error)
      // Could show a toast notification here if needed
    }
  }

  // Handle clearing/resetting for new conversion
  const handleClearAndUploadNew = () => {
    setUploadState("idle")
    setTransactionData([])
    setTotalTransactionCount(0)
    setCurrentFile(null)
    setErrorMessage("")
    setIsLimitError(false)
  }

  // Handle redirect to pricing page
  const handleUpgradeRedirect = () => {
    window.open(`/${lang}/pricing`, "_blank")
  }

  // Handle retry for errors
  const handleRetry = () => {
    if (currentFile) {
      handleFileUpload(currentFile)
    } else {
      handleClearAndUploadNew()
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Conversion Section - Conditional rendering based on state */}
      <div className="space-y-6">
        {uploadState === "idle" && (
          <div className="space-y-6">
            <h2 className="text-xl font-medium text-center">
              {dictionary.viewer_page?.upload_headline as string}
            </h2>
            <FileUploadModule
              ref={fileUploadRef}
              onFileUpload={handleFileUpload}
              lang={lang}
              disableRedirect={true} // Prevent redirection since we're already on viewer page
              hideSelectFileButton={true} // Hide the select file button since drag-drop zone handles this
              useTwoPhaseProgress={true} // Use enhanced two-phase progress like marketing page
              onProcessingComplete={handleProcessingComplete} // Handle completion
              strings={
                dictionary.viewer_page
                  ?.file_upload_module_strings as unknown as import("@/components/marketing/FileUploadModule").FileUploadModuleStrings
              }
            />
          </div>
        )}

        {uploadState === "completed" && (
          <div className="space-y-6">
            {/* Action Buttons - Moved to top */}
            <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
              <div className="text-center lg:text-left">
                <p className="text-lg text-green-600 font-medium">
                  {dictionary.viewer_page?.success_message as string}
                </p>
                {currentFile && (
                  <p className="text-sm text-muted-foreground">
                    {dictionary.viewer_page?.results_for_prefix as string}
                    {truncateFilename(currentFile.name)}
                  </p>
                )}
              </div>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
                <Button
                  onClick={handleDownloadXLSX}
                  disabled={transactionData.length === 0}
                  className="flex items-center justify-center space-x-2 cursor-pointer w-full sm:w-auto"
                  title={transactionData.length === 0 ? "No transactions to export" : undefined}
                >
                  <Download className="h-4 w-4" />
                  <span>{dictionary.viewer_page?.download_xlsx_button as string}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearAndUploadNew}
                  className="cursor-pointer w-full sm:w-auto"
                >
                  {dictionary.viewer_page?.process_another_button as string}
                </Button>
              </div>
            </div>

            {/* Conditional Content Based on Transaction Count */}
            {transactionData.length > 0 ? (
              /* Data Table for successful extractions with transactions */
              <DataTable
                data={transactionData}
                locale={lang}
                columns={
                  dictionary.viewer_page
                    ?.table_columns as unknown as import("@/components/viewer/DataTable").ColumnLabels
                }
                transactionCountStrings={{
                  singular:
                    (dictionary.viewer_page?.transaction_count_singular as string) ||
                    "1 transaction found.",
                  plural:
                    (dictionary.viewer_page?.transaction_count_plural as string) ||
                    "{count} transactions found.",
                }}
                customFooterMessage={formatTransactionCountMessage(totalTransactionCount)}
              />
            ) : (
              /* Message for successful extractions with 0 transactions */
              <Card className="border-blue-200 bg-blue-50 border-2">
                <CardHeader className="pb-3">
                  <CardDescription className="text-blue-700">
                    We successfully processed your PDF, but no transaction data was found. This
                    could happen if:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>The document doesn&apos;t contain transaction records</li>
                      <li>The document is a statement summary or account overview</li>
                      <li>The transactions are in an unusual format</li>
                    </ul>
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-blue-600">
                    💡 <strong>Note:</strong> This processing counts toward your page usage as the
                    document was successfully analyzed.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {uploadState === "error" && (
          <div className="space-y-6">
            {isLimitError ? (
              // Special upgrade CTA for limit exceeded errors
              <div className="space-y-4">
                <Card className="border-orange-200 bg-orange-50 border-2 w-3/5 mx-auto">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-5 w-5 text-orange-600" />
                        <CardTitle className="text-lg text-orange-800">
                          {dictionary.viewer_page?.limit_error_title as string}
                        </CardTitle>
                      </div>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                        {(dictionary.viewer_page?.limit_error_badge as string)
                          ?.replace(
                            "{planName}",
                            (dictionary.plans as Record<string, string>)?.[userLimits.planName] ||
                              userLimits.planName,
                          )
                          ?.replace("{currentUsage}", userLimits.currentUsage.toString())
                          ?.replace("{limit}", userLimits.limit.toString())}
                      </Badge>
                    </div>
                    <CardDescription className="text-orange-700">
                      {(dictionary.viewer_page?.limit_error_description as string)?.replace(
                        "{limit}",
                        userLimits.limit.toString(),
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex justify-center">
                      <Button
                        onClick={handleUpgradeRedirect}
                        className="w-1/2 cursor-pointer bg-orange-600 hover:bg-orange-700"
                      >
                        {dictionary.viewer_page?.limit_error_upgrade_button as string}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Action button for uploading another file */}
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={handleClearAndUploadNew}
                    className="cursor-pointer"
                  >
                    {dictionary.viewer_page?.upload_different_button as string}
                  </Button>
                </div>
              </div>
            ) : (
              // Regular error display
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>
                    {dictionary.viewer_page?.processing_error_title as string}
                  </AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>

                <div className="flex justify-center space-x-4">
                  <Button onClick={handleRetry} className="cursor-pointer">
                    {dictionary.viewer_page?.try_again_button as string}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleClearAndUploadNew}
                    className="cursor-pointer"
                  >
                    {dictionary.viewer_page?.upload_different_button as string}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
