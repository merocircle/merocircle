-- Drop existing functions if they exist (to avoid return type conflicts)
DROP FUNCTION IF EXISTS search_creators(TEXT, INTEGER);
DROP FUNCTION IF EXISTS get_creator_profile(UUID, UUID);
DROP FUNCTION IF EXISTS get_creator_posts(UUID, UUID, INTEGER);
DROP FUNCTION IF EXISTS get_discovery_feed(UUID, INTEGER);

-- Create search_creators function for optimized creator search
-- This version matches the schema from social-features-migration.sql
CREATE OR REPLACE FUNCTION search_creators(search_query TEXT, search_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  photo_url TEXT,
  bio TEXT,
  category TEXT,
  is_verified BOOLEAN,
  followers_count INT,
  posts_count INT,
  total_earnings NUMERIC(10,2)
) 
LANGUAGE plpgsql
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
    cp.followers_count,
    cp.posts_count,
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
    -- Exact name matches first
    CASE WHEN u.display_name ILIKE search_query THEN 1 ELSE 2 END,
    -- Then by verification status
    CASE WHEN cp.is_verified THEN 1 ELSE 2 END,
    -- Then by follower count
    cp.followers_count DESC,
    -- Then by earnings
    cp.total_earnings DESC
  LIMIT search_limit;
END;
$$;

-- Create get_creator_profile function for detailed creator profiles
CREATE OR REPLACE FUNCTION get_creator_profile(creator_user_id UUID, current_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  photo_url TEXT,
  bio TEXT,
  category TEXT,
  is_verified BOOLEAN,
  followers_count INT,
  posts_count INT,
  total_earnings NUMERIC(10,2),
  is_following BOOLEAN
) 
LANGUAGE plpgsql
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
    cp.followers_count,
    cp.posts_count,
    cp.total_earnings,
    CASE 
      WHEN current_user_id IS NOT NULL THEN 
        EXISTS(SELECT 1 FROM public.follows WHERE follower_id = current_user_id AND following_id = creator_user_id)
      ELSE FALSE 
    END as is_following
  FROM public.users u
  JOIN public.creator_profiles cp ON u.id = cp.user_id
  WHERE u.id = creator_user_id AND u.role = 'creator';
END;
$$;

-- Create get_creator_posts function for creator's posts with engagement data
CREATE OR REPLACE FUNCTION get_creator_posts(creator_user_id UUID, current_user_id UUID DEFAULT NULL, post_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  image_url TEXT,
  creator_id UUID,
  creator_name TEXT,
  creator_photo_url TEXT,
  likes_count BIGINT,
  comments_count BIGINT,
  user_has_liked BOOLEAN,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.content,
    p.image_url,
    p.creator_id,
    u.display_name as creator_name,
    u.photo_url as creator_photo_url,
    COALESCE(like_stats.likes_count, 0) as likes_count,
    COALESCE(comment_stats.comments_count, 0) as comments_count,
    CASE 
      WHEN current_user_id IS NOT NULL THEN 
        EXISTS(SELECT 1 FROM public.post_likes WHERE user_id = current_user_id AND post_id = p.id)
      ELSE FALSE 
    END as user_has_liked,
    p.created_at
  FROM public.posts p
  JOIN public.users u ON p.creator_id = u.id
  LEFT JOIN (
    SELECT 
      post_id,
      COUNT(*) as likes_count
    FROM public.post_likes 
    GROUP BY post_id
  ) like_stats ON p.id = like_stats.post_id
  LEFT JOIN (
    SELECT 
      post_id,
      COUNT(*) as comments_count
    FROM public.post_comments 
    GROUP BY post_id
  ) comment_stats ON p.id = comment_stats.post_id
  WHERE p.creator_id = creator_user_id
  ORDER BY p.created_at DESC
  LIMIT post_limit;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_creators(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_creator_profile(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_creator_posts(UUID, UUID, INTEGER) TO authenticated;
