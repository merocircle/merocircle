'use client';

import { useState, useMemo, useCallback, memo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useCommunityChannels, useSendMessage } from '@/hooks/useQueries';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { useUnreadChatCount } from '@/hooks/useUnreadChatCount';
import { useChannelUnreadCounts } from '@/hooks/useChannelUnreadCounts';
import { useAuth } from '@/contexts/supabase-auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Plus, ChevronLeft, Hash, Send, Smile, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const CommunitySection = memo(function CommunitySection() {
  const { user, isCreator } = useAuth();
  const router = useRouter();
  const { data: channelsData, isLoading: channelsLoading } = useCommunityChannels();
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages } = useRealtimeChat({
    channelId: selectedChannel,
    enabled: !!selectedChannel && !!user
  });

  const { mutate: sendMessage, isPending } = useSendMessage(selectedChannel);
  const { markAsRead } = useUnreadChatCount();
  const { channelUnreadCounts, markChannelAsRead } = useChannelUnreadCounts();

  // Mark messages as read when component mounts
  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  // Mark selected channel as read when it changes
  useEffect(() => {
    if (selectedChannel && messages.length > 0) {
      const timer = setTimeout(() => {
        markChannelAsRead(selectedChannel);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedChannel, messages.length, markChannelAsRead]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = useCallback(() => {
    if (!messageText.trim() || isPending) return;
    sendMessage(messageText, {
      onSuccess: () => setMessageText(''),
      onError: () => console.error('Failed to send message')
    });
  }, [messageText, isPending, sendMessage]);

  const handleChannelSelect = useCallback((channelId: string) => {
    setSelectedChannel(channelId);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedChannel(null);
  }, []);

  const handleCreateChannel = useCallback(() => {
    router.push('/community/create');
  }, [router]);

  // Transform channels data
  const channels = useMemo(() => {
    const rawChannels = channelsData?.channels || [];
    return rawChannels
      .filter((c: any) => c.category !== 'welcome')
      .map((channel: any) => ({
        id: channel.id,
        name: channel.display_name || channel.name,
        type: channel.channel_type === 'voice' ? 'voice' as const : 'text' as const,
        category: channel.category === 'supporter' ? 'Supporters' : 'General',
        unread_count: channelUnreadCounts[channel.id] || 0,
      }));
  }, [channelsData?.channels, channelUnreadCounts]);

  // Get current channel details
  const currentChannel = useMemo(() =>
    channelsData?.channels?.find((c: any) => c.id === selectedChannel),
    [channelsData?.channels, selectedChannel]
  );

  // Loading state
  if (channelsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Mobile: Show either channel list OR chat (not both)
  // Desktop: Show both side by side
  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Channel List - Hidden on mobile when chat is open */}
      <div className={cn(
        'w-full md:w-72 lg:w-80 border-r bg-card/30 flex flex-col',
        selectedChannel && 'hidden md:flex'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg">Communities</h2>
          </div>
          {isCreator && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCreateChannel}
              className="h-8 w-8"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Channel List */}
        <div className="flex-1 overflow-y-auto p-2">
          {channels.length > 0 ? (
            <div className="space-y-1">
              {channels.map((channel: { id: string; name: string; type: 'text' | 'voice'; category: string; unread_count: number }) => (
                <motion.button
                  key={channel.id}
                  onClick={() => handleChannelSelect(channel.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all',
                    'hover:bg-muted/50',
                    selectedChannel === channel.id && 'bg-primary/10 text-primary'
                  )}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    selectedChannel === channel.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}>
                    <Hash className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium truncate">{channel.name}</p>
                    <p className="text-xs text-muted-foreground">{channel.category}</p>
                  </div>
                  {channel.unread_count > 0 && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                      {channel.unread_count}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">No channels yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {isCreator ? 'Create your first channel to start chatting' : 'No communities to join yet'}
              </p>
              {isCreator && (
                <Button onClick={handleCreateChannel} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Channel
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area - Full width on mobile when channel is selected */}
      <div className={cn(
        'flex-1 flex flex-col overflow-hidden',
        !selectedChannel && 'hidden md:flex'
      )}>
        {selectedChannel && currentChannel ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 p-4 border-b bg-card/30">
              {/* Back button - Mobile only */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="md:hidden h-8 w-8"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Hash className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold truncate">
                  {currentChannel.display_name || currentChannel.name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {currentChannel.category === 'supporter' ? 'Supporters only' : 'General'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
              {messages.length > 0 ? (
                <>
                  {messages.map((msg: any) => {
                    const isOwn = msg.user_id === user?.id;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn('flex gap-3', isOwn && 'flex-row-reverse')}
                      >
                        {!isOwn && (
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={msg.user?.photo_url} />
                            <AvatarFallback className="text-xs">
                              {(msg.user?.display_name || 'U').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className={cn('max-w-[75%]', isOwn && 'items-end')}>
                          {!isOwn && (
                            <p className="text-xs text-muted-foreground mb-1 px-1">
                              {msg.user?.display_name || 'Unknown'}
                            </p>
                          )}
                          <div className={cn(
                            'px-4 py-2 rounded-2xl',
                            isOwn
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-muted rounded-bl-md'
                          )}>
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>
                          <p className={cn(
                            'text-[10px] text-muted-foreground mt-1 px-1',
                            isOwn && 'text-right'
                          )}>
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <MessageCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">No messages yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Be the first to send a message!
                  </p>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-card/30">
              <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <Smile className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          // Desktop: Show empty state when no channel selected
          <div className="hidden md:flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <MessageCircle className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Select a channel</h3>
            <p className="text-muted-foreground max-w-sm">
              Choose a channel from the list to start chatting with community members
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

export default CommunitySection;
