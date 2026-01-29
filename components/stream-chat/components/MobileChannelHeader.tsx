"use client";

import React from 'react';
import { useChannelStateContext } from 'stream-chat-react';
import { Hash, MessageCircle } from 'lucide-react';

export function MobileChannelHeader() {
  const { channel } = useChannelStateContext();

  if (!channel) return null;

  const channelData = channel.data as { name?: string; image?: string } | undefined;
  const channelName = channelData?.name || 'Channel';
  const channelImage = channelData?.image;

  // For DM channels, show the other user's name
  const members = Object.values(channel.state.members || {});
  const isDM = members.length === 2 && !channelName.includes('#');

  let displayName = channelName;
  let displayImage = channelImage;

  if (isDM) {
    const otherMember = members.find((m: any) => m.user?.id !== channel._client?.userID);
    if (otherMember?.user) {
      displayName = (otherMember.user as any).name || 'Unknown';
      displayImage = (otherMember.user as any).image;
    }
  }

  const memberCount = members.length;

  return (
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
        {displayImage ? (
          <img src={displayImage} alt={displayName} className="w-full h-full object-cover" />
        ) : isDM ? (
          <MessageCircle className="h-4 w-4 text-primary" />
        ) : (
          <Hash className="h-4 w-4 text-primary" />
        )}
      </div>
      <div className="min-w-0">
        <h3 className="font-semibold text-foreground truncate">{displayName}</h3>
        {!isDM && (
          <p className="text-xs text-muted-foreground">
            {memberCount} member{memberCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
}
