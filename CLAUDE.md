# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

```bash
# Development
yarn dev                    # Start development server
yarn build                  # Production build
yarn start                  # Production server
yarn lint                   # ESLint code checking
yarn typecheck              # TypeScript type checking
yarn check                  # Run lint + typecheck + prettier

# Testing
yarn test                   # Run tests with Vitest
yarn test:ui                # Run tests with UI
yarn test:run               # Run tests once (no watch)
yarn test {file} --run      # Run specific test file

# Package Management
yarn                        # Install dependencies (use yarn, not npm)
yarn tsx {script}           # Execute TypeScript scripts
```

**Important**: Always run `yarn check` after making changes and fix any errors before committing.

## Application Architecture

### Core Technology Stack

- **Next.js 15** with App Router and React 19
- **TypeScript** with strict type checking
- **Tailwind CSS** + **shadcn/ui** components
- **Clerk** for authentication
- **Supabase** for database and usage tracking
- **Google Gemini AI** for document processing
- **Yarn** as package manager

### Key System Components

#### Authentication (Clerk)

- User authentication with dynamic locale-aware URLs (`/${lang}/sign-in`)
- Route protection via middleware for `/dashboard` and `/billing` routes
- User IDs from Clerk used for database operations

#### Database (Supabase)

- **Tables**: `user_usage` (billing/limits), `usage_logs` (processing history)
- **Usage Tracking**: Page-based consumption with billing periods
- **Plans**: Free (50 pages), Paid1 (500 pages), Paid2 (1000 pages)
- Row Level Security enabled with atomic operations via RPC functions

#### AI Processing (Google Gemini)

- **Model**: `gemini-2.5-flash-preview-05-20`
- **Purpose**: Banking document analysis and transaction extraction
- **Pipeline**: PDF → AI extraction → validation → standardization
- Zod schema validation for structured data extraction

#### File Processing Workflow

1. Client-side validation (file type, 10MB max size)
2. PDF metadata extraction for page count
3. Usage limit validation before processing
4. AI-powered data extraction
5. Usage tracking and UI updates

#### Internationalization

- **Locales**: English (`en`), Spanish (`es`), Portuguese (`pt`)
- **Route Structure**: `/{locale}/path` with middleware handling
- **Translations**: JSON dictionaries in `/dictionaries/`

### Important Architectural Patterns

#### File Organization

- **Components**: PascalCase for custom components, kebab-case for UI components
- **TypeScript Files**: kebab-case for utilities and libraries
- **Imports**: Always use absolute paths with `@/` alias
- **Import Order**: Internal libraries first, then external libraries

#### Server Actions Pattern

- Extensive use of Next.js server actions for database operations
- Type-safe server-client communication with structured error responses
- Actions in `/lib/*/actions.ts` files

#### Context + Hooks Pattern

- `UserLimitsContext` for global usage state management
- Custom hooks in `/hooks/` directory
- Optimistic updates with server-side validation

#### Error Handling

- Structured error responses with specific error codes
- User-friendly error messages with i18n support
- Graceful degradation for non-critical failures

### Code Style Guidelines

#### From Cursor Rules

1. Keep files under 420 lines and functions focused on single responsibilities
2. Use pure functions when possible, isolate I/O operations
3. Add descriptive comments explaining what code does and why
4. Create tests for all pure functions with success/fail scenarios
5. Always run `yarn test {file} --run` after changes and fix failing tests
6. Use `gemini-2.5-pro-preview-03-25` model unless specified otherwise
7. Use `@google/genai` library (not older `google-generativeai`)

#### Key Development Rules

- Use `yarn` instead of `npm` for all package management
- Execute scripts with `yarn tsx {script name}`
- Do not make changes unrelated to user requests
- Add timeless comments, avoid temporary "last changes" comments
- Run `yarn check` before committing and fix all errors

### Critical Implementation Details

#### Usage Tracking System

- Page consumption tracked in real-time during processing
- Billing periods calculated with intelligent month-end handling
- Usage charged only for successful extractions
- Optimistic UI updates with server-side validation

#### AI Document Processing

- PDF-focused with comprehensive format detection
- Date validation and standardization to ISO format
- Transaction filtering (excludes pending/future transactions)
- Multi-language document support with locale-aware formatting

#### Component Communication

- Compound components for complex UI (e.g., FileUploadModule)
- Ref forwarding for parent-child component communication
- Context used to minimize props drilling

### Development Workflow

1. Make changes following file naming conventions
2. Write/update tests for modified functionality
3. Run `yarn test {file} --run` to verify tests pass
4. Run `yarn check` to verify linting, type checking, and formatting
5. Fix any issues before committing

# OG Image Testing URLs

Test these URLs in localhost during development:

## Homepage OG

http://localhost:3000/api/og?title=Convert%20Bank%20Statements%20to%20Excel%20in%20Seconds&description=Upload%20PDF,%20get%20structured%20data%20instantly.%20Try%20it%20free!&lang=en&type=homepage

## Viewer OG

http://localhost:3000/api/og?title=Bank%20Statement%20Converter%20-%20Convert%20Your%20Files&description=Convert%20your%20bank%20statements%20to%20Excel%20format%20with%20our%20AI-powered%20tool.&lang=en&type=viewer

## Spanish

http://localhost:3000/api/og?title=Convertir%20Extractos%20Bancarios%20a%20Excel&description=Sube%20PDF,%20obten%20datos%20estructurados%20al%20instante&lang=es&type=homepage

## Portuguese

http://localhost:3000/api/og?title=Converter%20Extratos%20Bancários%20para%20Excel&description=Carregue%20PDF,%20obtenha%20dados%20estruturados%20instantaneamente&lang=pt&type=homepage
