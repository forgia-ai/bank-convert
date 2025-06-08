# Database Setup Guide

This guide explains how to set up Supabase for the Bank Convert application.

## Prerequisites

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project in Supabase

## Environment Variables

Add these environment variables to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Where to find these values:

1. **NEXT_PUBLIC_SUPABASE_URL**: Go to your Supabase project → Settings → API → Project URL
2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Go to your Supabase project → Settings → API → Project API keys → `anon` `public`
3. **SUPABASE_SERVICE_ROLE_KEY**: Go to your Supabase project → Settings → API → Project API keys → `service_role` `secret`

## Database Migration Setup

You have two options to set up the database:

### Option 1: Run All Migrations at Once (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `db/migrations/run_all_migrations.sql`
4. Run the SQL to create all tables, indexes, functions, and policies

### Option 2: Run Individual Migrations

Run each migration file in order:

1. `001_initial_setup.sql` - Enable extensions
2. `002_create_user_usage_table.sql` - Create user usage table with indexes, triggers, and RLS
3. `003_create_usage_logs_table.sql` - Create audit logs table with indexes and RLS
4. `004_add_helper_functions.sql` - Add utility functions

## Database Tables

The schema creates the following tables:

### `user_usage`
- Tracks monthly page usage per user
- Billing periods align with subscription start dates
- Enforces plan limits (free: 50, growth: 500, premium: 1000 pages/month)

### `usage_logs`
- Audit trail of all file processing activities
- Includes file metadata and processing details

## Row Level Security (RLS)

The database uses Row Level Security to ensure users can only access their own data. The policies are set up to:

- Allow users to view their own usage data
- Allow server-side operations to manage all data
- Prevent unauthorized access between users

## Plan Types and Limits

```typescript
const PLAN_LIMITS = {
  free: 50,      // 50 pages per month
  growth: 500,   // 500 pages per month  
  premium: 1000, // 1000 pages per month
}
```

## Usage Tracking Functions

The following utilities are available in `lib/usage/tracking.ts`:

- `checkUsageLimit()` - Check if user can process additional pages
- `trackPageUsage()` - Record page usage after processing
- `getUserUsage()` - Get current usage statistics
- `getUserUsageHistory()` - Get usage history for analytics

## Testing the Setup

After setting up the database and environment variables, you can test the connection by running the development server and checking the logs for any database connection errors.

```bash
yarn dev
```

Look for successful database connections in the console logs when users sign in and attempt to process files. 