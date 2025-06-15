import pdf from "pdf-parse"
import { logger } from "@/lib/utils/logger"

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
