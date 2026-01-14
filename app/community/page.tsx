'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarNav } from '@/components/sidebar-nav';
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
  Smile,
  Paperclip,
  MoreVertical,
  Settings as SettingsIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/dashboard/LoadingSpinner';

interface Channel {
  id: string;
  name: string;
  description?: string;
  category: 'welcome' | 'supporter' | 'custom';
  channel_type: 'text' | 'voice';
  creator_id: string;
}

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user?: {
    id: string;
    display_name: string;
    photo_url?: string;
  };
}

export default function CommunityPage() {
  const { user, isAuthenticated, loading: authLoading, isCreator } = useAuth();
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['welcome', 'supporter', 'custom']));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchChannels = useCallback(async () => {
    try {
      const response = await fetch('/api/community/channels');
      if (response.ok) {
        const data = await response.json();
        setChannels(data.channels || []);
        if (data.channels?.length > 0 && !selectedChannel) {
          setSelectedChannel(data.channels[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [selectedChannel]);

  const fetchMessages = useCallback(async (channelId: string) => {
    try {
      const response = await fetch(`/api/community/channels/${channelId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to fetch messages');
    }
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!selectedChannel || !newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch(`/api/community/channels/${selectedChannel}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (response.ok) {
        setNewMessage('');
        await fetchMessages(selectedChannel);
      }
    } finally {
      setSending(false);
    }
  }, [selectedChannel, newMessage, sending, fetchMessages]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchChannels();
    }
  }, [isAuthenticated, user, fetchChannels]);

  useEffect(() => {
    if (selectedChannel) {
      fetchMessages(selectedChannel);
      const interval = setInterval(() => fetchMessages(selectedChannel), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedChannel, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      newSet.has(category) ? newSet.delete(category) : newSet.add(category);
      return newSet;
    });
  }, []);

  const groupedChannels = useMemo(() => 
    channels.reduce((acc, channel) => {
      (acc[channel.category] ||= []).push(channel);
      return acc;
    }, {} as Record<string, Channel[]>)
  , [channels]);

  const categoryLabels = useMemo(() => ({
    welcome: 'GENERAL',
    supporter: 'MEMBERS',
    custom: 'CHANNELS',
  }), []);

  const currentChannel = useMemo(() => 
    channels.find(c => c.id === selectedChannel)
  , [channels, selectedChannel]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
        <SidebarNav />
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <SidebarNav />
      
      <main className="flex-1 flex overflow-hidden bg-white dark:bg-gray-900">
        {/* Channels Sidebar */}
        <div className="w-60 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
          {/* Server/Community Header */}
          <div className="h-14 border-b border-gray-200 dark:border-gray-800 px-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              {isCreator ? 'Your Community' : 'Communities'}
            </h2>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>

          {/* Search Channels */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search"
                className="pl-9 h-8 text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              />
            </div>
          </div>

          {/* Channel List */}
          <div className="flex-1 overflow-y-auto py-2">
            {Object.entries(groupedChannels).map(([category, categoryChannels]) => (
              <div key={category} className="mb-2">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <span>{categoryLabels[category] || category}</span>
                  {expandedCategories.has(category) ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </button>

                {expandedCategories.has(category) && (
                  <div className="mt-1 space-y-0.5 px-2">
                    {categoryChannels.map((channel) => (
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
                        <span className="flex-1 text-left truncate">{channel.name}</span>
                        <SettingsIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                  onClick={() => router.push('/community/create')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Channel
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-950">
          {selectedChannel ? (
            <>
              {/* Channel Header */}
              <div className="h-14 border-b border-gray-200 dark:border-gray-800 px-4 flex items-center justify-between bg-white dark:bg-gray-900">
                <div className="flex items-center gap-3">
                  {currentChannel?.channel_type === 'text' ? (
                    <Hash className="w-5 h-5 text-gray-500" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-gray-500" />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {currentChannel?.name}
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

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center max-w-md">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Welcome to #{currentChannel?.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        This is the start of your conversation. Say hello!
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const prevMessage = index > 0 ? messages[index - 1] : null;
                    const showAvatar = !prevMessage || prevMessage.user_id !== message.user_id;
                    const showTimestamp = !prevMessage || 
                      new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() > 300000;

                    return (
                      <div 
                        key={message.id} 
                        className={cn(
                          'flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 -mx-4 px-4 py-1 rounded transition-colors',
                          showAvatar && 'mt-4'
                        )}
                      >
                        <div className="flex-shrink-0">
                          {showAvatar ? (
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={message.user?.photo_url} alt={message.user?.display_name} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                {message.user?.display_name?.[0]?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="w-10 h-10 flex items-center justify-center">
                              <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100">
                                {new Date(message.created_at).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
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
                              {showTimestamp && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(message.created_at).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              )}
                            </div>
                          )}
                          <p className="text-sm text-gray-900 dark:text-gray-100 break-words">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="flex items-end gap-2">
                  <Button variant="ghost" size="icon" className="h-10 w-10 mb-0.5">
                    <Plus className="w-5 h-5" />
                  </Button>
                  <div className="flex-1 relative">
                    <Input
                      placeholder={`Message #${currentChannel?.name}`}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="pr-20 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Smile className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    size="icon"
                    className="h-10 w-10 bg-red-500 hover:bg-red-600"
                  >
                    <Send className="w-4 h-4" />
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

        {/* Members Sidebar (Optional) */}
        <div className="hidden xl:block w-60 bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 p-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Members — {messages.filter((m, i, arr) => arr.findIndex(msg => msg.user_id === m.user_id) === i).length}
          </h3>
          <div className="space-y-2">
            {messages
              .filter((m, i, arr) => arr.findIndex(msg => msg.user_id === m.user_id) === i)
              .slice(0, 10)
              .map((message) => (
                <div 
                  key={message.user_id} 
                  className="flex items-center gap-2 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={message.user?.photo_url} alt={message.user?.display_name} />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {message.user?.display_name?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-50 dark:border-gray-900" />
                  </div>
                  <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
                    {message.user?.display_name || 'Unknown'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </main>
    </div>
  );
}
