# PDF Processing with Gemini API

This document describes the PDF file upload and data extraction system implemented for the bank-convert application.

## Overview

The system processes PDF bank statements using Google's Gemini 2.0 Flash model via the Vercel AI SDK. Users can upload PDF files up to 20MB, which are then processed to extract banking information such as account details and transaction history.

## Architecture

```
Client (Upload UI) → Server Action → Gemini API → Processed Data → UI Display
```

### Key Components

1. **File Validation** (`lib/file-validation.ts`)

   - PDF-only file type support
   - 20MB size limit validation
   - Comprehensive error handling

2. **Server Actions** (`actions/file-upload.ts`)

   - PDF processing with Gemini API
   - Structured data extraction using Zod schemas
   - Error handling for API failures

3. **UI Integration** (`components/viewer/conversion-workflow.tsx`)
   - Updated to use real Gemini processing
   - Maintains existing upload flow and user experience
   - Converts API response to transaction table format

## Environment Setup

### Required Environment Variables

Add the following to your `.env.local` file:

```bash
# Google Gemini API Configuration
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
```

### Getting a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create or select a project
3. Generate an API key
4. Copy the key to your environment variables

## Data Schema

The system extracts the following banking data from PDFs:

```typescript
{
  accountNumber?: string
  routingNumber?: string
  accountHolderName?: string
  bankName?: string
  balance?: string
  transactions?: Array<{
    date: string
    description: string
    amount: string
    type: "debit" | "credit"
  }>
  statementPeriod?: {
    from: string
    to: string
  }
  currency?: string
}
```

## File Restrictions

- **Supported Format**: PDF only (`application/pdf`)
- **Size Limit**: 20MB maximum
- **Processing Model**: Gemini 2.0 Flash Experimental

## Testing

The system includes comprehensive tests using Vitest:

```bash
# Run all tests
yarn test

# Run tests with UI
yarn test:ui

# Run tests once
yarn test:run

# Run specific test file
yarn test:run tests/lib/file-validation.test.ts
```

### Test Coverage

- File validation (success/failure scenarios)
- Size limit edge cases
- File type validation
- Utility functions (formatFileSize, getFileCategory, etc.)

## Error Handling

The system provides user-friendly error messages for:

- Invalid file types
- Files exceeding size limits
- API configuration errors
- Processing timeouts
- Quota exceeded scenarios
- Network failures

## Development Workflow

1. Make changes to validation or processing logic
2. Run tests: `yarn test:run`
3. Check linting and types: `yarn check`
4. Test manually with real PDFs

## Deployment Considerations

### Vercel Configuration

Ensure the `GOOGLE_GENERATIVE_AI_API_KEY` environment variable is set in your Vercel project settings.

### Function Timeout

PDF processing may take time depending on file size and complexity. Consider increasing serverless function timeout if needed.

### Rate Limiting

Implement appropriate rate limiting for the upload endpoints to prevent abuse.

## Future Enhancements

Potential improvements to consider:

1. **Multi-format Support**: Extend to support images, CSV, Excel files
2. **Batch Processing**: Allow multiple file uploads
3. **Progress Tracking**: Real-time processing status updates
4. **Data Validation**: Enhanced validation of extracted banking data
5. **Export Options**: Additional export formats (JSON, XML, etc.)
6. **OCR Fallback**: Backup processing for image-based PDFs

## Troubleshooting

### Common Issues

1. **"API key" errors**: Verify `GOOGLE_GENERATIVE_AI_API_KEY` is set correctly
2. **"File too large" errors**: Ensure files are under 20MB
3. **"No data extracted" errors**: Try with a different PDF format or bank

### Debug Mode

Enable debug logging by setting:

```bash
NODE_ENV=development
```

This will log processing details to the console for debugging purposes.
