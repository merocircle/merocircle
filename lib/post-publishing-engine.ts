import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { validatePostContent } from '@/lib/validation';
import { sanitizeString } from '@/lib/validation';
import { sendBulkPostNotifications } from '@/lib/email';
import { logPostCreated } from './activity-logging-engine';

/**
 * Poll data structure
 */
export interface PollData {
  question: string;
  options: string[];
  allows_multiple_answers?: boolean;
  expires_at?: string | null;
}

/**
 * Parameters for publishing a post
 */
export interface PublishPostParams {
  /** Creator user ID */
  creatorId: string;
  /** Post title */
  title: string;
  /** Post content */
  content: string;
  /** Single image URL (for backward compatibility) */
  image_url?: string;
  /** Multiple image URLs */
  image_urls?: string[];
  /** Whether post is public (default: true) */
  is_public?: boolean;
  /** Tier required to view (default: 'free') - DEPRECATED: use required_tiers instead */
  tier_required?: string;
  /** Array of tier levels (1, 2, 3) that can access this post. If empty/null and is_public=false, defaults to tier 1 */
  required_tiers?: string[];
  /** Post type: 'post' or 'poll' (default: 'post') */
  post_type?: 'post' | 'poll';
  /** Poll data (required if post_type is 'poll') */
  poll_data?: PollData;
  /** Whether to send email notifications to supporters (default: true) */
  sendNotifications?: boolean;
  /** Whether to log activity (default: true) */
  logActivity?: boolean;
}

/**
 * Result of publishing a post
 */
export interface PublishPostResult {
  success: boolean;
  post?: any;
  error?: string;
}

/**
 * Unified Post Publishing Engine
 * 
 * This is the single source of truth for publishing posts and polls.
 * Handles validation, creation, rollback on failure, and notifications.
 * 
 * @param params - Post publishing parameters
 * @returns Result with created post or error
 */
export async function publishPost(
  params: PublishPostParams
): Promise<PublishPostResult> {
  try {
    const {
      creatorId,
      title,
      content,
      image_url,
      image_urls,
      is_public = true,
      tier_required = 'free',
      required_tiers,
      post_type = 'post',
      poll_data,
      sendNotifications = true,
      logActivity: shouldLogActivity = true,
    } = params;

    const supabase = await createClient();

    // Validate post content
    const validation = validatePostContent(title, content);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Validate poll data if it's a poll post
    if (post_type === 'poll') {
      if (!poll_data || !poll_data.question || !poll_data.options || poll_data.options.length < 2) {
        return {
          success: false,
          error: 'Poll must have a question and at least 2 options',
        };
      }
      if (poll_data.options.length > 10) {
        return {
          success: false,
          error: 'Poll cannot have more than 10 options',
        };
      }
    }

    // Handle image_urls - support both single image_url and multiple image_urls
    let finalImageUrls: string[] = [];
    if (image_urls && Array.isArray(image_urls) && image_urls.length > 0) {
      finalImageUrls = image_urls.filter((url: string) => url && url.trim());
    } else if (image_url) {
      finalImageUrls = [image_url];
    }

    // Determine required_tiers: if provided, use it; otherwise derive from is_public and tier_required
    let finalRequiredTiers: string[] | null = null;
    if (required_tiers && required_tiers.length > 0) {
      // Filter out invalid tier values and ensure they're strings
      finalRequiredTiers = required_tiers
        .filter((tier) => tier && ['1', '2', '3'].includes(String(tier)))
        .map((tier) => String(tier));
      // If all tiers were invalid, set to null
      if (finalRequiredTiers.length === 0) {
        finalRequiredTiers = null;
      }
    } else if (!is_public) {
      // If is_public=false and no required_tiers specified, use tier_required for backward compatibility
      if (tier_required && tier_required !== 'free') {
        finalRequiredTiers = [tier_required];
      } else {
        // Default to tier 1 (supporters only) if is_public=false
        finalRequiredTiers = ['1'];
      }
    }
    // If is_public=true and no required_tiers, leave it as null (public post)

    // Create the post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        creator_id: creatorId,
        title: sanitizeString(title),
        content: sanitizeString(content),
        image_url: finalImageUrls.length > 0 ? finalImageUrls[0] : null, // Keep first image in image_url for backward compatibility
        image_urls: finalImageUrls.length > 0 ? finalImageUrls : [],
        is_public: is_public ?? true,
        tier_required: tier_required || 'free', // Keep for backward compatibility
        required_tiers: finalRequiredTiers,
        post_type: post_type || 'post',
      })
      .select('*, users!posts_creator_id_fkey(id, display_name, photo_url, role)')
      .single();

    if (postError || !post) {
      logger.error('Post creation failed', 'POST_PUBLISHING_ENGINE', {
        error: postError?.message,
        creatorId,
      });
      return {
        success: false,
        error: postError?.message || 'Failed to create post',
      };
    }

    // If it's a poll, create the poll data
    if (post_type === 'poll' && poll_data) {
      try {
        // Create poll
        const { data: pollRecord, error: pollError } = await supabase
          .from('polls')
          .insert({
            post_id: post.id,
            question: sanitizeString(poll_data.question),
            allows_multiple_answers: poll_data.allows_multiple_answers || false,
            expires_at: poll_data.expires_at || null,
          })
          .select()
          .single();

        if (pollError || !pollRecord) {
          // Rollback: delete the post
          await supabase.from('posts').delete().eq('id', post.id);
          logger.error('Poll creation failed', 'POST_PUBLISHING_ENGINE', {
            error: pollError?.message,
            postId: post.id,
            creatorId,
          });
          return {
            success: false,
            error: pollError?.message || 'Failed to create poll',
          };
        }

        // Create poll options
        const optionsToInsert = poll_data.options.map((option: string, index: number) => ({
          poll_id: pollRecord.id,
          option_text: sanitizeString(option),
          position: index,
        }));

        const { error: optionsError } = await supabase
          .from('poll_options')
          .insert(optionsToInsert);

        if (optionsError) {
          // Rollback: delete poll and post
          await supabase.from('polls').delete().eq('id', pollRecord.id);
          await supabase.from('posts').delete().eq('id', post.id);
          logger.error('Poll options creation failed', 'POST_PUBLISHING_ENGINE', {
            error: optionsError.message,
            postId: post.id,
            creatorId,
          });
          return {
            success: false,
            error: optionsError.message || 'Failed to create poll options',
          };
        }
      } catch (pollError) {
        // Rollback: delete the post
        await supabase.from('posts').delete().eq('id', post.id);
        logger.error('Unexpected error creating poll', 'POST_PUBLISHING_ENGINE', {
          error: pollError instanceof Error ? pollError.message : 'Unknown',
          postId: post.id,
          creatorId,
        });
        return {
          success: false,
          error: 'Failed to create poll',
        };
      }
    }

    // Log activity if enabled
    if (shouldLogActivity) {
      logPostCreated(creatorId, post.id, {
        post_type,
        is_public,
        tier_required,
      }).catch((activityError) => {
        logger.warn('Failed to log post creation activity', 'POST_PUBLISHING_ENGINE', {
          error: activityError instanceof Error ? activityError.message : 'Unknown',
          postId: post.id,
          creatorId,
        });
        // Don't fail the post creation if activity logging fails
      });
    }

    // Send email notifications to supporters if enabled
    if (sendNotifications) {
      sendPostNotificationsToSupporters(post, creatorId, supabase).catch((notifError) => {
        logger.error('Failed to send post notifications', 'POST_PUBLISHING_ENGINE', {
          error: notifError instanceof Error ? notifError.message : 'Unknown',
          postId: post.id,
          creatorId,
        });
        // Don't fail the post creation if notifications fail
      });
    }

    logger.info('Post published successfully', 'POST_PUBLISHING_ENGINE', {
      postId: post.id,
      creatorId,
      postType: post_type,
    });

    return {
      success: true,
      post,
    };
  } catch (error) {
    logger.error('Unexpected error publishing post', 'POST_PUBLISHING_ENGINE', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      creatorId: params.creatorId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Helper function to send post notifications to supporters
 * Extracted from the original implementation for reuse
 */
async function sendPostNotificationsToSupporters(
  post: any,
  creatorId: string,
  supabase: any
): Promise<void> {
  try {
    // Build query for supporters
    let supportersQuery = supabase
      .from('supporters')
      .select(`
        supporter_id,
        tier_level,
        user:supporter_id!inner(
          id,
          email,
          display_name
        )
      `)
      .eq('creator_id', creatorId)
      .eq('is_active', true);

    // If post has required_tiers, only notify supporters with matching tiers
    if (post.required_tiers && Array.isArray(post.required_tiers) && post.required_tiers.length > 0) {
      // Convert tier strings to numbers for comparison
      const requiredTierNumbers = post.required_tiers
        .map((t: string) => parseInt(t, 10))
        .filter((n: number) => !isNaN(n) && n >= 1 && n <= 3);
      
      if (requiredTierNumbers.length > 0) {
        // Only notify supporters whose tier_level is in the required tiers
        supportersQuery = supportersQuery.in('tier_level', requiredTierNumbers);
      }
    }
    // If post is public or has no required_tiers, notify all supporters

    const { data: supporters, error } = await supportersQuery;

    if (error) {
      logger.error('Failed to fetch supporters for email notifications', 'POST_PUBLISHING_ENGINE', {
        error: error.message,
        creatorId,
      });
      return;
    }

    if (!supporters || supporters.length === 0) {
      logger.info('No active supporters to notify', 'POST_PUBLISHING_ENGINE', {
        creatorId,
        postId: post.id,
      });
      return;
    }

    const { data: creatorData } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', creatorId)
      .single();

    const creatorName = creatorData?.display_name || 'Your creator';

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://merocircle.app';
    const postUrl = `${appUrl}/creator/${creatorId}?post=${post.id}`;

    const supportersWithEmails = supporters
      .filter((s: any) => s.user && s.user.email)
      .map((s: any) => ({
        email: s.user.email,
        name: s.user.display_name || 'Supporter',
      }));

    if (supportersWithEmails.length === 0) {
      logger.info('No supporters with valid emails found', 'POST_PUBLISHING_ENGINE', {
        creatorId,
        postId: post.id,
      });
      return;
    }

    // Send bulk email notifications
    const { sent, failed } = await sendBulkPostNotifications(supportersWithEmails, {
      creatorName,
      postTitle: post.title || 'New Post',
      postContent: post.content || '',
      postImageUrl: post.image_url || (post.image_urls && post.image_urls[0]) || null,
      postUrl,
      isPoll: post.post_type === 'poll',
    });

    logger.info('Post notification emails sent', 'POST_PUBLISHING_ENGINE', {
      creatorId,
      postId: post.id,
      totalSupporters: supportersWithEmails.length,
      sent,
      failed,
    });
  } catch (error: any) {
    // Don't throw - this is a background operation
    logger.error('Error sending post notifications', 'POST_PUBLISHING_ENGINE', {
      error: error.message,
      creatorId,
      postId: post.id,
    });
  }
}
