// This component will handle the file upload functionality,
// including a drag-and-drop zone and a file input button.
"use client"

import React, { useCallback, useState, useImperativeHandle, forwardRef } from "react"
import { useRouter } from "next/navigation"
import { useDropzone, FileRejection } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { UploadCloud, File as FileIcon, XCircle } from "lucide-react"
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
  maxFileSize?: number
  acceptedFileTypes?: Record<string, string[]>
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
      maxFileSize = 5 * 1024 * 1024,
      acceptedFileTypes = { "application/pdf": [".pdf"], "text/csv": [".csv"] },
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
    console.log("FileUploadModule rendered/updated. lang prop:", lang) // DEBUG LOG
    const [file, setFile] = useState<File | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [progress, setProgress] = useState<number | null>(null)

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

    const onDrop = useCallback(
      (acceptedFiles: File[], fileRejections: FileRejection[]) => {
        setError(null)
        setFile(null)
        setProgress(null)

        if (fileRejections.length > 0) {
          const firstRejection = fileRejections[0]
          if (firstRejection.errors && firstRejection.errors.length > 0) {
            const firstError = firstRejection.errors[0]
            if (firstError.code === "file-too-large") {
              setError(
                `${strings.errorFileTooLargePrefix}${maxFileSize / (1024 * 1024)}${strings.errorFileTooLargeSuffix}`,
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
              console.log("onDrop: lang before push:", lang) // DEBUG LOG

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
              }
            }
          }, 200)
        }
      },
      [
        onFileUpload,
        maxFileSize,
        strings.errorFileTooLargePrefix,
        strings.errorFileTooLargeSuffix,
        strings.errorInvalidFileType,
        strings.errorGenericUpload,
        router, // Added router to dependencies
        lang, // Added lang to dependencies
        disableRedirect, // Added disableRedirect to dependencies
        isAuthenticated, // Added for unauthenticated flow
        onPreviewGenerated, // Added for preview data callback
      ],
    )

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
      onDrop,
      accept: acceptedFileTypes,
      maxSize: maxFileSize,
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
          <div
            {...getRootProps()}
            className={`p-8 border-2 border-dashed rounded-md cursor-pointer 
            ${isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/50 hover:border-primary/70"}
            transition-colors duration-200 ease-in-out`}
          >
            <input {...getInputProps()} />
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            {isDragActive ? (
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
                  {maxFileSize / (1024 * 1024)}
                  {strings.dropzoneHintSuffix}
                </p>
              </>
            )}
          </div>
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
            {progress === 100 && (
              <p className="text-xs text-green-600 mt-1">{strings.progressFileReady}</p>
            )}
          </div>
        )}

        {!file && !progress && !hideSelectFileButton && (
          <Button onClick={open} variant="outline" className="mt-6">
            {strings.buttonOrSelectFile}
          </Button>
        )}

        {file && progress === 100 && (
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
      </div>
    )
  },
)

FileUploadModule.displayName = "FileUploadModule" // for better debugging
export default FileUploadModule
