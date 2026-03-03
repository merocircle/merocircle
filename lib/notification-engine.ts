import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * Notification types supported by the system
 */
export type NotificationType = 'like' | 'comment' | 'payment' | 'support';

/**
 * Parameters for creating a notification
 */
export interface CreateNotificationParams {
  /** User ID who will receive the notification */
  userId: string;
  /** Type of notification */
  type: NotificationType;
  /** User ID who triggered the notification (actor) */
  actorId: string;
  /** Optional post ID if notification is related to a post */
  postId?: string;
  /** Optional comment ID if notification is related to a comment */
  commentId?: string;
  /** Additional metadata for the notification */
  metadata?: Record<string, unknown>;
  /** Whether to skip notification if actor is the same as recipient (default: true) */
  skipIfSelf?: boolean;
}

/**
 * Result of creating a notification
 */
export interface CreateNotificationResult {
  success: boolean;
  notificationId?: string;
  skipped?: boolean;
  error?: string;
}

/**
 * Unified notification creation engine
 * 
 * This is the single source of truth for creating notifications.
 * Handles all notification types consistently and prevents duplicate notifications.
 * 
 * @param params - Notification creation parameters
 * @returns Result indicating success or failure
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<CreateNotificationResult> {
  try {
    const {
      userId,
      type,
      actorId,
      postId,
      commentId,
      metadata = {},
      skipIfSelf = true,
    } = params;

    // Skip if actor is the same as recipient (unless explicitly disabled)
    if (skipIfSelf && userId === actorId) {
      logger.debug('Skipping notification: actor is same as recipient', 'NOTIFICATION_ENGINE', {
        userId,
        actorId,
        type,
      });
      return { success: true, skipped: true };
    }

    const supabase = await createClient();

    // Validate that user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      logger.error('User not found for notification', 'NOTIFICATION_ENGINE', {
        error: userError?.message,
        userId,
      });
      return { success: false, error: 'User not found' };
    }

    // Validate that actor exists
    const { data: actor, error: actorError } = await supabase
      .from('users')
      .select('id')
      .eq('id', actorId)
      .single();

    if (actorError || !actor) {
      logger.error('Actor not found for notification', 'NOTIFICATION_ENGINE', {
        error: actorError?.message,
        actorId,
      });
      return { success: false, error: 'Actor not found' };
    }

    // Validate post exists if postId is provided
    if (postId) {
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('id')
        .eq('id', postId)
        .single();

      if (postError || !post) {
        logger.warn('Post not found for notification', 'NOTIFICATION_ENGINE', {
          error: postError?.message,
          postId,
        });
        // Don't fail, just log warning
      }
    }

    // Validate comment exists if commentId is provided
    if (commentId) {
      const { data: comment, error: commentError } = await supabase
        .from('post_comments')
        .select('id')
        .eq('id', commentId)
        .single();

      if (commentError || !comment) {
        logger.warn('Comment not found for notification', 'NOTIFICATION_ENGINE', {
          error: commentError?.message,
          commentId,
        });
        // Don't fail, just log warning
      }
    }

    // Check for duplicate: same creator (user_id), post, actor — if exists, do not create
    // For 'like': no time window — one notification per (creator, post, liker) ever
    const duplicateQuery = supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('actor_id', actorId)
      .limit(1);

    if (postId) {
      duplicateQuery.eq('post_id', postId);
    }
    if (commentId) {
      duplicateQuery.eq('comment_id', commentId);
    }
    // For non-like types, only treat as duplicate within last minute (spam guard)
    if (type !== 'like') {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
      duplicateQuery.gte('created_at', oneMinuteAgo);
    }

    const { data: duplicates } = await duplicateQuery;

    if (duplicates && duplicates.length > 0) {
      logger.debug('Skipping duplicate notification', 'NOTIFICATION_ENGINE', {
        userId,
        actorId,
        type,
        postId,
        commentId,
      });
      return { success: true, skipped: true, notificationId: duplicates[0].id };
    }

    // Create notification
    const notificationData: {
      user_id: string;
      type: NotificationType;
      actor_id: string;
      post_id?: string;
      comment_id?: string;
      metadata: Record<string, unknown>;
      read: boolean;
    } = {
      user_id: userId,
      type,
      actor_id: actorId,
      metadata,
      read: false,
    };

    if (postId) {
      notificationData.post_id = postId;
    }
    if (commentId) {
      notificationData.comment_id = commentId;
    }

    const { data: notification, error: insertError } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select('id')
      .single();

    if (insertError) {
      logger.error('Failed to create notification', 'NOTIFICATION_ENGINE', {
        error: insertError.message,
        errorCode: insertError.code,
        userId,
        actorId,
        type,
      });
      return { success: false, error: insertError.message };
    }

    logger.info('Notification created successfully', 'NOTIFICATION_ENGINE', {
      notificationId: notification.id,
      userId,
      actorId,
      type,
      postId,
      commentId,
    });

    return {
      success: true,
      notificationId: notification.id,
    };
  } catch (error) {
    logger.error('Unexpected error creating notification', 'NOTIFICATION_ENGINE', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create multiple notifications in batch
 * Useful for notifying multiple users at once
 * 
 * @param notifications - Array of notification parameters
 * @returns Results for each notification
 */
export async function createNotificationsBatch(
  notifications: CreateNotificationParams[]
): Promise<CreateNotificationResult[]> {
  const results = await Promise.all(
    notifications.map((params) => createNotification(params))
  );
  return results;
}

/**
 * Helper function to create a like notification
 * 
 * @param userId - User receiving the notification (post creator)
 * @param actorId - User who liked the post
 * @param postId - Post that was liked
 * @param actorName - Optional display name of the actor for metadata
 */
export async function createLikeNotification(
  userId: string,
  actorId: string,
  postId: string,
  actorName?: string
): Promise<CreateNotificationResult> {
  return createNotification({
    userId,
    type: 'like',
    actorId,
    postId,
    metadata: {
      action: actorName ? `${actorName} liked your post` : 'liked your post',
    },
  });
}

/**
 * Helper function to create a comment notification
 * 
 * @param userId - User receiving the notification (post creator or comment author)
 * @param actorId - User who commented
 * @param postId - Post that was commented on
 * @param commentId - Comment that was created
 * @param actorName - Optional display name of the actor for metadata
 * @param isReply - Whether this is a reply to a comment (default: false)
 * @param commentPreview - Optional preview of comment content
 */
export async function createCommentNotification(
  userId: string,
  actorId: string,
  postId: string,
  commentId: string,
  actorName?: string,
  isReply: boolean = false,
  commentPreview?: string
): Promise<CreateNotificationResult> {
  const action = isReply
    ? actorName
      ? `${actorName} replied to your comment`
      : 'replied to your comment'
    : actorName
    ? `${actorName} commented on your post`
    : 'commented on your post';

  const metadata: Record<string, unknown> = { action };
  if (commentPreview) {
    metadata.comment_preview = commentPreview.substring(0, 100);
  }

  return createNotification({
    userId,
    type: 'comment',
    actorId,
    postId,
    commentId,
    metadata,
  });
}

/**
 * Helper function to create a payment/support notification
 * 
 * @param userId - User receiving the notification (creator)
 * @param actorId - User who made the payment (supporter)
 * @param amount - Payment amount
 * @param transactionId - Optional transaction ID
 * @param actorName - Optional display name of the actor for metadata
 */
export async function createPaymentNotification(
  userId: string,
  actorId: string,
  amount: number,
  transactionId?: string,
  actorName?: string
): Promise<CreateNotificationResult> {
  return createNotification({
    userId,
    type: 'payment',
    actorId,
    metadata: {
      action: actorName
        ? `${actorName} supported you with NPR ${amount}`
        : `You received NPR ${amount} in support`,
      amount,
      transaction_id: transactionId,
    },
  });
}

/**
 * Helper function to create a support notification
 * 
 * @param userId - User receiving the notification (creator)
 * @param actorId - User who became a supporter
 * @param tierLevel - Tier level of support
 * @param amount - Support amount
 * @param actorName - Optional display name of the actor for metadata
 */
export async function createSupportNotification(
  userId: string,
  actorId: string,
  tierLevel: number,
  amount: number,
  actorName?: string
): Promise<CreateNotificationResult> {
  return createNotification({
    userId,
    type: 'support',
    actorId,
    metadata: {
      action: actorName
        ? `${actorName} became a ${tierLevel}-star supporter`
        : `New ${tierLevel}-star supporter`,
      tier_level: tierLevel,
      amount,
    },
  });
}
