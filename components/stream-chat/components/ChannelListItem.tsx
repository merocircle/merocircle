"use client";

import React from 'react';
import { Hash, Star } from 'lucide-react';
import type { SupabaseChannel } from '../hooks/useChannels';

interface ChannelListItemProps {
  channel: SupabaseChannel;
  isActive: boolean;
  isDisabled: boolean;
  unreadCount: number;
  onClick: () => void;
}

export function ChannelListItem({ channel, isActive, isDisabled, unreadCount, onClick }: ChannelListItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`
        w-full px-3 py-1.5 flex items-center gap-2 text-left text-sm rounded transition-colors
        ${isActive
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-foreground hover:bg-muted'
        }
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <span className="truncate flex-1">{channel.name}</span>
      {channel.min_tier_required === 3 && (
        <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />
      )}
      {unreadCount > 0 && (
        <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center justify-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
