/**
 * File validation utilities for PDF file uploads
 * Initially supporting only PDF files for processing with Gemini API
 */

import { z } from "zod"

// Initially supporting only PDF files
export const SUPPORTED_FILE_TYPES = {
  // Documents
  PDF: "application/pdf",
} as const

export const SUPPORTED_MIME_TYPES = Object.values(SUPPORTED_FILE_TYPES)

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  // 20MB for PDF files
  PDF_FILES: 20 * 1024 * 1024,
} as const

// Get appropriate file size limit based on MIME type
export function getFileSizeLimit(mimeType: string): number {
  if (mimeType === SUPPORTED_FILE_TYPES.PDF) {
    return FILE_SIZE_LIMITS.PDF_FILES
  }
  return FILE_SIZE_LIMITS.PDF_FILES // Default to PDF limit
}

// Zod schema for PDF file validation
export const fileSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size > 0, "File cannot be empty")
    .refine((file) => file.type === SUPPORTED_FILE_TYPES.PDF, "Only PDF files are supported")
    .refine(
      (file) => file.size <= FILE_SIZE_LIMITS.PDF_FILES,
      "PDF file size must be less than 20MB",
    ),
})

export type FileValidationResult = z.infer<typeof fileSchema>

/**
 * Validates a PDF file against our supported types and size limits
 */
export function validateFile(file: File): { success: boolean; error?: string } {
  try {
    fileSchema.parse({ file })
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "File validation failed",
      }
    }
    return { success: false, error: "File validation failed" }
  }
}

/**
 * Gets human-readable file type category
 */
export function getFileCategory(mimeType: string): string {
  if (mimeType === SUPPORTED_FILE_TYPES.PDF) return "PDF Document"
  return "Document"
}

/**
 * Formats file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}
