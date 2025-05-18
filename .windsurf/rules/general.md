---
trigger: always_on
---

# Tech Stack

- Next.js (deployed on Vercel with Serverless Functions)
- Yarn (package manager)

# Development Process

1. Whenever possible use pure functions that can be tested independently.
2. Keep functions that perform I/O (ex: HTTP requests or database operations) isolated.
3. A common pattern for more complex functions is to have a main function that orchestrates the flow of the operation, and smaller pure functions that perform specific tasks.
4. Create tests for all relevant pure functions. Add success and fail scenarios, including edge cases.
5. After making changes to code, always run `yarn test {test file} --run` and fix any failing tests.
6. After all changes are completed, always run `yarn check` and fix any errors that appear. Do not use `eslint-disable` unless absolutely necessary.

# Code Style

1. Keep files small and focused (less than 420 lines of code).
2. Each file should have a single purpose and responsibility. Comment the file's responsibility at the top of the file.
3. If a file is doing too many things, split it into smaller files.
4. Keep functions small and focused. Each function should also have a single responsibility. Comment the function's responsibility at the top of the function.
5. If a function is doing too many things, split it into smaller functions.
6. Keep variables and constants named descriptively.
7. Always add descriptive comments to the code.
8. Imports should use absolute paths (ex: `import { validate } from '@/lib/rules'`)
9. The order of imports should be: first, imports for internal libraries, then imports for external libraries.
10. Do NOT add temporary comments on code about the last changes made. Just add timeless comments clarifying what the code is doing and why.

# LLMs

1. If you need to pick a model, use `gemini-2.5-pro-preview-03-25` unless otherwise specified.
2. For Gemini, use the `@google/genai` library (not the older `google-generativeai` library).

# Additional Rules

1. Do not make changes that are not directly related to the user's request
2. If unrelated improvement opportunities are found, mention them without editing code
3. Use `yarn` instead of `npm` for all package management tasks
4. Execute scripts with `yarn tsx {script name}`
