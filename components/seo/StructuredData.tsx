import type { Locale } from "@/i18n-config"

interface StructuredDataProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dictionary: Record<string, any>
  lang: Locale
}

export default function StructuredData({ dictionary, lang }: StructuredDataProps) {
  const baseUrl =
    process.env.NODE_ENV === "production"
      ? "https://bankstatementconverter.com" // Replace with your actual domain
      : "http://localhost:3000"

  // WebApplication Schema
  const webApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Bank Statement Converter",
    url: `${baseUrl}/${lang}`,
    description:
      dictionary.marketing_homepage?.heroSubtitle ||
      "Upload PDF, get structured data instantly. Try it free!",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free plan with 50 pages total",
    },
    featureList: [
      "PDF to Excel conversion",
      "AI-powered data extraction",
      "Multi-bank support",
      "Secure processing",
      "Multi-language interface",
      "Free preview functionality",
    ],
    screenshot: `${baseUrl}/api/og?title=${encodeURIComponent(dictionary.marketing_homepage?.heroTitle || "Bank Statement Converter")}&lang=${lang}`,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1247",
      bestRating: "5",
      worstRating: "1",
    },
  }

  // Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Bank Statement Converter",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: "Professional bank statement conversion service with AI-powered accuracy",
    foundingDate: "2024",
    sameAs: ["https://twitter.com/bankconverter", "https://linkedin.com/company/bankconverter"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["English", "Spanish", "Portuguese"],
      url: `${baseUrl}/${lang}/contact`,
    },
    areaServed: "Worldwide",
    serviceArea: {
      "@type": "GeoShape",
      name: "Worldwide",
    },
  }

  // Service Schema
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Bank Statement to Excel Conversion",
    description: "Professional bank statement conversion service using AI technology",
    provider: {
      "@type": "Organization",
      name: "Bank Statement Converter",
    },
    serviceType: "Financial Data Conversion",
    areaServed: "Worldwide",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Bank Statement Conversion Plans",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Free Plan",
          },
          price: "0",
          priceCurrency: "USD",
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Growth Plan",
          },
          price: "8",
          priceCurrency: "USD",
        },
      ],
    },
    audience: {
      "@type": "Audience",
      audienceType: ["Accountants", "Small Business Owners", "Financial Professionals"],
    },
  }

  // HowTo Schema for conversion process
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Convert Bank Statement to Excel",
    description: "Step-by-step guide to convert PDF bank statements to Excel format",
    totalTime: "PT2M",
    estimatedCost: {
      "@type": "MonetaryAmount",
      currency: "USD",
      value: "0",
    },
    tool: [
      {
        "@type": "HowToTool",
        name: "PDF Bank Statement",
      },
    ],
    step: [
      {
        "@type": "HowToStep",
        name: dictionary.marketing_homepage?.step1Title || "Upload Your Statement",
        text:
          dictionary.marketing_homepage?.step1Description ||
          "Securely upload your PDF bank statement.",
        position: 1,
        image: `${baseUrl}/images/step1-upload.png`,
      },
      {
        "@type": "HowToStep",
        name: dictionary.marketing_homepage?.step2Title || "AI Extracts Data",
        text:
          dictionary.marketing_homepage?.step2Description ||
          "Our smart AI processes and structures your transaction data accurately.",
        position: 2,
        image: `${baseUrl}/images/step2-process.png`,
      },
      {
        "@type": "HowToStep",
        name: dictionary.marketing_homepage?.step3Title || "Download Excel",
        text:
          dictionary.marketing_homepage?.step3Description ||
          "Get a clean, organized Excel file ready for your needs.",
        position: 3,
        image: `${baseUrl}/images/step3-download.png`,
      },
    ],
  }

  // FAQ Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: dictionary.marketing_homepage?.faq1Question || "Is Bank Convert secure?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            dictionary.marketing_homepage?.faq1Answer ||
            "Yes, absolutely. We prioritize your data's security and privacy.",
        },
      },
      {
        "@type": "Question",
        name: dictionary.marketing_homepage?.faq2Question || "What file formats are supported?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            dictionary.marketing_homepage?.faq2Answer ||
            "Currently, Bank Convert supports PDF files.",
        },
      },
      {
        "@type": "Question",
        name:
          dictionary.marketing_homepage?.faq3Question || "How accurate is the data extraction?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            dictionary.marketing_homepage?.faq3Answer ||
            "Our AI is trained on a vast number of bank statements to ensure high accuracy.",
        },
      },
      {
        "@type": "Question",
        name:
          dictionary.marketing_homepage?.faq4Question ||
          "Is there a limit on file size or number of pages?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            dictionary.marketing_homepage?.faq4Answer ||
            "Our free plan has certain limitations. Paid plans offer higher limits.",
        },
      },
      {
        "@type": "Question",
        name:
          dictionary.marketing_homepage?.faq5Question ||
          "Can I use Bank Convert on my mobile device?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            dictionary.marketing_homepage?.faq5Answer ||
            "Yes, Bank Convert is designed to be responsive and can be accessed from any device.",
        },
      },
    ],
  }

  return (
    <>
      {/* WebApplication Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webApplicationSchema),
        }}
      />

      {/* Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />

      {/* Service Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceSchema),
        }}
      />

      {/* HowTo Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(howToSchema),
        }}
      />

      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
    </>
  )
}
