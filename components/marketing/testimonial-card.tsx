// components/marketing/testimonial-card.tsx
import React from "react"
import Image from "next/image"

interface TestimonialCardProps {
  quote: string
  author: string
  role?: string // e.g., "Small Business Owner", "Freelancer"
  avatar?: string // URL to an avatar image, or placeholder
  className?: string
}

export default function TestimonialCard({
  quote,
  author,
  role,
  avatar,
  className = "",
}: TestimonialCardProps) {
  return (
    <div className={`bg-card p-6 rounded-lg border shadow-sm flex flex-col ${className}`}>
      {avatar && (
        <Image
          src={avatar}
          alt={`${author}'s avatar`}
          width={64}
          height={64}
          className="rounded-full mb-4 self-center"
        />
      )}
      {!avatar && (
        <div className="w-16 h-16 rounded-full mb-4 self-center bg-muted flex items-center justify-center text-xl text-muted-foreground">
          {author.substring(0, 1)} {/* Initials as placeholder */}
        </div>
      )}
      <blockquote className="text-card-foreground italic mb-4 flex-grow">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <div className="text-right">
        <p className="font-semibold text-card-foreground">{author}</p>
        {role && <p className="text-sm text-muted-foreground">{role}</p>}
      </div>
    </div>
  )
}
