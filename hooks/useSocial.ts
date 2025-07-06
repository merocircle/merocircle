import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/supabase-auth-context'

export interface Creator {
  user_id: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  follower_count: number
  following_count: number
  posts_count: number
  total_earned: number
  created_at: string
  isFollowing?: boolean
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
    display_name: string
    username: string
    avatar_url: string | null
  }
}

export interface DiscoveryFeed {
  trending_creators: Creator[]
  recent_posts: Post[]
  suggested_creators: Creator[]
}

// Hook for following/unfollowing creators
export const useFollow = () => {
  const [loading, setLoading] = useState(false)

  const followCreator = async (creatorId: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/social/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId, action: 'follow' })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to follow creator')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Follow error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const unfollowCreator = async (creatorId: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/social/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId, action: 'unfollow' })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to unfollow creator')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Unfollow error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return { followCreator, unfollowCreator, loading }
}

// Hook for discovery feed
export const useDiscoveryFeed = () => {
  const [feed, setFeed] = useState<DiscoveryFeed | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFeed = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/social/discover?limit=20')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch discovery feed')
      }
      
      const data = await response.json()
      setFeed(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Discovery feed error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeed()
  }, [])

  return { feed, loading, error, refetch: fetchFeed }
}

// Hook for creator search
export const useCreatorSearch = () => {
  const [results, setResults] = useState<Creator[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchCreators = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setResults([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/social/search?q=${encodeURIComponent(query)}&limit=20`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Search failed')
      }
      
      const data = await response.json()
      setResults(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      console.error('Search error:', err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const clearResults = () => {
    setResults([])
    setError(null)
  }

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
      console.error('Like error:', error)
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

  const fetchCreatorProfile = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const [creatorResponse, postsResponse] = await Promise.all([
        fetch(`/api/social/creator/${id}`),
        fetch(`/api/social/creator/${id}/posts`)
      ])
      
      if (!creatorResponse.ok || !postsResponse.ok) {
        throw new Error('Failed to fetch creator profile')
      }
      
      const [creatorData, postsData] = await Promise.all([
        creatorResponse.json(),
        postsResponse.json()
      ])
      
      setCreator(creatorData.creator)
      setPosts(postsData.posts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
      console.error('Creator profile error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (creatorId) {
      fetchCreatorProfile(creatorId)
    }
  }, [creatorId])

  return { creator, posts, loading, error, refetch: () => creatorId && fetchCreatorProfile(creatorId) }
} 