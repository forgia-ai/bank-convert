import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { logger } from "@/lib/utils/logger"

let googleProviderInstance: ReturnType<typeof createGoogleGenerativeAI> | null = null

/**
 * Gets or creates the Google Generative AI provider instance
 * This function ensures environment variables are loaded before accessing them
 */
export function getGoogleProvider() {
  if (!googleProviderInstance) {
    // Check for required environment variables
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY

    // Ensure required environment variables are set
    if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === "") {
      logger.warn(
        "[google-generative-config] GEMINI_API_KEY environment variable is not set or empty. Gemini AI integration may not work properly.",
      )
    }

    // Create the Google Generative AI provider instance
    googleProviderInstance = createGoogleGenerativeAI({
      apiKey: GEMINI_API_KEY,
    })
  }

  return googleProviderInstance
}

// Export the default model ID for easy reference
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-preview-05-20"
