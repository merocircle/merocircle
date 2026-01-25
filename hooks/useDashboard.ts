import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/supabase-auth-context';

interface DashboardStats {
  monthlyEarnings: number;
  totalEarnings: number;
  supporters: number;
  posts: number;
  goals: {
    monthly: number;
    current: number;
  };
  growth: {
    earnings: number;
    supporters: number;
    engagement: number;
  };
}

interface SupporterStats {
  totalSupported: number;
  creatorsSupported: number;
  thisMonth: number;
  favoriteCreators: number;
}

export function useCreatorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCreatorStats = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch earnings and dashboard data in parallel
      const [earningsResponse, dashboardResponse] = await Promise.all([
        fetch('/api/earnings?period=30d'),
        fetch(`/api/creator/${user.id}/dashboard`)
      ]);

      if (earningsResponse.status === 401 || dashboardResponse.status === 401) {
        setError('Your session has expired. Please log in again.');
        setLoading(false);
        return;
      }

      if (!earningsResponse.ok) {
        const errorData = await earningsResponse.json();
        setError(errorData.error || 'Failed to fetch earnings data');
        setLoading(false);
        return;
      }

      const earningsData = await earningsResponse.json();

      // Dashboard endpoint might return 404 for non-creators, handle gracefully
      let dashboardData = { stats: { supporters: 0, posts: 0 } };
      if (dashboardResponse.ok) {
        dashboardData = await dashboardResponse.json();
      }

      setStats({
        monthlyEarnings: earningsData.currentPeriod?.totalEarnings || 0,
        totalEarnings: earningsData.totalEarnings || 0,
        supporters: dashboardData.stats?.supporters || 0,
        posts: dashboardData.stats?.posts || 0,
        goals: {
          monthly: 50000, // This could be fetched from user preferences
          current: earningsData.currentPeriod?.totalEarnings || 0
        },
        growth: {
          earnings: earningsData.growth?.earnings || 0,
          supporters: earningsData.growth?.supporters || 0,
          engagement: 15.7 // This could be calculated from post engagement
        }
      });
    } catch (err) {
      setError('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCreatorStats();
  }, [fetchCreatorStats]);

  return { stats, loading, error, refetch: fetchCreatorStats };
}

export function useSupporterDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SupporterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSupporterStats = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Use the supporter-specific endpoints
      const [creatorsResponse, historyResponse] = await Promise.all([
        fetch('/api/supporter/creators'),
        fetch('/api/supporter/history?limit=100')
      ]);

      if (creatorsResponse.status === 401 || historyResponse.status === 401) {
        setError('Your session has expired. Please log in again.');
        setLoading(false);
        return;
      }

      // Handle creators response
      let creatorsData = { creators: [] };
      if (creatorsResponse.ok) {
        creatorsData = await creatorsResponse.json();
      }

      // Handle history response
      let historyData = { transactions: [] };
      if (historyResponse.ok) {
        historyData = await historyResponse.json();
      }

      // Calculate stats from transaction history
      const transactions = historyData.transactions || [];
      const totalSupported = transactions.reduce((sum: number, t: { amount?: number }) => sum + (t.amount || 0), 0);
      const thisMonthStart = new Date();
      thisMonthStart.setDate(1);
      thisMonthStart.setHours(0, 0, 0, 0);
      const thisMonth = transactions
        .filter((t: { created_at?: string }) => new Date(t.created_at || '') >= thisMonthStart)
        .reduce((sum: number, t: { amount?: number }) => sum + (t.amount || 0), 0);

      const creatorsCount = creatorsData.creators?.length || 0;

      setStats({
        totalSupported,
        creatorsSupported: creatorsCount,
        thisMonth,
        favoriteCreators: creatorsCount
      });
    } catch (err) {
      setError('Error loading supporter data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSupporterStats();
  }, [fetchSupporterStats]);

  return { stats, loading, error, refetch: fetchSupporterStats };
}
