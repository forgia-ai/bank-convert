/**
 * Server actions for PDF file upload and processing
 * Light wrapper around file validation and LLM processing
 */

"use server"

import { validateFile } from "@/lib/upload/file-validation"
import { extractBankingDataFromPDF, type BankingData } from "@/lib/ai/transactions-extractor"
import { logger } from "@/lib/logger"

export type { BankingData }

// Result type for file processing
export type FileProcessingResult = {
  success: boolean
  data?: BankingData
  error?: string
  fileName?: string
  fileSize?: number
}

/**
 * Processes uploaded PDF file and extracts banking data
 * Light wrapper around validation and LLM processing
 */
export async function processPdfFile(formData: FormData): Promise<FileProcessingResult> {
  try {
    // Extract file from FormData
    const file = formData.get("file") as File

    if (!file) {
      logger.warn({}, "PDF processing failed: No file provided")
      return {
        success: false,
        error: "No file provided",
      }
    }

    logger.info({ fileName: file.name, fileSize: file.size }, "Starting PDF file processing")

    // Validate the PDF file
    const validation = validateFile(file)
    if (!validation.success) {
      logger.warn({ fileName: file.name, error: validation.error }, "PDF validation failed")
      return {
        success: false,
        error: validation.error,
      }
    }

    logger.info({ fileName: file.name }, "PDF validation successful, starting LLM extraction")

    // Extract banking data using LLM
    const result = await extractBankingDataFromPDF(file)

    if (result.success) {
      logger.info(
        {
          fileName: file.name,
          transactionCount: result.data?.transactions?.length || 0,
          hasBalance: !!result.data?.balance,
          bankName: result.data?.bankName,
        },
        "PDF processing completed successfully",
      )

      return {
        success: true,
        data: result.data,
        fileName: file.name,
        fileSize: file.size,
      }
    } else {
      logger.error({ fileName: file.name, error: result.error }, "LLM extraction failed")
      return {
        success: false,
        error: result.error || "Failed to extract banking data",
        fileName: file.name,
        fileSize: file.size,
      }
    }
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      "PDF processing failed with unexpected error",
    )

    return {
      success: false,
      error: "ERROR_PDF_PROCESSING_FAILED",
    }
  }
}

/**
 * Validates file upload without processing
 * Useful for client-side validation feedback
 */
export async function validateFileUpload(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const file = formData.get("file") as File

    if (!file) {
      return {
        success: false,
        error: "No file provided",
      }
    }

    return validateFile(file)
  } catch {
    return {
      success: false,
      error: "File validation failed",
    }
  }
}
