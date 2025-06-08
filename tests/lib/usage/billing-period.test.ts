import { calculateBillingPeriod } from "@/lib/usage/tracking"
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock the Supabase module to prevent initialization errors
vi.mock("@/lib/integrations/supabase", () => ({
  createServerSupabaseClient: vi.fn(),
}))

// Mock the logger
vi.mock("@/lib/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}))

describe("Billing Period Calculation", () => {
  beforeEach(() => {
    // Reset any date mocks
    vi.useRealTimers()
  })

  describe("Standard month transitions", () => {
    it("should handle normal subscription date in current month", () => {
      // Mock today as March 15, 2024
      vi.useFakeTimers()
      vi.setSystemTime(new Date("2024-03-15"))

      // Subscription started on March 10
      const subscriptionStart = new Date("2024-02-10")
      const result = calculateBillingPeriod(subscriptionStart)

      expect(result.periodStart).toBe("2024-03-10") // March 10
      expect(result.periodEnd).toBe("2024-04-09") // April 9
    })

    it("should handle normal subscription date in previous month", () => {
      // Mock today as March 5, 2024
      vi.useFakeTimers()
      vi.setSystemTime(new Date("2024-03-05"))

      // Subscription started on February 10
      const subscriptionStart = new Date("2024-01-10")
      const result = calculateBillingPeriod(subscriptionStart)

      expect(result.periodStart).toBe("2024-02-10") // February 10
      expect(result.periodEnd).toBe("2024-03-09") // March 9
    })
  })

  describe("Month-end edge cases", () => {
    it("should handle subscription on Jan 31 for February (non-leap year)", () => {
      // Mock today as February 15, 2023 (non-leap year)
      vi.useFakeTimers()
      vi.setSystemTime(new Date("2023-02-15"))

      // Subscription started on January 31
      const subscriptionStart = new Date("2023-01-31")
      const result = calculateBillingPeriod(subscriptionStart)

      // Since Feb 15 < Feb 28 (clamped billing date), we're still in January period
      expect(result.periodStart).toBe("2023-01-31") // January 31
      expect(result.periodEnd).toBe("2023-02-27") // Feb 27 (day before Feb 28)
    })

    it("should handle subscription on Jan 31 for February (leap year)", () => {
      // Mock today as February 15, 2024 (leap year)
      vi.useFakeTimers()
      vi.setSystemTime(new Date("2024-02-15"))

      // Subscription started on January 31
      const subscriptionStart = new Date("2024-01-31")
      const result = calculateBillingPeriod(subscriptionStart)

      // Since Feb 15 < Feb 29 (clamped billing date), we're still in January period
      expect(result.periodStart).toBe("2024-01-31") // January 31
      expect(result.periodEnd).toBe("2024-02-28") // Feb 28 (day before Feb 29)
    })

    it("should handle subscription on Jan 30 for February", () => {
      // Mock today as February 15, 2024
      vi.useFakeTimers()
      vi.setSystemTime(new Date("2024-02-15"))

      // Subscription started on January 30
      const subscriptionStart = new Date("2024-01-30")
      const result = calculateBillingPeriod(subscriptionStart)

      // Since Feb 15 < Feb 29 (clamped billing date from 30), we're still in January period
      expect(result.periodStart).toBe("2024-01-30") // January 30
      expect(result.periodEnd).toBe("2024-02-28") // Feb 28 (day before Feb 29)
    })

    it("should handle subscription on May 31 for June (30 days)", () => {
      // Mock today as June 15, 2024
      vi.useFakeTimers()
      vi.setSystemTime(new Date("2024-06-15"))

      // Subscription started on May 31
      const subscriptionStart = new Date("2024-05-31")
      const result = calculateBillingPeriod(subscriptionStart)

      // Since June 15 < June 30 (clamped billing date), we're still in May period
      expect(result.periodStart).toBe("2024-05-31") // May 31
      expect(result.periodEnd).toBe("2024-06-29") // June 29 (day before June 30)
    })

    it("should not clamp when target month has enough days", () => {
      // Mock today as March 15, 2024
      vi.useFakeTimers()
      vi.setSystemTime(new Date("2024-03-15"))

      // Subscription started on January 31
      const subscriptionStart = new Date("2024-01-31")
      const result = calculateBillingPeriod(subscriptionStart)

      // Since March 15 < March 31, we're in February period
      expect(result.periodStart).toBe("2024-02-29") // Feb 29 (leap year, clamped from 31)
      expect(result.periodEnd).toBe("2024-03-30") // March 30 (day before March 31)
    })
  })

  describe("Year rollover edge cases", () => {
    it("should handle year rollover from December to January", () => {
      // Mock today as January 5, 2024
      vi.useFakeTimers()
      vi.setSystemTime(new Date("2024-01-05"))

      // Subscription started on November 15, 2023
      const subscriptionStart = new Date("2023-11-15")
      const result = calculateBillingPeriod(subscriptionStart)

      expect(result.periodStart).toBe("2023-12-15") // December 15, 2023
      expect(result.periodEnd).toBe("2024-01-14") // January 14, 2024
    })

    it("should handle subscription on Jan 31 transitioning to February across years", () => {
      // Mock today as February 10, 2024
      vi.useFakeTimers()
      vi.setSystemTime(new Date("2024-02-10"))

      // Subscription started on January 31, 2023
      const subscriptionStart = new Date("2023-01-31")
      const result = calculateBillingPeriod(subscriptionStart)

      // Since Feb 10 < Feb 29 (clamped billing date), we're still in January period
      expect(result.periodStart).toBe("2024-01-31") // January 31, 2024 (current period)
      expect(result.periodEnd).toBe("2024-02-28") // February 28, 2024 (day before Feb 29)
    })
  })

  describe("Same day edge cases", () => {
    it("should handle when today is exactly the subscription day", () => {
      // Mock today as March 15, 2024
      vi.useFakeTimers()
      vi.setSystemTime(new Date("2024-03-15"))

      // Subscription started on February 15
      const subscriptionStart = new Date("2024-02-15")
      const result = calculateBillingPeriod(subscriptionStart)

      expect(result.periodStart).toBe("2024-03-15") // Today is the billing day
      expect(result.periodEnd).toBe("2024-04-14") // April 14
    })

    it("should handle subscription on Feb 29 (leap year) for non-leap year", () => {
      // Mock today as February 15, 2025 (non-leap year)
      vi.useFakeTimers()
      vi.setSystemTime(new Date("2025-02-15"))

      // Subscription started on February 29, 2024 (leap year)
      const subscriptionStart = new Date("2024-02-29")
      const result = calculateBillingPeriod(subscriptionStart)

      // Since Feb 15 < Feb 28 (clamped billing date from 29), we're in January period
      expect(result.periodStart).toBe("2025-01-29") // January 29, 2025
      expect(result.periodEnd).toBe("2025-02-27") // February 27 (day before Feb 28)
    })
  })
})
