import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

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
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

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
    logger.error('Error fetching comments', 'COMMENTS_API', { error: error instanceof Error ? error.message : 'Unknown', postId });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { id: postId } = await params;
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: post } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single();

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { content, parent_comment_id } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    if (parent_comment_id) {
      const { data: parentComment } = await supabase
        .from('post_comments')
        .select('id')
        .eq('id', parent_comment_id)
        .eq('post_id', postId)
        .single();

      if (!parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        );
      }
    }

    const { data: comment, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
        parent_comment_id
      })
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
      .single();

    if (error) {
      logger.error('Error creating comment', 'COMMENTS_API', { error: error.message, postId, userId: user.id });
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      );
    }

    return NextResponse.json(comment, { status: 201 });

  } catch (error) {
    logger.error('Error creating comment', 'COMMENTS_API', { error: error instanceof Error ? error.message : 'Unknown', postId });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 