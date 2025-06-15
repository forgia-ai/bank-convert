import { describe, it, expect, vi, beforeEach } from "vitest"
import { countPdfPages, extractPdfText, getPdfMetadata } from "@/lib/upload/pdf-utils"
import pdf from "pdf-parse"

// Mock pdf-parse
vi.mock("pdf-parse", () => ({
  default: vi.fn(),
}))

// Mock logger
vi.mock("@/lib/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

describe("PDF Utils", () => {
  const mockPdf = vi.mocked(pdf)
  const mockBuffer = Buffer.from("%PDF-1.4 mock pdf content")

  const createMockResult = (overrides: any = {}) => ({
    numpages: 1,
    numrender: 1,
    text: "mock text",
    info: {},
    metadata: null,
    version: "1.0.0",
    ...overrides,
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("countPdfPages", () => {
    it("should return the correct number of pages", async () => {
      mockPdf.mockResolvedValue(
        createMockResult({
          numpages: 5,
        }),
      )

      const result = await countPdfPages(mockBuffer)
      expect(result).toBe(5)
    })

    it("should throw error when pdf parsing fails", async () => {
      mockPdf.mockRejectedValue(new Error("PDF parsing failed"))

      await expect(countPdfPages(mockBuffer)).rejects.toThrow("Failed to count PDF pages")
    })
  })

  describe("extractPdfText", () => {
    it("should return extracted text", async () => {
      mockPdf.mockResolvedValue(
        createMockResult({
          numpages: 2,
          text: "extracted text content",
        }),
      )

      const result = await extractPdfText(mockBuffer)
      expect(result).toBe("extracted text content")
    })

    it("should throw error when text extraction fails", async () => {
      mockPdf.mockRejectedValue(new Error("Text extraction failed"))

      await expect(extractPdfText(mockBuffer)).rejects.toThrow("Failed to extract PDF text")
    })
  })

  describe("getPdfMetadata", () => {
    it("should return complete metadata with raw creation date", async () => {
      mockPdf.mockResolvedValue(
        createMockResult({
          numpages: 3,
          text: "pdf text content",
          info: {
            Title: "Test Document",
            Author: "Test Author",
            CreationDate: "D:20231201120000Z",
          },
        }),
      )

      const result = await getPdfMetadata(mockBuffer)

      expect(result.pageCount).toBe(3)
      expect(result.text).toBe("pdf text content")
      expect(result.title).toBe("Test Document")
      expect(result.author).toBe("Test Author")
      expect(result.creationDate).toBe("D:20231201120000Z")
    })

    it("should handle PDF date without D: prefix", async () => {
      mockPdf.mockResolvedValue(
        createMockResult({
          info: {
            CreationDate: "20231201120000",
          },
        }),
      )

      const result = await getPdfMetadata(mockBuffer)
      expect(result.creationDate).toBe("20231201120000")
    })

    it("should handle PDF date with only date part", async () => {
      mockPdf.mockResolvedValue(
        createMockResult({
          info: {
            CreationDate: "D:20231201",
          },
        }),
      )

      const result = await getPdfMetadata(mockBuffer)
      expect(result.creationDate).toBe("D:20231201")
    })

    it("should return raw value for invalid PDF date", async () => {
      mockPdf.mockResolvedValue(
        createMockResult({
          info: {
            CreationDate: "invalid-date",
          },
        }),
      )

      const result = await getPdfMetadata(mockBuffer)
      expect(result.creationDate).toBe("invalid-date")
    })

    it("should return undefined for missing creation date", async () => {
      mockPdf.mockResolvedValue(
        createMockResult({
          info: {},
        }),
      )

      const result = await getPdfMetadata(mockBuffer)
      expect(result.creationDate).toBeUndefined()
    })

    it("should handle metadata without optional fields", async () => {
      mockPdf.mockResolvedValue(
        createMockResult({
          numpages: 2,
          text: "basic text",
          info: {},
        }),
      )

      const result = await getPdfMetadata(mockBuffer)

      expect(result.pageCount).toBe(2)
      expect(result.text).toBe("basic text")
      expect(result.title).toBeUndefined()
      expect(result.author).toBeUndefined()
      expect(result.creationDate).toBeUndefined()
    })

    it("should throw error when metadata extraction fails", async () => {
      mockPdf.mockRejectedValue(new Error("Metadata extraction failed"))

      await expect(getPdfMetadata(mockBuffer)).rejects.toThrow("Failed to get PDF metadata")
    })
  })
})
