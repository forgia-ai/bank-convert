/**
 * Locale-aware formatting utilities
 * Converts standardized LLM output to user's preferred display format
 */

import type { Locale } from "@/i18n-config"

export interface LocaleFormats {
  dateFormat: "dd/mm/yyyy" | "mm/dd/yyyy"
  decimalSeparator: "." | ","
  thousandSeparator: "," | "."
}

/**
 * Get locale-specific formatting rules
 */
export function getLocaleFormats(locale: Locale): LocaleFormats {
  switch (locale) {
    case "en":
      return {
        dateFormat: "mm/dd/yyyy",
        decimalSeparator: ".",
        thousandSeparator: ",",
      }
    case "pt":
      return {
        dateFormat: "dd/mm/yyyy",
        decimalSeparator: ",",
        thousandSeparator: ".",
      }
    default:
      // Default to English format
      return {
        dateFormat: "mm/dd/yyyy",
        decimalSeparator: ".",
        thousandSeparator: ",",
      }
  }
}

/**
 * Format date from ISO format (YYYY-MM-DD) to locale format
 */
export function formatDateForLocale(isoDate: string, locale: Locale): string {
  const formats = getLocaleFormats(locale)

  // Parse ISO date
  const dateMatch = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!dateMatch) {
    // If not ISO format, return as-is
    return isoDate
  }

  const [, year, month, day] = dateMatch

  if (formats.dateFormat === "dd/mm/yyyy") {
    return `${day}/${month}/${year}`
  } else {
    return `${month}/${day}/${year}`
  }
}

/**
 * Format number from standardized format to locale format
 * Input: "2000.50" (standardized with period as decimal)
 * Output: "2.000,50" (PT) or "2,000.50" (EN)
 */
export function formatNumberForLocale(standardizedAmount: string, locale: Locale): string {
  const formats = getLocaleFormats(locale)

  // Remove any currency prefixes (BRL, USD, etc.) and clean the string
  const cleanAmount = standardizedAmount.replace(/^[A-Z]{3}/, "").replace(/[^0-9.-]/g, "")

  // Parse the number
  const num = parseFloat(cleanAmount)
  if (isNaN(num)) {
    return standardizedAmount // Return original if parsing fails
  }

  // Handle negative numbers
  const isNegative = num < 0
  const absNum = Math.abs(num)

  // Split into integer and decimal parts
  const parts = absNum.toFixed(2).split(".")
  const integerPart = parts[0]
  const decimalPart = parts[1]

  // Add thousand separators to integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, formats.thousandSeparator)

  // Combine with decimal part using locale decimal separator
  const formattedNumber = `${formattedInteger}${formats.decimalSeparator}${decimalPart}`

  // Add negative sign if needed
  return isNegative ? `-${formattedNumber}` : formattedNumber
}

/**
 * Format amount with sign prefix for display
 */
export function formatAmountWithSign(amount: string, locale: Locale): string {
  const formattedNumber = formatNumberForLocale(amount, locale)

  // Add + for positive numbers (except zero)
  const num = parseFloat(amount.replace(/[^0-9.-]/g, ""))
  if (num > 0) {
    return `+${formattedNumber}`
  }

  return formattedNumber
}
