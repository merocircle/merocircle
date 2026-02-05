import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { dodoClient } from '@/lib/dodo/client';
import { processPaymentSuccess } from '@/lib/payment-success-engine';
import { handleApiError } from '@/lib/api-utils';

/**
 * Verify Dodo Payments subscription
 * 
 * GET /api/payment/dodo/subscription/verify?subscription_id=xxx&transaction_id=xxx
 * 
 * Verifies subscription status with Dodo API and processes payment success
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscription_id');
    const transactionId = searchParams.get('transaction_id');

    if (!subscriptionId || !transactionId) {
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
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription) {
      logger.error('Subscription not found', 'DODO_VERIFY', { subscriptionId });
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Check if already processed
    if (subscription.status === 'active') {
      logger.info('Subscription already active', 'DODO_VERIFY', { subscriptionId });
      return NextResponse.json({
        success: true,
        status: 'active',
        subscription,
      });
    }

    // Verify with Dodo API - check checkout session first, then subscription if available
    try {
      const checkoutSessionId = (subscription.metadata as any)?.dodo_checkout_session_id;
      
      if (checkoutSessionId) {
        // Check checkout session status
        const checkoutSession = await dodoClient.getCheckoutSession(checkoutSessionId);
        
        logger.info('Dodo checkout session status', 'DODO_VERIFY', {
          subscriptionId,
          sessionId: checkoutSessionId,
          paymentStatus: checkoutSession.payment_status,
          paymentId: checkoutSession.payment_id,
        });

        if (checkoutSession.payment_status === 'succeeded' && checkoutSession.payment_id) {
          // Payment succeeded - process payment success
          const tierLevel = subscription.tier_level || (subscription.metadata as any)?.tier_level || 1;
          
          // Update subscription status
          await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            })
            .eq('id', subscriptionId);

          const result = await processPaymentSuccess({
            transactionId,
            gatewayData: {
              dodo_checkout_session_id: checkoutSessionId,
              dodo_payment_id: checkoutSession.payment_id,
              payment_status: checkoutSession.payment_status,
            },
            tierLevel,
          });

          if (!result.success) {
            logger.error('Payment success processing failed', 'DODO_VERIFY', {
              transactionId,
              error: result.error,
            });
            return NextResponse.json(
              { error: result.error || 'Failed to process payment success' },
              { status: 500 }
            );
          }

          logger.info('Dodo checkout session verified and payment processed', 'DODO_VERIFY', {
            subscriptionId,
            transactionId,
            tierLevel,
            paymentId: checkoutSession.payment_id,
          });

          return NextResponse.json({
            success: true,
            status: 'active',
            subscription: result.transaction,
          });
        } else if (checkoutSession.payment_status === 'failed' || checkoutSession.payment_status === 'cancelled') {
          // Payment failed or cancelled
          await supabase
            .from('subscriptions')
            .update({ status: 'failed' })
            .eq('id', subscriptionId);
          
          await supabase
            .from('supporter_transactions')
            .update({ status: 'failed' })
            .eq('id', transactionId);

          return NextResponse.json({
            success: false,
            status: checkoutSession.payment_status,
            message: `Payment ${checkoutSession.payment_status}`,
          });
        } else {
          // Payment still processing or requires action
          return NextResponse.json({
            success: false,
            status: checkoutSession.payment_status || 'processing',
            message: 'Payment not completed yet',
          });
        }
      } else if (subscription.external_subscription_id) {
        // Fallback: check subscription status (for legacy subscriptions)
        const dodoSubscription = await dodoClient.getSubscription(
          subscription.external_subscription_id
        );

        logger.info('Dodo subscription status', 'DODO_VERIFY', {
          subscriptionId,
          dodoStatus: dodoSubscription.status,
        });

        if (dodoSubscription.status === 'active') {
          // Update subscription status
          await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              current_period_start: dodoSubscription.current_period_start,
              current_period_end: dodoSubscription.current_period_end,
            })
            .eq('id', subscriptionId);

          // Process payment success through unified engine
          const tierLevel = subscription.tier_level || (subscription.metadata as any)?.tier_level || 1;
          
          const result = await processPaymentSuccess({
            transactionId,
            gatewayData: {
              dodo_subscription_id: dodoSubscription.id,
              dodo_customer_id: dodoSubscription.customer_id,
              status: dodoSubscription.status,
            },
            tierLevel,
          });

          if (!result.success) {
            logger.error('Payment success processing failed', 'DODO_VERIFY', {
              transactionId,
              error: result.error,
            });
            return NextResponse.json(
              { error: result.error || 'Failed to process payment success' },
              { status: 500 }
            );
          }

          logger.info('Dodo subscription verified and activated', 'DODO_VERIFY', {
            subscriptionId,
            transactionId,
            tierLevel,
          });

          return NextResponse.json({
            success: true,
            status: 'active',
            subscription: result.transaction,
          });
        } else {
          // Subscription not active yet
          logger.warn('Dodo subscription not active', 'DODO_VERIFY', {
            subscriptionId,
            status: dodoSubscription.status,
          });

          return NextResponse.json({
            success: false,
            status: dodoSubscription.status,
            message: 'Subscription not active yet',
          });
        }
      } else {
        // No checkout session or subscription ID found
        logger.error('No checkout session or subscription ID found', 'DODO_VERIFY', {
          subscriptionId,
        });
        return NextResponse.json(
          { error: 'No checkout session or subscription ID found' },
          { status: 400 }
        );
      }
    } catch (dodoError) {
      logger.error('Dodo API error during verification', 'DODO_VERIFY', {
        error: dodoError instanceof Error ? dodoError.message : 'Unknown',
        subscriptionId,
      });

      return NextResponse.json(
        { error: 'Failed to verify subscription with Dodo' },
        { status: 500 }
      );
    }
  } catch (error) {
    return handleApiError(error, 'DODO_VERIFY', 'Subscription verification failed');
  }
}
