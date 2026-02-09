import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * Quick Renewal API
 * 
 * Allows users to quickly renew their expired or expiring subscriptions
 * Pre-fills payment gateway with their previous tier and amount
 * Redirects to appropriate payment initiation endpoint
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn('Unauthorized quick-renew request', 'QUICK_RENEW_API');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get subscription_id from request body
    const body = await request.json();
    const { subscription_id } = body;

    if (!subscription_id) {
      return NextResponse.json(
        { error: 'subscription_id is required' },
        { status: 400 }
      );
    }

    logger.info('Processing quick renewal', 'QUICK_RENEW_API', {
      userId: user.id,
      subscriptionId: subscription_id,
    });

    // Fetch subscription details
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        supporter_id,
        creator_id,
        tier_level,
        amount,
        payment_gateway,
        status
      `)
      .eq('id', subscription_id)
      .eq('supporter_id', user.id) // Ensure user owns this subscription
      .single();

    if (fetchError || !subscription) {
      logger.error('Subscription not found or access denied', 'QUICK_RENEW_API', {
        error: fetchError?.message,
        subscriptionId: subscription_id,
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Subscription not found or access denied' },
        { status: 404 }
      );
    }

    // Check if subscription belongs to user
    if (subscription.supporter_id !== user.id) {
      logger.warn('User attempted to renew another users subscription', 'QUICK_RENEW_API', {
        userId: user.id,
        subscriptionId: subscription_id,
        ownerId: subscription.supporter_id,
      });
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Prepare renewal parameters
    const renewalParams = {
      amount: subscription.amount,
      creatorId: subscription.creator_id,
      supporterId: subscription.supporter_id,
      tier_level: subscription.tier_level,
      gateway: subscription.payment_gateway,
    };

    logger.info('Quick renewal parameters prepared', 'QUICK_RENEW_API', {
      subscriptionId: subscription_id,
      gateway: renewalParams.gateway,
      tierLevel: renewalParams.tier_level,
      amount: renewalParams.amount,
    });

    // Build payment initiation URL based on gateway
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://merocircle.app';
    let paymentUrl = '';

    switch (subscription.payment_gateway) {
      case 'esewa':
        // eSewa payment initiation
        paymentUrl = `${baseUrl}/api/payment/initiate`;
        break;

      case 'khalti':
        // Khalti payment initiation
        paymentUrl = `${baseUrl}/api/payment/khalti/initiate`;
        break;

      case 'dodo':
        // Dodo subscription renewal
        paymentUrl = `${baseUrl}/api/payment/dodo/subscription/initiate`;
        break;

      case 'direct':
        // Direct payment (no actual payment gateway)
        paymentUrl = `${baseUrl}/api/payment/direct`;
        break;

      default:
        logger.error('Unsupported payment gateway for renewal', 'QUICK_RENEW_API', {
          gateway: subscription.payment_gateway,
        });
        return NextResponse.json(
          { error: 'Unsupported payment gateway' },
          { status: 400 }
        );
    }

    // Return renewal information for frontend to initiate payment
    return NextResponse.json({
      success: true,
      renewal: {
        subscriptionId: subscription.id,
        amount: renewalParams.amount,
        tierLevel: renewalParams.tier_level,
        creatorId: renewalParams.creatorId,
        supporterId: renewalParams.supporterId,
        gateway: renewalParams.gateway,
        paymentUrl,
      },
      message: 'Renewal parameters prepared. Redirect user to payment.',
    });
  } catch (error: any) {
    logger.error('Error in quick-renew API', 'QUICK_RENEW_API', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
