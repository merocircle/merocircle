"use client";

import React, { useState } from 'react';
import { useChannelStateContext } from 'stream-chat-react';
import { Users, Hash } from 'lucide-react';

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
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          {channelImage ? (
            <img
              src={channelImage}
              alt={channelName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <Hash className="h-5 w-5 text-primary" />
          )}
        </div>

        <div>
          <h3 className="font-semibold text-foreground">{channelName}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            <span>
              {memberCount} member{memberCount !== 1 ? 's' : ''}
              {onlineCount > 0 && (
                <span className="text-green-600 dark:text-green-400 ml-1">
                  ({onlineCount} online)
                </span>
              )}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowMembers(!showMembers)}
          className={`p-2 rounded-lg transition-colors ${
            showMembers
              ? 'bg-primary/10 text-primary'
              : 'hover:bg-muted text-muted-foreground hover:text-primary'
          }`}
          title="Show Members"
        >
          <Users className="h-5 w-5" />
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
    <div className="fixed inset-y-0 right-0 w-72 bg-card shadow-xl z-50 flex flex-col border-l border-border">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Members</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted text-xl leading-none text-muted-foreground hover:text-foreground">
          &times;
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {onlineMembers.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase px-2 mb-2">
              Online &mdash; {onlineMembers.length}
            </p>
            {onlineMembers.map((member: any) => (
              <MemberItem key={member.user_id} member={member} />
            ))}
          </div>
        )}

        {offlineMembers.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase px-2 mb-2">
              Offline &mdash; {offlineMembers.length}
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
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
          {user?.image ? (
            <img src={user.image} alt={user.name || 'User'} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-medium text-primary">
              {(user?.name || 'U')[0].toUpperCase()}
            </span>
          )}
        </div>
        <div
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
            user?.online ? 'bg-green-500' : 'bg-muted-foreground'
          }`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {user?.name || 'Unknown User'}
        </p>
        {member.role && member.role !== 'member' && (
          <p className="text-xs text-primary capitalize">{member.role}</p>
        )}
      </div>
    </div>
  );
}

export default CustomChannelHeader;
