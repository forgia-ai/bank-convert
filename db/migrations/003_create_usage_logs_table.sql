-- Migration: 003_create_usage_logs_table.sql
-- Description: Create usage_logs table for audit trail of file processing
-- Created: 2024-01-01

-- Create usage logs table for audit trail
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  pages_processed INTEGER NOT NULL CHECK (pages_processed > 0),
  file_name TEXT,
  file_size INTEGER CHECK (file_size > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment to table
COMMENT ON TABLE usage_logs IS 'Audit trail of all file processing activities with metadata';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_usage_logs_clerk_user_id 
  ON usage_logs(clerk_user_id);

CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at 
  ON usage_logs(created_at);

-- Composite index for common queries (user + date range)
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_date 
  ON usage_logs(clerk_user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Users can view their own logs
CREATE POLICY "Users can view own logs" ON usage_logs 
  FOR SELECT 
  USING (clerk_user_id = current_setting('app.current_user_id', true));

-- Policy: System can create logs (server-side operations)
CREATE POLICY "System can create logs" ON usage_logs 
  FOR INSERT 
  WITH CHECK (true);

-- Policy: System can view all logs (for admin purposes)
CREATE POLICY "System can view logs" ON usage_logs 
  FOR SELECT 
  USING (true); 