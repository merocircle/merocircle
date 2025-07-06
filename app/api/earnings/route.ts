import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const searchParams = request.nextUrl.searchParams;
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a creator
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userProfile?.role !== 'creator') {
      return NextResponse.json(
        { error: 'Only creators can access earnings data' },
        { status: 403 }
      );
    }

    const period = searchParams.get('period') || '12m'; // 7d, 30d, 12m
    
    let startDate: Date;
    const now = new Date();
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '12m':
      default:
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    // Get all earnings data
    const [
      { data: transactions },
      { data: supporters },
      { data: creatorProfile },
      { count: totalSupporters }
    ] = await Promise.all([
      // All transactions in period
      supabase
        .from('supporter_transactions')
        .select(`
          id,
          amount,
          currency,
          status,
          message,
          created_at,
          supporter:users!supporter_transactions_supporter_id_fkey(
            id,
            display_name,
            photo_url
          )
        `)
        .eq('creator_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false }),
      
      // Active supporters
      supabase
        .from('supporters')
        .select(`
          id,
          tier,
          amount,
          created_at,
          supporter:users!supporters_supporter_id_fkey(
            id,
            display_name,
            photo_url
          )
        `)
        .eq('creator_id', user.id)
        .eq('is_active', true)
        .order('amount', { ascending: false }),
      
      // Creator profile for total earnings
      supabase
        .from('creator_profiles')
        .select('total_earnings, supporters_count')
        .eq('user_id', user.id)
        .single(),
      
      // Total supporters count
      supabase
        .from('supporters')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user.id)
        .eq('is_active', true)
    ]);

    // Calculate period earnings
    const periodEarnings = transactions?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
    
    // Calculate daily/monthly breakdown
    const earningsBreakdown: { [key: string]: number } = {};
    
    transactions?.forEach(transaction => {
      let key: string;
      const date = new Date(transaction.created_at);
      
      if (period === '7d' || period === '30d') {
        // Daily breakdown for short periods
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
      } else {
        // Monthly breakdown for longer periods
        key = date.toISOString().substring(0, 7); // YYYY-MM
      }
      
      earningsBreakdown[key] = (earningsBreakdown[key] || 0) + parseFloat(transaction.amount);
    });

    // Calculate growth metrics
    const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
    
    const { data: previousTransactions } = await supabase
      .from('supporter_transactions')
      .select('amount')
      .eq('creator_id', user.id)
      .eq('status', 'completed')
      .gte('created_at', previousPeriodStart.toISOString())
      .lt('created_at', startDate.toISOString());

    const previousPeriodEarnings = previousTransactions?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
    const growthRate = previousPeriodEarnings > 0 
      ? ((periodEarnings - previousPeriodEarnings) / previousPeriodEarnings) * 100 
      : 0;

    // Top supporters by total contribution
    const supporterTotals: { [key: string]: any } = {};
    transactions?.forEach(transaction => {
      const supporterId = transaction.supporter?.id;
      if (supporterId) {
        if (!supporterTotals[supporterId]) {
          supporterTotals[supporterId] = {
            supporter: transaction.supporter,
            totalAmount: 0,
            transactionCount: 0,
            lastSupport: transaction.created_at
          };
        }
        supporterTotals[supporterId].totalAmount += parseFloat(transaction.amount);
        supporterTotals[supporterId].transactionCount += 1;
      }
    });

    const topSupporters = Object.values(supporterTotals)
      .sort((a: any, b: any) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    // Calculate tier distribution
    const tierDistribution = supporters?.reduce((acc: any, supporter) => {
      acc[supporter.tier] = (acc[supporter.tier] || 0) + 1;
      return acc;
    }, {}) || {};

    const response = {
      summary: {
        totalEarnings: creatorProfile?.total_earnings || 0,
        periodEarnings,
        totalSupporters: totalSupporters || 0,
        activeSupporters: supporters?.length || 0,
        growthRate: Math.round(growthRate * 100) / 100,
        averageSupport: supporters?.length > 0 
          ? Math.round((periodEarnings / supporters.length) * 100) / 100 
          : 0
      },
      earningsBreakdown,
      recentTransactions: transactions?.slice(0, 20) || [],
      topSupporters,
      tierDistribution,
      supporters: supporters || [],
      period
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching earnings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 