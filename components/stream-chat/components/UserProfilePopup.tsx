"use client";

import React from 'react';
import { Mail, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface UserProfilePopupProps {
  user: { id: string; name: string; image?: string; createdAt?: string };
  onClose: () => void;
  onStartDM: (userId: string) => void;
}

export function UserProfilePopup({ user, onClose, onStartDM }: UserProfilePopupProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-card rounded-xl w-full max-w-sm mx-4 overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="h-20 bg-gradient-to-r from-purple-600 to-purple-800" />

        {/* Avatar */}
        <div className="relative px-6 -mt-10">
          <Avatar className="h-20 w-20 border-4 border-card">
            <AvatarImage src={user.image} alt={user.name} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white text-2xl">
              {user.name[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* User Info */}
        <div className="px-6 py-4">
          <h3 className="text-xl font-semibold text-foreground">{user.name}</h3>
          {user.createdAt && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Close
          </Button>
          <Button
            onClick={() => onStartDM(user.id)}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            <Mail className="h-4 w-4 mr-2" />
            Message
          </Button>
        </div>
      </div>
    </div>
  );
}
