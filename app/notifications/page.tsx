'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarNav } from '@/components/sidebar-nav';
import { PageLayout } from '@/components/common/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  DollarSign,
  Settings,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { LoadingSpinner } from '@/components/dashboard/LoadingSpinner';

const getIcon = (type: string) => {
  switch (type) {
    case 'like':
      return <Heart className="w-5 h-5 text-red-500" />;
    case 'comment':
      return <MessageCircle className="w-5 h-5 text-blue-500" />;
    case 'payment':
    case 'support':
      return <DollarSign className="w-5 h-5 text-yellow-500" />;
    default:
      return <Bell className="w-5 h-5 text-gray-500" />;
  }
};

const formatTime = (dateString: string) => {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return 'Recently';
  }
};

export default function NotificationsPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications(selectedType);

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    // Mark as read if unread
    if (!notification.read) {
      await markAsRead([notification.id]);
    }

    // Navigate to post if available
    if (notification.post?.id) {
      router.push(`/creator/${notification.user.id}?post=${notification.post.id}`);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  if (loading) {
    return (
      <PageLayout loading>
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Notifications
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Stay updated with your latest activities
                </p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                    <Check className="w-4 h-4 mr-2" />
                    Mark all read
                  </Button>
                )}
                <Button variant="ghost" size="icon">
                  <Settings className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            <Button 
              variant={!selectedType ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSelectedType(undefined)}
            >
              All
            </Button>
            <Button 
              variant={selectedType === 'like' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSelectedType('like')}
            >
              <Heart className="w-4 h-4 mr-2" />
              Likes
            </Button>
            <Button 
              variant={selectedType === 'comment' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSelectedType('comment')}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Comments
            </Button>
            <Button 
              variant={selectedType === 'payment' || selectedType === 'support' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSelectedType('payment')}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Payments
            </Button>
          </div>

          {error ? (
            <Card className="p-8 text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </Card>
          ) : notifications.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No notifications yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                When you get notifications, they&apos;ll show up here
              </p>
            </Card>
          ) : (
            <Card className="divide-y divide-gray-200 dark:divide-gray-800">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer',
                    !notification.read && 'bg-blue-50 dark:bg-blue-900/10'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      {getIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={notification.user.avatar || undefined} alt={notification.user.name} />
                            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                              {notification.user.name[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm text-gray-900 dark:text-gray-100">
                              <span className="font-semibold">{notification.user.name}</span>{' '}
                              {notification.message}
                            </p>
                            {notification.post && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-md">
                                {notification.post.title}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {formatTime(notification.created_at)}
                            </p>
                          </div>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          )}

        </div>
    </PageLayout>
  );
}
