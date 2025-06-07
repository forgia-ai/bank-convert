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
import { processPdfFile, type BankingData } from "@/lib/upload/actions"

// Define the possible states for the conversion process
type UploadState = "idle" | "uploading" | "processing" | "completed" | "error"

// Transaction data structure
interface Transaction {
  date: string
  description: string
  amount: number
  currency?: string
  type?: string
}

interface ConversionWorkflowProps {
  lang: Locale
  dictionary: Record<string, Record<string, unknown>>
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
 * Converts BankingData from Gemini API to Transaction array format expected by the table
 */
const convertBankingDataToTransactions = (data: BankingData): Transaction[] => {
  const transactions: Transaction[] = []

  // Add account info as initial transaction if available
  if (data.balance) {
    transactions.push({
      date: new Date().toISOString().split("T")[0], // Today's date
      description: `Account Balance - ${data.bankName || "Bank"}`,
      amount: parseFloat(data.balance.replace(/[^0-9.-]/g, "")) || 0,
      currency: data.currency || "USD",
      type: "Credit",
    })
  }

  // Add actual transactions
  if (data.transactions && data.transactions.length > 0) {
    data.transactions.forEach((transaction) => {
      transactions.push({
        date: transaction.date,
        description: transaction.description,
        amount: parseFloat(transaction.amount.replace(/[^0-9.-]/g, "")) || 0,
        currency: data.currency || "USD",
        type: transaction.type === "debit" ? "Debit" : "Credit",
      })
    })
  }

  return transactions
}

export default function ConversionWorkflow({ lang, dictionary }: ConversionWorkflowProps) {
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [transactionData, setTransactionData] = useState<Transaction[]>([])
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [isLimitError, setIsLimitError] = useState<boolean>(false)
  const fileUploadRef = useRef<FileUploadModuleRef>(null)

  // Get user limits context for mock processing
  const { processDocument, canProcessPages, userLimits } = useUserLimits()

  // Handle file upload from FileUploadModule
  const handleFileUpload = async (file: File) => {
    setCurrentFile(file)
    setUploadState("processing")
    setErrorMessage("")

    // Mock: Simulate 10 pages per document
    const mockPageCount = 10

    // Check if user can process this document
    if (!canProcessPages(mockPageCount)) {
      setUploadState("error")
      setIsLimitError(true)
      setErrorMessage("You've reached your page limit. Please upgrade to process more documents.")
      return
    }

    try {
      // Use mock processing from context
      const success = await processDocument(mockPageCount)

      if (success) {
        // Process the PDF file using Gemini API
        await processWithGeminiAPI(file)
      } else {
        throw new Error("Processing failed - limit reached")
      }
    } catch (error) {
      setUploadState("error")
      setIsLimitError(false) // Regular processing error, not limit error
      setErrorMessage(
        error instanceof Error
          ? error.message
          : (dictionary?.viewer_page?.backend_error_generic as string) || "Processing failed",
      )
    }
  }

  // Process PDF with Gemini API using server action
  const processWithGeminiAPI = async (file: File): Promise<void> => {
    try {
      // Create FormData for server action
      const formData = new FormData()
      formData.append("file", file)

      // Call server action to process PDF with Gemini
      const result = await processPdfFile(formData)

      if (result.success && result.data) {
        // Convert banking data to transaction format
        const transactions = convertBankingDataToTransactions(result.data)

        if (transactions.length === 0) {
          // If no transactions found, show a friendly message
          setUploadState("error")
          setErrorMessage(
            "No transaction data could be extracted from this PDF. Please ensure it's a valid bank statement.",
          )
          return
        }

        setTransactionData(transactions)
        setUploadState("completed")
        console.log(
          "Successfully processed PDF file:",
          file.name,
          "Transactions:",
          transactions.length,
        )
      } else {
        // Handle processing errors
        setUploadState("error")
        setErrorMessage(result.error || "Failed to process PDF file")
      }
    } catch (error) {
      console.error("Error processing PDF with Gemini API:", error)
      setUploadState("error")
      setErrorMessage(
        error instanceof Error
          ? error.message
          : (dictionary?.viewer_page?.backend_error_generic as string) || "Processing failed",
      )
    }
  }

  // Handle XLSX download
  const handleDownloadXLSX = () => {
    // TODO: Implement actual XLSX generation and download
    console.log("Downloading XLSX with data:", transactionData)

    // For now, just create a simple CSV as a placeholder
    const csvContent = [
      ["Date", "Description", "Amount", "Currency", "Type"],
      ...transactionData.map((tx) => [
        tx.date,
        tx.description,
        tx.amount.toString(),
        tx.currency || "",
        tx.type || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${currentFile?.name || "bank-statement"}-extracted.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Handle clearing/resetting for new conversion
  const handleClearAndUploadNew = () => {
    setUploadState("idle")
    setTransactionData([])
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
        {(uploadState === "idle" || uploadState === "uploading") && (
          <div className="space-y-6">
            <h2 className="text-xl font-medium text-center">
              {dictionary.viewer_page?.upload_headline as string}
            </h2>
            <FileUploadModule
              ref={fileUploadRef}
              onFileUpload={handleFileUpload}
              lang={lang}
              maxFileSize={20 * 1024 * 1024} // 20MB to match PDF validation limit
              acceptedFileTypes={{ "application/pdf": [".pdf"] }}
              disableRedirect={true} // Prevent redirection since we're already on viewer page
              hideSelectFileButton={true} // Hide the select file button since drag-drop zone handles this
              strings={
                dictionary.viewer_page
                  ?.file_upload_module_strings as unknown as import("@/components/marketing/FileUploadModule").FileUploadModuleStrings
              }
            />
          </div>
        )}

        {uploadState === "processing" && (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="text-lg">
                {dictionary.viewer_page?.processing_message as string}
              </span>
            </div>
            {currentFile && (
              <p className="text-sm text-muted-foreground">
                {dictionary.viewer_page?.results_for_prefix as string}
                {truncateFilename(currentFile.name)}
              </p>
            )}
          </div>
        )}

        {uploadState === "completed" && transactionData.length > 0 && (
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
                  className="flex items-center justify-center space-x-2 cursor-pointer w-full sm:w-auto"
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

            {/* Data Table */}
            <DataTable
              data={transactionData}
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
            />
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
                          ?.replace("{planName}", userLimits.planName)
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
