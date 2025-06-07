/**
 * Server actions for PDF file upload and processing
 * Handles file validation, upload, and data extraction using Gemini API
 */

"use server"

import { google } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"
import { validateFile } from "@/lib/upload/file-validation"

// Schema for extracted banking data from PDF
const BankingDataSchema = z.object({
  accountNumber: z.string().optional(),
  routingNumber: z.string().optional(),
  accountHolderName: z.string().optional(),
  bankName: z.string().optional(),
  balance: z.string().optional(),
  transactions: z
    .array(
      z.object({
        date: z.string(),
        description: z.string(),
        amount: z.string(),
        type: z.enum(["debit", "credit"]),
      }),
    )
    .optional(),
  statementPeriod: z
    .object({
      from: z.string(),
      to: z.string(),
    })
    .optional(),
  currency: z.string().optional(),
})

export type BankingData = z.infer<typeof BankingDataSchema>

// Result type for file processing
export type FileProcessingResult = {
  success: boolean
  data?: BankingData
  error?: string
  fileName?: string
  fileSize?: number
}

/**
 * Processes uploaded PDF file and extracts banking data using Gemini API
 */
export async function processPdfFile(formData: FormData): Promise<FileProcessingResult> {
  try {
    // Extract file from FormData
    const file = formData.get("file") as File

    if (!file) {
      return {
        success: false,
        error: "No file provided",
      }
    }

    // Validate the PDF file
    const validation = validateFile(file)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error,
      }
    }

    // Convert file to base64 for Gemini API
    const bytes = await file.arrayBuffer()
    const base64Data = Buffer.from(bytes).toString("base64")

    // Process with Gemini API using Vercel AI SDK
    const result = await generateObject({
      model: google("gemini-2.0-flash-exp"),
      schema: BankingDataSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please analyze this banking PDF document and extract the following information:
                - Account number
                - Routing number
                - Account holder name
                - Bank name
                - Current balance
                - Transaction history (date, description, amount, type)
                - Statement period
                - Currency
                
                Please extract all available information accurately. If any field is not present in the document, omit it from the response.`,
            },
            {
              type: "file",
              data: base64Data,
              mimeType: file.type,
            },
          ],
        },
      ],
    })

    return {
      success: true,
      data: result.object,
      fileName: file.name,
      fileSize: file.size,
    }
  } catch (error) {
    console.error("Error processing PDF file:", error)

    // Handle specific AI SDK errors
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return {
          success: false,
          error: "AI service configuration error. Please check your API settings.",
        }
      }
      if (error.message.includes("quota") || error.message.includes("limit")) {
        return {
          success: false,
          error: "AI service quota exceeded. Please try again later.",
        }
      }
      if (error.message.includes("timeout")) {
        return {
          success: false,
          error: "Processing timeout. The PDF file might be too large or complex.",
        }
      }
    }

    return {
      success: false,
      error: `Failed to process PDF file: ${error instanceof Error ? error.message : "Unknown error"}`,
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
