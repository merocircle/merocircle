'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/supabase-auth-context';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Post {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  creator_id: string;
  created_at: string;
  likes_count?: number;
  comments_count?: number;
}

/**
 * Hook to enable real-time updates for the feed
 * Subscribes to posts, likes, and comments changes via Supabase Realtime
 */
export function useRealtimeFeed() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Handle new post
  const handleNewPost = useCallback((payload: any) => {
    const newPost = payload.new;

    // We need to fetch the full post with creator info
    // For now, just invalidate to trigger a refetch
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'unified'] });
  }, [queryClient]);

  // Handle post update
  const handlePostUpdate = useCallback((payload: any) => {
    const updatedPost = payload.new;

    queryClient.setQueryData(['dashboard', 'unified', user?.id], (old: any) => {
      if (!old?.posts) return old;
      return {
        ...old,
        posts: old.posts.map((post: Post) =>
          post.id === updatedPost.id
            ? { ...post, ...updatedPost }
            : post
        ),
      };
    });
  }, [queryClient, user?.id]);

  // Handle post delete
  const handlePostDelete = useCallback((payload: any) => {
    const deletedId = payload.old.id;

    queryClient.setQueryData(['dashboard', 'unified', user?.id], (old: any) => {
      if (!old?.posts) return old;
      return {
        ...old,
        posts: old.posts.filter((post: Post) => post.id !== deletedId),
      };
    });
  }, [queryClient, user?.id]);

  // Handle new like
  const handleNewLike = useCallback((payload: any) => {
    const newLike = payload.new;

    queryClient.setQueryData(['dashboard', 'unified', user?.id], (old: any) => {
      if (!old?.posts) return old;
      return {
        ...old,
        posts: old.posts.map((post: Post) =>
          post.id === newLike.post_id
            ? { ...post, likes_count: (post.likes_count || 0) + 1 }
            : post
        ),
      };
    });
  }, [queryClient, user?.id]);

  // Handle like removed
  const handleLikeDelete = useCallback((payload: any) => {
    const deletedLike = payload.old;

    queryClient.setQueryData(['dashboard', 'unified', user?.id], (old: any) => {
      if (!old?.posts) return old;
      return {
        ...old,
        posts: old.posts.map((post: Post) =>
          post.id === deletedLike.post_id
            ? { ...post, likes_count: Math.max(0, (post.likes_count || 0) - 1) }
            : post
        ),
      };
    });
  }, [queryClient, user?.id]);

  // Handle new comment
  const handleNewComment = useCallback((payload: any) => {
    const newComment = payload.new;

    // Update post comments count
    queryClient.setQueryData(['dashboard', 'unified', user?.id], (old: any) => {
      if (!old?.posts) return old;
      return {
        ...old,
        posts: old.posts.map((post: Post) =>
          post.id === newComment.post_id
            ? { ...post, comments_count: (post.comments_count || 0) + 1 }
            : post
        ),
      };
    });

    // Invalidate specific post's comments cache
    queryClient.invalidateQueries({ queryKey: ['comments', newComment.post_id] });
  }, [queryClient, user?.id]);

  // Handle comment deleted
  const handleCommentDelete = useCallback((payload: any) => {
    const deletedComment = payload.old;

    queryClient.setQueryData(['dashboard', 'unified', user?.id], (old: any) => {
      if (!old?.posts) return old;
      return {
        ...old,
        posts: old.posts.map((post: Post) =>
          post.id === deletedComment.post_id
            ? { ...post, comments_count: Math.max(0, (post.comments_count || 0) - 1) }
            : post
        ),
      };
    });

    queryClient.invalidateQueries({ queryKey: ['comments', deletedComment.post_id] });
  }, [queryClient, user?.id]);

  const postsChannelRef = useRef<RealtimeChannel | null>(null);
  const likesChannelRef = useRef<RealtimeChannel | null>(null);
  const commentsChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Cleanup previous channels if they exist
    if (postsChannelRef.current) {
      supabase.removeChannel(postsChannelRef.current);
      postsChannelRef.current = null;
    }
    if (likesChannelRef.current) {
      supabase.removeChannel(likesChannelRef.current);
      likesChannelRef.current = null;
    }
    if (commentsChannelRef.current) {
      supabase.removeChannel(commentsChannelRef.current);
      commentsChannelRef.current = null;
    }

    // Subscribe to posts changes
    const postsChannel = supabase
      .channel('posts-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        handleNewPost
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        handlePostUpdate
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts' },
        handlePostDelete
      )
      .subscribe();
    postsChannelRef.current = postsChannel;

    // Subscribe to likes changes
    const likesChannel = supabase
      .channel('likes-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'post_likes' },
        handleNewLike
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'post_likes' },
        handleLikeDelete
      )
      .subscribe();
    likesChannelRef.current = likesChannel;

    // Subscribe to comments changes
    const commentsChannel = supabase
      .channel('comments-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'post_comments' },
        handleNewComment
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'post_comments' },
        handleCommentDelete
      )
      .subscribe();
    commentsChannelRef.current = commentsChannel;

    // Cleanup subscriptions on unmount or when dependencies change
    return () => {
      if (postsChannelRef.current) {
        supabase.removeChannel(postsChannelRef.current);
        postsChannelRef.current = null;
      }
      if (likesChannelRef.current) {
        supabase.removeChannel(likesChannelRef.current);
        likesChannelRef.current = null;
      }
      if (commentsChannelRef.current) {
        supabase.removeChannel(commentsChannelRef.current);
        commentsChannelRef.current = null;
      }
    };
  }, [
    handleNewPost,
    handlePostUpdate,
    handlePostDelete,
    handleNewLike,
    handleLikeDelete,
    handleNewComment,
    handleCommentDelete,
  ]);

  return null; // This hook only sets up subscriptions
}

/**
 * Hook to enable real-time updates for a specific post's comments
 */
export function useRealtimeComments(postId: string | null) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!postId) return;

    // Cleanup previous channel if it exists
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Create and subscribe to new channel
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_comments',
          filter: `post_id=eq.${postId}`,
        },
        () => {
          // Invalidate comments query to refetch
          queryClient.invalidateQueries({ queryKey: ['comments', postId] });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [postId, queryClient]);
}

export default useRealtimeFeed;
