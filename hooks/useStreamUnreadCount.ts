'use client';

import { useState, useEffect } from 'react';
import { useStreamChat } from '@/contexts/stream-chat-context';

/**
 * Hook to get total unread message count from Stream Chat
 * Replaces the old Supabase-based useUnreadChatCount
 */
export function useStreamUnreadCount() {
  const { chatClient, isConnected } = useStreamChat();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatClient || !isConnected) {
      setLoading(false);
      return;
    }

    // Get initial unread count from user object
    const user = chatClient.user;
    if (user?.total_unread_count !== undefined) {
      setUnreadCount(user.total_unread_count);
    }
    setLoading(false);

    // Listen for unread count changes
    const handleNotification = (event: any) => {
      if (event.total_unread_count !== undefined) {
        setUnreadCount(event.total_unread_count);
      }
    };

    const handleMessageNew = (event: any) => {
      // Refresh unread count when new message arrives
      if (chatClient.user?.total_unread_count !== undefined) {
        setUnreadCount(chatClient.user.total_unread_count);
      }
    };

    const handleMarkRead = (event: any) => {
      // Update when messages are marked as read
      if (chatClient.user?.total_unread_count !== undefined) {
        setUnreadCount(chatClient.user.total_unread_count);
      }
    };

    // Subscribe to relevant events
    chatClient.on('notification.message_new', handleNotification);
    chatClient.on('notification.mark_read', handleNotification);
    chatClient.on('message.new', handleMessageNew);
    chatClient.on('message.read', handleMarkRead);

    return () => {
      chatClient.off('notification.message_new', handleNotification);
      chatClient.off('notification.mark_read', handleNotification);
      chatClient.off('message.new', handleMessageNew);
      chatClient.off('message.read', handleMarkRead);
    };
  }, [chatClient, isConnected]);

  const markAsRead = async () => {
    // With Stream, marking as read happens automatically when viewing a channel
    // This function is kept for API compatibility
    setUnreadCount(0);
  };

  return {
    unreadCount,
    loading,
    markAsRead,
  };
}

export default useStreamUnreadCount;
