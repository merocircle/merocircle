-- Delete user from all tables and auth
-- User ID: f73735c9-b345-46b7-b8c5-04214d8bdc6d
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  user_uuid UUID := 'f73735c9-b345-46b7-b8c5-04214d8bdc6d';
BEGIN
  -- Delete from all public tables (in order to respect foreign keys)
  -- Most have ON DELETE CASCADE, but we'll be explicit
  
  -- Delete channel messages (only if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'channel_messages') THEN
    DELETE FROM public.channel_messages WHERE user_id = user_uuid;
  END IF;
  
  -- Delete channel members (only if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'channel_members') THEN
    DELETE FROM public.channel_members WHERE user_id = user_uuid;
  END IF;
  
  -- Delete channels created by this user (only if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'channels') THEN
    DELETE FROM public.channels WHERE creator_id = user_uuid;
  END IF;
  
  -- Delete notifications (only if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    DELETE FROM public.notifications WHERE user_id = user_uuid;
  END IF;
  
  -- Delete subscription tiers (only if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscription_tiers') THEN
    DELETE FROM public.subscription_tiers WHERE creator_id = user_uuid;
  END IF;
  
  -- Delete supporter transactions
  DELETE FROM public.supporter_transactions WHERE supporter_id = user_uuid OR creator_id = user_uuid;
  
  -- Delete transactions (only if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
    DELETE FROM public.transactions WHERE supporter_id = user_uuid OR creator_id = user_uuid;
  END IF;
  
  -- Delete supporters (both as supporter and as creator)
  DELETE FROM public.supporters WHERE supporter_id = user_uuid OR creator_id = user_uuid;
  
  -- Delete creator payment methods
  DELETE FROM public.creator_payment_methods WHERE creator_id = user_uuid;
  
  -- Delete post likes (for posts created by this user)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'post_likes') THEN
    DELETE FROM public.post_likes 
    WHERE post_id IN (SELECT id FROM public.posts WHERE creator_id = user_uuid);
  END IF;
  
  -- Delete post comments (for posts created by this user)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'post_comments') THEN
    DELETE FROM public.post_comments 
    WHERE post_id IN (SELECT id FROM public.posts WHERE creator_id = user_uuid);
  END IF;
  
  -- Delete posts
  DELETE FROM public.posts WHERE creator_id = user_uuid;
  
  -- Delete creator profile
  DELETE FROM public.creator_profiles WHERE user_id = user_uuid;
  
  -- Delete from public.users (this will cascade to most tables)
  DELETE FROM public.users WHERE id = user_uuid;
  
  -- Finally, delete from auth.users (this is the main auth table)
  DELETE FROM auth.users WHERE id = user_uuid;
  
  RAISE NOTICE 'User % has been deleted from all tables and auth', user_uuid;
END $$;

-- Verify deletion (should return 0 rows)
SELECT 
  'auth.users' as table_name, 
  COUNT(*) as remaining_records 
FROM auth.users 
WHERE id = 'f73735c9-b345-46b7-b8c5-04214d8bdc6d'
UNION ALL
SELECT 
  'public.users' as table_name, 
  COUNT(*) as remaining_records 
FROM public.users 
WHERE id = 'f73735c9-b345-46b7-b8c5-04214d8bdc6d'
UNION ALL
SELECT 
  'public.creator_profiles' as table_name, 
  COUNT(*) as remaining_records 
FROM public.creator_profiles 
WHERE user_id = 'f73735c9-b345-46b7-b8c5-04214d8bdc6d'
UNION ALL
SELECT 
  'public.posts' as table_name, 
  COUNT(*) as remaining_records 
FROM public.posts 
WHERE creator_id = 'f73735c9-b345-46b7-b8c5-04214d8bdc6d'
UNION ALL
SELECT 
  'public.post_likes' as table_name, 
  COUNT(*) as remaining_records 
FROM public.post_likes 
WHERE post_id IN (SELECT id FROM public.posts WHERE creator_id = 'f73735c9-b345-46b7-b8c5-04214d8bdc6d')
UNION ALL
SELECT 
  'public.post_comments' as table_name, 
  COUNT(*) as remaining_records 
FROM public.post_comments 
WHERE post_id IN (SELECT id FROM public.posts WHERE creator_id = 'f73735c9-b345-46b7-b8c5-04214d8bdc6d')
UNION ALL
SELECT 
  'public.supporters' as table_name, 
  COUNT(*) as remaining_records 
FROM public.supporters 
WHERE supporter_id = 'f73735c9-b345-46b7-b8c5-04214d8bdc6d' 
   OR creator_id = 'f73735c9-b345-46b7-b8c5-04214d8bdc6d'
UNION ALL
SELECT 
  'public.supporter_transactions' as table_name, 
  COUNT(*) as remaining_records 
FROM public.supporter_transactions 
WHERE supporter_id = 'f73735c9-b345-46b7-b8c5-04214d8bdc6d' 
   OR creator_id = 'f73735c9-b345-46b7-b8c5-04214d8bdc6d'
UNION ALL
SELECT 
  'public.subscription_tiers' as table_name, 
  COUNT(*) as remaining_records 
FROM public.subscription_tiers 
WHERE creator_id = 'f73735c9-b345-46b7-b8c5-04214d8bdc6d'
UNION ALL
SELECT 
  'public.creator_payment_methods' as table_name, 
  COUNT(*) as remaining_records 
FROM public.creator_payment_methods 
WHERE creator_id = 'f73735c9-b345-46b7-b8c5-04214d8bdc6d'
UNION ALL
SELECT 
  'public.channel_messages' as table_name, 
  COUNT(*) as remaining_records 
FROM public.channel_messages 
WHERE user_id = 'f73735c9-b345-46b7-b8c5-04214d8bdc6d'
UNION ALL
SELECT 
  'public.channels' as table_name, 
  COUNT(*) as remaining_records 
FROM public.channels 
WHERE creator_id = 'f73735c9-b345-46b7-b8c5-04214d8bdc6d'
UNION ALL
SELECT 
  'public.notifications' as table_name, 
  COUNT(*) as remaining_records 
FROM public.notifications 
WHERE user_id = 'f73735c9-b345-46b7-b8c5-04214d8bdc6d';
