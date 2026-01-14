import { useState, useEffect, useCallback } from 'react'

export interface PaymentMethod {
  id: string
  payment_type: 'esewa' | 'khalti' | 'bank_transfer'
  details: {
    phone_number?: string
    qr_code_url?: string
    account_name?: string
    account_number?: string
    bank_name?: string
  }
  is_active: boolean
  is_verified: boolean
}

export interface SubscriptionTier {
  id: string
  tier_name: string
  price: number
  description: string | null
  benefits: string[]
  max_subscribers: number | null
  current_subscribers: number
}

export interface CreatorDetails {
  user_id: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  created_at: string
  category: string | null
  is_verified: boolean
  total_earnings: number
  supporter_count: number
  posts_count: number
  is_supporter: boolean
  current_subscription: {
    id: string
    tier_name: string
    description: string
    benefits: string[]
    amount: number
    status: string
    next_billing_date: string
  } | null
}

export interface Post {
  id: string
  title: string
  content: string
  image_url: string | null
  type: 'image' | 'text' | 'audio' | 'video'
  likes: number
  comments: number
  views: number
  createdAt: string
  isPublic: boolean
  isLiked: boolean
}

export interface CreatorProfile {
  creatorDetails: CreatorDetails
  paymentMethods: PaymentMethod[]
  subscriptionTiers: SubscriptionTier[]
  posts: Post[]
}

export const useCreatorDetails = (creatorId: string | null) => {
  const [profile, setProfile] = useState<CreatorProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCreatorDetails = async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/creator/${id}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch creator details')
      }
      
      const data = await response.json();
      
      const creatorDetails = data.creatorDetails ? {
        ...data.creatorDetails,
        is_verified: data.creatorDetails.is_verified ?? data.creatorDetails.verified ?? false,
        created_at: data.creatorDetails.created_at || data.creatorDetails.join_date,
        supporter_count: data.creatorDetails.supporter_count || data.creatorDetails.supporters_count || 0,
        is_supporter: data.creatorDetails.is_supporter || false
      } : null;
      
      setProfile({
        creatorDetails,
        paymentMethods: data.paymentMethods || [],
        subscriptionTiers: data.subscriptionTiers || [],
        posts: data.posts || []
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load creator')
      console.error('Creator details error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (creatorId) {
      fetchCreatorDetails(creatorId)
    }
  }, [creatorId])

  const refetch = useCallback(() => {
    if (creatorId) {
      fetchCreatorDetails(creatorId)
    }
  }, [creatorId])

  return {
    creatorDetails: profile?.creatorDetails || null,
    paymentMethods: profile?.paymentMethods || [],
    subscriptionTiers: profile?.subscriptionTiers || [],
    posts: profile?.posts || [],
    loading,
    error,
    refreshCreatorDetails: refetch
  }
}

export const useSubscription = () => {
  const [loading, setLoading] = useState(false)

  const subscribe = async (creatorId: string, tierId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/creator/${creatorId}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId, action: 'subscribe' })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to subscribe')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Subscribe error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const unsubscribe = async (creatorId: string, tierId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/creator/${creatorId}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId, action: 'unsubscribe' })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to unsubscribe')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Unsubscribe error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return { subscribe, unsubscribe, loading }
} 
