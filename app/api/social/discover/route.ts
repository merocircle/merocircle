import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    logger.info('Discovery feed request', 'SOCIAL_DISCOVER_API', { limit })

    const supabase = await createClient()

    // Fetch creators ordered by supporters (people who have paid)
    const [trendingResult, postsResult, suggestedResult] = await Promise.all([
      supabase
        .from('creator_profiles')
        .select(`
          user_id,
          bio,
          category,
          is_verified,
          supporters_count,
          posts_count,
          total_earnings,
          vanity_username,
          created_at,
          users!inner(id, display_name, photo_url, email)
        `)
        .order('supporters_count', { ascending: false })
        .limit(10),
      supabase
        .from('posts')
        .select('*, users!inner(id, display_name, photo_url)')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('creator_profiles')
        .select(`
          user_id,
          bio,
          category,
          is_verified,
          supporters_count,
          posts_count,
          total_earnings,
          vanity_username,
          created_at,
          users!inner(id, display_name, photo_url, email)
        `)
        .order('total_earnings', { ascending: false })
        .limit(10)
    ])

    const trendingCreators = trendingResult.data
    const recentPosts = postsResult.data
    const suggestedCreators = suggestedResult.data

    // Map creators with supporters_count instead of follower_count
    const trending_creators = (trendingCreators || []).map((cp: any) => ({
      user_id: cp.user_id,
      display_name: cp.users.display_name,
      bio: cp.bio,
      avatar_url: cp.users.photo_url,
      vanity_username: cp.vanity_username || null,
      category: cp.category || null,
      is_verified: cp.is_verified || false,
      supporter_count: cp.supporters_count || 0,
      posts_count: cp.posts_count || 0,
      total_earned: cp.total_earnings || 0,
      created_at: cp.created_at,
    }))

    const recent_posts = (recentPosts || []).map((post: { id: string; creator_id: string; content: string; image_url: string | null; image_urls?: string[]; created_at: string; users: { id: string; display_name: string; photo_url: string | null } }) => ({
      id: post.id,
      creator_id: post.creator_id,
      content: post.content,
      image_url: post.image_url,
      image_urls: post.image_urls || [],
      like_count: 0,
      is_liked: false,
      created_at: post.created_at,
      creator: {
        user_id: post.users.id,
        display_name: post.users.display_name,
        avatar_url: post.users.photo_url
      }
    }))

    const suggested_creators = (suggestedCreators || []).map((cp: any) => ({
      user_id: cp.user_id,
      display_name: cp.users.display_name,
      bio: cp.bio,
      avatar_url: cp.users.photo_url,
      vanity_username: cp.vanity_username || null,
      category: cp.category || null,
      is_verified: cp.is_verified || false,
      supporter_count: cp.supporters_count || 0,
      posts_count: cp.posts_count || 0,
      total_earned: cp.total_earnings || 0,
      created_at: cp.created_at,
    }))

    return NextResponse.json({
      trending_creators,
      recent_posts,
      suggested_creators
    }, {
      headers: {
        // Public data can be cached longer
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
      }
    })

  } catch (error) {
    logger.error('Discovery feed failed', 'SOCIAL_DISCOVER_API', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
