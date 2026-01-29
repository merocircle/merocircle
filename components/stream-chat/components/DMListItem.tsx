"use client";

import React from 'react';
import { MessageCircle } from 'lucide-react';
import type { DMChannel } from '../types';

interface DMListItemProps {
  dm: DMChannel;
  isActive: boolean;
  onClick: () => void;
}

export function DMListItem({ dm, isActive, onClick }: DMListItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full px-3 py-1.5 flex items-center gap-2 text-left text-sm rounded transition-colors
        ${isActive
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-foreground hover:bg-muted'
        }
      `}
    >
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
        {dm.otherUser.image ? (
          <img src={dm.otherUser.image} alt={dm.otherUser.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-medium text-primary">
            {dm.otherUser.name[0].toUpperCase()}
          </span>
        )}
      </div>
      <span className="truncate flex-1">{dm.otherUser.name}</span>
      {dm.unreadCount > 0 && (
        <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center justify-center">
          {dm.unreadCount > 99 ? '99+' : dm.unreadCount}
        </span>
      )}
    </button>
  );
}
