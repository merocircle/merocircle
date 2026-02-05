import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { dodoClient } from '@/lib/dodo/client';
import { processPaymentSuccess } from '@/lib/payment-success-engine';
import { processUnsubscribe } from '@/lib/unsubscribe-engine';
import type { DodoWebhookEvent } from '@/lib/dodo/types';

/**
 * Dodo Payments Webhook Handler
 * 
 * POST /api/payment/dodo/webhook
 * 
 * Handles webhook events from Dodo Payments:
 * - subscription.activated: First payment successful
 * - payment.succeeded: Recurring payment successful
 * - subscription.cancelled: Subscription cancelled
 * - subscription.expired: Subscription expired
 * - payment.failed: Payment failed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-dodo-signature') || '';

    // Verify webhook signature
    if (!dodoClient.verifyWebhookSignature(body, signature)) {
      logger.error('Invalid Dodo webhook signature', 'DODO_WEBHOOK');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event: DodoWebhookEvent = JSON.parse(body);

    logger.info('Dodo webhook received', 'DODO_WEBHOOK', {
      type: event.type,
      subscriptionId: event.data.subscription_id,
    });

    const supabase = await createClient();

    // Find our subscription record using Dodo subscription ID
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('external_subscription_id', event.data.subscription_id)
      .single();

    if (subError || !subscription) {
      logger.error('Subscription not found for webhook', 'DODO_WEBHOOK', {
        dodoSubscriptionId: event.data.subscription_id,
      });
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Handle different webhook events
    switch (event.type) {
      case 'subscription.activated':
      case 'payment.succeeded': {
        // Payment successful - activate subscription
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          })
          .eq('id', subscription.id);

        // Find the associated transaction
        const { data: transaction } = await supabase
          .from('supporter_transactions')
          .select('*')
          .eq('metadata->>subscription_id', subscription.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (transaction) {
          // Use unified payment success engine
          const tierLevel = subscription.tier_level || (subscription.metadata as any)?.tier_level || 1;
          
          const result = await processPaymentSuccess({
            transactionId: transaction.id,
            gatewayData: {
              dodo_subscription_id: event.data.subscription_id,
              dodo_customer_id: event.data.customer_id,
              event_type: event.type,
            },
            tierLevel,
          });

          if (!result.success) {
            logger.error('Payment success processing failed for Dodo webhook', 'DODO_WEBHOOK', {
              transactionId: transaction.id,
              error: result.error,
            });
          } else {
            logger.info('Dodo subscription activated successfully', 'DODO_WEBHOOK', {
              subscriptionId: subscription.id,
              transactionId: transaction.id,
              tierLevel,
            });
          }
        }

        break;
      }

      case 'subscription.cancelled':
      case 'subscription.expired': {
        // Subscription cancelled or expired - deactivate supporter
        await supabase
          .from('subscriptions')
          .update({
            status: event.type === 'subscription.cancelled' ? 'cancelled' : 'expired',
            cancelled_at: new Date().toISOString(),
          })
          .eq('id', subscription.id);

        // Use unified unsubscribe engine
        const unsubscribeResult = await processUnsubscribe({
          supporterId: subscription.supporter_id,
          creatorId: subscription.creator_id,
          cancelSubscription: true,
          removeFromChannels: true,
          disableEmailNotifications: false, // Keep email notifications for potential re-subscription
          reason: event.type === 'subscription.cancelled' ? 'user_cancelled' : 'expired',
        });

        if (!unsubscribeResult.success) {
          logger.error('Unsubscribe processing failed for Dodo webhook', 'DODO_WEBHOOK', {
            subscriptionId: subscription.id,
            error: unsubscribeResult.error,
          });
        } else {
          logger.info('Dodo subscription cancelled/expired successfully', 'DODO_WEBHOOK', {
            subscriptionId: subscription.id,
            reason: event.type,
          });
        }

        break;
      }

      case 'payment.failed': {
        // Payment failed - mark subscription as past_due
        await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
          })
          .eq('id', subscription.id);

        logger.warn('Dodo payment failed', 'DODO_WEBHOOK', {
          subscriptionId: subscription.id,
        });

        break;
      }

      default:
        logger.warn('Unknown Dodo webhook event type', 'DODO_WEBHOOK', {
          type: event.type,
        });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Dodo webhook processing failed', 'DODO_WEBHOOK', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
