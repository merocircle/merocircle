import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser, handleApiError } from '@/lib/api-utils';

interface RouteParams {
  id: string;
  commentId: string;
}

/**
 * DELETE /api/posts/[id]/comments/[commentId]
 * Delete a comment. Allowed only for:
 * - The comment author (user_id)
 * - The post creator (posts.creator_id)
 * Deletes the comment and all its replies (descendants).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id: postId, commentId } = await params;

    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) {
      return errorResponse ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: commentRow, error: commentError } = await supabase
      .from('post_comments')
      .select('id, user_id')
      .eq('id', commentId)
      .eq('post_id', postId)
      .single();

    if (commentError || !commentRow) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const comment = commentRow as { id: string; user_id: string };

    const { data: postRow } = await supabase
      .from('posts')
      .select('creator_id')
      .eq('id', postId)
      .single();

    const post = postRow as { creator_id: string } | null;

    const isCommentOwner = comment.user_id === user.id;
    const isPostCreator = post?.creator_id === user.id;

    if (!isCommentOwner && !isPostCreator) {
      return NextResponse.json(
        { error: 'Only the comment author or the post creator can delete this comment' },
        { status: 403 }
      );
    }

    // Collect comment id and all descendant ids (replies) for deletion
    const idsToDelete: string[] = [commentId];
    let currentLevel: string[] = [commentId];

    while (currentLevel.length > 0) {
      const { data: children } = await supabase
        .from('post_comments')
        .select('id')
        .in('parent_comment_id', currentLevel);
      const childIds = (children ?? []).map((r: { id: string }) => r.id);
      idsToDelete.push(...childIds);
      currentLevel = childIds;
    }

    const { error: deleteError } = await supabase
      .from('post_comments')
      .delete()
      .in('id', idsToDelete);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'DELETE_COMMENT_API', 'Failed to delete comment');
  }
}
