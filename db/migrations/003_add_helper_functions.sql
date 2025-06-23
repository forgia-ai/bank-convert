-- Migration: 003_add_helper_functions.sql
-- Description: Add essential RPC functions for atomic operations
-- Created: 2025-06-15

-- Atomic function to increment user usage
-- This ensures race-condition-free updates to usage counts
CREATE OR REPLACE FUNCTION increment_user_usage(
  usage_id UUID,
  increment_by INTEGER
)
RETURNS void
SET search_path = public
AS $$
BEGIN
  -- Validate inputs
  IF increment_by <= 0 THEN
    RAISE EXCEPTION 'Increment must be positive, got %', increment_by;
  END IF;

  -- Atomic increment with existence check
  -- Note: updated_at is automatically handled by moddatetime trigger
  UPDATE user_usage 
  SET pages_consumed = pages_consumed + increment_by
  WHERE id = usage_id;

  -- Check if update affected any rows
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usage record with ID % not found', usage_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add comment to function
COMMENT ON FUNCTION increment_user_usage(UUID, INTEGER) IS 'Atomically increment user page usage with race condition protection';

-- Grant execution permissions to anonymous users
GRANT EXECUTE ON FUNCTION increment_user_usage(UUID, INTEGER) TO anon; 