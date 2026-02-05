import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { createCommentNotification } from './notification-engine';
import { logCommentAdded } from './activity-logging-engine';

/**
 * Parameters for creating a comment
 */
export interface CreateCommentParams {
  /** User ID who is creating the comment */
  userId: string;
  /** Post ID to comment on */
  postId: string;
  /** Comment content */
  content: string;
  /** Optional parent comment ID (for replies) */
  parentCommentId?: string;
  /** Whether to create notifications (default: true) */
  createNotifications?: boolean;
  /** Whether to log activity (default: true) */
  logActivity?: boolean;
}

/**
 * Result of creating a comment
 */
export interface CreateCommentResult {
  success: boolean;
  comment?: any;
  error?: string;
}

/**
 * Unified Comment Creation Engine
 * 
 * This is the single source of truth for creating comments.
 * Handles validation, creation, notifications, and activity logging.
 * 
 * @param params - Comment creation parameters
 * @returns Result with created comment or error
 */
export async function createComment(
  params: CreateCommentParams
): Promise<CreateCommentResult> {
  try {
    const {
      userId,
      postId,
      content,
      parentCommentId,
      createNotifications: shouldCreateNotifications = true,
      logActivity: shouldLogActivity = true,
    } = params;

    const supabase = await createClient();

    // Validate content
    if (!content || content.trim().length === 0) {
      return {
        success: false,
        error: 'Comment content is required',
      };
    }

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, creator_id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      logger.error('Post not found for comment', 'COMMENT_ENGINE', {
        error: postError?.message,
        postId,
        userId,
      });
      return {
        success: false,
        error: 'Post not found',
      };
    }

    // Get parent comment info if this is a reply
    let parentCommentUserId: string | null = null;
    if (parentCommentId) {
      const { data: parentComment, error: parentError } = await supabase
        .from('post_comments')
        .select('id, user_id')
        .eq('id', parentCommentId)
        .eq('post_id', postId)
        .single();

      if (parentError || !parentComment) {
        logger.error('Parent comment not found', 'COMMENT_ENGINE', {
          error: parentError?.message,
          parentCommentId,
          postId,
        });
        return {
          success: false,
          error: 'Parent comment not found',
        };
      }
      parentCommentUserId = parentComment.user_id;
    }

    // Create the comment
    const { data: comment, error: commentError } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: userId,
        content: content.trim(),
        parent_comment_id: parentCommentId || null,
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

    if (commentError || !comment) {
      logger.error('Comment creation failed', 'COMMENT_ENGINE', {
        error: commentError?.message,
        errorCode: commentError?.code,
        postId,
        userId,
      });
      return {
        success: false,
        error: commentError?.message || 'Failed to create comment',
      };
    }

    // Get commenter's display name for notifications
    const { data: commenterData } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', userId)
      .single();

    const commenterName = commenterData?.display_name || 'Someone';
    const commentPreview = content.trim().substring(0, 100);

    // Create notifications if enabled
    if (shouldCreateNotifications) {
      // If this is a reply to a comment, notify the original commenter
      if (parentCommentUserId && parentCommentUserId !== userId) {
        createCommentNotification(
          parentCommentUserId,
          userId,
          postId,
          comment.id,
          commenterName,
          true, // isReply
          commentPreview
        ).catch((notifError) => {
          logger.warn('Failed to create reply notification', 'COMMENT_ENGINE', {
            error: notifError instanceof Error ? notifError.message : 'Unknown',
            parentCommentUserId,
          });
        });
      }

      // Notify the post creator (if they're not the commenter and not already notified as parent commenter)
      if (post.creator_id && post.creator_id !== userId && post.creator_id !== parentCommentUserId) {
        createCommentNotification(
          post.creator_id,
          userId,
          postId,
          comment.id,
          commenterName,
          false, // isReply
          commentPreview
        ).catch((notifError) => {
          logger.warn('Failed to create comment notification', 'COMMENT_ENGINE', {
            error: notifError instanceof Error ? notifError.message : 'Unknown',
            creatorId: post.creator_id,
          });
        });
      }
    }

    // Log activity if enabled
    if (shouldLogActivity) {
      logCommentAdded(userId, comment.id, postId).catch((activityError) => {
        logger.warn('Failed to log comment activity', 'COMMENT_ENGINE', {
          error: activityError instanceof Error ? activityError.message : 'Unknown',
          commentId: comment.id,
          userId,
        });
        // Don't fail the comment creation if activity logging fails
      });
    }

    logger.info('Comment created successfully', 'COMMENT_ENGINE', {
      commentId: comment.id,
      postId,
      userId,
      isReply: !!parentCommentId,
    });

    return {
      success: true,
      comment,
    };
  } catch (error) {
    logger.error('Unexpected error creating comment', 'COMMENT_ENGINE', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      postId: params.postId,
      userId: params.userId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
