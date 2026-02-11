import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { getAuthenticatedUser, handleApiError } from '@/lib/api-utils';

/**
 * My Subscriptions API
 *
 * Returns all memberships for the authenticated user:
 * - From subscriptions table (recurring subscriptions)
 * - From supporters table when there is no subscription row (e.g. direct one-time support)
 * So users who subscribed via direct payment still see their membership and can cancel.
 */

export async function GET(request: NextRequest) {
  try {
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

    // 1) Fetch user's subscriptions with enriched data
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

    const subscriptionCreatorIds = new Set((subscriptions || []).map((s: any) => s.creator_id));

    // 2) Fetch active supporters (memberships) that don't have a subscription row
    const { data: supporters, error: supportersError } = await supabase
      .from('supporters')
      .select(`
        id,
        supporter_id,
        creator_id,
        tier_level,
        amount,
        created_at,
        updated_at
      `)
      .eq('supporter_id', user.id)
      .eq('is_active', true);

    if (supportersError) {
      logger.error('Failed to fetch supporters', 'MY_SUBSCRIPTIONS_API', {
        error: supportersError.message,
        userId: user.id,
      });
    }

    const supporterOnly = (supporters || []).filter(
      (s: any) => !subscriptionCreatorIds.has(s.creator_id)
    );

    const enrichedFromSupporters: any[] = [];
    if (supporterOnly.length > 0) {
      const creatorIds = [...new Set(supporterOnly.map((s: any) => s.creator_id))];
      const { data: creatorRows } = await supabase
        .from('users')
        .select('id, display_name, photo_url')
        .in('id', creatorIds);
      const creatorMap = new Map((creatorRows || []).map((c: any) => [c.id, c]));

      const { data: tierRows } = await supabase
        .from('subscription_tiers')
        .select('id, creator_id, tier_level, tier_name, price, description, benefits')
        .in('creator_id', creatorIds);

      for (const s of supporterOnly) {
        const creator = creatorMap.get(s.creator_id);
        const tier = (tierRows || []).find(
          (t: any) => t.creator_id === s.creator_id && t.tier_level === s.tier_level
        );
        enrichedFromSupporters.push({
          id: `supporters:${s.id}`,
          supporterId: s.supporter_id,
          creatorId: s.creator_id,
          isSupportOnly: true,
          creator: {
            id: creator?.id,
            displayName: creator?.display_name || 'Unknown Creator',
            avatarUrl: creator?.photo_url,
          },
          tier: {
            level: s.tier_level,
            name: (tier as any)?.tier_name || `Tier ${s.tier_level}`,
            price: (tier as any)?.price ?? s.amount,
            description: (tier as any)?.description,
            benefits: (tier as any)?.benefits || [],
          },
          amount: s.amount,
          currency: 'NPR',
          paymentGateway: 'direct',
          status: 'active',
          state: 'active' as const,
          billingCycle: 'monthly',
          currentPeriodStart: s.created_at,
          currentPeriodEnd: null,
          daysUntilExpiry: null,
          reminderSentAt: {},
          autoRenew: false,
          renewalCount: 0,
          cancelledAt: null,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        });
      }
    }

    // Transform subscription rows to same shape
    const enrichedSubscriptions = (subscriptions || []).map((sub: any) => {
      const now = new Date();
      const expiryDate = sub.current_period_end ? new Date(sub.current_period_end) : null;
      const daysUntilExpiry = expiryDate
        ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      let state: 'active' | 'expiring_soon' | 'expired' | 'cancelled' = 'active';
      if (sub.status === 'cancelled') state = 'cancelled';
      else if (sub.status === 'expired' || (daysUntilExpiry !== null && daysUntilExpiry <= 0))
        state = 'expired';
      else if (daysUntilExpiry !== null && daysUntilExpiry <= 7) state = 'expiring_soon';

      return {
        id: sub.id,
        supporterId: sub.supporter_id,
        creatorId: sub.creator_id,
        isSupportOnly: false,
        creator: {
          id: sub.creators?.id,
          displayName: sub.creators?.display_name || 'Unknown Creator',
          avatarUrl: sub.creators?.photo_url,
        },
        tier: {
          level: sub.tier_level,
          name: sub.tiers?.tier_name || `Tier ${sub.tier_level}`,
          price: sub.tiers?.price ?? sub.amount,
          description: sub.tiers?.description,
          benefits: sub.tiers?.benefits || [],
        },
        amount: sub.amount,
        currency: sub.currency || 'NPR',
        paymentGateway: sub.payment_gateway,
        status: sub.status,
        state,
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

    const combined = [...enrichedSubscriptions, ...enrichedFromSupporters];

    logger.info('Memberships fetched successfully', 'MY_SUBSCRIPTIONS_API', {
      userId: user.id,
      subscriptionCount: enrichedSubscriptions.length,
      supporterOnlyCount: enrichedFromSupporters.length,
      total: combined.length,
    });

    return NextResponse.json({
      success: true,
      subscriptions: combined,
      count: combined.length,
    });
  } catch (error: unknown) {
    return handleApiError(error, 'MY_SUBSCRIPTIONS_API', 'Failed to fetch subscriptions');
  }
}
