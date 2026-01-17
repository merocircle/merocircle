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
  const onMessageRef = useRef(onMessage);
  const isSubscribedRef = useRef(false);
  
  // Keep onMessage ref updated
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

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
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    // Clean up previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Create realtime subscription
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
          console.log('[REALTIME] Received message:', payload.new.id);
          const payloadData = payload.new;
          
          // Fetch user data
          let userData = null;
          if (payloadData.user_id) {
            const { data: user } = await supabase
              .from('users')
              .select('id, display_name, photo_url')
              .eq('id', payloadData.user_id)
              .single();
            userData = user;
          }

          const newMessage: ChatMessage = {
            id: payloadData.id,
            content: payloadData.content,
            user_id: payloadData.user_id,
            created_at: payloadData.created_at || new Date().toISOString(),
            user: userData ? {
              id: userData.id,
              display_name: userData.display_name,
              photo_url: userData.photo_url
            } : undefined
          };

          setMessages((prev) => {
            if (prev.some((msg) => msg.id === newMessage.id)) {
              console.log('[REALTIME] Duplicate message ignored:', newMessage.id);
              return prev;
            }
            console.log('[REALTIME] Adding message to state:', newMessage.id);
            return [...prev, newMessage];
          });

          if (onMessageRef.current) {
            onMessageRef.current(newMessage);
          }
        }
      )
      .subscribe((status, err) => {
        console.log('[REALTIME] Subscription status:', status, 'for channel:', channelId);
        if (err) {
          console.error('[REALTIME] Subscription error:', err);
          setError(`Realtime error: ${err.message}`);
          isSubscribedRef.current = false;
        }
        if (status === 'SUBSCRIBED') {
          console.log('[REALTIME] Successfully subscribed to channel:', channelId);
          isSubscribedRef.current = true;
          setError(null);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[REALTIME] Channel error for:', channelId);
          setError('Failed to subscribe to realtime updates');
          isSubscribedRef.current = false;
        } else if (status === 'TIMED_OUT') {
          console.error('[REALTIME] Subscription timed out for:', channelId);
          setError('Realtime subscription timed out');
          isSubscribedRef.current = false;
        } else if (status === 'CLOSED') {
          console.log('[REALTIME] Channel closed for:', channelId);
          isSubscribedRef.current = false;
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        console.log('[REALTIME] Cleaning up subscription for channel:', channelId);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [channelId, enabled]);

  // Initial fetch
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Fallback polling: Refresh messages periodically to catch any missed realtime events
  useEffect(() => {
    if (!channelId || !enabled) return;

    // Poll every 3 seconds if subscription isn't active, every 5 seconds as backup
    const pollTimer = setInterval(() => {
      if (!isSubscribedRef.current) {
        console.log('[REALTIME] Using polling fallback (subscription not active)');
        fetchMessages();
      }
    }, 3000);

    return () => clearInterval(pollTimer);
  }, [channelId, enabled, fetchMessages]);

  // Send message
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

      // Optimistically add message for sender
      const { message: newMessage } = await response.json();
      
      if (newMessage) {
        const formattedMessage: ChatMessage = {
          id: newMessage.id,
          content: newMessage.content,
          user_id: newMessage.user_id,
          created_at: newMessage.created_at,
          user: newMessage.users ? {
            id: newMessage.users.id,
            display_name: newMessage.users.display_name,
            photo_url: newMessage.users.photo_url
          } : undefined
        };

        setMessages((prev) => {
          if (prev.some((msg) => msg.id === formattedMessage.id)) {
            return prev;
          }
          return [...prev, formattedMessage];
        });

        if (onMessageRef.current) {
          onMessageRef.current(formattedMessage);
        }
      }
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
