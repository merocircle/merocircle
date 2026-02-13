"use client";

import React, { useState } from 'react';
import { useChannelStateContext } from 'stream-chat-react';
import { Users, Hash, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomChannelData {
  name?: string;
  image?: string;
  category?: string;
  supabase_channel_id?: string;
  creator_name?: string;
}

export function CustomChannelHeader() {
  const { channel } = useChannelStateContext();
  const [showMembers, setShowMembers] = useState(false);

  if (!channel) return null;

  const channelData = channel.data as CustomChannelData | undefined;
  const channelName = channelData?.name || 'Channel';
  const channelImage = channelData?.image;
  const memberCount = Object.keys(channel.state.members || {}).length;
  const onlineCount = Object.values(channel.state.members || {}).filter(
    (m: any) => m.user?.online
  ).length;

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 bg-card/95 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
          {channelImage ? (
            <img
              src={channelImage}
              alt={channelName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <Hash className="h-4 w-4 text-primary" />
          )}
        </div>

        <div>
          <h3 className="font-semibold text-foreground text-sm leading-tight">{channelName}</h3>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
            <span>{memberCount} members</span>
            {onlineCount > 0 && (
              <>
                <span className="text-border">·</span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--online)] inline-block animate-pulse" />
                  {onlineCount} online
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setShowMembers(!showMembers)}
          className={cn(
            "p-2 rounded-full transition-colors",
            showMembers
              ? "bg-primary/10 text-primary"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          )}
          title="Show Members"
        >
          <Users className="h-4 w-4" />
        </button>
      </div>

      {showMembers && (
        <MembersSidebar channel={channel} onClose={() => setShowMembers(false)} />
      )}
    </div>
  );
}

function MembersSidebar({ channel, onClose }: { channel: any; onClose: () => void }) {
  const members = Object.values(channel.state.members || {}) as any[];
  const onlineMembers = members.filter(m => m.user?.online);
  const offlineMembers = members.filter(m => !m.user?.online);

  return (
    <div className="fixed inset-y-0 right-0 w-72 bg-card shadow-2xl z-50 flex flex-col border-l border-border/30">
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-sm">Members ({members.length})</h3>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {onlineMembers.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1.5">
              Online — {onlineMembers.length}
            </p>
            {onlineMembers.map((member: any) => (
              <MemberItem key={member.user_id} member={member} />
            ))}
          </div>
        )}

        {offlineMembers.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1.5">
              Offline — {offlineMembers.length}
            </p>
            {offlineMembers.map((member: any) => (
              <MemberItem key={member.user_id} member={member} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MemberItem({ member }: { member: any }) {
  const user = member.user;

  return (
    <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
          {user?.image ? (
            <img src={user.image} alt={user.name || 'User'} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-medium text-primary">
              {(user?.name || 'U')[0].toUpperCase()}
            </span>
          )}
        </div>
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card",
            user?.online ? 'bg-[var(--online)]' : 'bg-muted-foreground/30'
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-foreground truncate">
          {user?.name || 'Unknown User'}
        </p>
        {member.role && member.role !== 'member' && (
          <p className="text-[10px] text-primary font-medium capitalize">{member.role}</p>
        )}
      </div>
    </div>
  );
}

export default CustomChannelHeader;
