import { useState, useCallback } from 'react';

export interface SupabaseChannel {
  id: string;
  name: string;
  description: string | null;
  category: string;
  channel_type: string;
  min_tier_required: number;
  stream_channel_id: string | null;
  creator_id: string;
  position: number;
  creator?: {
    id: string;
    display_name: string;
    photo_url: string | null;
  };
}

export interface Server {
  id: string;
  name: string;
  image?: string;
  isOwner: boolean;
  channels: SupabaseChannel[];
}

export function useChannels(user: { id: string } | null) {
  const [otherServers, setOtherServers] = useState<Server[]>([]);
  const [myServer, setMyServer] = useState<Server | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchChannels = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch('/api/community/channels');
      if (response.ok) {
        const data = await response.json();
        const myUserId = user.id;
        const allServers: Server[] = data.servers || [];

        const mine = allServers.find(s => s.id === myUserId);
        const others = allServers.filter(s => s.id !== myUserId);

        setMyServer(mine || null);
        setOtherServers(others);
      }
    } catch (err) {
      // Silent fail - channels will show empty state
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    otherServers,
    myServer,
    loading,
    fetchChannels,
  };
}
