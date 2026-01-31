'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { throttledPrefetch, shouldPrefetch } from '@/lib/prefetch-utils';

/**
 * Hook to prefetch data for routes before navigation
 * Implements intelligent caching and error handling
 */
export function useRoutePrefetch() {
  const queryClient = useQueryClient();

  const prefetchHome = useCallback(() => {
    // Check if we should prefetch
    if (!shouldPrefetch()) return;

    // Check if data is already cached and fresh
    const cached = queryClient.getQueryState(['discovery-feed']);
    if (cached?.data && Date.now() - (cached.dataUpdatedAt || 0) < 30000) {
      return; // Data is fresh, no need to prefetch
    }

    // Throttled prefetch
    throttledPrefetch('home', async () => {
      try {
        await queryClient.prefetchQuery({
          queryKey: ['discovery-feed'],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('is_creator', true)
              .limit(20);
            
            if (error) throw error;
            return data;
          },
          staleTime: 30000,
        });
      } catch (error) {
        console.warn('Failed to prefetch home data:', error);
      }
    })();
  }, [queryClient]);

  const prefetchNotifications = useCallback(() => {
    // Check if we should prefetch
    if (!shouldPrefetch()) return;

    // Check if data is already cached and fresh
    const cached = queryClient.getQueryState(['notifications']);
    if (cached?.data && Date.now() - (cached.dataUpdatedAt || 0) < 10000) {
      return; // Data is fresh, no need to prefetch
    }

    // Throttled prefetch
    throttledPrefetch('notifications', async () => {
      try {
        await queryClient.prefetchQuery({
          queryKey: ['notifications'],
          queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];
            
            const { data, error } = await supabase
              .from('notifications')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(20);
            
            if (error) throw error;
            return data;
          },
          staleTime: 10000,
        });
      } catch (error) {
        console.warn('Failed to prefetch notifications:', error);
      }
    })();
  }, [queryClient]);

  const prefetchChat = useCallback(() => {
    // Stream Chat handles its own caching and prefetching
    // No action needed
  }, []);

  return {
    prefetchHome,
    prefetchNotifications,
    prefetchChat,
  };
}
