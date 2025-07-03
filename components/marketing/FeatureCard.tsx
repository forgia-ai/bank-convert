// components/marketing/feature-card.tsx
import React from "react"

interface FeatureCardProps {
  icon: React.ReactNode // Now supports SVG icons instead of emoticons
  title: string
  description: string
  className?: string
}

export default function FeatureCard({
  icon,
  title,
  description,
  className = "",
}: FeatureCardProps) {
  return (
    <div
      className={`flex flex-col items-center p-6 text-center bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <div className="mb-4 p-3 bg-primary/10 rounded-full">
        <div className="w-8 h-8 text-primary flex items-center justify-center">{icon}</div>
      </div>
      <h3 className="text-xl font-semibold mb-2 text-card-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}
