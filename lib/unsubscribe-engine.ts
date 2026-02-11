import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { updateSupporterCount } from '@/lib/payment-utils';
import { serverStreamClient } from '@/lib/stream-server';

export interface UnsubscribeParams {
  /** Supporter user ID */
  supporterId: string;
  /** Creator user ID */
  creatorId: string;
  /** Optional: Whether to cancel recurring subscription (default: true) */
  cancelSubscription?: boolean;
  /** Optional: Whether to remove from Stream Chat channels (default: true) */
  removeFromChannels?: boolean;
  /** Optional: Whether to disable email notifications (default: true) */
  disableEmailNotifications?: boolean;
  /** Optional: Reason for unsubscribing */
  reason?: string;
}

export interface UnsubscribeResult {
  success: boolean;
  supporter?: {
    id: string;
    supporterId: string;
    creatorId: string;
    wasActive: boolean;
    tierLevel: number;
  };
  subscription?: {
    cancelled: boolean;
    subscriptionId?: string;
  };
  channels?: {
    removedFrom: number;
    channelIds: string[];
  };
  emailNotifications?: {
    disabled: boolean;
    affectedTransactions: number;
  };
  error?: string;
}

/**
 * Unified unsubscribe engine
 *
 * Sync rule: supporter and subscription stay in sync at the application level.
 * - Grant access: only through manageSubscription in subscription-engine.ts.
 * - Revoke access: only through this engine (deactivate supporter + cancel subscription).
 *
 * Data model:
 * - supporters: current membership (is_active = true). Used for access, "Your circle", creator page.
 * - subscriptions: recurring billing only. Optional; direct one-time payments have supporter
 *   row but no subscription row. This engine deactivates supporter and cancels subscription when present.
 *
 * This engine:
 * 1. Deactivates supporter record (sets is_active = false)
 * 2. Cancels recurring subscriptions if applicable
 * 3. Removes supporter from Stream Chat channels
 * 4. Disables email notifications for this creator
 * 5. Updates supporter count in creator_profiles
 *
 * @param params Unsubscribe parameters
 * @returns Unsubscribe result with details of what was changed
 */
export async function processUnsubscribe(
  params: UnsubscribeParams
): Promise<UnsubscribeResult> {
  const {
    supporterId,
    creatorId,
    cancelSubscription = true,
    removeFromChannels = true,
    disableEmailNotifications = true,
    reason,
  } = params;

  try {
    const supabase = await createClient();

    // Step 1: Find and deactivate supporter record
    const { data: supporter, error: supporterError } = await supabase
      .from('supporters')
      .select('id, tier_level, is_active, subscription_id')
      .eq('supporter_id', supporterId)
      .eq('creator_id', creatorId)
      .single();

    if (supporterError || !supporter) {
      logger.warn('Supporter record not found for unsubscribe', 'UNSUBSCRIBE_ENGINE', {
        supporterId,
        creatorId,
        error: supporterError?.message,
      });
      // Continue with other cleanup operations even if supporter record doesn't exist
    }

    let wasActive = false;
    if (supporter) {
      wasActive = supporter.is_active || false;

      // Deactivate supporter record
      const { error: updateError } = await supabase
        .from('supporters')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', supporter.id);

      if (updateError) {
        logger.error('Failed to deactivate supporter', 'UNSUBSCRIBE_ENGINE', {
          error: updateError.message,
          supporterId: supporter.id,
        });
        return {
          success: false,
          error: `Failed to deactivate supporter: ${updateError.message}`,
        };
      }

      logger.info('Supporter deactivated', 'UNSUBSCRIBE_ENGINE', {
        supporterId,
        creatorId,
        wasActive,
        tierLevel: supporter.tier_level,
      });
    }

    // Step 2: Cancel recurring subscription if applicable
    let subscriptionResult: { cancelled: boolean; subscriptionId?: string } | undefined;
    if (cancelSubscription && supporter?.subscription_id) {
      try {
        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .select('id, status')
          .eq('id', supporter.subscription_id)
          .single();

        if (subscription && subscription.status === 'active') {
          const { error: cancelError } = await supabase
            .from('subscriptions')
            .update({
              status: 'cancelled',
              cancelled_at: new Date().toISOString(),
              cancel_at_period_end: false, // Cancel immediately
              updated_at: new Date().toISOString(),
            })
            .eq('id', subscription.id);

          if (cancelError) {
            logger.error('Failed to cancel subscription', 'UNSUBSCRIBE_ENGINE', {
              error: cancelError.message,
              subscriptionId: subscription.id,
            });
          } else {
            logger.info('Subscription cancelled', 'UNSUBSCRIBE_ENGINE', {
              subscriptionId: subscription.id,
              supporterId,
              creatorId,
            });
            subscriptionResult = {
              cancelled: true,
              subscriptionId: subscription.id,
            };
          }
        } else {
          subscriptionResult = {
            cancelled: false,
            subscriptionId: supporter.subscription_id,
          };
        }
      } catch (subError) {
        logger.warn('Error checking/cancelling subscription', 'UNSUBSCRIBE_ENGINE', {
          error: subError instanceof Error ? subError.message : 'Unknown',
          subscriptionId: supporter?.subscription_id,
        });
      }
    }

    // Step 3: Remove from Stream Chat channels
    let channelsResult: { removedFrom: number; channelIds: string[] } | undefined;
    if (removeFromChannels) {
      try {
        // Get all channels for this creator
        const { data: channels, error: channelsError } = await supabase
          .from('channels')
          .select('id, stream_channel_id')
          .eq('creator_id', creatorId);

        if (channelsError) {
          logger.error('Failed to fetch channels', 'UNSUBSCRIBE_ENGINE', {
            error: channelsError.message,
            creatorId,
          });
        } else {
          const removedChannelIds: string[] = [];
          let removedCount = 0;

          for (const channel of channels || []) {
            if (!channel.stream_channel_id) continue;

            try {
              const streamChannel = serverStreamClient.channel('messaging', channel.stream_channel_id);
              
              // Query channel first to ensure it exists
              await streamChannel.query({});
              
              // Remove the supporter from the channel
              await streamChannel.removeMembers([supporterId]);
              
              removedChannelIds.push(channel.id);
              removedCount++;

              logger.info('Removed supporter from Stream channel', 'UNSUBSCRIBE_ENGINE', {
                supporterId,
                channelId: channel.id,
                streamChannelId: channel.stream_channel_id,
              });
            } catch (channelError) {
              logger.warn('Failed to remove supporter from Stream channel', 'UNSUBSCRIBE_ENGINE', {
                supporterId,
                channelId: channel.id,
                error: channelError instanceof Error ? channelError.message : 'Unknown',
              });
              // Continue with other channels even if one fails
            }
          }

          // Also remove from channel_members table in database
          if (removedChannelIds.length > 0) {
            const { error: membersError } = await supabase
              .from('channel_members')
              .delete()
              .eq('user_id', supporterId)
              .in('channel_id', removedChannelIds);

            if (membersError) {
              logger.warn('Failed to remove from channel_members table', 'UNSUBSCRIBE_ENGINE', {
                error: membersError.message,
              });
            }
          }

          channelsResult = {
            removedFrom: removedCount,
            channelIds: removedChannelIds,
          };
        }
      } catch (streamError) {
        logger.warn('Error removing from Stream channels', 'UNSUBSCRIBE_ENGINE', {
          error: streamError instanceof Error ? streamError.message : 'Unknown',
          supporterId,
          creatorId,
        });
        // Don't fail the whole operation if Stream removal fails
      }
    }

    // Step 4: Disable email notifications
    let emailNotificationsResult: { disabled: boolean; affectedTransactions: number } | undefined;
    if (disableEmailNotifications) {
      try {
        const { data: transactions, error: transactionsError } = await supabase
          .from('supporter_transactions')
          .update({ email_notifications_enabled: false })
          .eq('supporter_id', supporterId)
          .eq('creator_id', creatorId)
          .eq('status', 'completed')
          .select('id');

        if (transactionsError) {
          logger.error('Failed to disable email notifications', 'UNSUBSCRIBE_ENGINE', {
            error: transactionsError.message,
          });
        } else {
          const affectedCount = transactions?.length || 0;
          logger.info('Email notifications disabled', 'UNSUBSCRIBE_ENGINE', {
            supporterId,
            creatorId,
            affectedTransactions: affectedCount,
          });
          emailNotificationsResult = {
            disabled: true,
            affectedTransactions: affectedCount,
          };
        }
      } catch (emailError) {
        logger.warn('Error disabling email notifications', 'UNSUBSCRIBE_ENGINE', {
          error: emailError instanceof Error ? emailError.message : 'Unknown',
        });
      }
    }

    // Step 5: Update supporter count in creator_profiles
    try {
      await updateSupporterCount(creatorId);
      logger.info('Supporter count updated after unsubscribe', 'UNSUBSCRIBE_ENGINE', {
        creatorId,
      });
    } catch (countError) {
      logger.error('Failed to update supporter count', 'UNSUBSCRIBE_ENGINE', {
        error: countError instanceof Error ? countError.message : 'Unknown',
        creatorId,
      });
      // Continue even if count update fails
    }

    logger.info('Unsubscribe processed successfully', 'UNSUBSCRIBE_ENGINE', {
      supporterId,
      creatorId,
      wasActive,
      subscriptionCancelled: subscriptionResult?.cancelled,
      channelsRemoved: channelsResult?.removedFrom,
      emailNotificationsDisabled: emailNotificationsResult?.disabled,
      reason,
    });

    return {
      success: true,
      supporter: supporter ? {
        id: supporter.id,
        supporterId,
        creatorId,
        wasActive,
        tierLevel: supporter.tier_level || 1,
      } : undefined,
      subscription: subscriptionResult,
      channels: channelsResult,
      emailNotifications: emailNotificationsResult,
    };
  } catch (error) {
    logger.error('Unsubscribe engine error', 'UNSUBSCRIBE_ENGINE', {
      error: error instanceof Error ? error.message : 'Unknown',
      supporterId,
      creatorId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
