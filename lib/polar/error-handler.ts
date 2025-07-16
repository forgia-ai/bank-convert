import { logger } from "@/lib/utils/logger"

export interface PolarError extends Error {
  code?: string
  statusCode?: number
  details?: Record<string, unknown>
}

export class PolarErrorHandler {
  static handle(error: unknown, context: string): PolarError {
    const polarError: PolarError =
      error instanceof Error ? error : new Error("Unknown Polar error")

    // Log the error with context
    logger.error(
      {
        error: polarError.message,
        stack: polarError.stack,
        context,
        details: polarError.details,
      },
      `Polar error in ${context}`,
    )

    return polarError
  }

  static isRetryable(error: PolarError): boolean {
    // Define which errors should be retried
    const retryableCodes = ["network_error", "timeout", "rate_limited"]
    return (
      retryableCodes.includes(error.code || "") ||
      Boolean(error.statusCode && error.statusCode >= 500)
    )
  }

  static formatErrorMessage(error: PolarError): string {
    return error.code
      ? `Polar Error (${error.code}): ${error.message}`
      : `Polar Error: ${error.message}`
  }
}

// Utility function for webhook error responses
export function createWebhookErrorResponse(error: unknown, event: string) {
  const polarError = PolarErrorHandler.handle(error, `webhook-${event}`)

  return {
    error: true,
    message: PolarErrorHandler.formatErrorMessage(polarError),
    event,
    timestamp: new Date().toISOString(),
  }
}
