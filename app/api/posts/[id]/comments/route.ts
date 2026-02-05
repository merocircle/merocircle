import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { getAuthenticatedUser, parsePaginationParams, handleApiError } from '@/lib/api-utils';

// Vercel runtime configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 10;

interface Params {
  id: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { id: postId } = await params;
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, offset } = parsePaginationParams(searchParams);

    const { data: comments, error } = await supabase
      .from('post_comments')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        parent_comment_id,
        user:users(
          id,
          display_name,
          photo_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Error fetching comments', 'COMMENTS_API', { error: error.message, postId });
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    const { count } = await supabase
      .from('post_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    return NextResponse.json({
      comments,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    return handleApiError(error, 'COMMENTS_API', 'Failed to fetch comments');
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { id: postId } = await params;
  
  // Validate environment variables for Vercel
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    logger.error('Missing Supabase environment variables', 'COMMENTS_API', {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    });
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  try {
    // Authenticate user
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { content, parent_comment_id } = body;

    // Use unified comment creation engine
    const { createComment } = await import('@/lib/comment-engine');
    const result = await createComment({
      userId: user.id,
      postId,
        content,
      parentCommentId: parent_comment_id,
      createNotifications: true,
      logActivity: true,
    });

    if (!result.success) {
      const statusCode = result.error === 'Post not found' || result.error === 'Parent comment not found' ? 404 : 
                        result.error === 'Comment content is required' ? 400 : 500;
      return NextResponse.json(
        { error: result.error || 'Failed to create comment' },
        { status: statusCode }
      );
    }

    return NextResponse.json(result.comment, { status: 201 });

  } catch (error) {
    logger.error('Unexpected error in POST /api/posts/[id]/comments', 'COMMENTS_API', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      postId,
      environment: process.env.VERCEL_ENV || 'local',
      nodeVersion: process.version
    });
    return handleApiError(error, 'COMMENTS_API', 'Failed to create comment');
  }
} 