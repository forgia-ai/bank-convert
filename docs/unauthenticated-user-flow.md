# Unauthenticated User Flow - Implementation Plan

## Overview

This document outlines the complete user journey for unauthenticated users, from their first visit to becoming paid subscribers. The flow is designed to maximize conversions while maintaining strict token cost control through page-based limits.

## Core Strategy: "Full Document Scan + Limited Transaction Preview"

### Key Principles

1. **Token Cost Control**: Strict limits at every tier to manage AI processing costs
2. **Value Demonstration**: Show full extraction capability with limited preview
3. **Progressive Disclosure**: Clear upgrade path with increasing value at each tier
4. **Conversion Optimization**: Strategic friction points to encourage signup and upgrades

## User Journey Flow

### Phase 1: Homepage Visit (Unauthenticated)

#### 1.1 Initial Landing

- User arrives at homepage (`/[lang]`)
- Sees `InteractiveHeroSection` with file upload capability
- Clear messaging: "Convert Bank Statements to Excel - Try Free!"

#### 1.2 File Upload Initiation

- User uploads PDF via `FileUploadModule`
- System validates file (type, size limits)
- Shows processing indicator

#### 1.3 Document Analysis & Preview

**Processing Steps:**

1. Extract all transactions from entire document
2. Count total transactions and pages
3. Display first 10 transactions only
4. Show summary statistics

**Display Elements:**

- **Success Message**: "✅ Analysis Complete: Found 47 transactions across 8 pages"
- **Preview Section**: Table showing first 10 transactions with full data
- **Limitation Notice**: "Showing first 10 transactions. 37 more available."
- **Primary CTA**: "Sign Up Free - Get 50 Pages Total" (prominent button)
- **Secondary CTA**: "See Pricing Plans" (link)

#### 1.4 Rate Limiting

- **Limit**: 1 document per month per IP address
- **Tracking**: Store IP + timestamp in database
- **Reset**: Monthly on calendar month basis
- **Exceeded Message**: "You've used your free analysis for this month. Sign up for immediate access to 50 free pages!"

### Phase 2: User Signup (Free Account Creation)

#### 2.1 Signup Trigger

**From Homepage Preview:**

- User clicks "Sign Up Free" CTA
- Redirect to `/sign-up` with context parameter
- Pre-populate messaging about 50 total free pages

**From Rate Limit:**

- User hits monthly limit
- Strong CTA to signup for immediate access to 50 free pages
- Emphasize "no waiting" benefit

#### 2.2 Clerk Authentication Flow

- Standard Clerk signup process
- Collect: email, password, basic profile info
- Email verification if required
- Automatic redirect to dashboard after completion

#### 2.3 Welcome & Onboarding

- Redirect to `/[lang]/viewer` (dashboard)
- Welcome message highlighting free tier benefits:
  - "Welcome! You now have 50 pages total to process"
  - "Upgrade for monthly page allowances"
  - Quick tutorial or tour (optional)

### Phase 3: Free Tier Usage (Authenticated User)

#### 3.1 Free Tier Specifications

- **Page Limit**: 50 pages total (lifetime)
- **Features**: Full extraction, clean Excel export, basic support
- **Restrictions**: No API access, no bulk processing
- **Reset**: No reset - one-time allowance

#### 3.2 Usage Tracking & Display

- **Dashboard Header**: "Pages Used: 23/50 total"
- **Progress Bar**: Visual indicator of usage
- **Remaining Pages**: "27 pages remaining"
- **Usage History**: Simple log of recent conversions

#### 3.3 Conversion Touchpoints

**At 100% Usage (50 pages):**

- Block further processing
- Upgrade modal: "You've used all your free pages"
- Options: "Upgrade Now" or "Account is limited until upgrade"

### Phase 4: Upgrade to Paid Subscription

#### 4.1 Pricing Strategy

**Growth Plan - $8/month (billed annually) or $10/month:**

- 500 pages/month
- Priority email support
- Advanced export formats

**Premium Plan - $15/month (billed annually) or $20/month:**

- Unlimited pages
- API access (future)
- Bulk processing (future)
- Dedicated support

#### 4.2 Upgrade Triggers

**Proactive Triggers:**

- Monthly email reminders about upgrade benefits
- Seasonal promotions or discounts

**Reactive Triggers:**

- User hits page limit
- User requests features not available in free tier
- User contacts support about limitations

#### 4.3 Stripe Integration Flow

1. User clicks "Upgrade" CTA
2. Redirect to pricing page (`/[lang]/pricing`)
3. User selects plan (monthly/annual toggle)
4. Stripe Checkout integration
5. Payment processing
6. Webhook handling for subscription activation
7. Redirect to dashboard with confirmation
8. Update user permissions and limits

#### 4.4 Post-Upgrade Experience

- Immediate access to new limits
- Confirmation message: "Upgrade successful! You now have unlimited pages"
- Updated dashboard UI reflecting new tier
- Welcome email with premium features guide

## Technical Implementation Requirements

### 4.5 Database Schema Updates

#### Usage Table

```sql
CREATE TABLE usage (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255), -- Clerk user ID, NULL for anonymous
  ip_address INET, -- For anonymous users
  pages_processed INTEGER,
  filename VARCHAR(255), -- Optional, for logging/support
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_usage_user_id ON usage(user_id);
CREATE INDEX idx_usage_ip_address ON usage(ip_address);
CREATE INDEX idx_usage_created_at ON usage(created_at);
```

**Purpose**: Single table that logs each extraction event, allowing flexible querying for different user types and time periods.

**Usage Examples**:

```sql
-- Check anonymous user monthly limit (1 document per month per IP)
SELECT COUNT(*)
FROM usage
WHERE ip_address = ?
  AND created_at >= date_trunc('month', NOW());

-- Check free user total pages (50 pages lifetime)
SELECT COALESCE(SUM(pages_processed), 0)
FROM usage
WHERE user_id = ?;

-- Check paid user monthly pages (500 pages/month for Growth plan)
SELECT COALESCE(SUM(pages_processed), 0)
FROM usage
WHERE user_id = ?
  AND created_at >= date_trunc('month', NOW());
```

### 4.6 API Endpoints

#### Anonymous Usage

- `POST /api/upload/anonymous` - Handle unauth uploads, log to usage table
- `GET /api/limits/check` - Check IP-based monthly limits from usage table

#### Authenticated Usage

- `GET /api/usage/current` - Get current usage (total for free, monthly for paid)
- `POST /api/upload/authenticated` - Handle auth uploads, log to usage table
- `GET /api/subscription/status` - Get subscription details

### 4.7 Component Modifications

#### FileUploadModule Updates

- Add `isAuthenticated` prop
- Different behavior for auth vs unauth users
- Integration with usage table for tracking
- Automatic logging of each extraction event

#### New Components Needed

- `UsageTracker` - Display current usage
- `UpgradePrompt` - Conversion-focused upgrade CTAs
- `LimitReachedModal` - Handle limit exceeded scenarios
- `PreviewTable` - Display limited transaction preview

## Messaging & Copy Framework

### 4.8 Key Messages by Stage

#### Homepage (Unauth)

- **Hero**: "Convert Bank Statements to Excel - Try Free!"
- **Subtext**: "Upload PDF, get structured data instantly. No signup required for preview."
- **CTA**: "Upload Statement & Convert"

#### Preview Results (Unauth)

- **Success**: "✅ Found [X] transactions across [Y] pages"
- **Preview**: "Showing first 10 transactions below"
- **Upgrade**: "Sign up free for 50 total pages to see all [X] transactions"

#### Dashboard (Free User)

- **Welcome**: "Welcome! Process up to 50 pages total"
- **Usage**: "Pages used: [X]/50 total"
- **Upgrade**: "Need more? Upgrade for monthly page allowances"

#### Limit Reached (Free User)

- **Blocked**: "You've used all 50 of your free pages"
- **Options**: "Upgrade now for monthly page allowances"
- **Value**: "Paid users get monthly page allowances and process 10x more documents"

## Success Metrics & KPIs

### 4.9 Conversion Funnel Metrics

1. **Homepage to Upload**: % of visitors who upload
2. **Upload to Preview**: % of uploads that complete successfully
3. **Preview to Signup**: % of preview users who create accounts
4. **Signup to First Use**: % of new users who process documents
5. **Free to Paid**: % of free users who upgrade within 30/60/90 days
6. **Usage Progression**: Average pages used by free users before upgrade

### 4.10 Business Metrics

- **Token Cost per Conversion**: Average AI processing cost per paying customer
- **Customer Acquisition Cost (CAC)**: Total cost to acquire paying customer
- **Lifetime Value (LTV)**: Revenue per customer over subscription lifetime
- **Churn Rate**: % of users who cancel subscriptions
- **Upgrade Rate**: % of free users who become paid within timeframes

## Risk Mitigation

### 4.11 Abuse Prevention

- **IP Rate Limiting**: Strict monthly limits per IP
- **Browser Fingerprinting**: Additional tracking to prevent circumvention
- **Document Validation**: Prevent fake/test documents
- **Usage Monitoring**: Alert on suspicious patterns

### 4.12 Cost Control

- **Token Budgets**: Monthly limits on AI processing costs
- **Usage Alerts**: Notifications when approaching cost thresholds
- **Emergency Stops**: Ability to pause processing if costs spike
- **Model Optimization**: Use most cost-effective AI models for each task

## Frontend Implementation Plan

### **Phase 1: Component Modifications**

#### 1.1 FileUploadModule Enhancements

- [x] **Add new props to `FileUploadModule`**:

  ```typescript
  interface FileUploadModuleProps {
    // ... existing props
    isAuthenticated?: boolean
    userType?: "anonymous" | "free" | "paid"
    onPreviewGenerated?: (data: PreviewData) => void
  }
  ```

- [x] **Modify upload behavior** (include mock functions in component):
  - For unauth: Process and redirect to `/[lang]/preview`
  - For auth: Existing behavior (process and redirect to `/[lang]/viewer`)
  - Add rate limiting checks before processing
  - Include mock data generation directly in component

#### 1.2 Usage Tracking Components

- [x] **Create `UsageTracker` component** (`/components/dashboard/usage-tracker.tsx`)

  - Progress bar for page usage
  - Text display: "Pages used: X/Y total" or "X/Y this month"
  - Different styling for different user types
  - Include mock usage data in component

- [x] **Create `UpgradePrompt` component** (`/components/dashboard/upgrade-prompt.tsx`)
  - Contextual upgrade messages
  - Different variants for different usage levels
  - CTA buttons for pricing/upgrade

#### 1.3 Modal Components

- [x] **Create `LimitReachedModal` component** (`/components/modals/limit-reached-modal.tsx`)

  - For when users hit their limits
  - Different content for anonymous vs free users
  - Upgrade CTAs and pricing links

- [x] **Create `RateLimitModal` component** (`/components/modals/rate-limit-modal.tsx`)
  - For anonymous users who hit monthly limit
  - Signup CTA with benefits messaging

### **Phase 2: Page Creation & Modifications**

#### 2.1 Preview Page Creation

- [x] **Create dedicated preview page** (`/app/[lang]/preview/page.tsx`)

  - Reuse existing viewer layout structure (AppNavbar + Footer)
  - Show limited transaction results (first 10 transactions)
  - Strong conversion focus with upgrade CTAs
  - Same design as viewer page but with conversion elements

- [x] **Create `PreviewWorkflow` component** (`/components/preview/preview-workflow.tsx`)
  - Similar structure to `ConversionWorkflow` but conversion-optimized
  - Success message with stats ("Found 47 transactions across 8 pages")
  - Limited transaction table using existing `DataTable` component
  - Modified download section with upgrade CTAs
  - Additional upgrade prompt cards
  - Include mock transaction data directly in component

#### 2.2 Viewer Page Updates (Authenticated Users)

- [ ] **Enhance viewer page** (`/app/[lang]/viewer/page.tsx`)

  - Add user type detection (free vs paid)
  - Integrate usage tracking display
  - Add upgrade prompts based on usage levels
  - Handle different user states and limits

- [ ] **Update `ConversionWorkflow`** (`/components/viewer/conversion-workflow.tsx`)
  - Add usage checking before processing
  - Display usage tracker in header/navigation
  - Show upgrade prompts at appropriate usage thresholds
  - Handle limit exceeded scenarios with modals
  - Include mock usage checking functions

#### 2.3 Navigation Updates

- [x] **Update `AppNavbar`** (`/components/navigation/AppNavbar.tsx`)
  - Connect existing usage tracker to real data (currently shows static "0/500")
  - Show different CTAs based on user type (free vs paid)
  - Add upgrade button for free users approaching limits

### **Phase 3: Enhanced Components & State Management**

#### 3.1 Context Providers

- [ ] **Create `UserLimitsContext`** (`/contexts/user-limits-context.tsx`)
  - Track user type and limits
  - Provide usage data across components
  - Handle limit checking logic
  - Include mock data and functions

#### 3.2 Custom Hooks

- [ ] **Create usage tracking hooks**:
  - `useUserLimits()` - Get current user limits and usage
  - `useRateLimit()` - Check and track rate limits
  - `useUpgradePrompts()` - Determine when to show upgrade prompts

#### 3.3 Pricing Page Enhancements (Future)

- [ ] **Enhance pricing page** (`/app/[lang]/(marketing)/pricing/page.tsx`) - _Can be done later_
  - Add context-aware messaging
  - Highlight relevant plans based on user state
  - Add usage-based recommendations

### **Phase 4: Dictionary & Testing**

#### 4.1 Dictionary Additions

- [x] **Add new strings to dictionaries** (`/dictionaries/en.json`, `/dictionaries/pt.json`, `/dictionaries/es.json`)
  - Preview page messaging
  - Upgrade prompts and CTAs
  - Rate limiting messages
  - Usage tracking text

#### 4.2 Flow Testing

- [ ] **Test complete user journeys**:
  - Anonymous user → preview → signup → free usage → upgrade
  - Rate limiting scenarios
  - Different device/browser testing

This comprehensive plan ensures a smooth user journey from anonymous visitor to paying customer while maintaining strict cost control and maximizing conversion opportunities at each stage.

## Implementation Status

### ✅ **Completed Items (Phase 1 - UI Components Complete)**

#### **Frontend Components:**

- [x] **FileUploadModule Enhanced** - Added `isAuthenticated`, `userType`, and `onPreviewGenerated` props
- [x] **Preview Page Created** - `/app/[lang]/(marketing)/preview/page.tsx` with full responsive layout
- [x] **PreviewWorkflow Component** - Complete conversion-optimized component with:
  - Enhanced success message showing transaction and page count
  - Limited transaction table (first 10 of total)
  - Professional styling matching viewer page
  - Responsive CTA cards with upgrade messaging
  - Working CSV download functionality
- [x] **Multi-language Support** - All copy translated for EN, PT, ES
- [x] **Responsive Design** - Mobile, tablet, and desktop layouts tested
- [x] **Mock Data Integration** - Preview data generation and localStorage handling
- [x] **UsageTracker Component** - Progress bar, usage display, warnings, and upgrade prompts
- [x] **UpgradePrompt Component** - Contextual upgrade messaging with multiple variants
- [x] **AppNavbar Integration** - UsageTracker integrated into navigation for authenticated users
- [x] **Viewer Page Integration** - Usage tracking and upgrade prompts integrated into viewer workflow
- [x] **ViewerBottomSection Component** - Dedicated bottom section for usage tracking and upgrade prompts
- [x] **Enhanced Copy & Messaging** - Updated upgrade prompts to focus on "Extract More Statements" with credits-based messaging
- [x] **Button Styling & UX** - Improved button variants, cursor pointers, and vertical centering
- [x] **LimitReachedModal Component** - Modal for when users hit their page limits with different content for user types
- [x] **RateLimitModal Component** - Modal for anonymous users who hit monthly rate limits
- [x] **Modal Dictionary Support** - Complete multi-language support for both modal components
- [x] **Modal UX Refinements** - Simplified single-CTA design, proper padding, cursor pointers
- [x] **Production Ready Modals** - All modal components polished and ready for integration

#### **Key Features Implemented:**

- [x] **Value Demonstration** - Shows full extraction capability with limited preview
- [x] **Progressive Disclosure** - Clear upgrade path with feature comparisons
- [x] **Conversion Optimization** - Strategic CTAs and upgrade messaging
- [x] **Professional UI** - Consistent styling across all components
- [x] **Complete Modal System** - Production-ready modals for all user limit scenarios
- [x] **Focused User Flows** - Single-CTA design for maximum conversion efficiency

### 🔄 **Remaining Items (Future Phases)**

#### **Backend Integration:**

- [ ] Database schema implementation (usage table)
- [ ] API endpoints for usage tracking
- [ ] Rate limiting implementation
- [ ] Stripe integration for subscriptions

#### **Advanced Components:**

- [x] `UsageTracker` component for authenticated users
- [x] `UpgradePrompt` component for contextual messaging
- [x] `LimitReachedModal` and `RateLimitModal` components
- [ ] User limits context and custom hooks

#### **Enhanced Features:**

- [x] Viewer page updates for authenticated users
- [x] Navigation updates with usage tracking
- [ ] Pricing page enhancements
- [ ] Complete user journey testing

**Current Status:** Phase 1 (UI Components) is **100% complete** and production-ready. All frontend components for the unauthenticated user flow are implemented with professional design, responsive layout, conversion-optimized messaging, and complete modal system across all supported languages. Ready for backend integration.
