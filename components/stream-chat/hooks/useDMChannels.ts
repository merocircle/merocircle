import { useState, useCallback } from 'react';
import type { StreamChat } from 'stream-chat';
import type { DMChannel } from '../types';

export function useDMChannels(chatClient: StreamChat | null, user: { id: string } | null) {
  const [dmChannels, setDmChannels] = useState<DMChannel[]>([]);

  const fetchDMChannels = useCallback(async () => {
    if (!chatClient || !user) return;

    try {
      const filter = {
        type: 'messaging' as const,
        members: { $in: [user.id] },
        member_count: 2,
      };

      const channels = await chatClient.queryChannels(filter, { last_message_at: -1 }, { limit: 20 });

      const dms: DMChannel[] = [];
      for (const channel of channels) {
        const channelId = channel.id || '';
        if (channelId.includes('creator-')) continue;

        const members = Object.values(channel.state.members);
        const otherMember = members.find((m: any) => m.user_id !== user.id);

        if (otherMember?.user) {
          dms.push({
            channel,
            otherUser: {
              id: otherMember.user.id,
              name: otherMember.user.name || 'Unknown',
              image: otherMember.user.image,
            },
            unreadCount: channel.state.unreadCount || 0,
          });
        }
      }

      setDmChannels(dms);
    } catch (err) {
      console.error('Failed to fetch DM channels:', err);
    }
  }, [chatClient, user]);

  return {
    dmChannels,
    fetchDMChannels,
  };
}
