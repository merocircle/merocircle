import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * Activity types supported by the system
 */
export type ActivityType = 'post_created' | 'post_liked' | 'comment_added' | 'support_given';

/**
 * Target types for activities
 */
export type TargetType = 'post' | 'user' | 'comment' | 'transaction';

/**
 * Parameters for logging an activity
 */
export interface LogActivityParams {
  /** User ID who performed the activity */
  userId: string;
  /** Type of activity */
  activityType: ActivityType;
  /** Target resource ID */
  targetId: string;
  /** Target resource type */
  targetType: TargetType;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Result of logging an activity
 */
export interface LogActivityResult {
  success: boolean;
  activityId?: string;
  error?: string;
}

/**
 * Unified Activity Logging Engine
 * 
 * This is the single source of truth for logging user activities.
 * Handles all activity types consistently and provides helper functions for common activities.
 * 
 * @param params - Activity logging parameters
 * @returns Result indicating success or failure
 */
export async function logActivity(
  params: LogActivityParams
): Promise<LogActivityResult> {
  try {
    const {
      userId,
      activityType,
      targetId,
      targetType,
      metadata = {},
    } = params;

    const supabase = await createClient();

    // Validate that user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      logger.warn('User not found for activity logging', 'ACTIVITY_LOGGING_ENGINE', {
        error: userError?.message,
        userId,
      });
      // Don't fail, just log warning
      return { success: false, error: 'User not found' };
    }

    // Create activity record
    const { data: activity, error: insertError } = await supabase
      .from('user_activities')
      .insert({
        user_id: userId,
        activity_type: activityType,
        target_id: targetId,
        target_type: targetType,
        metadata,
      })
      .select('id')
      .single();

    if (insertError) {
      logger.error('Failed to log activity', 'ACTIVITY_LOGGING_ENGINE', {
        error: insertError.message,
        errorCode: insertError.code,
        userId,
        activityType,
        targetId,
        targetType,
      });
      return { success: false, error: insertError.message };
    }

    logger.debug('Activity logged successfully', 'ACTIVITY_LOGGING_ENGINE', {
      activityId: activity.id,
      userId,
      activityType,
      targetId,
    });

    return {
      success: true,
      activityId: activity.id,
    };
  } catch (error) {
    logger.error('Unexpected error logging activity', 'ACTIVITY_LOGGING_ENGINE', {
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
 * Log activity asynchronously (non-blocking)
 * Use this when you don't want to wait for the activity to be logged
 * 
 * @param params - Activity logging parameters
 */
export function logActivityAsync(params: LogActivityParams): void {
  logActivity(params).catch((error) => {
    logger.warn('Failed to log activity asynchronously', 'ACTIVITY_LOGGING_ENGINE', {
      error: error instanceof Error ? error.message : 'Unknown',
      userId: params.userId,
      activityType: params.activityType,
    });
  });
}

/**
 * Helper function to log post creation activity
 * 
 * @param userId - User ID who created the post
 * @param postId - Post ID
 * @param metadata - Optional additional metadata
 */
export async function logPostCreated(
  userId: string,
  postId: string,
  metadata?: Record<string, unknown>
): Promise<LogActivityResult> {
  return logActivity({
    userId,
    activityType: 'post_created',
    targetId: postId,
    targetType: 'post',
    metadata,
  });
}

/**
 * Helper function to log post like activity
 * 
 * @param userId - User ID who liked the post
 * @param postId - Post ID
 * @param creatorId - Optional creator ID for metadata
 */
export async function logPostLiked(
  userId: string,
  postId: string,
  creatorId?: string
): Promise<LogActivityResult> {
  return logActivity({
    userId,
    activityType: 'post_liked',
    targetId: postId,
    targetType: 'post',
    metadata: creatorId ? { creator_id: creatorId } : {},
  });
}

/**
 * Helper function to log comment creation activity
 * 
 * @param userId - User ID who created the comment
 * @param commentId - Comment ID
 * @param postId - Post ID for metadata
 */
export async function logCommentAdded(
  userId: string,
  commentId: string,
  postId: string
): Promise<LogActivityResult> {
  return logActivity({
    userId,
    activityType: 'comment_added',
    targetId: commentId,
    targetType: 'comment',
    metadata: { post_id: postId },
  });
}

/**
 * Helper function to log support given activity
 * 
 * @param userId - User ID who gave support (supporter)
 * @param transactionId - Transaction ID
 * @param creatorId - Creator ID for metadata
 * @param amount - Support amount for metadata
 */
export async function logSupportGiven(
  userId: string,
  transactionId: string,
  creatorId: string,
  amount?: number
): Promise<LogActivityResult> {
  return logActivity({
    userId,
    activityType: 'support_given',
    targetId: transactionId,
    targetType: 'transaction',
    metadata: {
      creator_id: creatorId,
      ...(amount !== undefined ? { amount } : {}),
    },
  });
}
