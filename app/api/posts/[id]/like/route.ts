import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, handleApiError } from '@/lib/api-utils';
import { toggleLike } from '@/lib/like-engine';
import { logger } from '@/lib/logger';

interface Params {
  id: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { id: postId } = await params;

  try {
    logger.info('Like post', 'POST_LIKE_API', { postId });
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Use unified like engine
    const result = await toggleLike({
      userId: user.id,
      postId,
      createNotification: true,
      logActivity: true,
    });

    if (!result.success) {
      if (result.error === 'Post not found') {
        return NextResponse.json({ error: result.error }, { status: 404 });
    }
      if (result.action === 'already_liked') {
        return NextResponse.json(
          { error: 'Post already liked' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: result.error || 'Failed to like post' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: result.action === 'liked' ? 'Post liked successfully' : 'Post unliked successfully',
      action: result.action,
      likesCount: result.likesCount,
    });

  } catch (error) {
    return handleApiError(error, 'LIKE_API', 'Failed to like post');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { id: postId } = await params;

  try {
    // Authenticate user
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Use unified like engine (toggleLike handles both like and unlike)
    const result = await toggleLike({
      userId: user.id,
      postId,
      createNotification: false, // No notification for unlike
      logActivity: false, // No activity log for unlike
    });

    if (!result.success) {
      if (result.error === 'Post not found') {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }
      return NextResponse.json({ error: result.error || 'Failed to unlike post' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Post unliked successfully',
      action: result.action,
      likesCount: result.likesCount,
    });

  } catch (error) {
    return handleApiError(error, 'LIKE_API', 'Failed to unlike post');
  }
}
