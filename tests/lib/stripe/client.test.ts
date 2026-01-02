import { describe, it, expect, beforeEach, vi } from "vitest"
import { createCheckoutSession, createPortalSession } from "@/lib/stripe/client"

// Mock global fetch (Bun typings require `preconnect` on typeof fetch)
const fetchMock = vi.fn()
;(fetchMock as unknown as { preconnect: ReturnType<typeof vi.fn> }).preconnect = vi.fn()
global.fetch = fetchMock as unknown as typeof fetch
const mockFetch = vi.mocked(fetch)

// Mock window.location
const mockLocation = {
  href: "",
}
Object.defineProperty(global, "window", {
  value: {
    location: mockLocation,
  },
  writable: true,
})

// Mock console.error to avoid noise in tests
global.console = {
  ...console,
  error: vi.fn(),
}

describe("Stripe Client", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation.href = ""
  })

  describe("createCheckoutSession", () => {
    it("should create checkout session and redirect", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          url: "https://checkout.stripe.com/pay/cs_test_123",
        }),
      }

      mockFetch.mockResolvedValue(mockResponse as unknown as Response)

      await createCheckoutSession("paid1", "monthly")

      expect(mockFetch).toHaveBeenCalledWith("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planType: "paid1",
          billingCycle: "monthly",
          language: undefined,
        }),
      })

      expect(mockLocation.href).toBe("https://checkout.stripe.com/pay/cs_test_123")
    })

    it("should handle yearly billing cycle", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          url: "https://checkout.stripe.com/pay/cs_test_yearly",
        }),
      }

      mockFetch.mockResolvedValue(mockResponse as unknown as Response)

      await createCheckoutSession("paid2", "yearly")

      expect(mockFetch).toHaveBeenCalledWith("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planType: "paid2",
          billingCycle: "yearly",
          language: undefined,
        }),
      })

      expect(mockLocation.href).toBe("https://checkout.stripe.com/pay/cs_test_yearly")
    })

    it("should include language parameter when provided", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          url: "https://checkout.stripe.com/pay/cs_test_es",
        }),
      }

      mockFetch.mockResolvedValue(mockResponse as unknown as Response)

      await createCheckoutSession("paid1", "monthly", "es")

      expect(mockFetch).toHaveBeenCalledWith("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planType: "paid1",
          billingCycle: "monthly",
          language: "es",
        }),
      })

      expect(mockLocation.href).toBe("https://checkout.stripe.com/pay/cs_test_es")
    })

    it("should throw error if API response is not ok", async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: "Invalid plan type",
        }),
      }

      mockFetch.mockResolvedValue(mockResponse as unknown as Response)

      await expect(createCheckoutSession("paid1", "monthly")).rejects.toThrow("Invalid plan type")

      expect(mockLocation.href).toBe("")
    })

    it("should throw error if no URL is returned", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          sessionId: "cs_test_123",
          // Missing url
        }),
      }

      mockFetch.mockResolvedValue(mockResponse as unknown as Response)

      await expect(createCheckoutSession("paid1", "monthly")).rejects.toThrow(
        "No checkout URL returned",
      )

      expect(mockLocation.href).toBe("")
    })

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"))

      await expect(createCheckoutSession("paid1", "monthly")).rejects.toThrow("Network error")

      expect(mockLocation.href).toBe("")
    })

    it("should handle API errors without message", async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({}),
      }

      mockFetch.mockResolvedValue(mockResponse as unknown as Response)

      await expect(createCheckoutSession("paid1", "monthly")).rejects.toThrow(
        "Failed to create checkout session",
      )
    })
  })

  describe("createPortalSession", () => {
    it("should create portal session and redirect", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          url: "https://billing.stripe.com/session/test_123",
        }),
      }

      mockFetch.mockResolvedValue(mockResponse as unknown as Response)

      await createPortalSession()

      expect(mockFetch).toHaveBeenCalledWith("/api/stripe/create-portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      expect(mockLocation.href).toBe("https://billing.stripe.com/session/test_123")
    })

    it("should throw error if API response is not ok", async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: "No subscription found",
        }),
      }

      mockFetch.mockResolvedValue(mockResponse as unknown as Response)

      await expect(createPortalSession()).rejects.toThrow("No subscription found")

      expect(mockLocation.href).toBe("")
    })

    it("should throw error if no URL is returned", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          sessionId: "portal_test_123",
          // Missing url
        }),
      }

      mockFetch.mockResolvedValue(mockResponse as unknown as Response)

      await expect(createPortalSession()).rejects.toThrow("No portal URL returned")

      expect(mockLocation.href).toBe("")
    })

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"))

      await expect(createPortalSession()).rejects.toThrow("Network error")

      expect(mockLocation.href).toBe("")
    })

    it("should handle API errors without message", async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({}),
      }

      mockFetch.mockResolvedValue(mockResponse as unknown as Response)

      await expect(createPortalSession()).rejects.toThrow("Failed to create portal session")
    })
  })
})
