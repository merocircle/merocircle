import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    
    const cookieStore = await cookies()
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    // Get current user (optional - works without auth too)
    const { data: { user } } = await supabase.auth.getUser()

    // Get trending creators (most followers)
    const { data: trendingCreators, error: trendingError } = await supabase
      .from('creator_profiles')
      .select(`
        *,
        users!inner(id, display_name, photo_url, email)
      `)
      .order('followers_count', { ascending: false })
      .limit(10)

    // Get recent posts
    const { data: recentPosts, error: postsError } = await supabase
      .from('posts')
      .select(`
        *,
        users!inner(id, display_name, photo_url)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(20)

    // Get suggested creators (random selection)
    const { data: suggestedCreators, error: suggestedError } = await supabase
      .from('creator_profiles')
      .select(`
        *,
        users!inner(id, display_name, photo_url, email)
      `)
      .limit(10)

    // Format trending creators
    const trending_creators = (trendingCreators || []).map((cp: any) => ({
      user_id: cp.user_id,
      display_name: cp.users.display_name,
      bio: cp.bio,
      avatar_url: cp.users.photo_url,
      follower_count: cp.followers_count || 0,
      following_count: 0,
      posts_count: cp.posts_count || 0,
      total_earned: cp.total_earnings || 0,
      created_at: cp.created_at,
      isFollowing: false
    }))

    // Format recent posts
    const recent_posts = (recentPosts || []).map((post: any) => ({
      id: post.id,
      creator_id: post.creator_id,
      content: post.content,
      image_url: post.image_url,
      like_count: 0,
      is_liked: false,
      created_at: post.created_at,
      creator: {
        user_id: post.users.id,
        display_name: post.users.display_name,
        avatar_url: post.users.photo_url
      }
    }))

    // Format suggested creators
    const suggested_creators = (suggestedCreators || []).map((cp: any) => ({
      user_id: cp.user_id,
      display_name: cp.users.display_name,
      bio: cp.bio,
      avatar_url: cp.users.photo_url,
      follower_count: cp.followers_count || 0,
      following_count: 0,
      posts_count: cp.posts_count || 0,
      total_earned: cp.total_earnings || 0,
      created_at: cp.created_at,
      isFollowing: false
    }))

    return NextResponse.json({
      trending_creators,
      recent_posts,
      suggested_creators
    })

  } catch (error) {
    console.error('Discover API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 
