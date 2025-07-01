import { getDictionary } from "@/lib/utils/get-dictionary"
import { type Locale } from "@/i18n-config"
import ContactForm from "@/components/marketing/ContactForm"

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
