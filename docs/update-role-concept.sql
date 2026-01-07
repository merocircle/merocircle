-- Optional Database Updates for New Role Concept
-- This migration makes the role field less restrictive
-- Since everyone can now access both supporter and creator features,
-- the role field is mainly for tracking/display purposes

-- Note: These changes are OPTIONAL - the current schema works fine
-- The role field will still default to 'user' but won't restrict access

-- 1. Update the search function to not filter by role
--    (since creator_profiles table is what matters)
CREATE OR REPLACE FUNCTION search_creators(search_query TEXT, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
    id UUID,
    display_name TEXT,
    photo_url TEXT,
    bio TEXT,
    category TEXT,
    is_verified BOOLEAN,
    followers_count INTEGER,
    posts_count INTEGER,
    total_earnings NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
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
    -- Removed: WHERE u.role = 'creator'
    -- Now: Anyone with a creator_profile can be found
    WHERE (
        to_tsvector('english', u.display_name) @@ plainto_tsquery('english', search_query)
        OR to_tsvector('english', COALESCE(cp.bio, '')) @@ plainto_tsquery('english', search_query)
        OR to_tsvector('english', COALESCE(cp.category, '')) @@ plainto_tsquery('english', search_query)
    )
    ORDER BY cp.followers_count DESC, cp.total_earnings DESC
    LIMIT limit_count;
END;
$$;

-- 2. Optional: Make role field nullable (not required, but more flexible)
--    This allows the role to be optional if you want
-- ALTER TABLE public.users ALTER COLUMN role DROP NOT NULL;

-- 3. Optional: Remove the check constraint to allow more flexibility
--    (Currently only allows 'user' or 'creator')
--    This is NOT recommended if you want to keep data integrity
-- ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Summary:
-- - The current schema works fine without changes
-- - The role field defaults to 'user' which is correct
-- - RLS policies don't depend on the role field
-- - The creator_profiles table is what indicates creator features
-- - Only the search function needed updating (which we did above)

-- What stays the same:
-- - All RLS policies work correctly (they check auth.uid(), not role)
-- - creator_profiles table is what matters for creator features
-- - Posts, supporters, transactions all work the same way
-- - The role field can still be used for display/tracking purposes

