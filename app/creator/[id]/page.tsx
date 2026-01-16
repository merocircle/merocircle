'use client'

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion'
import Image from 'next/image'
import { SidebarNav } from '@/components/sidebar-nav'
import { useAuth } from '@/contexts/supabase-auth-context'
import { useCreatorDetails, useSubscription } from '@/hooks/useCreatorDetails'
import { EnhancedPostCard } from '@/components/posts/EnhancedPostCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils';
import { 
  Heart, 
  Users, 
  FileText, 
  Calendar, 
  Star, 
  CreditCard,
  CheckCircle,
  Crown,
  Share2,
  MessageCircle,
  Coins,
  Gift,
  MoreHorizontal,
  ShoppingBag,
  Info
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
  const [paymentAmount, setPaymentAmount] = useState('1000');
  const [customAmount, setCustomAmount] = useState('');
  const [supporterMessage, setSupporterMessage] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

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

  const handlePayment = async () => {
    if (!user) {
      router.push('/auth')
      return
    }

    setPaymentLoading(true)
    try {
      const amount = customAmount || paymentAmount
      
      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseInt(amount),
          creatorId,
          supporterId: user.id,
          supporterMessage,
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
    } finally {
      setPaymentLoading(false)
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

  const paymentOptions = [
    { amount: '100', label: 'NPR 100', icon: <Coins className="w-4 h-4" /> },
    { amount: '500', label: 'NPR 500', icon: <Gift className="w-4 h-4" /> },
    { amount: '1000', label: 'NPR 1,000', icon: <Heart className="w-4 h-4" /> },
    { amount: '2500', label: 'NPR 2,500', icon: <Star className="w-4 h-4" /> },
  ]

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
                  {/* Welcome Card */}
                  <Card className="p-6">
                    <h2 className="text-xl font-bold mb-4">
                      Welcome to {creatorDetails.display_name}&apos;s page
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Support {creatorDetails.display_name} and get access to exclusive content and benefits!
                    </p>
                  </Card>

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
                    </div>
                  </Card>
                </TabsContent>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Support Card */}
                <Card className="p-6 sticky top-4">
                  <h3 className="text-lg font-semibold mb-4">
                    Support {creatorDetails.display_name}
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Quick amounts */}
                    <div className="grid grid-cols-2 gap-2">
                      {paymentOptions.map((option) => (
                        <Button
                          key={option.amount}
                          variant={paymentAmount === option.amount ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPaymentAmount(option.amount)}
                          className="h-auto py-3 flex flex-col items-center gap-1"
                        >
                          {option.icon}
                          <span className="text-xs">{option.label}</span>
                        </Button>
                      ))}
                    </div>

                    {/* Custom amount */}
                    <div>
                      <Label htmlFor="custom-amount" className="text-sm mb-2 block">
                        Custom Amount (NPR)
                      </Label>
                      <Input
                        id="custom-amount"
                        type="number"
                        placeholder="Enter amount"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <Label htmlFor="message" className="text-sm mb-2 block">
                        Message (Optional)
                      </Label>
                      <Textarea
                        id="message"
                        placeholder="Say something nice..."
                        value={supporterMessage}
                        onChange={(e) => setSupporterMessage(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <Button 
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                      onClick={handlePayment}
                      disabled={paymentLoading}
                      size="lg"
                    >
                      {paymentLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Pay NPR {customAmount || paymentAmount}
                        </>
                      )}
                    </Button>
                    
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                      Secure payment via eSewa
                    </p>
                  </div>
                </Card>

                {/* Membership Tiers */}
                {subscriptionTiers && subscriptionTiers.length > 0 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Crown className="w-5 h-5 text-yellow-500" />
                      Membership Tiers
                    </h3>
                    
                    <div className="space-y-3">
                      {subscriptionTiers.map((tier) => (
                        <div 
                          key={tier.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-red-500 transition-colors cursor-pointer"
                          onClick={() => handleSubscription(tier.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{tier.tier_name}</h4>
                            <span className="text-lg font-bold text-red-500">
                              NPR {tier.price}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {tier.description}
                          </p>
                          {tier.benefits && (
                            <ul className="space-y-1">
                              {(Array.isArray(tier.benefits) ? tier.benefits : [tier.benefits]).slice(0, 2).map((benefit: string, index: number) => (
                                <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                                  <span className="truncate">{benefit.trim()}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Social Links */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Connect</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Profile
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  )
}