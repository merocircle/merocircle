'use client';

import { useState, useMemo, memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useNotificationsData, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useQueries';
import { useAuth } from '@/contexts/supabase-auth-context';
import { fadeInUp } from '@/components/animations/variants';

// New organism components
import { NotificationList } from '@/components/organisms/notifications/NotificationList';

type NotificationType = 'like' | 'comment' | 'payment' | 'follow' | 'mention' | 'announcement';

const mapNotificationType = (type: string): NotificationType => {
  switch (type) {
    case 'like':
      return 'like';
    case 'comment':
      return 'comment';
    case 'payment':
    case 'support':
      return 'payment';
    case 'follow':
      return 'follow';
    default:
      return 'announcement';
  }
};

const NotificationsSection = memo(function NotificationsSection() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>('all');
  const { data, isLoading } = useNotificationsData(selectedType === 'all' ? undefined : selectedType);
  const { mutate: markAsRead } = useMarkNotificationRead();
  const { mutate: markAllAsRead } = useMarkAllNotificationsRead();

  // Transform notifications for the new component
  const notifications = useMemo(() => {
    const rawNotifications = data?.notifications || [];
    return rawNotifications.map((notification: any) => {
      // For like and comment notifications, create clickable links
      const notificationType = notification.type;
      const isClickable = (notificationType === 'like' || notificationType === 'comment') && notification.post?.id;

      let link: string | undefined;
      if (isClickable && notification.post?.creator_id) {
        // Check if the current user is the post creator
        const isOwnPost = user?.id === notification.post.creator_id;

        if (isOwnPost) {
          // Creator viewing notification about their own post → go to Creator Studio
          link = `/creator-studio?post=${notification.post.id}`;
        } else {
          // Supporter viewing notification (e.g., reply to their comment) → go to creator's profile
          link = `/creator/${notification.post.creator_id}?post=${notification.post.id}`;
        }
      }

      return {
        id: notification.id,
        type: mapNotificationType(notification.type),
        title: notification.user?.name || 'Someone',
        message: notification.message,
        created_at: notification.created_at,
        is_read: notification.read,
        user: notification.user ? {
          id: notification.user.id,
          name: notification.user.name,
          avatar: notification.user.avatar,
        } : undefined,
        link,
      };
    });
  }, [data?.notifications, user?.id]);

  const handleFilterChange = useCallback((filter: NotificationType | 'all') => {
    setSelectedType(filter);
  }, []);

  const handleMarkAsRead = useCallback((id: string) => {
    markAsRead([id]);
  }, [markAsRead]);

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const handleNotificationClick = useCallback((notification: any) => {
    if (notification.link) {
      router.push(notification.link);
    }
  }, [router]);

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="h-full bg-background"
    >
      <NotificationList
        notifications={notifications}
        isLoading={isLoading && !data}
        filter={selectedType}
        onFilterChange={handleFilterChange}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onNotificationClick={handleNotificationClick}
        className="h-full"
      />
    </motion.div>
  );
});

export default NotificationsSection;
