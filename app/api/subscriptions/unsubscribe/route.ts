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

    // Get request body
    const body = await request.json();
    const { subscription_id, feedback } = body;

    if (!subscription_id) {
      return NextResponse.json(
        { error: 'subscription_id is required' },
        { status: 400 }
      );
    }

    logger.info('Processing manual unsubscribe', 'UNSUBSCRIBE_API', {
      userId: user.id,
      subscriptionId: subscription_id,
      hasFeedback: !!feedback,
    });

    // Fetch subscription to verify ownership and get details
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

    // Verify user owns this subscription
    if (subscription.supporter_id !== user.id) {
      logger.warn('User attempted to unsubscribe another users subscription', 'UNSUBSCRIBE_API', {
        userId: user.id,
        subscriptionId: subscription_id,
        ownerId: subscription.supporter_id,
      });
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if already cancelled
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

    // For Dodo subscriptions, cancel via Dodo API first
    if (subscription.payment_gateway === 'dodo' && subscription.external_subscription_id) {
      try {
        logger.info('Cancelling Dodo subscription', 'UNSUBSCRIBE_API', {
          subscriptionId: subscription_id,
          externalSubscriptionId: subscription.external_subscription_id,
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
          // Continue with local cancellation even if Dodo cancellation fails
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
        // Continue with local cancellation
      }
    }

    // Call unsubscribe engine to handle cleanup
    const result = await processUnsubscribe({
      supporterId: subscription.supporter_id,
      creatorId: subscription.creator_id,
      reason: 'user_cancelled',
      sendEmail: true, // Send unsubscribe confirmation email
      feedback: feedback || undefined,
    });

    if (!result.success) {
      logger.error('Failed to process unsubscribe', 'UNSUBSCRIBE_API', {
        error: result.error,
        subscriptionId: subscription_id,
      });
      return NextResponse.json(
        { error: result.error || 'Failed to unsubscribe' },
        { status: 500 }
      );
    }

    logger.info('Manual unsubscribe completed successfully', 'UNSUBSCRIBE_API', {
      userId: user.id,
      subscriptionId: subscription_id,
      supporterId: subscription.supporter_id,
      creatorId: subscription.creator_id,
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
