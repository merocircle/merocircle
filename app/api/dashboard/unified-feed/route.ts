import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOptionalUser, parsePaginationParams, handleApiError } from '@/lib/api-utils';

// Balanced feed ranking formula
function calculatePostScore(post: any): number {
  const now = Date.now();
  const postTime = new Date(post.created_at).getTime();
  const ageInHours = (now - postTime) / (1000 * 60 * 60);

  // Time decay: posts lose 10% value per day
  const timeFactor = Math.exp(-ageInHours / 240); // 240 hours = 10 days

  // Engagement score (using denormalized counts)
  const likesCount = post.likes_count || 0;
  const commentsCount = post.comments_count || 0;
  const engagementScore = likesCount + (commentsCount * 2); // Comments weighted 2x

  // Balanced formula: combine time decay with engagement
  return (engagementScore * timeFactor) + (timeFactor * 10);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getOptionalUser();
    const supabase = await createClient();

    // Pagination support
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, offset } = parsePaginationParams(searchParams);

    // Get trending creators
    let trendingCreatorsQuery = supabase
      .from('creator_profiles')
      .select(`
        user_id,
        bio,
        category,
        is_verified,
        supporters_count,
        posts_count,
        users!inner(id, display_name, photo_url)
      `)
      .order('supporters_count', { ascending: false })
      .limit(12);

    if (user) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userProfile?.role === 'creator') {
        trendingCreatorsQuery = trendingCreatorsQuery.neq('user_id', user.id);
      }
    }

    const { data: trendingCreators, error: creatorsError } = await trendingCreatorsQuery;

    if (creatorsError) {
      console.error('Error fetching creators:', creatorsError);
    }

    const formattedCreators = (trendingCreators || []).map((cp: any) => ({
      user_id: cp.user_id,
      display_name: cp.users?.display_name || 'Creator',
      bio: cp.bio,
      avatar_url: cp.users?.photo_url,
      category: cp.category,
      is_verified: cp.is_verified,
      supporter_count: cp.supporters_count || 0,
      posts_count: cp.posts_count || 0,
      creator_profile: {
        category: cp.category,
        is_verified: cp.is_verified
      }
    }));

    // Get supporter relationships if user is authenticated
    let supportedCreatorIds: string[] = [];
    if (user) {
      const { data: supporterData } = await supabase
        .from('supporters')
        .select('creator_id')
        .eq('supporter_id', user.id)
        .eq('is_active', true);

      supportedCreatorIds = (supporterData || []).map((s: any) => s.creator_id);
    }

    // Build posts query - simplified without nested joins
    let allPostsQuery = supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        image_url,
        image_urls,
        is_public,
        tier_required,
        post_type,
        created_at,
        updated_at,
        creator_id,
        likes_count,
        comments_count,
        polls(id, question, allows_multiple_answers, expires_at)
      `)
      .order('created_at', { ascending: false });

    // Exclude current user's own posts if authenticated
    if (user) {
      allPostsQuery = allPostsQuery.neq('creator_id', user.id);
    }

    // Apply visibility filter
    if (user && supportedCreatorIds.length > 0) {
      allPostsQuery = allPostsQuery.or(
        `is_public.eq.true,creator_id.in.(${supportedCreatorIds.join(',')})`
      );
    } else {
      allPostsQuery = allPostsQuery.eq('is_public', true);
    }

    // Apply pagination
    const { data: allPosts, error: postsError } = await allPostsQuery.range(offset, offset + limit - 1);

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return NextResponse.json({
        error: 'Failed to fetch posts',
        details: postsError.message
      }, { status: 500 });
    }

    console.log(`Fetched ${allPosts?.length || 0} posts`);

    // If no posts, return early
    if (!allPosts || allPosts.length === 0) {
      return NextResponse.json({
        creators: formattedCreators,
        posts: []
      });
    }

    // Get unique creator IDs from posts
    const creatorIds = [...new Set(allPosts.map((p: any) => p.creator_id))];

    // Fetch user info for all creators in one query
    const { data: creators, error: usersError } = await supabase
      .from('users')
      .select('id, display_name, photo_url')
      .in('id', creatorIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
    }

    // Fetch creator profiles for all creators
    const { data: creatorProfiles, error: profilesError } = await supabase
      .from('creator_profiles')
      .select('user_id, category, is_verified')
      .in('user_id', creatorIds);

    if (profilesError) {
      console.error('Error fetching creator profiles:', profilesError);
    }

    // Create lookup maps
    const creatorsMap = new Map((creators || []).map((c: any) => [c.id, c]));
    const profilesMap = new Map((creatorProfiles || []).map((cp: any) => [cp.user_id, cp]));

    // Format posts
    const formattedPosts = allPosts.map((p: any) => {
      const creator = creatorsMap.get(p.creator_id);
      const profile = profilesMap.get(p.creator_id);
      const isSupporter = user ? supportedCreatorIds.includes(p.creator_id) : false;

      return {
        id: p.id,
        title: p.title,
        content: p.content,
        image_url: p.image_url,
        image_urls: p.image_urls || [],
        is_public: p.is_public,
        tier_required: p.tier_required || 'free',
        post_type: p.post_type || 'post',
        created_at: p.created_at,
        updated_at: p.updated_at,
        creator_id: p.creator_id,
        creator: {
          id: creator?.id || p.creator_id,
          display_name: creator?.display_name || 'Creator',
          photo_url: creator?.photo_url || null,
          role: 'creator'
        },
        creator_profile: {
          category: profile?.category || null,
          is_verified: profile?.is_verified || false
        },
        poll: p.polls || null,
        likes_count: p.likes_count || 0,
        comments_count: p.comments_count || 0,
        is_supporter: isSupporter,
        engagement_score: 0
      };
    });

    // Calculate scores and sort
    const rankedPosts = formattedPosts
      .map(post => ({
        ...post,
        engagement_score: calculatePostScore(post)
      }))
      .sort((a, b) => b.engagement_score - a.engagement_score);

    return NextResponse.json({
      creators: formattedCreators,
      posts: rankedPosts
    });
  } catch (error) {
    return handleApiError(error, 'UNIFIED_FEED_API', 'Failed to fetch unified feed');
  }
}
