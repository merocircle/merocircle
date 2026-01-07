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
        
        // Fetch earnings data
        const earningsResponse = await fetch('/api/earnings?period=30d');
        
        if (earningsResponse.status === 401) {
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
        
        // Fetch profile data
        const profileResponse = await fetch(`/api/profiles/${user.id}`);
        
        if (profileResponse.status === 401) {
          setError('Your session has expired. Please log in again.');
          setLoading(false);
          return;
        }
        
        if (!profileResponse.ok) {
          const errorData = await profileResponse.json();
          setError(errorData.error || 'Failed to fetch profile data');
          setLoading(false);
          return;
        }
        
        const profileData = await profileResponse.json();
        
        if (earningsResponse.ok && profileResponse.ok) {
          setStats({
            monthlyEarnings: earningsData.currentPeriod?.totalEarnings || 0,
            totalEarnings: earningsData.totalEarnings || 0,
            supporters: profileData.stats?.followersCount || 0,
            posts: profileData.stats?.postsCount || 0,
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
        } else {
          setError('Failed to fetch dashboard data');
        }
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
        
        // Fetch supporter profile data
        const profileResponse = await fetch(`/api/profiles/${user.id}`);
        
        if (profileResponse.status === 401) {
          setError('Your session has expired. Please log in again.');
          setLoading(false);
          return;
        }
        
        if (!profileResponse.ok) {
          const errorData = await profileResponse.json();
          setError(errorData.error || 'Failed to fetch supporter data');
          setLoading(false);
          return;
        }
        
        const profileData = await profileResponse.json();
        
        // Calculate stats from profile data
        const supporterTransactions = profileData.supporterTransactions || [];
        const totalSupported = supporterTransactions.reduce((sum: number, t: any) => sum + t.amount, 0);
        const thisMonthStart = new Date();
        thisMonthStart.setDate(1);
        const thisMonth = supporterTransactions
          .filter((t: any) => new Date(t.created_at) >= thisMonthStart)
          .reduce((sum: number, t: any) => sum + t.amount, 0);
        
        setStats({
          totalSupported,
          creatorsSupported: profileData.stats?.followingCount || 0,
          thisMonth,
          favoriteCreators: profileData.stats?.followingCount || 0
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
