'use client';

import { SidebarNav } from '@/components/sidebar-nav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  DollarSign,
  Star,
  Settings,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock notifications data
const notifications = [
  {
    id: '1',
    type: 'like',
    user: { name: 'Priya Sharma', avatar: '' },
    message: 'liked your post',
    time: '2 hours ago',
    read: false,
  },
  {
    id: '2',
    type: 'comment',
    user: { name: 'Raj Gurung', avatar: '' },
    message: 'commented on your post',
    time: '5 hours ago',
    read: false,
  },
  {
    id: '3',
    type: 'follow',
    user: { name: 'Maya Thapa', avatar: '' },
    message: 'started following you',
    time: '1 day ago',
    read: true,
  },
  {
    id: '4',
    type: 'payment',
    user: { name: 'Anil KC', avatar: '' },
    message: 'supported you with NPR 500',
    time: '2 days ago',
    read: true,
  },
];

const getIcon = (type: string) => {
  switch (type) {
    case 'like':
      return <Heart className="w-5 h-5 text-red-500" />;
    case 'comment':
      return <MessageCircle className="w-5 h-5 text-blue-500" />;
    case 'follow':
      return <UserPlus className="w-5 h-5 text-green-500" />;
    case 'payment':
      return <DollarSign className="w-5 h-5 text-yellow-500" />;
    default:
      return <Bell className="w-5 h-5 text-gray-500" />;
  }
};

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <SidebarNav />
      
      <main className="flex-1 overflow-y-auto">
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
                <Button variant="outline" size="sm">
                  <Check className="w-4 h-4 mr-2" />
                  Mark all read
                </Button>
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
            <Button variant="default" size="sm">All</Button>
            <Button variant="outline" size="sm">
              <Heart className="w-4 h-4 mr-2" />
              Likes
            </Button>
            <Button variant="outline" size="sm">
              <MessageCircle className="w-4 h-4 mr-2" />
              Comments
            </Button>
            <Button variant="outline" size="sm">
              <UserPlus className="w-4 h-4 mr-2" />
              Follows
            </Button>
            <Button variant="outline" size="sm">
              <DollarSign className="w-4 h-4 mr-2" />
              Payments
            </Button>
          </div>

          {/* Notifications */}
          <Card className="divide-y divide-gray-200 dark:divide-gray-800">
            {notifications.map((notification, index) => (
              <div
                key={notification.id}
                className={cn(
                  'p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer',
                  !notification.read && 'bg-blue-50 dark:bg-blue-900/10'
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    {getIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={notification.user.avatar} alt={notification.user.name} />
                          <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                            {notification.user.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            <span className="font-semibold">{notification.user.name}</span>{' '}
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {notification.time}
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

          {/* Empty State (if no notifications) */}
          {notifications.length === 0 && (
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
          )}
        </div>
      </main>
    </div>
  );
}
