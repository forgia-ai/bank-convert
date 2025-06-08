// This component will handle the file upload functionality,
// including a drag-and-drop zone and a file input button.
"use client"

import {
  validateFile,
  SUPPORTED_FILE_TYPES,
  formatFileSize,
  getFileSizeLimit,
} from "@/lib/upload/file-validation"
import { processPdfFile, type BankingData } from "@/lib/upload/actions"
import RateLimitModal from "@/components/modals/RateLimitModal"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { UploadCloud, File as FileIcon, XCircle } from "lucide-react"
import React, {
  useCallback,
  useState,
  useImperativeHandle,
  forwardRef,
  useEffect,
  useRef,
} from "react"
import { useRouter } from "next/navigation"
import { useDropzone, FileRejection } from "react-dropzone"
import type { Locale } from "@/i18n-config"

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
  progressUploading: string // "Uploading document..."
  progressExtracting: string // "Extracting transaction data..."
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
  lang: Locale
  hideSelectFileButton?: boolean
  disableRedirect?: boolean // Add prop to disable automatic redirection
  strings: FileUploadModuleStrings
  isAuthenticated?: boolean
  userType?: "anonymous" | "free" | "paid"
  onPreviewGenerated?: (data: PreviewData) => void
  // Force enhanced two-phase progress regardless of authentication status
  useTwoPhaseProgress?: boolean
  // Callback for when processing completes (for authenticated users with two-phase progress)
  onProcessingComplete?: (data: BankingData) => void
}

const FileUploadModule = forwardRef<FileUploadModuleRef, FileUploadModuleProps>(
  (
    {
      onFileUpload,
      lang,
      hideSelectFileButton = false,
      disableRedirect = false, // Default to false for backwards compatibility
      strings,

      isAuthenticated = true, // Default to authenticated for backwards compatibility
      onPreviewGenerated,
      useTwoPhaseProgress = false,
      onProcessingComplete,
    },
    ref,
  ) => {
    const router = useRouter()
    const [file, setFile] = useState<File | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [progress, setProgress] = useState<number | null>(null)
    const [processingPhase, setProcessingPhase] = useState<"uploading" | "extracting">("uploading")
    const [showRateLimitModal, setShowRateLimitModal] = useState(false)
    const [isRateLimited, setIsRateLimited] = useState(false)

    // Ref to store interval ID for cleanup
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // Cleanup interval on component unmount
    useEffect(() => {
      return () => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
          progressIntervalRef.current = null
        }
      }
    }, [])

    // Cleanup interval when file changes
    useEffect(() => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
    }, [file])

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

    // Function to perform actual extraction for unauthenticated users (limited preview)
    const processFileForPreview = useCallback(async (file: File): Promise<PreviewData | null> => {
      try {
        const formData = new FormData()
        formData.append("file", file)

        // Use the existing processPdfFile function
        const result = await processPdfFile(formData)

        if (result.success && result.data) {
          const bankingData = result.data

          // Calculate total transaction count (only actual transactions, not balance)
          const totalTransactions = bankingData.transactions?.length || 0
          const estimatedPages = Math.max(1, Math.ceil(totalTransactions / 15)) // ~15 transactions per page

          // Convert transactions to preview format (limit to first 10)
          const previewTransactions = (bankingData.transactions || [])
            .slice(0, 10) // Limit to first 10 transactions for preview
            .map((transaction) => {
              const parsedAmount = parseFloat(transaction.amount) || 0

              // Debug: Log if LLM returns non-standardized amounts (should not happen)
              if (isNaN(parsedAmount) || transaction.amount !== parsedAmount.toString()) {
                console.warn("LLM returned non-standardized amount:", {
                  original: transaction.amount,
                  parsed: parsedAmount,
                  description: transaction.description,
                })
              }

              return {
                date: transaction.date,
                description: transaction.description,
                amount: parsedAmount, // LLM should return standardized amounts like "1234.56"
                currency: bankingData.currency || "USD",
                type: transaction.type === "credit" ? "Credit" : "Debit",
              }
            })

          return {
            totalTransactions,
            totalPages: estimatedPages,
            previewTransactions,
            filename: file.name,
          }
        } else {
          throw new Error(result.error || "Failed to process file")
        }
      } catch (error) {
        console.error("Error processing file for preview:", error)
        throw error
      }
    }, [])

    // Handle processing for authenticated users with two-phase progress
    const handleAuthenticatedTwoPhaseProcessing = useCallback(
      async (selectedFile: File) => {
        try {
          onFileUpload(selectedFile)

          // Phase 1: Upload simulation (fast)
          setProcessingPhase("uploading")
          setProgress(0)

          // Simulate upload progress (quick - 1 second)
          for (let i = 0; i <= 10; i += 5) {
            setProgress(i)
            await new Promise((resolve) => setTimeout(resolve, 100)) // 100ms per step
          }

          // Phase 2: Extraction (longer)
          setProcessingPhase("extracting")
          setProgress(10)

          // Start gradual progress simulation during extraction
          progressIntervalRef.current = setInterval(() => {
            setProgress((current) => {
              if (current !== null && current < 90) {
                // Gradually increase from 10% to 90% over time
                return Math.min(current + 2, 90)
              }
              return current
            })
          }, 500) // Increase by 2% every 500ms (2x faster)

          try {
            // Perform actual extraction
            const formData = new FormData()
            formData.append("file", selectedFile)
            const result = await processPdfFile(formData)

            // Clear the interval and complete progress
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current)
              progressIntervalRef.current = null
            }
            setProgress(100)

            if (result.success && result.data) {
              // Notify parent component of successful processing
              if (onProcessingComplete) {
                onProcessingComplete(result.data)
              }

              // Don't reset component state - let parent control the transition
              // This prevents the flicker back to upload state
            } else {
              throw new Error(result.error || "Failed to process file")
            }
          } catch (error) {
            // Clear the interval on error
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current)
              progressIntervalRef.current = null
            }
            throw error // Re-throw to be caught by outer catch block
          }
        } catch (error) {
          console.error("Error in authenticated two-phase processing:", error)
          setError(
            error instanceof Error
              ? error.message
              : "Failed to process the file. Please try again.",
          )
          setProgress(null)
          setProcessingPhase("uploading")
          setFile(null)
        }
      },
      [onFileUpload, onProcessingComplete],
    )

    // Handle processing for unauthenticated users
    const handleUnauthenticatedProcessing = useCallback(
      async (selectedFile: File) => {
        try {
          onFileUpload(selectedFile)

          // Phase 1: Upload simulation (fast)
          setProcessingPhase("uploading")
          setProgress(0)

          // Simulate upload progress (quick - 1 second)
          for (let i = 0; i <= 10; i += 5) {
            setProgress(i)
            await new Promise((resolve) => setTimeout(resolve, 100)) // 100ms per step
          }

          // Phase 2: Extraction (longer)
          setProcessingPhase("extracting")
          setProgress(10)

          // Start gradual progress simulation during extraction
          progressIntervalRef.current = setInterval(() => {
            setProgress((current) => {
              if (current !== null && current < 90) {
                // Gradually increase from 10% to 90% over time
                return Math.min(current + 2, 90)
              }
              return current
            })
          }, 500) // Increase by 2% every 500ms (2x faster)

          try {
            // Perform actual extraction
            const previewData = await processFileForPreview(selectedFile)

            // Clear the interval and complete progress
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current)
              progressIntervalRef.current = null
            }
            setProgress(100)

            if (previewData) {
              // Store preview data and redirect directly to preview page
              if (onPreviewGenerated) {
                onPreviewGenerated(previewData)
              }

              // Record upload only after successful processing
              recordAnonymousUpload()

              // Small delay to show completion, then redirect
              await new Promise((resolve) => setTimeout(resolve, 500))

              if (lang) {
                router.push(`/${lang}/preview`)
              } else {
                console.error("FileUploadModule: lang is undefined, cannot redirect correctly!")
              }
            } else {
              throw new Error("No preview data generated")
            }
          } catch (error) {
            // Clear the interval on error
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current)
              progressIntervalRef.current = null
            }
            throw error // Re-throw to be caught by outer catch block
          }
        } catch (error) {
          console.error("Error in unauthenticated processing:", error)
          setError(
            error instanceof Error
              ? error.message
              : "Failed to process the file. Please try again or sign up for full access.",
          )
          setProgress(null)
          setProcessingPhase("uploading")
          setFile(null)
        }
      },
      [
        onFileUpload,
        recordAnonymousUpload,
        processFileForPreview,
        onPreviewGenerated,
        lang,
        router,
      ],
    )

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
        setProcessingPhase("uploading")

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

          // Handle different user types and processing modes
          if (!isAuthenticated && !disableRedirect) {
            // For unauthenticated users, perform actual extraction with preview (async)
            handleUnauthenticatedProcessing(selectedFile)
          } else if (useTwoPhaseProgress) {
            // For authenticated users with enhanced two-phase progress
            handleAuthenticatedTwoPhaseProcessing(selectedFile)
          } else {
            // For authenticated users or when redirect is disabled, use the original progress simulation
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

                // Handle redirection for authenticated users
                if (!disableRedirect && lang && isAuthenticated) {
                  router.push(`/${lang}/viewer`)
                } else if (!disableRedirect && !lang) {
                  console.error("FileUploadModule: lang is undefined, cannot redirect correctly!")
                } else if (disableRedirect) {
                  // When redirect is disabled, reset the component state immediately
                  // so the parent component can take over the UI
                  setTimeout(() => {
                    setFile(null)
                    setProgress(null)
                    setProcessingPhase("uploading")
                  }, 100) // Small delay to allow the parent to process the file
                }
              }
            }, 200)
          }
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
        useTwoPhaseProgress, // Added for enhanced progress mode
        checkAnonymousRateLimit, // Added for rate limiting
        recordAnonymousUpload, // Added for rate limiting
        handleFileValidation, // Added our validation function
        handleUnauthenticatedProcessing, // Added new processing function
        handleAuthenticatedTwoPhaseProcessing, // Added authenticated two-phase processing
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
      setProcessingPhase("uploading")
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

            {/* Show phase-specific text */}
            {progress < 100 && (
              <p className="text-xs text-muted-foreground mt-1">
                {processingPhase === "uploading"
                  ? strings.progressUploading
                  : strings.progressExtracting}
              </p>
            )}

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
