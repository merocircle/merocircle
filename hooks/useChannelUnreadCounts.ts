'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/supabase-auth-context';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

const LAST_VIEWED_KEY = 'channel_last_viewed_timestamps';

export function useChannelUnreadCounts() {
  const { user } = useAuth();
  const [channelUnreadCounts, setChannelUnreadCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const getLastViewedMap = useCallback((): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem(LAST_VIEWED_KEY);
    if (!stored) return {};
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }, []);

  const setLastViewedForChannel = useCallback((channelId: string, timestamp: string) => {
    if (typeof window === 'undefined') return;
    const map = getLastViewedMap();
    map[channelId] = timestamp;
    localStorage.setItem(LAST_VIEWED_KEY, JSON.stringify(map));
  }, [getLastViewedMap]);

  const fetchChannelUnreadCounts = useCallback(async () => {
    if (!user) {
      setChannelUnreadCounts({});
      setLoading(false);
      return;
    }

    try {
      const lastViewedMap = getLastViewedMap();
      const params = new URLSearchParams();
      if (Object.keys(lastViewedMap).length > 0) {
        params.append('lastViewed', JSON.stringify(lastViewedMap));
      }

      const response = await fetch(`/api/chat/channel-unread-counts?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch channel unread counts');
      }

      const data = await response.json();
      setChannelUnreadCounts(data.channelUnreadCounts || {});
    } catch (err) {
      console.error('Error fetching channel unread counts:', err);
      setChannelUnreadCounts({});
    } finally {
      setLoading(false);
    }
  }, [user, getLastViewedMap]);

  // Mark a specific channel as read
  const markChannelAsRead = useCallback((channelId: string) => {
    if (!user) return;
    
    const now = new Date().toISOString();
    setLastViewedForChannel(channelId, now);
    
    // Update local state
    setChannelUnreadCounts((prev) => ({
      ...prev,
      [channelId]: 0,
    }));
  }, [user, setLastViewedForChannel]);

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!user) {
      return;
    }

    // Clean up previous subscription
    if (channelRef.current) {
      const oldChannel = channelRef.current;
      oldChannel.unsubscribe().then(() => {
        supabase.removeChannel(oldChannel);
      }).catch(() => {
        supabase.removeChannel(oldChannel);
      });
      channelRef.current = null;
    }

    // Subscribe to all new messages across all channels
    const channel = supabase
      .channel(`channel_unread:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'channel_messages',
        },
        (payload) => {
          const message = payload.new;
          // Only count messages from other users
          if (message.user_id !== user.id) {
            const channelId = message.channel_id;
            const lastViewedMap = getLastViewedMap();
            const lastViewed = lastViewedMap[channelId] ? new Date(lastViewedMap[channelId]) : null;
            const messageTime = new Date(message.created_at);
            
            // If message is newer than last viewed, increment count
            if (!lastViewed || messageTime > new Date(lastViewed.getTime() + 1000)) {
              // Debounce refetch to avoid too many calls
              setTimeout(() => {
                fetchChannelUnreadCounts();
              }, 500);
            }
          }
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('[REALTIME] Channel unread subscription error:', err);
        }
        if (status === 'SUBSCRIBED') {
          console.log('[REALTIME] Subscribed to channel unread updates');
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        const channelToClean = channelRef.current;
        channelToClean.unsubscribe().then(() => {
          supabase.removeChannel(channelToClean);
        }).catch(() => {
          supabase.removeChannel(channelToClean);
        });
        channelRef.current = null;
      }
    };
  }, [user, fetchChannelUnreadCounts, getLastViewedMap]);

  // Initial fetch
  useEffect(() => {
    fetchChannelUnreadCounts();
  }, [fetchChannelUnreadCounts]);

  // Poll periodically as a fallback
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchChannelUnreadCounts();
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [user, fetchChannelUnreadCounts]);

  return {
    channelUnreadCounts,
    loading,
    markChannelAsRead,
    refetch: fetchChannelUnreadCounts,
  };
}
