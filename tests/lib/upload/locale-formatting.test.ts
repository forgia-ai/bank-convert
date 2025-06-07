/**
 * Tests for locale-aware formatting utilities
 */

import { describe, it, expect } from "vitest"
import {
  getLocaleFormats,
  formatDateForLocale,
  formatNumberForLocale,
  formatAmountWithSign,
} from "@/lib/upload/locale-formatting"

describe("Locale Formatting", () => {
  describe("getLocaleFormats", () => {
    it("should return English formats for 'en' locale", () => {
      const formats = getLocaleFormats("en")
      expect(formats).toEqual({
        dateFormat: "mm/dd/yyyy",
        decimalSeparator: ".",
        thousandSeparator: ",",
      })
    })

    it("should return Portuguese formats for 'pt' locale", () => {
      const formats = getLocaleFormats("pt")
      expect(formats).toEqual({
        dateFormat: "dd/mm/yyyy",
        decimalSeparator: ",",
        thousandSeparator: ".",
      })
    })
  })

  describe("formatDateForLocale", () => {
    it("should convert ISO date to US format for English", () => {
      expect(formatDateForLocale("2025-12-05", "en")).toBe("12/05/2025")
    })

    it("should convert ISO date to European format for Portuguese", () => {
      expect(formatDateForLocale("2025-12-05", "pt")).toBe("05/12/2025")
    })
  })

  describe("formatNumberForLocale", () => {
    it("should format numbers for English locale", () => {
      expect(formatNumberForLocale("2000.50", "en")).toBe("2,000.50")
    })

    it("should format numbers for Portuguese locale", () => {
      expect(formatNumberForLocale("2000.50", "pt")).toBe("2.000,50")
    })

    it("should remove currency prefixes", () => {
      expect(formatNumberForLocale("BRL2000.50", "pt")).toBe("2.000,50")
    })
  })

  describe("formatAmountWithSign", () => {
    it("should add + for positive amounts", () => {
      expect(formatAmountWithSign("100.50", "en")).toBe("+100.50")
    })

    it("should preserve - for negative amounts", () => {
      expect(formatAmountWithSign("-100.50", "en")).toBe("-100.50")
    })
  })
})
