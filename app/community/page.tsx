'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { useAuth } from '@/contexts/supabase-auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  Hash, 
  Volume2, 
  Plus, 
  Send, 
  Crown,
  ChevronDown,
  ChevronRight
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
    if (!authLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [authLoading, isAuthenticated, router]);

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
    welcome: 'WELCOME',
    supporter: 'SUPPORTER',
    custom: 'CUSTOM CHANNELS',
  }), []);

  const currentChannel = useMemo(() => 
    channels.find(c => c.id === selectedChannel)
  , [channels, selectedChannel]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Channels */}
        <div className="w-64 bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {isCreator ? 'Your Community' : 'Communities'}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {Object.entries(groupedChannels).map(([category, categoryChannels]) => (
              <div key={category} className="mb-4">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <span>{categoryLabels[category] || category}</span>
                  {expandedCategories.has(category) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                {expandedCategories.has(category) && (
                  <div className="mt-1 space-y-1">
                    {categoryChannels.map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => setSelectedChannel(channel.id)}
                        className={cn(
                          'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors',
                          selectedChannel === channel.id
                            ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                        )}
                      >
                        {channel.channel_type === 'text' ? (
                          <Hash className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                        <span className="flex-1 text-left truncate">{channel.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isCreator && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={() => router.push('/community/create')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Channel
              </Button>
            )}
          </div>
        </div>

        {/* Main Content - Messages */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-950">
          {selectedChannel ? (
            <>
              {/* Channel Header */}
              <div className="h-14 border-b border-gray-200 dark:border-gray-800 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {currentChannel?.channel_type === 'text' ? (
                    <Hash className="w-5 h-5 text-gray-500" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-gray-500" />
                  )}
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {currentChannel?.name}
                  </h3>
                  {currentChannel?.description && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {currentChannel.description}
                    </span>
                  )}
                </div>
                {isCreator && currentChannel?.creator_id === user?.id && (
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        No messages yet. Start the conversation!
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
                      <div key={message.id} className={cn('flex gap-3', showAvatar && 'mt-4')}>
                        {showAvatar ? (
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={message.user?.photo_url} alt={message.user?.display_name} />
                            <AvatarFallback>
                              {message.user?.display_name?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-10" />
                        )}
                        <div className="flex-1">
                          {showAvatar && (
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900 dark:text-gray-100">
                                {message.user?.display_name || 'Unknown'}
                              </span>
                              {message.user_id === currentChannel?.creator_id && (
                                <Crown className="w-4 h-4 text-yellow-500" />
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
                          <p className="text-gray-900 dark:text-gray-100">
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
              <div className="border-t border-gray-200 dark:border-gray-800 p-4">
                <div className="flex gap-2">
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
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Select a channel to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
