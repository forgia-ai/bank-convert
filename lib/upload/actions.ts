/**
 * Server actions for PDF file upload and processing
 * Light wrapper around file validation and LLM processing
 */

"use server"

import { validateFile } from "@/lib/upload/file-validation"
import { extractBankingDataFromPDF, type BankingData } from "@/lib/ai/transactions-extractor"
import { getPdfMetadata } from "@/lib/upload/pdf-utils"
import { logger } from "@/lib/utils/logger"

export type { BankingData }

// Result type for file processing
export type FileProcessingResult = {
  success: boolean
  data?: BankingData
  error?: string
  fileName?: string
  fileSize?: number
  pageCount?: number
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

    logger.info(
      { fileName: file.name },
      "PDF validation successful, extracting metadata and LLM processing",
    )

    // Create buffer once for both metadata extraction and LLM processing
    logger.info(
      { fileName: file.name, fileSize: file.size, fileType: file.type },
      "Creating file buffer for metadata extraction and LLM processing",
    )

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    logger.info(
      {
        fileName: file.name,
        bufferLength: fileBuffer.length,
        isBuffer: Buffer.isBuffer(fileBuffer),
        bufferStart: fileBuffer.slice(0, 10).toString("hex"),
      },
      "Created buffer from file",
    )

    // Extract PDF metadata (including page count) for usage tracking
    let pageCount = 0
    try {
      logger.info(
        { fileName: file.name },
        "Starting PDF metadata extraction using pre-created buffer",
      )

      const pdfMetadata = await getPdfMetadata(fileBuffer)
      pageCount = pdfMetadata.pageCount
      logger.info({ fileName: file.name, pageCount }, "Successfully extracted PDF page count")
    } catch (metadataError) {
      logger.error(
        {
          error: metadataError,
          fileName: file.name,
          errorMessage: metadataError instanceof Error ? metadataError.message : "Unknown error",
          errorStack: metadataError instanceof Error ? metadataError.stack : undefined,
        },
        "Failed to extract PDF metadata - this may be a pdf-parse library issue",
      )

      // Set a fallback page count based on file size (rough estimate: ~100KB per page)
      pageCount = Math.max(1, Math.ceil(file.size / (100 * 1024)))
      logger.warn(
        {
          fileName: file.name,
          fileSize: file.size,
          fallbackPageCount: pageCount,
        },
        "Using fallback page count estimation",
      )
    }

    // Extract banking data using LLM with pre-parsed buffer to avoid redundant file reading
    const result = await extractBankingDataFromPDF(file, fileBuffer, pageCount)

    if (result.success) {
      logger.info(
        {
          fileName: file.name,
          pageCount,
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
        pageCount,
      }
    } else {
      logger.error({ fileName: file.name, error: result.error }, "LLM extraction failed")
      return {
        success: false,
        error: result.error || "Failed to extract banking data",
        fileName: file.name,
        fileSize: file.size,
        pageCount,
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
