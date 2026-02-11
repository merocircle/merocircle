import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processUnsubscribe } from '@/lib/unsubscribe-engine';
import { logger } from '@/lib/logger';
import { getAuthenticatedUser, handleApiError } from '@/lib/api-utils';

/**
 * Manual Unsubscribe API
 * 
 * Allows users to unsubscribe from a creator's subscription from the settings page
 * Calls the unified unsubscribe engine to handle:
 * - Deactivating supporter record
 * - Cancelling subscription
 * - Removing from channels
 * - Optionally sending notification
 */

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user via NextAuth session
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) {
      logger.warn('Unauthorized unsubscribe request', 'UNSUBSCRIBE_API');
      return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get request body: either subscription_id (recurring) or creator_id (support-only membership)
    const body = await request.json();
    const { subscription_id, creator_id, feedback } = body;

    if (!subscription_id && !creator_id) {
      return NextResponse.json(
        { error: 'subscription_id or creator_id is required' },
        { status: 400 }
      );
    }

    let supporterId: string;
    let creatorId: string;
    let paymentGateway: string | null = null;
    let externalSubscriptionId: string | null = null;

    if (creator_id) {
      // Support-only membership: no subscription row, cancel by creator_id
      const { data: supporter, error: supError } = await supabase
        .from('supporters')
        .select('id, supporter_id, creator_id')
        .eq('supporter_id', user.id)
        .eq('creator_id', creator_id)
        .eq('is_active', true)
        .maybeSingle();

      if (supError || !supporter) {
        logger.error('Support membership not found', 'UNSUBSCRIBE_API', {
          error: supError?.message,
          creatorId: creator_id,
          userId: user.id,
        });
        return NextResponse.json(
          { error: 'Membership not found' },
          { status: 404 }
        );
      }
      supporterId = supporter.supporter_id;
      creatorId = supporter.creator_id;
      logger.info('Processing support-only unsubscribe', 'UNSUBSCRIBE_API', {
        userId: user.id,
        creatorId,
        hasFeedback: !!feedback,
      });
    } else {
      // Recurring subscription
      const { data: subscription, error: fetchError } = await supabase
        .from('subscriptions')
        .select('id, supporter_id, creator_id, status, payment_gateway, external_subscription_id')
        .eq('id', subscription_id)
        .single();

      if (fetchError || !subscription) {
        logger.error('Subscription not found', 'UNSUBSCRIBE_API', {
          error: fetchError?.message,
          subscriptionId: subscription_id,
        });
        return NextResponse.json(
          { error: 'Subscription not found' },
          { status: 404 }
        );
      }

      if (subscription.supporter_id !== user.id) {
        logger.warn('User attempted to unsubscribe another users subscription', 'UNSUBSCRIBE_API', {
          userId: user.id,
          subscriptionId: subscription_id,
          ownerId: subscription.supporter_id,
        });
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      if (subscription.status === 'cancelled' || subscription.status === 'expired') {
        logger.info('Subscription already cancelled or expired', 'UNSUBSCRIBE_API', {
          subscriptionId: subscription_id,
          status: subscription.status,
        });
        return NextResponse.json({
          success: true,
          message: 'Subscription already cancelled or expired',
          alreadyCancelled: true,
        });
      }

      supporterId = subscription.supporter_id;
      creatorId = subscription.creator_id;
      paymentGateway = subscription.payment_gateway;
      externalSubscriptionId = subscription.external_subscription_id || null;

      logger.info('Processing manual unsubscribe', 'UNSUBSCRIBE_API', {
        userId: user.id,
        subscriptionId: subscription_id,
        hasFeedback: !!feedback,
      });

      // For Dodo subscriptions, cancel via Dodo API first
      if (paymentGateway === 'dodo' && externalSubscriptionId) {
        try {
          logger.info('Cancelling Dodo subscription', 'UNSUBSCRIBE_API', {
            subscriptionId: subscription_id,
            externalSubscriptionId,
          });
          const dodoResponse = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'https://merocircle.app'}/api/payment/dodo/subscription/cancel`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                subscription_id: subscription_id,
                creator_id: subscription.creator_id,
              }),
            }
          );
          if (!dodoResponse.ok) {
            const errorData = await dodoResponse.json().catch(() => ({}));
            logger.error('Failed to cancel Dodo subscription', 'UNSUBSCRIBE_API', {
              error: errorData.error || 'Unknown error',
              subscriptionId: subscription_id,
            });
          } else {
            logger.info('Dodo subscription cancelled successfully', 'UNSUBSCRIBE_API', {
              subscriptionId: subscription_id,
            });
          }
        } catch (dodoError: any) {
          logger.error('Error calling Dodo cancel API', 'UNSUBSCRIBE_API', {
            error: dodoError.message,
            subscriptionId: subscription_id,
          });
        }
      }
    }

    // Call unsubscribe engine to handle cleanup
    const result = await processUnsubscribe({
      supporterId,
      creatorId,
      reason: 'user_cancelled',
      disableEmailNotifications: true,
    });

    if (!result.success) {
      logger.error('Failed to process unsubscribe', 'UNSUBSCRIBE_API', {
        error: result.error,
        subscriptionId: subscription_id ?? creator_id,
      });
      return NextResponse.json(
        { error: result.error || 'Failed to unsubscribe' },
        { status: 500 }
      );
    }

    logger.info('Manual unsubscribe completed successfully', 'UNSUBSCRIBE_API', {
      userId: user.id,
      subscriptionId: subscription_id ?? null,
      supporterId,
      creatorId,
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed',
      result: {
        supporterDeactivated: result.supporterDeactivated,
        subscriptionCancelled: result.subscriptionCancelled,
        channelsRemoved: result.channelsRemoved,
      },
    });
  } catch (error: unknown) {
    return handleApiError(error, 'UNSUBSCRIBE_API', 'Failed to unsubscribe');
  }
}
