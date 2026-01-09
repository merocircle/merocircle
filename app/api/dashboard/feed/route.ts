import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchCreatorProfiles, fetchCreatorDetails, calculateMonthlyTotal, calculateTotalAmount } from '@/lib/api-helpers';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: following } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    const followingIds = following?.map(f => f.following_id) || [];
    
    const followingCreators = await fetchCreatorProfiles(followingIds);
    
    const { data: activeSupporters } = await supabase
      .from('supporters')
      .select('creator_id')
      .eq('supporter_id', user.id)
      .eq('is_active', true);
    
    const supportedCreatorIds = activeSupporters?.map(s => s.creator_id) || [];
    const allCreatorIds = [...new Set([...followingIds, ...supportedCreatorIds])];
    
    let feedPosts: Array<Record<string, unknown>> = [];
    
    if (allCreatorIds.length > 0) {
      // Show posts from followed/supported creators
      const publicPostsQuery = supabase
        .from('posts')
        .select(`
          *,
          users(id, display_name, photo_url),
          post_likes(id, user_id),
          post_comments(
            id,
            content,
            created_at,
            user:users(id, display_name, photo_url)
          )
        `)
        .in('creator_id', allCreatorIds)
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      
      const { data: publicPosts } = await publicPostsQuery;
      
      let supporterOnlyPosts: Array<Record<string, unknown>> = [];
      if (supportedCreatorIds.length > 0) {
        const { data: allCreatorPosts } = await supabase
          .from('posts')
          .select(`
            *,
            users(id, display_name, photo_url),
            post_likes(id, user_id),
            post_comments(
              id,
              content,
              created_at,
              user:users(id, display_name, photo_url)
            )
          `)
          .in('creator_id', supportedCreatorIds)
          .order('created_at', { ascending: false });
        
        supporterOnlyPosts = (allCreatorPosts || []).filter((post: Record<string, unknown>) => 
          post.is_public === false || (post.tier_required && post.tier_required !== 'free')
        );
      }
      
      const allPosts = [...(publicPosts || []), ...supporterOnlyPosts]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 20);
      
      feedPosts = allPosts;
    } else {
      // If user hasn't followed anyone, show trending public posts
      const { data: trendingPosts } = await supabase
        .from('posts')
        .select(`
          *,
          users(id, display_name, photo_url),
          post_likes(id, user_id),
          post_comments(
            id,
            content,
            created_at,
            user:users(id, display_name, photo_url)
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);
      
      feedPosts = trendingPosts || [];
    }

    const { data: supportTransactions } = await supabase
      .from('supporter_transactions')
      .select('id, amount, created_at, creator_id')
      .eq('supporter_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    const creatorIds = [...new Set((supportTransactions || []).map((t: { creator_id: string }) => t.creator_id))];
    const creatorsMap = await fetchCreatorDetails(creatorIds);

    const totalSupported = calculateTotalAmount(supportTransactions || []);
    const thisMonthSupport = calculateMonthlyTotal(supportTransactions || []);

    const supportActivities = (supportTransactions || []).slice(0, 10).map((t: { id: string; creator_id: string; amount: number | string; created_at: string }) => {
      const creator = creatorsMap.get(t.creator_id) || {
        id: t.creator_id,
        display_name: 'Creator',
        photo_url: null
      };
      
      return {
        id: t.id,
        creator: creator.display_name,
        creatorId: t.creator_id,
        action: 'supported',
        title: `Supported with NPR ${Number(t.amount || 0).toLocaleString()}`,
        content: null,
        time: t.created_at,
        type: 'support' as const,
        amount: Number(t.amount || 0)
      };
    });


    let profilesMap = new Map();
    if (feedPosts.length > 0) {
      const creatorProfileIds = [...new Set(feedPosts.map((p: Record<string, unknown>) => p.creator_id as string))];
      const { data: creatorProfiles } = await supabase
        .from('creator_profiles')
        .select('user_id, category, is_verified')
        .in('user_id', creatorProfileIds);
      
      profilesMap = new Map((creatorProfiles || []).map((cp: { user_id: string; category: string | null; is_verified: boolean }) => [cp.user_id, cp]));
    }

    const formattedFeedPosts = feedPosts.map((p: Record<string, unknown>) => {
      const profile = profilesMap.get(p.creator_id);
      const users = p.users as Record<string, unknown> | undefined;
      return {
        id: p.id,
        title: p.title,
        content: p.content,
        image_url: p.image_url,
        media_url: p.media_url || null,
        is_public: p.is_public,
        tier_required: p.tier_required || 'free',
        created_at: p.created_at,
        updated_at: p.updated_at,
        creator_id: p.creator_id,
        creator: {
          id: (users?.id ? String(users.id) : String(p.creator_id || '')),
          display_name: users?.display_name ? String(users.display_name) : 'Creator',
          photo_url: users?.photo_url ? String(users.photo_url) : null,
          role: 'creator'
        },
        creator_profile: {
          category: profile?.category || null,
          is_verified: profile?.is_verified || false
        },
        likes: p.post_likes || [],
        comments: ((p.post_comments as Array<{ id: string; content: string; created_at: string; user?: { id: string; display_name: string; photo_url: string | null } }>) || []).map((c) => ({
          id: c.id,
          content: c.content,
          created_at: c.created_at,
          user: c.user || { id: null, display_name: 'Unknown', photo_url: null }
        })),
        likes_count: (p.post_likes as Array<Record<string, unknown>> | undefined)?.length || 0,
        comments_count: (p.post_comments as Array<Record<string, unknown>> | undefined)?.length || 0
      };
    });

    // Only show support transactions in recent activity, not posts
    const allRecentActivity = supportActivities
      .sort((a, b) => {
        const timeA = a.time ? new Date(String(a.time)).getTime() : 0;
        const timeB = b.time ? new Date(String(b.time)).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, 20);

    // Fetch trending posts from creators NOT in the followed list
    let trendingPosts: Array<Record<string, unknown>> = [];
    if (allCreatorIds.length > 0) {
      // Get trending posts excluding followed creators
      const { data: allTrendingPostsData } = await supabase
        .from('posts')
        .select(`
          *,
          users(id, display_name, photo_url),
          post_likes(id, user_id),
          post_comments(
            id,
            content,
            created_at,
            user:users(id, display_name, photo_url)
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);
      
      // Filter out posts from followed creators
      const trendingPostsData = (allTrendingPostsData || []).filter(
        (p: Record<string, unknown>) => !allCreatorIds.includes(p.creator_id as string)
      ).slice(0, 10);
      
      if (trendingPostsData && trendingPostsData.length > 0) {
        const trendingCreatorIds = [...new Set(trendingPostsData.map((p: Record<string, unknown>) => p.creator_id as string))];
        const { data: trendingProfiles } = await supabase
          .from('creator_profiles')
          .select('user_id, category, is_verified')
          .in('user_id', trendingCreatorIds);
        
        const trendingProfilesMap = new Map((trendingProfiles || []).map((cp: { user_id: string; category: string | null; is_verified: boolean }) => [cp.user_id, cp]));
        
        trendingPosts = trendingPostsData.map((p: Record<string, unknown>) => {
          const profile = trendingProfilesMap.get(p.creator_id as string);
          const users = p.users as Record<string, unknown> | undefined;
          return {
            id: p.id,
            title: p.title,
            content: p.content,
            image_url: p.image_url,
            media_url: p.media_url || null,
            is_public: p.is_public,
            tier_required: p.tier_required || 'free',
            created_at: p.created_at,
            updated_at: p.updated_at,
            creator_id: p.creator_id,
            creator: {
              id: (users?.id ? String(users.id) : String(p.creator_id || '')),
              display_name: users?.display_name ? String(users.display_name) : 'Creator',
              photo_url: users?.photo_url ? String(users.photo_url) : null,
              role: 'creator'
            },
            creator_profile: {
              category: profile?.category || null,
              is_verified: profile?.is_verified || false
            },
            likes: p.post_likes || [],
            comments: ((p.post_comments as Array<{ id: string; content: string; created_at: string; user?: { id: string; display_name: string; photo_url: string | null } }>) || []).map((c) => ({
              id: c.id,
              content: c.content,
              created_at: c.created_at,
              user: c.user || { id: null, display_name: 'Unknown', photo_url: null }
            })),
            likes_count: (p.post_likes as Array<Record<string, unknown>> | undefined)?.length || 0,
            comments_count: (p.post_comments as Array<Record<string, unknown>> | undefined)?.length || 0
          };
        });
      }
    } else {
      // If user hasn't followed anyone, show trending posts from all creators
      const { data: allTrendingPostsData } = await supabase
        .from('posts')
        .select(`
          *,
          users(id, display_name, photo_url),
          post_likes(id, user_id),
          post_comments(
            id,
            content,
            created_at,
            user:users(id, display_name, photo_url)
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (allTrendingPostsData && allTrendingPostsData.length > 0) {
        const trendingCreatorIds = [...new Set(allTrendingPostsData.map((p: Record<string, unknown>) => p.creator_id as string))];
        const { data: trendingProfiles } = await supabase
          .from('creator_profiles')
          .select('user_id, category, is_verified')
          .in('user_id', trendingCreatorIds);
        
        const trendingProfilesMap = new Map((trendingProfiles || []).map((cp: { user_id: string; category: string | null; is_verified: boolean }) => [cp.user_id, cp]));
        
        trendingPosts = allTrendingPostsData.map((p: Record<string, unknown>) => {
          const profile = trendingProfilesMap.get(p.creator_id as string);
          const users = p.users as Record<string, unknown> | undefined;
          return {
            id: p.id,
            title: p.title,
            content: p.content,
            image_url: p.image_url,
            media_url: p.media_url || null,
            is_public: p.is_public,
            tier_required: p.tier_required || 'free',
            created_at: p.created_at,
            updated_at: p.updated_at,
            creator_id: p.creator_id,
            creator: {
              id: (users?.id ? String(users.id) : String(p.creator_id || '')),
              display_name: users?.display_name ? String(users.display_name) : 'Creator',
              photo_url: users?.photo_url ? String(users.photo_url) : null,
              role: 'creator'
            },
            creator_profile: {
              category: profile?.category || null,
              is_verified: profile?.is_verified || false
            },
            likes: p.post_likes || [],
            comments: ((p.post_comments as Array<{ id: string; content: string; created_at: string; user?: { id: string; display_name: string; photo_url: string | null } }>) || []).map((c) => ({
              id: c.id,
              content: c.content,
              created_at: c.created_at,
              user: c.user || { id: null, display_name: 'Unknown', photo_url: null }
            })),
            likes_count: (p.post_likes as Array<Record<string, unknown>> | undefined)?.length || 0,
            comments_count: (p.post_comments as Array<Record<string, unknown>> | undefined)?.length || 0
          };
        });
      }
    }

    return NextResponse.json({
      stats: {
        totalSupported,
        creatorsSupported: creatorIds.length,
        thisMonth: thisMonthSupport,
        favoriteCreators: followingIds.length
      },
      followingCreators,
      recentActivity: allRecentActivity,
      feedPosts: formattedFeedPosts,
      trendingPosts,
      hasFollowedCreators: allCreatorIds.length > 0
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

