import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser, getOptionalUser, handleApiError } from '@/lib/api-utils'
import { toggleLike, getPostLikeStatus } from '@/lib/like-engine'

export async function POST(request: NextRequest) {
  try {
    const { postId, action } = await request.json()
    
    if (!postId || !action || !['like', 'unlike'].includes(action)) {
      return NextResponse.json(
        { error: 'Post ID and valid action (like/unlike) required' },
        { status: 400 }
      )
    }

    const { user, errorResponse } = await getAuthenticatedUser(request)
    if (errorResponse || !user) {
      return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

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

    // Use unified like engine
    const result = await toggleLike({
      userId: user.id,
      postId,
      createNotification: true,
      logActivity: true,
        })

    if (!result.success) {
      if (result.error === 'Post not found') {
        return NextResponse.json({ error: result.error }, { status: 404 })
      }
      if (result.action === 'already_liked' && action === 'like') {
          return NextResponse.json(
            { error: 'Post already liked' },
            { status: 409 }
          )
        }
      return NextResponse.json({ error: result.error || 'Failed to like/unlike post' }, { status: 500 })
    }

    // If action doesn't match result (e.g., trying to like but already liked), return appropriate message
    if (action === 'like' && result.action !== 'liked') {
      return NextResponse.json(
        { error: 'Post already liked' },
        { status: 409 }
      )
    }
    if (action === 'unlike' && result.action !== 'unliked') {
      return NextResponse.json(
        { error: 'Post not liked' },
        { status: 400 }
      )
      }

      return NextResponse.json({ 
        success: true, 
      message: result.action === 'liked' ? 'Post liked successfully' : 'Post unliked successfully',
      action: result.action,
      likesCount: result.likesCount,
      })

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

    const user = await getOptionalUser(request)

    // Use unified like engine to get status
    const status = await getPostLikeStatus(postId, user?.id)

    return NextResponse.json({ 
      likesCount: status.likesCount,
      userHasLiked: status.userHasLiked
    })

  } catch (error) {
    return handleApiError(error, 'SOCIAL_LIKE_API', 'Failed to like/unlike post');
  }
} 
