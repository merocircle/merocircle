-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('like', 'comment', 'payment', 'support')),
  actor_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE,
  metadata jsonb DEFAULT '{}'::jsonb,
  read boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_post_id ON public.notifications(post_id);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can update their own notifications (to mark as read)
CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to create notification for post likes
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_creator_id uuid;
BEGIN
  -- Get the creator_id of the post
  SELECT creator_id INTO post_creator_id
  FROM public.posts
  WHERE id = NEW.post_id;

  -- Only create notification if the like is not from the post creator themselves
  IF post_creator_id IS NOT NULL AND post_creator_id != NEW.user_id THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      actor_id,
      post_id,
      metadata,
      read
    ) VALUES (
      post_creator_id,
      'like',
      NEW.user_id,
      NEW.post_id,
      jsonb_build_object('action', 'liked your post'),
      false
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for post likes
DROP TRIGGER IF EXISTS trigger_create_like_notification ON public.post_likes;
CREATE TRIGGER trigger_create_like_notification
  AFTER INSERT ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION create_like_notification();

-- Function to create notification for post comments
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_creator_id uuid;
BEGIN
  -- Get the creator_id of the post
  SELECT creator_id INTO post_creator_id
  FROM public.posts
  WHERE id = NEW.post_id;

  -- Only create notification if the comment is not from the post creator themselves
  IF post_creator_id IS NOT NULL AND post_creator_id != NEW.user_id THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      actor_id,
      post_id,
      comment_id,
      metadata,
      read
    ) VALUES (
      post_creator_id,
      'comment',
      NEW.user_id,
      NEW.post_id,
      NEW.id,
      jsonb_build_object(
        'action', 'commented on your post',
        'comment_preview', LEFT(NEW.content, 100)
      ),
      false
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for post comments
DROP TRIGGER IF EXISTS trigger_create_comment_notification ON public.post_comments;
CREATE TRIGGER trigger_create_comment_notification
  AFTER INSERT ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_notification();

-- Grant permissions
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT EXECUTE ON FUNCTION create_like_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION create_comment_notification() TO authenticated;
