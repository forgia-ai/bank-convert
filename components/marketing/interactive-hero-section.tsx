"use client" // Added "use client" as FileUploadModule is a client component

import React, { useRef } from "react" // Added useRef
import { Button } from "@/components/ui/button"
// Removed Card and CardContent as FileUploadModule handles its own presentation
import FileUploadModule, { FileUploadModuleRef, FileUploadModuleStrings } from "./FileUploadModule" // Import the Ref and Strings type

interface InteractiveHeroSectionProps {
  heroTitle: string
  heroSubtitle: string
  heroCtaButton: string
  heroTrustText: string
  fileUploadModuleStrings: FileUploadModuleStrings
}

export default function InteractiveHeroSection({
  heroTitle,
  heroSubtitle,
  heroCtaButton,
  heroTrustText,
  fileUploadModuleStrings,
}: InteractiveHeroSectionProps) {
  const fileUploadModuleRef = useRef<FileUploadModuleRef>(null) // Create a ref for FileUploadModule

  // Handler for file upload, defined within the Client Component
  const handleFileUpload = (file: File) => {
    console.log("File selected in InteractiveHeroSection:", file.name)
    // TODO: Implement actual file processing logic or state update here
    // For example, you might want to set some state to show a preview
    // or trigger an API call for processing.
  }

  const handleCtaButtonClick = () => {
    fileUploadModuleRef.current?.openFileDialog() // Call the exposed function
  }

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-background to-muted/50">
      <div className="container mx-auto px-4 grid gap-12 md:grid-cols-2 items-center">
        {/* Text Content */}
        <div className="flex flex-col gap-4 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter">
            {heroTitle}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">{heroSubtitle}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center md:justify-start">
            {/* Restored CTA Button */}
            <Button
              size="lg"
              className="w-full sm:w-auto cursor-pointer"
              onClick={handleCtaButtonClick}
            >
              {heroCtaButton}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{heroTrustText}</p>
        </div>

        {/* File Upload Module */}
        <div className="flex justify-center items-start md:items-center w-full">
          <FileUploadModule
            ref={fileUploadModuleRef} // Attach the ref
            onFileUpload={handleFileUpload}
            hideSelectFileButton={true} // Hide the internal button
            strings={fileUploadModuleStrings}
          />
        </div>
      </div>
    </section>
  )
}
