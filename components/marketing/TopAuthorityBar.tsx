interface TopAuthorityBarProps {
  topAuthorityBarStrings: {
    statements_processed: string
    customer_quote: string
    privacy_message: string
  }
}

export default function TopAuthorityBar({ topAuthorityBarStrings }: TopAuthorityBarProps) {
  return (
    <div className="bg-slate-900 text-white py-2 text-xs md:text-sm border-b border-slate-700">
      <div className="flex items-center justify-center gap-4 md:gap-8 px-6 md:px-8">
        {/* Statements Processed - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-2">
          <svg
            className="w-4 h-4 text-green-400 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-gray-200">{topAuthorityBarStrings.statements_processed}</span>
        </div>

        {/* Separator - Hidden on mobile */}
        <div className="hidden md:block w-px h-4 bg-slate-600"></div>

        {/* Customer Quote with Stars - Always visible */}
        <div className="flex items-center gap-2">
          {/* 5 Stars */}
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-4 h-4 text-green-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-gray-200 italic">
            &ldquo;{topAuthorityBarStrings.customer_quote}&rdquo;
          </span>
        </div>

        {/* Separator - Hidden on mobile */}
        <div className="hidden md:block w-px h-4 bg-slate-600"></div>

        {/* Privacy Message - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-2">
          <svg
            className="w-4 h-4 text-green-400 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-gray-200">{topAuthorityBarStrings.privacy_message}</span>
        </div>
      </div>
    </div>
  )
}
