-- Migration: Email queue system for reliable email delivery
-- Senior developer approach: Queue-based with retry logic

-- Create email queue table
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type TEXT NOT NULL CHECK (email_type IN ('welcome', 'post_notification', 'poll_notification', 'payment_success', 'payment_failed')),
  recipient_email TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient queue processing
CREATE INDEX idx_email_queue_status_scheduled ON email_queue(status, scheduled_for) 
  WHERE status IN ('pending', 'failed');

CREATE INDEX idx_email_queue_created_at ON email_queue(created_at DESC);

-- Enable RLS
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Only service role can access email queue
CREATE POLICY "Service role only" ON email_queue
  FOR ALL USING (auth.role() = 'service_role');

-- Function to queue welcome email
CREATE OR REPLACE FUNCTION queue_welcome_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Queue welcome email
  INSERT INTO email_queue (email_type, recipient_email, payload)
  VALUES (
    'welcome',
    NEW.email,
    jsonb_build_object(
      'userId', NEW.id,
      'userName', COALESCE(
        NEW.raw_user_meta_data->>'display_name',
        NEW.raw_user_meta_data->>'full_name', 
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
      ),
      'userRole', COALESCE(NEW.raw_user_meta_data->>'role', 'supporter'),
      'userEmail', NEW.email
    )
  );

  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_user_created_queue_welcome_email ON auth.users;

CREATE TRIGGER on_user_created_queue_welcome_email
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION queue_welcome_email();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_queue_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_email_queue_updated_at
  BEFORE UPDATE ON email_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_email_queue_updated_at();

-- Add comments
COMMENT ON TABLE email_queue IS 'Queue for outgoing emails with retry logic';
COMMENT ON COLUMN email_queue.email_type IS 'Type of email: welcome, post_notification, poll_notification, payment_success, payment_failed';
COMMENT ON COLUMN email_queue.status IS 'Current status: pending (waiting), processing (being sent), sent (completed), failed (max retries exceeded)';
COMMENT ON COLUMN email_queue.attempts IS 'Number of send attempts';
COMMENT ON COLUMN email_queue.scheduled_for IS 'When to send this email (allows delayed sending)';
