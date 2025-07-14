import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"

export const runtime = "edge"

// Load Geist font from Google Fonts CDN for OG images
async function loadGeistFont() {
  try {
    // Add timeout to prevent hanging in production
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout

    const fontResponse = await fetch(
      "https://fonts.googleapis.com/css2?family=Geist:wght@400;700&display=swap",
      { signal: controller.signal },
    )
    clearTimeout(timeoutId)

    if (!fontResponse.ok) {
      console.warn("Font response not ok:", fontResponse.status)
      return null
    }

    const fontCSS = await fontResponse.text()

    // Extract the font URLs from the CSS
    const fontUrls = fontCSS.match(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/g)

    if (fontUrls && fontUrls.length >= 2) {
      // Load both regular and bold fonts with timeout
      const fontController = new AbortController()
      const fontTimeoutId = setTimeout(() => fontController.abort(), 2000) // 2 second timeout

      const [regularFont, boldFont] = await Promise.all([
        fetch(fontUrls[0].slice(4, -1), { signal: fontController.signal }).then((res) =>
          res.arrayBuffer(),
        ),
        fetch(fontUrls[1].slice(4, -1), { signal: fontController.signal }).then((res) =>
          res.arrayBuffer(),
        ),
      ])
      clearTimeout(fontTimeoutId)

      return {
        regular: regularFont,
        bold: boldFont,
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn("Font loading timed out, using system fonts")
    } else {
      console.warn(
        "Failed to load Geist fonts, using system fonts:",
        error instanceof Error ? error.message : String(error),
      )
    }
  }

  return null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Build screenshot URL for both dev and prod
    const reqUrl = new URL(request.url)
    const screenshotUrl = `${reqUrl.protocol}//${reqUrl.host}/og-screenshot.png`

    // Extract parameters with defaults
    const title = searchParams.get("title") || "Convert Bank Statements to Excel in Seconds"
    const description =
      searchParams.get("description") || "Upload PDF, get structured data instantly. Try it free!"
    const lang = searchParams.get("lang") || "en"
    const type = searchParams.get("type") || "homepage"

    // Load Geist fonts
    const fonts = await loadGeistFont()

    // Use screenshot background for all page types for consistency
    const useScreenshot = true

    // Prepare font configuration
    const fontFamily = fonts
      ? "Geist"
      : "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imageResponseOptions: any = {
      width: 1200,
      height: 630,
    }

    if (fonts) {
      imageResponseOptions.fonts = [
        {
          name: "Geist",
          data: fonts.regular,
          weight: 400,
          style: "normal",
        },
        {
          name: "Geist",
          data: fonts.bold,
          weight: 700,
          style: "normal",
        },
      ]
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            backgroundColor: "#ffffff",
            backgroundImage: useScreenshot
              ? `url(${screenshotUrl})`
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            backgroundSize: useScreenshot ? "cover" : "auto",
            backgroundPosition: useScreenshot ? "center" : "auto",
            backgroundRepeat: "no-repeat",
            position: "relative",
          }}
        >
          {/* Background pattern overlay (only for non-screenshot) */}
          {!useScreenshot && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                opacity: 0.4,
              }}
            />
          )}

          {/* Main content container positioned at bottom */}
          <div
            style={
              useScreenshot
                ? {
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "28px 48px",
                    textAlign: "center",
                    position: "absolute",
                    bottom: "32px",
                    left: "32px",
                    right: "32px",
                    backgroundColor: "rgba(255, 255, 255, 0.92)",
                    backdropFilter: "blur(12px)",
                    border: "none",
                    borderRadius: "16px",
                    boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.1)",
                  }
                : {
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "80px",
                    textAlign: "center",
                    position: "relative",
                    backgroundColor: "transparent",
                    borderRadius: "0px",
                    backdropFilter: "none",
                    border: "none",
                    boxShadow: "none",
                  }
            }
          >
            {/* Main title */}
            <h1
              style={{
                fontSize: useScreenshot ? "44px" : "56px",
                fontWeight: 700,
                color: useScreenshot ? "#1f2937" : "#ffffff",
                fontFamily: fontFamily,
                lineHeight: 1.0,
                marginBottom: useScreenshot ? "6px" : "24px",
                maxWidth: useScreenshot ? "100%" : "800px",
                textAlign: "center",
                textShadow: useScreenshot ? "0 1px 3px rgba(0, 0, 0, 0.12)" : "none",
              }}
            >
              {title}
            </h1>

            {/* Description */}
            <p
              style={{
                fontSize: useScreenshot ? "22px" : "24px",
                color: useScreenshot ? "#6b7280" : "rgba(255, 255, 255, 0.95)",
                fontFamily: fontFamily,
                lineHeight: 1.3,
                marginBottom: "0px",
                maxWidth: useScreenshot ? "100%" : "700px",
                textAlign: "center",
                textShadow: useScreenshot ? "0 1px 2px rgba(0, 0, 0, 0.08)" : "none",
                fontWeight: useScreenshot ? 600 : 400,
              }}
            >
              {description}
            </p>

            {/* Language indicator */}
            <div
              style={{
                position: "absolute",
                top: "-50px",
                right: "40px",
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                borderRadius: "8px",
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  color: "#374151",
                  fontFamily: fontFamily,
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                {lang}
              </span>
            </div>

            {/* Type indicator (for different page types) */}
            {type !== "homepage" && (
              <div
                style={{
                  position: "absolute",
                  top: "-50px",
                  left: "40px",
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: "#374151",
                    fontFamily: fontFamily,
                    fontWeight: 500,
                    textTransform: "capitalize",
                  }}
                >
                  {type}
                </span>
              </div>
            )}
          </div>
        </div>
      ),
      imageResponseOptions,
    )
  } catch (error) {
    console.error("Failed to generate OG image:", error)

    // Fallback simple image if anything fails
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#2563eb",
            color: "#ffffff",
          }}
        >
          <h1 style={{ fontSize: "60px", fontWeight: "bold" }}>Bank Statement Convert</h1>
          <p style={{ fontSize: "24px", marginTop: "20px" }}>Convert PDF to Excel Instantly</p>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    )
  }
}
