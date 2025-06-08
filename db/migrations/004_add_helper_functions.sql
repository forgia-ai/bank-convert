-- Migration: 004_add_helper_functions.sql
-- Description: Add essential RPC functions for atomic operations
-- Created: 2024-01-01

-- Atomic function to increment user usage
-- This ensures race-condition-free updates to usage counts
CREATE OR REPLACE FUNCTION increment_user_usage(
  usage_id UUID,
  increment_by INTEGER
)
RETURNS void AS $$
BEGIN
  -- Validate inputs
  IF increment_by <= 0 THEN
    RAISE EXCEPTION 'Increment must be positive, got %', increment_by;
  END IF;

  -- Atomic increment with existence check
  UPDATE user_usage 
  SET 
    pages_consumed = pages_consumed + increment_by,
    updated_at = NOW()
  WHERE id = usage_id;

  -- Check if update affected any rows
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usage record with ID % not found', usage_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add comment to function
COMMENT ON FUNCTION increment_user_usage(UUID, INTEGER) IS 'Atomically increment user page usage with race condition protection';

-- Grant execution permissions to authenticated users
GRANT EXECUTE ON FUNCTION increment_user_usage(UUID, INTEGER) TO authenticated; 