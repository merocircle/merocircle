import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/lib/supabase'
import { handleApiError } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const { postId, action } = await request.json()
    
    if (!postId || !action || !['like', 'unlike'].includes(action)) {
      return NextResponse.json(
        { error: 'Post ID and valid action (like/unlike) required' },
        { status: 400 }
      )
    }

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
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, creator_id')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if (action === 'like') {
      // Add like
      const { error: likeError } = await supabase
        .from('post_likes')
        .insert({
          user_id: user.id,
          post_id: postId
        })

      if (likeError) {
        // Check if already liked
        if (likeError.code === '23505') {
          return NextResponse.json(
            { error: 'Post already liked' },
            { status: 409 }
          )
        }
        throw likeError
      }

      supabase
        .from('user_activities')
        .insert({
          user_id: user.id,
          activity_type: 'post_liked',
          target_id: postId,
          target_type: 'post',
          metadata: { creator_id: post.creator_id }
        })
        .then()

      return NextResponse.json({ 
        success: true, 
        message: 'Post liked successfully',
        action: 'liked'
      })

    } else if (action === 'unlike') {
      // Remove like
      const { error: unlikeError } = await supabase
        .from('post_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId)

      if (unlikeError) {
        throw unlikeError
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Post unliked successfully',
        action: 'unliked'
      })
    }

  } catch (error) {
    return handleApiError(error, 'SOCIAL_LIKE_API', 'Failed to like/unlike post');
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    
    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID required' },
        { status: 400 }
      )
    }

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
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // Get like count
    const { count: likesCount, error: countError } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)

    if (countError) {
      throw countError
    }

    let userHasLiked = false
    if (user) {
      // Check if user has liked this post
      const { data: userLike, error: likeError } = await supabase
        .from('post_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single()

      if (likeError && likeError.code !== 'PGRST116') {
        throw likeError
      }

      userHasLiked = !!userLike
    }

    return NextResponse.json({ 
      likesCount: likesCount || 0,
      userHasLiked
    })

  } catch (error) {
    return handleApiError(error, 'SOCIAL_LIKE_API', 'Failed to like/unlike post');
  }
} 
