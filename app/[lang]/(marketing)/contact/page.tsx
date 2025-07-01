"use client" // For form handling if we add client-side validation/submission

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Phone } from "lucide-react" // Icons for contact info

export default function ContactPage() {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // Handle form submission logic (e.g., send to an API endpoint)
    alert("Form submitted! (This is a placeholder)")
  }

  return (
    <div className="py-12 md:py-20">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">Get in Touch</h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            We&apos;d love to hear from you! Whether you have a question, feedback, or need
            support, feel free to reach out.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
          {/* Contact Form Section */}
          <section>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">
              Send Us a Message
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name" className="mb-2 block">
                  Full Name
                </Label>
                <Input type="text" id="name" name="name" placeholder="Your Name" required />
              </div>
              <div>
                <Label htmlFor="email" className="mb-2 block">
                  Email Address
                </Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="subject" className="mb-2 block">
                  Subject
                </Label>
                <Input
                  type="text"
                  id="subject"
                  name="subject"
                  placeholder="Question about pricing"
                  required
                />
              </div>
              <div>
                <Label htmlFor="message" className="mb-2 block">
                  Message
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Your message here..."
                  rows={5}
                  required
                />
              </div>
              <Button type="submit" size="lg" className="w-full md:w-auto">
                Send Message
              </Button>
            </form>
          </section>

          {/* Alternative Contact Methods Section */}
          <section className="md:mt-[68px]">
            {" "}
            {/* Align with form title roughly */}
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">
              Other Ways to Reach Us
            </h2>
            <div className="space-y-6 text-muted-foreground">
              <div className="flex items-start gap-4">
                <Mail className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground">Email Us Directly</h3>
                  <p>For general inquiries, support, or feedback:</p>
                  <a
                    href="mailto:support@www.bankstatementconvert.to"
                    className="text-primary hover:underline"
                  >
                    support@www.bankstatementconvert.to
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Phone className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground">Call Us (Support Hours)</h3>
                  <p>Mon - Fri, 9 AM - 5 PM (PST)</p>
                  <a href="tel:+1234567890" className="text-primary hover:underline">
                    +1 (234) 567-890 (Placeholder)
                  </a>
                </div>
              </div>
              {/* Optional: Address - Can be added if relevant */}
              {/*
              <div className="flex items-start gap-4">
                <MapPin className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground">Our Office</h3>
                  <p>123 Converter Lane<br />Tech City, CA 94000<br />United States</p>
                </div>
              </div>
              */}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
