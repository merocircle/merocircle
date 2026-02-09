-- Migration: Subscription expiry tracking for eSewa/Khalti
-- Adds fields to track reminder sending and expiry management for one-time payment gateways

-- Add expiry tracking fields to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS reminder_sent_at JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS renewal_count INTEGER DEFAULT 0;

-- Add comments for clarity
COMMENT ON COLUMN subscriptions.reminder_sent_at IS 
'Tracks when expiry reminders were sent: {"2_days": "ISO timestamp", "1_day": "ISO timestamp"}';

COMMENT ON COLUMN subscriptions.auto_renew IS 
'Currently unused for eSewa/Khalti (one-time payments). Reserved for future use.';

COMMENT ON COLUMN subscriptions.renewal_count IS 
'Number of times this subscription has been renewed by the user';

-- Create index for efficient expiry checking
-- Only index active eSewa/Khalti subscriptions that need expiry checks
CREATE INDEX IF NOT EXISTS idx_subscriptions_expiry 
ON subscriptions(current_period_end, status, payment_gateway)
WHERE status = 'active' AND payment_gateway IN ('esewa', 'khalti');

-- Create index for quick lookup by supporter
CREATE INDEX IF NOT EXISTS idx_subscriptions_supporter_status
ON subscriptions(supporter_id, status, current_period_end DESC);

-- Update existing eSewa/Khalti subscriptions to have proper expiry dates if missing
-- This ensures all active subscriptions have a current_period_end set
UPDATE subscriptions
SET 
  current_period_end = COALESCE(
    current_period_end, 
    created_at + INTERVAL '30 days'
  ),
  current_period_start = COALESCE(
    current_period_start,
    created_at
  ),
  reminder_sent_at = COALESCE(reminder_sent_at, '{}'::jsonb)
WHERE 
  payment_gateway IN ('esewa', 'khalti')
  AND status = 'active'
  AND (current_period_end IS NULL OR reminder_sent_at IS NULL);
