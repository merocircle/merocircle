import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOptionalUser, parsePaginationParams, handleApiError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const user = await getOptionalUser();
    const supabase = await createClient();

    const searchParams = request.nextUrl.searchParams;
    const { page, limit, offset } = parsePaginationParams(searchParams);

    // ── Get supported creator IDs ──
    let supportedCreatorIds: string[] = [];
    if (user) {
      const { data: supporterData } = await supabase
        .from('supporters')
        .select('creator_id')
        .eq('supporter_id', user.id)
        .eq('is_active', true);

      supportedCreatorIds = (supporterData || []).map((s: any) => s.creator_id);
    }

    // ── Fetch creators for the circles strip ──
    // If user follows creators, show those. Otherwise show trending.
    let formattedCreators: any[] = [];

    if (user && supportedCreatorIds.length > 0) {
      // Fetch supported creators
      const { data: supportedCreatorProfiles } = await supabase
        .from('creator_profiles')
        .select(`
          user_id, bio, category, is_verified, supporters_count, posts_count,
          users!inner(id, display_name, photo_url)
        `)
        .in('user_id', supportedCreatorIds);

      formattedCreators = (supportedCreatorProfiles || []).map((cp: any) => ({
        user_id: cp.user_id,
        display_name: cp.users?.display_name || 'Creator',
        bio: cp.bio,
        avatar_url: cp.users?.photo_url,
        category: cp.category,
        is_verified: cp.is_verified,
        supporter_count: cp.supporters_count || 0,
        posts_count: cp.posts_count || 0,
        creator_profile: { category: cp.category, is_verified: cp.is_verified },
      }));
    } else {
      // Fallback: show trending creators
      let trendingQuery = supabase
        .from('creator_profiles')
        .select(`
          user_id, bio, category, is_verified, supporters_count, posts_count,
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
          trendingQuery = trendingQuery.neq('user_id', user.id);
        }
      }

      const { data: trendingCreators } = await trendingQuery;

      formattedCreators = (trendingCreators || []).map((cp: any) => ({
        user_id: cp.user_id,
        display_name: cp.users?.display_name || 'Creator',
        bio: cp.bio,
        avatar_url: cp.users?.photo_url,
        category: cp.category,
        is_verified: cp.is_verified,
        supporter_count: cp.supporters_count || 0,
        posts_count: cp.posts_count || 0,
        creator_profile: { category: cp.category, is_verified: cp.is_verified },
      }));
    }

    // ── Fetch posts — only from followed creators, sorted by recency ──
    let postsQuery = supabase
      .from('posts')
      .select(`
        id, title, content, image_url, image_urls, is_public,
        tier_required, post_type, created_at, updated_at, creator_id,
        likes_count, comments_count,
        polls(id, question, allows_multiple_answers, expires_at)
      `)
      .order('created_at', { ascending: false });

    if (user && supportedCreatorIds.length > 0) {
      // Only posts from creators the user follows
      postsQuery = postsQuery.in('creator_id', supportedCreatorIds);
      // Exclude own posts
      postsQuery = postsQuery.neq('creator_id', user.id);
    } else if (user) {
      // User is authenticated but doesn't follow anyone — show public posts
      postsQuery = postsQuery
        .eq('is_public', true)
        .neq('creator_id', user.id);
    } else {
      // Not authenticated — show public posts only
      postsQuery = postsQuery.eq('is_public', true);
    }

    const { data: allPosts, error: postsError } = await postsQuery.range(offset, offset + limit - 1);

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return NextResponse.json({ error: 'Failed to fetch posts', details: postsError.message }, { status: 500 });
    }

    if (!allPosts || allPosts.length === 0) {
      return NextResponse.json({
        creators: formattedCreators,
        posts: [],
        has_following: supportedCreatorIds.length > 0,
      });
    }

    // ── Hydrate posts with creator info ──
    const creatorIds = [...new Set(allPosts.map((p: any) => p.creator_id))];

    const [{ data: creators }, { data: creatorProfiles }] = await Promise.all([
      supabase.from('users').select('id, display_name, photo_url').in('id', creatorIds),
      supabase.from('creator_profiles').select('user_id, category, is_verified').in('user_id', creatorIds),
    ]);

    const creatorsMap = new Map((creators || []).map((c: any) => [c.id, c]));
    const profilesMap = new Map((creatorProfiles || []).map((cp: any) => [cp.user_id, cp]));

    // Fetch user's likes
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

    // ── Format posts (already sorted by created_at from DB) ──
    const formattedPosts = allPosts.map((p: any) => {
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
          role: 'creator',
        },
        creator_profile: {
          category: profile?.category || null,
          is_verified: profile?.is_verified || false,
        },
        poll: Array.isArray(p.polls) ? (p.polls[0] || null) : (p.polls || null),
        likes_count: p.likes_count || 0,
        comments_count: p.comments_count || 0,
        is_liked: user ? userLikedPostIds.has(p.id) : false,
        is_supporter: user ? supportedCreatorIds.includes(p.creator_id) : false,
      };
    });

    return NextResponse.json({
      creators: formattedCreators,
      posts: formattedPosts,
      has_following: supportedCreatorIds.length > 0,
    });
  } catch (error) {
    return handleApiError(error, 'UNIFIED_FEED_API', 'Failed to fetch unified feed');
  }
}
