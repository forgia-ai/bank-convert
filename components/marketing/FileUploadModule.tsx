// This component will handle the file upload functionality,
// including a drag-and-drop zone and a file input button.
"use client"

import React, { useCallback, useState, useImperativeHandle, forwardRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDropzone, FileRejection } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { UploadCloud, File as FileIcon, XCircle } from "lucide-react"
import type { Locale } from "@/i18n-config"
import RateLimitModal from "@/components/modals/RateLimitModal"
import {
  validateFile,
  SUPPORTED_FILE_TYPES,
  formatFileSize,
  getFileSizeLimit,
} from "@/lib/upload/file-validation"

export interface FileUploadModuleRef {
  openFileDialog: () => void
}

export interface FileUploadModuleStrings {
  errorFileTooLargePrefix: string
  errorFileTooLargeSuffix: string
  errorInvalidFileType: string
  errorGenericUpload: string
  dropzoneDraggingText: string
  dropzoneDefaultTextClick: string
  dropzoneDefaultTextDrag: string
  dropzoneHintPrefix: string
  dropzoneHintSuffix: string
  fileInfoUnit: string
  progressFileReady: string
  buttonOrSelectFile: string // Used if hideSelectFileButton is false
  placeholderFileProcessed: string // Used when file is processed
  buttonUploadAnother: string // Used when file is processed
  buttonDownloadSample: string // Used when file is processed
  alertTitleUploadError: string
}

// Preview data interface for unauthenticated users
export interface PreviewData {
  totalTransactions: number
  totalPages: number
  previewTransactions: Array<{
    date: string
    description: string
    amount: number
    currency: string
    type: string
  }>
  filename: string
}

interface FileUploadModuleProps {
  onFileUpload: (file: File) => void
  lang: Locale // Added lang prop
  hideSelectFileButton?: boolean
  disableRedirect?: boolean // Add prop to disable automatic redirection
  strings: FileUploadModuleStrings
  // New props for unauthenticated flow
  isAuthenticated?: boolean
  userType?: "anonymous" | "free" | "paid"
  onPreviewGenerated?: (data: PreviewData) => void
}

const FileUploadModule = forwardRef<FileUploadModuleRef, FileUploadModuleProps>(
  (
    {
      onFileUpload,
      lang, // Added lang prop
      hideSelectFileButton = false,
      disableRedirect = false, // Default to false for backwards compatibility
      strings,
      // New props for unauthenticated flow
      isAuthenticated = true, // Default to authenticated for backwards compatibility
      userType = "free", // eslint-disable-line @typescript-eslint/no-unused-vars
      onPreviewGenerated,
    },
    ref,
  ) => {
    const router = useRouter() // Added for redirection
    const [file, setFile] = useState<File | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [progress, setProgress] = useState<number | null>(null)
    const [showRateLimitModal, setShowRateLimitModal] = useState(false)
    const [isRateLimited, setIsRateLimited] = useState(false)

    // Mock rate limiting for anonymous users
    const checkAnonymousRateLimit = useCallback((): boolean => {
      if (isAuthenticated) return false // No rate limiting for authenticated users

      const lastUploadKey = "anonymous_last_upload"
      const lastUpload = localStorage.getItem(lastUploadKey)

      if (!lastUpload) return false // No previous upload

      const lastUploadDate = new Date(lastUpload)
      const now = new Date()

      // Check if it's been less than a month (30 days)
      const daysDiff = (now.getTime() - lastUploadDate.getTime()) / (1000 * 3600 * 24)

      return daysDiff < 30 // Rate limited if less than 30 days
    }, [isAuthenticated])

    const recordAnonymousUpload = useCallback(() => {
      if (!isAuthenticated) {
        localStorage.setItem("anonymous_last_upload", new Date().toISOString())
      }
    }, [isAuthenticated])

    // Check rate limit on component mount for anonymous users
    useEffect(() => {
      if (!isAuthenticated) {
        setIsRateLimited(checkAnonymousRateLimit())
      }
    }, [isAuthenticated, checkAnonymousRateLimit])

    // Mock function to generate preview data for unauthenticated users
    const generateMockPreviewData = (file: File): PreviewData => {
      // Generate mock transaction data
      const mockTransactions = [
        {
          date: "2024-01-15",
          description: "Grocery Store Purchase",
          amount: -85.42,
          currency: "USD",
          type: "debit",
        },
        {
          date: "2024-01-14",
          description: "Salary Deposit",
          amount: 3500.0,
          currency: "USD",
          type: "credit",
        },
        {
          date: "2024-01-13",
          description: "Gas Station",
          amount: -45.2,
          currency: "USD",
          type: "debit",
        },
        {
          date: "2024-01-12",
          description: "Online Transfer",
          amount: -200.0,
          currency: "USD",
          type: "debit",
        },
        {
          date: "2024-01-11",
          description: "Restaurant",
          amount: -67.89,
          currency: "USD",
          type: "debit",
        },
        {
          date: "2024-01-10",
          description: "ATM Withdrawal",
          amount: -100.0,
          currency: "USD",
          type: "debit",
        },
        {
          date: "2024-01-09",
          description: "Utility Bill Payment",
          amount: -125.5,
          currency: "USD",
          type: "debit",
        },
        {
          date: "2024-01-08",
          description: "Coffee Shop",
          amount: -12.75,
          currency: "USD",
          type: "debit",
        },
        {
          date: "2024-01-07",
          description: "Freelance Payment",
          amount: 850.0,
          currency: "USD",
          type: "credit",
        },
        {
          date: "2024-01-06",
          description: "Subscription Service",
          amount: -15.99,
          currency: "USD",
          type: "debit",
        },
      ]

      // Simulate different document sizes based on file size
      const totalTransactions = Math.floor(Math.random() * 40) + 30 // 30-70 transactions
      const totalPages = Math.ceil(totalTransactions / 15) // ~15 transactions per page

      return {
        totalTransactions,
        totalPages,
        previewTransactions: mockTransactions.slice(0, 10), // Show first 10
        filename: file.name,
      }
    }

    // Custom file validation using our robust validation system
    const handleFileValidation = useCallback((file: File): string | null => {
      const validation = validateFile(file)
      if (!validation.success) {
        return validation.error || "File validation failed"
      }
      return null
    }, [])

    const onDrop = useCallback(
      (acceptedFiles: File[], fileRejections: FileRejection[]) => {
        setError(null)
        setFile(null)
        setProgress(null)

        // Check rate limiting for anonymous users
        if (!isAuthenticated && checkAnonymousRateLimit()) {
          setShowRateLimitModal(true)
          return
        }

        // Handle file rejections from react-dropzone
        if (fileRejections.length > 0) {
          const firstRejection = fileRejections[0]
          if (firstRejection.errors && firstRejection.errors.length > 0) {
            const firstError = firstRejection.errors[0]
            if (firstError.code === "file-too-large") {
              setError(
                `${strings.errorFileTooLargePrefix}${formatFileSize(getFileSizeLimit(SUPPORTED_FILE_TYPES.PDF))}${strings.errorFileTooLargeSuffix}`,
              )
            } else if (firstError.code === "file-invalid-type") {
              setError(strings.errorInvalidFileType)
            } else {
              setError(firstError.message)
            }
          } else {
            setError(strings.errorGenericUpload)
          }
          return
        }

        if (acceptedFiles.length > 0) {
          const selectedFile = acceptedFiles[0]

          // Use our robust validation system for additional validation
          const validationError = handleFileValidation(selectedFile)
          if (validationError) {
            setError(validationError)
            return
          }

          setFile(selectedFile)
          setProgress(0)
          let currentProgress = 0
          const interval = setInterval(() => {
            currentProgress += 10
            if (currentProgress <= 100) {
              setProgress(currentProgress)
            } else {
              clearInterval(interval)
              setProgress(100)
              onFileUpload(selectedFile)

              // Record upload for anonymous users (for rate limiting)
              recordAnonymousUpload()

              // Handle different user types and redirection
              if (!disableRedirect && lang) {
                if (!isAuthenticated) {
                  // For unauthenticated users, generate preview data and redirect to preview page
                  const previewData = generateMockPreviewData(selectedFile)
                  if (onPreviewGenerated) {
                    onPreviewGenerated(previewData)
                  }
                  router.push(`/${lang}/preview`)
                } else {
                  // For authenticated users, redirect to viewer as before
                  router.push(`/${lang}/viewer`)
                }
              } else if (!disableRedirect) {
                console.error("FileUploadModule: lang is undefined, cannot redirect correctly!")
                // Optionally, handle this error case, e.g., redirect to a generic error page or homepage
                // router.push("/error");
              } else {
                // When redirect is disabled, reset the component state immediately
                // so the parent component can take over the UI
                setTimeout(() => {
                  setFile(null)
                  setProgress(null)
                }, 100) // Small delay to allow the parent to process the file
              }
            }
          }, 200)
        }
      },
      [
        onFileUpload,
        strings.errorFileTooLargePrefix,
        strings.errorFileTooLargeSuffix,
        strings.errorInvalidFileType,
        strings.errorGenericUpload,
        router, // Added router to dependencies
        lang, // Added lang to dependencies
        disableRedirect, // Added disableRedirect to dependencies
        isAuthenticated, // Added for unauthenticated flow
        onPreviewGenerated, // Added for preview data callback
        checkAnonymousRateLimit, // Added for rate limiting
        recordAnonymousUpload, // Added for rate limiting
        handleFileValidation, // Added our validation function
      ],
    )

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
      onDrop,
      accept: { [SUPPORTED_FILE_TYPES.PDF]: [".pdf"] },
      maxSize: getFileSizeLimit(SUPPORTED_FILE_TYPES.PDF),
      multiple: false,
      noClick: false, // Allow clicking on the dropzone to open file dialog
    })

    // Expose the open function via ref
    useImperativeHandle(ref, () => ({
      openFileDialog: open,
    }))

    const handleRemoveFile = () => {
      setFile(null)
      setError(null)
      setProgress(null)
    }

    return (
      <div className="w-full max-w-lg mx-auto p-6 border border-dashed border-muted-foreground/30 rounded-lg bg-background shadow-sm text-center">
        {error && (
          <Alert variant="destructive" className="mb-4 text-left">
            <XCircle className="h-4 w-4" />
            <AlertTitle>{strings.alertTitleUploadError}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!file && !progress && (
          <>
            <div
              {...(isRateLimited ? {} : getRootProps())}
              className={`p-8 border-2 border-dashed rounded-md 
              ${
                isRateLimited
                  ? "border-red-300 bg-red-50"
                  : isDragActive
                    ? "border-primary bg-primary/10 cursor-pointer"
                    : "border-muted-foreground/50 hover:border-primary/70 cursor-pointer"
              }
              transition-colors duration-200 ease-in-out`}
            >
              {!isRateLimited && <input {...getInputProps()} />}
              <UploadCloud
                className={`mx-auto h-12 w-12 mb-4 ${isRateLimited ? "text-red-400" : "text-muted-foreground"}`}
              />
              {isRateLimited ? (
                <>
                  <p className="text-red-600 font-semibold mb-2">Upload Limit Reached</p>
                  <p className="text-xs text-red-500 mb-4">
                    You&apos;ve used your free upload for this month.
                  </p>
                </>
              ) : isDragActive ? (
                <p className="text-primary font-semibold">{strings.dropzoneDraggingText}</p>
              ) : (
                <>
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold text-primary">
                      {strings.dropzoneDefaultTextClick}
                    </span>
                    {strings.dropzoneDefaultTextDrag}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {strings.dropzoneHintPrefix}
                    {formatFileSize(getFileSizeLimit(SUPPORTED_FILE_TYPES.PDF))}
                    {strings.dropzoneHintSuffix}
                  </p>
                </>
              )}
            </div>

            {/* Sign Up CTA for rate limited users */}
            {isRateLimited && (
              <div className="mt-4">
                <Button
                  onClick={() => router.push(`/${lang}/sign-up`)}
                  className="w-full cursor-pointer"
                >
                  Sign Up Free - Get 50 Pages
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Create a free account to continue processing bank statements
                </p>
              </div>
            )}
          </>
        )}

        {progress !== null && file && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-sm">
                <FileIcon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(file.size / (1024 * 1024)).toFixed(2)}
                  {strings.fileInfoUnit})
                </span>
              </div>
              {progress === 100 ? (
                <XCircle
                  className="h-5 w-5 text-destructive cursor-pointer"
                  onClick={handleRemoveFile}
                />
              ) : (
                <span className="text-sm font-medium">{progress}%</span>
              )}
            </div>
            <Progress value={progress} className="w-full h-2" />
            {progress === 100 && !disableRedirect && (
              <p className="text-xs text-green-600 mt-1">{strings.progressFileReady}</p>
            )}
          </div>
        )}

        {!file && !progress && !hideSelectFileButton && !isRateLimited && (
          <Button onClick={open} variant="outline" className="mt-6">
            {strings.buttonOrSelectFile}
          </Button>
        )}

        {file && progress === 100 && !disableRedirect && (
          <>
            <div className="mt-6 p-4 border rounded-md bg-muted/20">
              <p className="text-sm text-muted-foreground">{strings.placeholderFileProcessed}</p>
            </div>
            <div className="mt-4 flex gap-2 justify-center">
              <Button onClick={handleRemoveFile} variant="outline">
                {strings.buttonUploadAnother}
              </Button>
              <Button variant="default">{strings.buttonDownloadSample}</Button>
            </div>
          </>
        )}

        {/* Rate Limit Modal for Anonymous Users */}
        <RateLimitModal
          isOpen={showRateLimitModal}
          onClose={() => setShowRateLimitModal(false)}
          lang={lang}
          dictionary={{
            rate_limit_modal: {
              title: "Upload Limit Reached",
              description:
                "You&apos;ve used your free upload for this month. Sign up to get 50 pages total and continue processing your bank statements.",
              signup_button: "Sign Up Free",
              pricing_button: "See Pricing",
            },
          }}
        />
      </div>
    )
  },
)

FileUploadModule.displayName = "FileUploadModule" // for better debugging
export default FileUploadModule
