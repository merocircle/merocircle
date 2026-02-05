import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { createLikeNotification } from './notification-engine';

/**
 * Parameters for toggling a like
 */
export interface ToggleLikeParams {
  /** User ID who is liking/unliking */
  userId: string;
  /** Post ID being liked/unliked */
  postId: string;
  /** Whether to create notification (default: true) */
  createNotification?: boolean;
  /** Whether to log activity (default: true) */
  logActivity?: boolean;
}

/**
 * Result of toggling a like
 */
export interface ToggleLikeResult {
  success: boolean;
  action: 'liked' | 'unliked' | 'already_liked';
  likesCount: number;
  error?: string;
}

/**
 * Unified like/unlike engine
 * 
 * This is the single source of truth for like operations.
 * Handles both liking and unliking, updates counts, creates notifications, and logs activities.
 * 
 * @param params - Like toggle parameters
 * @returns Result indicating success and action taken
 */
export async function toggleLike(
  params: ToggleLikeParams
): Promise<ToggleLikeResult> {
  try {
    const {
      userId,
      postId,
      createNotification: shouldCreateNotification = true,
      logActivity: shouldLogActivity = true,
    } = params;

    const supabase = await createClient();

    // Check if post exists and get creator ID
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, creator_id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      logger.error('Post not found for like operation', 'LIKE_ENGINE', {
        error: postError?.message,
        postId,
        userId,
      });
      return {
        success: false,
        action: 'already_liked',
        likesCount: 0,
        error: 'Post not found',
      };
    }

    // Check if user has already liked this post
    const { data: existingLike, error: likeCheckError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .single();

    if (likeCheckError && likeCheckError.code !== 'PGRST116') {
      logger.error('Error checking existing like', 'LIKE_ENGINE', {
        error: likeCheckError.message,
        postId,
        userId,
      });
      return {
        success: false,
        action: 'already_liked',
        likesCount: 0,
        error: likeCheckError.message,
      };
    }

    const isLiked = !!existingLike;
    let action: 'liked' | 'unliked' | 'already_liked';

    if (isLiked) {
      // Unlike: Remove the like
      const { error: unlikeError } = await supabase
        .from('post_likes')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId);

      if (unlikeError) {
        logger.error('Failed to unlike post', 'LIKE_ENGINE', {
          error: unlikeError.message,
          postId,
          userId,
        });
        return {
          success: false,
          action: 'already_liked',
          likesCount: 0,
          error: unlikeError.message,
        };
      }

      action = 'unliked';
      logger.info('Post unliked successfully', 'LIKE_ENGINE', {
        postId,
        userId,
      });
    } else {
      // Like: Add the like
      const { error: likeError } = await supabase
        .from('post_likes')
        .insert({
          user_id: userId,
          post_id: postId,
        });

      if (likeError) {
        // Check if it's a duplicate key error (shouldn't happen but handle gracefully)
        if (likeError.code === '23505') {
          logger.warn('Post already liked (race condition)', 'LIKE_ENGINE', {
            postId,
            userId,
          });
          action = 'already_liked';
        } else {
          logger.error('Failed to like post', 'LIKE_ENGINE', {
            error: likeError.message,
            postId,
            userId,
          });
          return {
            success: false,
            action: 'already_liked',
            likesCount: 0,
            error: likeError.message,
          };
        }
      } else {
        action = 'liked';
        logger.info('Post liked successfully', 'LIKE_ENGINE', {
          postId,
          userId,
        });

        // Create notification if enabled and user is not liking their own post
        if (shouldCreateNotification && post.creator_id !== userId) {
          // Get liker's display name for notification
          const { data: likerData } = await supabase
            .from('users')
            .select('display_name')
            .eq('id', userId)
            .single();

          const likerName = likerData?.display_name || undefined;

          createLikeNotification(
            post.creator_id,
            userId,
            postId,
            likerName
          ).catch((notifError) => {
            logger.warn('Failed to create like notification', 'LIKE_ENGINE', {
              error: notifError instanceof Error ? notifError.message : 'Unknown',
              postId,
              userId,
            });
            // Don't fail the like operation if notification fails
          });
        }

        // Log activity if enabled
        if (shouldLogActivity) {
          const { logPostLiked } = await import('./activity-logging-engine');
          logPostLiked(userId, postId, post.creator_id).catch((activityError) => {
            logger.warn('Failed to log like activity', 'LIKE_ENGINE', {
              error: activityError instanceof Error ? activityError.message : 'Unknown',
              postId,
              userId,
            });
            // Don't fail the like operation if activity logging fails
          });
        }
      }
    }

    // Update likes_count on the post by counting total likes
    // Note: Database trigger should handle this, but we do it here for consistency
    const { count: likesCount, error: countError } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (countError) {
      logger.warn('Failed to count likes', 'LIKE_ENGINE', {
        error: countError.message,
        postId,
      });
    }

    // Update the post's likes_count
    const finalLikesCount = likesCount || 0;
    await supabase
      .from('posts')
      .update({ likes_count: finalLikesCount })
      .eq('id', postId);

    return {
      success: true,
      action,
      likesCount: finalLikesCount,
    };
  } catch (error) {
    logger.error('Unexpected error in like operation', 'LIKE_ENGINE', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      postId: params.postId,
      userId: params.userId,
    });
    return {
      success: false,
      action: 'already_liked',
      likesCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if a user has liked a post
 * 
 * @param userId - User ID to check
 * @param postId - Post ID to check
 * @returns True if user has liked the post, false otherwise
 */
export async function hasUserLikedPost(
  userId: string,
  postId: string
): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('post_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.warn('Error checking if user liked post', 'LIKE_ENGINE', {
        error: error.message,
        userId,
        postId,
      });
      return false;
    }

    return !!data;
  } catch (error) {
    logger.error('Unexpected error checking like status', 'LIKE_ENGINE', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      postId,
    });
    return false;
  }
}

/**
 * Get like count for a post
 * 
 * @param postId - Post ID
 * @returns Number of likes
 */
export async function getPostLikeCount(postId: string): Promise<number> {
  try {
    const supabase = await createClient();

    const { count, error } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (error) {
      logger.warn('Error getting like count', 'LIKE_ENGINE', {
        error: error.message,
        postId,
      });
      return 0;
    }

    return count || 0;
  } catch (error) {
    logger.error('Unexpected error getting like count', 'LIKE_ENGINE', {
      error: error instanceof Error ? error.message : 'Unknown error',
      postId,
    });
    return 0;
  }
}

/**
 * Get like status and count for a post (optimized single query)
 * 
 * @param postId - Post ID
 * @param userId - Optional user ID to check if they liked the post
 * @returns Object with like count and whether user liked it
 */
export async function getPostLikeStatus(
  postId: string,
  userId?: string
): Promise<{ likesCount: number; userHasLiked: boolean }> {
  try {
    const supabase = await createClient();

    // Get like count
    const { count, error: countError } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (countError) {
      logger.warn('Error getting like count', 'LIKE_ENGINE', {
        error: countError.message,
        postId,
      });
    }

    const likesCount = count || 0;

    // Check if user liked (if userId provided)
    let userHasLiked = false;
    if (userId) {
      const { data, error: likeError } = await supabase
        .from('post_likes')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .single();

      if (likeError && likeError.code !== 'PGRST116') {
        logger.warn('Error checking if user liked post', 'LIKE_ENGINE', {
          error: likeError.message,
          userId,
          postId,
        });
      } else {
        userHasLiked = !!data;
      }
    }

    return {
      likesCount,
      userHasLiked,
    };
  } catch (error) {
    logger.error('Unexpected error getting like status', 'LIKE_ENGINE', {
      error: error instanceof Error ? error.message : 'Unknown error',
      postId,
      userId,
    });
    return {
      likesCount: 0,
      userHasLiked: false,
    };
  }
}
