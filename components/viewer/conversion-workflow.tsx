"use client"

import React, { useState, useRef } from "react"
import FileUploadModule, {
  type FileUploadModuleRef,
} from "@/components/marketing/FileUploadModule"
import DataTable from "@/components/viewer/data-table"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Download } from "lucide-react"
import { type Locale } from "@/i18n-config"

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

export default function ConversionWorkflow({ lang, dictionary }: ConversionWorkflowProps) {
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [extractedData, setExtractedData] = useState<Transaction[]>([])
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const fileUploadRef = useRef<FileUploadModuleRef>(null)

  // Handle file upload from FileUploadModule
  const handleFileUpload = async (file: File) => {
    setCurrentFile(file)
    setUploadState("processing")
    setErrorMessage("")

    try {
      // Simulate backend processing
      // TODO: Replace with actual API call to backend extraction service
      await simulateBackendProcessing(file)
    } catch {
      setUploadState("error")
      setErrorMessage(
        (dictionary?.viewer_page?.backend_error_generic as string) || "Processing failed",
      )
    }
  }

  // Simulate backend processing (replace with real API call)
  const simulateBackendProcessing = async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate random success/failure for demo
        const success = Math.random() > 0.2 // 80% success rate

        if (success) {
          // Mock extracted transaction data - Much larger dataset to test scrolling
          // In a real implementation, this would process the actual file
          console.log("Processing file:", file.name, file.size)
          const mockData: Transaction[] = [
            {
              date: "2024-01-01",
              description: "Opening Balance",
              amount: 5000.0,
              currency: "USD",
              type: "Credit",
            },
            {
              date: "2024-01-02",
              description: "Grocery Store - Walmart",
              amount: -156.78,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-01-03",
              description: "Gas Station - Shell",
              amount: -45.2,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-01-04",
              description: "Coffee Shop - Starbucks",
              amount: -8.95,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-01-05",
              description: "Online Purchase - Amazon",
              amount: -89.99,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-01-06",
              description: "Salary Deposit",
              amount: 3200.0,
              currency: "USD",
              type: "Credit",
            },
            {
              date: "2024-01-07",
              description: "Rent Payment",
              amount: -1500.0,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-01-08",
              description: "Utilities - Electric Bill",
              amount: -125.3,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-01-09",
              description: "Phone Bill - Verizon",
              amount: -85.0,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-01-10",
              description: "Grocery Store - Target",
              amount: -134.56,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-01-11",
              description: "Restaurant - Olive Garden",
              amount: -67.89,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-01-12",
              description: "ATM Withdrawal",
              amount: -100.0,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-01-13",
              description: "Online Subscription - Netflix",
              amount: -15.99,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-01-14",
              description: "Gas Station - BP",
              amount: -52.4,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-01-15",
              description: "Coffee Shop Payment",
              amount: -5.75,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-01-16",
              description: "Bank Interest",
              amount: 12.5,
              currency: "USD",
              type: "Credit",
            },
            {
              date: "2024-01-17",
              description: "Online Shopping - eBay",
              amount: -78.99,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-01-18",
              description: "Grocery Store - Whole Foods",
              amount: -189.45,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-01-19",
              description: "Medical - Doctor Visit",
              amount: -250.0,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-01-20",
              description: "Transfer from Savings",
              amount: 500.0,
              currency: "USD",
              type: "Credit",
            },
            {
              date: "2024-01-21",
              description: "Car Insurance",
              amount: -145.0,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-01-22",
              description: "Pharmacy - CVS",
              amount: -28.95,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-01-23",
              description: "Restaurant - McDonald's",
              amount: -12.45,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-01-24",
              description: "Online Purchase - Best Buy",
              amount: -299.99,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-01-25",
              description: "Gas Station - Exxon",
              amount: -48.75,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-01-26",
              description: "Freelance Payment",
              amount: 800.0,
              currency: "USD",
              type: "Credit",
            },
            {
              date: "2024-01-27",
              description: "Grocery Store - Kroger",
              amount: -167.23,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-01-28",
              description: "Movie Theater",
              amount: -25.5,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-01-29",
              description: "Online Subscription - Spotify",
              amount: -9.99,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-01-30",
              description: "Restaurant - Chipotle",
              amount: -14.75,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-01-31",
              description: "ATM Fee",
              amount: -3.0,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-02-01",
              description: "Health Insurance",
              amount: -320.0,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-02-02",
              description: "Internet Bill - Comcast",
              amount: -79.99,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-02-03",
              description: "Cash Back Reward",
              amount: 25.0,
              currency: "USD",
              type: "Credit",
            },
            {
              date: "2024-02-04",
              description: "Clothing Store - H&M",
              amount: -89.5,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-02-05",
              description: "Gas Station - Shell",
              amount: -51.3,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-02-06",
              description: "Salary Deposit",
              amount: 3200.0,
              currency: "USD",
              type: "Credit",
            },
            {
              date: "2024-02-07",
              description: "Grocery Store - Safeway",
              amount: -145.67,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-02-08",
              description: "Coffee Shop - Dunkin",
              amount: -6.85,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-02-09",
              description: "Home Improvement - Home Depot",
              amount: -234.99,
              currency: "USD",
              type: "Debit",
            },
            {
              date: "2024-02-10",
              description: "Restaurant - Pizza Hut",
              amount: -28.99,
              currency: "USD",
              type: "Debit",
            },
          ]

          setExtractedData(mockData)
          setUploadState("completed")
          resolve()
        } else {
          reject(new Error("Extraction failed"))
        }
      }, 3000) // 3 second delay to simulate processing
    })
  }

  // Handle XLSX download
  const handleDownloadXLSX = () => {
    // TODO: Implement actual XLSX generation and download
    console.log("Downloading XLSX with data:", extractedData)

    // For now, just create a simple CSV as a placeholder
    const csvContent = [
      ["Date", "Description", "Amount", "Currency", "Type"],
      ...extractedData.map((tx) => [
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
    setExtractedData([])
    setCurrentFile(null)
    setErrorMessage("")
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
              maxFileSize={10 * 1024 * 1024} // 10MB
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

        {uploadState === "completed" && extractedData.length > 0 && (
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
              data={extractedData}
              columns={
                dictionary.viewer_page
                  ?.table_columns as unknown as import("@/components/viewer/data-table").ColumnLabels
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
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Processing Error</AlertTitle>
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
    </div>
  )
}
