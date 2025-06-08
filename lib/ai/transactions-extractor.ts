/**
 * Banking data extraction using Gemini AI
 * Handles PDF processing and structured data extraction
 */

import { generateObject } from "ai"
import { z } from "zod"
import { getGoogleProvider, DEFAULT_GEMINI_MODEL } from "@/lib/ai/gemini-config"
import { logger } from "@/lib/utils/logger"

// System prompt for banking data extraction with format detection
const BANKING_DATA_EXTRACTION_PROMPT = `# Role and Objective
You are an expert banking document analyst. Your task is to analyze banking PDF statements and extract structured data with precise format detection and date validation.

# Instructions

## Core Requirements
- Analyze the PDF document thoroughly before making any extractions
- Detect the document's regional format patterns (locale, date format, number format)
- Extract all available banking information accurately
- Apply strict date validation based on statement periods
- Convert all data to standardized ISO/US formats in output
- Only include transactions that fall within or before the statement period end date

## Format Detection Requirements
1. **Detect Document Locale**: Identify country/region based on:
   - Bank name and branding
   - Language used in the document
   - Currency symbols and formatting
   - Date and number formatting patterns
   - Address formats and conventions

2. **Identify Original Date Format**: Determine the date pattern used:
   - Look for multiple date examples to establish the pattern
   - For ambiguous cases (like 7/6/2025), use context clues:
     * If locale is Brazil/Portuguese but dates seem to follow US format, mark as mm/dd/yyyy
     * Look for dates with day > 12 to definitively identify format
     * Check statement period dates for additional pattern clues
     * If uncertain, mark as 'other' and document the ambiguity
   - Supported formats: dd/mm/yyyy, mm/dd/yyyy, yyyy-mm-dd, other

3. **Determine Number Format**: Identify formatting patterns:
   - Decimal separator: comma (,) or period (.)
   - Thousand separator: period (.), comma (,), space ( ), or 'none'

## Data Extraction Requirements
Extract the following information when available:
- Account number and routing number
- Account holder name and bank name
- Current balance (convert to standardized format)
- Statement period (CRITICAL: identify exact date range)
- Transaction history with dates, descriptions, amounts, and types
- Currency information

## Transaction Filtering and Validation
- **FIRST**: Identify the statement period (from/to dates) as your reference point
- **ONLY** include transactions with dates on or before the statement period end date
- **IGNORE** transactions from these sections:
  * "Pending transactions"
  * "Future dated transactions"
  * "Scheduled transactions"
  * "Upcoming transactions"
  * Any transactions dated AFTER the statement period end date
- Focus exclusively on completed transactions within the statement period
- If transaction dates seem inconsistent with statement period, review date format detection

# Reasoning Steps
1. **Document Analysis**: First, thoroughly scan the document to understand its structure and identify key sections
2. **Statement Period Identification**: Locate and establish the statement period dates (this is your critical reference point)
3. **Format Detection**: Analyze date and number patterns throughout the document to determine original formats
4. **Data Extraction**: Extract banking information systematically, section by section
5. **Transaction Filtering**: Apply strict date validation - only include transactions on or before statement end date
6. **Data Standardization**: Convert all extracted data to standardized ISO/US formats
7. **Quality Validation**: Verify that all extracted dates fall within expected ranges and formats are consistent

# Output Format Requirements
- Convert ALL dates to ISO format (YYYY-MM-DD) using the detected original format
- Convert ALL amounts to standardized format: period (.) as decimal separator, no thousand separators
- Include detected locale and original format metadata in formatDetection object
- For date parsing ambiguities: include original date string and document uncertainty in conversionNotes
- For ambiguous date formats: make best guess but document the uncertainty
- Omit any fields not present in the document (do not create placeholder values)

# Critical Validation Rules
- Statement period end date is the absolute cutoff for transaction inclusion
- Transactions dated after statement period end must be completely excluded
- If date format detection is uncertain, document this in conversionNotes
- Ensure transaction dates are logically consistent with the detected format
- Validate that extracted dates make sense within the statement period context

Please extract all available information accurately while strictly adhering to the date validation and format detection requirements.`

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
    .describe("Any notes about format conversion challenges, ambiguities, or assumptions made"),
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
    .optional()
    .describe(
      "Transactions that occurred within the statement period (date <= statement end date)",
    ),
  statementPeriod: z.object({
    from: z.string().describe("Start date in ISO format YYYY-MM-DD"),
    to: z.string().describe("End date in ISO format YYYY-MM-DD"),
  }),
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
 * Validates if extracted dates are consistent with the detected date format
 * This helps identify cases where LLM might have misidentified the format
 */
function validateDateConsistency(data: BankingData): {
  isConsistent: boolean
  issues: string[]
  recommendations: string[]
} {
  const issues: string[] = []
  const recommendations: string[] = []

  if (!data.transactions || data.transactions.length === 0) {
    return { isConsistent: true, issues, recommendations }
  }

  const detectedFormat = data.formatDetection?.originalDateFormat
  const locale = data.formatDetection?.detectedLocale
  const statementEndDate = data.statementPeriod?.to
  const statementStartDate = data.statementPeriod?.from

  // Check for dates that seem inconsistent with locale expectations
  if (locale?.toLowerCase().includes("brazil") && detectedFormat === "mm/dd/yyyy") {
    issues.push("Brazilian statement detected but using US date format (mm/dd/yyyy)")
    recommendations.push(
      "Verify if this is a special type of Brazilian statement or if format detection was incorrect",
    )
  }

  // Check for transactions that are dated after the statement end date (should be excluded)
  if (statementEndDate) {
    data.transactions.forEach((transaction, index) => {
      if (transaction.date > statementEndDate) {
        issues.push(
          `Transaction ${index + 1}: Date "${transaction.date}" is after statement period end date "${statementEndDate}"`,
        )
        recommendations.push(
          "This transaction should have been excluded as it's after the statement period end date",
        )
      }
    })
  }

  // Check if transactions fall within reasonable statement period bounds
  if (statementStartDate && statementEndDate) {
    data.transactions.forEach((transaction, index) => {
      if (transaction.date < statementStartDate) {
        issues.push(
          `Transaction ${index + 1}: Date "${transaction.date}" is before statement period start date "${statementStartDate}"`,
        )
        recommendations.push("This might indicate a date format parsing error")
      }
    })
  }

  // Check for impossible dates in the detected format
  data.transactions.forEach((transaction, index) => {
    if (transaction.originalDate) {
      const originalParts = transaction.originalDate.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
      if (originalParts) {
        const [, first, second] = originalParts
        const firstNum = parseInt(first)
        const secondNum = parseInt(second)

        if (detectedFormat === "dd/mm/yyyy" && firstNum > 31) {
          issues.push(
            `Transaction ${index + 1}: Original date "${transaction.originalDate}" has day > 31, inconsistent with dd/mm/yyyy format`,
          )
          recommendations.push("Consider that this might be mm/dd/yyyy format instead")
        }

        if (detectedFormat === "mm/dd/yyyy" && firstNum > 12) {
          issues.push(
            `Transaction ${index + 1}: Original date "${transaction.originalDate}" has month > 12, inconsistent with mm/dd/yyyy format`,
          )
          recommendations.push("Consider that this might be dd/mm/yyyy format instead")
        }

        // Check for invalid day values in both formats
        if (detectedFormat === "dd/mm/yyyy" && secondNum > 12) {
          issues.push(
            `Transaction ${index + 1}: Original date "${transaction.originalDate}" has month > 12, inconsistent with dd/mm/yyyy format`,
          )
        }

        if (detectedFormat === "mm/dd/yyyy" && secondNum > 31) {
          issues.push(
            `Transaction ${index + 1}: Original date "${transaction.originalDate}" has day > 31, inconsistent with mm/dd/yyyy format`,
          )
        }
      }
    }
  })

  return {
    isConsistent: issues.length === 0,
    issues,
    recommendations,
  }
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

    // Validate date consistency to help debug format detection issues
    const dateValidation = validateDateConsistency(extractedData)

    // Debug: Always log validation results (server-side)
    const validationLogData = {
      isConsistent: dateValidation.isConsistent,
      issues: dateValidation.issues,
      recommendations: dateValidation.recommendations,
      sampleTransactions: extractedData.transactions?.slice(0, 3).map((t) => ({
        date: t.date,
        originalDate: t.originalDate,
      })),
      statementPeriod: extractedData.statementPeriod,
      transactionCount: extractedData.transactions?.length || 0,
      transactionsAfterStatementEnd: extractedData.statementPeriod?.to
        ? extractedData.transactions?.filter((t) => t.date > extractedData.statementPeriod!.to)
            .length || 0
        : 0,
    }

    logger.info(
      { fileName: file.name, dateValidation: validationLogData },
      "Date validation completed",
    )

    if (!dateValidation.isConsistent) {
      logger.warn(
        {
          fileName: file.name,
          dateFormatIssues: dateValidation.issues,
          recommendations: dateValidation.recommendations,
          detectedFormat: extractedData.formatDetection?.originalDateFormat,
          detectedLocale: extractedData.formatDetection?.detectedLocale,
        },
        "Date format inconsistencies detected in extracted data",
      )
    }

    // Debug log: Structured extracted banking data
    // Log the complete LLM response for debugging
    logger.info(
      {
        fileName: file.name,
        fullLLMResponse: extractedData,
      },
      "Complete LLM extraction response",
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
        conversionNotes: extractedData.formatDetection?.conversionNotes,
        statementPeriod: extractedData.statementPeriod,
        hasSampleTransactionDates:
          extractedData.transactions && extractedData.transactions.length > 0
            ? extractedData.transactions
                .slice(0, 3)
                .map((t) => ({ iso: t.date, original: t.originalDate }))
            : [],
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
