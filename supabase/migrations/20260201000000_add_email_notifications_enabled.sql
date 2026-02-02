-- Add email_notifications_enabled column to supporter_transactions table
ALTER TABLE supporter_transactions 
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_supporter_email_notifications 
ON supporter_transactions(supporter_id, creator_id, email_notifications_enabled)
WHERE email_notifications_enabled = true;

-- Add comment for documentation
COMMENT ON COLUMN supporter_transactions.email_notifications_enabled IS 'Whether the supporter wants to receive email notifications for new posts from this creator';
