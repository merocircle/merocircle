'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
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

// Global counter to ensure unique channel names across mounts
let channelCounter = 0;

/**
 * Hook to enable real-time updates for the feed
 * Subscribes to posts, likes, and comments changes via Supabase Realtime
 */
export function useRealtimeFeed() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Use refs for callbacks to avoid re-subscribing on every render
  const queryClientRef = useRef(queryClient);
  const userIdRef = useRef(user?.id);
  queryClientRef.current = queryClient;
  userIdRef.current = user?.id;

  const postsChannelRef = useRef<RealtimeChannel | null>(null);
  const likesChannelRef = useRef<RealtimeChannel | null>(null);
  const commentsChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Generate unique channel names for this mount
    const mountId = ++channelCounter;
    const postsName = `posts-realtime-${mountId}`;
    const likesName = `likes-realtime-${mountId}`;
    const commentsName = `comments-realtime-${mountId}`;

    // Subscribe to posts changes
    const postsChannel = supabase
      .channel(postsName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        () => {
          queryClientRef.current.invalidateQueries({ queryKey: ['dashboard', 'unified'] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        (payload: any) => {
          const updatedPost = payload.new;
          queryClientRef.current.setQueryData(['dashboard', 'unified', userIdRef.current], (old: any) => {
            const updateIn = (list: Post[] | undefined) =>
              list?.map((post: Post) => (post.id === updatedPost.id ? { ...post, ...updatedPost } : post));
            if (old?.supporter_posts != null || old?.other_posts != null) {
              return {
                ...old,
                supporter_posts: updateIn(old.supporter_posts) ?? old.supporter_posts,
                other_posts: updateIn(old.other_posts) ?? old.other_posts,
              };
            }
            if (!old?.posts) return old;
            return { ...old, posts: updateIn(old.posts) ?? old.posts };
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts' },
        (payload: any) => {
          const deletedId = payload.old.id;
          queryClientRef.current.setQueryData(['dashboard', 'unified', userIdRef.current], (old: any) => {
            const filterOut = (list: Post[] | undefined) => list?.filter((post: Post) => post.id !== deletedId);
            if (old?.supporter_posts != null || old?.other_posts != null) {
              return {
                ...old,
                supporter_posts: filterOut(old.supporter_posts) ?? old.supporter_posts,
                other_posts: filterOut(old.other_posts) ?? old.other_posts,
              };
            }
            if (!old?.posts) return old;
            return { ...old, posts: filterOut(old.posts) ?? old.posts };
          });
        }
      )
      .subscribe();
    postsChannelRef.current = postsChannel;

    // Subscribe to likes changes
    const likesChannel = supabase
      .channel(likesName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'post_likes' },
        (payload: any) => {
          const newLike = payload.new;
          queryClientRef.current.setQueryData(['dashboard', 'unified', userIdRef.current], (old: any) => {
            const bumpLike = (list: Post[] | undefined) =>
              list?.map((post: Post) =>
                post.id === newLike.post_id ? { ...post, likes_count: (post.likes_count || 0) + 1 } : post
              );
            if (old?.supporter_posts != null || old?.other_posts != null) {
              return {
                ...old,
                supporter_posts: bumpLike(old.supporter_posts) ?? old.supporter_posts,
                other_posts: bumpLike(old.other_posts) ?? old.other_posts,
              };
            }
            if (!old?.posts) return old;
            return { ...old, posts: bumpLike(old.posts) ?? old.posts };
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'post_likes' },
        (payload: any) => {
          const deletedLike = payload.old;
          queryClientRef.current.setQueryData(['dashboard', 'unified', userIdRef.current], (old: any) => {
            const unbumpLike = (list: Post[] | undefined) =>
              list?.map((post: Post) =>
                post.id === deletedLike.post_id
                  ? { ...post, likes_count: Math.max(0, (post.likes_count || 0) - 1) }
                  : post
              );
            if (old?.supporter_posts != null || old?.other_posts != null) {
              return {
                ...old,
                supporter_posts: unbumpLike(old.supporter_posts) ?? old.supporter_posts,
                other_posts: unbumpLike(old.other_posts) ?? old.other_posts,
              };
            }
            if (!old?.posts) return old;
            return { ...old, posts: unbumpLike(old.posts) ?? old.posts };
          });
        }
      )
      .subscribe();
    likesChannelRef.current = likesChannel;

    // Subscribe to comments changes
    const commentsChannel = supabase
      .channel(commentsName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'post_comments' },
        (payload: any) => {
          const newComment = payload.new;
          queryClientRef.current.setQueryData(['dashboard', 'unified', userIdRef.current], (old: any) => {
            const bumpComment = (list: Post[] | undefined) =>
              list?.map((post: Post) =>
                post.id === newComment.post_id
                  ? { ...post, comments_count: (post.comments_count || 0) + 1 }
                  : post
              );
            if (old?.supporter_posts != null || old?.other_posts != null) {
              return {
                ...old,
                supporter_posts: bumpComment(old.supporter_posts) ?? old.supporter_posts,
                other_posts: bumpComment(old.other_posts) ?? old.other_posts,
              };
            }
            if (!old?.posts) return old;
            return { ...old, posts: bumpComment(old.posts) ?? old.posts };
          });
          queryClientRef.current.invalidateQueries({ queryKey: ['comments', newComment.post_id] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'post_comments' },
        (payload: any) => {
          const deletedComment = payload.old;
          queryClientRef.current.setQueryData(['dashboard', 'unified', userIdRef.current], (old: any) => {
            const unbumpComment = (list: Post[] | undefined) =>
              list?.map((post: Post) =>
                post.id === deletedComment.post_id
                  ? { ...post, comments_count: Math.max(0, (post.comments_count || 0) - 1) }
                  : post
              );
            if (old?.supporter_posts != null || old?.other_posts != null) {
              return {
                ...old,
                supporter_posts: unbumpComment(old.supporter_posts) ?? old.supporter_posts,
                other_posts: unbumpComment(old.other_posts) ?? old.other_posts,
              };
            }
            if (!old?.posts) return old;
            return { ...old, posts: unbumpComment(old.posts) ?? old.posts };
          });
          queryClientRef.current.invalidateQueries({ queryKey: ['comments', deletedComment.post_id] });
        }
      )
      .subscribe();
    commentsChannelRef.current = commentsChannel;

    // Cleanup on unmount
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
  }, []); // Empty deps - subscribe once on mount, clean up on unmount

  return null;
}

/**
 * Hook to enable real-time updates for a specific post's comments
 */
export function useRealtimeComments(postId: string | null) {
  const queryClient = useQueryClient();
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!postId) return;

    // Cleanup previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const mountId = ++channelCounter;
    const channelName = `comments-${postId}-${mountId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_comments',
          filter: `post_id=eq.${postId}`,
        },
        () => {
          queryClientRef.current.invalidateQueries({ queryKey: ['comments', postId] });
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
  }, [postId]);
}

/**
 * Subscribe to like/comment changes for a set of post IDs and call onPostActivity when any of them change.
 */
export function useRealtimeCreatorPosts(
  postIds: string[],
  onPostActivity: () => void
) {
  const likesChannelRef = useRef<RealtimeChannel | null>(null);
  const commentsChannelRef = useRef<RealtimeChannel | null>(null);
  const postIdSetRef = useRef<Set<string>>(new Set());
  const onPostActivityRef = useRef(onPostActivity);

  postIdSetRef.current = new Set(postIds);
  onPostActivityRef.current = onPostActivity;

  // Stable dependency for postIds
  const postIdsKey = postIds.join(',');

  useEffect(() => {
    if (postIds.length === 0) return;

    const mountId = ++channelCounter;

    if (likesChannelRef.current) {
      supabase.removeChannel(likesChannelRef.current);
      likesChannelRef.current = null;
    }
    if (commentsChannelRef.current) {
      supabase.removeChannel(commentsChannelRef.current);
      commentsChannelRef.current = null;
    }

    const notifyIfRelevant = (postId: string | undefined) => {
      if (postId && postIdSetRef.current.has(postId)) {
        onPostActivityRef.current();
      }
    };

    const likesChannel = supabase
      .channel(`creator-posts-likes-${mountId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'post_likes' },
        (payload: any) => notifyIfRelevant(payload.new?.post_id)
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'post_likes' },
        (payload: any) => notifyIfRelevant(payload.old?.post_id)
      )
      .subscribe();
    likesChannelRef.current = likesChannel;

    const commentsChannel = supabase
      .channel(`creator-posts-comments-${mountId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'post_comments' },
        (payload: any) => notifyIfRelevant(payload.new?.post_id)
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'post_comments' },
        (payload: any) => notifyIfRelevant(payload.old?.post_id)
      )
      .subscribe();
    commentsChannelRef.current = commentsChannel;

    return () => {
      if (likesChannelRef.current) {
        supabase.removeChannel(likesChannelRef.current);
        likesChannelRef.current = null;
      }
      if (commentsChannelRef.current) {
        supabase.removeChannel(commentsChannelRef.current);
        commentsChannelRef.current = null;
      }
    };
  }, [postIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps
}

export default useRealtimeFeed;
