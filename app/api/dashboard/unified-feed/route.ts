import { NextResponse, NextRequest } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
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

    const postSelect = `
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
    `;
    const postOrder = { ascending: false };
    const limitSupporter = 50;
    const limitOther = 50;

    let supporterPostsRaw: any[] = [];
    let otherPostsRaw: any[] = [];

    if (user && supportedCreatorIds.length > 0) {
      // User supports some creators: fetch supporter posts (from supported creators, any visibility)
      const { data: supporterData } = await supabase
        .from('posts')
        .select(postSelect)
        .in('creator_id', supportedCreatorIds)
        .order('created_at', postOrder)
        .limit(limitSupporter);

      supporterPostsRaw = supporterData || [];

      // Other posts: from non-supported creators (public + supporters-only, for "Explore other")
      const { data: otherData } = await supabase
        .from('posts')
        .select(postSelect)
        .neq('creator_id', user.id)
        .not('creator_id', 'in', `(${supportedCreatorIds.join(',')})`)
        .order('created_at', postOrder)
        .limit(limitOther);

      otherPostsRaw = otherData || [];
    } else {
      // No supports (or not logged in): all public posts + very few supporters-only (1–3) for discovery
      // New users see every public post and a small highlight of supporters-only posts (blurred, with badge)
      const SUPPORTERS_ONLY_SPRINKLE = 3;
      let publicQuery = supabase
        .from('posts')
        .select(postSelect)
        .eq('is_public', true)
        .order('created_at', postOrder)
        .limit(limitOther);
      if (user) publicQuery = publicQuery.neq('creator_id', user.id);
      const { data: publicData } = await publicQuery;

      // Supporters-only: use admin client so we always get rows (no RLS/auth edge cases). Fallback to regular client if no service role.
      let supportersOnlyData: any[] | null = null;
      try {
        const adminSupabase = createAdminClient();
        let supportersOnlyQuery = adminSupabase
          .from('posts')
          .select(postSelect)
          .eq('is_public', false)
          .order('created_at', postOrder)
          .limit(SUPPORTERS_ONLY_SPRINKLE);
        if (user) supportersOnlyQuery = supportersOnlyQuery.neq('creator_id', user.id);
        const result = await supportersOnlyQuery;
        supportersOnlyData = result.data;
      } catch {
        let supportersOnlyQuery = supabase
          .from('posts')
          .select(postSelect)
          .eq('is_public', false)
          .order('created_at', postOrder)
          .limit(SUPPORTERS_ONLY_SPRINKLE);
        if (user) supportersOnlyQuery = supportersOnlyQuery.neq('creator_id', user.id);
        const result = await supportersOnlyQuery;
        supportersOnlyData = result.data;
      }

      const publicIds = new Set((publicData || []).map((p: any) => p.id));
      const sprinkle = (supportersOnlyData || []).filter((p: any) => !publicIds.has(p.id));
      const combined = [...(publicData || []), ...sprinkle].sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      // Keep full combined list so the 1–3 supporters-only posts are never dropped by slice
      otherPostsRaw = combined;
    }

    const allPosts = [...supporterPostsRaw, ...otherPostsRaw];
    if (allPosts.length === 0) {
      return NextResponse.json({
        creators: formattedCreators,
        supporter_posts: [],
        other_posts: []
      });
    }

    const creatorIds = [...new Set(allPosts.map((p: any) => p.creator_id))];

    const { data: creators, error: usersError } = await supabase
      .from('users')
      .select('id, display_name, photo_url')
      .in('id', creatorIds);

    if (usersError) console.error('Error fetching users:', usersError);

    const { data: creatorProfiles, error: profilesError } = await supabase
      .from('creator_profiles')
      .select('user_id, category, is_verified')
      .in('user_id', creatorIds);

    if (profilesError) console.error('Error fetching creator profiles:', profilesError);

    const creatorsMap = new Map((creators || []).map((c: any) => [c.id, c]));
    const profilesMap = new Map((creatorProfiles || []).map((cp: any) => [cp.user_id, cp]));

    let userLikedPostIds = new Set<string>();
    if (user) {
      const postIds = allPosts.map((p: any) => p.id);
      const { data: userLikes } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);
      userLikedPostIds = new Set((userLikes || []).map((l: any) => l.post_id));
    }

    const formatPost = (p: any, isSupporter: boolean) => {
      const creator = creatorsMap.get(p.creator_id);
      const profile = profilesMap.get(p.creator_id);
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
        poll: Array.isArray(p.polls) ? (p.polls[0] || null) : (p.polls || null),
        likes_count: p.likes_count || 0,
        comments_count: p.comments_count || 0,
        is_liked: user ? userLikedPostIds.has(p.id) : false,
        is_supporter: isSupporter,
        engagement_score: calculatePostScore(p)
      };
    };

    const formattedSupporterPosts = supporterPostsRaw
      .map((p) => formatPost(p, true))
      .sort((a, b) => b.engagement_score - a.engagement_score);

    // When user has no supports: show 1–3 supporters-only posts in feed with full content (is_supporter: true) so they can preview. When user has supports: other_posts are blurred (is_supporter: false).
    const isSupportersOnlyPost = (p: any) =>
      p.is_public === false || (p.tier_required && p.tier_required !== 'free');
    const formattedOtherPosts = otherPostsRaw
      .map((p) => {
        const showFullContent =
          supportedCreatorIds.length === 0 && isSupportersOnlyPost(p);
        return formatPost(p, showFullContent);
      })
      .sort((a, b) => b.engagement_score - a.engagement_score);

    return NextResponse.json({
      creators: formattedCreators,
      supporter_posts: formattedSupporterPosts,
      other_posts: formattedOtherPosts
    });
  } catch (error) {
    return handleApiError(error, 'UNIFIED_FEED_API', 'Failed to fetch unified feed');
  }
}
