import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser, handleApiError } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

/**
 * Get renewal info for the current user + creator (for ?renew=true flow).
 * Returns the payment gateway and tier/amount they used before so we can send them
 * straight to eSewa, Khalti, Dodo, or direct renewal.
 *
 * GET /api/subscriptions/renewal-info?creatorId=xxx&subscription_id=optional
 */
export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) {
      return errorResponse ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creatorId');
    const subscriptionId = searchParams.get('subscription_id');

    if (!creatorId) {
      return NextResponse.json({ error: 'creatorId is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // If user already has an active subscription/support for this creator, no need to renew
    const { data: activeSupport } = await supabase
      .from('supporters')
      .select('id')
      .eq('supporter_id', user.id)
      .eq('creator_id', creatorId)
      .eq('is_active', true)
      .maybeSingle();

    if (activeSupport) {
      return NextResponse.json({
        success: true,
        alreadyActive: true,
        message: 'Your subscription is still active',
      });
    }

    // If subscription_id provided, use that subscription (must belong to user + creator)
    if (subscriptionId) {
      const { data: sub, error } = await supabase
        .from('subscriptions')
        .select('id, supporter_id, creator_id, tier_level, amount, payment_gateway')
        .eq('id', subscriptionId)
        .eq('supporter_id', user.id)
        .eq('creator_id', creatorId)
        .single();

      if (!error && sub) {
        return NextResponse.json({
          success: true,
          renewal: {
            gateway: sub.payment_gateway,
            tierLevel: sub.tier_level,
            amount: Number(sub.amount),
            subscriptionId: sub.id,
            creatorId: sub.creator_id,
            supporterId: sub.supporter_id,
          },
        });
      }
    }

    // No subscription_id or not found: get last subscription for (user, creator) any status
    const { data: lastSub } = await supabase
      .from('subscriptions')
      .select('id, tier_level, amount, payment_gateway')
      .eq('supporter_id', user.id)
      .eq('creator_id', creatorId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastSub) {
      return NextResponse.json({
        success: true,
        renewal: {
          gateway: lastSub.payment_gateway,
          tierLevel: lastSub.tier_level,
          amount: Number(lastSub.amount),
          subscriptionId: lastSub.id,
          creatorId,
          supporterId: user.id,
        },
      });
    }

    // No subscription row: get last completed transaction for (user, creator)
    const { data: lastTx } = await supabase
      .from('supporter_transactions')
      .select('payment_method, tier_level, amount')
      .eq('supporter_id', user.id)
      .eq('creator_id', creatorId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastTx) {
      const gateway = lastTx.payment_method === 'bank_transfer' ? 'direct' : lastTx.payment_method;
      return NextResponse.json({
        success: true,
        renewal: {
          gateway,
          tierLevel: lastTx.tier_level ?? 1,
          amount: Number(lastTx.amount),
          subscriptionId: null,
          creatorId,
          supporterId: user.id,
        },
      });
    }

    logger.info('No renewal info found', 'RENEWAL_INFO', { userId: user.id, creatorId });
    return NextResponse.json({ success: false, renewal: null }, { status: 404 });
  } catch (error) {
    return handleApiError(error, 'RENEWAL_INFO', 'Failed to get renewal info');
  }
}
