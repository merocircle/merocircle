-- Migration to remove followers system and keep only supporters (people who have paid)
-- This migration removes the follows table and related functionality
-- Only supporters (people who have made payments) will be tracked

-- Drop triggers first
DROP TRIGGER IF EXISTS update_followers_count_trigger ON public.follows;

-- Drop functions
DROP FUNCTION IF EXISTS update_creator_followers_count();
DROP FUNCTION IF EXISTS get_discovery_feed(UUID, INT);
DROP FUNCTION IF EXISTS search_creators(TEXT, INT);
DROP FUNCTION IF EXISTS get_creator_profile(UUID, UUID);

-- Drop the follows table
DROP TABLE IF EXISTS public.follows CASCADE;

-- Remove followers_count from creator_profiles (we'll use supporters_count instead)
ALTER TABLE public.creator_profiles 
DROP COLUMN IF EXISTS followers_count;

-- Add supporters_count if it doesn't exist (people who have actually paid)
ALTER TABLE public.creator_profiles 
ADD COLUMN IF NOT EXISTS supporters_count integer default 0;

-- Update user_activities to remove follow-related activities
DELETE FROM public.user_activities WHERE activity_type = 'user_followed';

-- Update activity type check to remove 'user_followed'
ALTER TABLE public.user_activities 
DROP CONSTRAINT IF EXISTS user_activities_activity_type_check;

ALTER TABLE public.user_activities 
ADD CONSTRAINT user_activities_activity_type_check 
CHECK (activity_type IN ('post_created', 'post_liked', 'comment_added', 'support_given'));

-- Create function to update supporters count based on transactions
CREATE OR REPLACE FUNCTION update_creator_supporters_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
    -- Increment supporters count when a payment is completed
    UPDATE public.creator_profiles 
    SET supporters_count = (
      SELECT COUNT(DISTINCT supporter_id)
      FROM public.supporter_transactions
      WHERE creator_id = NEW.creator_id 
      AND status = 'completed'
    )
    WHERE user_id = NEW.creator_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' THEN
    -- Handle status change to completed
    UPDATE public.creator_profiles 
    SET supporters_count = (
      SELECT COUNT(DISTINCT supporter_id)
      FROM public.supporter_transactions
      WHERE creator_id = NEW.creator_id 
      AND status = 'completed'
    )
    WHERE user_id = NEW.creator_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update supporters count
DROP TRIGGER IF EXISTS update_supporters_count_trigger ON public.supporter_transactions;

CREATE TRIGGER update_supporters_count_trigger
  AFTER INSERT OR UPDATE ON public.supporter_transactions
  FOR EACH ROW EXECUTE FUNCTION update_creator_supporters_count();

-- Recreate search_creators function without followers_count
CREATE OR REPLACE FUNCTION search_creators(search_query TEXT, search_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  photo_url TEXT,
  bio TEXT,
  category TEXT,
  is_verified BOOLEAN,
  supporters_count INT,
  posts_count INT,
  total_earnings NUMERIC(10,2)
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.display_name,
    u.photo_url,
    cp.bio,
    cp.category,
    cp.is_verified,
    COALESCE(cp.supporters_count, 0) as supporters_count,
    COALESCE(cp.posts_count, 0) as posts_count,
    cp.total_earnings
  FROM public.users u
  JOIN public.creator_profiles cp ON u.id = cp.user_id
  WHERE u.role = 'creator'
  AND (
    to_tsvector('english', u.display_name) @@ plainto_tsquery('english', search_query)
    OR to_tsvector('english', COALESCE(cp.bio, '')) @@ plainto_tsquery('english', search_query)
    OR u.display_name ILIKE '%' || search_query || '%'
    OR cp.category ILIKE '%' || search_query || '%'
  )
  ORDER BY 
    CASE WHEN u.display_name ILIKE search_query THEN 1 ELSE 2 END,
    CASE WHEN cp.is_verified THEN 1 ELSE 2 END,
    COALESCE(cp.supporters_count, 0) DESC,
    cp.total_earnings DESC
  LIMIT search_limit;
END;
$$;

-- Recreate get_creator_profile function without follow status
CREATE OR REPLACE FUNCTION get_creator_profile(creator_user_id UUID, current_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  photo_url TEXT,
  bio TEXT,
  category TEXT,
  is_verified BOOLEAN,
  supporters_count INT,
  posts_count INT,
  total_earnings NUMERIC(10,2),
  is_supporter BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.display_name,
    u.photo_url,
    cp.bio,
    cp.category,
    cp.is_verified,
    COALESCE(cp.supporters_count, 0) as supporters_count,
    COALESCE(cp.posts_count, 0) as posts_count,
    cp.total_earnings,
    CASE 
      WHEN current_user_id IS NOT NULL THEN 
        EXISTS(
          SELECT 1 
          FROM public.supporter_transactions 
          WHERE supporter_id = current_user_id 
          AND creator_id = creator_user_id 
          AND status = 'completed'
        )
      ELSE FALSE 
    END as is_supporter
  FROM public.users u
  JOIN public.creator_profiles cp ON u.id = cp.user_id
  WHERE u.id = creator_user_id AND u.role = 'creator';
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_creators(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_creator_profile(UUID, UUID) TO authenticated;

-- Initialize supporters_count from existing transactions
UPDATE public.creator_profiles cp
SET supporters_count = (
  SELECT COUNT(DISTINCT supporter_id)
  FROM public.supporter_transactions t
  WHERE t.creator_id = cp.user_id 
  AND t.status = 'completed'
);

-- Add comment explaining the change
COMMENT ON COLUMN public.creator_profiles.supporters_count IS 'Number of unique supporters who have made completed payments to this creator';
