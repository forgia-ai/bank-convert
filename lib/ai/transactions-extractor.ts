/**
 * Banking data extraction using Gemini AI
 * Handles PDF processing and structured data extraction
 */

import { generateObject } from "ai"
import { z } from "zod"
import { getGoogleProvider, DEFAULT_GEMINI_MODEL } from "@/lib/ai/gemini-config"
import { logger } from "@/lib/logger"

// System prompt for banking data extraction with format detection
const BANKING_DATA_EXTRACTION_PROMPT = `Please analyze this banking PDF document and extract the following information:

DETECTION REQUIREMENTS:
1. Detect the document's country/region based on:
   - Bank name and branding
   - Language used
   - Currency symbols
   - Date and number formatting patterns
   - Address formats

2. Identify the original date format used in the document:
   - dd/mm/yyyy (European/Brazilian format)
   - mm/dd/yyyy (US format)
   - yyyy-mm-dd (ISO format)
   - Other variants

3. Identify the original number format used:
   - Decimal separator: comma (,) or period (.)
   - Thousand separator: period (.), comma (,), space ( ), or 'none' if no separator used

EXTRACTION REQUIREMENTS:
- Account number
- Routing number  
- Account holder name
- Bank name
- Current balance (as standardized number string)
- Transaction history (date, description, amount, type)
- Statement period
- Currency

OUTPUT FORMAT REQUIREMENTS:
- Convert ALL dates to ISO format (YYYY-MM-DD)
- Convert ALL amounts to standardized format using period (.) as decimal separator and no thousand separators
- Include the detected locale and original formats in the response
- If date parsing is ambiguous or fails, mark the transaction but attempt best-guess conversion

Please extract all available information accurately. If any field is not present in the document, omit it from the response.`

// Schema for format detection metadata
const FormatDetectionSchema = z.object({
  detectedLocale: z
    .string()
    .describe("Detected country/region (e.g., 'Brazil', 'United States', 'Germany')"),
  originalDateFormat: z
    .enum(["dd/mm/yyyy", "mm/dd/yyyy", "yyyy-mm-dd", "other"])
    .describe("Original date format found in document"),
  originalNumberFormat: z
    .object({
      decimalSeparator: z.enum([",", "."]).describe("Character used for decimal separation"),
      thousandSeparator: z
        .enum([",", ".", " ", "none"])
        .describe("Character used for thousand separation, or 'none' if no separator used"),
    })
    .describe("Original number formatting in document"),
  conversionNotes: z
    .string()
    .optional()
    .describe("Any notes about format conversion challenges or ambiguities"),
})

// Schema for extracted banking data from PDF with format detection
export const BankingDataSchema = z.object({
  // Format detection metadata
  formatDetection: FormatDetectionSchema,

  // Banking data (all standardized to ISO/US formats)
  accountNumber: z.string().optional(),
  routingNumber: z.string().optional(),
  accountHolderName: z.string().optional(),
  bankName: z.string().optional(),
  balance: z
    .string()
    .optional()
    .describe("Standardized balance using period as decimal separator"),
  transactions: z
    .array(
      z.object({
        date: z.string().describe("Date in ISO format YYYY-MM-DD"),
        description: z.string(),
        amount: z
          .string()
          .describe("Amount in standardized format with period as decimal separator"),
        type: z.enum(["debit", "credit"]),
        originalDate: z
          .string()
          .optional()
          .describe("Original date string from document if conversion was uncertain"),
        originalAmount: z
          .string()
          .optional()
          .describe("Original amount string from document if conversion was uncertain"),
      }),
    )
    .optional(),
  statementPeriod: z
    .object({
      from: z.string().describe("Start date in ISO format YYYY-MM-DD"),
      to: z.string().describe("End date in ISO format YYYY-MM-DD"),
    })
    .optional(),
  currency: z.string().optional(),
})

export type BankingData = z.infer<typeof BankingDataSchema>

// Result type for LLM processing
export type LLMProcessingResult = {
  success: boolean
  data?: BankingData
  error?: string
}

/**
 * Extracts banking data from PDF file using Gemini AI
 */
export async function extractBankingDataFromPDF(file: File): Promise<LLMProcessingResult> {
  try {
    logger.info(
      { fileName: file.name, fileSize: file.size, mimeType: file.type },
      "Starting LLM extraction for PDF",
    )

    // Convert file to base64 for Gemini API
    const bytes = await file.arrayBuffer()
    const base64Data = Buffer.from(bytes).toString("base64")
    const base64Size = base64Data.length

    logger.info(
      { fileName: file.name, base64Size },
      "PDF converted to base64, sending to Gemini API",
    )

    // Process with Gemini API using Vercel AI SDK
    const googleProvider = getGoogleProvider()
    const result = await generateObject({
      model: googleProvider(DEFAULT_GEMINI_MODEL),
      schema: BankingDataSchema,
      system: BANKING_DATA_EXTRACTION_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "file",
              data: base64Data,
              mimeType: file.type,
            },
          ],
        },
      ],
    })

    const extractedData = result.object

    // Debug log: Structured extracted banking data
    // Dump only high-level metrics; never the raw data
    logger.debug(
      {
        fileName: file.name,
        keys: Object.keys(extractedData ?? {}),
        transactionCount: extractedData.transactions?.length ?? 0,
      },
      "Structured banking data extracted from LLM",
    )
    logger.info(
      {
        fileName: file.name,
        hasAccountNumber: !!extractedData.accountNumber,
        hasRoutingNumber: !!extractedData.routingNumber,
        hasBalance: !!extractedData.balance,
        transactionCount: extractedData.transactions?.length || 0,
        bankName: extractedData.bankName,
        detectedLocale: extractedData.formatDetection?.detectedLocale,
        originalDateFormat: extractedData.formatDetection?.originalDateFormat,
        originalNumberFormat: extractedData.formatDetection?.originalNumberFormat,
      },
      "Gemini AI extraction completed successfully",
    )

    return {
      success: true,
      data: extractedData,
    }
  } catch (error) {
    logger.error(
      {
        fileName: file.name,
        error: error instanceof Error ? error.message : "Unknown error",
        errorType: error instanceof Error ? error.constructor.name : "Unknown",
        stack: error instanceof Error ? error.stack : undefined,
      },
      "Gemini AI extraction failed",
    )

    // Handle specific AI SDK errors
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        logger.error({ fileName: file.name }, "API key configuration error")
        return {
          success: false,
          error: "AI service configuration error. Please check your API settings.",
        }
      }
      if (error.message.includes("quota") || error.message.includes("limit")) {
        logger.warn({ fileName: file.name }, "API quota or rate limit exceeded")
        return {
          success: false,
          error: "AI service quota exceeded. Please try again later.",
        }
      }
      if (error.message.includes("timeout")) {
        logger.warn({ fileName: file.name, fileSize: file.size }, "Processing timeout occurred")
        return {
          success: false,
          error: "Processing timeout. The PDF file might be too large or complex.",
        }
      }
    }

    logger.error(
      {
        fileName: file.name,
        stack: error instanceof Error ? error.stack : undefined,
      },
      "Unexpected error during banking data extraction",
    )

    return {
      success: false,
      error: "ERROR_DATA_EXTRACTION_FAILED",
    }
  }
}
