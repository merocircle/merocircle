import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { getAuthenticatedUser, handleApiError } from '@/lib/api-utils';

/**
 * My Subscriptions API
 * 
 * Fetches all subscriptions for the authenticated user
 * Returns enriched subscription data including:
 * - Creator information
 * - Tier details
 * - Subscription status
 * - Expiry dates
 * - Payment gateway information
 */

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user via NextAuth session
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) {
      logger.warn('Unauthorized my-subscriptions request', 'MY_SUBSCRIPTIONS_API', {
        hasUser: !!user,
      });
      return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    logger.info('Fetching subscriptions for user', 'MY_SUBSCRIPTIONS_API', {
      userId: user.id,
    });

    // Fetch user's subscriptions with enriched data
    const { data: subscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        supporter_id,
        creator_id,
        tier_level,
        amount,
        currency,
        payment_gateway,
        status,
        billing_cycle,
        current_period_start,
        current_period_end,
        reminder_sent_at,
        auto_renew,
        renewal_count,
        cancelled_at,
        created_at,
        updated_at,
        creators:users!creator_id(
          id,
          display_name,
          photo_url
        ),
        tiers:subscription_tiers(
          id,
          tier_name,
          tier_level,
          price,
          description,
          benefits
        )
      `)
      .eq('supporter_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      logger.error('Failed to fetch subscriptions', 'MY_SUBSCRIPTIONS_API', {
        error: fetchError.message,
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    // Transform and enrich subscription data
    const enrichedSubscriptions = (subscriptions || []).map((sub) => {
      const now = new Date();
      const expiryDate = sub.current_period_end ? new Date(sub.current_period_end) : null;
      const daysUntilExpiry = expiryDate
        ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Determine subscription state
      let state: 'active' | 'expiring_soon' | 'expired' | 'cancelled' = 'active';
      if (sub.status === 'cancelled') {
        state = 'cancelled';
      } else if (sub.status === 'expired' || (daysUntilExpiry !== null && daysUntilExpiry <= 0)) {
        state = 'expired';
      } else if (daysUntilExpiry !== null && daysUntilExpiry <= 7) {
        state = 'expiring_soon';
      }

      return {
        id: sub.id,
        supporterId: sub.supporter_id,
        creatorId: sub.creator_id,
        creator: {
          id: (sub.creators as any)?.id,
          displayName: (sub.creators as any)?.display_name || 'Unknown Creator',
          avatarUrl: (sub.creators as any)?.photo_url,
        },
        tier: {
          level: sub.tier_level,
          name: (sub.tiers as any)?.tier_name || `Tier ${sub.tier_level}`,
          price: (sub.tiers as any)?.price || sub.amount,
          description: (sub.tiers as any)?.description,
          benefits: (sub.tiers as any)?.benefits || [],
        },
        amount: sub.amount,
        currency: sub.currency || 'NPR',
        paymentGateway: sub.payment_gateway,
        status: sub.status,
        state, // Computed state for UI
        billingCycle: sub.billing_cycle,
        currentPeriodStart: sub.current_period_start,
        currentPeriodEnd: sub.current_period_end,
        daysUntilExpiry,
        reminderSentAt: sub.reminder_sent_at || {},
        autoRenew: sub.auto_renew || false,
        renewalCount: sub.renewal_count || 0,
        cancelledAt: sub.cancelled_at,
        createdAt: sub.created_at,
        updatedAt: sub.updated_at,
      };
    });

    logger.info('Subscriptions fetched successfully', 'MY_SUBSCRIPTIONS_API', {
      userId: user.id,
      count: enrichedSubscriptions.length,
    });

    return NextResponse.json({
      success: true,
      subscriptions: enrichedSubscriptions,
      count: enrichedSubscriptions.length,
    });
  } catch (error: unknown) {
    return handleApiError(error, 'MY_SUBSCRIPTIONS_API', 'Failed to fetch subscriptions');
  }
}
