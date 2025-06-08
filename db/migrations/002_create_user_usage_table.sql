-- Migration: 002_create_user_usage_table.sql
-- Description: Create user_usage table for tracking monthly page consumption
-- Created: 2024-01-01

-- Create user usage tracking table
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  pages_consumed INTEGER DEFAULT 0 CHECK (pages_consumed >= 0),
  plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'growth', 'premium')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one record per user per billing period
  CONSTRAINT unique_user_billing_period UNIQUE(clerk_user_id, billing_period_start)
);

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_usage_updated_at 
  BEFORE UPDATE ON user_usage 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE user_usage IS 'Tracks monthly page usage per user aligned with billing periods';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_usage_clerk_user_id 
  ON user_usage(clerk_user_id);

CREATE INDEX IF NOT EXISTS idx_user_usage_billing_period 
  ON user_usage(billing_period_start, billing_period_end);

CREATE INDEX IF NOT EXISTS idx_user_usage_plan_type 
  ON user_usage(plan_type);

-- Enable Row Level Security
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Note: These policies assume Clerk integration where user context is available

-- Policy: Users can view their own usage data
CREATE POLICY "Users can view own usage" ON user_usage 
  FOR SELECT 
  USING (clerk_user_id = current_setting('app.current_user_id', true));

-- Policy: System can manage all usage data (server-side operations with service key)
CREATE POLICY "System can manage usage" ON user_usage 
  FOR ALL 
  USING (true); 