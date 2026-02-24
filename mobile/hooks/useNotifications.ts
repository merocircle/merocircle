import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/auth-context';
import { apiFetch } from '../lib/api';

export type NotificationType = 'like' | 'comment' | 'payment' | 'follow' | 'mention' | 'announcement';

export interface ApiNotification {
  id: string;
  type: string;
  read: boolean;
  created_at: string;
  user: { id: string; name: string; avatar: string | null };
  post?: { id: string; title: string; image_url: string | null; creator_id: string } | null;
  comment?: { id: string; content: string } | null;
  message: string;
}

export interface NotificationsResponse {
  notifications: ApiNotification[];
  unreadCount: number;
  total: number;
}

const mapType = (type: string): NotificationType => {
  const m: Record<string, NotificationType> = {
    like: 'like', comment: 'comment', payment: 'payment', support: 'payment', follow: 'follow',
  };
  return m[type] ?? 'announcement';
};

export function useNotificationsData(type?: NotificationType) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['notifications', session?.user?.id ?? '', type],
    queryFn: async () => {
      const url = type ? `/api/notifications?type=${type}` : '/api/notifications';
      const data = await apiFetch<NotificationsResponse>(url, { accessToken: session?.access_token ?? undefined });
      return {
        ...data,
        notifications: (data.notifications || []).map((n) => ({
          ...n,
          type: mapType(n.type),
        })),
      };
    },
    enabled: !!session?.user?.id,
    staleTime: 30 * 1000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (notificationIds: string[]) => {
      return apiFetch<{ success: boolean }>('/api/notifications', {
        method: 'PATCH',
        accessToken: session?.access_token ?? undefined,
        body: { notificationIds },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async () => {
      return apiFetch<{ success: boolean }>('/api/notifications', {
        method: 'PATCH',
        accessToken: session?.access_token ?? undefined,
        body: { markAllRead: true },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/** Generate in-app link for notification (creator studio or creator profile). */
export function getNotificationLink(
  type: NotificationType,
  postId?: string,
  creatorId?: string,
  currentUserId?: string
): string | undefined {
  if ((type !== 'like' && type !== 'comment') || !postId || !creatorId) return undefined;
  if (currentUserId === creatorId) return `/creator-studio?post=${postId}`;
  return `/creator/${creatorId}?post=${postId}`;
}
