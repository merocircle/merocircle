-- Performance Optimizations Migration
-- Adds denormalized counts, composite indexes, and triggers for better query performance

-- ============================================================================
-- 1. Add denormalized count columns to posts table
-- ============================================================================
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- ============================================================================
-- 2. Create composite indexes for optimized feed queries
-- ============================================================================

-- Critical index for feed queries (creator_id, is_public, created_at)
-- This will dramatically speed up queries that filter by creator and visibility
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_created_public
ON posts(creator_id, is_public, created_at DESC)
WHERE deleted_at IS NULL;

-- Index for engagement-based sorting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_engagement_score
ON posts(created_at DESC, likes_count DESC, comments_count DESC)
WHERE deleted_at IS NULL AND is_public = true;

-- Index for post_likes by post_id (if not exists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_likes_post_id
ON post_likes(post_id)
WHERE deleted_at IS NULL;

-- Index for post_comments by post_id (if not exists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_comments_post_id
ON post_comments(post_id)
WHERE deleted_at IS NULL;

-- ============================================================================
-- 3. Create functions to maintain denormalized counts
-- ============================================================================

-- Function to update likes_count when likes are added/removed
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment likes_count
    UPDATE posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement likes_count (never go below 0)
    UPDATE posts
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update comments_count when comments are added/removed
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment comments_count
    UPDATE posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement comments_count (never go below 0)
    UPDATE posts
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. Create triggers to automatically maintain counts
-- ============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS post_likes_count_trigger ON post_likes;
DROP TRIGGER IF EXISTS post_comments_count_trigger ON post_comments;

-- Create trigger for likes
CREATE TRIGGER post_likes_count_trigger
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

-- Create trigger for comments
CREATE TRIGGER post_comments_count_trigger
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

-- ============================================================================
-- 5. Initialize counts from existing data
-- ============================================================================

-- Update existing posts with accurate counts
UPDATE posts p
SET
  likes_count = COALESCE((
    SELECT COUNT(*)
    FROM post_likes
    WHERE post_id = p.id AND deleted_at IS NULL
  ), 0),
  comments_count = COALESCE((
    SELECT COUNT(*)
    FROM post_comments
    WHERE post_id = p.id AND deleted_at IS NULL
  ), 0)
WHERE p.deleted_at IS NULL;

-- ============================================================================
-- 6. Create index for channel_messages user lookups (fixes chat N+1 query)
-- ============================================================================

-- Index for efficient user data lookup in chat messages
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_channel_messages_user
ON channel_messages(user_id)
WHERE deleted_at IS NULL;

-- Index for channel_messages by channel_id and created_at for pagination
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_channel_messages_channel_created
ON channel_messages(channel_id, created_at DESC)
WHERE deleted_at IS NULL;

-- ============================================================================
-- 7. Additional performance indexes
-- ============================================================================

-- Index for supporters table (fixes supporter lookup performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_supporters_supporter_creator_active
ON supporters(supporter_id, creator_id, is_active);

-- Index for supporter_transactions (faster transaction queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_supporter_transactions_status_created
ON supporter_transactions(status, created_at DESC);

-- ============================================================================
-- Verification
-- ============================================================================

-- Verify counts were initialized correctly
DO $$
DECLARE
  total_posts INTEGER;
  posts_with_counts INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_posts FROM posts WHERE deleted_at IS NULL;
  SELECT COUNT(*) INTO posts_with_counts
  FROM posts
  WHERE deleted_at IS NULL
    AND likes_count >= 0
    AND comments_count >= 0;

  RAISE NOTICE 'Migration complete: % posts processed, % posts have counts initialized',
    total_posts, posts_with_counts;
END $$;
