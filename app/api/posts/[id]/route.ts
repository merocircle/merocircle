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
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        creator:users!posts_creator_id_fkey(
          id,
          display_name,
          photo_url,
          role
        ),
        creator_profile:creator_profiles!posts_creator_id_fkey(
          category,
          is_verified
        ),
        likes:post_likes(
          id,
          user_id,
          created_at,
          user:users(display_name, photo_url)
        ),
        comments:post_comments(
          id,
          content,
          created_at,
          updated_at,
          user:users(id, display_name, photo_url)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(post);

  } catch (error) {
    logger.error('Error fetching post', 'POSTS_API', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { id } = await params;
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if post exists and user owns it
    const { data: existingPost } = await supabase
      .from('posts')
      .select('creator_id')
      .eq('id', id)
      .single();

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (existingPost.creator_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own posts' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, image_url, media_url, is_public, tier_required } = body;

    const { data: post, error } = await supabase
      .from('posts')
      .update({
        title,
        content,
        image_url,
        media_url,
        is_public,
        tier_required,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        creator:users!posts_creator_id_fkey(
          id,
          display_name,
          photo_url,
          role
        ),
        creator_profile:creator_profiles!posts_creator_id_fkey(
          category,
          is_verified
        )
      `)
      .single();

    if (error) {
      logger.error('Error updating post', 'POSTS_API', { error: error.message, postId: id, userId: user.id });
      return NextResponse.json(
        { error: 'Failed to update post' },
        { status: 500 }
      );
    }

    return NextResponse.json(post);

  } catch (error) {
    logger.error('Error updating post', 'POSTS_API', { error: error instanceof Error ? error.message : 'Unknown', postId: id });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { id } = await params;
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if post exists and user owns it
    const { data: existingPost } = await supabase
      .from('posts')
      .select('creator_id')
      .eq('id', id)
      .single();

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (existingPost.creator_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own posts' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error deleting post', 'POSTS_API', { error: error.message, postId: id, userId: user.id });
      return NextResponse.json(
        { error: 'Failed to delete post' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Post deleted successfully' });

  } catch (error) {
    logger.error('Error deleting post', 'POSTS_API', { error: error instanceof Error ? error.message : 'Unknown', postId: id });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 