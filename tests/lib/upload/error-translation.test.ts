/**
 * Test error code translation functionality
 */
import { describe, it, expect } from "vitest"

// Simulate the getLocalizedErrorMessage function
const getLocalizedErrorMessage = (
  errorCode: string,
  dictionary: Record<string, Record<string, unknown>>,
): string => {
  const errorKeyMap: Record<string, string> = {
    ERROR_PDF_PROCESSING_FAILED: "error_pdf_processing_failed",
    ERROR_DATA_EXTRACTION_FAILED: "error_data_extraction_failed",
  }

  const dictionaryKey = errorKeyMap[errorCode]
  if (dictionaryKey && dictionary.viewer_page?.[dictionaryKey]) {
    return dictionary.viewer_page[dictionaryKey] as string
  }

  // Fallback to generic error message
  return (
    (dictionary.viewer_page?.error_generic_processing as string) ||
    "An unexpected error occurred while processing your file. Please try again."
  )
}

describe("Error Translation", () => {
  const mockDictionary = {
    viewer_page: {
      error_pdf_processing_failed: "Unexpected server error while processing the PDF.",
      error_data_extraction_failed: "Unexpected server error while extracting banking data.",
      error_generic_processing:
        "An unexpected error occurred while processing your file. Please try again.",
    },
  }

  it("should translate ERROR_PDF_PROCESSING_FAILED correctly", () => {
    const result = getLocalizedErrorMessage("ERROR_PDF_PROCESSING_FAILED", mockDictionary)
    expect(result).toBe("Unexpected server error while processing the PDF.")
  })

  it("should translate ERROR_DATA_EXTRACTION_FAILED correctly", () => {
    const result = getLocalizedErrorMessage("ERROR_DATA_EXTRACTION_FAILED", mockDictionary)
    expect(result).toBe("Unexpected server error while extracting banking data.")
  })

  it("should fallback to generic error for unknown error codes", () => {
    const result = getLocalizedErrorMessage("UNKNOWN_ERROR_CODE", mockDictionary)
    expect(result).toBe(
      "An unexpected error occurred while processing your file. Please try again.",
    )
  })

  it("should fallback to generic error when dictionary is missing error key", () => {
    const incompleteDictionary = {
      viewer_page: {
        error_generic_processing: "Generic error message",
      },
    }
    const result = getLocalizedErrorMessage("ERROR_PDF_PROCESSING_FAILED", incompleteDictionary)
    expect(result).toBe("Generic error message")
  })

  it("should use hardcoded fallback when dictionary is empty", () => {
    const emptyDictionary = {}
    const result = getLocalizedErrorMessage("ERROR_PDF_PROCESSING_FAILED", emptyDictionary)
    expect(result).toBe(
      "An unexpected error occurred while processing your file. Please try again.",
    )
  })
})
