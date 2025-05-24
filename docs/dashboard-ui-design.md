# Viewer Page UI/UX Design (Logged-in Users)

This document outlines the UI/UX design for the main viewer page (`/viewer`) accessible to logged-in users. It follows a single-page, integrated workflow to provide a simple and straightforward experience for converting bank statements.

## I. Overall Structure

The `/viewer` page consists of two main parts:

1.  **`UserNavbar` (Top):** This navigation bar is consistent across all authenticated pages.
2.  **Main Content Area (Below `UserNavbar`):** This area is dedicated to the file conversion workflow.

## II. `UserNavbar` Components

As defined in the main `instructions.md`:

- **Left:** Application Logo.
- **Center (or right of logo):** Navigation Links (e.g., "Convert/Dashboard", "Settings", "Billing").
- **Right:**
  - `UsageTracker`: Displays current usage/credits (e.g., "Credits: 450/500").
  - `LanguageSelector`: Allows users to change the application language.
  - User Avatar/Profile `IconButton`: A dropdown menu with links to "Settings" and "Logout".

## III. Main Content Area

This section dynamically changes based on the state of the conversion process and is the primary focus of the viewer page.

### Conversion Section

This is the core interactive part of the viewer page and handles the entire lifecycle of a file conversion, primarily utilizing the `FileUploadModule.tsx` component.

**Implementation Note:** The viewer page will need to manage state transitions between upload, processing, results, and error states. The existing `FileUploadModule.tsx` component already redirects to `/viewer` after upload completion, which aligns perfectly with this design.

#### a. Initial State / Ready for Upload

This is the default state when the user first visits the viewer page or after completing/clearing a previous conversion. The `FileUploadModule.tsx` component will render this state.

- **Headline:** A clear call to action, e.g., "Upload Your Bank Statement" (configurable via `FileUploadModule.tsx` strings).
- **`FileUploadZone` (provided by `FileUploadModule.tsx`):**
  - A prominent, visually distinct area for drag-and-drop functionality.
  - Should include an icon (e.g., upload cloud) and instructive text (e.g., "Drag & drop PDF here, or click to select").
  - Clicking this zone should also open a native file picker.
- **Alternative `FileInput` `PrimaryButton` (provided by `FileUploadModule.tsx`):**
  - Label: "Or Select File" or "Choose File" (configurable via `FileUploadModule.tsx` strings).
  - This provides an explicit button for users who prefer not to drag and drop. This can be conditionally hidden via `FileUploadModule.tsx` props if desired.
- **Helper Text (within `FileUploadModule.tsx`):**
  - Brief text below the upload zone indicating supported file types and constraints.
  - For the viewer page, this will be configured to: "Supported file: PDF. Max file size: 10MB." (using the `maxFileSize` prop in `FileUploadModule.tsx`).

#### b. Uploading / Processing State

This state is active once a file has been selected/dropped and is being uploaded and processed. This is handled by `FileUploadModule.tsx`.

- **Visual Feedback on `FileUploadZone` (within `FileUploadModule.tsx`):**
  - The upload zone and "Select File" button become disabled or visually indicate activity.
- **`ProgressBar` (within `FileUploadModule.tsx`):**
  - A progress bar appears, providing visual feedback for file upload progress.
  - The existing redirection to `/viewer` after upload completion works perfectly with this design.
- **Status Text (within `FileUploadModule.tsx`):**
  - Dynamic text updates indicating the current step, e.g., file name, size, and upload percentage.

#### c. Results Displayed State

This state is active after the `onFileUpload` callback from `FileUploadModule.tsx` has been processed by the viewer page, the backend has successfully extracted data, and the viewer UI is updated.

- **UI Transition:** The viewer page manages this transition by conditionally rendering either the `FileUploadModule.tsx` component OR the results view, based on the current state (e.g., a `showResults` boolean state).
- **Success Message:**
  - A clear confirmation message, e.g., "Extraction Complete! Review your transactions below." or "Successfully processed `[filename.ext]`." This will be an inline message at the top of the results section.
- **Processed File Information:**
  - Display the name of the file that was processed, e.g., "Results for: `[filename.ext]`".
- **`DataTable` for Extracted Transactions:**
  - The core of this view. Displays the structured transaction data.
  - **Columns:** Date, Description, Amount, Currency, Transaction Type (and any other relevant extracted fields).
  - **Functionality:**
    - Should be scrollable (vertically and horizontally if many columns) if the content exceeds the allocated space.
    - Consider pagination or virtual scrolling for very large numbers of transactions, although initial versions might not require this.
    - Read-only display. No inline editing in this view.
- **`PrimaryButton` for Export:**
  - Label: "Download XLSX".
  - Action: Triggers the download of the extracted data as an XLSX file.
- **`SecondaryButton` for New Conversion:**
  - Label: "Process Another File" or "Clear & Upload New".
  - Action: Clears the current results and returns the UI to the **Initial State / Ready for Upload** (resets viewer state to show `FileUploadModule.tsx` again).

#### d. Error State

This state is active if any part of the upload (handled by `FileUploadModule.tsx`) or backend processing (handled by the viewer page logic) fails.

- **UI Transition:**
  - For upload errors: `FileUploadModule.tsx` handles these internally and remains visible with error display.
  - For backend processing errors: The viewer page displays an error message in place of or alongside the results area.
- **Clear Error Message:**
  - For upload errors, `FileUploadModule.tsx` displays an inline `Alert`.
  - For backend extraction errors, the viewer page will display a prominent inline alert box with a distinct error color.
  - Message should be user-friendly but informative, e.g.:
    - (Upload Error from Module): "Error: Invalid file type. Please upload a PDF file."
    - (Upload Error from Module): "Error: File size exceeds the 10MB limit."
    - (Backend Error): "An unexpected error occurred while processing your file. Please try again."
    - (Backend Error): "Extraction failed. We couldn't read the data from this file."
- **Action Buttons:**
  - `PrimaryButton` or `SecondaryButton`: "Try Again" (if the error seems retryable with the same file).
  - `SecondaryButton` or Link: "Upload a Different File" or "Go Back to Upload".
  - Clicking these would typically reset the conversion section to the **Initial State / Ready for Upload**.

## IV. Implementation Considerations

### State Management

The viewer page should maintain state variables such as:

- `uploadState`: 'idle' | 'uploading' | 'processing' | 'completed' | 'error'
- `extractedData`: Array of transaction objects (when extraction succeeds)
- `currentFile`: File object and metadata
- `errorMessage`: String for backend processing errors

### FileUploadModule Configuration

For viewer page usage, `FileUploadModule.tsx` should be configured with:

- `acceptedFileTypes`: `{ "application/pdf": [".pdf"] }`
- `maxFileSize`: `10 * 1024 * 1024` (10MB)
- `onFileUpload`: Viewer's handler function for triggering backend extraction
- Appropriate strings for PDF-only messaging

## V. General Considerations

- **Responsiveness:** All components and layouts must be responsive and adapt to different screen sizes (desktop, tablet, mobile).
- **Accessibility:** Ensure UI elements are accessible (ARIA attributes, keyboard navigation, sufficient color contrast).
- **Loading Indicators:** Beyond the progress bar in `FileUploadModule.tsx`, the viewer page should show loading indicators (e.g., spinners or skeleton screens) while communicating with the backend for data extraction after a successful upload.
- **Feedback:** Rely on direct UI updates and inline messages/alerts for feedback. For instance, the `FileUploadModule.tsx` uses an inline `Alert` for upload errors. The viewer page will use similar inline alerts for extraction errors.

This detailed design should guide the implementation of a user-friendly and efficient viewer experience for the bank statement conversion process.
