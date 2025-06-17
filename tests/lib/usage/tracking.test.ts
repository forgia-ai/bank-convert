import { trackPageUsage, checkUsageLimit, getUserUsageHistory } from "@/lib/usage/tracking"
import { describe, it, expect, beforeEach, vi } from "vitest"

// Mock the dependencies
vi.mock("@/lib/integrations/supabase", () => ({
  createServerSupabaseClient: vi.fn(() => {
    // Create a chainable mock that supports multiple .eq() calls
    const createChainableMock = () => {
      const chainableMock = {
        eq: vi.fn(() => chainableMock), // Returns itself for chaining
        single: vi.fn(() =>
          Promise.resolve({
            data: {
              id: "test-id",
              pages_consumed: 10,
              billing_period_start: "2024-01-01",
              billing_period_end: "2024-01-31",
              plan_type: "free",
            },
            error: null,
          }),
        ),
        maybeSingle: vi.fn(() =>
          Promise.resolve({
            data: {
              id: "test-id",
              pages_consumed: 10,
              billing_period_start: "2024-01-01",
              billing_period_end: "2024-01-31",
              plan_type: "free",
            },
            error: null,
          }),
        ),
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: "new-id" }, error: null })),
          maybeSingle: vi.fn(() => Promise.resolve({ data: { id: "new-id" }, error: null })),
        })),
        insert: vi.fn(() => Promise.resolve({ error: null })),
      }
      return chainableMock
    }

    return {
      from: vi.fn((tableName) => {
        // Handle different tables with different mock behaviors
        if (tableName === "usage_logs") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
                })),
              })),
            })),
            insert: vi.fn(() => Promise.resolve({ error: null })),
          }
        }

        // Default behavior for user_usage table
        return {
          select: vi.fn(() => createChainableMock()),
          insert: vi.fn((data) => {
            // Handle both user_usage inserts (with .select().single()) and usage_logs inserts (direct)
            if (data?.user_id) {
              return {
                select: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: {
                        id: "new-id",
                        ...data,
                        pages_consumed: 0,
                      },
                      error: null,
                    }),
                  ),
                  maybeSingle: vi.fn(() =>
                    Promise.resolve({
                      data: {
                        id: "new-id",
                        ...data,
                        pages_consumed: 0,
                      },
                      error: null,
                    }),
                  ),
                })),
              }
            }
            // For usage_logs direct insert
            return Promise.resolve({ error: null })
          }),
          update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        }
      }),
      rpc: vi.fn(() => Promise.resolve({ error: null })),
    }
  }),
}))

vi.mock("@/lib/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}))

describe("Usage Tracking Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("trackPageUsage", () => {
    it("should accept valid positive integers", async () => {
      await expect(trackPageUsage("user123", 5)).resolves.not.toThrow()
      await expect(trackPageUsage("user123", 1)).resolves.not.toThrow()
      await expect(trackPageUsage("user123", 100)).resolves.not.toThrow()
    })

    it("should reject zero pages", async () => {
      await expect(trackPageUsage("user123", 0)).rejects.toThrow(
        "Pages processed must be a positive integer",
      )
    })

    it("should reject negative pages", async () => {
      await expect(trackPageUsage("user123", -1)).rejects.toThrow(
        "Pages processed must be a positive integer",
      )
      await expect(trackPageUsage("user123", -10)).rejects.toThrow(
        "Pages processed must be a positive integer",
      )
    })

    it("should reject decimal numbers", async () => {
      await expect(trackPageUsage("user123", 1.5)).rejects.toThrow(
        "Pages processed must be a positive integer",
      )
      await expect(trackPageUsage("user123", 3.14)).rejects.toThrow(
        "Pages processed must be a positive integer",
      )
    })

    it("should reject NaN and Infinity", async () => {
      await expect(trackPageUsage("user123", NaN)).rejects.toThrow(
        "Pages processed must be a positive integer",
      )
      await expect(trackPageUsage("user123", Infinity)).rejects.toThrow(
        "Pages processed must be a positive integer",
      )
      await expect(trackPageUsage("user123", -Infinity)).rejects.toThrow(
        "Pages processed must be a positive integer",
      )
    })
  })

  describe("checkUsageLimit", () => {
    it("should accept valid positive integers", async () => {
      await expect(checkUsageLimit("user123", 5)).resolves.not.toThrow()
      await expect(checkUsageLimit("user123", 1)).resolves.not.toThrow()
      await expect(checkUsageLimit("user123", 100)).resolves.not.toThrow()
    })

    it("should reject zero additional pages", async () => {
      await expect(checkUsageLimit("user123", 0)).rejects.toThrow(
        "Additional pages must be a positive integer",
      )
    })

    it("should reject negative additional pages", async () => {
      await expect(checkUsageLimit("user123", -1)).rejects.toThrow(
        "Additional pages must be a positive integer",
      )
      await expect(checkUsageLimit("user123", -10)).rejects.toThrow(
        "Additional pages must be a positive integer",
      )
    })

    it("should reject decimal numbers", async () => {
      await expect(checkUsageLimit("user123", 1.5)).rejects.toThrow(
        "Additional pages must be a positive integer",
      )
      await expect(checkUsageLimit("user123", 3.14)).rejects.toThrow(
        "Additional pages must be a positive integer",
      )
    })

    it("should reject NaN and Infinity", async () => {
      await expect(checkUsageLimit("user123", NaN)).rejects.toThrow(
        "Additional pages must be a positive integer",
      )
      await expect(checkUsageLimit("user123", Infinity)).rejects.toThrow(
        "Additional pages must be a positive integer",
      )
      await expect(checkUsageLimit("user123", -Infinity)).rejects.toThrow(
        "Additional pages must be a positive integer",
      )
    })

    it("should return expected usage limit structure for valid input", async () => {
      const result = await checkUsageLimit("user123", 5)

      expect(result).toHaveProperty("canProcess")
      expect(result).toHaveProperty("currentUsage")
      expect(result).toHaveProperty("limit")
      expect(result).toHaveProperty("wouldExceed")
      expect(typeof result.canProcess).toBe("boolean")
      expect(typeof result.currentUsage).toBe("number")
      expect(typeof result.limit).toBe("number")
      expect(typeof result.wouldExceed).toBe("boolean")
    })
  })

  describe("getUserUsageHistory", () => {
    it("should return empty array for non-existent user", async () => {
      const result = await getUserUsageHistory("non-existent-user")
      expect(result).toEqual([])
    })

    it("should handle limit parameter", async () => {
      const result = await getUserUsageHistory("test-user", 5)
      expect(result).toEqual([])
    })
  })
})
