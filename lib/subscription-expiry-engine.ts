import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { processUnsubscribe } from '@/lib/unsubscribe-engine';

/**
 * Subscription Expiry Management Engine
 * 
 * Handles expiry tracking for one-time payment gateways (eSewa, Khalti):
 * - Day 28: Send 2-day reminder email
 * - Day 29: Send 1-day reminder email
 * - Day 30+: Expire subscription and revoke access
 * 
 * Dodo subscriptions are handled by Dodo webhooks (not processed here)
 * Direct payments don't have subscriptions (one-time support)
 * 
 * This engine is called by:
 * - Scheduled task (Vercel Cron or activity-triggered)
 * - Manual trigger (for testing)
 */

export interface ExpiryCheckResult {
  /** Total subscriptions checked */
  checked: number;
  /** Number of reminder emails queued */
  reminders_sent: number;
  /** Number of subscriptions expired */
  expired: number;
  /** Errors encountered during processing */
  errors: string[];
  /** Breakdown by action type */
  details: {
    two_day_reminders: number;
    one_day_reminders: number;
    expired_subscriptions: number;
  };
}

interface SubscriptionToCheck {
  id: string;
  supporter_id: string;
  creator_id: string;
  tier_level: number;
  amount: number;
  payment_gateway: string;
  status: string;
  current_period_end: string;
  reminder_sent_at: Record<string, string>;
  supporter: {
    supporter_email: string;
    supporter_name: string;
  };
  creator: {
    creator_id: string;
    creator_name: string;
    creator_username?: string;
  };
}

/**
 * Calculate days until expiry (can be negative if already expired)
 */
function getDaysUntilExpiry(expiryDate: string): number {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Queue reminder email in email_queue table
 */
async function queueReminderEmail(
  supabase: any,
  subscription: SubscriptionToCheck,
  daysUntilExpiry: number
): Promise<boolean> {
  try {
    const renewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://merocircle.app'}/creator/${subscription.creator.creator_id}?renew=true&subscription_id=${subscription.id}`;
    
    const { error } = await supabase
      .from('email_queue')
      .insert({
        email_type: 'subscription_expiring_reminder',
        recipient_email: subscription.supporter.supporter_email,
        payload: {
          supporterName: subscription.supporter.supporter_name,
          creatorName: subscription.creator.creator_name,
          creatorUsername: subscription.creator.creator_username,
          creatorId: subscription.creator.creator_id,
          tierLevel: subscription.tier_level,
          expiryDate: subscription.current_period_end,
          daysUntilExpiry,
          renewUrl,
          subscriptionId: subscription.id,
        },
        scheduled_for: new Date().toISOString(),
      });

    if (error) {
      logger.error('Failed to queue reminder email', 'EXPIRY_ENGINE', {
        error: error.message,
        subscriptionId: subscription.id,
        supporterEmail: subscription.supporter.supporter_email,
      });
      return false;
    }

    logger.info('Reminder email queued', 'EXPIRY_ENGINE', {
      subscriptionId: subscription.id,
      daysUntilExpiry,
      supporterEmail: subscription.supporter.supporter_email,
    });

    return true;
  } catch (error: any) {
    logger.error('Error queueing reminder email', 'EXPIRY_ENGINE', {
      error: error.message,
      subscriptionId: subscription.id,
    });
    return false;
  }
}

/**
 * Queue expired notification email
 */
async function queueExpiredEmail(
  supabase: any,
  subscription: SubscriptionToCheck
): Promise<boolean> {
  try {
    const renewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://merocircle.app'}/creator/${subscription.creator.creator_id}?renew=true&subscription_id=${subscription.id}`;
    
    const { error } = await supabase
      .from('email_queue')
      .insert({
        email_type: 'subscription_expired',
        recipient_email: subscription.supporter.supporter_email,
        payload: {
          supporterName: subscription.supporter.supporter_name,
          creatorName: subscription.creator.creator_name,
          creatorUsername: subscription.creator.creator_username,
          creatorId: subscription.creator.creator_id,
          renewUrl,
          subscriptionId: subscription.id,
        },
        scheduled_for: new Date().toISOString(),
      });

    if (error) {
      logger.error('Failed to queue expired email', 'EXPIRY_ENGINE', {
        error: error.message,
        subscriptionId: subscription.id,
      });
      return false;
    }

    logger.info('Expired email queued', 'EXPIRY_ENGINE', {
      subscriptionId: subscription.id,
    });

    return true;
  } catch (error: any) {
    logger.error('Error queueing expired email', 'EXPIRY_ENGINE', {
      error: error.message,
      subscriptionId: subscription.id,
    });
    return false;
  }
}

/**
 * Main function to check subscription expiry and take appropriate actions
 * 
 * @returns ExpiryCheckResult with summary of actions taken
 */
export async function checkSubscriptionExpiry(): Promise<ExpiryCheckResult> {
  const result: ExpiryCheckResult = {
    checked: 0,
    reminders_sent: 0,
    expired: 0,
    errors: [],
    details: {
      two_day_reminders: 0,
      one_day_reminders: 0,
      expired_subscriptions: 0,
    },
  };

  try {
    logger.info('Starting subscription expiry check', 'EXPIRY_ENGINE');

    const supabase = await createClient();

    // Fetch active eSewa/Khalti subscriptions
    // We'll check all active subscriptions and filter by days in code
    const { data: subscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        supporter_id,
        creator_id,
        tier_level,
        amount,
        payment_gateway,
        status,
        current_period_end,
        reminder_sent_at,
        supporters!inner(
          user_id,
          users!inner(
            email,
            display_name
          )
        ),
        creators:users!creator_id(
          id,
          display_name,
          username
        )
      `)
      .eq('status', 'active')
      .in('payment_gateway', ['esewa', 'khalti'])
      .not('current_period_end', 'is', null)
      .order('current_period_end', { ascending: true });

    if (fetchError) {
      logger.error('Failed to fetch subscriptions for expiry check', 'EXPIRY_ENGINE', {
        error: fetchError.message,
      });
      result.errors.push(`Database fetch error: ${fetchError.message}`);
      return result;
    }

    if (!subscriptions || subscriptions.length === 0) {
      logger.info('No active eSewa/Khalti subscriptions to check', 'EXPIRY_ENGINE');
      return result;
    }

    logger.info(`Checking ${subscriptions.length} subscriptions for expiry`, 'EXPIRY_ENGINE');
    result.checked = subscriptions.length;

    // Process each subscription
    for (const sub of subscriptions) {
      try {
        // Transform the data structure to match our interface
        const subscription: SubscriptionToCheck = {
          id: sub.id,
          supporter_id: sub.supporter_id,
          creator_id: sub.creator_id,
          tier_level: sub.tier_level,
          amount: sub.amount,
          payment_gateway: sub.payment_gateway,
          status: sub.status,
          current_period_end: sub.current_period_end,
          reminder_sent_at: sub.reminder_sent_at || {},
          supporter: {
            supporter_email: (sub.supporters as any)?.users?.email || '',
            supporter_name: (sub.supporters as any)?.users?.display_name || 'Supporter',
          },
          creator: {
            creator_id: sub.creator_id,
            creator_name: (sub.creators as any)?.display_name || 'Creator',
            creator_username: (sub.creators as any)?.username || undefined,
          },
        };

        const daysUntilExpiry = getDaysUntilExpiry(subscription.current_period_end);

        logger.debug('Processing subscription', 'EXPIRY_ENGINE', {
          subscriptionId: subscription.id,
          daysUntilExpiry,
          expiryDate: subscription.current_period_end,
        });

        // Day 28: Send 2-day reminder
        if (daysUntilExpiry === 2 && !subscription.reminder_sent_at['2_days']) {
          const queued = await queueReminderEmail(supabase, subscription, 2);
          if (queued) {
            // Update reminder_sent_at to prevent duplicate reminders
            const { error: updateError } = await supabase
              .from('subscriptions')
              .update({
                reminder_sent_at: {
                  ...subscription.reminder_sent_at,
                  '2_days': new Date().toISOString(),
                },
              })
              .eq('id', subscription.id);

            if (!updateError) {
              result.reminders_sent++;
              result.details.two_day_reminders++;
            } else {
              logger.warn('Failed to update reminder_sent_at', 'EXPIRY_ENGINE', {
                subscriptionId: subscription.id,
                error: updateError.message,
              });
            }
          }
        }

        // Day 29: Send 1-day reminder
        if (daysUntilExpiry === 1 && !subscription.reminder_sent_at['1_day']) {
          const queued = await queueReminderEmail(supabase, subscription, 1);
          if (queued) {
            const { error: updateError } = await supabase
              .from('subscriptions')
              .update({
                reminder_sent_at: {
                  ...subscription.reminder_sent_at,
                  '1_day': new Date().toISOString(),
                },
              })
              .eq('id', subscription.id);

            if (!updateError) {
              result.reminders_sent++;
              result.details.one_day_reminders++;
            } else {
              logger.warn('Failed to update reminder_sent_at', 'EXPIRY_ENGINE', {
                subscriptionId: subscription.id,
                error: updateError.message,
              });
            }
          }
        }

        // Day 30+: Expire subscription
        if (daysUntilExpiry <= 0) {
          logger.info('Expiring subscription', 'EXPIRY_ENGINE', {
            subscriptionId: subscription.id,
            supporterId: subscription.supporter_id,
            creatorId: subscription.creator_id,
            daysOverdue: Math.abs(daysUntilExpiry),
          });

          // Call unsubscribe engine to revoke access (keeps supporter + subscription in sync)
          const unsubResult = await processUnsubscribe({
            supporterId: subscription.supporter_id,
            creatorId: subscription.creator_id,
            reason: 'expired',
          });

          if (unsubResult.success) {
            // Queue expired notification email
            await queueExpiredEmail(supabase, subscription);
            
            result.expired++;
            result.details.expired_subscriptions++;

            logger.info('Subscription expired successfully', 'EXPIRY_ENGINE', {
              subscriptionId: subscription.id,
            });
          } else {
            logger.error('Failed to expire subscription', 'EXPIRY_ENGINE', {
              subscriptionId: subscription.id,
              error: unsubResult.error,
            });
            result.errors.push(`Failed to expire ${subscription.id}: ${unsubResult.error}`);
          }
        }
      } catch (subError: any) {
        logger.error('Error processing subscription', 'EXPIRY_ENGINE', {
          subscriptionId: sub.id,
          error: subError.message,
        });
        result.errors.push(`Subscription ${sub.id}: ${subError.message}`);
      }
    }

    logger.info('Subscription expiry check completed', 'EXPIRY_ENGINE', {
      checked: result.checked,
      reminders_sent: result.reminders_sent,
      expired: result.expired,
      errors: result.errors.length,
    });

    return result;
  } catch (error: any) {
    logger.error('Fatal error in subscription expiry check', 'EXPIRY_ENGINE', {
      error: error.message,
      stack: error.stack,
    });
    result.errors.push(`Fatal error: ${error.message}`);
    return result;
  }
}
