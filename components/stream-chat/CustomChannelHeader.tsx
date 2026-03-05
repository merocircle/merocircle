"use client";

import React, { useEffect, useState } from 'react';
import { useChannelStateContext } from 'stream-chat-react';
import { ChevronDown, ChevronUp, Hash, Info, Search, X } from 'lucide-react';
import { useChannelSearch } from './contexts/ChannelSearchContext';

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
  const { channel, messages: contextMessages } = useChannelStateContext();
  const messages = contextMessages ?? (channel?.state?.messages ?? []) as any[];
  const searchContext = useChannelSearch();
  const [showSearch, setShowSearch] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  if (!channel) return null;

  const channelData = channel.data as CustomChannelData | undefined;
  const channelName = channelData?.name || 'Channel';
  const channelImage = channelData?.image;
  const members = Object.values(channel.state.members || {}) as any[];
  const memberCount = members.length;
  const onlineCount = members.filter((m: any) => m.user?.online).length;

  const avatarStack = members
    .filter((m: any) => m.user?.online && m.user?.image)
    .slice(0, 4);

  // Client-side search: filter loaded messages by text, set results in context for highlight + nav
  const runSearch = () => {
    const query = searchInput.trim();
    if (!query || !searchContext) return;
    const q = query.toLowerCase();
    const list = messages || [];
    const matchIds = list
      .filter((m: any) => m.text && String(m.text).toLowerCase().includes(q))
      .map((m: any) => m.id);
    searchContext.setSearchResults(query, matchIds);
  };

  const closeSearch = () => {
    setShowSearch(false);
    setSearchInput('');
    searchContext?.clearSearch();
  };

  const openSearch = () => {
    setShowSearch(true);
    if (searchContext?.searchQuery) {
      setSearchInput(searchContext.searchQuery);
    }
  };

  // Scroll to current match when index or match list changes (scroll the list item so it’s in view)
  useEffect(() => {
    if (!searchContext || searchContext.matchIds.length === 0) return;
    const id = searchContext.matchIds[searchContext.currentIndex];
    if (!id) return;
    const wrapper = document.querySelector(`[data-channel-search-message-id="${id}"]`);
    const listItem = wrapper?.closest('.str-chat__li');
    if (listItem) {
      listItem.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [searchContext?.currentIndex, searchContext?.matchIds]);

  const { matchIds, currentIndex, searchQuery, goNext, goPrev } = searchContext || {};
  const hasMatches = (matchIds?.length ?? 0) > 0;
  const matchLabel = hasMatches ? `${currentIndex! + 1} of ${matchIds!.length}` : '0 results';

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
                      <img src={m.user.image} alt={m.user.name || 'User Avatar'} className="w-full h-full object-cover" />
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
            type="button"
            onClick={() => (showSearch ? closeSearch() : openSearch())}
            className={`p-2 rounded-lg transition-colors ${
              showSearch ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
            title="Search messages"
          >
            <Search className="h-4 w-4" />
          </button>
          {onToggleInfo && (
            <button
              type="button"
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
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                placeholder="Search in this channel..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/50 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={runSearch}
              disabled={!searchInput.trim()}
              className="shrink-0 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              Search
            </button>
            <button
              type="button"
              onClick={closeSearch}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
              title="Close search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {searchQuery && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-muted-foreground">{matchLabel}</span>
              {hasMatches && (
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={goPrev}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                    title="Previous match"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                    title="Next match"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default CustomChannelHeader;
