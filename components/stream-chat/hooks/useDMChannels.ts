import { useState, useCallback, useRef } from 'react';
import type { StreamChat } from 'stream-chat';
import type { DMChannel } from '../types';

export function useDMChannels(chatClient: StreamChat | null, user: { id: string } | null) {
  const [dmChannels, setDmChannels] = useState<DMChannel[]>([]);
  const lastFetchRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);

  const fetchDMChannels = useCallback(async () => {
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
        member_count: 2,
      };

      const channels = await chatClient.queryChannels(filter, { last_message_at: -1 }, { limit: 20 });

      const dms: DMChannel[] = [];
      for (const channel of channels) {
        const channelId = channel.id || '';
        const channelData = channel.data || {};
        
        // Skip channels that are part of a server/community (they have a name or custom properties)
        // True DMs don't have a name, category, min_tier_required, or supabase_channel_id
        if (
          channelId.includes('creator-') || 
          channelId.startsWith('ch_') || // Community channels have this prefix
          channelData.name || // Group channels have a name
          channelData.category || // Community channels have a category
          channelData.min_tier_required !== undefined || // Community channels have tier requirements
          channelData.supabase_channel_id // Community channels are linked to Supabase
        ) {
          continue;
        }

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
    } catch (err: any) {
      // Silently handle rate limiting errors
      if (err?.code !== 9) {
      console.error('Failed to fetch DM channels:', err);
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, [chatClient, user]);

  return {
    dmChannels,
    fetchDMChannels,
  };
}
