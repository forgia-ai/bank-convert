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
    throw new Error("Failed to count PDF pages")
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
    throw new Error("Failed to extract PDF text")
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
  creationDate?: Date
}> {
  try {
    logger.info({ fileSize: fileBuffer.length }, "Getting PDF metadata")

    const data = await pdf(fileBuffer)

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
        fileSize: fileBuffer.length,
      },
      "Successfully extracted PDF metadata",
    )

    return metadata
  } catch (error) {
    logger.error({ error, fileSize: fileBuffer.length }, "Error getting PDF metadata")
    throw new Error("Failed to get PDF metadata")
  }
}
