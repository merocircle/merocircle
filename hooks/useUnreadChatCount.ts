'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/supabase-auth-context';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

const LAST_VIEWED_KEY = 'chat_last_viewed_timestamp';

export function useUnreadChatCount() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      // Get last viewed timestamp from localStorage
      const lastViewedStr = localStorage.getItem(LAST_VIEWED_KEY);
      const lastViewed = lastViewedStr ? new Date(lastViewedStr) : null;

      const params = new URLSearchParams();
      if (lastViewed) {
        params.append('lastViewed', lastViewed.toISOString());
      }

      const response = await fetch(`/api/chat/unread-count?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }

      const data = await response.json();
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Error fetching unread chat count:', err);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mark messages as read (update last viewed timestamp)
  const markAsRead = useCallback(() => {
    if (!user) return;
    
    const now = new Date().toISOString();
    localStorage.setItem(LAST_VIEWED_KEY, now);
    setUnreadCount(0);
  }, [user]);

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
      .channel(`chat_unread:${user.id}`)
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
            // Get last viewed timestamp
            const lastViewedStr = localStorage.getItem(LAST_VIEWED_KEY);
            const lastViewed = lastViewedStr ? new Date(lastViewedStr) : null;
            const messageTime = new Date(message.created_at);
            
            // If message is newer than last viewed, refetch count
            // Add a small buffer (1 second) to account for timing differences
            if (!lastViewed || messageTime > new Date(lastViewed.getTime() + 1000)) {
              // Debounce refetch to avoid too many calls
              setTimeout(() => {
                fetchUnreadCount();
              }, 500);
            }
          }
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('[REALTIME] Chat unread subscription error:', err);
        }
        if (status === 'SUBSCRIBED') {
          console.log('[REALTIME] Subscribed to chat unread updates');
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
  }, [user, fetchUnreadCount]);

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Poll periodically as a fallback
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  return {
    unreadCount,
    loading,
    markAsRead,
    refetch: fetchUnreadCount,
  };
}
