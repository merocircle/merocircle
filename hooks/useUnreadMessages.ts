import { useState, useEffect, useCallback, useRef } from 'react';
import { useStreamChat } from '@/contexts/stream-chat-context';
import { useAuth } from '@/contexts/auth-context';
import { logger } from '@/lib/logger';

/**
 * Hook to get total unread messages count across all channels
 * Returns the sum of unread messages from all channels the user is a member of
 */
export function useUnreadMessages() {
  const { chatClient, isConnected } = useStreamChat();
  const { user } = useAuth();
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const lastFetchRef = useRef<number>(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!chatClient || !isConnected || !user) return;

    // Throttle requests to prevent rate limiting (max once per 2 seconds)
    const now = Date.now();
    if (now - lastFetchRef.current < 2000) {
      return;
    }
    lastFetchRef.current = now;

    setIsLoading(true);
    try {
      const filter = {
        type: 'messaging',
        members: { $in: [user.id] },
      };

      const channels = await chatClient.queryChannels(filter, {}, { limit: 50, state: true });

      let totalCount = 0;
      for (const channel of channels) {
        const unreadCount = channel.state.unreadCount || 0;
        totalCount += unreadCount;
      }

      setTotalUnreadCount(totalCount);
    } catch (err: any) {
      if (err?.code !== 9) { // Ignore rate limit errors
        logger.error('Failed to fetch unread messages count', 'USE_UNREAD_MESSAGES', { 
          error: err?.message ?? String(err) 
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [chatClient, isConnected, user]);

  // Initial fetch and periodic updates
  useEffect(() => {
    if (isConnected && user) {
      fetchUnreadCount();
    }
  }, [isConnected, user, fetchUnreadCount]);

  // Listen for new messages and read events to update count
  useEffect(() => {
    if (!chatClient) return;

    let debounceTimer: NodeJS.Timeout;
    
    const handleNewMessage = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchUnreadCount();
      }, 500); // Debounce by 500ms
    };

    const handleMarkRead = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchUnreadCount();
      }, 500);
    };

    // Listen for events that affect unread count
    chatClient.on('message.new', handleNewMessage);
    chatClient.on('notification.message_new', handleNewMessage);
    chatClient.on('notification.mark_read', handleMarkRead);

    return () => {
      clearTimeout(debounceTimer);
      chatClient.off('message.new', handleNewMessage);
      chatClient.off('notification.message_new', handleNewMessage);
      chatClient.off('notification.mark_read', handleMarkRead);
    };
  }, [chatClient, fetchUnreadCount]);

  return {
    totalUnreadCount,
    isLoading,
    refetch: fetchUnreadCount,
  };
}
