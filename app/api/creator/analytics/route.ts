import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser, requireCreatorRole, handleApiError } from '@/lib/api-utils';

export async function GET() {
  try {
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { isCreator, errorResponse: roleError } = await requireCreatorRole(user.id);
    if (roleError) return roleError;

    const supabase = await createClient();

    // Get current stats
    const { data: stats } = await supabase
      .from('creator_profiles')
      .select('total_earnings, supporters_count, posts_count, likes_count')
      .eq('user_id', user.id)
      .single();

    // Get earnings by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: transactions } = await supabase
      .from('supporter_transactions')
      .select('amount, created_at, completed_at')
      .eq('creator_id', user.id)
      .eq('status', 'completed')
      .gte('completed_at', sixMonthsAgo.toISOString())
      .order('completed_at', { ascending: true });

    // Group earnings by month
    const monthlyEarnings: Record<string, number> = {};
    (transactions || []).forEach((t: any) => {
      const date = new Date(t.completed_at || t.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyEarnings[monthKey] = (monthlyEarnings[monthKey] || 0) + Number(t.amount);
    });

    // Format for chart
    const earningsChart = Object.entries(monthlyEarnings).map(([month, amount]) => {
      const [year, monthNum] = month.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return {
        month: monthNames[parseInt(monthNum) - 1],
        earnings: amount
      };
    });

    // Get supporter growth (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentTransactions } = await supabase
      .from('supporter_transactions')
      .select('supporter_id, completed_at, created_at')
      .eq('creator_id', user.id)
      .eq('status', 'completed')
      .gte('completed_at', thirtyDaysAgo.toISOString())
      .order('completed_at', { ascending: true });

    // Count new supporters per day
    const supportersByDay: Record<string, Set<string>> = {};
    (recentTransactions || []).forEach((t: any) => {
      const date = new Date(t.completed_at || t.created_at);
      const dayKey = date.toISOString().split('T')[0];
      if (!supportersByDay[dayKey]) {
        supportersByDay[dayKey] = new Set();
      }
      supportersByDay[dayKey].add(t.supporter_id);
    });

    const supporterFlowChart = Object.entries(supportersByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, supporters]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        supporters: supporters.size
      }));

    // Get engagement stats (likes and comments on posts)
    const { data: posts } = await supabase
      .from('posts')
      .select(`
        id,
        created_at,
        post_likes(id),
        post_comments(id)
      `)
      .eq('creator_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    const engagementByDay: Record<string, { likes: number; comments: number }> = {};
    (posts || []).forEach((post: any) => {
      const date = new Date(post.created_at);
      const dayKey = date.toISOString().split('T')[0];
      if (!engagementByDay[dayKey]) {
        engagementByDay[dayKey] = { likes: 0, comments: 0 };
      }
      engagementByDay[dayKey].likes += (post.post_likes || []).length;
      engagementByDay[dayKey].comments += (post.post_comments || []).length;
    });

    const engagementChart = Object.entries(engagementByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        likes: data.likes,
        comments: data.comments
      }));

    // Calculate this month vs last month
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonth = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;

    const currentMonthEarnings = monthlyEarnings[currentMonth] || 0;
    const lastMonthEarnings = monthlyEarnings[lastMonth] || 0;
    const earningsGrowth = lastMonthEarnings > 0
      ? ((currentMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100
      : 0;

    // Get top supporters
    const { data: topSupporters } = await supabase
      .from('supporter_transactions')
      .select(`
        supporter_id,
        amount,
        users!supporter_transactions_supporter_id_fkey(display_name, photo_url)
      `)
      .eq('creator_id', user.id)
      .eq('status', 'completed')
      .order('amount', { ascending: false })
      .limit(5);

    // Aggregate by supporter
    const supporterTotals = new Map();
    (topSupporters || []).forEach((t: any) => {
      const existing = supporterTotals.get(t.supporter_id) || { amount: 0, user: t.users };
      supporterTotals.set(t.supporter_id, {
        amount: existing.amount + Number(t.amount),
        user: t.users
      });
    });

    const topSupportersList = Array.from(supporterTotals.entries())
      .sort(([, a], [, b]) => b.amount - a.amount)
      .slice(0, 5)
      .map(([id, data]) => ({
        id,
        name: data.user?.display_name || 'Anonymous',
        photo_url: data.user?.photo_url || null,
        total_amount: data.amount
      }));

    return NextResponse.json({
      stats: {
        totalEarnings: stats?.total_earnings || 0,
        supporters: stats?.supporters_count || 0,
        posts: stats?.posts_count || 0,
        likes: stats?.likes_count || 0,
        currentMonthEarnings,
        earningsGrowth: Math.round(earningsGrowth * 10) / 10
      },
      charts: {
        earnings: earningsChart,
        supporterFlow: supporterFlowChart,
        engagement: engagementChart
      },
      topSupporters: topSupportersList
    });
  } catch (error) {
    return handleApiError(error, 'CREATOR_ANALYTICS_API', 'Failed to fetch analytics');
  }
}
