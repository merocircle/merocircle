"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Chat,
  Channel,
  Window,
  MessageList,
  MessageInput,
  Thread,
} from 'stream-chat-react';
import type { Channel as StreamChannelType } from 'stream-chat';
import { useStreamChat } from '@/contexts/stream-chat-context';
import { useAuth } from '@/contexts/supabase-auth-context';
import { useTheme } from 'next-themes';
import { CustomChannelHeader } from './CustomChannelHeader';
import {
  Loader2, MessageSquare, AlertCircle, Plus,
  ChevronDown, ChevronRight, Users, ArrowLeft, MessageCircle, Send
} from 'lucide-react';
import { useChannels, useDMChannels, useUnreadCounts } from './hooks';
import { 
  MobileChannelHeader, 
  CreateChannelModal, 
  UserProfilePopup,
  ChannelListItem,
  DMListItem
} from './components';
import type { MobileView, DMChannel } from './types';
import type { Server, SupabaseChannel } from './hooks/useChannels';
import 'stream-chat-react/dist/css/v2/index.css';

interface StreamChatWrapperProps {
  className?: string;
}

export function StreamChatWrapper({ className = '' }: StreamChatWrapperProps) {
  const { chatClient, isConnecting, isConnected, error, reconnect } = useStreamChat();
  const { user, isCreator } = useAuth();
  const { resolvedTheme } = useTheme();
  
  // State
  const [activeChannel, setActiveChannel] = useState<StreamChannelType | null>(null);
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set());
  const [expandedDMs, setExpandedDMs] = useState(true);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [channelError, setChannelError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; image?: string; createdAt?: string } | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>('servers');
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Custom hooks
  const { otherServers, myServer, loading, fetchChannels } = useChannels(user);
  const { dmChannels, fetchDMChannels } = useDMChannels(chatClient, user);
  const { channelUnreadCounts, fetchUnreadCounts } = useUnreadCounts(chatClient, user);

  const streamTheme = resolvedTheme === 'dark' ? 'str-chat__theme-dark' : 'str-chat__theme-light';

  // Initialize data
  useEffect(() => {
    if (isConnected && user) {
      fetchChannels();
      fetchUnreadCounts();
      fetchDMChannels();
    }
  }, [isConnected, user, fetchChannels, fetchDMChannels, fetchUnreadCounts]);

  // Auto-expand servers when loaded
  useEffect(() => {
    if (!loading && (otherServers.length > 0 || myServer)) {
      const allIds = new Set([...otherServers.map(s => s.id), ...(myServer ? [myServer.id] : [])]);
      setExpandedServers(allIds);
    }
  }, [loading, otherServers, myServer]);

  // Listen for new messages
  useEffect(() => {
    if (!chatClient) return;

    const handleNewMessage = () => {
      fetchUnreadCounts();
      fetchDMChannels();
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

  // Handle avatar clicks for DM
  useEffect(() => {
    if (!chatContainerRef.current || !isCreator) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const avatar = target.closest('.str-chat__avatar');

      if (avatar) {
        const messageContainer = avatar.closest('.str-chat__message');
        if (messageContainer) {
          const userIdAttr = messageContainer.getAttribute('data-user-id');
          const messageElement = messageContainer.querySelector('.str-chat__message-sender-name');
          const userName = messageElement?.textContent || 'Unknown';
          const avatarImg = avatar.querySelector('img') as HTMLImageElement;
          const userImage = avatarImg?.src;

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
    return () => container.removeEventListener('click', handleClick);
  }, [isCreator, user?.id]);

  // Handlers
  const toggleServer = useCallback((serverId: string) => {
    setExpandedServers(prev => {
      const next = new Set(prev);
      if (next.has(serverId)) {
        next.delete(serverId);
      } else {
        next.add(serverId);
      }
      return next;
    });
  }, []);

  const selectServerMobile = useCallback((server: Server) => {
    setSelectedServer(server);
    setMobileView('channels');
    setExpandedServers(prev => new Set([...prev, server.id]));
  }, []);

  const goBackToServers = useCallback(() => {
    setMobileView('servers');
    setSelectedServer(null);
  }, []);

  const goBackToChannels = useCallback(() => {
    setMobileView('channels');
    setActiveChannel(null);
  }, []);

  const selectChannel = useCallback(async (channel: SupabaseChannel, isRetry = false) => {
    if (!chatClient || !channel.stream_channel_id) return;

    setChannelError(null);
    try {
      const streamChannel = chatClient.channel('messaging', channel.stream_channel_id);
      await streamChannel.watch();
      setActiveChannel(streamChannel);
      setMobileView('chat');
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
  }, [chatClient, fetchUnreadCounts]);

  const selectDMChannel = useCallback(async (dmChannel: DMChannel) => {
    try {
      await dmChannel.channel.watch();
      setActiveChannel(dmChannel.channel);
      setMobileView('chat');
      await dmChannel.channel.markRead();
      fetchUnreadCounts();
      fetchDMChannels();
    } catch (err) {
      setChannelError('Unable to open this conversation.');
    }
  }, [fetchUnreadCounts, fetchDMChannels]);

  const handleCreateChannel = useCallback(async (name: string, selectedSupporterIds: string[]) => {
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
  }, [fetchChannels]);

  const handleStartDM = useCallback(async (userId: string) => {
    if (!chatClient || !user || userId === user.id) return;

    try {
      const channel = chatClient.channel('messaging', {
        members: [user.id, userId],
      });
      await channel.create();
      await channel.watch();
      setActiveChannel(channel);
      setSelectedUser(null);
      setMobileView('chat');
      fetchDMChannels();
    } catch (err) {
      console.error('Failed to create DM:', err);
    }
  }, [chatClient, user, fetchDMChannels]);

  // Custom message actions
  const CustomMessageActionsList = useMemo(() => {
    if (!isCreator) return undefined;

    return (props: any) => {
      const senderId = props.message?.user?.id;
      if (!senderId || senderId === user?.id) return null;

      return (
        <div className="str-chat__message-actions-list">
          <button
            className="str-chat__message-actions-list-item"
            onClick={() => {
              handleStartDM(senderId);
              if (props.setOpen) props.setOpen(false);
            }}
          >
            <Send className="h-4 w-4 mr-2" />
            Send DM
          </button>
        </div>
      );
    };
  }, [isCreator, user?.id, handleStartDM]);

  // Render helpers
  const renderServerDesktop = useCallback((server: Server, isMyServer: boolean) => {
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
            {server.channels.map(channel => (
              <ChannelListItem
                key={channel.id}
                channel={channel}
                isActive={activeChannel?.id === channel.stream_channel_id}
                isDisabled={!channel.stream_channel_id}
                unreadCount={channel.stream_channel_id ? channelUnreadCounts[channel.stream_channel_id] || 0 : 0}
                onClick={() => selectChannel(channel)}
              />
            ))}
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
  }, [expandedServers, toggleServer, activeChannel, channelUnreadCounts, selectChannel, isCreator]);

  const renderServerMobile = useCallback((server: Server) => {
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
  }, [channelUnreadCounts, selectServerMobile]);

  // Loading/Error states
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

  const allServers = [...otherServers, ...(myServer ? [myServer] : [])];

  return (
    <div className={`stream-chat-wrapper h-full overflow-hidden ${className}`} ref={chatContainerRef}>
      <Chat client={chatClient} theme={streamTheme}>
        {/* Desktop Layout */}
        <div className="hidden md:flex h-full overflow-hidden">
          <div className="w-72 border-r border-border flex-shrink-0 bg-muted/50 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border bg-card flex-shrink-0">
              <h2 className="text-lg font-semibold text-foreground">Community</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-2 min-h-0">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                </div>
              ) : (
                <>
                  {otherServers.length > 0 && (
                    <div className="mb-4">
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        My Channels
                      </div>
                      {otherServers.map(server => renderServerDesktop(server, false))}
                    </div>
                  )}

                  {isCreator && myServer && (
                    <div className="mb-4">
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        My Server
                      </div>
                      {renderServerDesktop(myServer, true)}
                    </div>
                  )}

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
                          {dmChannels.map(dm => (
                            <DMListItem
                              key={dm.channel.id}
                              dm={dm}
                              isActive={activeChannel?.id === dm.channel.id}
                              onClick={() => selectDMChannel(dm)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

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
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {activeChannel ? (
              <Channel channel={activeChannel} CustomMessageActionsList={CustomMessageActionsList}>
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
                  <h3 className="text-lg font-semibold text-foreground mb-2">Channel Access Error</h3>
                  <p className="text-muted-foreground max-w-md">{channelError}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full bg-muted/50">
                <div className="text-center p-6">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Select a Channel</h3>
                  <p className="text-muted-foreground">Choose a channel from the list to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden h-full flex flex-col overflow-hidden">
          {mobileView === 'servers' && (
            <div className="h-full flex flex-col bg-background overflow-hidden">
              <div className="p-4 border-b border-border bg-card flex-shrink-0">
                <h2 className="text-lg font-semibold text-foreground">Community</h2>
              </div>

              <div className="flex-1 overflow-y-auto p-4 min-h-0">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                  </div>
                ) : (
                  <>
                    {otherServers.length > 0 && (
                      <div className="mb-4">
                        <div className="px-1 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          My Channels
                        </div>
                        {otherServers.map(server => renderServerMobile(server))}
                      </div>
                    )}

                    {isCreator && myServer && (
                      <div className="mb-4">
                        <div className="px-1 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          My Server
                        </div>
                        {renderServerMobile(myServer)}
                      </div>
                    )}

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

          {mobileView === 'channels' && selectedServer && (
            <div className="h-full flex flex-col bg-background overflow-hidden">
              <div className="p-4 border-b border-border bg-card flex items-center gap-3 flex-shrink-0">
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

              <div className="flex-1 overflow-y-auto p-4 min-h-0">
                <div className="space-y-1">
                  {selectedServer.channels.map(channel => (
                    <ChannelListItem
                      key={channel.id}
                      channel={channel}
                      isActive={activeChannel?.id === channel.stream_channel_id}
                      isDisabled={!channel.stream_channel_id}
                      unreadCount={channel.stream_channel_id ? channelUnreadCounts[channel.stream_channel_id] || 0 : 0}
                      onClick={() => selectChannel(channel)}
                    />
                  ))}

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

          {mobileView === 'chat' && activeChannel && (
            <div className="h-full flex flex-col overflow-hidden">
              <Channel channel={activeChannel} CustomMessageActionsList={CustomMessageActionsList}>
                <Window>
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card flex-shrink-0">
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

          {mobileView === 'chat' && channelError && (
            <div className="h-full flex flex-col bg-background overflow-hidden">
              <div className="p-4 border-b border-border bg-card flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={goBackToChannels}
                  className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-foreground" />
                </button>
                <h2 className="text-lg font-semibold text-foreground">Error</h2>
              </div>
              <div className="flex-1 flex items-center justify-center p-6 min-h-0">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Channel Access Error</h3>
                  <p className="text-muted-foreground max-w-md">{channelError}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Chat>

      {/* Modals */}
      {showCreateChannel && (
        <CreateChannelModal
          onClose={() => setShowCreateChannel(false)}
          onCreate={handleCreateChannel}
        />
      )}

      {selectedUser && isCreator && (
        <UserProfilePopup
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onStartDM={handleStartDM}
        />
      )}

      {/* Styles */}
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

        .str-chat__avatar {
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .str-chat__avatar:hover {
          opacity: 0.8;
        }

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

        .str-chat__quoted-message-preview .str-chat__avatar,
        .str-chat__thread-header .str-chat__avatar,
        .str-chat__parent-message-li .str-chat__avatar {
          display: none !important;
        }

        .str-chat__quoted-message-preview .str-chat__message-inner {
          margin-left: 0 !important;
        }

        .str-chat__message-actions-list-item {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          cursor: pointer;
          border: none;
          background: transparent;
          color: var(--foreground);
          font-size: 14px;
          transition: all 0.2s;
          width: 100%;
          text-align: left;
        }

        .str-chat__message-actions-list-item:hover {
          background: var(--muted);
          color: var(--primary);
        }

        .str-chat__message-actions-list-item svg {
          flex-shrink: 0;
        }

        .dark .str-chat__message-actions-list-item {
          color: var(--foreground);
        }

        .dark .str-chat__message-actions-list-item:hover {
          background: var(--muted);
          color: var(--primary);
        }
      `}</style>
    </div>
  );
}

export default StreamChatWrapper;
