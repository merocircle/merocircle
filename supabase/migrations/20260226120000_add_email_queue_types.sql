-- Add email types for queue-by-default: subscription_confirmation, new_supporter_notification, channel_mention
ALTER TABLE email_queue
  DROP CONSTRAINT IF EXISTS email_queue_email_type_check;

ALTER TABLE email_queue
  ADD CONSTRAINT email_queue_email_type_check CHECK (email_type IN (
    'welcome',
    'post_notification',
    'poll_notification',
    'payment_success',
    'payment_failed',
    'subscription_expiring_reminder',
    'subscription_expired',
    'subscription_confirmation',
    'new_supporter_notification',
    'channel_mention'
  ));
