-- Migration: Add Polar support to user_subscriptions table
-- This migration adds Polar-specific fields while maintaining backward compatibility
-- with existing Stripe data during the migration period.

-- Add Polar-specific columns to user_subscriptions table
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS polar_customer_id TEXT,
ADD COLUMN IF NOT EXISTS polar_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS polar_product_id TEXT,
ADD COLUMN IF NOT EXISTS polar_order_id TEXT;

-- Create indexes for Polar IDs for improved query performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_polar_customer_id
ON user_subscriptions(polar_customer_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_polar_subscription_id
ON user_subscriptions(polar_subscription_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_polar_product_id
ON user_subscriptions(polar_product_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_polar_order_id
ON user_subscriptions(polar_order_id);

-- Remove plan_type constraint to allow flexible plan types during migration
-- This allows for any plan type values during the Stripe to Polar migration
ALTER TABLE user_subscriptions
DROP CONSTRAINT IF EXISTS user_subscriptions_plan_type_check;

-- Remove NOT NULL constraint from stripe_customer_id to allow Polar-only subscriptions
-- This is crucial for the Stripe to Polar migration
ALTER TABLE user_subscriptions
ALTER COLUMN stripe_customer_id DROP NOT NULL;

-- Drop existing constraint if it exists (handles re-running migration)
ALTER TABLE user_subscriptions
DROP CONSTRAINT IF EXISTS check_customer_id_present;

-- Add simplified constraint for Polar-only setup
-- Only check for polar_customer_id since Stripe/Paddle columns will be removed
ALTER TABLE user_subscriptions
ADD CONSTRAINT check_customer_id_present 
CHECK (polar_customer_id IS NOT NULL);


-- Create unique constraints for Polar subscription IDs to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subscriptions_polar_subscription_id_unique
ON user_subscriptions(polar_subscription_id)
WHERE polar_subscription_id IS NOT NULL;

-- Add comments to document the new columns
COMMENT ON COLUMN user_subscriptions.polar_customer_id IS 'Polar customer ID for the user';
COMMENT ON COLUMN user_subscriptions.polar_subscription_id IS 'Polar subscription ID for recurring subscriptions';
COMMENT ON COLUMN user_subscriptions.polar_product_id IS 'Polar product ID that the user subscribed to';
COMMENT ON COLUMN user_subscriptions.polar_order_id IS 'Polar order ID for one-time purchases'; 