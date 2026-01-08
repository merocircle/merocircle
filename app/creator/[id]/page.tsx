'use client'

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Header } from '@/components/header'
import { useAuth } from '@/contexts/supabase-auth-context'
import { useCreatorDetails, useSubscription } from '@/hooks/useCreatorDetails'
import { useFollow } from '@/hooks/useSocial'
import DynamicPostCard from '@/components/posts/DynamicPostCard'
import { EnhancedPostCard } from '@/components/posts/EnhancedPostCard'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { BauhausCard } from '@/components/ui/bauhaus-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils';
import { 
  common, 
  spacing, 
  typography, 
  layout, 
  responsive, 
  colors, 
  effects, 
  animations 
} from '@/lib/tailwind-utils';
import { 
  Heart, 
  Users, 
  FileText, 
  Calendar, 
  Star, 
  Shield, 
  CreditCard,
  Smartphone,
  Building2,
  QrCode,
  CheckCircle,
  Crown,
  ArrowLeft,
  Share2,
  Gift,
  DollarSign,
  Eye,
  MessageCircle,
  TrendingUp,
  Clock,
  ExternalLink,
  Coins,
  Play,
  Pause,
  ArrowRight,
  Plus,
  Camera,
  Music,
  Palette,
  MapPin,
  Link as LinkIcon,
  Settings,
  BarChart3,
  Filter,
  MoreHorizontal,
  Edit3,
  Upload,
  Phone,
  Sparkles
} from 'lucide-react'

export default function CreatorProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user, userProfile } = useAuth()
  const creatorId = params.id as string
  
  const { 
    creatorDetails, 
    paymentMethods, 
    subscriptionTiers,
    posts: recentPosts,
    loading, 
    error,
    refreshCreatorDetails 
  } = useCreatorDetails(creatorId)
  
  const { followCreator, unfollowCreator, loading: followLoading } = useFollow();
  const { subscribe, unsubscribe, loading: subscriptionLoading } = useSubscription();
  
  const [isFollowing, setIsFollowing] = useState(creatorDetails?.isFollowing || false);
  const hasActiveSubscription = creatorDetails?.current_subscription !== null;
  
  const [activeTab, setActiveTab] = useState('posts');
  const [paymentAmount, setPaymentAmount] = useState('1000');
  const [customAmount, setCustomAmount] = useState('');
  const [supporterMessage, setSupporterMessage] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    if (creatorDetails?.isFollowing !== undefined) {
      setIsFollowing(creatorDetails.isFollowing);
    }
  }, [creatorDetails?.isFollowing]);

  const handleFollow = async () => {
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    
    try {
      if (wasFollowing) {
        await unfollowCreator(creatorId);
      } else {
        await followCreator(creatorId);
      }
      await refreshCreatorDetails();
    } catch (error) {
      setIsFollowing(wasFollowing);
      alert('Failed to update follow status');
    }
  };

  // Handle one-time payment - Following Medium article exactly
  const handlePayment = async () => {
    if (!user) {
      router.push('/auth')
      return
    }

    setPaymentLoading(true)
    try {
      const amount = customAmount || paymentAmount
      
      console.log('[PAYMENT] Initiating payment:', {
        amount,
        creatorId,
        supporterId: user.id,
      })
      
      // Call payment initiation API (following Medium article)
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
      
      console.log('[PAYMENT] API response:', result)
      
      // TEST MODE: Redirect directly to success page
      if (result.test_mode && result.redirect_url) {
        console.log('[PAYMENT] TEST MODE: Redirecting to success')
        window.location.href = result.redirect_url
        return
      }
      
      // PRODUCTION MODE: Submit to eSewa
      if (result.success && result.esewaConfig) {
        console.log('[PAYMENT] eSewa config:', result.esewaConfig)
        
        // Create form and submit to eSewa
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = result.payment_url
        
        // Add all form fields from esewaConfig
        Object.entries(result.esewaConfig).forEach(([key, value]) => {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = key
          input.value = String(value)
          form.appendChild(input)
        })
        
        console.log('[PAYMENT] Submitting to eSewa:', result.payment_url)
        document.body.appendChild(form)
        form.submit()
      } else {
        throw new Error(result.error || 'Invalid payment response')
      }
    } catch (error) {
      console.error('[PAYMENT] Error:', error)
      alert(error instanceof Error ? error.message : 'Payment failed. Please try again.')
    } finally {
      setPaymentLoading(false)
    }
  }

  // Handle subscription
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
    } catch (error) {
      alert('Subscription failed. Please try again.')
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'music': return <Music className="w-5 h-5" />
      case 'art': return <Palette className="w-5 h-5" />
      case 'photography': return <Camera className="w-5 h-5" />
      case 'video': return <Play className="w-5 h-5" />
      default: return <Star className="w-5 h-5" />
    }
  }

  const paymentOptions = [
    { amount: '100', label: 'NPR 100', icon: <Coins className="w-4 h-4" /> },
    { amount: '500', label: 'NPR 500', icon: <Gift className="w-4 h-4" /> },
    { amount: '1000', label: 'NPR 1,000', icon: <Heart className="w-4 h-4" /> },
    { amount: '2500', label: 'NPR 2,500', icon: <Star className="w-4 h-4" /> },
  ]

  // Format post dates
  const formatPostDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !creatorDetails) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Creator Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">The creator you're looking for doesn't exist.</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      
      <div className={common.pageContainer}>
        <motion.div
          {...animations.fadeIn}
          className="mb-4 sm:mb-6 md:mb-8"
        >
          <Card className={cn('p-4 sm:p-6 md:p-8')}>
            <div className={cn('flex flex-col lg:flex-row items-start space-y-4 sm:space-y-6 lg:space-y-0 lg:space-x-8')}>
              <div className="flex-shrink-0 w-full lg:w-auto flex justify-center lg:justify-start">
                <div className="relative">
                  <div className={cn(responsive.avatarLarge, effects.gradient.red, effects.rounded.full, layout.flexCenter, 'overflow-hidden')}>
                    {creatorDetails.avatar_url ? (
                      <Image 
                        src={creatorDetails.avatar_url} 
                        alt={creatorDetails.display_name} 
                        width={128} 
                        height={128}
                        className="object-cover"
                      />
                    ) : (
                      <span className={cn('text-3xl sm:text-4xl font-bold text-white')}>
                        {creatorDetails.display_name?.[0]?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  {creatorDetails.is_verified && (
                    <div className={cn('absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2', responsive.avatarSmall, 'bg-blue-500', effects.rounded.full, layout.flexCenter, 'border-2 border-white dark:border-gray-950')}>
                      <CheckCircle className={cn(responsive.icon, 'text-white')} />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-grow">
                <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4')}>
                  <div>
                    <h1 className={cn(typography.h1, 'mb-2')}>
                      {creatorDetails.display_name || 'Creator'}
                    </h1>
                    {creatorDetails.category && (
                      <Badge variant="outline" className="mb-3">
                        {getCategoryIcon(creatorDetails.category)}
                        <span className="ml-2">{creatorDetails.category}</span>
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
                    <Button
                      onClick={handleFollow}
                      variant={isFollowing ? "outline" : "default"}
                      size="sm"
                      className={`flex-1 sm:flex-initial ${isFollowing ? "" : "bg-red-500 hover:bg-red-600"}`}
                      disabled={followLoading[creatorId] || false}
                    >
                      {followLoading[creatorId] ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                          {isFollowing ? 'Unfollowing...' : 'Following...'}
                        </>
                      ) : (
                        <>
                          <Heart className={`w-4 h-4 mr-2 ${isFollowing ? 'fill-current' : ''}`} />
                          {isFollowing ? 'Following' : 'Follow'}
                        </>
                      )}
                    </Button>
                    
                    <Button variant="outline" size="icon">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {creatorDetails.bio && (
                  <p className={cn(typography.body, colors.text.secondary, 'mb-4 max-w-2xl')}>
                    {creatorDetails.bio}
                  </p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  <StatsCard
                    label="Followers"
                    value={creatorDetails.follower_count || 0}
                    icon={Users}
                    iconColor="text-blue-600"
                    useBauhaus={true}
                    accentColor="#3b82f6"
                  />
                  <StatsCard
                    label="Posts"
                    value={creatorDetails.posts_count || 0}
                    icon={FileText}
                    iconColor="text-purple-600"
                    useBauhaus={true}
                    accentColor="#8b5cf6"
                  />
                  <StatsCard
                    label="Tiers"
                    value={subscriptionTiers?.length || 0}
                    icon={Crown}
                    iconColor="text-yellow-600"
                    useBauhaus={true}
                    accentColor="#f59e0b"
                  />
                  <StatsCard
                    label="Joined"
                    value={creatorDetails.created_at ? new Date(creatorDetails.created_at).getFullYear() : 'N/A'}
                    icon={Calendar}
                    iconColor="text-green-600"
                    useBauhaus={true}
                    accentColor="#10b981"
                  />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Main Content - Following dashboard pattern */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className={responsive.tabList}>
                <TabsTrigger value="posts" className={responsive.tab}>Posts</TabsTrigger>
                <TabsTrigger value="subscriptions" className={responsive.tab}>Subscriptions</TabsTrigger>
                <TabsTrigger value="about" className={responsive.tab}>About</TabsTrigger>
              </TabsList>

              {/* Posts Tab */}
              <TabsContent value="posts" className="space-y-4 sm:space-y-6">
                {recentPosts.length > 0 ? recentPosts.map((post: any) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <EnhancedPostCard 
                      post={{
                        id: post.id,
                        title: post.title,
                        content: post.content,
                        image_url: post.image_url,
                        media_url: post.media_url,
                        tier_required: post.tier_required || 'free',
                        created_at: post.created_at || post.createdAt,
                        creator: post.creator || {
                          id: creatorId,
                          display_name: creatorDetails?.display_name || 'Unknown',
                          photo_url: creatorDetails?.avatar_url,
                          role: 'creator'
                        },
                        creator_profile: post.creator_profile || {
                          category: creatorDetails?.category || null,
                          is_verified: creatorDetails?.is_verified || false
                        },
                        likes_count: post.likes_count || post.likes?.length || 0,
                        comments_count: post.comments_count || post.comments?.length || 0
                      }}
                      currentUserId={user?.id}
                      showActions={true}
                    />
                  </motion.div>
                )) : (
                  <Card className="p-6 sm:p-8 text-center">
                    <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      No Posts Yet
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                      This creator hasn't posted anything yet.
                    </p>
                  </Card>
                )}
              </TabsContent>

              {/* Subscriptions Tab */}
              <TabsContent value="subscriptions" className="space-y-4 sm:space-y-6">
                {hasActiveSubscription && (
                  <Card className="p-4 sm:p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <Crown className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Active Subscription</h3>
                        <p className="text-green-600 dark:text-green-400">You're supporting this creator</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Current Plan</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">Premium Supporter</p>
                      </div>
                      <Button variant="outline" onClick={() => handleSubscription('')}>
                        Manage Subscription
                      </Button>
                    </div>
                  </Card>
                )}

                {subscriptionTiers && subscriptionTiers.length > 0 ? (
                  <div className="grid gap-6">
                    {subscriptionTiers.map((tier) => (
                      <motion.div
                        key={tier.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                      >
                        <Card className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0 mb-3 sm:mb-4">
                            <div>
                              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                {tier.tier_name}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-400 mb-4">
                                {tier.description}
                              </p>
                            </div>
                            <div className="text-right sm:text-left sm:mt-0 mt-2">
                              <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                                NPR {tier.price}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">per month</div>
                            </div>
                          </div>

                          {tier.benefits && (
                            <div className="mb-4 sm:mb-6">
                              <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">Benefits</h4>
                              <ul className="space-y-2">
                                {(Array.isArray(tier.benefits) ? tier.benefits : tier.benefits ? [tier.benefits] : []).map((benefit: string, index: number) => (
                                  <li key={index} className="flex items-center space-x-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span className="text-gray-700 dark:text-gray-300">{benefit.trim()}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              {tier.current_subscribers || 0} supporters
                            </div>
                            <Button 
                              size="sm"
                              className="bg-red-500 hover:bg-red-600 text-xs sm:text-sm w-full sm:w-auto"
                              onClick={() => handleSubscription(tier.id)}
                              disabled={paymentLoading}
                            >
                              {hasActiveSubscription ? 'Switch Plan' : 'Subscribe Now'}
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <Card className="p-6 sm:p-8 text-center">
                    <Crown className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      No Subscription Tiers Available
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                      This creator hasn't set up subscription tiers yet.
                    </p>
                  </Card>
                )}
              </TabsContent>

              {/* About Tab */}
              <TabsContent value="about" className="space-y-4 sm:space-y-6">
                <Card className="p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">About</h3>
                  <div className="space-y-4">
                    {creatorDetails.bio && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Bio</h4>
                        <p className="text-gray-700 dark:text-gray-300">{creatorDetails.bio}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {creatorDetails.category && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Category</h4>
                          <div className="flex items-center space-x-2">
                            {getCategoryIcon(creatorDetails.category)}
                            <span className="text-gray-700 dark:text-gray-300">{creatorDetails.category}</span>
                          </div>
                        </div>
                      )}
                      
                      {creatorDetails.created_at && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Joined</h4>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {new Date(creatorDetails.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Payment & Support */}
          <div className="space-y-4 sm:space-y-6">
            {/* Support Card with integrated inputs */}
            <Card className="p-4 sm:p-6 overflow-hidden border-2 border-border">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
                Support {creatorDetails.display_name}
              </h3>
              
              {/* Quick Amount Selection */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {paymentOptions.map((option) => (
                  <Button
                    key={option.amount}
                    variant={paymentAmount === option.amount ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPaymentAmount(option.amount)}
                    className="text-xs"
                  >
                    {option.icon}
                    <span className="ml-2">{option.label}</span>
                  </Button>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="mb-4">
                <Label htmlFor="custom-amount" className="text-xs sm:text-sm font-medium text-foreground mb-2 block">
                  Custom Amount (NPR)
                </Label>
                <Input
                  id="custom-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="text-sm sm:text-base"
                />
              </div>

              {/* Support Message */}
              <div className="mb-4">
                <Label htmlFor="support-message" className="text-xs sm:text-sm font-medium text-foreground mb-2 block">
                  Message (Optional)
                </Label>
                <Textarea
                  id="support-message"
                  placeholder="Say something nice..."
                  value={supporterMessage}
                  onChange={(e) => setSupporterMessage(e.target.value)}
                  className="text-sm sm:text-base"
                  rows={3}
                />
              </div>

              {/* Payment Button */}
              <Button 
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                onClick={handlePayment}
                disabled={paymentLoading}
              >
                {paymentLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay NPR {customAmount || paymentAmount || '1000'} with eSewa
                  </>
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center mt-2">
                Secure payment via eSewa
              </p>
            </Card>

            {/* Payment Methods */}
            {paymentMethods && paymentMethods.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Payment Methods
                </h3>
                
                <div className="space-y-4">
                  {paymentMethods.map((method, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {method.payment_type === 'esewa' && <Smartphone className="w-5 h-5 text-green-600" />}
                        {method.payment_type === 'khalti' && <Smartphone className="w-5 h-5 text-purple-600" />}
                        {method.payment_type === 'bank_transfer' && <Building2 className="w-5 h-5 text-blue-600" />}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {method.payment_type === 'esewa' && 'eSewa'}
                            {method.payment_type === 'khalti' && 'Khalti'}
                            {method.payment_type === 'bank_transfer' && 'Bank Transfer'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {method.payment_type === 'esewa' && method.details?.phone_number && `Phone: ${method.details.phone_number}`}
                            {method.payment_type === 'bank_transfer' && method.details?.account_number && `Account: ${method.details.account_number}`}
                          </p>
                        </div>
                      </div>
                      
                      {method.details?.qr_code_url && (
                        <Button size="sm" variant="outline">
                          <QrCode className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Creator Stats */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Creator Stats
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <StatsCard
                  label="Followers"
                  value={creatorDetails.follower_count || 0}
                  icon={Users}
                  iconColor="text-blue-600"
                  useBauhaus={true}
                  accentColor="#3b82f6"
                />
                <StatsCard
                  label="Posts"
                  value={creatorDetails.posts_count || 0}
                  icon={FileText}
                  iconColor="text-purple-600"
                  useBauhaus={true}
                  accentColor="#8b5cf6"
                />
                <StatsCard
                  label="Tiers"
                  value={subscriptionTiers?.length || 0}
                  icon={Crown}
                  iconColor="text-yellow-600"
                  useBauhaus={true}
                  accentColor="#f59e0b"
                />
                <StatsCard
                  label="Since"
                  value={creatorDetails.created_at ? new Date(creatorDetails.created_at).getFullYear() : 'N/A'}
                  icon={Calendar}
                  iconColor="text-green-600"
                  useBauhaus={true}
                  accentColor="#10b981"
                />
              </div>
            </Card>

            {/* Social Actions */}
            <Card className="p-6">
              <div className="space-y-3">
                <Button variant="outline" className="w-full">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Profile
                </Button>
                
                <Button variant="outline" className="w-full">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}