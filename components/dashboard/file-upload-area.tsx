// components/dashboard/file-upload-area.tsx
"use client"

import { useCallback, useState, useRef } from "react"
import { UploadCloud, FileText, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils" // For conditional class names

interface FileUploadAreaProps {
  onFileSelect: (file: File | null) => void
  acceptedFileTypes?: string[] // e.g., ['application/pdf', 'text/csv']
  maxFileSize?: number // in bytes
}

const DEFAULT_ACCEPTED_TYPES = [
  "application/pdf",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] // PDF, CSV, XLS, XLSX
const DEFAULT_MAX_SIZE_MB = 10
const DEFAULT_MAX_SIZE_BYTES = DEFAULT_MAX_SIZE_MB * 1024 * 1024

export function FileUploadArea({
  onFileSelect,
  acceptedFileTypes = DEFAULT_ACCEPTED_TYPES,
  maxFileSize = DEFAULT_MAX_SIZE_BYTES,
}: FileUploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleValidation = useCallback(
    (file: File): boolean => {
      if (!acceptedFileTypes.includes(file.type)) {
        setError(`Invalid file type. Accepted types: ${acceptedFileTypes.join(", ")}`)
        return false
      }
      if (file.size > maxFileSize) {
        setError(`File too large. Max size: ${DEFAULT_MAX_SIZE_MB}MB`)
        return false
      }
      setError(null)
      return true
    },
    [acceptedFileTypes, maxFileSize],
  )

  const handleFileChange = useCallback(
    (file: File | null) => {
      if (file) {
        if (handleValidation(file)) {
          setSelectedFile(file)
          onFileSelect(file)
        } else {
          setSelectedFile(null)
          onFileSelect(null)
          // Keep the error message displayed
        }
      } else {
        setSelectedFile(null)
        onFileSelect(null)
        setError(null)
      }
    },
    [handleValidation, onFileSelect],
  )

  const onDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
  }, [])

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    // You can add more visual feedback here if needed
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setIsDragging(false)
      if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
        handleFileChange(event.dataTransfer.files[0])
        event.dataTransfer.clearData()
      }
    },
    [handleFileChange],
  )

  const onFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      handleFileChange(event.target.files[0])
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    onFileSelect(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = "" // Reset file input
    }
  }

  const acceptedTypesString = acceptedFileTypes
    .map((type) => {
      if (type === "application/pdf") return ".pdf"
      if (type === "text/csv") return ".csv"
      if (type === "application/vnd.ms-excel") return ".xls"
      if (type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        return ".xlsx"
      return type.split("/")[1] // Fallback, e.g. 'jpeg' from 'image/jpeg'
    })
    .join(", ")

  return (
    <div className="w-full">
      <div
        className={cn(
          "flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ease-in-out",
          isDragging ? "border-primary bg-primary/10" : "border-muted hover:border-primary/70",
          error ? "border-destructive bg-destructive/10" : "",
          selectedFile && !error ? "border-green-500 bg-green-500/10" : "",
        )}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={!selectedFile ? triggerFileInput : undefined} // Only trigger file input if no file is selected
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={onFileInputChange}
          accept={acceptedFileTypes.join(",")}
        />
        {selectedFile && !error ? (
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-green-600 mb-2" />
            <p className="font-semibold text-green-700">{selectedFile.name}</p>
            <p className="text-sm text-muted-foreground">
              ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation() // Prevent triggering file input again
                removeSelectedFile()
              }}
            >
              <XCircle className="h-4 w-4 mr-1" /> Remove
            </Button>
          </div>
        ) : (
          <>
            <UploadCloud
              className={cn(
                "mx-auto h-12 w-12 mb-3",
                isDragging ? "text-primary" : "text-muted-foreground",
                error ? "text-destructive" : "",
              )}
            />
            <p
              className={cn(
                "mb-1 text-sm font-semibold",
                error ? "text-destructive" : "text-foreground",
              )}
            >
              {isDragging
                ? "Drop your file here"
                : error || "Drag & drop your statement, or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground">
              Supported types: {acceptedTypesString}. Max size: {DEFAULT_MAX_SIZE_MB}MB.
            </p>
          </>
        )}
      </div>
      {error &&
        !selectedFile && ( // Show error prominently if no file is selected but error exists (e.g., from a previous failed attempt)
          <p className="mt-2 text-sm text-destructive flex items-center">
            <XCircle className="h-4 w-4 mr-1 flex-shrink-0" /> {error}
          </p>
        )}
    </div>
  )
}
