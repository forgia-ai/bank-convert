-- Migration: 001_create_user_usage_table.sql
-- Description: Create user_usage table for tracking monthly page consumption
-- Created: 2025-06-15

-- Enable the moddatetime extension for automatic updated_at handling
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- Create user usage tracking table
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  pages_consumed INTEGER DEFAULT 0 CHECK (pages_consumed >= 0),
  plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'paid1', 'paid2')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one record per user per billing period
  CONSTRAINT unique_user_billing_period UNIQUE(user_id, billing_period_start)
);

-- Trigger to automatically update updated_at using moddatetime extension
CREATE TRIGGER handle_updated_at 
  BEFORE UPDATE ON user_usage 
  FOR EACH ROW 
  EXECUTE PROCEDURE moddatetime (updated_at);

-- Add comment to table
COMMENT ON TABLE user_usage IS 'Tracks monthly page usage per user aligned with billing periods';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id 
  ON user_usage(user_id);

CREATE INDEX IF NOT EXISTS idx_user_usage_billing_period 
  ON user_usage(billing_period_start, billing_period_end);

CREATE INDEX IF NOT EXISTS idx_user_usage_plan_type 
  ON user_usage(plan_type);

-- Enable Row Level Security
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Policy: Allow anonymous access for now
CREATE POLICY "Allow anonymous access" ON user_usage 
  FOR ALL 
  TO anon
  USING (true);
  