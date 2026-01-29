/**
 * Utility functions for notification processing
 */

type NotificationType = 'like' | 'comment' | 'payment' | 'follow' | 'mention' | 'announcement';

export const mapNotificationType = (type: string): NotificationType => {
  const typeMap: Record<string, NotificationType> = {
    like: 'like',
    comment: 'comment',
    payment: 'payment',
    support: 'payment',
    follow: 'follow',
  };
  
  return typeMap[type] || 'announcement';
};

export interface NotificationLinkParams {
  notificationType: string;
  postId?: string;
  creatorId?: string;
  currentUserId?: string;
}

/**
 * Generates a navigation link for a notification based on its type and context
 */
export const generateNotificationLink = ({
  notificationType,
  postId,
  creatorId,
  currentUserId,
}: NotificationLinkParams): string | undefined => {
  // Only like and comment notifications are clickable
  const isClickable = (notificationType === 'like' || notificationType === 'comment') && postId;
  
  if (!isClickable || !creatorId) {
    return undefined;
  }

  const isOwnPost = currentUserId === creatorId;

  if (isOwnPost) {
    // Creator viewing notification about their own post → go to Creator Studio
    return `/creator-studio?post=${postId}`;
  } else {
    // Supporter viewing notification → go to creator's profile
    return `/creator/${creatorId}?post=${postId}`;
  }
};
