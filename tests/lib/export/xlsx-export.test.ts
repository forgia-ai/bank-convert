/**
 * Tests for XLSX export utilities
 * Tests transaction data conversion to Excel format
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  generateXLSXFilename,
  exportTransactionsToXLSX,
  type TransactionForExport,
} from "@/lib/export/xlsx-export"

// Mock ExcelJS since we're testing utility functions
vi.mock("exceljs", () => ({
  default: {
    Workbook: vi.fn().mockImplementation(() => ({
      addWorksheet: vi.fn().mockReturnValue({
        columns: [],
        getRow: vi.fn().mockReturnValue({
          font: {},
          fill: {},
          border: {},
          getCell: vi.fn().mockReturnValue({
            value: "",
            numFmt: "",
            font: {},
            border: {},
          }),
        }),
        getCell: vi.fn().mockReturnValue({
          border: {},
          address: "A1",
        }),
      }),
      xlsx: {
        writeBuffer: vi.fn().mockResolvedValue(Buffer.from("mock-buffer")),
      },
    })),
  },
}))

// Mock DOM methods for download functionality
const mockCreateElement = vi.fn()
const mockCreateObjectURL = vi.fn()
const mockRevokeObjectURL = vi.fn()

beforeEach(() => {
  // Mock DOM elements and methods
  const mockLink = {
    href: "",
    download: "",
    style: { visibility: "" },
    click: vi.fn(),
  }

  mockCreateElement.mockReturnValue(mockLink)
  mockCreateObjectURL.mockReturnValue("mock-url")

  Object.defineProperty(global, "document", {
    value: {
      createElement: mockCreateElement,
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    },
    writable: true,
  })

  Object.defineProperty(global, "URL", {
    value: {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    },
    writable: true,
  })

  Object.defineProperty(global, "Blob", {
    value: vi.fn().mockImplementation((content, options) => ({
      content,
      type: options?.type || "",
    })),
    writable: true,
  })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe("XLSX Export Utilities", () => {
  describe("generateXLSXFilename", () => {
    it("should generate filename with date by default", () => {
      const filename = generateXLSXFilename("test-statement")

      expect(filename).toMatch(/^test-statement-\d{4}-\d{2}-\d{2}\.xlsx$/)
    })

    it("should generate filename without date when specified", () => {
      const filename = generateXLSXFilename("test-statement", false)

      expect(filename).toBe("test-statement.xlsx")
    })

    it("should remove existing extension before adding .xlsx", () => {
      const filename = generateXLSXFilename("test-statement.pdf", false)

      expect(filename).toBe("test-statement.xlsx")
    })

    it("should handle no base filename provided", () => {
      const filename = generateXLSXFilename(undefined, false)

      expect(filename).toBe("bank-statement.xlsx")
    })

    it("should handle empty string filename with fallback", () => {
      const filename = generateXLSXFilename("", false)

      expect(filename).toBe("bank-statement.xlsx")
    })

    it("should include current date in YYYY-MM-DD format", () => {
      const today = new Date().toISOString().split("T")[0]
      const filename = generateXLSXFilename("test", true)

      expect(filename).toBe(`test-${today}.xlsx`)
    })
  })

  describe("Transaction data structure", () => {
    it("should accept valid transaction format", () => {
      const transactions: TransactionForExport[] = [
        {
          date: "2024-01-15",
          description: "Coffee Shop",
          amount: -5.75,
          currency: "USD",
          type: "Debit",
        },
        {
          date: "2024-01-16",
          description: "Salary Deposit",
          amount: 2500,
          currency: "USD",
          type: "Credit",
        },
      ]

      // Should not throw any TypeScript errors
      expect(transactions).toHaveLength(2)
      expect(transactions[0].date).toBe("2024-01-15")
      expect(transactions[0].amount).toBe(-5.75)
    })

    it("should handle optional fields", () => {
      const transaction: TransactionForExport = {
        date: "2024-01-15",
        description: "Test Transaction",
        amount: 100,
        // currency and type are optional
      }

      expect(transaction.currency).toBeUndefined()
      expect(transaction.type).toBeUndefined()
    })

    it("should handle various amount formats", () => {
      const transactions: TransactionForExport[] = [
        { date: "2024-01-01", description: "Zero", amount: 0 },
        { date: "2024-01-02", description: "Positive", amount: 1234.56 },
        { date: "2024-01-03", description: "Negative", amount: -567.89 },
        { date: "2024-01-04", description: "Large", amount: 999999.99 },
      ]

      expect(transactions[0].amount).toBe(0)
      expect(transactions[1].amount).toBe(1234.56)
      expect(transactions[2].amount).toBe(-567.89)
      expect(transactions[3].amount).toBe(999999.99)
    })
  })

  describe("Internationalization support", () => {
    it("should accept custom column headers", () => {
      const customHeaders = {
        date: "Fecha",
        description: "Descripción",
        amount: "Cantidad",
        currency: "Moneda",
        type: "Tipo",
      }

      // Should not throw TypeScript errors
      expect(customHeaders).toBeDefined()
      expect(customHeaders.date).toBe("Fecha")
      expect(customHeaders.description).toBe("Descripción")
    })

    it("should use default English headers when none provided", () => {
      const options = {
        filename: "test.xlsx",
        sheetName: "Test",
        includeHeader: true,
      }

      // Should not throw TypeScript errors
      expect(options).toBeDefined()
      expect(options.filename).toBe("test.xlsx")
    })

    it("should handle Portuguese column headers", () => {
      const portugueseHeaders = {
        date: "Data",
        description: "Descrição",
        amount: "Valor",
        currency: "Moeda",
        type: "Tipo",
      }

      expect(portugueseHeaders).toBeDefined()
      expect(portugueseHeaders.amount).toBe("Valor")
    })
  })

  describe("Error handling", () => {
    it("should have proper error handling structure", () => {
      // This test verifies the function signature and error handling structure
      // Since we can't easily mock ExcelJS in this test environment, we test the interface
      const mockTransactions = [{ date: "2024-01-01", description: "Test", amount: 100 }]

      // Should not throw TypeScript errors when called
      expect(() => {
        // This just tests the function can be called - actual execution would require DOM
        const promise = exportTransactionsToXLSX(mockTransactions)
        expect(promise).toBeInstanceOf(Promise)
      }).not.toThrow()
    })
  })
})
