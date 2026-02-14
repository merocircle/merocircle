-- User notification/email preferences (for Settings > Email and Notification Preferences)
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  email_everyone_mentions boolean NOT NULL DEFAULT true,
  email_username_mentions boolean NOT NULL DEFAULT true,
  email_new_members boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

COMMENT ON TABLE public.user_notification_preferences IS 'Per-user email/notification toggles: @everyone mentions, @username mentions, new members';
COMMENT ON COLUMN public.user_notification_preferences.email_everyone_mentions IS 'Receive emails when @everyone is mentioned in a channel';
COMMENT ON COLUMN public.user_notification_preferences.email_username_mentions IS 'Receive emails when @username mentions you';
COMMENT ON COLUMN public.user_notification_preferences.email_new_members IS 'Receive emails for new members (e.g. in channels you moderate)';
