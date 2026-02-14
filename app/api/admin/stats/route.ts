import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser, handleApiError } from '@/lib/api-utils';
import { requireAdmin } from '@/lib/admin-middleware';
import { logger } from '@/lib/logger';

/**
 * GET /api/admin/stats
 * Get admin dashboard statistics
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

    // Get current month start
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Parallel queries for better performance
    const [
      pendingOnboardings,
      allTransactions,
      thisMonthTransactions,
      allEarnings,
      thisMonthEarnings,
      pendingPayouts
    ] = await Promise.all([
      // Count pending onboardings
      supabase
        .from('creator_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('onboarding_completed', false),
      
      // All time transactions (completed)
      supabase
        .from('supporter_transactions')
        .select('amount')
        .eq('status', 'completed'),
      
      // This month transactions (completed)
      supabase
        .from('supporter_transactions')
        .select('amount')
        .eq('status', 'completed')
        .gte('created_at', monthStart),
      
      // All time platform earnings
      supabase
        .from('platform_earnings')
        .select('platform_amount, creator_amount'),
      
      // This month platform earnings
      supabase
        .from('platform_earnings')
        .select('platform_amount, creator_amount')
        .gte('created_at', monthStart),
      
      // Pending payouts (status = pending or processing)
      supabase
        .from('creator_payouts')
        .select('amount')
        .in('status', ['pending', 'processing'])
    ]);

    // Calculate totals
    const stats = {
      pendingOnboardings: pendingOnboardings.count || 0,
      
      transactions: {
        allTime: {
          count: allTransactions.data?.length || 0,
          total: allTransactions.data?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0
        },
        thisMonth: {
          count: thisMonthTransactions.data?.length || 0,
          total: thisMonthTransactions.data?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0
        }
      },
      
      platformEarnings: {
        allTime: {
          platform: allEarnings.data?.reduce((sum, e) => sum + parseFloat(e.platform_amount), 0) || 0,
          creators: allEarnings.data?.reduce((sum, e) => sum + parseFloat(e.creator_amount), 0) || 0
        },
        thisMonth: {
          platform: thisMonthEarnings.data?.reduce((sum, e) => sum + parseFloat(e.platform_amount), 0) || 0,
          creators: thisMonthEarnings.data?.reduce((sum, e) => sum + parseFloat(e.creator_amount), 0) || 0
        }
      },
      
      pendingPayouts: {
        count: pendingPayouts.data?.length || 0,
        total: pendingPayouts.data?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0
      }
    };

    // Get unpaid transactions summary by creator
    const { data: unpaidTransactions } = await supabase
      .from('supporter_transactions')
      .select(`
        creator_id,
        amount,
        creator:users!creator_id(id, display_name, email)
      `)
      .eq('status', 'completed')
      .eq('payout_status', 'pending');

    // Group by creator
    const creatorEarnings = new Map();
    (unpaidTransactions || []).forEach((txn) => {
      const creator = Array.isArray(txn.creator) ? txn.creator[0] : txn.creator;
      if (!creator) return;

      if (!creatorEarnings.has(txn.creator_id)) {
        creatorEarnings.set(txn.creator_id, {
          creatorId: txn.creator_id,
          displayName: creator.display_name,
          email: creator.email,
          unpaidAmount: 0,
          transactionCount: 0
        });
      }

      const entry = creatorEarnings.get(txn.creator_id);
      entry.unpaidAmount += parseFloat(txn.amount) * 0.95; // 95% goes to creator
      entry.transactionCount += 1;
    });

    const unpaidByCreator = Array.from(creatorEarnings.values())
      .sort((a, b) => b.unpaidAmount - a.unpaidAmount);

    logger.info('Fetched admin stats', 'ADMIN_STATS_API', {
      pendingOnboardings: stats.pendingOnboardings,
      thisMonthTransactions: stats.transactions.thisMonth.count,
      adminUserId: user.id
    });

    return NextResponse.json({
      success: true,
      stats,
      unpaidByCreator
    });
  } catch (error) {
    return handleApiError(error, 'ADMIN_STATS_API', 'Failed to fetch admin stats');
  }
}
