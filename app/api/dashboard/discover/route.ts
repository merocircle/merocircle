import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOptionalUser, parsePaginationParams, handleApiError } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

/**
 * Discovery feed: posts from creators the user does NOT follow.
 * Ranked by: recency + engagement (likes + comments) + supporter count.
 * Supporter-only content is gated (text hidden, images sent for blur).
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getOptionalUser();
    const supabase = await createClient();

    const searchParams = request.nextUrl.searchParams;
    const { limit, offset } = parsePaginationParams(searchParams);
    logger.info('Discover feed request', 'DASHBOARD_DISCOVER_API', { limit, offset, userId: user?.id });

    // Get supported creator IDs to exclude
    let supportedCreatorIds: string[] = [];
    if (user) {
      const { data: supporterData } = await supabase
        .from('supporters')
        .select('creator_id')
        .eq('supporter_id', user.id)
        .eq('is_active', true);
      supportedCreatorIds = (supporterData || []).map((s: any) => s.creator_id);
    }

    // Fetch posts from creators NOT in the user's circle
    let postsQuery = supabase
      .from('posts')
      .select(`
        id, title, content, image_url, image_urls, is_public,
        tier_required, post_type, created_at, updated_at, creator_id,
        likes_count, comments_count,
        polls(id, question, allows_multiple_answers, expires_at)
      `)
      .order('created_at', { ascending: false });

    if (user) {
      // Exclude own posts and supported creators' posts
      const excludeIds = [...supportedCreatorIds, user.id];
      if (excludeIds.length > 0) {
        // Use NOT IN to exclude these creators
        for (const id of excludeIds) {
          postsQuery = postsQuery.neq('creator_id', id);
        }
      }
    }

    const { data: allPosts, error: postsError } = await postsQuery.range(offset, offset + limit - 1);

    if (postsError) {
      logger.error('Failed to fetch discover posts', 'DASHBOARD_DISCOVER_API', { error: postsError.message });
      return NextResponse.json({ error: 'Failed to fetch discover posts' }, { status: 500 });
    }

    if (!allPosts || allPosts.length === 0) {
      return NextResponse.json({ posts: [], has_more: false });
    }

    // Hydrate with creator info
    const creatorIds = [...new Set(allPosts.map((p: any) => p.creator_id))];

    const [{ data: creators }, { data: creatorProfiles }] = await Promise.all([
      supabase.from('users').select('id, display_name, photo_url').in('id', creatorIds),
      supabase.from('creator_profiles').select('user_id, category, is_verified, vanity_username, supporters_count').in('user_id', creatorIds),
    ]);

    const creatorsMap = new Map((creators || []).map((c: any) => [c.id, c]));
    const profilesMap = new Map((creatorProfiles || []).map((cp: any) => [cp.user_id, cp]));

    // Fetch user's likes
    let userLikedPostIds = new Set<string>();
    if (user) {
      const postIds = allPosts.map((p: any) => p.id);
      const { data: userLikes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);
      userLikedPostIds = new Set((userLikes || []).map((l: any) => l.post_id));
    }

    // Format and rank posts
    const formattedPosts = allPosts.map((p: any) => {
      const creator = creatorsMap.get(p.creator_id);
      const profile = profilesMap.get(p.creator_id);

      // All discover posts are from non-supported creators
      const isSupporterOnly = !p.is_public || (p.tier_required && p.tier_required !== 'free');

      // Ranking score: engagement + recency + creator popularity
      const ageHours = (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60);
      const engagementScore = (p.likes_count || 0) * 2 + (p.comments_count || 0) * 3;
      const creatorPopularity = Math.log2((profile?.supporters_count || 0) + 1) * 5;
      const recencyBoost = Math.max(0, 100 - ageHours * 0.5); // Decay over ~8 days
      const rankScore = engagementScore + creatorPopularity + recencyBoost;

      return {
        id: p.id,
        title: p.title,
        content: isSupporterOnly ? null : p.content,
        // Discover shows non-supported creators; gated posts get only preview URL
        image_url: isSupporterOnly ? null : p.image_url,
        image_urls: isSupporterOnly ? [] : (p.image_urls || []),
        preview_image_url: isSupporterOnly ? `/api/post-preview-image?postId=${p.id}&index=0` : null,
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
          vanity_username: profile?.vanity_username || null,
          role: 'creator',
        },
        creator_profile: {
          category: profile?.category || null,
          is_verified: profile?.is_verified || false,
        },
        poll: isSupporterOnly ? null : (Array.isArray(p.polls) ? (p.polls[0] || null) : (p.polls || null)),
        likes_count: p.likes_count || 0,
        comments_count: p.comments_count || 0,
        is_liked: user ? userLikedPostIds.has(p.id) : false,
        is_supporter: false,
        _rank_score: rankScore,
      };
    });

    // Sort by rank score (highest first)
    formattedPosts.sort((a: any, b: any) => b._rank_score - a._rank_score);

    // Remove internal rank score from response
    const cleanPosts = formattedPosts.map(({ _rank_score, ...rest }: any) => rest);

    return NextResponse.json({
      posts: cleanPosts,
      has_more: allPosts.length === limit,
    });
  } catch (error) {
    return handleApiError(error, 'DISCOVER_FEED_API', 'Failed to fetch discover feed');
  }
}
