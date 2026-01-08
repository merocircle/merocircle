DROP FUNCTION IF EXISTS update_post_comments_count() CASCADE;
DROP FUNCTION IF EXISTS update_followers_count() CASCADE;
DROP FUNCTION IF EXISTS update_creator_series_count() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS get_discovery_feed(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS search_series(TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_creator_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_user_feed(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS increment_post_views(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_post_likes_count() CASCADE;

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts
    SET comments_count = COALESCE(comments_count, 0) + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts
    SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION update_followers_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE creator_profiles
    SET followers_count = COALESCE(followers_count, 0) + 1
    WHERE user_id = NEW.following_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE creator_profiles
    SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0)
    WHERE user_id = OLD.following_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts
    SET likes_count = COALESCE(likes_count, 0) + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts
    SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, photo_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'User'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', NULL),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_followers_count ON public.follows;
DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON public.post_likes;
DROP TRIGGER IF EXISTS trigger_update_post_comments_count ON public.post_comments;

CREATE TRIGGER trigger_update_followers_count
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION update_followers_count();

CREATE TRIGGER trigger_update_post_likes_count
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

CREATE TRIGGER trigger_update_post_comments_count
  AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

CREATE TRIGGER trigger_update_followers_count
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION update_followers_count();

CREATE TRIGGER trigger_update_post_likes_count
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

CREATE TRIGGER trigger_update_post_comments_count
  AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();
