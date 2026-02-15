"use client";

import React, { useState } from 'react';
import { useChannelStateContext } from 'stream-chat-react';
import { Users, Hash, Info, Search, X } from 'lucide-react';

interface CustomChannelData {
  name?: string;
  image?: string;
  category?: string;
  supabase_channel_id?: string;
  creator_name?: string;
}

interface CustomChannelHeaderProps {
  onToggleInfo?: () => void;
  showInfoPanel?: boolean;
}

export function CustomChannelHeader({ onToggleInfo, showInfoPanel }: CustomChannelHeaderProps) {
  const { channel } = useChannelStateContext();
  const [showMembers, setShowMembers] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  if (!channel) return null;

  const channelData = channel.data as CustomChannelData | undefined;
  const channelName = channelData?.name || 'Channel';
  const channelImage = channelData?.image;
  const members = Object.values(channel.state.members || {}) as any[];
  const memberCount = members.length;
  const onlineCount = members.filter((m: any) => m.user?.online).length;

  // Get first few online member avatars for the stack
  const avatarStack = members
    .filter((m: any) => m.user?.online && m.user?.image)
    .slice(0, 4);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await channel.search({ query: searchQuery }, { limit: 20 });
      setSearchResults(results.results?.map((r: any) => r.message) || []);
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/60 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center ring-1 ring-border/30 overflow-hidden">
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

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm text-foreground truncate">{channelName}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              {avatarStack.length > 0 && (
                <div className="flex -space-x-1.5">
                  {avatarStack.map((m: any) => (
                    <div key={m.user_id} className="w-4 h-4 rounded-full overflow-hidden ring-1 ring-card">
                      <img src={m.user.image} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <span className="bg-muted px-1.5 py-0.5 rounded-md">{memberCount}</span>
                {onlineCount > 0 && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      {onlineCount} online
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={() => { setShowSearch(!showSearch); if (showSearch) { setSearchQuery(''); setSearchResults([]); } }}
            className={`p-2 rounded-lg transition-colors ${
              showSearch ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
            title="Search messages"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowMembers(!showMembers)}
            className={`p-2 rounded-lg transition-colors ${
              showMembers ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
            title="Show Members"
          >
            <Users className="h-4 w-4" />
          </button>
          {onToggleInfo && (
            <button
              onClick={onToggleInfo}
              className={`p-2 rounded-lg transition-colors ${
                showInfoPanel ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
              title="Channel Details"
            >
              <Info className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {showSearch && (
        <div className="px-4 py-2 border-b border-border bg-card/40 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search in this channel..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/50 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                autoFocus
              />
            </div>
            <button
              onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {isSearching && (
            <p className="text-[10px] text-muted-foreground mt-1.5">Searching...</p>
          )}
          {searchResults.length > 0 && (
            <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
              {searchResults.map((msg: any) => (
                <div key={msg.id} className="px-2 py-1.5 rounded-md bg-muted/50 text-xs">
                  <span className="font-medium text-foreground">{msg.user?.name}: </span>
                  <span className="text-muted-foreground">{msg.text?.slice(0, 100)}</span>
                </div>
              ))}
            </div>
          )}
          {searchQuery && !isSearching && searchResults.length === 0 && (
            <p className="text-[10px] text-muted-foreground mt-1.5">No results found</p>
          )}
        </div>
      )}

      {showMembers && (
        <MembersSidebar channel={channel} onClose={() => setShowMembers(false)} />
      )}
    </>
  );
}

function MembersSidebar({ channel, onClose }: { channel: any; onClose: () => void }) {
  const members = Object.values(channel.state.members || {}) as any[];
  const onlineMembers = members.filter(m => m.user?.online);
  const offlineMembers = members.filter(m => !m.user?.online);

  return (
    <div className="fixed inset-y-0 right-0 w-72 bg-card shadow-xl z-50 flex flex-col border-l border-border">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-sm">Members</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {onlineMembers.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1.5">
              Online ({onlineMembers.length})
            </p>
            {onlineMembers.map((member: any) => (
              <MemberItem key={member.user_id} member={member} />
            ))}
          </div>
        )}

        {offlineMembers.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1.5">
              Offline ({offlineMembers.length})
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
    <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer">
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
          {user?.image ? (
            <img src={user.image} alt={user.name || 'User'} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-semibold text-primary">
              {(user?.name || 'U')[0].toUpperCase()}
            </span>
          )}
        </div>
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-[1.5px] border-card ${
            user?.online ? 'bg-green-500' : 'bg-muted-foreground/40'
          }`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">
          {user?.name || 'Unknown User'}
        </p>
        {member.role && member.role !== 'member' && (
          <p className="text-[10px] text-primary capitalize">{member.role}</p>
        )}
      </div>
    </div>
  );
}

export default CustomChannelHeader;
