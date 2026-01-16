import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/supabase-auth-context';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'payment' | 'support';
  read: boolean;
  created_at: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
  post: {
    id: string;
    title: string;
    image_url: string | null;
  } | null;
  comment: {
    id: string;
    content: string;
  } | null;
  message: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

// Global channel management to prevent multiple subscriptions
let globalChannel: RealtimeChannel | null = null;
let globalUserId: string | null = null;
const subscribers = new Set<() => void>();

function setupGlobalChannel(userId: string) {
  // If channel exists for same user, reuse it
  if (globalChannel && globalUserId === userId) {
    return globalChannel;
  }

  // Clean up old channel if user changed
  if (globalChannel) {
    supabase.removeChannel(globalChannel);
    globalChannel = null;
    subscribers.clear();
  }

  // Create new channel
  globalUserId = userId;
  globalChannel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      () => {
        // Notify all subscribers
        subscribers.forEach(callback => callback());
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      () => {
        // Notify all subscribers
        subscribers.forEach(callback => callback());
      }
    )
    .subscribe();

  return globalChannel;
}

function cleanupGlobalChannel() {
  if (globalChannel && subscribers.size === 0) {
    supabase.removeChannel(globalChannel);
    globalChannel = null;
    globalUserId = null;
  }
}

export function useNotifications(type?: string): UseNotificationsReturn {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (type) {
        params.append('type', type);
      }
      params.append('limit', '50');

      const response = await fetch(`/api/notifications?${params.toString()}`);

      if (!response.ok) {
        if (response.status === 401) {
          setError('Please log in to view notifications');
        } else {
          setError('Failed to fetch notifications');
        }
        return;
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Error loading notifications');
    } finally {
      setLoading(false);
    }
  }, [user, type]);

  const markAsRead = useCallback(async (notificationIds: string[]) => {
    if (!user || notificationIds.length === 0) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notifications as read');
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notificationIds.includes(notif.id) ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - notificationIds.length));
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      // Update local state
      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, [user]);

  // Subscribe to real-time notification updates using global channel
  useEffect(() => {
    if (!user) {
      return;
    }

    // Setup global channel (will reuse if already exists)
    setupGlobalChannel(user.id);

    // Register this component's fetch callback
    const callback = () => {
      fetchNotifications();
    };
    subscribers.add(callback);

    return () => {
      // Unregister callback when component unmounts
      subscribers.delete(callback);
      // Cleanup channel if no more subscribers
      cleanupGlobalChannel();
    };
  }, [user, fetchNotifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
