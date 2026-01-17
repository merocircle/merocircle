import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Balanced feed ranking formula
function calculatePostScore(post: any): number {
  const now = Date.now();
  const postTime = new Date(post.created_at).getTime();
  const ageInHours = (now - postTime) / (1000 * 60 * 60);

  // Time decay: posts lose 10% value per day
  const timeFactor = Math.exp(-ageInHours / 240); // 240 hours = 10 days

  // Engagement score
  const likesCount = post.likes_count || 0;
  const commentsCount = post.comments_count || 0;
  const engagementScore = likesCount + (commentsCount * 2); // Comments weighted 2x

  // Balanced formula: combine time decay with engagement
  // Recent posts with decent engagement rank higher than old posts with high engagement
  return (engagementScore * timeFactor) + (timeFactor * 10);
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get trending creators for "Creators for you" section
    // Exclude the current user if they are a creator
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

    // Exclude current user's creator profile if they are a creator
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userProfile?.role === 'creator') {
      trendingCreatorsQuery = trendingCreatorsQuery.neq('user_id', user.id);
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

    // Get all public posts with engagement data
    // Exclude current user's own posts
    const { data: allPosts } = await supabase
      .from('posts')
      .select(`
        *,
        users!posts_creator_id_fkey(id, display_name, photo_url),
        post_likes(id, user_id),
        post_comments(
          id,
          content,
          created_at,
          user:users(id, display_name, photo_url)
        ),
        polls(
          id,
          question,
          allows_multiple_answers,
          expires_at
        )
      `)
      .eq('is_public', true)
      .neq('creator_id', user.id) // Exclude current user's own posts
      .order('created_at', { ascending: false })
      .limit(50);

    // Get creator profiles for posts
    let profilesMap = new Map();
    if (allPosts && allPosts.length > 0) {
      const creatorIds = [...new Set(allPosts.map((p: any) => p.creator_id))];
      const { data: creatorProfiles } = await supabase
        .from('creator_profiles')
        .select('user_id, category, is_verified')
        .in('user_id', creatorIds);

      profilesMap = new Map((creatorProfiles || []).map((cp: any) => [cp.user_id, cp]));
    }

    // Format posts and calculate scores
    const formattedPosts = (allPosts || []).map((p: any) => {
      const profile = profilesMap.get(p.creator_id);
      const likesCount = (p.post_likes || []).length;
      const commentsCount = (p.post_comments || []).length;

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
          category: profile?.category || null,
          is_verified: profile?.is_verified || false
        },
        // polls is an object (one-to-one relationship), not an array
        poll: p.polls || null,
        likes: p.post_likes || [],
        comments: (p.post_comments || []).map((c: any) => ({
          id: c.id,
          content: c.content,
          created_at: c.created_at,
          user: c.user || { id: null, display_name: 'Unknown', photo_url: null }
        })),
        likes_count: likesCount,
        comments_count: commentsCount,
        engagement_score: 0 // Will be calculated next
      };
    });

    // Calculate scores and sort
    const rankedPosts = formattedPosts
      .map(post => ({
        ...post,
        engagement_score: calculatePostScore(post)
      }))
      .sort((a, b) => b.engagement_score - a.engagement_score)
      .slice(0, 20);

    return NextResponse.json({
      creators: formattedCreators,
      posts: rankedPosts
    });
  } catch (error) {
    console.error('Unified feed API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
