-- Create search_creators function for optimized creator search
CREATE OR REPLACE FUNCTION search_creators(search_query TEXT, search_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  follower_count BIGINT,
  following_count BIGINT,
  posts_count BIGINT,
  total_earned NUMERIC,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.display_name,
    u.bio,
    u.avatar_url,
    COALESCE(follower_stats.follower_count, 0) as follower_count,
    COALESCE(following_stats.following_count, 0) as following_count,
    COALESCE(post_stats.posts_count, 0) as posts_count,
    COALESCE(earning_stats.total_earned, 0) as total_earned,
    u.created_at
  FROM users u
  LEFT JOIN (
    SELECT 
      following_id,
      COUNT(*) as follower_count
    FROM follows 
    GROUP BY following_id
  ) follower_stats ON u.id = follower_stats.following_id
  LEFT JOIN (
    SELECT 
      follower_id,
      COUNT(*) as following_count
    FROM follows 
    GROUP BY follower_id
  ) following_stats ON u.id = following_stats.follower_id
  LEFT JOIN (
    SELECT 
      creator_id,
      COUNT(*) as posts_count
    FROM posts 
    GROUP BY creator_id
  ) post_stats ON u.id = post_stats.creator_id
  LEFT JOIN (
    SELECT 
      creator_id,
      SUM(amount) as total_earned
    FROM supporter_transactions 
    WHERE status = 'completed'
    GROUP BY creator_id
  ) earning_stats ON u.id = earning_stats.creator_id
  WHERE 
    u.role = 'creator'
    AND (
      u.display_name ILIKE '%' || search_query || '%'
      OR u.bio ILIKE '%' || search_query || '%'
      OR u.email ILIKE '%' || search_query || '%'
    )
  ORDER BY 
    -- Prioritize exact matches in display_name
    CASE WHEN u.display_name ILIKE search_query THEN 1 ELSE 2 END,
    -- Then by follower count (popularity)
    COALESCE(follower_stats.follower_count, 0) DESC,
    -- Then by creation date (newer first)
    u.created_at DESC
  LIMIT search_limit;
END;
$$;

-- Create get_creator_profile function for detailed creator profiles
CREATE OR REPLACE FUNCTION get_creator_profile(creator_user_id UUID, current_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  email TEXT,
  role TEXT,
  follower_count BIGINT,
  following_count BIGINT,
  posts_count BIGINT,
  total_earned NUMERIC,
  is_following BOOLEAN,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.display_name,
    u.bio,
    u.avatar_url,
    u.email,
    u.role,
    COALESCE(follower_stats.follower_count, 0) as follower_count,
    COALESCE(following_stats.following_count, 0) as following_count,
    COALESCE(post_stats.posts_count, 0) as posts_count,
    COALESCE(earning_stats.total_earned, 0) as total_earned,
    CASE 
      WHEN current_user_id IS NOT NULL THEN 
        EXISTS(SELECT 1 FROM follows WHERE follower_id = current_user_id AND following_id = creator_user_id)
      ELSE FALSE 
    END as is_following,
    u.created_at
  FROM users u
  LEFT JOIN (
    SELECT 
      following_id,
      COUNT(*) as follower_count
    FROM follows 
    GROUP BY following_id
  ) follower_stats ON u.id = follower_stats.following_id
  LEFT JOIN (
    SELECT 
      follower_id,
      COUNT(*) as following_count
    FROM follows 
    GROUP BY follower_id
  ) following_stats ON u.id = following_stats.follower_id
  LEFT JOIN (
    SELECT 
      creator_id,
      COUNT(*) as posts_count
    FROM posts 
    GROUP BY creator_id
  ) post_stats ON u.id = post_stats.creator_id
  LEFT JOIN (
    SELECT 
      creator_id,
      SUM(amount) as total_earned
    FROM supporter_transactions 
    WHERE status = 'completed'
    GROUP BY creator_id
  ) earning_stats ON u.id = earning_stats.creator_id
  WHERE u.id = creator_user_id;
END;
$$;

-- Create get_creator_posts function for creator's posts with engagement data
CREATE OR REPLACE FUNCTION get_creator_posts(creator_user_id UUID, current_user_id UUID DEFAULT NULL, post_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  media_url TEXT,
  creator_id UUID,
  creator_name TEXT,
  creator_avatar TEXT,
  likes_count BIGINT,
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
    p.media_url,
    p.creator_id,
    u.display_name as creator_name,
    u.avatar_url as creator_avatar,
    COALESCE(like_stats.likes_count, 0) as likes_count,
    CASE 
      WHEN current_user_id IS NOT NULL THEN 
        EXISTS(SELECT 1 FROM post_likes WHERE user_id = current_user_id AND post_id = p.id)
      ELSE FALSE 
    END as user_has_liked,
    p.created_at
  FROM posts p
  JOIN users u ON p.creator_id = u.id
  LEFT JOIN (
    SELECT 
      post_id,
      COUNT(*) as likes_count
    FROM post_likes 
    GROUP BY post_id
  ) like_stats ON p.id = like_stats.post_id
  WHERE p.creator_id = creator_user_id
  ORDER BY p.created_at DESC
  LIMIT post_limit;
END;
$$;

-- Create get_discovery_feed function for personalized discovery
CREATE OR REPLACE FUNCTION get_discovery_feed(user_uuid UUID, feed_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  media_url TEXT,
  creator_id UUID,
  creator_name TEXT,
  creator_avatar TEXT,
  likes_count BIGINT,
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
    p.media_url,
    p.creator_id,
    u.display_name as creator_name,
    u.avatar_url as creator_avatar,
    COALESCE(like_stats.likes_count, 0) as likes_count,
    EXISTS(SELECT 1 FROM post_likes WHERE user_id = user_uuid AND post_id = p.id) as user_has_liked,
    p.created_at
  FROM posts p
  JOIN users u ON p.creator_id = u.id
  LEFT JOIN (
    SELECT 
      post_id,
      COUNT(*) as likes_count
    FROM post_likes 
    GROUP BY post_id
  ) like_stats ON p.id = like_stats.post_id
  WHERE 
    -- Show posts from creators the user follows
    (p.creator_id IN (SELECT following_id FROM follows WHERE follower_id = user_uuid))
    OR 
    -- Show popular posts from creators the user doesn't follow
    (p.creator_id NOT IN (SELECT following_id FROM follows WHERE follower_id = user_uuid)
     AND COALESCE(like_stats.likes_count, 0) > 0)
  ORDER BY 
    -- Prioritize posts from followed creators
    CASE WHEN p.creator_id IN (SELECT following_id FROM follows WHERE follower_id = user_uuid) THEN 1 ELSE 2 END,
    -- Then by popularity (likes)
    COALESCE(like_stats.likes_count, 0) DESC,
    -- Then by recency
    p.created_at DESC
  LIMIT feed_limit;
END;
$$; 
CREATE OR REPLACE FUNCTION search_creators(search_query TEXT, search_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  follower_count BIGINT,
  following_count BIGINT,
  posts_count BIGINT,
  total_earned NUMERIC,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.display_name,
    u.bio,
    u.avatar_url,
    COALESCE(follower_stats.follower_count, 0) as follower_count,
    COALESCE(following_stats.following_count, 0) as following_count,
    COALESCE(post_stats.posts_count, 0) as posts_count,
    COALESCE(earning_stats.total_earned, 0) as total_earned,
    u.created_at
  FROM users u
  LEFT JOIN (
    SELECT 
      following_id,
      COUNT(*) as follower_count
    FROM follows 
    GROUP BY following_id
  ) follower_stats ON u.id = follower_stats.following_id
  LEFT JOIN (
    SELECT 
      follower_id,
      COUNT(*) as following_count
    FROM follows 
    GROUP BY follower_id
  ) following_stats ON u.id = following_stats.follower_id
  LEFT JOIN (
    SELECT 
      creator_id,
      COUNT(*) as posts_count
    FROM posts 
    GROUP BY creator_id
  ) post_stats ON u.id = post_stats.creator_id
  LEFT JOIN (
    SELECT 
      creator_id,
      SUM(amount) as total_earned
    FROM supporter_transactions 
    WHERE status = 'completed'
    GROUP BY creator_id
  ) earning_stats ON u.id = earning_stats.creator_id
  WHERE 
    u.role = 'creator'
    AND (
      u.display_name ILIKE '%' || search_query || '%'
      OR u.bio ILIKE '%' || search_query || '%'
      OR u.email ILIKE '%' || search_query || '%'
    )
  ORDER BY 
    -- Prioritize exact matches in display_name
    CASE WHEN u.display_name ILIKE search_query THEN 1 ELSE 2 END,
    -- Then by follower count (popularity)
    COALESCE(follower_stats.follower_count, 0) DESC,
    -- Then by creation date (newer first)
    u.created_at DESC
  LIMIT search_limit;
END;
$$;

-- Create get_creator_profile function for detailed creator profiles
CREATE OR REPLACE FUNCTION get_creator_profile(creator_user_id UUID, current_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  email TEXT,
  role TEXT,
  follower_count BIGINT,
  following_count BIGINT,
  posts_count BIGINT,
  total_earned NUMERIC,
  is_following BOOLEAN,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.display_name,
    u.bio,
    u.avatar_url,
    u.email,
    u.role,
    COALESCE(follower_stats.follower_count, 0) as follower_count,
    COALESCE(following_stats.following_count, 0) as following_count,
    COALESCE(post_stats.posts_count, 0) as posts_count,
    COALESCE(earning_stats.total_earned, 0) as total_earned,
    CASE 
      WHEN current_user_id IS NOT NULL THEN 
        EXISTS(SELECT 1 FROM follows WHERE follower_id = current_user_id AND following_id = creator_user_id)
      ELSE FALSE 
    END as is_following,
    u.created_at
  FROM users u
  LEFT JOIN (
    SELECT 
      following_id,
      COUNT(*) as follower_count
    FROM follows 
    GROUP BY following_id
  ) follower_stats ON u.id = follower_stats.following_id
  LEFT JOIN (
    SELECT 
      follower_id,
      COUNT(*) as following_count
    FROM follows 
    GROUP BY follower_id
  ) following_stats ON u.id = following_stats.follower_id
  LEFT JOIN (
    SELECT 
      creator_id,
      COUNT(*) as posts_count
    FROM posts 
    GROUP BY creator_id
  ) post_stats ON u.id = post_stats.creator_id
  LEFT JOIN (
    SELECT 
      creator_id,
      SUM(amount) as total_earned
    FROM supporter_transactions 
    WHERE status = 'completed'
    GROUP BY creator_id
  ) earning_stats ON u.id = earning_stats.creator_id
  WHERE u.id = creator_user_id;
END;
$$;

-- Create get_creator_posts function for creator's posts with engagement data
CREATE OR REPLACE FUNCTION get_creator_posts(creator_user_id UUID, current_user_id UUID DEFAULT NULL, post_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  media_url TEXT,
  creator_id UUID,
  creator_name TEXT,
  creator_avatar TEXT,
  likes_count BIGINT,
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
    p.media_url,
    p.creator_id,
    u.display_name as creator_name,
    u.avatar_url as creator_avatar,
    COALESCE(like_stats.likes_count, 0) as likes_count,
    CASE 
      WHEN current_user_id IS NOT NULL THEN 
        EXISTS(SELECT 1 FROM post_likes WHERE user_id = current_user_id AND post_id = p.id)
      ELSE FALSE 
    END as user_has_liked,
    p.created_at
  FROM posts p
  JOIN users u ON p.creator_id = u.id
  LEFT JOIN (
    SELECT 
      post_id,
      COUNT(*) as likes_count
    FROM post_likes 
    GROUP BY post_id
  ) like_stats ON p.id = like_stats.post_id
  WHERE p.creator_id = creator_user_id
  ORDER BY p.created_at DESC
  LIMIT post_limit;
END;
$$;

-- Create get_discovery_feed function for personalized discovery
CREATE OR REPLACE FUNCTION get_discovery_feed(user_uuid UUID, feed_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  media_url TEXT,
  creator_id UUID,
  creator_name TEXT,
  creator_avatar TEXT,
  likes_count BIGINT,
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
    p.media_url,
    p.creator_id,
    u.display_name as creator_name,
    u.avatar_url as creator_avatar,
    COALESCE(like_stats.likes_count, 0) as likes_count,
    EXISTS(SELECT 1 FROM post_likes WHERE user_id = user_uuid AND post_id = p.id) as user_has_liked,
    p.created_at
  FROM posts p
  JOIN users u ON p.creator_id = u.id
  LEFT JOIN (
    SELECT 
      post_id,
      COUNT(*) as likes_count
    FROM post_likes 
    GROUP BY post_id
  ) like_stats ON p.id = like_stats.post_id
  WHERE 
    -- Show posts from creators the user follows
    (p.creator_id IN (SELECT following_id FROM follows WHERE follower_id = user_uuid))
    OR 
    -- Show popular posts from creators the user doesn't follow
    (p.creator_id NOT IN (SELECT following_id FROM follows WHERE follower_id = user_uuid)
     AND COALESCE(like_stats.likes_count, 0) > 0)
  ORDER BY 
    -- Prioritize posts from followed creators
    CASE WHEN p.creator_id IN (SELECT following_id FROM follows WHERE follower_id = user_uuid) THEN 1 ELSE 2 END,
    -- Then by popularity (likes)
    COALESCE(like_stats.likes_count, 0) DESC,
    -- Then by recency
    p.created_at DESC
  LIMIT feed_limit;
END;
$$; 
CREATE OR REPLACE FUNCTION search_creators(search_query TEXT, search_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  follower_count BIGINT,
  following_count BIGINT,
  posts_count BIGINT,
  total_earned NUMERIC,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.display_name,
    u.bio,
    u.avatar_url,
    COALESCE(follower_stats.follower_count, 0) as follower_count,
    COALESCE(following_stats.following_count, 0) as following_count,
    COALESCE(post_stats.posts_count, 0) as posts_count,
    COALESCE(earning_stats.total_earned, 0) as total_earned,
    u.created_at
  FROM users u
  LEFT JOIN (
    SELECT 
      following_id,
      COUNT(*) as follower_count
    FROM follows 
    GROUP BY following_id
  ) follower_stats ON u.id = follower_stats.following_id
  LEFT JOIN (
    SELECT 
      follower_id,
      COUNT(*) as following_count
    FROM follows 
    GROUP BY follower_id
  ) following_stats ON u.id = following_stats.follower_id
  LEFT JOIN (
    SELECT 
      creator_id,
      COUNT(*) as posts_count
    FROM posts 
    GROUP BY creator_id
  ) post_stats ON u.id = post_stats.creator_id
  LEFT JOIN (
    SELECT 
      creator_id,
      SUM(amount) as total_earned
    FROM supporter_transactions 
    WHERE status = 'completed'
    GROUP BY creator_id
  ) earning_stats ON u.id = earning_stats.creator_id
  WHERE 
    u.role = 'creator'
    AND (
      u.display_name ILIKE '%' || search_query || '%'
      OR u.bio ILIKE '%' || search_query || '%'
      OR u.email ILIKE '%' || search_query || '%'
    )
  ORDER BY 
    -- Prioritize exact matches in display_name
    CASE WHEN u.display_name ILIKE search_query THEN 1 ELSE 2 END,
    -- Then by follower count (popularity)
    COALESCE(follower_stats.follower_count, 0) DESC,
    -- Then by creation date (newer first)
    u.created_at DESC
  LIMIT search_limit;
END;
$$;

-- Create get_creator_profile function for detailed creator profiles
CREATE OR REPLACE FUNCTION get_creator_profile(creator_user_id UUID, current_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  email TEXT,
  role TEXT,
  follower_count BIGINT,
  following_count BIGINT,
  posts_count BIGINT,
  total_earned NUMERIC,
  is_following BOOLEAN,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.display_name,
    u.bio,
    u.avatar_url,
    u.email,
    u.role,
    COALESCE(follower_stats.follower_count, 0) as follower_count,
    COALESCE(following_stats.following_count, 0) as following_count,
    COALESCE(post_stats.posts_count, 0) as posts_count,
    COALESCE(earning_stats.total_earned, 0) as total_earned,
    CASE 
      WHEN current_user_id IS NOT NULL THEN 
        EXISTS(SELECT 1 FROM follows WHERE follower_id = current_user_id AND following_id = creator_user_id)
      ELSE FALSE 
    END as is_following,
    u.created_at
  FROM users u
  LEFT JOIN (
    SELECT 
      following_id,
      COUNT(*) as follower_count
    FROM follows 
    GROUP BY following_id
  ) follower_stats ON u.id = follower_stats.following_id
  LEFT JOIN (
    SELECT 
      follower_id,
      COUNT(*) as following_count
    FROM follows 
    GROUP BY follower_id
  ) following_stats ON u.id = following_stats.follower_id
  LEFT JOIN (
    SELECT 
      creator_id,
      COUNT(*) as posts_count
    FROM posts 
    GROUP BY creator_id
  ) post_stats ON u.id = post_stats.creator_id
  LEFT JOIN (
    SELECT 
      creator_id,
      SUM(amount) as total_earned
    FROM supporter_transactions 
    WHERE status = 'completed'
    GROUP BY creator_id
  ) earning_stats ON u.id = earning_stats.creator_id
  WHERE u.id = creator_user_id;
END;
$$;

-- Create get_creator_posts function for creator's posts with engagement data
CREATE OR REPLACE FUNCTION get_creator_posts(creator_user_id UUID, current_user_id UUID DEFAULT NULL, post_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  media_url TEXT,
  creator_id UUID,
  creator_name TEXT,
  creator_avatar TEXT,
  likes_count BIGINT,
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
    p.media_url,
    p.creator_id,
    u.display_name as creator_name,
    u.avatar_url as creator_avatar,
    COALESCE(like_stats.likes_count, 0) as likes_count,
    CASE 
      WHEN current_user_id IS NOT NULL THEN 
        EXISTS(SELECT 1 FROM post_likes WHERE user_id = current_user_id AND post_id = p.id)
      ELSE FALSE 
    END as user_has_liked,
    p.created_at
  FROM posts p
  JOIN users u ON p.creator_id = u.id
  LEFT JOIN (
    SELECT 
      post_id,
      COUNT(*) as likes_count
    FROM post_likes 
    GROUP BY post_id
  ) like_stats ON p.id = like_stats.post_id
  WHERE p.creator_id = creator_user_id
  ORDER BY p.created_at DESC
  LIMIT post_limit;
END;
$$;

-- Create get_discovery_feed function for personalized discovery
CREATE OR REPLACE FUNCTION get_discovery_feed(user_uuid UUID, feed_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  media_url TEXT,
  creator_id UUID,
  creator_name TEXT,
  creator_avatar TEXT,
  likes_count BIGINT,
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
    p.media_url,
    p.creator_id,
    u.display_name as creator_name,
    u.avatar_url as creator_avatar,
    COALESCE(like_stats.likes_count, 0) as likes_count,
    EXISTS(SELECT 1 FROM post_likes WHERE user_id = user_uuid AND post_id = p.id) as user_has_liked,
    p.created_at
  FROM posts p
  JOIN users u ON p.creator_id = u.id
  LEFT JOIN (
    SELECT 
      post_id,
      COUNT(*) as likes_count
    FROM post_likes 
    GROUP BY post_id
  ) like_stats ON p.id = like_stats.post_id
  WHERE 
    -- Show posts from creators the user follows
    (p.creator_id IN (SELECT following_id FROM follows WHERE follower_id = user_uuid))
    OR 
    -- Show popular posts from creators the user doesn't follow
    (p.creator_id NOT IN (SELECT following_id FROM follows WHERE follower_id = user_uuid)
     AND COALESCE(like_stats.likes_count, 0) > 0)
  ORDER BY 
    -- Prioritize posts from followed creators
    CASE WHEN p.creator_id IN (SELECT following_id FROM follows WHERE follower_id = user_uuid) THEN 1 ELSE 2 END,
    -- Then by popularity (likes)
    COALESCE(like_stats.likes_count, 0) DESC,
    -- Then by recency
    p.created_at DESC
  LIMIT feed_limit;
END;
$$; 