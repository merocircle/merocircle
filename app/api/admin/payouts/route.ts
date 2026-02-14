import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser, handleApiError } from '@/lib/api-utils';
import { requireAdmin } from '@/lib/admin-middleware';
import { logger } from '@/lib/logger';

/**
 * GET /api/admin/payouts
 * List all creator payouts
 */
export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) {
      return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin access
    const { isAdmin: userIsAdmin, error: adminError } = await requireAdmin(user.id);
    if (adminError) return adminError;

    const supabase = await createClient();

    // Get all payouts with creator details
    const { data: payouts, error } = await supabase
      .from('creator_payouts')
      .select(`
        id,
        creator_id,
        amount,
        currency,
        payout_method,
        payout_reference,
        notes,
        status,
        period_start,
        period_end,
        transaction_ids,
        created_at,
        completed_at,
        created_by,
        creator:users!creator_id(id, display_name, email, photo_url)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch payouts', 'ADMIN_PAYOUTS_API', { error: error.message });
      return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 });
    }

    // Format response
    const formattedPayouts = (payouts || []).map((payout) => {
      const creator = Array.isArray(payout.creator) ? payout.creator[0] : payout.creator;
      const transactionIds = Array.isArray(payout.transaction_ids) 
        ? payout.transaction_ids 
        : [];

      return {
        id: payout.id,
        creatorId: payout.creator_id,
        creator: creator ? {
          id: creator.id,
          displayName: creator.display_name,
          email: creator.email,
          photoUrl: creator.photo_url
        } : null,
        amount: parseFloat(payout.amount),
        currency: payout.currency,
        payoutMethod: payout.payout_method,
        payoutReference: payout.payout_reference,
        notes: payout.notes,
        status: payout.status,
        periodStart: payout.period_start,
        periodEnd: payout.period_end,
        transactionCount: transactionIds.length,
        transactionIds,
        createdAt: payout.created_at,
        completedAt: payout.completed_at,
        createdBy: payout.created_by
      };
    });

    logger.info('Fetched payouts', 'ADMIN_PAYOUTS_API', {
      count: formattedPayouts.length,
      adminUserId: user.id
    });

    return NextResponse.json({
      success: true,
      payouts: formattedPayouts,
      count: formattedPayouts.length
    });
  } catch (error) {
    return handleApiError(error, 'ADMIN_PAYOUTS_API', 'Failed to fetch payouts');
  }
}

/**
 * POST /api/admin/payouts
 * Create a new payout
 */
export async function POST(request: NextRequest) {
  try {
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) {
      return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin access
    const { isAdmin: userIsAdmin, error: adminError } = await requireAdmin(user.id);
    if (adminError) return adminError;

    const { 
      creatorId, 
      transactionIds, 
      amount, 
      payoutMethod, 
      payoutReference,
      notes,
      periodStart,
      periodEnd 
    } = await request.json();

    // Validate input
    if (!creatorId || !transactionIds || transactionIds.length === 0 || !amount || !payoutMethod) {
      return NextResponse.json({ 
        error: 'Missing required fields: creatorId, transactionIds, amount, payoutMethod' 
      }, { status: 400 });
    }

    const supabase = await createClient();

    // Create payout record
    const { data: payout, error: createError } = await supabase
      .from('creator_payouts')
      .insert({
        creator_id: creatorId,
        amount,
        payout_method: payoutMethod,
        payout_reference: payoutReference,
        notes,
        status: 'pending',
        period_start: periodStart,
        period_end: periodEnd,
        transaction_ids: transactionIds,
        created_by: user.id
      })
      .select()
      .single();

    if (createError) {
      logger.error('Failed to create payout', 'ADMIN_PAYOUTS_API', { 
        error: createError.message,
        creatorId 
      });
      return NextResponse.json({ error: 'Failed to create payout' }, { status: 500 });
    }

    // Update transactions to mark them as included in payout
    const { error: updateError } = await supabase
      .from('supporter_transactions')
      .update({
        payout_id: payout.id,
        payout_status: 'included_in_payout'
      })
      .in('id', transactionIds);

    if (updateError) {
      logger.error('Failed to update transactions for payout', 'ADMIN_PAYOUTS_API', {
        error: updateError.message,
        payoutId: payout.id
      });
      // Note: Payout is created but transactions not updated - admin should retry or manually fix
    }

    logger.info('Payout created successfully', 'ADMIN_PAYOUTS_API', {
      payoutId: payout.id,
      creatorId,
      amount,
      transactionCount: transactionIds.length,
      adminUserId: user.id
    });

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        creatorId: payout.creator_id,
        amount: parseFloat(payout.amount),
        status: payout.status,
        createdAt: payout.created_at
      },
      message: 'Payout created successfully'
    });
  } catch (error) {
    return handleApiError(error, 'ADMIN_PAYOUTS_API', 'Failed to create payout');
  }
}
