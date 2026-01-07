import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/supabase-auth-context';

interface Post {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  media_url?: string;
  is_public: boolean;
  tier_required: string;
  created_at: string;
  updated_at: string;
  creator_id: string;
  creator?: {
    id: string;
    display_name: string;
    photo_url?: string;
    role: string;
  };
  creator_profile?: {
    category: string;
    is_verified: boolean;
  };
  likes?: any[];
  comments?: any[];
  likes_count?: number;
  comments_count?: number;
}

interface CreatePostData {
  title: string;
  content: string;
  image_url?: string;
  media_url?: string;
  is_public?: boolean;
  tier_required?: string;
}

export function usePosts(creatorId?: string) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (creatorId) params.append('creator_id', creatorId);
      params.append('limit', '20');
      
      const response = await fetch(`/api/posts?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        setPosts(data.posts || []);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch posts');
      }
    } catch (err) {
      setError('Error loading posts');
    } finally {
      setLoading(false);
    }
  }, [creatorId]);

  const createPost = async (postData: CreatePostData) => {
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setPosts(prev => [data, ...prev]);
        return { success: true, post: data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: 'Failed to create post' };
    }
  };

  const updatePost = async (postId: string, updates: Partial<CreatePostData>) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setPosts(prev => prev.map(post => 
          post.id === postId ? { ...post, ...data } : post
        ));
        return { success: true, post: data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: 'Failed to update post' };
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setPosts(prev => prev.filter(post => post.id !== postId));
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: 'Failed to delete post' };
    }
  };

  const likePost = async (postId: string) => {
    try {
      const response = await fetch('/api/social/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId, action: 'like' }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Update the local state to reflect the like
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            const isLiked = post.likes?.some(like => like.user_id === user?.id);
            return {
              ...post,
              likes_count: isLiked ? (post.likes_count || 0) - 1 : (post.likes_count || 0) + 1
            };
          }
          return post;
        }));
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: 'Failed to like post' };
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    loading,
    error,
    createPost,
    updatePost,
    deletePost,
    likePost,
    refetch: fetchPosts
  };
}

export function usePost(postId: string) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    if (!postId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/posts/${postId}`);
        const data = await response.json();
        
        if (response.ok) {
          setPost(data);
          setError(null);
        } else {
          setError(data.error || 'Failed to fetch post');
        }
      } catch (err) {
        setError('Error loading post');
      } finally {
        setLoading(false);
      }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  return { post, loading, error };
} 
