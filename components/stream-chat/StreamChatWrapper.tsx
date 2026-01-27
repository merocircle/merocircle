"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Chat,
  Channel,
  Window,
  MessageList,
  MessageInput,
  Thread,
  useChannelStateContext,
} from 'stream-chat-react';
import type { Channel as StreamChannelType } from 'stream-chat';
import { useStreamChat } from '@/contexts/stream-chat-context';
import { useAuth } from '@/contexts/supabase-auth-context';
import { useTheme } from 'next-themes';
import { CustomChannelHeader } from './CustomChannelHeader';
import {
  Loader2, MessageSquare, AlertCircle, Plus, Hash,
  ChevronDown, ChevronRight, Users, Star,
  X, Check, Search, Mail, Calendar, ArrowLeft, MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

// Import Stream Chat styles
import 'stream-chat-react/dist/css/v2/index.css';

interface SupabaseChannel {
  id: string;
  name: string;
  description: string | null;
  category: string;
  channel_type: string;
  min_tier_required: number;
  stream_channel_id: string | null;
  creator_id: string;
  position: number;
  creator?: {
    id: string;
    display_name: string;
    photo_url: string | null;
  };
}

interface Server {
  id: string;
  name: string;
  image?: string;
  isOwner: boolean;
  channels: SupabaseChannel[];
}

interface Supporter {
  id: string;
  supporter_id: string;
  tier_level: number;
  user: {
    id: string;
    display_name: string;
    photo_url: string | null;
  };
}

interface DMChannel {
  channel: StreamChannelType;
  otherUser: {
    id: string;
    name: string;
    image?: string;
  };
  unreadCount: number;
}

interface StreamChatWrapperProps {
  className?: string;
}

// Mobile view states
type MobileView = 'servers' | 'channels' | 'chat';

export function StreamChatWrapper({ className = '' }: StreamChatWrapperProps) {
  const { chatClient, isConnecting, isConnected, error, reconnect } = useStreamChat();
  const { user, isCreator } = useAuth();
  const { resolvedTheme } = useTheme();
  const [activeChannel, setActiveChannel] = useState<StreamChannelType | null>(null);
  const [otherServers, setOtherServers] = useState<Server[]>([]);
  const [myServer, setMyServer] = useState<Server | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set());
  const [expandedDMs, setExpandedDMs] = useState(true);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [channelError, setChannelError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; image?: string; createdAt?: string } | null>(null);
  const [dmChannels, setDmChannels] = useState<DMChannel[]>([]);
  const [channelUnreadCounts, setChannelUnreadCounts] = useState<Record<string, number>>({});
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Mobile navigation state
  const [mobileView, setMobileView] = useState<MobileView>('servers');
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);

  // Get Stream theme based on app theme
  const streamTheme = resolvedTheme === 'dark' ? 'str-chat__theme-dark' : 'str-chat__theme-light';

  // Fetch channels from our API
  const fetchChannels = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch('/api/community/channels');
      if (response.ok) {
        const data = await response.json();

        // Separate my server from others based on user.id
        const myUserId = user.id;
        const allServers: Server[] = data.servers || [];

        // My Server = where I am the creator (creator_id === my user.id)
        const mine = allServers.find(s => s.id === myUserId);
        // Other Channels = servers where I'm NOT the owner (channels I'm subscribed to)
        const others = allServers.filter(s => s.id !== myUserId);

        setMyServer(mine || null);
        setOtherServers(others);

        // Auto-expand all servers
        const allIds = new Set(allServers.map(s => s.id));
        setExpandedServers(allIds);
      }
    } catch (err) {
      // Silent fail - channels will show empty state
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch DM channels for both creators and supporters
  const fetchDMChannels = useCallback(async () => {
    if (!chatClient || !user) return;

    try {
      // Query for DM channels (1:1 channels where current user is a member)
      const filter = {
        type: 'messaging',
        members: { $in: [user.id] },
        // DM channels don't have a name or have exactly 2 members
        member_count: 2,
      };

      const channels = await chatClient.queryChannels(filter, { last_message_at: -1 }, { limit: 20 });

      const dms: DMChannel[] = [];
      for (const channel of channels) {
        // Skip group channels (those with stream_channel_id in our system)
        const channelId = channel.id || '';
        if (channelId.includes('creator-')) continue;

        // Find the other user in the channel
        const members = Object.values(channel.state.members);
        const otherMember = members.find((m: any) => m.user_id !== user.id);

        if (otherMember?.user) {
          dms.push({
            channel,
            otherUser: {
              id: otherMember.user.id,
              name: otherMember.user.name || 'Unknown',
              image: otherMember.user.image,
            },
            unreadCount: channel.state.unreadCount || 0,
          });
        }
      }

      setDmChannels(dms);
    } catch (err) {
      console.error('Failed to fetch DM channels:', err);
    }
  }, [chatClient, user]);

  // Fetch unread counts for all channels
  const fetchUnreadCounts = useCallback(async () => {
    if (!chatClient || !user) return;

    try {
      const filter = {
        type: 'messaging',
        members: { $in: [user.id] },
      };

      const channels = await chatClient.queryChannels(filter, {}, { limit: 50, state: true });

      const counts: Record<string, number> = {};
      for (const channel of channels) {
        if (channel.id) {
          counts[channel.id] = channel.state.unreadCount || 0;
        }
      }

      setChannelUnreadCounts(counts);
    } catch (err) {
      console.error('Failed to fetch unread counts:', err);
    }
  }, [chatClient, user]);

  useEffect(() => {
    if (isConnected && user) {
      fetchChannels();
      fetchUnreadCounts();
      fetchDMChannels(); // Fetch DMs for both creators and supporters
    }
  }, [isConnected, user, fetchChannels, fetchDMChannels, fetchUnreadCounts]);

  // Listen for new messages to update unread counts
  useEffect(() => {
    if (!chatClient) return;

    const handleNewMessage = () => {
      fetchUnreadCounts();
      fetchDMChannels(); // Update DMs for both creators and supporters
    };

    chatClient.on('message.new', handleNewMessage);
    chatClient.on('notification.message_new', handleNewMessage);
    chatClient.on('notification.mark_read', handleNewMessage);

    return () => {
      chatClient.off('message.new', handleNewMessage);
      chatClient.off('notification.message_new', handleNewMessage);
      chatClient.off('notification.mark_read', handleNewMessage);
    };
  }, [chatClient, fetchUnreadCounts, fetchDMChannels]);

  // Handle avatar clicks for DM (using event delegation)
  useEffect(() => {
    if (!chatContainerRef.current || !isCreator) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const avatar = target.closest('.str-chat__avatar');

      if (avatar) {
        // Find the message element to get user info
        const messageContainer = avatar.closest('.str-chat__message');
        if (messageContainer) {
          const userIdAttr = messageContainer.getAttribute('data-user-id');
          const messageElement = messageContainer.querySelector('.str-chat__message-sender-name');
          const userName = messageElement?.textContent || 'Unknown';
          const avatarImg = avatar.querySelector('img') as HTMLImageElement;
          const userImage = avatarImg?.src;

          // Try to get user ID from the message data
          if (userIdAttr && userIdAttr !== user?.id) {
            setSelectedUser({
              id: userIdAttr,
              name: userName,
              image: userImage,
            });
          }
        }
      }
    };

    const container = chatContainerRef.current;
    container.addEventListener('click', handleClick);

    return () => {
      container.removeEventListener('click', handleClick);
    };
  }, [isCreator, user?.id]);

  const toggleServer = (serverId: string) => {
    setExpandedServers(prev => {
      const next = new Set(prev);
      if (next.has(serverId)) {
        next.delete(serverId);
      } else {
        next.add(serverId);
      }
      return next;
    });
  };

  // Mobile: select a server to view its channels
  const selectServerMobile = (server: Server) => {
    setSelectedServer(server);
    setMobileView('channels');
    setExpandedServers(prev => new Set([...prev, server.id]));
  };

  // Mobile: go back to servers list
  const goBackToServers = () => {
    setMobileView('servers');
    setSelectedServer(null);
  };

  // Mobile: go back to channels list
  const goBackToChannels = () => {
    setMobileView('channels');
    setActiveChannel(null);
  };

  const selectChannel = async (channel: SupabaseChannel, isRetry = false) => {
    if (!chatClient || !channel.stream_channel_id) return;

    setChannelError(null);
    try {
      const streamChannel = chatClient.channel('messaging', channel.stream_channel_id);
      await streamChannel.watch();
      setActiveChannel(streamChannel);
      setMobileView('chat');

      // Mark as read and update counts
      await streamChannel.markRead();
      fetchUnreadCounts();
    } catch (err: any) {
      if ((err?.message?.includes('not allowed') || err?.code === 17) && !isRetry) {
        try {
          await fetch('/api/stream/resync-my-channels', { method: 'POST' });
          await new Promise(resolve => setTimeout(resolve, 500));
          return selectChannel(channel, true);
        } catch {
          setChannelError('Unable to access this channel. Please try again later.');
        }
      } else {
        setChannelError('Unable to access this channel. Please try again later.');
      }
    }
  };

  const selectDMChannel = async (dmChannel: DMChannel) => {
    try {
      await dmChannel.channel.watch();
      setActiveChannel(dmChannel.channel);
      setMobileView('chat');

      // Mark as read
      await dmChannel.channel.markRead();
      fetchUnreadCounts();
      fetchDMChannels();
    } catch (err) {
      setChannelError('Unable to open this conversation.');
    }
  };

  const handleCreateChannel = async (name: string, selectedSupporterIds: string[]) => {
    try {
      const response = await fetch('/api/community/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          channel_type: 'text',
          selected_supporters: selectedSupporterIds,
        }),
      });

      if (response.ok) {
        setShowCreateChannel(false);
        fetchChannels();
      }
    } catch (err) {
      // Silent fail
    }
  };

  // Handle opening user profile popup
  const handleUserClick = useCallback((userId: string, userName: string, userImage?: string, createdAt?: string) => {
    if (userId === user?.id) return;
    setSelectedUser({ id: userId, name: userName, image: userImage, createdAt });
  }, [user?.id]);

  // Handle starting a DM
  const handleStartDM = useCallback(async (userId: string) => {
    if (!chatClient || !user) return;

    try {
      const channel = chatClient.channel('messaging', {
        members: [user.id, userId],
      });
      await channel.create();
      await channel.watch();
      setActiveChannel(channel);
      setSelectedUser(null);
      setMobileView('chat');

      // Refresh DM list
      fetchDMChannels();
    } catch (err) {
      console.error('Failed to create DM:', err);
    }
  }, [chatClient, user, fetchDMChannels]);

  // Show loading state while connecting
  if (isConnecting) {
    return (
      <div className={`flex items-center justify-center h-full bg-background ${className}`}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground">Connecting to chat...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={`flex items-center justify-center h-full bg-background ${className}`}>
        <div className="text-center p-6">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Connection Error</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={reconnect}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show message if not connected
  if (!isConnected || !chatClient) {
    return (
      <div className={`flex items-center justify-center h-full bg-background ${className}`}>
        <div className="text-center p-6">
          <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Chat Not Available</h3>
          <p className="text-muted-foreground">Please sign in to access community chat.</p>
        </div>
      </div>
    );
  }

  const renderChannelItem = (channel: SupabaseChannel) => {
    const isActive = activeChannel?.id === channel.stream_channel_id;
    const isDisabled = !channel.stream_channel_id;
    const unreadCount = channel.stream_channel_id ? channelUnreadCounts[channel.stream_channel_id] || 0 : 0;

    return (
      <button
        key={channel.id}
        onClick={() => selectChannel(channel)}
        disabled={isDisabled}
        className={`
          w-full px-3 py-1.5 flex items-center gap-2 text-left text-sm rounded transition-colors
          ${isActive
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-foreground hover:bg-muted'
          }
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="truncate flex-1">{channel.name}</span>
        {channel.min_tier_required === 3 && (
          <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />
        )}
        {unreadCount > 0 && (
          <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    );
  };

  const renderDMItem = (dm: DMChannel) => {
    const isActive = activeChannel?.id === dm.channel.id;

    return (
      <button
        key={dm.channel.id}
        onClick={() => selectDMChannel(dm)}
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
  };

  // Render server for desktop (expandable)
  const renderServerDesktop = (server: Server, isMyServer: boolean) => {
    const isExpanded = expandedServers.has(server.id);

    return (
      <div key={server.id} className="mb-2">
        <button
          onClick={() => toggleServer(server.id)}
          className="w-full px-3 py-2 flex items-center gap-2 text-left hover:bg-muted rounded transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {server.image ? (
              <img src={server.image} alt={server.name} className="w-full h-full object-cover" />
            ) : (
              <Users className="h-3 w-3 text-primary" />
            )}
          </div>
          <span className="font-medium text-foreground truncate flex-1">{server.name}</span>
        </button>

        {isExpanded && (
          <div className="ml-4 pl-2 border-l border-border mt-1 space-y-0.5">
            {server.channels.map(channel => renderChannelItem(channel))}

            {isMyServer && isCreator && (
              <button
                onClick={() => setShowCreateChannel(true)}
                className="w-full px-3 py-1.5 flex items-center gap-2 text-left text-sm text-muted-foreground hover:text-primary hover:bg-muted rounded transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create Channel</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render server for mobile (tap to view channels)
  const renderServerMobile = (server: Server) => {
    // Calculate total unread for this server
    const totalUnread = server.channels.reduce((sum, ch) => {
      return sum + (ch.stream_channel_id ? channelUnreadCounts[ch.stream_channel_id] || 0 : 0);
    }, 0);

    return (
      <button
        key={server.id}
        onClick={() => selectServerMobile(server)}
        className="w-full p-4 flex items-center gap-3 text-left hover:bg-muted rounded-lg transition-colors border border-border bg-card mb-2"
      >
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
          {server.image ? (
            <img src={server.image} alt={server.name} className="w-full h-full object-cover" />
          ) : (
            <Users className="h-6 w-6 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{server.name}</h3>
          <p className="text-sm text-muted-foreground">
            {server.channels.length} channel{server.channels.length !== 1 ? 's' : ''}
          </p>
        </div>
        {totalUnread > 0 && (
          <span className="flex-shrink-0 min-w-[24px] h-6 px-2 bg-primary text-primary-foreground text-sm font-medium rounded-full flex items-center justify-center">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      </button>
    );
  };

  // All servers for mobile view
  const allServers = [...otherServers, ...(myServer ? [myServer] : [])];

  return (
    <div className={`stream-chat-wrapper h-full ${className}`} ref={chatContainerRef}>
      <Chat client={chatClient} theme={streamTheme}>
        {/* Desktop Layout - side by side */}
        <div className="hidden md:flex h-full">
          {/* Channel List Sidebar */}
          <div className="w-72 border-r border-border flex-shrink-0 bg-muted/50 flex flex-col">
            <div className="p-4 border-b border-border bg-card">
              <h2 className="text-lg font-semibold text-foreground">Community</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                </div>
              ) : (
                <>
                  {/* My Channels Section - channels from OTHER creators I support */}
                  {otherServers.length > 0 && (
                    <div className="mb-4">
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        My Channels
                      </div>
                      {otherServers.map(server => renderServerDesktop(server, false))}
                    </div>
                  )}

                  {/* My Server Section - only for creators showing their OWN channels */}
                  {isCreator && myServer && (
                    <div className="mb-4">
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        My Server
                      </div>
                      {renderServerDesktop(myServer, true)}
                    </div>
                  )}

                  {/* Direct Messages Section - for both creators and supporters */}
                  {dmChannels.length > 0 && (
                    <div className="mb-4">
                      <button
                        onClick={() => setExpandedDMs(!expandedDMs)}
                        className="w-full px-3 py-2 flex items-center gap-2 text-left"
                      >
                        {expandedDMs ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {isCreator ? 'Direct Messages' : 'Messages'}
                        </span>
                        {dmChannels.reduce((sum, dm) => sum + dm.unreadCount, 0) > 0 && (
                          <span className="ml-auto min-w-[20px] h-5 px-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center justify-center">
                            {dmChannels.reduce((sum, dm) => sum + dm.unreadCount, 0)}
                          </span>
                        )}
                      </button>
                      {expandedDMs && (
                        <div className="ml-4 pl-2 border-l border-border mt-1 space-y-0.5">
                          {dmChannels.map(dm => renderDMItem(dm))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Empty state */}
                  {otherServers.length === 0 && !myServer && (
                    <div className="p-4 text-center text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No channels yet</p>
                      <p className="text-xs mt-1">Support a creator to join their community</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {activeChannel ? (
              <Channel channel={activeChannel}>
                <Window>
                  <CustomChannelHeader />
                  <MessageList />
                  <MessageInput focus />
                </Window>
                <Thread />
              </Channel>
            ) : channelError ? (
              <div className="flex items-center justify-center h-full bg-muted/50">
                <div className="text-center p-6">
                  <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Channel Access Error
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    {channelError}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full bg-muted/50">
                <div className="text-center p-6">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Select a Channel
                  </h3>
                  <p className="text-muted-foreground">
                    Choose a channel from the list to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Layout - stacked views with navigation */}
        <div className="md:hidden h-full flex flex-col">
          {/* Mobile: Servers List View */}
          {mobileView === 'servers' && (
            <div className="h-full flex flex-col bg-background">
              <div className="p-4 border-b border-border bg-card">
                <h2 className="text-lg font-semibold text-foreground">Community</h2>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                  </div>
                ) : (
                  <>
                    {/* Other servers (My Channels) */}
                    {otherServers.length > 0 && (
                      <div className="mb-4">
                        <div className="px-1 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          My Channels
                        </div>
                        {otherServers.map(server => renderServerMobile(server))}
                      </div>
                    )}

                    {/* My Server */}
                    {isCreator && myServer && (
                      <div className="mb-4">
                        <div className="px-1 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          My Server
                        </div>
                        {renderServerMobile(myServer)}
                      </div>
                    )}

                    {/* Direct Messages for mobile - for both creators and supporters */}
                    {dmChannels.length > 0 && (
                      <div className="mb-4">
                        <div className="px-1 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          {isCreator ? 'Direct Messages' : 'Messages'}
                          {dmChannels.reduce((sum, dm) => sum + dm.unreadCount, 0) > 0 && (
                            <span className="min-w-[20px] h-5 px-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center justify-center">
                              {dmChannels.reduce((sum, dm) => sum + dm.unreadCount, 0)}
                            </span>
                          )}
                        </div>
                        {dmChannels.map(dm => {
                          const isActive = activeChannel?.id === dm.channel.id;
                          return (
                            <button
                              key={dm.channel.id}
                              onClick={() => selectDMChannel(dm)}
                              className="w-full p-4 flex items-center gap-3 text-left hover:bg-muted rounded-lg transition-colors border border-border bg-card mb-2"
                            >
                              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                                {dm.otherUser.image ? (
                                  <img src={dm.otherUser.image} alt={dm.otherUser.name} className="w-full h-full object-cover" />
                                ) : (
                                  <MessageCircle className="h-6 w-6 text-primary" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-foreground truncate">{dm.otherUser.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {isCreator ? 'Direct Message' : 'Message from Creator'}
                                </p>
                              </div>
                              {dm.unreadCount > 0 && (
                                <span className="flex-shrink-0 min-w-[24px] h-6 px-2 bg-primary text-primary-foreground text-sm font-medium rounded-full flex items-center justify-center">
                                  {dm.unreadCount > 99 ? '99+' : dm.unreadCount}
                                </span>
                              )}
                              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Empty state */}
                    {allServers.length === 0 && dmChannels.length === 0 && (
                      <div className="p-4 text-center text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-base font-medium">No servers yet</p>
                        <p className="text-sm mt-1">Support a creator to join their community</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Mobile: Channels List View */}
          {mobileView === 'channels' && selectedServer && (
            <div className="h-full flex flex-col bg-background">
              <div className="p-4 border-b border-border bg-card flex items-center gap-3">
                <button
                  onClick={goBackToServers}
                  className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-foreground" />
                </button>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {selectedServer.image ? (
                      <img src={selectedServer.image} alt={selectedServer.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <h2 className="text-lg font-semibold text-foreground truncate">{selectedServer.name}</h2>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-1">
                  {selectedServer.channels.map(channel => {
                    const isActive = activeChannel?.id === channel.stream_channel_id;
                    const isDisabled = !channel.stream_channel_id;
                    const unreadCount = channel.stream_channel_id ? channelUnreadCounts[channel.stream_channel_id] || 0 : 0;

                    return (
                      <button
                        key={channel.id}
                        onClick={() => selectChannel(channel)}
                        disabled={isDisabled}
                        className={`
                          w-full px-4 py-3 flex items-center gap-3 text-left rounded-lg transition-colors border
                          ${isActive
                            ? 'bg-primary/10 text-primary font-medium border-primary/30'
                            : 'text-foreground hover:bg-muted border-transparent'
                          }
                          ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <Hash className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <span className="truncate flex-1 text-base">{channel.name}</span>
                        {channel.min_tier_required === 3 && (
                          <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                        )}
                        {unreadCount > 0 && (
                          <span className="flex-shrink-0 min-w-[24px] h-6 px-2 bg-primary text-primary-foreground text-sm font-medium rounded-full flex items-center justify-center">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      </button>
                    );
                  })}

                  {/* Create channel button for own server */}
                  {selectedServer.id === myServer?.id && isCreator && (
                    <button
                      onClick={() => setShowCreateChannel(true)}
                      className="w-full px-4 py-3 flex items-center gap-3 text-left text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors border border-dashed border-border"
                    >
                      <Plus className="h-5 w-5" />
                      <span className="text-base">Create Channel</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Mobile: Chat View */}
          {mobileView === 'chat' && activeChannel && (
            <div className="h-full flex flex-col">
              <Channel channel={activeChannel}>
                <Window>
                  {/* Custom mobile header with back button */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card">
                    <button
                      onClick={goBackToChannels}
                      className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5 text-foreground" />
                    </button>
                    <MobileChannelHeader />
                  </div>
                  <MessageList />
                  <MessageInput focus />
                </Window>
                <Thread />
              </Channel>
            </div>
          )}

          {/* Mobile: Error state */}
          {mobileView === 'chat' && channelError && (
            <div className="h-full flex flex-col bg-background">
              <div className="p-4 border-b border-border bg-card flex items-center gap-3">
                <button
                  onClick={goBackToChannels}
                  className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-foreground" />
                </button>
                <h2 className="text-lg font-semibold text-foreground">Error</h2>
              </div>
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Channel Access Error
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    {channelError}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Chat>

      {/* Create Channel Modal */}
      {showCreateChannel && (
        <CreateChannelModal
          onClose={() => setShowCreateChannel(false)}
          onCreate={handleCreateChannel}
        />
      )}

      {/* User Profile Popup for DM */}
      {selectedUser && isCreator && (
        <UserProfilePopup
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onStartDM={handleStartDM}
        />
      )}

      {/* Custom styles to match the app theme */}
      <style jsx global>{`
        .stream-chat-wrapper {
          --str-chat__primary-color: #9333ea;
          --str-chat__active-primary-color: #7e22ce;
          --str-chat__border-radius-circle: 9999px;
          --str-chat__border-radius-sm: 0.5rem;
          --str-chat__border-radius-md: 0.75rem;
          --str-chat__border-radius-lg: 1rem;
          --str-chat__font-family: var(--font-space-grotesk), system-ui, sans-serif;
        }

        .str-chat__channel-list {
          background: transparent !important;
        }

        .str-chat__channel-preview-messenger--active {
          background: rgba(147, 51, 234, 0.1) !important;
          border-left: 3px solid #9333ea !important;
        }

        .str-chat__channel-preview-messenger:hover {
          background: rgba(147, 51, 234, 0.05) !important;
        }

        .str-chat__message-simple--me .str-chat__message-bubble {
          background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%) !important;
          color: white !important;
        }

        .str-chat__message-input {
          border-top: 1px solid var(--border) !important;
        }

        .str-chat__send-button {
          background: #9333ea !important;
        }

        .str-chat__send-button:hover {
          background: #7e22ce !important;
        }

        .str-chat__channel-search-input {
          border-radius: 0.5rem !important;
        }

        .str-chat__thread {
          border-left: 1px solid var(--border);
        }

        /* Make avatars clickable for creators */
        .str-chat__avatar {
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .str-chat__avatar:hover {
          opacity: 0.8;
        }

        /* Dark mode overrides */
        .dark .stream-chat-wrapper .str-chat__theme-dark {
          --str-chat__background-color: var(--background);
          --str-chat__secondary-background-color: var(--card);
          --str-chat__primary-surface-color: var(--muted);
          --str-chat__text-color: var(--foreground);
          --str-chat__secondary-text-color: var(--muted-foreground);
          --str-chat__border-color: var(--border);
        }

        .dark .str-chat__main-panel,
        .dark .str-chat__channel,
        .dark .str-chat__container {
          background: var(--background) !important;
        }

        .dark .str-chat__message-list {
          background: var(--background) !important;
        }

        .dark .str-chat__message-input {
          background: var(--card) !important;
          border-top-color: var(--border) !important;
        }

        .dark .str-chat__input-flat {
          background: var(--muted) !important;
        }

        .dark .str-chat__message-simple:not(.str-chat__message-simple--me) .str-chat__message-bubble {
          background: var(--muted) !important;
          color: var(--foreground) !important;
        }

        .dark .str-chat__thread {
          background: var(--card) !important;
          border-left-color: var(--border) !important;
        }

        .dark .str-chat__message-text p,
        .dark .str-chat__message-text {
          color: inherit !important;
        }

        /* System messages (join/leave) styling */
        .str-chat__message--system {
          text-align: center;
          padding: 8px 16px;
          margin: 8px 0;
        }

        .str-chat__message--system .str-chat__message-text {
          font-size: 0.75rem;
          color: var(--muted-foreground) !important;
          background: transparent !important;
          padding: 0;
        }

        .str-chat__message--system .str-chat__message-text p {
          color: var(--muted-foreground) !important;
        }

        .str-chat__message--system .str-chat__avatar,
        .str-chat__message--system .str-chat__message-data,
        .str-chat__message--system .str-chat__message-inner > div:not(.str-chat__message-text) {
          display: none !important;
        }

        /* Custom system message styling */
        .str-chat__system-message {
          text-align: center;
          padding: 12px 16px;
        }

        .str-chat__system-message__text {
          font-size: 0.8rem;
          color: var(--muted-foreground);
          background: var(--muted);
          padding: 6px 12px;
          border-radius: 9999px;
          display: inline-block;
        }

        /* Hide avatar in reply/quoted message preview */
        .str-chat__quoted-message-preview .str-chat__avatar,
        .str-chat__thread-header .str-chat__avatar,
        .str-chat__parent-message-li .str-chat__avatar {
          display: none !important;
        }

        /* Adjust spacing after hiding avatar */
        .str-chat__quoted-message-preview .str-chat__message-inner {
          margin-left: 0 !important;
        }
      `}</style>
    </div>
  );
}

// Mobile Channel Header - simplified version for mobile chat view
function MobileChannelHeader() {
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
    // This is a DM, find the other user
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

// Create Channel Modal Component with Supporter Selection
function CreateChannelModal({
  onClose,
  onCreate
}: {
  onClose: () => void;
  onCreate: (name: string, selectedSupporterIds: string[]) => void;
}) {
  const [name, setName] = useState('');
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [selectedSupporters, setSelectedSupporters] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSupporters = async () => {
      try {
        const response = await fetch('/api/creator/supporters');
        if (response.ok) {
          const data = await response.json();
          setSupporters(data.supporters || []);
        }
      } catch (err) {
        // Silent fail
      } finally {
        setIsLoading(false);
      }
    };
    fetchSupporters();
  }, []);

  const filteredSupporters = supporters.filter(s =>
    s.user.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSupporter = (supporterId: string) => {
    setSelectedSupporters(prev => {
      const next = new Set(prev);
      if (next.has(supporterId)) {
        next.delete(supporterId);
      } else {
        next.add(supporterId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedSupporters(new Set(filteredSupporters.map(s => s.supporter_id)));
  };

  const deselectAll = () => {
    setSelectedSupporters(new Set());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    onCreate(name.trim(), Array.from(selectedSupporters));
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg w-full max-w-lg mx-4 max-h-[80vh] flex flex-col border border-border">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Create Channel</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Channel Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., announcements"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-foreground">
                  Select Supporters ({selectedSupporters.size} selected)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-xs text-primary hover:underline"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search supporters..."
                  className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-2 min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredSupporters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No supporters found</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredSupporters.map(supporter => (
                  <button
                    key={supporter.supporter_id}
                    type="button"
                    onClick={() => toggleSupporter(supporter.supporter_id)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      selectedSupporters.has(supporter.supporter_id)
                        ? 'bg-primary/10 border border-primary/30'
                        : 'hover:bg-muted border border-transparent'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                      selectedSupporters.has(supporter.supporter_id)
                        ? 'bg-primary border-primary'
                        : 'border-border'
                    }`}>
                      {selectedSupporters.has(supporter.supporter_id) && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {supporter.user.photo_url ? (
                        <img src={supporter.user.photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Users className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-foreground text-sm">
                        {supporter.user.display_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {supporter.tier_level} Star Supporter
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || selectedSupporters.size === 0 || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Create'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// User Profile Popup for DM
function UserProfilePopup({
  user,
  onClose,
  onStartDM,
}: {
  user: { id: string; name: string; image?: string; createdAt?: string };
  onClose: () => void;
  onStartDM: (userId: string) => void;
}) {
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

export default StreamChatWrapper;
