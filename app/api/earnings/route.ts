import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateTotalAmount } from '@/lib/api-helpers';
import { getAuthenticatedUser, requireCreatorRole, handleApiError } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { isCreator, errorResponse: roleError } = await requireCreatorRole(user.id);
    if (roleError) return roleError;

    logger.info('Fetch earnings', 'EARNINGS_API', { userId: user.id });
    const supabase = await createClient();

    const { data: transactions } = await supabase
      .from('supporter_transactions')
      .select('amount, created_at, supporter_id')
      .eq('creator_id', user.id)
      .eq('status', 'completed');

    const totalEarnings = calculateTotalAmount(transactions || []);
    const uniqueSupporters = new Set(transactions?.map(t => t.supporter_id) || []).size;

    return NextResponse.json({
      summary: {
        totalEarnings,
        totalSupporters: uniqueSupporters,
        averageSupport: uniqueSupporters > 0 ? totalEarnings / uniqueSupporters : 0
      },
      recentTransactions: (transactions || []).slice(0, 10)
    });
  } catch (error) {
    return handleApiError(error, 'EARNINGS_API', 'Failed to fetch earnings');
  }
} 
