"use client"

import { useState, useCallback, useEffect } from "react"
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
  // Form field states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  // Error states for validation
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  // UI states
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("")
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // Auto-hide error message after 8 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage("")
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [errorMessage])

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateField = useCallback((field: string, value: string): string => {
    switch (field) {
      case "name":
        if (!value.trim()) return "Name is required"
        if (value.trim().length < 2) return "Name must be at least 2 characters"
        return ""
      case "email":
        if (!value.trim()) return "Email is required"
        if (!validateEmail(value)) return "Please enter a valid email address"
        return ""
      case "subject":
        if (!value.trim()) return "Subject is required"
        if (value.trim().length < 3) return "Subject must be at least 3 characters"
        return ""
      case "message":
        if (!value.trim()) return "Message is required"
        if (value.trim().length < 10) return "Message must be at least 10 characters"
        return ""
      default:
        return ""
    }
  }, [])

  // Handle input changes
  const handleInputChange = useCallback(
    (field: keyof typeof formData) =>
      (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = event.target.value

        // Update form data
        setFormData((prev) => ({ ...prev, [field]: value }))

        // Clear error if field becomes valid
        const error = validateField(field, value)
        setErrors((prev) => ({ ...prev, [field]: error }))

        // Clear success/error messages when user starts typing again
        if (successMessage) setSuccessMessage("")
        if (errorMessage) setErrorMessage("")
      },
    [validateField, successMessage, errorMessage],
  )

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors = {
      name: validateField("name", formData.name),
      email: validateField("email", formData.email),
      subject: validateField("subject", formData.subject),
      message: validateField("message", formData.message),
    }

    setErrors(newErrors)
    return !Object.values(newErrors).some((error) => error !== "")
  }, [formData, validateField])

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
    })
    setErrors({
      name: "",
      email: "",
      subject: "",
      message: "",
    })
  }, [])

  // Handle form submission
  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      // Validate form before submission
      if (!validateForm()) return

      setIsLoading(true)

      try {
        // Clear any previous messages
        setSuccessMessage("")
        setErrorMessage("")

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Here you would typically send the form data to your API endpoint
        // Example: await submitContactForm(formData)

        // Show success message
        setSuccessMessage(
          dictionary.contact_page.form_success_message || "Form submitted successfully!",
        )

        // Reset form after successful submission
        resetForm()
      } catch (error) {
        console.error("Form submission error:", error)
        setErrorMessage("There was an error submitting the form. Please try again.")
      } finally {
        setIsLoading(false)
      }
    },
    [validateForm, dictionary.contact_page.form_success_message, resetForm],
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div>
        <Label htmlFor="name" className="mb-2 block">
          {dictionary.contact_page.form_name_label}
        </Label>
        <Input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange("name")}
          placeholder={dictionary.contact_page.form_name_placeholder}
          disabled={isLoading}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
          className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
        />
        {errors.name && (
          <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="email" className="mb-2 block">
          {dictionary.contact_page.form_email_label}
        </Label>
        <Input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange("email")}
          placeholder={dictionary.contact_page.form_email_placeholder}
          disabled={isLoading}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="subject" className="mb-2 block">
          {dictionary.contact_page.form_subject_label}
        </Label>
        <Input
          type="text"
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleInputChange("subject")}
          placeholder={dictionary.contact_page.form_subject_placeholder}
          disabled={isLoading}
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? "subject-error" : undefined}
          className={errors.subject ? "border-red-500 focus-visible:ring-red-500" : ""}
        />
        {errors.subject && (
          <p id="subject-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.subject}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="message" className="mb-2 block">
          {dictionary.contact_page.form_message_label}
        </Label>
        <Textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleInputChange("message")}
          placeholder={dictionary.contact_page.form_message_placeholder}
          rows={5}
          disabled={isLoading}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
          className={errors.message ? "border-red-500 focus-visible:ring-red-500" : ""}
        />
        {errors.message && (
          <p id="message-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.message}
          </p>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div
          className="rounded-md bg-green-50 border border-green-200 p-4"
          role="alert"
          aria-live="polite"
          id="success-message"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L7.53 10.71a.75.75 0 00-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                type="button"
                className="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
                onClick={() => setSuccessMessage("")}
                aria-label="Dismiss success message"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div
          className="rounded-md bg-red-50 border border-red-200 p-4"
          role="alert"
          aria-live="assertive"
          id="error-message"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{errorMessage}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                type="button"
                className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                onClick={() => setErrorMessage("")}
                aria-label="Dismiss error message"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isLoading}
        aria-describedby="submit-status"
      >
        {isLoading ? "Submitting..." : dictionary.contact_page.form_submit_button}
      </Button>

      {isLoading && (
        <p id="submit-status" className="text-sm text-gray-600 text-center" aria-live="polite">
          Please wait while we submit your message...
        </p>
      )}
    </form>
  )
}
