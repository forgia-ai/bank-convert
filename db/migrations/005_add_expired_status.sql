-- Migration: Add expired status to user_subscriptions
-- This allows subscriptions to be marked as expired when their period ends

-- Drop the existing status constraint
ALTER TABLE user_subscriptions
DROP CONSTRAINT IF EXISTS user_subscriptions_status_check;

-- Add new constraint that includes expired status
ALTER TABLE user_subscriptions
ADD CONSTRAINT user_subscriptions_status_check
CHECK (status IN ('active', 'canceled', 'expired', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid'));