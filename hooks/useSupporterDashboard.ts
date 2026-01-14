import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/supabase-auth-context';

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
  const [creators, setCreators] = useState<SupportedCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchSupportedCreators = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/supporter/creators');
        
        if (!response.ok) {
          if (response.status === 401) {
            setError('Please log in to view your supported creators');
          } else {
            setError('Failed to fetch supported creators');
          }
          return;
        }

        const data = await response.json();
        setCreators(data.creators || []);
      } catch (err) {
        console.error('Error fetching supported creators:', err);
        setError('Error loading supported creators');
      } finally {
        setLoading(false);
      }
    };

    fetchSupportedCreators();
  }, [user]);

  const refetch = useCallback(() => {
    if (user) {
      setLoading(true);
    }
  }, [user]);

  return { creators, loading, error, refetch };
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