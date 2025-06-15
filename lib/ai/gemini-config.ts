import { createGoogleGenerativeAI } from "@ai-sdk/google"

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
    if (!GEMINI_API_KEY?.trim()) {
      throw new Error("GEMINI_API_KEY must be set to use Gemini AI")
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
