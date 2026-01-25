'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Hash,
  Lock,
  MessageSquare,
  Users,
  Sparkles,
  TrendingUp,
  Filter
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type ContextView = 'feed' | 'chat' | 'explore' | 'notifications';

interface ContextSidebarProps {
  view: ContextView;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  // Feed view props
  feedFilter?: 'for-you' | 'following' | 'trending';
  onFeedFilterChange?: (filter: 'for-you' | 'following' | 'trending') => void;
  categories?: string[];
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  suggestedCreators?: Array<{
    id: string;
    display_name: string;
    photo_url: string | null;
    supporter_count: number;
  }>;
  // Chat view props
  channels?: Array<{
    id: string;
    name: string;
    isPrivate?: boolean;
    unreadCount?: number;
  }>;
  directMessages?: Array<{
    id: string;
    display_name: string;
    photo_url: string | null;
    isOnline?: boolean;
    lastMessage?: string;
  }>;
  activeChannelId?: string;
  onChannelSelect?: (channelId: string) => void;
  className?: string;
}

export function ContextSidebar({
  view,
  isCollapsed = false,
  onToggleCollapse,
  feedFilter = 'for-you',
  onFeedFilterChange,
  categories = ['All', 'Music', 'Art', 'Photography', 'Video', 'Writing'],
  selectedCategory = 'All',
  onCategoryChange,
  suggestedCreators = [],
  channels = [],
  directMessages = [],
  activeChannelId,
  onChannelSelect,
  className
}: ContextSidebarProps) {
  const [localCollapsed, setLocalCollapsed] = useState(isCollapsed);
  const collapsed = isCollapsed ?? localCollapsed;
  const toggleCollapse = onToggleCollapse ?? (() => setLocalCollapsed(!localCollapsed));

  return (
    <motion.aside
      className={cn(
        'relative h-screen border-r border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden',
        'hidden lg:block', // Only show on large screens
        className
      )}
      initial={{ width: 240, opacity: 1 }}
      animate={{
        width: collapsed ? 0 : 240,
        opacity: collapsed ? 0 : 1
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Toggle button */}
      <motion.button
        onClick={toggleCollapse}
        className="absolute -right-3 top-6 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-card border border-border shadow-sm hover:bg-muted transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </motion.button>

      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full w-60"
          >
            <ScrollArea className="h-full py-4">
              {view === 'feed' && (
                <FeedContext
                  filter={feedFilter}
                  onFilterChange={onFeedFilterChange}
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategoryChange={onCategoryChange}
                  suggestedCreators={suggestedCreators}
                />
              )}

              {view === 'chat' && (
                <ChatContext
                  channels={channels}
                  directMessages={directMessages}
                  activeChannelId={activeChannelId}
                  onChannelSelect={onChannelSelect}
                />
              )}

              {view === 'explore' && (
                <ExploreContext
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategoryChange={onCategoryChange}
                />
              )}

              {view === 'notifications' && (
                <NotificationsContext />
              )}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}

// Feed Context Content
function FeedContext({
  filter,
  onFilterChange,
  categories,
  selectedCategory,
  onCategoryChange,
  suggestedCreators
}: {
  filter: 'for-you' | 'following' | 'trending';
  onFilterChange?: (filter: 'for-you' | 'following' | 'trending') => void;
  categories: string[];
  selectedCategory: string;
  onCategoryChange?: (category: string) => void;
  suggestedCreators: Array<{
    id: string;
    display_name: string;
    photo_url: string | null;
    supporter_count: number;
  }>;
}) {
  const filters = [
    { id: 'for-you', label: 'For You', icon: Sparkles },
    { id: 'following', label: 'Following', icon: Users },
    { id: 'trending', label: 'Trending', icon: TrendingUp }
  ] as const;

  return (
    <div className="px-4 space-y-6">
      {/* Feed Filters */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Filter size={12} />
          Feed Filters
        </div>
        <div className="space-y-1">
          {filters.map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              onClick={() => onFilterChange?.(id)}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors',
                filter === id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon size={16} />
              {label}
              {filter === id && (
                <motion.div
                  layoutId="feed-filter-indicator"
                  className="ml-auto w-1.5 h-1.5 bg-primary rounded-full"
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Categories
        </h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <motion.button
              key={category}
              onClick={() => onCategoryChange?.(category)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {category}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Suggested Creators */}
      {suggestedCreators.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Suggested Creators
          </h3>
          <div className="space-y-2">
            {suggestedCreators.slice(0, 4).map((creator) => (
              <motion.div
                key={creator.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                whileHover={{ x: 2 }}
              >
                <Avatar className="w-9 h-9">
                  <AvatarImage src={creator.photo_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {creator.display_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{creator.display_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {creator.supporter_count} supporters
                  </p>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  Follow
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Chat Context Content
function ChatContext({
  channels,
  directMessages,
  activeChannelId,
  onChannelSelect
}: {
  channels: Array<{
    id: string;
    name: string;
    isPrivate?: boolean;
    unreadCount?: number;
  }>;
  directMessages: Array<{
    id: string;
    display_name: string;
    photo_url: string | null;
    isOnline?: boolean;
    lastMessage?: string;
  }>;
  activeChannelId?: string;
  onChannelSelect?: (channelId: string) => void;
}) {
  return (
    <div className="px-2 space-y-4">
      {/* Search */}
      <div className="px-2">
        <input
          type="text"
          placeholder="Search channels..."
          className="w-full px-3 py-2 text-sm rounded-lg bg-muted/50 border-0 focus:ring-1 focus:ring-primary/50 outline-none"
        />
      </div>

      {/* Channels */}
      <div className="space-y-1">
        <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Channels
        </h3>
        {channels.map((channel) => (
          <motion.button
            key={channel.id}
            onClick={() => onChannelSelect?.(channel.id)}
            className={cn(
              'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-colors',
              activeChannelId === channel.id
                ? 'bg-muted text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
            whileHover={{ x: 2 }}
          >
            {channel.isPrivate ? (
              <Lock size={14} className="opacity-50" />
            ) : (
              <Hash size={14} className="opacity-50" />
            )}
            <span className="truncate">{channel.name}</span>
            {channel.unreadCount && channel.unreadCount > 0 && (
              <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-primary text-primary-foreground rounded-full">
                {channel.unreadCount}
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Direct Messages */}
      <div className="space-y-1">
        <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Direct Messages
        </h3>
        {directMessages.map((dm) => (
          <motion.button
            key={dm.id}
            onClick={() => onChannelSelect?.(dm.id)}
            className={cn(
              'flex items-center gap-2 w-full px-2 py-1.5 rounded-md transition-colors',
              activeChannelId === dm.id
                ? 'bg-muted'
                : 'hover:bg-muted/50'
            )}
            whileHover={{ x: 2 }}
          >
            <div className="relative">
              <Avatar className="w-7 h-7">
                <AvatarImage src={dm.photo_url || undefined} />
                <AvatarFallback className="text-[10px]">
                  {dm.display_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {dm.isOnline && (
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-background rounded-full" />
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium truncate">{dm.display_name}</p>
              {dm.lastMessage && (
                <p className="text-xs text-muted-foreground truncate">{dm.lastMessage}</p>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* New Channel Button */}
      <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground">
        <MessageSquare size={14} />
        New Message
      </Button>
    </div>
  );
}

// Explore Context Content
function ExploreContext({
  categories,
  selectedCategory,
  onCategoryChange
}: {
  categories: string[];
  selectedCategory: string;
  onCategoryChange?: (category: string) => void;
}) {
  return (
    <div className="px-4 space-y-6">
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Browse by Category
        </h3>
        <div className="space-y-1">
          {categories.map((category) => (
            <motion.button
              key={category}
              onClick={() => onCategoryChange?.(category)}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors',
                selectedCategory === category
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              {category}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Notifications Context Content
function NotificationsContext() {
  return (
    <div className="px-4 space-y-4">
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Filter
        </h3>
        <div className="space-y-1">
          {['All', 'Likes', 'Comments', 'New Supporters', 'Mentions'].map((filter) => (
            <motion.button
              key={filter}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              whileHover={{ x: 2 }}
            >
              {filter}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
