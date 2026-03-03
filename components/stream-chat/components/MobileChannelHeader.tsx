"use client";

import React, { useState } from 'react';
import { useChannelStateContext } from 'stream-chat-react';
import { Hash, MessageCircle, Info, X, Users } from 'lucide-react';

interface MobileChannelHeaderProps {
  selectedServer?: { name: string; image?: string } | null;
}

export function MobileChannelHeader({ selectedServer }: MobileChannelHeaderProps) {
  const { channel } = useChannelStateContext();
  const [showInfo, setShowInfo] = useState(false);

  if (!channel) return null;

  const channelData = channel.data as { name?: string; image?: string } | undefined;
  const channelName = channelData?.name || 'Channel';
  const channelImage = channelData?.image;

  // For DM channels, show the other user's name
  const members = Object.values(channel.state.members || {}) as any[];
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
  const onlineCount = members.filter((m: any) => m.user?.online).length;
  const offlineCount = memberCount - onlineCount;

  // Show server name + channel name for server channels, just user name for DMs
  const showServerInfo = selectedServer && !isDM;

  return (
    <>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
          {showServerInfo && selectedServer?.image ? (
            <img src={selectedServer.image} alt={selectedServer.name} className="w-full h-full object-cover" />
          ) : displayImage ? (
            <img src={displayImage} alt={displayName} className="w-full h-full object-cover" />
          ) : isDM ? (
            <MessageCircle className="h-4 w-4 text-primary" />
          ) : (
            <Hash className="h-4 w-4 text-primary" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          {showServerInfo ? (
            <>
              <h3 className="font-semibold text-foreground truncate text-sm">{selectedServer.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{channelName}</p>
            </>
          ) : (
            <>
              <h3 className="font-semibold text-foreground truncate">{displayName}</h3>
              {!isDM && (
                <p className="text-xs text-muted-foreground">
                  {memberCount} member{memberCount !== 1 ? 's' : ''}
                </p>
              )}
            </>
          )}
        </div>
        {!isDM && (
          <button
            onClick={() => setShowInfo(true)}
            className="p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
            aria-label="Channel info"
          >
            <Info className="h-5 w-5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Info Popup */}
      {showInfo && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowInfo(false)}
        >
          <div 
            className="bg-card rounded-xl w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Channel Info</h3>
              <button
                onClick={() => setShowInfo(false)}
                className="p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {selectedServer && (
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {selectedServer.image ? (
                      <img src={selectedServer.image} alt={selectedServer.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{selectedServer.name}</h4>
                    <p className="text-sm text-muted-foreground">Server</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {channelImage ? (
                    <img src={channelImage} alt={channelName} className="w-full h-full object-cover" />
                  ) : (
                    <Hash className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{channelName}</h4>
                  <p className="text-sm text-muted-foreground">Channel</p>
                </div>
              </div>
              
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Total Members</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{memberCount}</span>
                </div>
                {onlineCount > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-sm font-medium text-foreground">Online</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{onlineCount}</span>
                  </div>
                )}
                {offlineCount > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                      <span className="text-sm font-medium text-foreground">Offline</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{offlineCount}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
