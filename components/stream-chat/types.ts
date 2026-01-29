import type { Channel as StreamChannelType } from 'stream-chat';

export interface DMChannel {
  channel: StreamChannelType;
  otherUser: {
    id: string;
    name: string;
    image?: string;
  };
  unreadCount: number;
}

export type MobileView = 'servers' | 'channels' | 'chat';
