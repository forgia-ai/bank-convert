import pdf from "pdf-parse"
import { logger } from "@/lib/utils/logger"

/**
 * Parse PDF date string into a Date object
 * PDF dates are typically in format: D:YYYYMMDDHHmmSSOHH'mm or D:YYYYMMDDHHMMSS
 * @param pdfDateString - The raw PDF date string
 * @returns Date object or undefined if parsing fails
 */
export function parsePdfDate(pdfDateString: string | undefined): Date | undefined {
  if (!pdfDateString) return undefined

  try {
    // Remove the "D:" prefix if present
    const dateStr = pdfDateString.replace(/^D:/, "")

    // Extract date components (YYYYMMDDHHMMSS format)
    const year = parseInt(dateStr.substring(0, 4), 10)
    const month = parseInt(dateStr.substring(4, 6), 10) - 1 // Month is 0-indexed
    const day = parseInt(dateStr.substring(6, 8), 10)
    const hour = parseInt(dateStr.substring(8, 10), 10) || 0
    const minute = parseInt(dateStr.substring(10, 12), 10) || 0
    const second = parseInt(dateStr.substring(12, 14), 10) || 0

    // Validate extracted values
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return undefined
    }

    return new Date(year, month, day, hour, minute, second)
  } catch (error) {
    logger.warn({ pdfDateString, error }, "Failed to parse PDF date string")
    return undefined
  }
}

/**
 * Count the number of pages in a PDF file
 * @param fileBuffer - The PDF file as a Buffer
 * @returns Promise<number> - The number of pages in the PDF
 */
export async function countPdfPages(fileBuffer: Buffer): Promise<number> {
  try {
    logger.info({ fileSize: fileBuffer.length }, "Counting PDF pages")

    const data = await pdf(fileBuffer)
    const pageCount = data.numpages

    logger.info({ pageCount, fileSize: fileBuffer.length }, "Successfully counted PDF pages")

    return pageCount
  } catch (error) {
    logger.error({ error, fileSize: fileBuffer.length }, "Error counting PDF pages")
    throw new Error("Failed to count PDF pages", { cause: error as Error })
  }
}

/**
 * Extract text from PDF file (utility function for later use)
 * @param fileBuffer - The PDF file as a Buffer
 * @returns Promise<string> - The extracted text content
 */
export async function extractPdfText(fileBuffer: Buffer): Promise<string> {
  try {
    logger.info({ fileSize: fileBuffer.length }, "Extracting PDF text")

    const data = await pdf(fileBuffer)
    const text = data.text

    logger.info(
      {
        textLength: text.length,
        pageCount: data.numpages,
        fileSize: fileBuffer.length,
      },
      "Successfully extracted PDF text",
    )

    return text
  } catch (error) {
    logger.error({ error, fileSize: fileBuffer.length }, "Error extracting PDF text")
    throw new Error("Failed to extract PDF text", { cause: error as Error })
  }
}

/**
 * Get PDF metadata including page count and text
 * @param fileBuffer - The PDF file as a Buffer
 * @returns Promise with page count and text content
 */
export async function getPdfMetadata(fileBuffer: Buffer): Promise<{
  pageCount: number
  text: string
  title?: string
  author?: string
  /**
   * Raw PDF CreationDate value (e.g. "D:20240102030405Z").
   * Consumers can parse it to a `Date` if required.
   */
  /**
   * Raw PDF CreationDate value (e.g. "D:20240102030405Z").
   * Consumers can parse it to a `Date` if required.
   */
  creationDate?: string
}> {
  try {
    // Validate input
    if (!Buffer.isBuffer(fileBuffer)) {
      throw new Error("Input is not a valid Buffer")
    }

    if (fileBuffer.length === 0) {
      throw new Error("Buffer is empty")
    }

    // Check if it looks like a PDF (starts with %PDF)
    const pdfHeader = fileBuffer.slice(0, 4).toString("ascii")
    if (pdfHeader !== "%PDF") {
      throw new Error(`Invalid PDF header: expected '%PDF', got '${pdfHeader}'`)
    }

    logger.info({ fileSize: fileBuffer.length }, "Getting PDF metadata")

    const data = await pdf(fileBuffer, {
      // Explicitly pass options to ensure pdf-parse doesn't try to read from filesystem
      max: 0, // Parse all pages
      version: "v1.10.100", // Be explicit about version handling
    })

    const metadata = {
      pageCount: data.numpages,
      text: data.text,
      title: data.info?.Title,
      author: data.info?.Author,
      creationDate: data.info?.CreationDate,
    }

    logger.info(
      {
        pageCount: metadata.pageCount,
        textLength: metadata.text.length,
        hasTitle: !!metadata.title,
        hasCreationDate: !!metadata.creationDate,
        fileSize: fileBuffer.length,
      },
      "Successfully extracted PDF metadata",
    )

    return metadata
  } catch (error) {
    logger.error(
      {
        error,
        fileSize: fileBuffer?.length || 0,
        isBuffer: Buffer.isBuffer(fileBuffer),
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : undefined,
      },
      "Error getting PDF metadata",
    )
    throw new Error("Failed to get PDF metadata", { cause: error as Error })
  }
}
