'use client';

import { useState, useRef, useMemo, useCallback, memo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCommunityChannels, useSendMessage } from '@/hooks/useQueries';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { useUnreadChatCount } from '@/hooks/useUnreadChatCount';
import { useChannelUnreadCounts } from '@/hooks/useChannelUnreadCounts';
import { useAuth } from '@/contexts/supabase-auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Hash, 
  Volume2, 
  Plus, 
  Send, 
  Crown,
  ChevronDown,
  ChevronRight,
  Search,
  MoreVertical,
  Settings as SettingsIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CommunitySection = memo(function CommunitySection() {
  const { user, isCreator } = useAuth();
  const router = useRouter();
  const { data: channelsData } = useCommunityChannels();
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['supporter']));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages } = useRealtimeChat({
    channelId: selectedChannel,
    enabled: !!selectedChannel
  });

  const { mutate: sendMessage, isPending } = useSendMessage(selectedChannel);
  const { markAsRead } = useUnreadChatCount();
  const { channelUnreadCounts, markChannelAsRead } = useChannelUnreadCounts();

  // Mark messages as read when component mounts (user opens chat view)
  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  // Mark selected channel as read when it changes or when messages are loaded
  useEffect(() => {
    if (selectedChannel && messages.length > 0) {
      // Small delay to ensure user has seen the messages
      const timer = setTimeout(() => {
        markChannelAsRead(selectedChannel);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedChannel, messages.length, markChannelAsRead]);

  useEffect(() => {
    if (channelsData?.channels?.length > 0 && !selectedChannel) {
      setSelectedChannel(channelsData.channels[0].id);
    }
  }, [channelsData?.channels, selectedChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || isPending) return;
    
    const messageText = newMessage.trim();
    setNewMessage('');
    
    sendMessage(messageText, {
      onError: () => {
        setNewMessage(messageText);
      }
    });
  }, [newMessage, isPending, sendMessage]);

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      newSet.has(category) ? newSet.delete(category) : newSet.add(category);
      return newSet;
    });
  }, []);

  const channels = channelsData?.channels || [];
  const filteredChannels = useMemo(() => 
    channels.filter((c: any) => c.category !== 'welcome')
  , [channels]);

  const groupedChannels = useMemo(() => 
    filteredChannels.reduce((acc: any, channel: any) => {
      if (channel.category === 'supporter') {
        (acc['supporter'] ||= []).push(channel);
      }
      return acc;
    }, {})
  , [filteredChannels]);

  const currentChannel = useMemo(() => 
    channels.find((c: any) => c.id === selectedChannel)
  , [channels, selectedChannel]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-white dark:bg-gray-900">
      <div className="w-60 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="h-14 border-b border-gray-200 dark:border-gray-800 px-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            {isCreator ? 'Your Community' : 'Communities'}
          </h2>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-3 border-b border-gray-200 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search"
              className="pl-9 h-8 text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {Object.entries(groupedChannels).map(([category, categoryChannels]: [string, any]) => (
            <div key={category} className="mb-2">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <span>MEMBERS</span>
                {expandedCategories.has(category) ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>

              {expandedCategories.has(category) && (
                <div className="mt-1 space-y-0.5 px-2">
                  {categoryChannels.map((channel: any) => (
                    <button
                      key={channel.id}
                      onClick={() => setSelectedChannel(channel.id)}
                      className={cn(
                        'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors group',
                        selectedChannel === channel.id
                          ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                      )}
                    >
                      {channel.channel_type === 'text' ? (
                        <Hash className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <Volume2 className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span className="flex-1 text-left truncate">
                        {channel.display_name || channel.name}
                      </span>
                      <div className="flex items-center gap-1">
                        {channelUnreadCounts[channel.id] > 0 && (
                          <span className="px-1.5 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full min-w-[1.25rem] text-center">
                            {channelUnreadCounts[channel.id] > 99 ? '99+' : channelUnreadCounts[channel.id]}
                          </span>
                        )}
                        <SettingsIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isCreator && (
            <div className="px-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start h-8 text-sm"
                onClick={() => {
                  if (router) router.push('/community/create');
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Channel
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white dark:bg-gray-950">
        {selectedChannel ? (
          <>
            <div className="h-14 border-b border-gray-200 dark:border-gray-800 px-4 flex items-center justify-between bg-white dark:bg-gray-900">
              <div className="flex items-center gap-3">
                {currentChannel?.channel_type === 'text' ? (
                  <Hash className="w-5 h-5 text-gray-500" />
                ) : (
                  <Volume2 className="w-5 h-5 text-gray-500" />
                )}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {currentChannel?.display_name || currentChannel?.name}
                  </h3>
                  {currentChannel?.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {currentChannel.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Search className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Welcome to {currentChannel?.display_name || `#${currentChannel?.name}`}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      This is the start of your conversation. Say hello!
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => {
                  const prevMessage = index > 0 ? messages[index - 1] : null;
                  const isSameUser = prevMessage && prevMessage.user_id === message.user_id;
                  const timeDiff = prevMessage 
                    ? new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime()
                    : Infinity;
                  const showAvatar = !prevMessage || !isSameUser || timeDiff > 300000;
                  // Always show timestamp for every message
                  const showTimestamp = true;
                  const isNewGroup = showAvatar;
                  const isDifferentSender = !isSameUser && prevMessage;

                  return (
                    <div 
                      key={message.id} 
                      className={cn(
                        'flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 -mx-4 px-4 py-0.5 rounded transition-colors',
                        isDifferentSender && 'mt-3',
                        isNewGroup && index > 0 && !isDifferentSender && 'mt-3',
                        !isNewGroup && 'mt-0'
                      )}
                    >
                      <div className="flex-shrink-0">
                        {showAvatar ? (
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={message.user?.photo_url || undefined} alt={message.user?.display_name} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                              {message.user?.display_name?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-10" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {showAvatar && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                              {message.user?.display_name || 'Unknown'}
                            </span>
                            {message.user_id === currentChannel?.creator_id && (
                              <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                                <Crown className="w-3 h-3 text-yellow-500" />
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(message.created_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        )}
                        <div className="flex items-start gap-2">
                          <p className={cn(
                            'text-sm text-gray-900 dark:text-gray-100 break-words flex-1',
                            !showAvatar && 'ml-0'
                          )}>
                            {message.content}
                          </p>
                          {!showAvatar && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5">
                              {new Date(message.created_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder={`Message ${currentChannel?.display_name || `#${currentChannel?.name}`}`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  size="icon"
                  className="h-10 w-10 bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-opacity"
                >
                  {isPending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Welcome to Community
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Select a channel from the sidebar to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default CommunitySection;
