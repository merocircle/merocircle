import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser, handleApiError } from '@/lib/api-utils';
import { requireAdmin } from '@/lib/admin-middleware';
import { logger } from '@/lib/logger';

/**
 * GET /api/admin/transactions
 * List all transactions with filters and platform earnings
 * 
 * Query params:
 * - status: filter by transaction status
 * - creator_id: filter by creator
 * - date_from: filter by start date
 * - date_to: filter by end date
 * - payout_status: filter by payout status
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
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const creatorId = searchParams.get('creator_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const payoutStatus = searchParams.get('payout_status');

    // Build query
    let query = supabase
      .from('supporter_transactions')
      .select(`
        id,
        supporter_id,
        creator_id,
        amount,
        currency,
        payment_method,
        status,
        payout_status,
        payout_id,
        tier_level,
        supporter_message,
        created_at,
        completed_at,
        metadata,
        supporter:users!supporter_id(id, display_name, email, photo_url),
        creator:users!creator_id(id, display_name, email, photo_url)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (creatorId) {
      query = query.eq('creator_id', creatorId);
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }
    if (payoutStatus) {
      query = query.eq('payout_status', payoutStatus);
    }

    const { data: transactions, error: transactionsError } = await query;

    if (transactionsError) {
      logger.error('Failed to fetch transactions', 'ADMIN_TRANSACTIONS_API', { 
        error: transactionsError.message 
      });
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    // Get platform earnings for these transactions
    const transactionIds = (transactions || []).map(t => t.id);
    
    const { data: earnings, error: earningsError } = await supabase
      .from('platform_earnings')
      .select('*')
      .in('transaction_id', transactionIds);

    if (earningsError) {
      logger.warn('Failed to fetch platform earnings', 'ADMIN_TRANSACTIONS_API', {
        error: earningsError.message
      });
    }

    // Create earnings map for quick lookup
    const earningsMap = new Map(
      (earnings || []).map(e => [e.transaction_id, e])
    );

    // Format response with platform earnings
    const formattedTransactions = (transactions || []).map((txn) => {
      const supporter = Array.isArray(txn.supporter) ? txn.supporter[0] : txn.supporter;
      const creator = Array.isArray(txn.creator) ? txn.creator[0] : txn.creator;
      const earning = earningsMap.get(txn.id);

      return {
        id: txn.id,
        amount: parseFloat(txn.amount),
        currency: txn.currency,
        paymentMethod: txn.payment_method,
        status: txn.status,
        payoutStatus: txn.payout_status || 'pending',
        payoutId: txn.payout_id,
        tierLevel: txn.tier_level,
        message: txn.supporter_message,
        createdAt: txn.created_at,
        completedAt: txn.completed_at,
        supporter: supporter ? {
          id: supporter.id,
          displayName: supporter.display_name,
          email: supporter.email,
          photoUrl: supporter.photo_url
        } : null,
        creator: creator ? {
          id: creator.id,
          displayName: creator.display_name,
          email: creator.email,
          photoUrl: creator.photo_url
        } : null,
        platformEarnings: earning ? {
          platformCut: parseFloat(earning.platform_amount),
          creatorShare: parseFloat(earning.creator_amount),
          platformCutPercentage: parseFloat(earning.platform_cut_percentage)
        } : null
      };
    });

    logger.info('Fetched transactions for admin', 'ADMIN_TRANSACTIONS_API', {
      count: formattedTransactions.length,
      filters: { status, creatorId, dateFrom, dateTo, payoutStatus },
      adminUserId: user.id
    });

    return NextResponse.json({
      success: true,
      transactions: formattedTransactions,
      count: formattedTransactions.length
    });
  } catch (error) {
    return handleApiError(error, 'ADMIN_TRANSACTIONS_API', 'Failed to fetch transactions');
  }
}
