/**
 * Tests for file validation utilities
 * Tests both success and failure scenarios including edge cases
 */

import { describe, it, expect } from "vitest"
import {
  validateFile,
  getFileCategory,
  formatFileSize,
  getFileSizeLimit,
  SUPPORTED_FILE_TYPES,
  FILE_SIZE_LIMITS,
} from "@/lib/upload/file-validation"

// Mock File class for testing
class MockFile extends File {
  constructor(name: string, size: number, type: string) {
    super([], name, { type })
    Object.defineProperty(this, "size", {
      value: size,
      writable: false,
    })
  }
}

describe("File Validation", () => {
  describe("validateFile", () => {
    it("should accept valid PDF files under size limit", () => {
      const file = new MockFile("test.pdf", 10 * 1024 * 1024, "application/pdf") // 10MB
      const result = validateFile(file)

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it("should reject empty files", () => {
      const file = new MockFile("test.pdf", 0, "application/pdf")
      const result = validateFile(file)

      expect(result.success).toBe(false)
      expect(result.error).toBe("File cannot be empty")
    })

    it("should reject non-PDF files", () => {
      const file = new MockFile("test.txt", 1024, "text/plain")
      const result = validateFile(file)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Only PDF files are supported")
    })

    it("should reject files exceeding size limit", () => {
      const file = new MockFile("large.pdf", 25 * 1024 * 1024, "application/pdf") // 25MB
      const result = validateFile(file)

      expect(result.success).toBe(false)
      expect(result.error).toBe("PDF file size must be less than 20MB")
    })

    it("should accept PDF files at exact size limit", () => {
      const file = new MockFile("limit.pdf", FILE_SIZE_LIMITS.PDF_FILES, "application/pdf") // Exactly 20MB
      const result = validateFile(file)

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it("should reject PDF files one byte over limit", () => {
      const file = new MockFile("overlimit.pdf", FILE_SIZE_LIMITS.PDF_FILES + 1, "application/pdf")
      const result = validateFile(file)

      expect(result.success).toBe(false)
      expect(result.error).toBe("PDF file size must be less than 20MB")
    })
  })

  describe("getFileCategory", () => {
    it("should return correct category for PDF", () => {
      expect(getFileCategory(SUPPORTED_FILE_TYPES.PDF)).toBe("PDF Document")
    })

    it("should return generic category for unsupported types", () => {
      expect(getFileCategory("image/jpeg")).toBe("Document")
      expect(getFileCategory("text/plain")).toBe("Document")
      expect(getFileCategory("application/unknown")).toBe("Document")
    })

    it("should handle empty or invalid mime types", () => {
      expect(getFileCategory("")).toBe("Document")
      expect(getFileCategory("invalid")).toBe("Document")
    })
  })

  describe("formatFileSize", () => {
    it("should format bytes correctly", () => {
      expect(formatFileSize(0)).toBe("0 Bytes")
      expect(formatFileSize(512)).toBe("512 Bytes")
      expect(formatFileSize(1023)).toBe("1023 Bytes")
    })

    it("should format KB correctly", () => {
      expect(formatFileSize(1024)).toBe("1 KB")
      expect(formatFileSize(1536)).toBe("1.5 KB")
      expect(formatFileSize(1024 * 1023)).toBe("1023 KB")
    })

    it("should format MB correctly", () => {
      expect(formatFileSize(1024 * 1024)).toBe("1 MB")
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe("1.5 MB")
      expect(formatFileSize(20 * 1024 * 1024)).toBe("20 MB")
    })

    it("should format GB correctly", () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe("1 GB")
      expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe("2.5 GB")
    })

    it("should handle edge cases", () => {
      expect(formatFileSize(1)).toBe("1 Bytes")
      expect(formatFileSize(1025)).toBe("1 KB")
    })
  })

  describe("getFileSizeLimit", () => {
    it("should return PDF limit for PDF files", () => {
      expect(getFileSizeLimit(SUPPORTED_FILE_TYPES.PDF)).toBe(FILE_SIZE_LIMITS.PDF_FILES)
    })

    it("should return PDF limit as default for other types", () => {
      expect(getFileSizeLimit("image/jpeg")).toBe(FILE_SIZE_LIMITS.PDF_FILES)
      expect(getFileSizeLimit("text/plain")).toBe(FILE_SIZE_LIMITS.PDF_FILES)
      expect(getFileSizeLimit("")).toBe(FILE_SIZE_LIMITS.PDF_FILES)
    })

    it("should verify size limit constant is correct", () => {
      expect(FILE_SIZE_LIMITS.PDF_FILES).toBe(20 * 1024 * 1024) // 20MB
    })
  })

  describe("constants", () => {
    it("should have correct supported file types", () => {
      expect(SUPPORTED_FILE_TYPES.PDF).toBe("application/pdf")
      expect(Object.keys(SUPPORTED_FILE_TYPES)).toHaveLength(1)
    })

    it("should have consistent file size limits", () => {
      expect(FILE_SIZE_LIMITS.PDF_FILES).toBe(20 * 1024 * 1024)
      expect(typeof FILE_SIZE_LIMITS.PDF_FILES).toBe("number")
    })
  })
})
