import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface Creator {
  user_id: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  supporter_count: number
  posts_count: number
  total_earned: number
  created_at: string
  creator_profile?: {
    category?: string
    is_verified?: boolean
  }
}

export interface Post {
  id: string
  creator_id: string
  content: string
  image_url: string | null
  like_count: number
  is_liked: boolean
  created_at: string
  creator: {
    user_id: string
    display_name: string
    username?: string
    avatar_url: string | null
  }
}

export interface DiscoveryFeed {
  trending_creators: Creator[]
  recent_posts: Post[]
  suggested_creators: Creator[]
}

export const useDiscoveryFeed = () => {
  return useQuery<DiscoveryFeed>({
    queryKey: ['discovery', 'feed'],
    queryFn: async () => {
      const response = await fetch('/api/social/discover?limit=20');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch discovery feed' }));
        throw new Error(errorData.error || 'Failed to fetch discovery feed');
      }
      
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Auto-refresh every 10 minutes
  });
}

// Hook for creator search
export const useCreatorSearch = () => {
  const [results, setResults] = useState<Creator[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchCreators = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setResults([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/social/search?q=${encodeURIComponent(query)}&limit=20`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Search failed' }))
        throw new Error(errorData.error || 'Search failed')
      }
      
      const data = await response.json()
      setResults(data.data || [])
    } catch (err) {
      console.error('Search error:', err)
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const clearResults = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  return { results, loading, error, searchCreators, clearResults }
}

// Hook for post likes
export const usePostLike = () => {
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const toggleLike = async (postId: string, isCurrentlyLiked: boolean) => {
    setLoading(prev => ({ ...prev, [postId]: true }))
    
    try {
      const action = isCurrentlyLiked ? 'unlike' : 'like'
      const response = await fetch('/api/social/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, action })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update like')
      }
      
      return await response.json()
    } catch (error) {
      throw error
    } finally {
      setLoading(prev => ({ ...prev, [postId]: false }))
    }
  }

  return { toggleLike, loading }
}

// Hook for getting creator profile
export const useCreatorProfile = (creatorId: string | null) => {
  const [creator, setCreator] = useState<Creator | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCreatorProfile = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      // Use the correct API endpoints
      const [creatorResponse, postsResponse] = await Promise.all([
        fetch(`/api/creator/${id}`),
        fetch(`/api/creator/${id}/posts`)
      ])

      if (!creatorResponse.ok || !postsResponse.ok) {
        throw new Error('Failed to fetch creator profile')
      }

      const [creatorData, postsData] = await Promise.all([
        creatorResponse.json(),
        postsResponse.json()
      ])

      // Map the response to match expected format
      setCreator(creatorData.creatorDetails || creatorData.creator)
      setPosts(postsData.posts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (creatorId) {
      fetchCreatorProfile(creatorId)
    }
  }, [creatorId, fetchCreatorProfile])

  return { creator, posts, loading, error, refetch: () => creatorId && fetchCreatorProfile(creatorId) }
} 
