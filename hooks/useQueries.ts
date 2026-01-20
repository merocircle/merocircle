import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/supabase-auth-context';

export function useUnifiedDashboard() {
  const { user, isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['dashboard', 'unified', user?.id],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/unified-feed');
      if (!res.ok) throw new Error('Failed to fetch feed');
      return res.json();
    },
    enabled: !!(isAuthenticated && user),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreatorAnalytics() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['creator', 'analytics', user?.id],
    queryFn: async () => {
      const res = await fetch('/api/creator/analytics');
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatorDashboardData() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['creator', 'dashboard', user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/creator/${user?.id}/dashboard`);
      if (!res.ok) throw new Error('Failed to fetch dashboard');
      return res.json();
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });
}

export function useNotificationsData(type?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['notifications', user?.id, type],
    queryFn: async () => {
      const url = type ? `/api/notifications?type=${type}` : '/api/notifications';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });
}

export function useCommunityChannels() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['community', 'channels', user?.id],
    queryFn: async () => {
      const res = await fetch('/api/community/channels');
      if (!res.ok) throw new Error('Failed to fetch channels');
      return res.json();
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePublishPost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (postData: any) => {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });
      if (!res.ok) throw new Error('Failed to publish post');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator', 'dashboard', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['creator', 'analytics', user?.id] });
    },
  });
}

export function useSendMessage(channelId: string | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (content: string) => {
      if (!channelId) throw new Error('No channel selected');
      const res = await fetch(`/api/community/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      return res.json();
    },
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: ['messages', channelId] });
      const previous = queryClient.getQueryData(['messages', channelId]);
      
      queryClient.setQueryData(['messages', channelId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          messages: [...(old.messages || []), {
            id: `temp-${Date.now()}`,
            content,
            created_at: new Date().toISOString(),
            user_id: 'current',
            pending: true,
          }]
        };
      });
      
      return { previous };
    },
    onError: (err, content, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['messages', channelId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: notificationIds }),
      });
      if (!res.ok) throw new Error('Failed to mark as read');
      return res.json();
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ['notifications', user?.id] });
      const previous = queryClient.getQueryData(['notifications', user?.id]);
      
      queryClient.setQueryData(['notifications', user?.id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          notifications: old.notifications.map((n: any) => 
            ids.includes(n.id) ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, old.unreadCount - ids.length),
        };
      });
      
      return { previous };
    },
    onError: (err, ids, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications', user?.id], context.previous);
      }
    },
  });
}
