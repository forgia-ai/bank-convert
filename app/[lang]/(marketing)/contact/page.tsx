import { getDictionary } from "@/lib/utils/get-dictionary"
import { type Locale } from "@/i18n-config"
import ContactForm from "@/components/marketing/ContactForm"
import type { Metadata } from "next"

// Get base URL for metadata
const getBaseUrl = (): string => {
  if (process.env.NODE_ENV === "production") {
    return "https://www.bankstatementconvert.to"
  }
  return "http://localhost:3000"
}

// Generate metadata for contact page
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const baseUrl = getBaseUrl()

  // Error handling for dictionary fetching
  let dictionary
  try {
    dictionary = await getDictionary(lang)
  } catch (error) {
    console.error("Failed to load dictionary for metadata:", error)
    // Fallback to empty dictionary structure
    dictionary = { metadata: {} }
  }

  // Type guard to safely check dictionary structure
  const hasMetadata = (
    dict: unknown,
  ): dict is { metadata: { contact?: { title?: string; description?: string } } } => {
    return !!(
      dict &&
      typeof dict === "object" &&
      dict !== null &&
      "metadata" in dict &&
      (dict as Record<string, unknown>).metadata &&
      typeof (dict as Record<string, unknown>).metadata === "object"
    )
  }

  const hasContactMetadata = (
    metadata: unknown,
  ): metadata is { contact: { title?: string; description?: string } } => {
    return !!(
      metadata &&
      typeof metadata === "object" &&
      metadata !== null &&
      "contact" in metadata &&
      (metadata as Record<string, unknown>).contact &&
      typeof (metadata as Record<string, unknown>).contact === "object"
    )
  }

  // Safely extract metadata with proper validation
  const metadata = hasMetadata(dictionary) ? dictionary.metadata : null
  const contactMetadata = metadata && hasContactMetadata(metadata) ? metadata.contact : null

  const title = contactMetadata?.title || "Contact Bank Statement Convert | Get Support & Help"
  const description =
    contactMetadata?.description ||
    "Get in touch with Bank Statement Convert support team. We're here to help with questions, technical support, and feedback about our PDF to Excel conversion tool."

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${lang}/contact`,
      type: "website",
      images: [
        {
          url: `${baseUrl}/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&lang=${lang}&type=contact`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        `${baseUrl}/api/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&lang=${lang}&type=contact`,
      ],
    },
  }
}

interface ContactPageProps {
  params: Promise<{ lang: Locale }>
}

export default async function ContactPage({ params: paramsPromise }: ContactPageProps) {
  const { lang } = await paramsPromise
  const dictionary = await getDictionary(lang)

  return (
    <div className="py-6 md:py-10">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
            {dictionary.contact_page.title}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {dictionary.contact_page.subtitle}
          </p>
        </div>

        {/* Centered Contact Form */}
        <div className="max-w-lg mx-auto px-6 sm:px-0">
          <section>
            <ContactForm dictionary={dictionary} />
          </section>
        </div>
      </div>
    </div>
  )
}
