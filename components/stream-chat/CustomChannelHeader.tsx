"use client";

import React, { useState } from 'react';
import { useChannelStateContext } from 'stream-chat-react';
import { Hash, Info, Search, X } from 'lucide-react';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
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
      logger.error('Channel search failed', 'CUSTOM_CHANNEL_HEADER', { error: err instanceof Error ? err.message : String(err) });
      toast({ title: 'Search failed', variant: 'destructive' });
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

    </>
  );
}


export default CustomChannelHeader;
