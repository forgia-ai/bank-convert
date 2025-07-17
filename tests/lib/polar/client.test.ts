import { describe, it, expect, beforeEach, vi } from "vitest"

// Mock environment variables at the very top using vi.hoisted
const mockEnv = vi.hoisted(() => ({
  NEXT_PUBLIC_POLAR_PAID1_MONTHLY_PRODUCT_ID: "prod_paid1_monthly_test",
  NEXT_PUBLIC_POLAR_PAID1_ANNUAL_PRODUCT_ID: "prod_paid1_yearly_test",
  NEXT_PUBLIC_POLAR_PAID2_MONTHLY_PRODUCT_ID: "prod_paid2_monthly_test",
  NEXT_PUBLIC_POLAR_PAID2_ANNUAL_PRODUCT_ID: "prod_paid2_yearly_test",
}))

// Set environment variables before any imports
vi.hoisted(() => {
  Object.entries(mockEnv).forEach(([key, value]) => {
    process.env[key] = value
  })
})

// Mock window.location
const mockLocation = {
  href: "",
  origin: "http://localhost:3000",
}
Object.defineProperty(global, "window", {
  value: {
    location: mockLocation,
  },
  writable: true,
})

// Mock Clerk authentication
vi.mock("@clerk/nextjs", () => ({
  useAuth: vi.fn(() => ({
    userId: "user_test_123",
    isSignedIn: true,
  })),
}))

// Mock console.error to avoid noise in tests
global.console = {
  ...console,
  error: vi.fn(),
}

import { createPolarCheckout } from "@/lib/polar/client"

describe("Polar Client", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation.href = ""
  })

  describe("createPolarCheckout", () => {
    it("should create checkout URL and redirect for monthly plan", async () => {
      await createPolarCheckout("paid1_monthly", "en")

      expect(mockLocation.href).toBe(
        "http://localhost:3000/api/polar/checkout?products=prod_paid1_monthly_test&language=en",
      )
    })

    it("should create checkout URL and redirect for yearly plan", async () => {
      await createPolarCheckout("paid1_yearly", "es")

      expect(mockLocation.href).toBe(
        "http://localhost:3000/api/polar/checkout?products=prod_paid1_yearly_test&language=es",
      )
    })

    it("should use default language when not provided", async () => {
      await createPolarCheckout("paid2_monthly")

      expect(mockLocation.href).toBe(
        "http://localhost:3000/api/polar/checkout?products=prod_paid2_monthly_test&language=en",
      )
    })

    it("should handle Pro yearly plan", async () => {
      await createPolarCheckout("paid2_yearly", "pt")

      expect(mockLocation.href).toBe(
        "http://localhost:3000/api/polar/checkout?products=prod_paid2_yearly_test&language=pt",
      )
    })

    it("should throw error for invalid plan type", async () => {
      await expect(createPolarCheckout("invalid_plan" as any)).rejects.toThrow(
        "Invalid plan type: invalid_plan",
      )
    })

    it("should not redirect when error occurs", async () => {
      try {
        await createPolarCheckout("invalid_plan" as any)
      } catch {
        // Expected error
      }
      expect(mockLocation.href).toBe("")
    })
  })

  describe("URL construction", () => {
    it("should construct correct URLs for all plan types", async () => {
      const testCases = [
        { plan: "paid1_monthly", productId: "prod_paid1_monthly_test" },
        { plan: "paid1_yearly", productId: "prod_paid1_yearly_test" },
        { plan: "paid2_monthly", productId: "prod_paid2_monthly_test" },
        { plan: "paid2_yearly", productId: "prod_paid2_yearly_test" },
      ] as const

      for (const testCase of testCases) {
        mockLocation.href = "" // Reset for each test
        await createPolarCheckout(testCase.plan, "en")

        const expectedUrl = `http://localhost:3000/api/polar/checkout?products=${testCase.productId}&language=en`
        expect(mockLocation.href).toBe(expectedUrl)
      }
    })

    it("should handle special characters in language codes", async () => {
      await createPolarCheckout("paid1_monthly", "zh-CN")

      expect(mockLocation.href).toContain("language=zh-CN")
    })

    it("should preserve origin from window.location", async () => {
      // Change origin to test
      mockLocation.origin = "https://example.com"

      await createPolarCheckout("paid1_monthly", "en")

      expect(mockLocation.href).toBe(
        "https://example.com/api/polar/checkout?products=prod_paid1_monthly_test&language=en",
      )

      // Reset for other tests
      mockLocation.origin = "http://localhost:3000"
    })
  })

  describe("error handling", () => {
    it("should log errors to console", async () => {
      const consoleSpy = vi.spyOn(console, "error")

      try {
        await createPolarCheckout("invalid_plan" as any)
      } catch {
        // Expected error
      }

      expect(consoleSpy).toHaveBeenCalledWith("Error creating Polar checkout:", expect.any(Error))

      consoleSpy.mockRestore()
    })
  })
})
