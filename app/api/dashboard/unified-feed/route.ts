import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
  // Recent posts with decent engagement rank higher than old posts with high engagement
  return (engagementScore * timeFactor) + (timeFactor * 10);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Pagination support
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get trending creators for "Creators for you" section
    // Allow unauthenticated access - show public creator data
    let trendingCreatorsQuery = supabase
      .from('creator_profiles')
      .select(`
        user_id,
        bio,
        category,
        is_verified,
        supporters_count,
        posts_count,
        total_earnings,
        users!inner(id, display_name, photo_url)
      `)
      .order('supporters_count', { ascending: false })
      .limit(12);

    // Exclude current user's creator profile if they are authenticated and a creator
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

    const { data: trendingCreators } = await trendingCreatorsQuery;

    const formattedCreators = (trendingCreators || []).map((cp: any) => ({
      user_id: cp.user_id,
      display_name: cp.users.display_name,
      bio: cp.bio,
      avatar_url: cp.users.photo_url,
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

    // Get posts with optimized query using denormalized counts
    // For authenticated users: show public posts + supporter-only posts from creators they support
    // For unauthenticated users: show only public posts
    let allPostsQuery = supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        image_url,
        media_url,
        is_public,
        tier_required,
        post_type,
        created_at,
        updated_at,
        creator_id,
        likes_count,
        comments_count,
        users!posts_creator_id_fkey(id, display_name, photo_url),
        creator_profiles!posts_creator_id_fkey(category, is_verified),
        polls(
          id,
          question,
          allows_multiple_answers,
          expires_at
        )
      `)
      .order('created_at', { ascending: false });

    // Exclude current user's own posts if authenticated
    if (user) {
      allPostsQuery = allPostsQuery.neq('creator_id', user.id);
    }

    // Apply visibility filter at database level for better performance
    if (user && supportedCreatorIds.length > 0) {
      // Authenticated user with supporters: show public posts OR supporter-only posts from supported creators
      allPostsQuery = allPostsQuery.or(
        `is_public.eq.true,and(creator_id.in.(${supportedCreatorIds.join(',')}),or(is_public.eq.false,tier_required.neq.free))`
      );
    } else {
      // Unauthenticated or no supporters: show only public posts
      allPostsQuery = allPostsQuery.eq('is_public', true);
    }

    // Apply pagination - fetch only what we need
    const { data: allPosts } = await allPostsQuery.range(offset, offset + limit - 1);

    // Format posts using denormalized counts (no need to fetch profiles separately since joined in query)
    const formattedPosts = (allPosts || []).map((p: any) => {
      // Determine if user is a supporter of this creator
      const isSupporterOnly = !p.is_public || (p.tier_required && p.tier_required !== 'free');
      const isSupporter = user ? supportedCreatorIds.includes(p.creator_id) : false;

      return {
        id: p.id,
        title: p.title,
        content: p.content,
        image_url: p.image_url,
        media_url: p.media_url || null,
        is_public: p.is_public,
        tier_required: p.tier_required || 'free',
        post_type: p.post_type || 'post',
        created_at: p.created_at,
        updated_at: p.updated_at,
        creator_id: p.creator_id,
        creator: {
          id: p.users?.id || p.creator_id,
          display_name: p.users?.display_name || 'Creator',
          photo_url: p.users?.photo_url || null,
          role: 'creator'
        },
        creator_profile: {
          category: p.creator_profiles?.category || null,
          is_verified: p.creator_profiles?.is_verified || false
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
    console.error('Unified feed API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
