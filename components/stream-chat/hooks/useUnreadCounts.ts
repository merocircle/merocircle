import { useState, useCallback, useRef } from 'react';
import type { StreamChat } from 'stream-chat';

export function useUnreadCounts(chatClient: StreamChat | null, user: { id: string } | null) {
  const [channelUnreadCounts, setChannelUnreadCounts] = useState<Record<string, number>>({});
  const lastFetchRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);

  const fetchUnreadCounts = useCallback(async () => {
    if (!chatClient || !user) return;

    // Throttle requests to prevent rate limiting (max once per 2 seconds)
    const now = Date.now();
    if (isFetchingRef.current || (now - lastFetchRef.current < 2000)) {
      return;
    }

    isFetchingRef.current = true;
    lastFetchRef.current = now;

    try {
      const filter = {
        type: 'messaging' as const,
        members: { $in: [user.id] },
      };

      const channels = await chatClient.queryChannels(filter, {}, { limit: 50, state: true });

      const counts: Record<string, number> = {};
      for (const channel of channels) {
        if (channel.id) {
          counts[channel.id] = channel.state.unreadCount || 0;
        }
      }

      setChannelUnreadCounts(counts);
    } catch (err: any) {
      // Silently handle rate limiting errors
      if (err?.code !== 9) {
      console.error('Failed to fetch unread counts:', err);
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, [chatClient, user]);

  return {
    channelUnreadCounts,
    fetchUnreadCounts,
  };
}
