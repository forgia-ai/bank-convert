import { describe, it, expect, beforeEach, vi } from "vitest"

// Mock logger
vi.mock("@/lib/utils/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}))

import {
  PolarErrorHandler,
  createWebhookErrorResponse,
  type PolarError,
} from "@/lib/polar/error-handler"
import { logger } from "@/lib/utils/logger"

describe("Polar Error Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("PolarErrorHandler.handle", () => {
    it("should handle Error instances", () => {
      const originalError = new Error("Test error message")
      const result = PolarErrorHandler.handle(originalError, "test-context")

      expect(result).toBe(originalError)
      expect(logger.error).toHaveBeenCalledWith(
        {
          error: "Test error message",
          stack: originalError.stack,
          context: "test-context",
          details: undefined,
        },
        "Polar error in test-context",
      )
    })

    it("should handle PolarError instances with additional properties", () => {
      const polarError: PolarError = new Error("Polar specific error")
      polarError.code = "POLAR_001"
      polarError.statusCode = 400
      polarError.details = { field: "invalid" }

      const result = PolarErrorHandler.handle(polarError, "webhook-process")

      expect(result).toBe(polarError)
      expect(logger.error).toHaveBeenCalledWith(
        {
          error: "Polar specific error",
          stack: polarError.stack,
          context: "webhook-process",
          details: { field: "invalid" },
        },
        "Polar error in webhook-process",
      )
    })

    it("should handle non-Error objects", () => {
      const unknownError = "String error"
      const result = PolarErrorHandler.handle(unknownError, "unknown-context")

      expect(result).toBeInstanceOf(Error)
      expect(result.message).toBe("Unknown Polar error")
      expect(logger.error).toHaveBeenCalledWith(
        {
          error: "Unknown Polar error",
          stack: expect.any(String),
          context: "unknown-context",
          details: undefined,
        },
        "Polar error in unknown-context",
      )
    })

    it("should handle null/undefined errors", () => {
      const result = PolarErrorHandler.handle(null, "null-context")

      expect(result).toBeInstanceOf(Error)
      expect(result.message).toBe("Unknown Polar error")
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Unknown Polar error",
          context: "null-context",
        }),
        "Polar error in null-context",
      )
    })
  })

  describe("PolarErrorHandler.isRetryable", () => {
    it("should identify retryable error codes", () => {
      const retryableCodes = ["network_error", "timeout", "rate_limited"]

      retryableCodes.forEach((code) => {
        const error: PolarError = new Error("Test error")
        error.code = code
        expect(PolarErrorHandler.isRetryable(error)).toBe(true)
      })
    })

    it("should identify non-retryable error codes", () => {
      const nonRetryableCodes = ["invalid_request", "authentication_failed", "not_found"]

      nonRetryableCodes.forEach((code) => {
        const error: PolarError = new Error("Test error")
        error.code = code
        expect(PolarErrorHandler.isRetryable(error)).toBe(false)
      })
    })

    it("should identify retryable HTTP status codes (5xx)", () => {
      const retryableStatusCodes = [500, 501, 502, 503, 504, 505]

      retryableStatusCodes.forEach((statusCode) => {
        const error: PolarError = new Error("Test error")
        error.statusCode = statusCode
        expect(PolarErrorHandler.isRetryable(error)).toBe(true)
      })
    })

    it("should identify non-retryable HTTP status codes (4xx)", () => {
      const nonRetryableStatusCodes = [400, 401, 403, 404, 422]

      nonRetryableStatusCodes.forEach((statusCode) => {
        const error: PolarError = new Error("Test error")
        error.statusCode = statusCode
        expect(PolarErrorHandler.isRetryable(error)).toBe(false)
      })
    })

    it("should prioritize error code over status code", () => {
      const error: PolarError = new Error("Test error")
      error.code = "rate_limited" // Retryable code
      error.statusCode = 400 // Non-retryable status

      expect(PolarErrorHandler.isRetryable(error)).toBe(true)
    })

    it("should return false for errors without code or status", () => {
      const error: PolarError = new Error("Test error")
      expect(PolarErrorHandler.isRetryable(error)).toBe(false)
    })

    it("should handle undefined status codes", () => {
      const error: PolarError = new Error("Test error")
      error.statusCode = undefined
      expect(PolarErrorHandler.isRetryable(error)).toBe(false)
    })
  })

  describe("PolarErrorHandler.formatErrorMessage", () => {
    it("should format error message with code", () => {
      const error: PolarError = new Error("API rate limit exceeded")
      error.code = "RATE_LIMIT_EXCEEDED"

      const formatted = PolarErrorHandler.formatErrorMessage(error)
      expect(formatted).toBe("Polar Error (RATE_LIMIT_EXCEEDED): API rate limit exceeded")
    })

    it("should format error message without code", () => {
      const error: PolarError = new Error("Generic error message")

      const formatted = PolarErrorHandler.formatErrorMessage(error)
      expect(formatted).toBe("Polar Error: Generic error message")
    })

    it("should handle empty error code", () => {
      const error: PolarError = new Error("Error with empty code")
      error.code = ""

      const formatted = PolarErrorHandler.formatErrorMessage(error)
      expect(formatted).toBe("Polar Error: Error with empty code")
    })

    it("should handle undefined error code", () => {
      const error: PolarError = new Error("Error with undefined code")
      error.code = undefined

      const formatted = PolarErrorHandler.formatErrorMessage(error)
      expect(formatted).toBe("Polar Error: Error with undefined code")
    })
  })

  describe("createWebhookErrorResponse", () => {
    it("should create error response for Error instance", () => {
      const error = new Error("Webhook processing failed")
      const response = createWebhookErrorResponse(error, "subscription.created")

      expect(response).toEqual({
        error: true,
        message: "Polar Error: Webhook processing failed",
        event: "subscription.created",
        timestamp: expect.any(String),
      })

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Webhook processing failed",
          context: "webhook-subscription.created",
        }),
        "Polar error in webhook-subscription.created",
      )
    })

    it("should create error response for PolarError with code", () => {
      const error: PolarError = new Error("Invalid subscription data")
      error.code = "INVALID_SUBSCRIPTION"
      error.statusCode = 400

      const response = createWebhookErrorResponse(error, "subscription.updated")

      expect(response).toEqual({
        error: true,
        message: "Polar Error (INVALID_SUBSCRIPTION): Invalid subscription data",
        event: "subscription.updated",
        timestamp: expect.any(String),
      })
    })

    it("should create error response for unknown error types", () => {
      const response = createWebhookErrorResponse("String error", "order.created")

      expect(response).toEqual({
        error: true,
        message: "Polar Error: Unknown Polar error",
        event: "order.created",
        timestamp: expect.any(String),
      })
    })

    it("should handle different event types", () => {
      const eventTypes = [
        "subscription.created",
        "subscription.updated",
        "subscription.canceled",
        "order.created",
        "checkout.completed",
      ]

      eventTypes.forEach((eventType) => {
        const error = new Error(`Error in ${eventType}`)
        const response = createWebhookErrorResponse(error, eventType)

        expect(response.event).toBe(eventType)
        expect(logger.error).toHaveBeenCalledWith(
          expect.objectContaining({
            context: `webhook-${eventType}`,
          }),
          `Polar error in webhook-${eventType}`,
        )
      })
    })

    it("should include ISO timestamp", () => {
      const error = new Error("Test error")
      const response = createWebhookErrorResponse(error, "test.event")

      expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })
  })

  describe("integration scenarios", () => {
    it("should handle typical webhook error scenario", () => {
      const originalError = new Error("Database connection failed")

      // Handle the error
      const polarError = PolarErrorHandler.handle(originalError, "webhook-processing")

      // Check if retryable
      const isRetryable = PolarErrorHandler.isRetryable(polarError)
      expect(isRetryable).toBe(false)

      // Format for response
      const formatted = PolarErrorHandler.formatErrorMessage(polarError)
      expect(formatted).toBe("Polar Error: Database connection failed")

      // Create webhook response
      const response = createWebhookErrorResponse(originalError, "subscription.created")
      expect(response.error).toBe(true)
      expect(response.message).toBe("Polar Error: Database connection failed")
    })

    it("should handle retryable network error", () => {
      const networkError: PolarError = new Error("Network timeout")
      networkError.code = "timeout"
      networkError.statusCode = 503

      const handled = PolarErrorHandler.handle(networkError, "api-call")
      const isRetryable = PolarErrorHandler.isRetryable(handled)

      expect(isRetryable).toBe(true)
      expect(PolarErrorHandler.formatErrorMessage(handled)).toBe(
        "Polar Error (timeout): Network timeout",
      )
    })

    it("should handle authentication error", () => {
      const authError: PolarError = new Error("Invalid API key")
      authError.code = "authentication_failed"
      authError.statusCode = 401

      const handled = PolarErrorHandler.handle(authError, "api-auth")
      const isRetryable = PolarErrorHandler.isRetryable(handled)

      expect(isRetryable).toBe(false)
      expect(PolarErrorHandler.formatErrorMessage(handled)).toBe(
        "Polar Error (authentication_failed): Invalid API key",
      )
    })
  })
})
