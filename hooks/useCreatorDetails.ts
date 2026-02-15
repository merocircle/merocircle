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
  tier_level: number
  tier_name: string
  price: number
  description: string
  benefits: string[]
  extra_perks?: string[]
}

export interface CreatorDetails {
  user_id: string
  display_name: string
  username: string | null
  bio: string | null
  avatar_url: string | null
  cover_image_url: string | null
  created_at: string
  category: string | null
  is_verified: boolean
  total_earnings: number
  supporter_count: number
  posts_count: number
  is_supporter: boolean
  supporter_tier_level?: number
  social_links?: Record<string, string>
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
        subscriptionTiers: data.tiers || data.subscriptionTiers || [],
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

  const updateSupporterTier = useCallback((tierLevel: number) => {
    setProfile(prev => {
      if (!prev || !prev.creatorDetails) return prev;
      
      return {
        ...prev,
        creatorDetails: {
          ...prev.creatorDetails,
          is_supporter: true,
          supporter_tier_level: tierLevel
        }
      };
    });
  }, []);

  return {
    creatorDetails: profile?.creatorDetails || null,
    paymentMethods: profile?.paymentMethods || [],
    subscriptionTiers: profile?.subscriptionTiers || [],
    posts: profile?.posts || [],
    loading,
    error,
    refreshCreatorDetails: refetch,
    updateSupporterTier
  }
}

/**
 * useSubscription - Placeholder for recurring subscription management
 * NOTE: Currently, support is handled via one-time payments through payment gateways
 * (eSewa, Khalti, direct). Recurring subscriptions are not yet implemented.
 * Use the payment flow in CreatorProfileSection instead.
 */
export const useSubscription = () => {
  const [loading, setLoading] = useState(false)

  const subscribe = async (_creatorId: string, _tierId: string) => {
    setLoading(true)
    try {
      // Recurring subscriptions not yet implemented
      // Support is handled via payment gateways (eSewa, Khalti, direct)
      throw new Error('Recurring subscriptions coming soon. Please use the support tier buttons to make a one-time payment.')
    } finally {
      setLoading(false)
    }
  }

  const unsubscribe = async (_creatorId: string, _tierId: string) => {
    setLoading(true)
    try {
      // Recurring subscriptions not yet implemented
      throw new Error('Subscription management coming soon.')
    } finally {
      setLoading(false)
    }
  }

  return { subscribe, unsubscribe, loading }
} 
