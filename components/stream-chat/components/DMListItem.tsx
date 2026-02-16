"use client";

import React from 'react';
import type { DMChannel } from '../types';

interface DMListItemProps {
  dm: DMChannel;
  isActive: boolean;
  onClick: () => void;
}

function formatTime(dateStr?: string | Date | null) {
  if (!dateStr) return '';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
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

export function DMListItem({ dm, isActive, onClick }: DMListItemProps) {
  const hasUnread = dm.unreadCount > 0;
  const lastMsg = dm.channel.state.messages?.slice(-1)[0];
  const lastMessageText = lastMsg?.text || '';
  const lastMessageTime = lastMsg?.created_at;
  const isOnline = dm.otherUser && dm.channel.state.members
    ? Object.values(dm.channel.state.members).find(
        (m: any) => m.user_id === dm.otherUser.id
      )?.user?.online
    : false;

  return (
    <button
      onClick={onClick}
      className={`
        w-full px-3 py-2.5 flex items-center gap-3 text-left rounded-xl transition-all duration-150
        ${isActive
          ? 'bg-primary/10 ring-1 ring-primary/20'
          : 'hover:bg-muted/70'
        }
      `}
    >
      {/* Avatar with online dot */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden ring-1 ring-border/30">
          {dm.otherUser.image ? (
            <img src={dm.otherUser.image} alt={dm.otherUser.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-primary">
              {(dm.otherUser.name || 'U')[0].toUpperCase()}
            </span>
          )}
        </div>
        {/* Online indicator */}
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${
            isOnline ? 'bg-green-500' : 'bg-muted-foreground/40'
          }`}
        />
      </div>

      {/* Name + last message */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={`text-sm truncate ${hasUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground/90'}`}>
            {dm.otherUser.name}
          </span>
          {lastMessageTime && (
            <span className={`text-[10px] flex-shrink-0 ${hasUnread ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
              {formatTime(lastMessageTime)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={`text-xs truncate ${hasUnread ? 'text-foreground/70' : 'text-muted-foreground'}`}>
            {lastMessageText || 'Start a conversation'}
          </p>
          {hasUnread && (
            <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {dm.unreadCount > 99 ? '99+' : dm.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
