import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';

interface SupportedCreator {
  id: string;
  name: string;
  photo_url: string | null;
  category: string | null;
  bio: string | null;
  is_verified: boolean;
  supporters_count: number;
  total_earnings: number;
  totalSupported: number;
  transactionCount: number;
  lastSupportDate: string;
}

interface SupportHistory {
  id: string;
  creator: {
    id: string;
    name: string;
    photo_url: string | null;
  };
  amount: number;
  message: string | null;
  status: string;
  date: string;
}

export function useSupportedCreators() {
  const { user } = useAuth();

  return useQuery<{ creators: SupportedCreator[] }>({
    queryKey: ['supporter', 'creators', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/supporter/creators');
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to view your supported creators');
        }
        throw new Error('Failed to fetch supported creators');
      }

      return response.json();
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}

export function useSupportHistory(limit = 20) {
  const { user } = useAuth();
  const [history, setHistory] = useState<SupportHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchSupportHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/supporter/history?limit=${limit}`);
        
        if (!response.ok) {
          if (response.status === 401) {
            setError('Please log in to view your support history');
          } else {
            setError('Failed to fetch support history');
          }
          return;
        }

        const data = await response.json();
        setHistory(data.history || []);
      } catch (err) {
        console.error('Error fetching support history:', err);
        setError('Error loading support history');
      } finally {
        setLoading(false);
      }
    };

    fetchSupportHistory();
  }, [user, limit]);

  const refetch = useCallback(() => {
    if (user) {
      setLoading(true);
    }
  }, [user]);

  return { history, loading, error, refetch };
} 