import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, creator_id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Add like
    const { error: likeError } = await supabase
      .from('post_likes')
      .insert({
        user_id: user.id,
        post_id: postId
      });

    if (likeError) {
      // Check if already liked
      if (likeError.code === '23505') {
        return NextResponse.json(
          { error: 'Post already liked' },
          { status: 409 }
        );
      }
      throw likeError;
    }

    // Update likes_count on the post by counting total likes
    const { count: likesCount } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    await supabase
      .from('posts')
      .update({ likes_count: likesCount || 0 })
      .eq('id', postId);

    // Create notification for post creator (if not liking own post)
    if (post.creator_id !== user.id) {
      // Get liker's display name
      const { data: likerData } = await supabase
        .from('users')
        .select('display_name')
        .eq('id', user.id)
        .single();

      const likerName = likerData?.display_name || 'Someone';

      await supabase
        .from('notifications')
        .insert({
          user_id: post.creator_id,
          type: 'like',
          actor_id: user.id,
          post_id: postId,
          metadata: { action: `${likerName} liked your post` }
        });
    }

    // Log activity asynchronously (don't await)
    supabase
      .from('user_activities')
      .insert({
        user_id: user.id,
        activity_type: 'post_liked',
        target_id: postId,
        target_type: 'post',
        metadata: { creator_id: post.creator_id }
      })
      .then();

    return NextResponse.json({
      success: true,
      message: 'Post liked successfully',
      action: 'liked'
    });

  } catch (error) {
    logger.error('Error liking post', 'LIKE_API', {
      error: error instanceof Error ? error.message : 'Unknown',
      postId
    });
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
  const { id: postId } = await params;

  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Remove like
    const { error: unlikeError } = await supabase
      .from('post_likes')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId);

    if (unlikeError) {
      throw unlikeError;
    }

    // Update likes_count on the post by counting total likes
    const { count: likesCount } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    await supabase
      .from('posts')
      .update({ likes_count: likesCount || 0 })
      .eq('id', postId);

    return NextResponse.json({
      success: true,
      message: 'Post unliked successfully',
      action: 'unliked'
    });

  } catch (error) {
    logger.error('Error unliking post', 'LIKE_API', {
      error: error instanceof Error ? error.message : 'Unknown',
      postId
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
