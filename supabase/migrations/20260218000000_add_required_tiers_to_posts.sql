-- Add required_tiers column to posts table for multi-tier visibility support
-- This allows posts to be visible to multiple tier levels (e.g., tier 1 AND tier 2)

-- Add required_tiers column as TEXT array
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS required_tiers TEXT[] DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.posts.required_tiers IS 'Array of tier levels (1, 2, 3) that can access this post. NULL or empty means public. If is_public=false and required_tiers is NULL, defaults to all supporters (tier 1+).';

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_posts_required_tiers ON public.posts USING GIN (required_tiers);

-- Migrate existing data: if is_public=false and tier_required is not 'free', 
-- set required_tiers to the tier_required value
UPDATE public.posts
SET required_tiers = ARRAY[tier_required]::TEXT[]
WHERE is_public = false 
  AND tier_required IS NOT NULL 
  AND tier_required != 'free'
  AND (required_tiers IS NULL OR array_length(required_tiers, 1) IS NULL);

-- For posts with is_public=false but tier_required='free' or NULL,
-- set required_tiers to ['1'] (one-star tier / supporters only)
UPDATE public.posts
SET required_tiers = ARRAY['1']::TEXT[]
WHERE is_public = false 
  AND (tier_required IS NULL OR tier_required = 'free')
  AND (required_tiers IS NULL OR array_length(required_tiers, 1) IS NULL);
