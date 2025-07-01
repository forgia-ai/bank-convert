"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ContactFormProps {
  dictionary: {
    contact_page: {
      form_name_label: string
      form_name_placeholder: string
      form_email_label: string
      form_email_placeholder: string
      form_subject_label: string
      form_subject_placeholder: string
      form_message_label: string
      form_message_placeholder: string
      form_submit_button: string
      form_success_message: string
    }
  }
}

export default function ContactForm({ dictionary }: ContactFormProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // Handle form submission logic (e.g., send to an API endpoint)
    alert(
      dictionary.contact_page.form_success_message || "Form submitted! (This is a placeholder)",
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name" className="mb-2 block">
          {dictionary.contact_page.form_name_label}
        </Label>
        <Input
          type="text"
          id="name"
          name="name"
          placeholder={dictionary.contact_page.form_name_placeholder}
          required
        />
      </div>
      <div>
        <Label htmlFor="email" className="mb-2 block">
          {dictionary.contact_page.form_email_label}
        </Label>
        <Input
          type="email"
          id="email"
          name="email"
          placeholder={dictionary.contact_page.form_email_placeholder}
          required
        />
      </div>
      <div>
        <Label htmlFor="subject" className="mb-2 block">
          {dictionary.contact_page.form_subject_label}
        </Label>
        <Input
          type="text"
          id="subject"
          name="subject"
          placeholder={dictionary.contact_page.form_subject_placeholder}
          required
        />
      </div>
      <div>
        <Label htmlFor="message" className="mb-2 block">
          {dictionary.contact_page.form_message_label}
        </Label>
        <Textarea
          id="message"
          name="message"
          placeholder={dictionary.contact_page.form_message_placeholder}
          rows={5}
          required
        />
      </div>
      <Button type="submit" size="lg" className="w-full">
        {dictionary.contact_page.form_submit_button}
      </Button>
    </form>
  )
}
