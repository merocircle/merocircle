import { useState, useCallback } from 'react';
import type { StreamChat } from 'stream-chat';

export function useUnreadCounts(chatClient: StreamChat | null, user: { id: string } | null) {
  const [channelUnreadCounts, setChannelUnreadCounts] = useState<Record<string, number>>({});

  const fetchUnreadCounts = useCallback(async () => {
    if (!chatClient || !user) return;

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
    } catch (err) {
      console.error('Failed to fetch unread counts:', err);
    }
  }, [chatClient, user]);

  return {
    channelUnreadCounts,
    fetchUnreadCounts,
  };
}
