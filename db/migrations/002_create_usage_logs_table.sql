-- Migration: 002_create_usage_logs_table.sql
-- Description: Create usage_logs table for audit trail of file processing
-- Created: 2025-06-15

-- Enable the moddatetime extension for automatic updated_at handling
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- Create usage logs table for audit trail
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  pages_processed INTEGER NOT NULL CHECK (pages_processed > 0),
  file_name TEXT,
  file_size INTEGER CHECK (file_size > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to automatically update updated_at using moddatetime extension
CREATE TRIGGER handle_updated_at 
  BEFORE UPDATE ON usage_logs 
  FOR EACH ROW 
  EXECUTE PROCEDURE moddatetime (updated_at);

-- Add comment to table
COMMENT ON TABLE usage_logs IS 'Audit trail of all file processing activities with metadata';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id 
  ON usage_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at 
  ON usage_logs(created_at);

-- Composite index for common queries (user + date range)
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_date 
  ON usage_logs(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Audit logs should be immutable - only allow INSERT and SELECT
CREATE POLICY "Allow anonymous insert" ON usage_logs 
  FOR INSERT 
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous select" ON usage_logs 
  FOR SELECT 
  TO anon
  USING (true); 