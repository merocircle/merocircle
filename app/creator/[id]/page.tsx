'use client'

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion'
import Image from 'next/image'
import { SidebarNav } from '@/components/sidebar-nav'
import { useAuth } from '@/contexts/supabase-auth-context'
import { useCreatorDetails, useSubscription } from '@/hooks/useCreatorDetails'
import { EnhancedPostCard } from '@/components/posts/EnhancedPostCard'
import { TierSelection } from '@/components/creator/TierSelection'
import { PaymentGatewaySelector } from '@/components/payment/PaymentGatewaySelector'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils';
import {
  Users,
  FileText,
  Calendar,
  Star,
  CheckCircle,
  Share2,
  MessageCircle,
  MoreHorizontal,
  ShoppingBag,
  Info,
  Facebook,
  Youtube,
  Instagram,
  Linkedin,
  Twitter,
  Globe,
  Link as LinkIcon
} from 'lucide-react'

export default function CreatorProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const creatorId = params.id as string
  
  // Redirect to own profile page if viewing self
  useEffect(() => {
    if (user && user.id === creatorId) {
      router.push('/profile')
    }
  }, [user, creatorId, router])
  
  const { 
    creatorDetails, 
    subscriptionTiers,
    posts: recentPosts,
    loading, 
    error,
    refreshCreatorDetails 
  } = useCreatorDetails(creatorId)
  
  const { subscribe, unsubscribe } = useSubscription();
  
  const isSupporter = creatorDetails?.is_supporter || false;
  const hasActiveSubscription = creatorDetails?.current_subscription !== null;
  
  const [activeTab, setActiveTab] = useState('home');
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [showGatewaySelector, setShowGatewaySelector] = useState(false)
  const [pendingPayment, setPendingPayment] = useState<{ tierLevel: number; amount: number; message?: string } | null>(null);

  // Save to recently visited
  useEffect(() => {
    if (creatorDetails && !loading) {
      const recentlyVisited = JSON.parse(localStorage.getItem('recentlyVisited') || '[]');
      const newItem = {
        id: creatorId,
        name: creatorDetails.display_name,
        avatar: creatorDetails.avatar_url,
        type: 'creator',
        href: `/creator/${creatorId}`,
      };
      
      // Remove duplicates and add to front
      const filtered = recentlyVisited.filter((item: any) => item.id !== creatorId);
      const updated = [newItem, ...filtered].slice(0, 10);
      localStorage.setItem('recentlyVisited', JSON.stringify(updated));
    }
  }, [creatorDetails, creatorId, loading]);

  // Supporters are automatically tracked when they make payments

  const handlePayment = async (tierLevel: number, amount: number, message?: string) => {
    if (!user) {
      router.push('/auth')
      return
    }

    // Store payment details and show gateway selector
    setPendingPayment({ tierLevel, amount, message })
    setShowGatewaySelector(true)
  }

  const handleGatewaySelection = async (gateway: 'esewa' | 'khalti') => {
    if (!pendingPayment || !user) return

    setShowGatewaySelector(false)
    setPaymentLoading(true)

    try {
      const { tierLevel, amount, message } = pendingPayment

      if (gateway === 'khalti') {
        // Handle Khalti payment
        const response = await fetch('/api/payment/khalti/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amount,
            creatorId,
            supporterId: user.id,
            supporterMessage: message || '',
            tier_level: tierLevel,
          })
        })

        if (!response.ok) {
          throw new Error('Khalti payment initiation failed')
        }

        const result = await response.json()

        console.log('[PAYMENT] Khalti Response:', result)

        if (result.success && result.payment_url) {
          window.location.href = result.payment_url
          return
        } else {
          throw new Error(result.error || 'Invalid Khalti response')
        }
      }

      // Handle eSewa payment
      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          creatorId,
          supporterId: user.id,
          supporterMessage: message || '',
          tier_level: tierLevel,
        })
      })

      if (!response.ok) {
        throw new Error('Payment initiation failed')
      }

      const result = await response.json()

      if (result.test_mode && result.redirect_url) {
        window.location.href = result.redirect_url
        return
      }

      if (result.success && result.esewaConfig) {
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = result.payment_url

        Object.entries(result.esewaConfig).forEach(([key, value]) => {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = key
          input.value = String(value)
          form.appendChild(input)
        })

        document.body.appendChild(form)
        form.submit()
      } else {
        throw new Error(result.error || 'Invalid payment response')
      }
    } catch (error: unknown) {
      console.error('[PAYMENT] Error:', error)
      alert(error instanceof Error ? error.message : 'Payment failed. Please try again.')
      setPaymentLoading(false)
      setPendingPayment(null)
    }
  }

  const handleSubscription = async (tierId: string) => {
    if (!user) {
      router.push('/auth')
      return
    }

    try {
      if (hasActiveSubscription && creatorDetails?.current_subscription) {
        await unsubscribe(creatorId, creatorDetails.current_subscription.id)
        alert('Subscription cancelled successfully')
      } else {
        await subscribe(creatorId, tierId)
        alert('Subscribed successfully!')
      }
      refreshCreatorDetails()
    } catch {
      alert('Subscription failed. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
        <SidebarNav />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </main>
      </div>
    )
  }

  if (error || !creatorDetails) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
        <SidebarNav />
        <main className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Creator Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This creator doesn&apos;t exist or has been removed
            </p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <SidebarNav />
      
      <main className="flex-1 overflow-y-auto">
        {/* Hero Banner */}
        <div className="relative h-64 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 overflow-hidden">
          {/* Cover Image (if available) */}
          {creatorDetails.cover_image_url && (
            <Image 
              src={creatorDetails.cover_image_url} 
              alt={`${creatorDetails.display_name} cover`}
              fill
              className="object-cover"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        {/* Profile Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-20 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
              {/* Profile Avatar */}
              <Avatar className="w-32 h-32 border-4 border-white dark:border-gray-900 shadow-xl">
                <AvatarImage src={creatorDetails.avatar_url} alt={creatorDetails.display_name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-4xl">
                  {creatorDetails.display_name?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>

              {/* Profile Info */}
              <div className="flex-1 pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {creatorDetails.display_name}
                      </h1>
                      {creatorDetails.is_verified && (
                        <CheckCircle className="w-6 h-6 text-blue-500" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {creatorDetails.supporter_count || 0} supporters
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {creatorDetails.posts_count || 0} posts
                      </span>
                      {creatorDetails.category && (
                        <Badge variant="outline" className="gap-1">
                          <Star className="w-3 h-3" />
                          {creatorDetails.category}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {isSupporter && (
                      <Badge variant="secondary" className="gap-1 px-3 py-1">
                        <CheckCircle className="w-3 h-3" />
                        Supporter
                      </Badge>
                    )}
                    
                    <Button variant="outline" size="icon">
                      <Share2 className="w-4 h-4" />
                    </Button>
                    
                    <Button variant="outline" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {creatorDetails.bio && (
                  <p className="mt-4 text-gray-700 dark:text-gray-300 max-w-3xl">
                    {creatorDetails.bio}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-200 dark:border-gray-800">
              <TabsList className="h-auto p-0 bg-transparent">
                <TabsTrigger 
                  value="home" 
                  className={cn(
                    "rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent",
                    "px-6 py-3 text-base font-medium"
                  )}
                >
                  Home
                </TabsTrigger>
                <TabsTrigger 
                  value="posts"
                  className={cn(
                    "rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent",
                    "px-6 py-3 text-base font-medium"
                  )}
                >
                  Posts
                </TabsTrigger>
                <TabsTrigger 
                  value="shop"
                  className={cn(
                    "rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent",
                    "px-6 py-3 text-base font-medium"
                  )}
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Shop
                </TabsTrigger>
                <TabsTrigger 
                  value="about"
                  className={cn(
                    "rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent",
                    "px-6 py-3 text-base font-medium"
                  )}
                >
                  <Info className="w-4 h-4 mr-2" />
                  About
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 pb-12">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Home Tab */}
                <TabsContent value="home" className="mt-0 space-y-6">
                  {/* Tier Selection - Centered */}
                  <div className="flex justify-center">
                    <div className="w-full max-w-2xl">
                      <TierSelection
                        tiers={subscriptionTiers}
                        creatorName={creatorDetails.display_name}
                        currentTierLevel={creatorDetails.supporter_tier_level || 0}
                        onSelectTier={handlePayment}
                        loading={paymentLoading}
                      />
                    </div>
                  </div>

                  {/* Recent Posts Preview */}
                  {recentPosts.length > 0 && (
                    <>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Recent Posts</h3>
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab('posts')}>
                          View All
                        </Button>
                      </div>
                      {(recentPosts.slice(0, 3) as Array<Record<string, unknown>>).map((post: Record<string, unknown>) => {
                        const postId = String(post.id || '');
                        const likes = post.likes as Array<Record<string, unknown>> | undefined;
                        const comments = post.comments as Array<Record<string, unknown>> | undefined;

                        return (
                          <EnhancedPostCard
                            key={postId}
                            post={{
                              id: postId,
                              title: String(post.title || ''),
                              content: String(post.content || ''),
                              image_url: post.image_url ? String(post.image_url) : undefined,
                              media_url: post.media_url ? String(post.media_url) : undefined,
                              tier_required: String(post.tier_required || 'free'),
                              post_type: String(post.post_type || 'post'),
                              created_at: String(post.created_at || post.createdAt || ''),
                              creator: (post.creator as Record<string, unknown>) || {
                                id: creatorId,
                                display_name: creatorDetails?.display_name || 'Unknown',
                                photo_url: creatorDetails?.avatar_url,
                                role: 'creator'
                              },
                              creator_profile: (post.creator_profile as Record<string, unknown>) || {
                                category: creatorDetails?.category || undefined,
                                is_verified: creatorDetails?.is_verified || false
                              },
                              poll: post.poll as Record<string, unknown> | undefined,
                              likes_count: (post.likes_count as number) || (likes?.length || 0),
                              comments_count: (post.comments_count as number) || (comments?.length || 0)
                            }}
                            currentUserId={user?.id}
                            showActions={true}
                          />
                        );
                      })}
                    </>
                  )}
                </TabsContent>

                {/* Posts Tab */}
                <TabsContent value="posts" className="mt-0 space-y-6">
                  {recentPosts.length > 0 ? (recentPosts as Array<Record<string, unknown>>).map((post: Record<string, unknown>) => {
                    const postId = String(post.id || '');
                    const likes = post.likes as Array<Record<string, unknown>> | undefined;
                    const comments = post.comments as Array<Record<string, unknown>> | undefined;

                    return (
                      <EnhancedPostCard
                        key={postId}
                        post={{
                          id: postId,
                          title: String(post.title || ''),
                          content: String(post.content || ''),
                          image_url: post.image_url ? String(post.image_url) : undefined,
                          media_url: post.media_url ? String(post.media_url) : undefined,
                          tier_required: String(post.tier_required || 'free'),
                          post_type: String(post.post_type || 'post'),
                          created_at: String(post.created_at || post.createdAt || ''),
                          creator: (post.creator as Record<string, unknown>) || {
                            id: creatorId,
                            display_name: creatorDetails?.display_name || 'Unknown',
                            photo_url: creatorDetails?.avatar_url,
                            role: 'creator'
                          },
                          creator_profile: (post.creator_profile as Record<string, unknown>) || {
                            category: creatorDetails?.category || undefined,
                            is_verified: creatorDetails?.is_verified || false
                          },
                          poll: post.poll as Record<string, unknown> | undefined,
                          likes_count: (post.likes_count as number) || (likes?.length || 0),
                          comments_count: (post.comments_count as number) || (comments?.length || 0)
                        }}
                        currentUserId={user?.id}
                        showActions={true}
                      />
                    );
                  }) : (
                    <Card className="p-12 text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Posts Yet</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        This creator hasn&apos;t posted anything yet.
                      </p>
                    </Card>
                  )}
                </TabsContent>

                {/* Shop Tab */}
                <TabsContent value="shop" className="mt-0">
                  <Card className="p-12 text-center">
                    <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Shop Coming Soon</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      This creator will be able to sell products and merchandise here.
                    </p>
                  </Card>
                </TabsContent>

                {/* About Tab */}
                <TabsContent value="about" className="mt-0">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">About</h3>
                    <div className="space-y-4">
                      {creatorDetails.bio && (
                        <div>
                          <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-2">Bio</h4>
                          <p className="text-gray-700 dark:text-gray-300">{creatorDetails.bio}</p>
                        </div>
                      )}

                      <Separator />

                      <div className="grid grid-cols-2 gap-4">
                        {creatorDetails.category && (
                          <div>
                            <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-2">Category</h4>
                            <Badge variant="outline">{creatorDetails.category}</Badge>
                          </div>
                        )}

                        {creatorDetails.created_at && (
                          <div>
                            <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-2">Joined</h4>
                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                              <Calendar className="w-4 h-4" />
                              {new Date(creatorDetails.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long'
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Social Links in About Tab */}
                      {creatorDetails.social_links && Object.keys(creatorDetails.social_links).length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-3">Social Media</h4>
                            <div className="flex flex-wrap gap-2">
                              {creatorDetails.social_links.facebook && (
                                <a href={creatorDetails.social_links.facebook} target="_blank" rel="noopener noreferrer">
                                  <Button variant="outline" size="sm" className="gap-2">
                                    <Facebook className="w-4 h-4 text-blue-600" />
                                    Facebook
                                  </Button>
                                </a>
                              )}
                              {creatorDetails.social_links.youtube && (
                                <a href={creatorDetails.social_links.youtube} target="_blank" rel="noopener noreferrer">
                                  <Button variant="outline" size="sm" className="gap-2">
                                    <Youtube className="w-4 h-4 text-red-600" />
                                    YouTube
                                  </Button>
                                </a>
                              )}
                              {creatorDetails.social_links.instagram && (
                                <a href={creatorDetails.social_links.instagram} target="_blank" rel="noopener noreferrer">
                                  <Button variant="outline" size="sm" className="gap-2">
                                    <Instagram className="w-4 h-4 text-pink-600" />
                                    Instagram
                                  </Button>
                                </a>
                              )}
                              {creatorDetails.social_links.linkedin && (
                                <a href={creatorDetails.social_links.linkedin} target="_blank" rel="noopener noreferrer">
                                  <Button variant="outline" size="sm" className="gap-2">
                                    <Linkedin className="w-4 h-4 text-blue-700" />
                                    LinkedIn
                                  </Button>
                                </a>
                              )}
                              {creatorDetails.social_links.twitter && (
                                <a href={creatorDetails.social_links.twitter} target="_blank" rel="noopener noreferrer">
                                  <Button variant="outline" size="sm" className="gap-2">
                                    <Twitter className="w-4 h-4 text-sky-500" />
                                    Twitter
                                  </Button>
                                </a>
                              )}
                              {creatorDetails.social_links.tiktok && (
                                <a href={creatorDetails.social_links.tiktok} target="_blank" rel="noopener noreferrer">
                                  <Button variant="outline" size="sm" className="gap-2">
                                    <MessageCircle className="w-4 h-4" />
                                    TikTok
                                  </Button>
                                </a>
                              )}
                              {creatorDetails.social_links.website && (
                                <a href={creatorDetails.social_links.website} target="_blank" rel="noopener noreferrer">
                                  <Button variant="outline" size="sm" className="gap-2">
                                    <Globe className="w-4 h-4 text-purple-600" />
                                    Website
                                  </Button>
                                </a>
                              )}
                              {creatorDetails.social_links.other && (
                                <a href={creatorDetails.social_links.other} target="_blank" rel="noopener noreferrer">
                                  <Button variant="outline" size="sm" className="gap-2">
                                    <LinkIcon className="w-4 h-4" />
                                    Other
                                  </Button>
                                </a>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                </TabsContent>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="sticky top-4 space-y-6">
                  {/* Creator Stats */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Star className="w-5 h-5 text-purple-500" />
                      Stats
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">Supporters</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {creatorDetails.supporter_count || 0}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">Posts</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {creatorDetails.posts_count || 0}
                        </span>
                      </div>
                      {creatorDetails.category && (
                        <>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <Star className="w-4 h-4" />
                              <span className="text-sm">Category</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {creatorDetails.category}
                            </Badge>
                          </div>
                        </>
                      )}
                    </div>
                  </Card>

                  {/* Social Links */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Share2 className="w-5 h-5 text-blue-500" />
                      Connect
                    </h3>
                    {creatorDetails.social_links && Object.keys(creatorDetails.social_links).length > 0 ? (
                      <div className="space-y-2">
                        {creatorDetails.social_links.facebook && (
                          <a href={creatorDetails.social_links.facebook} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" className="w-full justify-start hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors">
                              <Facebook className="w-4 h-4 mr-2 text-blue-600" />
                              Facebook
                            </Button>
                          </a>
                        )}
                        {creatorDetails.social_links.youtube && (
                          <a href={creatorDetails.social_links.youtube} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" className="w-full justify-start hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
                              <Youtube className="w-4 h-4 mr-2 text-red-600" />
                              YouTube
                            </Button>
                          </a>
                        )}
                        {creatorDetails.social_links.instagram && (
                          <a href={creatorDetails.social_links.instagram} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" className="w-full justify-start hover:bg-pink-50 dark:hover:bg-pink-950 transition-colors">
                              <Instagram className="w-4 h-4 mr-2 text-pink-600" />
                              Instagram
                            </Button>
                          </a>
                        )}
                        {creatorDetails.social_links.linkedin && (
                          <a href={creatorDetails.social_links.linkedin} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" className="w-full justify-start hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors">
                              <Linkedin className="w-4 h-4 mr-2 text-blue-700" />
                              LinkedIn
                            </Button>
                          </a>
                        )}
                        {creatorDetails.social_links.twitter && (
                          <a href={creatorDetails.social_links.twitter} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" className="w-full justify-start hover:bg-sky-50 dark:hover:bg-sky-950 transition-colors">
                              <Twitter className="w-4 h-4 mr-2 text-sky-500" />
                              Twitter (X)
                            </Button>
                          </a>
                        )}
                        {creatorDetails.social_links.tiktok && (
                          <a href={creatorDetails.social_links.tiktok} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" className="w-full justify-start hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                              <MessageCircle className="w-4 h-4 mr-2" />
                              TikTok
                            </Button>
                          </a>
                        )}
                        {creatorDetails.social_links.website && (
                          <a href={creatorDetails.social_links.website} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" className="w-full justify-start hover:bg-purple-50 dark:hover:bg-purple-950 transition-colors">
                              <Globe className="w-4 h-4 mr-2 text-purple-600" />
                              Website
                            </Button>
                          </a>
                        )}
                        {creatorDetails.social_links.other && (
                          <a href={creatorDetails.social_links.other} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" className="w-full justify-start transition-colors">
                              <LinkIcon className="w-4 h-4 mr-2" />
                              Other Link
                            </Button>
                          </a>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        No social links available
                      </p>
                    )}
                  </Card>
                </div>
              </div>
            </div>
          </Tabs>
        </div>
      </main>

      {/* Payment Gateway Selector Modal */}
      {pendingPayment && (
        <PaymentGatewaySelector
          open={showGatewaySelector}
          onClose={() => {
            setShowGatewaySelector(false)
            setPendingPayment(null)
          }}
          onSelectGateway={handleGatewaySelection}
          amount={pendingPayment.amount}
          tierLevel={pendingPayment.tierLevel}
        />
      )}
    </div>
  )
}