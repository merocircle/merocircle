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
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    refetchIntervalInBackground: true, // Refresh even when tab not focused
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
    refetchInterval: 60 * 1000, // Auto-refresh every 1 minute
    refetchIntervalInBackground: true, // Keep notifications fresh
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
    refetchInterval: 10 * 60 * 1000, // Auto-refresh every 10 minutes
    refetchIntervalInBackground: false, // Only when user is active
  });
}

export function usePublishPost() {
  const queryClient = useQueryClient();
  const { user, userProfile } = useAuth();

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
    onMutate: async (postData) => {
      // Create optimistic post
      const tempPost = {
        id: `temp-${Date.now()}`,
        ...postData,
        creator_id: user?.id,
        creator: {
          id: user?.id,
          display_name: userProfile?.display_name || 'You',
          photo_url: userProfile?.photo_url,
          role: 'creator',
        },
        likes_count: 0,
        comments_count: 0,
        created_at: new Date().toISOString(),
        pending: true, // Mark as pending
      };

      await queryClient.cancelQueries({ queryKey: ['dashboard', 'unified', user?.id] });
      const previous = queryClient.getQueryData(['dashboard', 'unified', user?.id]);

      queryClient.setQueryData(['dashboard', 'unified', user?.id], (old: any) => {
        if (!old?.posts) return old;
        return {
          ...old,
          posts: [tempPost, ...old.posts],
        };
      });

      return { previous, tempPostId: tempPost.id };
    },
    onSuccess: (newPost, variables, context) => {
      // Replace temp post with real post
      queryClient.setQueryData(['dashboard', 'unified', user?.id], (old: any) => {
        if (!old?.posts) return old;
        return {
          ...old,
          posts: old.posts.map((p: any) =>
            p.id === context?.tempPostId ? { ...newPost, pending: false } : p
          ),
        };
      });

      queryClient.invalidateQueries({ queryKey: ['creator', 'dashboard', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['creator', 'analytics', user?.id] });
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['dashboard', 'unified', user?.id], context.previous);
      }
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
        body: JSON.stringify({ notificationIds }),
      });
      if (!res.ok) throw new Error('Failed to mark as read');
      return res.json();
    },
    onMutate: async (ids) => {
      // Cancel all notification queries (with and without type)
      await queryClient.cancelQueries({ queryKey: ['notifications', user?.id] });
      
      // Get all notification queries to update
      const allQueries = queryClient.getQueryCache().findAll({ 
        queryKey: ['notifications', user?.id] 
      });
      
      const previousData: any[] = [];
      
      // Optimistically update all notification queries
      allQueries.forEach((query) => {
        const previous = queryClient.getQueryData(query.queryKey);
        previousData.push({ queryKey: query.queryKey, data: previous });
        
        queryClient.setQueryData(query.queryKey, (old: any) => {
          if (!old) return old;
          const updatedNotifications = old.notifications.map((n: any) => 
            ids.includes(n.id) ? { ...n, read: true } : n
          );
          const updatedUnreadCount = Math.max(0, old.unreadCount - ids.length);
          
          return {
            ...old,
            notifications: updatedNotifications,
            unreadCount: updatedUnreadCount,
          };
        });
      });
      
      return { previous: previousData };
    },
    onError: (err, ids, context) => {
      // Restore previous data for all queries
      if (context?.previous) {
        context.previous.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // Invalidate all notification queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (!res.ok) throw new Error('Failed to mark all as read');
      return res.json();
    },
    onMutate: async () => {
      // Cancel all notification queries (with and without type)
      await queryClient.cancelQueries({ queryKey: ['notifications', user?.id] });
      
      // Get all notification queries to update
      const allQueries = queryClient.getQueryCache().findAll({ 
        queryKey: ['notifications', user?.id] 
      });
      
      const previousData: any[] = [];
      
      // Optimistically update all notification queries - mark all as read
      allQueries.forEach((query) => {
        const previous = queryClient.getQueryData(query.queryKey);
        previousData.push({ queryKey: query.queryKey, data: previous });
        
        queryClient.setQueryData(query.queryKey, (old: any) => {
          if (!old) return old;
          return {
            ...old,
            notifications: old.notifications.map((n: any) => ({ ...n, read: true })),
            unreadCount: 0,
          };
        });
      });
      
      return { previous: previousData };
    },
    onError: (err, _, context) => {
      // Restore previous data for all queries
      if (context?.previous) {
        context.previous.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // Invalidate all notification queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });
}

// Optimistic like/unlike mutation
export function useLikePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, action }: { postId: string; action: 'like' | 'unlike' }) => {
      const res = await fetch('/api/social/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, action }),
      });
      if (!res.ok) throw new Error('Failed to like post');
      return res.json();
    },
    onMutate: async ({ postId, action }) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard', 'unified', user?.id] });
      const previous = queryClient.getQueryData(['dashboard', 'unified', user?.id]);

      queryClient.setQueryData(['dashboard', 'unified', user?.id], (old: any) => {
        if (!old?.posts) return old;
        return {
          ...old,
          posts: old.posts.map((post: any) => {
            if (post.id !== postId) return post;
            const delta = action === 'like' ? 1 : -1;
            return {
              ...post,
              likes_count: Math.max(0, (post.likes_count || 0) + delta),
            };
          }),
        };
      });

      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['dashboard', 'unified', user?.id], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'unified', user?.id] });
    },
  });
}

// Optimistic comment mutation
export function useAddComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Failed to add comment');
      return res.json();
    },
    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard', 'unified', user?.id] });
      const previous = queryClient.getQueryData(['dashboard', 'unified', user?.id]);

      queryClient.setQueryData(['dashboard', 'unified', user?.id], (old: any) => {
        if (!old?.posts) return old;
        return {
          ...old,
          posts: old.posts.map((post: any) =>
            post.id === postId
              ? { ...post, comments_count: (post.comments_count || 0) + 1 }
              : post
          ),
        };
      });

      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['dashboard', 'unified', user?.id], context.previous);
      }
    },
    onSettled: (data, error, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'unified', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });
}

// Optimistic subscribe/unsubscribe mutation
export function useToggleSupport() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ creatorId, action }: { creatorId: string; action: 'subscribe' | 'unsubscribe' }) => {
      const endpoint = action === 'subscribe' ? '/api/supporter/subscribe' : '/api/supporter/unsubscribe';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId }),
      });
      if (!res.ok) throw new Error(`Failed to ${action}`);
      return res.json();
    },
    onMutate: async ({ creatorId, action }) => {
      await queryClient.cancelQueries({ queryKey: ['creator', creatorId] });
      await queryClient.cancelQueries({ queryKey: ['dashboard', 'unified', user?.id] });

      const previousCreator = queryClient.getQueryData(['creator', creatorId]);
      const previousDashboard = queryClient.getQueryData(['dashboard', 'unified', user?.id]);

      queryClient.setQueryData(['creator', creatorId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          is_supporter: action === 'subscribe',
          supporters_count: Math.max(0, (old.supporters_count || 0) + (action === 'subscribe' ? 1 : -1)),
        };
      });

      return { previousCreator, previousDashboard };
    },
    onError: (err, variables, context) => {
      if (context?.previousCreator) {
        queryClient.setQueryData(['creator', variables.creatorId], context.previousCreator);
      }
      if (context?.previousDashboard) {
        queryClient.setQueryData(['dashboard', 'unified', user?.id], context.previousDashboard);
      }
    },
    onSettled: (data, error, { creatorId }) => {
      queryClient.invalidateQueries({ queryKey: ['creator', creatorId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'unified', user?.id] });
    },
  });
}

// Prefetch creator details on hover
export function usePrefetchCreator() {
  const queryClient = useQueryClient();
  const { useCallback } = require('react');

  return useCallback((creatorId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['creator', creatorId],
      queryFn: async () => {
        const res = await fetch(`/api/creator/${creatorId}`);
        if (!res.ok) throw new Error('Failed to fetch creator');
        return res.json();
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  }, [queryClient]);
}

// Prefetch next page of feed
export function usePrefetchFeedPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { useCallback } = require('react');

  return useCallback((nextPage: number) => {
    queryClient.prefetchQuery({
      queryKey: ['dashboard', 'unified', user?.id, nextPage],
      queryFn: async () => {
        const res = await fetch(`/api/dashboard/unified-feed?page=${nextPage}`);
        if (!res.ok) throw new Error('Failed to fetch feed');
        return res.json();
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  }, [queryClient, user?.id]);
}
