'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatMessage {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user?: {
    id: string;
    display_name: string;
    photo_url?: string | null;
  };
}

interface UseRealtimeChatOptions {
  channelId: string | null;
  onMessage?: (message: ChatMessage) => void;
  enabled?: boolean;
}

interface UseRealtimeChatReturn {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  refreshMessages: () => Promise<void>;
}

export function useRealtimeChat({
  channelId,
  onMessage,
  enabled = true
}: UseRealtimeChatOptions): UseRealtimeChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    if (!channelId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('channel_messages')
        .select(`
          id,
          content,
          user_id,
          created_at,
          users!channel_messages_user_id_fkey(
            id,
            display_name,
            photo_url
          )
        `)
        .eq('channel_id', channelId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .limit(100);

      if (fetchError) {
        throw fetchError;
      }

      const formattedMessages: ChatMessage[] = (data || []).map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        user_id: msg.user_id,
        created_at: msg.created_at,
        user: msg.users ? {
          id: msg.users.id,
          display_name: msg.users.display_name,
          photo_url: msg.users.photo_url
        } : undefined
      }));

      setMessages(formattedMessages);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!channelId || !enabled) {
      // Clean up subscription if channel changes
      if (channelRef.current && isSubscribedRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
      return;
    }

    // Clean up previous subscription
    if (channelRef.current && isSubscribedRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
    }

    // Create new channel subscription
    const channel = supabase
      .channel(`channel_messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'channel_messages',
          filter: `channel_id=eq.${channelId}`
        },
        async (payload) => {
          // Fetch the full message with user data
          const { data: messageData, error: msgError } = await supabase
            .from('channel_messages')
            .select(`
              id,
              content,
              user_id,
              created_at,
              users!channel_messages_user_id_fkey(
                id,
                display_name,
                photo_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (!msgError && messageData) {
            const newMessage: ChatMessage = {
              id: messageData.id,
              content: messageData.content,
              user_id: messageData.user_id,
              created_at: messageData.created_at,
              user: messageData.users ? {
                id: messageData.users.id,
                display_name: messageData.users.display_name,
                photo_url: messageData.users.photo_url
              } : undefined
            };

            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((msg) => msg.id === newMessage.id)) {
                return prev;
              }
              return [...prev, newMessage];
            });

            // Call optional callback
            if (onMessage) {
              onMessage(newMessage);
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
        }
      });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [channelId, enabled, onMessage]);

  // Initial fetch
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Send message via API route (for authentication and RLS)
  const sendMessage = useCallback(async (content: string) => {
    if (!channelId || !content.trim()) {
      return;
    }

    try {
      const response = await fetch(`/api/community/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      // Message will be received via realtime subscription
      // No need to manually refresh
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  }, [channelId]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    refreshMessages: fetchMessages,
  };
}
