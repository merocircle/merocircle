-- CreatorsNepal Social Features Migration
-- Add social discovery features to the existing database

-- 1. Add follows table (Instagram-like follow system)
CREATE TABLE public.follows (
  id uuid default uuid_generate_v4() primary key,
  follower_id uuid references public.users(id) on delete cascade not null,
  following_id uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(follower_id, following_id)
);

-- 2. Add post_likes table (engagement system)
CREATE TABLE public.post_likes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, post_id)
);

-- 3. Add post_comments table (engagement system)
CREATE TABLE public.post_comments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  content text not null,
  parent_comment_id uuid references public.post_comments(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Add creator tags table (for categorization and search)
CREATE TABLE public.creator_tags (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references public.users(id) on delete cascade not null,
  tag text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(creator_id, tag)
);

-- 5. Add user activity table (for feed generation)
CREATE TABLE public.user_activities (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  activity_type text not null check (activity_type in ('post_created', 'post_liked', 'comment_added', 'user_followed', 'support_given')),
  target_id uuid not null, -- can reference posts, users, etc.
  target_type text not null check (target_type in ('post', 'user', 'comment', 'transaction')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for performance
CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX idx_follows_following_id ON public.follows(following_id);
CREATE INDEX idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON public.post_likes(user_id);
CREATE INDEX idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX idx_post_comments_user_id ON public.post_comments(user_id);
CREATE INDEX idx_creator_tags_tag ON public.creator_tags(tag);
CREATE INDEX idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX idx_user_activities_created_at ON public.user_activities(created_at);
CREATE INDEX idx_user_activities_activity_type ON public.user_activities(activity_type);

-- Add full-text search indexes for discovery
CREATE INDEX idx_users_display_name_search ON public.users USING gin(to_tsvector('english', display_name));
CREATE INDEX idx_creator_profiles_bio_search ON public.creator_profiles USING gin(to_tsvector('english', bio));
CREATE INDEX idx_posts_title_content_search ON public.posts USING gin(to_tsvector('english', title || ' ' || content));

-- Update creator_profiles to include follower counts
ALTER TABLE public.creator_profiles 
ADD COLUMN followers_count integer default 0,
ADD COLUMN posts_count integer default 0,
ADD COLUMN likes_count integer default 0;

-- Enable RLS for new tables
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for follows
CREATE POLICY "Anyone can view follows" ON public.follows
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own follows" ON public.follows
  FOR ALL USING (auth.uid() = follower_id);

-- RLS Policies for post_likes
CREATE POLICY "Anyone can view post likes" ON public.post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own likes" ON public.post_likes
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for post_comments
CREATE POLICY "Anyone can view comments" ON public.post_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own comments" ON public.post_comments
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for creator_tags
CREATE POLICY "Anyone can view creator tags" ON public.creator_tags
  FOR SELECT USING (true);

CREATE POLICY "Creators can manage own tags" ON public.creator_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.id = creator_tags.creator_id
    )
  );

-- RLS Policies for user_activities
CREATE POLICY "Users can view their own activities" ON public.user_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own activities" ON public.user_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add triggers for automatic counter updates
CREATE OR REPLACE FUNCTION update_creator_followers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.creator_profiles 
    SET followers_count = followers_count + 1
    WHERE user_id = NEW.following_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.creator_profiles 
    SET followers_count = followers_count - 1
    WHERE user_id = OLD.following_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_followers_count_trigger
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION update_creator_followers_count();

-- Function to get discovery feed for a user
CREATE OR REPLACE FUNCTION get_discovery_feed(user_uuid UUID, feed_limit INT DEFAULT 20)
RETURNS TABLE (
  post_id UUID,
  creator_id UUID,
  creator_name TEXT,
  creator_photo_url TEXT,
  creator_verified BOOLEAN,
  post_title TEXT,
  post_content TEXT,
  post_image_url TEXT,
  post_created_at TIMESTAMP WITH TIME ZONE,
  likes_count BIGINT,
  comments_count BIGINT,
  user_has_liked BOOLEAN,
  user_follows_creator BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as post_id,
    p.creator_id,
    u.display_name as creator_name,
    u.photo_url as creator_photo_url,
    COALESCE(cp.is_verified, false) as creator_verified,
    p.title as post_title,
    p.content as post_content,
    p.image_url as post_image_url,
    p.created_at as post_created_at,
    COALESCE(likes.likes_count, 0) as likes_count,
    COALESCE(comments.comments_count, 0) as comments_count,
    COALESCE(user_likes.user_has_liked, false) as user_has_liked,
    COALESCE(user_follows.user_follows_creator, false) as user_follows_creator
  FROM public.posts p
  JOIN public.users u ON p.creator_id = u.id
  LEFT JOIN public.creator_profiles cp ON u.id = cp.user_id
  LEFT JOIN (
    SELECT post_id, COUNT(*) as likes_count
    FROM public.post_likes
    GROUP BY post_id
  ) likes ON p.id = likes.post_id
  LEFT JOIN (
    SELECT post_id, COUNT(*) as comments_count
    FROM public.post_comments
    GROUP BY post_id
  ) comments ON p.id = comments.post_id
  LEFT JOIN (
    SELECT post_id, true as user_has_liked
    FROM public.post_likes
    WHERE user_id = user_uuid
  ) user_likes ON p.id = user_likes.post_id
  LEFT JOIN (
    SELECT following_id, true as user_follows_creator
    FROM public.follows
    WHERE follower_id = user_uuid
  ) user_follows ON p.creator_id = user_follows.following_id
  WHERE p.is_public = true
  ORDER BY 
    -- Prioritize followed creators
    CASE WHEN user_follows.user_follows_creator THEN 1 ELSE 2 END,
    -- Then by engagement (likes + comments)
    (COALESCE(likes.likes_count, 0) + COALESCE(comments.comments_count, 0)) DESC,
    -- Then by recency
    p.created_at DESC
  LIMIT feed_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to search creators
CREATE OR REPLACE FUNCTION search_creators(search_query TEXT, search_limit INT DEFAULT 20)
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
) AS $$
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
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.follows TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_likes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_comments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_tags TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_activities TO authenticated;
GRANT EXECUTE ON FUNCTION get_discovery_feed(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_creators(TEXT, INT) TO authenticated; 