import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface Params {
  id: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        display_name,
        photo_url,
        role,
        bio,
        avatar_url,
        created_at
      `)
      .eq('id', id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let profile = { ...user };

    // If user is a creator, get creator-specific data
    if (user.role === 'creator') {
      const { data: creatorProfile } = await supabase
        .from('creator_profiles')
        .select(`
          bio,
          category,
          is_verified,
          total_earnings,
          supporters_count
        `)
        .eq('user_id', id)
        .single();

      if (creatorProfile) {
        profile = { ...profile, ...creatorProfile };
      }

      // Get creator stats
      const [
        { count: postsCount },
        { count: followersCount },
        { count: followingCount },
        { data: recentPosts },
        { data: topSupporters },
        { data: earningsData }
      ] = await Promise.all([
        // Posts count
        supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', id),
        
        // Followers count
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', id),
        
        // Following count
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', id),
        
        // Recent posts (last 5)
        supabase
          .from('posts')
          .select(`
            id,
            title,
            content,
            image_url,
            created_at,
            tier_required,
            likes_count:post_likes(count),
            comments_count:comments(count)
          `)
          .eq('creator_id', id)
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(5),
        
        // Top supporters
        supabase
          .from('supporters')
          .select(`
            amount,
            tier,
            created_at,
            supporter:users!supporters_supporter_id_fkey(
              id,
              display_name,
              photo_url
            )
          `)
          .eq('creator_id', id)
          .eq('is_active', true)
          .order('amount', { ascending: false })
          .limit(5),
        
        // Earnings over last 12 months
        supabase
          .from('supporter_transactions')
          .select('amount, created_at')
          .eq('creator_id', id)
          .eq('status', 'completed')
          .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: true })
      ]);

      // Calculate monthly earnings
      const monthlyEarnings = earningsData?.reduce((acc: any, transaction: any) => {
        const month = new Date(transaction.created_at).toISOString().substring(0, 7); // YYYY-MM
        acc[month] = (acc[month] || 0) + parseFloat(transaction.amount);
        return acc;
      }, {}) || {};

      profile = {
        ...profile,
        stats: {
          postsCount: postsCount || 0,
          followersCount: followersCount || 0,
          followingCount: followingCount || 0,
          totalEarnings: profile.total_earnings || 0,
          supportersCount: profile.supporters_count || 0
        },
        recentPosts: recentPosts || [],
        topSupporters: topSupporters || [],
        monthlyEarnings
      };
    } else {
      // For supporters, get their activity
      const [
        { count: followingCount },
        { data: supportedCreators },
        { data: recentActivity }
      ] = await Promise.all([
        // Following count
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', id),
        
        // Supported creators
        supabase
          .from('supporters')
          .select(`
            amount,
            tier,
            created_at,
            creator:users!supporters_creator_id_fkey(
              id,
              display_name,
              photo_url
            ),
            creator_profile:creator_profiles!supporters_creator_id_fkey(
              category,
              is_verified
            )
          `)
          .eq('supporter_id', id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(10),
        
        // Recent activity (likes and comments)
        supabase
          .from('post_likes')
          .select(`
            created_at,
            post:posts(
              id,
              title,
              creator:users!posts_creator_id_fkey(display_name)
            )
          `)
          .eq('user_id', id)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      profile = {
        ...profile,
        stats: {
          followingCount: followingCount || 0,
          supportedCreatorsCount: supportedCreators?.length || 0
        },
        supportedCreators: supportedCreators || [],
        recentActivity: recentActivity || []
      };
    }

    return NextResponse.json(profile);

  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 