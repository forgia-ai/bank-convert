import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"

export const runtime = "edge"

// Get fonts for better typography
async function getFont(font: string, weight: 400 | 700) {
  const url = `https://fonts.googleapis.com/css2?family=${font}:wght@${weight}&display=swap`
  const css = await fetch(url).then((res) => res.text())
  const resource = css.match(/src: url\((.+)\) format\('woff2'\)/)

  if (!resource) {
    throw new Error("Failed to load font")
  }

  return fetch(resource[1]).then((res) => res.arrayBuffer())
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Extract parameters with defaults
    const title = searchParams.get("title") || "Convert Bank Statements to Excel in Seconds"
    const description =
      searchParams.get("description") || "Upload PDF, get structured data instantly. Try it free!"
    const lang = searchParams.get("lang") || "en"
    const type = searchParams.get("type") || "homepage"

    // Language-specific content
    const langContent = {
      en: {
        subtitle: "AI-Powered Bank Statement Converter",
        free: "Free",
        features: "50 Free Pages • AI Extraction • Multi-Bank Support",
      },
      es: {
        subtitle: "Conversor de Extractos Bancarios con IA",
        free: "Gratis",
        features: "50 Páginas Gratis • Extracción IA • Multi-Banco",
      },
      pt: {
        subtitle: "Conversor de Extratos Bancários com IA",
        free: "Gratuito",
        features: "50 Páginas Grátis • Extração IA • Multi-Banco",
      },
    }

    const content = langContent[lang as keyof typeof langContent] || langContent.en

    // Load fonts
    const [geistRegular, geistBold] = await Promise.all([
      getFont("Geist", 400),
      getFont("Geist", 700),
    ])

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
            backgroundColor: "#ffffff",
            backgroundImage: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            position: "relative",
          }}
        >
          {/* Background pattern overlay */}
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

          {/* Main content container */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px",
              textAlign: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Logo/Brand area */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "32px",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  backgroundColor: "#ffffff",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "20px",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
                }}
              >
                <span style={{ fontSize: "32px" }}>📊</span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "#ffffff",
                    fontFamily: "Geist",
                    lineHeight: 1.2,
                  }}
                >
                  Bank Statement Converter
                </span>
                <span
                  style={{
                    fontSize: "16px",
                    color: "rgba(255, 255, 255, 0.8)",
                    fontFamily: "Geist",
                  }}
                >
                  {content.subtitle}
                </span>
              </div>
            </div>

            {/* Main title */}
            <h1
              style={{
                fontSize: title.length > 50 ? "48px" : "56px",
                fontWeight: 700,
                color: "#ffffff",
                fontFamily: "Geist",
                lineHeight: 1.1,
                marginBottom: "24px",
                maxWidth: "900px",
                textAlign: "center",
              }}
            >
              {title}
            </h1>

            {/* Description */}
            <p
              style={{
                fontSize: "24px",
                color: "rgba(255, 255, 255, 0.9)",
                fontFamily: "Geist",
                lineHeight: 1.4,
                marginBottom: "32px",
                maxWidth: "800px",
                textAlign: "center",
              }}
            >
              {description}
            </p>

            {/* Features/Benefits bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                borderRadius: "50px",
                padding: "16px 32px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
              }}
            >
              <span
                style={{
                  backgroundColor: "#10b981",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 700,
                  padding: "6px 12px",
                  borderRadius: "20px",
                  marginRight: "16px",
                  fontFamily: "Geist",
                }}
              >
                {content.free}
              </span>
              <span
                style={{
                  fontSize: "18px",
                  color: "#374151",
                  fontFamily: "Geist",
                  fontWeight: 500,
                }}
              >
                {content.features}
              </span>
            </div>

            {/* Language indicator */}
            <div
              style={{
                position: "absolute",
                top: "40px",
                right: "40px",
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                borderRadius: "8px",
                padding: "8px 16px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  color: "#ffffff",
                  fontFamily: "Geist",
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
                  bottom: "40px",
                  left: "40px",
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  padding: "8px 16px",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    color: "#ffffff",
                    fontFamily: "Geist",
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
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Geist",
            data: geistRegular,
            weight: 400,
            style: "normal",
          },
          {
            name: "Geist",
            data: geistBold,
            weight: 700,
            style: "normal",
          },
        ],
      },
    )
  } catch (error) {
    console.error("Failed to generate OG image:", error)

    // Fallback simple image if fonts fail
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
          <h1 style={{ fontSize: "60px", fontWeight: "bold" }}>Bank Statement Converter</h1>
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
