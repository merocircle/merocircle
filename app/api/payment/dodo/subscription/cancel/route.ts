import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { getAuthenticatedUser, handleApiError } from '@/lib/api-utils';
import { dodoClient } from '@/lib/dodo/client';
import { processUnsubscribe } from '@/lib/unsubscribe-engine';

/**
 * Cancel Dodo Payments subscription
 * 
 * POST /api/payment/dodo/subscription/cancel
 * 
 * Cancels a recurring subscription through Dodo Payments
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) {
      return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscription_id, creator_id } = body;

    if (!subscription_id || !creator_id) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get subscription record
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscription_id)
      .eq('supporter_id', user.id)
      .eq('creator_id', creator_id)
      .single();

    if (subError || !subscription) {
      logger.error('Subscription not found', 'DODO_CANCEL', {
        subscriptionId: subscription_id,
        userId: user.id,
      });
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Check if already cancelled
    if (subscription.status === 'cancelled' || subscription.status === 'expired') {
      logger.info('Subscription already cancelled', 'DODO_CANCEL', {
        subscriptionId: subscription_id,
      });
      return NextResponse.json({
        success: true,
        message: 'Subscription already cancelled',
      });
    }

    // Cancel with Dodo API
    try {
      if (subscription.external_subscription_id) {
        await dodoClient.cancelSubscription(subscription.external_subscription_id);
        
        logger.info('Dodo subscription cancelled via API', 'DODO_CANCEL', {
          subscriptionId: subscription_id,
          dodoSubscriptionId: subscription.external_subscription_id,
        });
      }
    } catch (dodoError) {
      logger.error('Failed to cancel Dodo subscription via API', 'DODO_CANCEL', {
        error: dodoError instanceof Error ? dodoError.message : 'Unknown',
        subscriptionId: subscription_id,
      });
      // Continue with local cancellation even if Dodo API fails
    }

    // Update subscription status in database
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', subscription_id);

    // Use unified unsubscribe engine to clean up
    const unsubscribeResult = await processUnsubscribe({
      supporterId: user.id,
      creatorId: creator_id,
      cancelSubscription: true,
      removeFromChannels: true,
      disableEmailNotifications: false, // Keep email notifications for potential re-subscription
      reason: 'user_cancelled_dodo',
    });

    if (!unsubscribeResult.success) {
      logger.error('Unsubscribe processing failed', 'DODO_CANCEL', {
        subscriptionId: subscription_id,
        error: unsubscribeResult.error,
      });
      return NextResponse.json(
        { error: 'Failed to process cancellation' },
        { status: 500 }
      );
    }

    logger.info('Dodo subscription cancelled successfully', 'DODO_CANCEL', {
      subscriptionId: subscription_id,
      userId: user.id,
      creatorId: creator_id,
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
    });
  } catch (error) {
    return handleApiError(error, 'DODO_CANCEL', 'Subscription cancellation failed');
  }
}
