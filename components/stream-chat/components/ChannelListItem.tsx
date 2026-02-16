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
  serverImage?: string;
  serverName?: string;
  lastMessage?: string;
  lastMessageTime?: string;
}

function formatTime(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function ChannelListItem({
  channel,
  isActive,
  isDisabled,
  unreadCount,
  onClick,
  serverImage,
  serverName,
  lastMessage,
  lastMessageTime,
}: ChannelListItemProps) {
  const hasUnread = unreadCount > 0;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`
        w-full px-2.5 py-1.5 flex items-center gap-2 text-left rounded-lg transition-all duration-150
        ${isActive
          ? 'bg-primary/10 ring-1 ring-primary/20'
          : 'hover:bg-muted/70'
        }
        ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {/* Channel icon — hash to distinguish from server (which uses creator photo) */}
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center ring-1 ring-border/30">
        <Hash className="h-3 w-3 text-muted-foreground" />
      </div>

      {/* Name + last message */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={`text-[11px] truncate ${hasUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground/90'}`}>
            {channel.name}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            {channel.min_tier_required === 3 && (
              <Star className="h-2.5 w-2.5 text-yellow-500" />
            )}
            {lastMessageTime && (
              <span className={`text-[9px] ${hasUnread ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                {formatTime(lastMessageTime)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-1.5 mt-0.5">
          <p className={`text-[10px] truncate ${hasUnread ? 'text-foreground/70' : 'text-muted-foreground'}`}>
            {lastMessage || (serverName ? `#${channel.name}` : 'No messages yet')}
          </p>
          {hasUnread && (
            <span className="flex-shrink-0 min-w-[16px] h-[16px] px-1 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
