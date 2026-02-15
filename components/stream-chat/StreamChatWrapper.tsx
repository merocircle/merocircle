"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Chat,
  Channel,
  Window,
  MessageList,
  MessageInput,
} from 'stream-chat-react';
import type { Channel as StreamChannelType } from 'stream-chat';
import { useStreamChat } from '@/contexts/stream-chat-context';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from 'next-themes';
import { CustomChannelHeader } from './CustomChannelHeader';
import { CustomQuotedMessage } from './CustomQuotedMessage';
import { CustomMessageOptions } from './CustomMessageOptions';
import { CustomMessage } from './CustomMessage';
import {
  Loader2, MessageSquare, AlertCircle, Plus,
  ChevronDown, ChevronRight, Users, ArrowLeft, MessageCircle, Send,
  Search, Info, X
} from 'lucide-react';
import { useChannels, useDMChannels, useUnreadCounts } from './hooks';
import { 
  MobileChannelHeader, 
  CreateChannelModal, 
  UserProfilePopup,
  ChannelListItem,
  DMListItem,
} from './components';
import { ChannelInfoPanel } from './components/ChannelInfoPanel';
import type { MobileView, DMChannel } from './types';
import type { Server, SupabaseChannel } from './hooks/useChannels';
import 'stream-chat-react/dist/css/v2/index.css';

interface StreamChatWrapperProps {
  className?: string;
  creatorId?: string; // Filter to show only this creator's server
  channelId?: string; // Stream channel ID to auto-open from URL
}

export function StreamChatWrapper({ className = '', creatorId, channelId: urlChannelId }: StreamChatWrapperProps) {
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
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const urlChannelOpenedRef = useRef(false); // Track if URL channel has been opened

  // Custom hooks
  const { otherServers, myServer, loading, fetchChannels } = useChannels(user);
  const { dmChannels, fetchDMChannels } = useDMChannels(chatClient, user);
  const { channelUnreadCounts, fetchUnreadCounts } = useUnreadCounts(chatClient, user);

  // Filter servers to show only the specified creator's server
  const filteredOtherServers = creatorId 
    ? otherServers.filter((server: Server) => server.id === creatorId)
    : otherServers;
  
  const filteredMyServer = creatorId && myServer?.id === creatorId 
    ? myServer 
    : (!creatorId ? myServer : null);

  const streamTheme = resolvedTheme === 'dark' ? 'str-chat__theme-dark' : 'str-chat__theme-light';

  // Don't add this effect - it can cause infinite loops
  // The channels will load automatically when user connects

  // Initialize data with debouncing to prevent rate limiting
  useEffect(() => {
    if (isConnected && user) {
      // Debounce to prevent too many requests
      const timer = setTimeout(() => {
        fetchChannels();
        // Only fetch unread counts and DMs if not filtering by creator (to reduce API calls)
        if (!creatorId) {
          fetchUnreadCounts();
          fetchDMChannels();
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isConnected, user, fetchChannels, fetchDMChannels, fetchUnreadCounts, creatorId]);

  // Auto-expand servers when loaded
  useEffect(() => {
    if (!loading && (filteredOtherServers.length > 0 || filteredMyServer)) {
      const allIds = new Set([...filteredOtherServers.map((s: Server) => s.id), ...(filteredMyServer ? [filteredMyServer.id] : [])]);
      
      // Only update if the set actually changed
      const currentIds = Array.from(expandedServers).sort().join(',');
      const newIds = Array.from(allIds).sort().join(',');
      
      if (currentIds !== newIds) {
        setExpandedServers(allIds);
      }
    }
  }, [loading, filteredOtherServers, filteredMyServer, expandedServers]);

  // Listen for new messages (debounced to prevent rate limiting)
  useEffect(() => {
    if (!chatClient) return;

    let debounceTimer: NodeJS.Timeout;
    const handleNewMessage = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        // Only fetch if not filtering by creator (to reduce API calls)
        if (!creatorId) {
          fetchUnreadCounts();
          fetchDMChannels();
        } else {
          // When filtering by creator, only fetch unread counts for that creator's channels
          fetchUnreadCounts();
        }
      }, 1000); // Debounce by 1 second
    };

    chatClient.on('message.new', handleNewMessage);
    chatClient.on('notification.message_new', handleNewMessage);
    chatClient.on('notification.mark_read', handleNewMessage);

    return () => {
      clearTimeout(debounceTimer);
      chatClient.off('message.new', handleNewMessage);
      chatClient.off('notification.message_new', handleNewMessage);
      chatClient.off('notification.mark_read', handleNewMessage);
    };
  }, [chatClient, fetchUnreadCounts, fetchDMChannels, creatorId]);

  useEffect(() => {
    if (!chatClient || !user) return;

    const handleMessageNew = async (event: any) => {
      try {
        const message = event.message;
        const messageText = message?.text || '';
        const senderId = message?.user?.id;
        const channelId = message?.cid;
        const mentionedUsers = message?.mentioned_users || [];

        if (senderId !== user.id || !channelId) return;

        const streamChannelId = channelId.split(':')[1];
        if (!streamChannelId) return;

        const hasEveryoneMention = /\@everyone\b/i.test(messageText);
        
        if (hasEveryoneMention) {
          try {
            const response = await fetch('/api/stream/mention-everyone', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                channelId: streamChannelId,
                messageId: message.id,
                senderId,
                messageText,
              }),
            });

            if (!response.ok) {
              console.error('Failed to send @everyone mention emails:', await response.text());
            }
          } catch (error) {
            console.error('Error calling @everyone mention API:', error);
          }
        }

        if (!hasEveryoneMention && mentionedUsers.length > 0) {
          const mentionedUserIds = mentionedUsers
            .map((u: any) => u.id)
            .filter((id: string) => id && id !== senderId); // Filter out sender

          if (mentionedUserIds.length > 0) {
            try {
              const response = await fetch('/api/stream/mention-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  channelId: streamChannelId,
                  messageId: message.id,
                  senderId,
                  messageText,
                  mentionedUserIds,
                }),
              });

              if (!response.ok) {
                console.error('Failed to send user mention emails:', await response.text());
              }
            } catch (error) {
              console.error('Error calling user mention API:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error handling mentions:', error);
      }
    };

    chatClient.on('message.new', handleMessageNew);

    return () => {
      chatClient.off('message.new', handleMessageNew);
    };
  }, [chatClient, user]);

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
    if (!chatClient) {
      setChannelError('Channel not available. This channel may have been deleted. Please refresh the page.');
      return;
    }

    // If channel doesn't have stream_channel_id, try to sync it first
    if (!channel.stream_channel_id) {
      try {
        const syncResponse = await fetch(`/api/community/channels/${channel.id}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (syncResponse.ok) {
          const syncData = await syncResponse.json();
          // Update channel with stream_channel_id
          channel.stream_channel_id = syncData.streamChannelId;
        } else {
          setChannelError('Channel is not synced. Please refresh the page.');
          return;
        }
      } catch (err) {
        setChannelError('Failed to sync channel. Please refresh the page.');
        return;
      }
    }

    setChannelError(null);
    try {
      const streamChannel = chatClient.channel('messaging', channel.stream_channel_id);
      await streamChannel.watch();
      setActiveChannel(streamChannel);
      setMobileView('chat');
      await streamChannel.markRead();
      fetchUnreadCounts();
    } catch (err: any) {
      // If channel doesn't exist or user not a member, provide clearer error
      if (err?.code === 17 || err?.message?.includes('not allowed') || err?.message?.includes('not found')) {
        if (!isRetry) {
          try {
            // Try to resync channels first
            await fetch('/api/stream/resync-my-channels', { method: 'POST' });
            await new Promise(resolve => setTimeout(resolve, 500));
            // Refresh channels list
            fetchChannels();
            return selectChannel(channel, true);
          } catch {
            setChannelError('This channel no longer exists or you do not have access. Please refresh the page to see updated channels.');
          }
        } else {
          setChannelError('This channel no longer exists or you do not have access. Please refresh the page to see updated channels.');
        }
      } else {
        setChannelError('Unable to access this channel. Please try again later.');
      }
    }
  }, [chatClient, fetchUnreadCounts, fetchChannels]);

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

  useEffect(() => {
    if (urlChannelId) {
      urlChannelOpenedRef.current = false;
    }
  }, [urlChannelId]);

  useEffect(() => {
    if (!urlChannelId || !chatClient || !isConnected || !selectChannel) {
      return;
    }

    if (activeChannel) {
      const currentChannelId = (activeChannel.data as any)?.id;
      if (currentChannelId === urlChannelId) {
        urlChannelOpenedRef.current = true;
        return;
      }
    }

    if (loading) {
      return;
    }

    const allServers = [...(filteredMyServer ? [filteredMyServer] : []), ...filteredOtherServers];
    const hasChannels = allServers.some(server => server.channels.length > 0);

    if (!hasChannels) {
      const timeout = setTimeout(() => {
        if (!urlChannelOpenedRef.current) {
          fetchChannels();
        }
      }, 500);
      return () => clearTimeout(timeout);
    }

    if (urlChannelOpenedRef.current && activeChannel) {
      return;
    }

    let targetChannel: SupabaseChannel | null = null;
    let targetServer: Server | null = null;

    for (const server of allServers) {
      const channel = server.channels.find(
        (ch: SupabaseChannel) => ch.stream_channel_id === urlChannelId
      );
      
      if (channel) {
        targetChannel = channel;
        targetServer = server;
        break;
      }
    }

    if (targetChannel && targetServer) {
      urlChannelOpenedRef.current = true;
      
      setExpandedServers(prev => new Set([...prev, targetServer!.id]));
      
      setTimeout(() => {
        selectChannel(targetChannel!);
      }, 100);
    } else {
      // Channel not found in Supabase list, try to access directly from Stream
      // This handles cases where user has access but channel isn't in channel_members yet
      if (chatClient && urlChannelId && !urlChannelOpenedRef.current) {
        urlChannelOpenedRef.current = true;
        
        // Try to access the channel directly
        (async () => {
          try {
            const streamChannel = chatClient.channel('messaging', urlChannelId);
            await streamChannel.watch();
            setActiveChannel(streamChannel);
            setMobileView('chat');
            await streamChannel.markRead();
            fetchUnreadCounts();
          } catch (err: any) {
            // If direct access fails, try to resync channels
            if (err?.message?.includes('not allowed') || err?.code === 17) {
              try {
                await fetch('/api/stream/resync-my-channels', { method: 'POST' });
                await new Promise(resolve => setTimeout(resolve, 1000));
                fetchChannels();
                // Reset the ref so we can try again after resync
                urlChannelOpenedRef.current = false;
              } catch {
                setChannelError('Unable to access this channel. You may not have permission to view this channel.');
              }
            } else {
              setChannelError('Unable to access this channel. You may not have permission to view this channel.');
            }
          }
        })();
      } else if (hasChannels) {
        console.warn(`Channel ${urlChannelId} not found in available channels`, {
          availableChannels: allServers.flatMap(s => s.channels.map(ch => ch.stream_channel_id)),
        });
      }
    }
  }, [
    urlChannelId,
    loading,
    chatClient,
    isConnected,
    selectChannel,
    filteredMyServer,
    filteredOtherServers,
    fetchChannels,
    activeChannel,
  ]);

  useEffect(() => {
    if (creatorId && !urlChannelId && !loading && !activeChannel && selectChannel) {
      const targetServer = filteredMyServer || filteredOtherServers[0];
      if (targetServer && targetServer.channels.length > 0) {
        const firstChannel = targetServer.channels.find((ch: SupabaseChannel) => ch.stream_channel_id);
        if (firstChannel) {
          selectChannel(firstChannel);
        }
      }
    }
  }, [creatorId, urlChannelId, loading, filteredMyServer, filteredOtherServers, activeChannel, selectChannel]);

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

  // Hide thread UI (we only use quote reply, not threads)
  const NoOpMessageRepliesCountButton = useCallback(() => null, []);
  const NoOpThread = useCallback(() => null, []);

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

  // Helper: get last message info for a channel
  const getChannelLastMessage = useCallback((streamChannelId: string | null) => {
    if (!streamChannelId || !chatClient) return { text: '', time: '' };
    try {
      const ch = chatClient.activeChannels?.[streamChannelId] || chatClient.channel('messaging', streamChannelId);
      const msgs = ch?.state?.messages;
      if (msgs && msgs.length > 0) {
        const last = msgs[msgs.length - 1];
        return {
          text: last.text || (last.attachments?.length ? 'Sent an attachment' : ''),
          time: last.created_at ? (typeof last.created_at === 'string' ? last.created_at : last.created_at.toISOString()) : '',
        };
      }
    } catch {}
    return { text: '', time: '' };
  }, [chatClient]);

  // Render helpers
  const renderServerDesktop = useCallback((server: Server, isMyServer: boolean) => {
    const isExpanded = expandedServers.has(server.id);

    return (
      <div key={server.id} className="mb-1">
        <button
          onClick={() => toggleServer(server.id)}
          className="w-full px-3 py-2 flex items-center gap-2.5 text-left hover:bg-muted/50 rounded-lg transition-colors group"
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden ring-1 ring-border/30">
            {server.image ? (
              <img src={server.image} alt={server.name} className="w-full h-full object-cover" />
            ) : (
              <Users className="h-3.5 w-3.5 text-primary" />
            )}
          </div>
          <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground truncate flex-1">
            {server.name}
          </span>
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
          )}
        </button>

        {isExpanded && (
          <div className="mt-0.5 space-y-0.5 px-1">
            {server.channels.map(channel => {
              const lastMsg = getChannelLastMessage(channel.stream_channel_id);
              return (
                <ChannelListItem
                  key={channel.id}
                  channel={channel}
                  isActive={activeChannel?.id === channel.stream_channel_id}
                  isDisabled={!channel.stream_channel_id}
                  unreadCount={channel.stream_channel_id ? channelUnreadCounts[channel.stream_channel_id] || 0 : 0}
                  onClick={() => selectChannel(channel)}
                  serverImage={server.image}
                  serverName={server.name}
                  lastMessage={lastMsg.text}
                  lastMessageTime={lastMsg.time}
                />
              );
            })}
            {isMyServer && isCreator && (
              <button
                onClick={() => setShowCreateChannel(true)}
                className="w-full px-3 py-2.5 flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-colors border border-dashed border-border/50"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Channel</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  }, [expandedServers, toggleServer, activeChannel, channelUnreadCounts, selectChannel, isCreator, getChannelLastMessage]);

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
    // If user is authenticated, show loading state (chat is still connecting)
    if (user) {
      return (
        <div className={`flex items-center justify-center h-full bg-background ${className}`}>
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-muted-foreground">Connecting to chat...</p>
          </div>
        </div>
      );
    }
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

  const allServers = [...filteredOtherServers, ...(filteredMyServer ? [filteredMyServer] : [])];

  return (
    <div className={`stream-chat-wrapper h-full overflow-hidden ${className}`} ref={chatContainerRef}>
      <Chat client={chatClient} theme={streamTheme}>
        {/* Desktop Layout */}
        <div className="hidden md:flex h-full overflow-hidden">
          {/* Sidebar */}
          <div className="w-80 border-r border-border flex-shrink-0 bg-card/50 backdrop-blur-sm flex flex-col overflow-hidden">
            {/* Sidebar Header */}
            <div className="px-4 pt-4 pb-3 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground tracking-tight">Chats</h2>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-all"
                />
                {sidebarSearch && (
                  <button
                    onClick={() => setSidebarSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted"
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>

            {/* Channel List */}
            <div className="flex-1 overflow-y-auto min-h-0 px-2">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : (
                <div className="py-1 space-y-1">
                  {!creatorId && dmChannels.length > 0 && (
                    <div className="mb-2">
                      <button
                        onClick={() => setExpandedDMs(!expandedDMs)}
                        className="w-full px-2 py-1.5 flex items-center gap-2 text-left group"
                      >
                        {expandedDMs ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                          {isCreator ? 'Direct Messages' : 'Messages'}
                        </span>
                        {dmChannels.reduce((sum, dm) => sum + dm.unreadCount, 0) > 0 && (
                          <span className="min-w-[18px] h-[18px] px-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                            {dmChannels.reduce((sum, dm) => sum + dm.unreadCount, 0)}
                          </span>
                        )}
                      </button>
                      {expandedDMs && (
                        <div className="space-y-0.5">
                          {dmChannels
                            .filter(dm => !sidebarSearch || dm.otherUser.name.toLowerCase().includes(sidebarSearch.toLowerCase()))
                            .map(dm => (
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

                  {filteredOtherServers.length > 0 && (
                    <div className="mb-2">
                      <div className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                        {creatorId ? 'Community' : 'Channels'}
                      </div>
                      {filteredOtherServers
                        .filter(s => !sidebarSearch || s.name.toLowerCase().includes(sidebarSearch.toLowerCase()) || s.channels.some(c => c.name.toLowerCase().includes(sidebarSearch.toLowerCase())))
                        .map((server: Server) => renderServerDesktop(server, false))}
                    </div>
                  )}

                  {isCreator && filteredMyServer && (
                    <div className="mb-2">
                      <div className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                        My Server
                      </div>
                      {renderServerDesktop(filteredMyServer, true)}
                    </div>
                  )}

                  {filteredOtherServers.length === 0 && !filteredMyServer && dmChannels.length === 0 && (
                    <div className="px-4 py-12 text-center text-muted-foreground">
                      <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-medium">No conversations</p>
                      <p className="text-xs mt-1.5 opacity-60 leading-relaxed">
                        {creatorId ? 'This creator has no channels yet' : 'Support a creator to join their community'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex min-w-0 overflow-hidden bg-background">
            <div className={`flex-1 flex flex-col min-w-0 overflow-hidden ${showInfoPanel ? 'border-r border-border' : ''}`}>
              {activeChannel ? (
                <Channel 
                  channel={activeChannel} 
                  CustomMessageActionsList={CustomMessageActionsList}
                  QuotedMessage={CustomQuotedMessage}
                  MessageOptions={CustomMessageOptions}
                  MessageRepliesCountButton={NoOpMessageRepliesCountButton}
                  Message={CustomMessage}
                >
                  <Window>
                    <CustomChannelHeader onToggleInfo={() => setShowInfoPanel(!showInfoPanel)} showInfoPanel={showInfoPanel} />
                    <MessageList />
                    <MessageInput focus />
                  </Window>
                  <NoOpThread />
                </Channel>
              ) : channelError ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8">
                    <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="h-7 w-7 text-destructive" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1.5">Channel Access Error</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">{channelError}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="h-8 w-8 text-primary/30" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1">Select a conversation</h3>
                    <p className="text-sm text-muted-foreground">Pick a chat from the sidebar to get started</p>
                  </div>
                </div>
              )}
            </div>

            {/* Info Panel */}
            {showInfoPanel && activeChannel && (
              <ChannelInfoPanel channel={activeChannel} onClose={() => setShowInfoPanel(false)} />
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden h-full flex flex-col overflow-hidden">
          {mobileView === 'servers' && (
            <div className="h-full flex flex-col bg-background overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-base font-semibold text-foreground tracking-tight">Messages</h2>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 min-h-0">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                  </div>
                ) : (
                  <>
                    {filteredOtherServers.length > 0 && (
                      <div className="mb-4">
                        <div className="px-1 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {creatorId ? 'Community' : 'My Channels'}
                        </div>
                        {filteredOtherServers.map((server: Server) => renderServerMobile(server))}
                      </div>
                    )}

                    {isCreator && filteredMyServer && (
                      <div className="mb-4">
                        <div className="px-1 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          My Server
                        </div>
                        {renderServerMobile(filteredMyServer)}
                      </div>
                    )}

                    {!creatorId && dmChannels.length > 0 && (
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

                    {allServers.length === 0 && (!creatorId && dmChannels.length === 0) && (
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
              <Channel 
                channel={activeChannel} 
                CustomMessageActionsList={CustomMessageActionsList}
                QuotedMessage={CustomQuotedMessage}
                MessageOptions={CustomMessageOptions}
                MessageRepliesCountButton={NoOpMessageRepliesCountButton}
                Message={CustomMessage}
              >
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
                <NoOpThread />
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

      {/* Styles — use global app theme (--primary, --foreground, etc.) */}
      <style jsx global>{`
        .stream-chat-wrapper {
          --str-chat__primary-color: var(--primary);
          --str-chat__active-primary-color: var(--primary);
          --str-chat__border-radius-circle: 9999px;
          --str-chat__border-radius-sm: 14px;
          --str-chat__border-radius-md: 18px;
          --str-chat__border-radius-lg: 22px;
          --str-chat__font-family: var(--font-sans), system-ui, sans-serif;
        }

        .str-chat__channel-list {
          background: transparent !important;
        }

        /* Hide file upload button */
        .str-chat__file-input-container,
        .str-chat__attachment-selector {
          display: none !important;
        }

        .str-chat__channel-preview-messenger--active {
          background: color-mix(in srgb, var(--primary) 10%, transparent) !important;
          border-left: 3px solid var(--primary) !important;
        }

        .str-chat__channel-preview-messenger:hover {
          background: color-mix(in srgb, var(--primary) 5%, transparent) !important;
        }

        /* ── Message bubbles ── */

        /* My messages — primary color bubble with asymmetric rounding */
        .str-chat__message-simple--me .str-chat__message-bubble {
          background: var(--primary) !important;
          color: var(--primary-foreground) !important;
          border-radius: 20px 20px 4px 20px !important;
          box-shadow: 0 1px 2px rgba(0,0,0,0.06) !important;
        }

        /* Other messages — softer bubble with asymmetric rounding */
        .str-chat__message-simple:not(.str-chat__message-simple--me) .str-chat__message-bubble {
          border-radius: 20px 20px 20px 4px !important;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04) !important;
        }

        /* ── Larger avatars in message list (36px) ── */
        .str-chat__message .str-chat__avatar {
          width: 36px !important;
          height: 36px !important;
          min-width: 36px !important;
          flex-shrink: 0 !important;
        }
        .str-chat__message .str-chat__avatar-image {
          width: 36px !important;
          height: 36px !important;
        }

        /* ── Message hover — show subtle bg + timestamp on hover ── */
        .str-chat__li {
          transition: background-color 0.15s ease;
        }
        .str-chat__li:hover {
          background-color: color-mix(in srgb, var(--muted) 40%, transparent);
          border-radius: 8px;
        }

        /* ── Styled message input area ── */
        .str-chat__message-input {
          border-top: 1px solid var(--border) !important;
          padding: 12px 16px !important;
          background: var(--card) !important;
        }

        .str-chat__input-flat {
          border-radius: 24px !important;
          background: var(--muted) !important;
          padding: 4px 8px !important;
          border: 1px solid var(--border) !important;
          transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
        }
        .str-chat__input-flat:focus-within {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 15%, transparent) !important;
        }

        .str-chat__input-flat textarea {
          font-size: 14px !important;
          line-height: 1.5 !important;
        }

        /* Send button — circular, prominent */
        .str-chat__send-button {
          background: var(--primary) !important;
          border-radius: 50% !important;
          width: 38px !important;
          height: 38px !important;
          transition: all 0.15s ease !important;
          flex-shrink: 0 !important;
        }

        .str-chat__send-button:hover {
          background: color-mix(in srgb, var(--primary) 85%, black) !important;
          transform: scale(1.08);
        }

        .str-chat__send-button svg {
          width: 18px !important;
          height: 18px !important;
        }

        /* Attachment button styling */
        .str-chat__file-input-container .str-chat__file-input-container-button {
          color: var(--muted-foreground) !important;
        }
        .str-chat__file-input-container .str-chat__file-input-container-button:hover {
          color: var(--primary) !important;
        }

        .str-chat__channel-search-input {
          border-radius: 14px !important;
        }

        .str-chat__thread {
          border-left: 1px solid var(--border);
        }

        /* Message sender name */
        .str-chat__message-sender-name {
          font-weight: 600 !important;
          font-size: 12.5px !important;
          letter-spacing: -0.01em !important;
        }

        /* Message timestamp */
        .str-chat__message-data time {
          font-size: 10px !important;
          opacity: 0.5 !important;
        }
        .str-chat__li:hover .str-chat__message-data time {
          opacity: 0.8 !important;
        }

        /* ── Emoji reactions styling ── */
        .str-chat__reaction-list {
          padding: 2px 0 !important;
        }
        .str-chat__reaction-list .emoji-mart-emoji {
          cursor: pointer !important;
        }
        .str-chat__simple-reactions-list {
          border-radius: 12px !important;
          padding: 2px 4px !important;
          gap: 2px !important;
        }
        .str-chat__simple-reactions-list-item {
          font-size: 16px !important;
          padding: 2px 6px !important;
          border-radius: 10px !important;
          background: color-mix(in srgb, var(--muted) 80%, transparent) !important;
          border: 1px solid var(--border) !important;
          transition: transform 0.1s ease !important;
        }
        .str-chat__simple-reactions-list-item:hover {
          transform: scale(1.15) !important;
        }
        .str-chat__simple-reactions-list-item--selected {
          background: color-mix(in srgb, var(--primary) 15%, transparent) !important;
          border-color: var(--primary) !important;
        }

        /* ── Typing indicator ── */
        .str-chat__typing-indicator {
          padding: 4px 16px !important;
          font-size: 12px !important;
          color: var(--muted-foreground) !important;
        }
        .str-chat__typing-indicator__avatars .str-chat__avatar {
          width: 20px !important;
          height: 20px !important;
          min-width: 20px !important;
        }
        .str-chat__typing-indicator__dots {
          margin-left: 4px !important;
        }

        /* ── Emoji picker ── */
        .str-chat__emoji-picker-button {
          color: var(--muted-foreground) !important;
          transition: color 0.15s ease !important;
        }
        .str-chat__emoji-picker-button:hover {
          color: var(--primary) !important;
        }

        /* ── Light mode — align stream-chat with app theme ── */
        .stream-chat-wrapper .str-chat__theme-light {
          --str-chat__background-color: var(--background);
          --str-chat__secondary-background-color: var(--card);
          --str-chat__primary-surface-color: var(--muted);
          --str-chat__text-color: var(--foreground);
          --str-chat__secondary-text-color: var(--muted-foreground);
          --str-chat__border-color: var(--border);
        }

        .str-chat__main-panel,
        .str-chat__channel,
        .str-chat__container {
          background: var(--background) !important;
        }

        .str-chat__message-list {
          background: var(--background) !important;
          padding: 12px 16px !important;
        }

        .str-chat__message-simple:not(.str-chat__message-simple--me) .str-chat__message-bubble {
          background: var(--card) !important;
          color: var(--foreground) !important;
          border: 1px solid var(--border) !important;
        }

        .str-chat__avatar {
          cursor: pointer;
          transition: opacity 0.15s ease;
        }

        .str-chat__avatar:hover {
          opacity: 0.8;
        }

        /* Avatar sizing */
        .str-chat__avatar-image {
          border-radius: 50% !important;
        }

        /* ── Dark mode — align stream-chat with app theme ── */
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
          border-color: var(--border) !important;
        }

        .dark .str-chat__message-simple:not(.str-chat__message-simple--me) .str-chat__message-bubble {
          background: var(--muted) !important;
          color: var(--foreground) !important;
          border: none !important;
        }

        .dark .str-chat__thread {
          background: var(--card) !important;
          border-left-color: var(--border) !important;
        }

        .dark .str-chat__message-text p,
        .dark .str-chat__message-text {
          color: inherit !important;
        }

        /* ── System messages ── */
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

        /* Reaction emoji below the bubble; options and reply stay beside the bubble */
        .str-chat__message--other .str-chat__message-inner {
          grid-template-areas:
            'message-bubble options'
            'reactions reactions' !important;
        }
        .str-chat__message--me .str-chat__message-inner {
          grid-template-areas:
            'reminder reminder'
            'options message-bubble'
            'reactions reactions' !important;
        }

        /* Scroll-to-message highlight when clicking a quoted reply */
        .str-chat__message--highlighted {
          animation: reply-scroll-highlight 2s ease-out;
        }

        @keyframes reply-scroll-highlight {
          0% {
            background-color: color-mix(in srgb, var(--primary) 25%, transparent);
          }
          100% {
            background-color: transparent;
          }
        }

        /* ── Quoted message box ── */
        .custom-reply-box {
          transition: all 0.2s ease;
          border-radius: 0.5rem !important;
          padding: 8px 12px !important;
          margin-bottom: 8px !important;
          cursor: pointer;
          border: 1px solid transparent;
          border-left-width: 4px !important;
        }

        .custom-reply-box--other,
        .str-chat__message-simple:not(.str-chat__message-simple--me) .custom-reply-box {
          background: var(--muted) !important;
          border-color: var(--border) !important;
          border-left-color: var(--primary) !important;
        }

        .custom-reply-box--me,
        .str-chat__message-simple--me .custom-reply-box {
          background: color-mix(in srgb, var(--primary-foreground) 15%, transparent) !important;
          border-color: color-mix(in srgb, var(--primary-foreground) 30%, transparent) !important;
          border-left-color: var(--primary-foreground) !important;
        }

        .custom-reply-box:hover {
          opacity: 0.95;
          transform: translateY(-1px);
        }

        .custom-reply-box:active {
          transform: translateY(0);
        }

        .reply-box-sender-name {
          font-weight: 700;
          font-size: 0.875rem;
          margin-bottom: 4px;
        }

        .reply-box-message-text {
          font-size: 0.8rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
        }

        .custom-reply-box-other .reply-box-sender-name,
        .str-chat__message-simple:not(.str-chat__message-simple--me) .custom-reply-box .reply-box-sender-name {
          color: var(--primary) !important;
        }

        .custom-reply-box-other .reply-box-message-text,
        .str-chat__message-simple:not(.str-chat__message-simple--me) .custom-reply-box .reply-box-message-text {
          color: var(--foreground) !important;
          opacity: 0.75 !important;
        }

        .custom-reply-box--me .reply-box-sender-name,
        .str-chat__message-simple--me .custom-reply-box .reply-box-sender-name {
          color: var(--primary-foreground) !important;
        }

        .custom-reply-box--me .reply-box-message-text,
        .str-chat__message-simple--me .custom-reply-box .reply-box-message-text {
          color: var(--primary-foreground) !important;
          opacity: 0.9 !important;
        }

        .dark .custom-reply-box-other,
        .dark .str-chat__message-simple:not(.str-chat__message-simple--me) .custom-reply-box {
          background: color-mix(in srgb, var(--foreground) 12%, transparent) !important;
          border-color: var(--border) !important;
          border-left-color: var(--primary) !important;
        }

        .dark .custom-reply-box-other .reply-box-sender-name,
        .dark .str-chat__message-simple:not(.str-chat__message-simple--me) .custom-reply-box .reply-box-sender-name {
          color: var(--primary) !important;
        }

        .dark .custom-reply-box-other .reply-box-message-text,
        .dark .str-chat__message-simple:not(.str-chat__message-simple--me) .custom-reply-box .reply-box-message-text {
          color: var(--foreground) !important;
          opacity: 1 !important;
        }

        .dark .custom-reply-box--me .reply-box-sender-name,
        .dark .str-chat__message-simple--me .custom-reply-box .reply-box-sender-name {
          color: var(--primary-foreground) !important;
        }

        .dark .custom-reply-box--me .reply-box-message-text,
        .dark .str-chat__message-simple--me .custom-reply-box .reply-box-message-text {
          color: var(--primary-foreground) !important;
          opacity: 0.9 !important;
        }

        /* ── Message actions ── */
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

        /* ── Date separators ── */
        .str-chat__date-separator {
          padding: 8px 0 !important;
        }
        .str-chat__date-separator-date {
          font-size: 11px !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          color: var(--muted-foreground) !important;
          background: var(--background) !important;
          padding: 2px 12px !important;
          border-radius: 9999px !important;
        }
        .str-chat__date-separator-line {
          background: var(--border) !important;
        }

        /* ── Message options (action icons) - show on hover ── */
        .str-chat__message-options-wrapper {
          opacity: 0;
          transition: opacity 0.15s ease !important;
        }
        .str-chat__li:hover .str-chat__message-options-wrapper {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

export default StreamChatWrapper;
