'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Header } from '@/components/header'
import { useAuth } from '@/contexts/supabase-auth-context'
import { useCreatorDetails, useSubscription } from '@/hooks/useCreatorDetails'
import { useFollow } from '@/hooks/useSocial'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  
  const { followCreator, unfollowCreator, isFollowing } = useFollow()
  const { subscribe, unsubscribe, hasActiveSubscription } = useSubscription()
  
  const [activeTab, setActiveTab] = useState('posts')
  const [paymentAmount, setPaymentAmount] = useState('1000')
  const [customAmount, setCustomAmount] = useState('')
  const [supporterMessage, setSupporterMessage] = useState('')
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)

  // Handle follow/unfollow
  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await unfollowCreator(creatorId)
      } else {
        await followCreator(creatorId)
      }
      refreshCreatorDetails()
    } catch (error) {
      alert('Failed to update follow status')
    }
  }

  // Handle one-time payment - Following Medium article exactly
  const handlePayment = async () => {
    if (!user) {
      router.push('/login')
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
      router.push('/login')
      return
    }

    try {
      if (hasActiveSubscription) {
        await unsubscribe(creatorId)
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
        <div className="container mx-auto px-4 py-8">
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
        <div className="container mx-auto px-4 py-8">
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
      
      <div className="container mx-auto px-4 py-8">
        {/* Creator Header - Following same pattern as dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Card className="p-8">
            <div className="flex flex-col lg:flex-row items-start space-y-6 lg:space-y-0 lg:space-x-8">
              {/* Creator Avatar & Basic Info */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="w-32 h-32 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center overflow-hidden">
                    {creatorDetails.avatar_url ? (
                      <Image 
                        src={creatorDetails.avatar_url} 
                        alt={creatorDetails.display_name} 
                        width={128} 
                        height={128}
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-4xl font-bold text-white">
                        {creatorDetails.display_name?.[0]?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  {creatorDetails.verified && (
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Creator Details */}
              <div className="flex-grow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {creatorDetails.display_name || 'Creator'}
                    </h1>
                    {creatorDetails.category && (
                      <Badge variant="outline" className="mb-3">
                        {getCategoryIcon(creatorDetails.category)}
                        <span className="ml-2">{creatorDetails.category}</span>
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Button
                      onClick={handleFollow}
                      variant={isFollowing ? "outline" : "default"}
                      className={isFollowing ? "" : "bg-red-500 hover:bg-red-600"}
                    >
                      <Heart className={`w-4 h-4 mr-2 ${isFollowing ? 'fill-current' : ''}`} />
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                    
                    <Button variant="outline" size="icon">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Bio */}
                {creatorDetails.bio && (
                  <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-2xl">
                    {creatorDetails.bio}
                  </p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {creatorDetails.follower_count || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {creatorDetails.post_count || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {subscriptionTiers?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Tiers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {creatorDetails.join_date ? new Date(creatorDetails.join_date).getFullYear() : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Joined</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Main Content - Following dashboard pattern */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="posts">Posts</TabsTrigger>
                <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
                <TabsTrigger value="about">About</TabsTrigger>
              </TabsList>

              {/* Posts Tab */}
              <TabsContent value="posts" className="space-y-6">
                {recentPosts.length > 0 ? recentPosts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Card className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center">
                            {post.type === 'image' && <Camera className="w-5 h-5 text-white" />}
                            {post.type === 'audio' && <Music className="w-5 h-5 text-white" />}
                            {post.type === 'text' && <FileText className="w-5 h-5 text-white" />}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{post.title || 'Untitled Post'}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{formatPostDate(post.createdAt)}</p>
                          </div>
                        </div>
                        {!post.isPublic && (
                          <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-800">
                            <Crown className="w-3 h-3 mr-1" />
                            Supporters Only
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-gray-700 dark:text-gray-300 mb-4">{post.content}</p>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-2">
                            <Heart className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{post.likes}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MessageCircle className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{post.comments}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Eye className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{post.views}</span>
                          </div>
                        </div>
                        
                        {!post.isPublic && !hasActiveSubscription && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setActiveTab('subscriptions')}
                          >
                            Subscribe to View
                          </Button>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                )) : (
                  <Card className="p-8 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      No Posts Yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      This creator hasn't posted anything yet.
                    </p>
                  </Card>
                )}
              </TabsContent>

              {/* Subscriptions Tab */}
              <TabsContent value="subscriptions" className="space-y-6">
                {hasActiveSubscription && (
                  <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
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
                        <Card className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                {tier.tier_name}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-400 mb-4">
                                {tier.description}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                NPR {tier.price}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">per month</div>
                            </div>
                          </div>

                          {tier.benefits && (
                            <div className="mb-6">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Benefits</h4>
                              <ul className="space-y-2">
                                {tier.benefits.split(',').map((benefit, index) => (
                                  <li key={index} className="flex items-center space-x-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span className="text-gray-700 dark:text-gray-300">{benefit.trim()}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {tier.subscriber_count || 0} supporters
                            </div>
                            <Button 
                              className="bg-red-500 hover:bg-red-600"
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
                  <Card className="p-8 text-center">
                    <Crown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      No Subscription Tiers Available
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      This creator hasn't set up subscription tiers yet.
                    </p>
                  </Card>
                )}
              </TabsContent>

              {/* About Tab */}
              <TabsContent value="about" className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">About</h3>
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
                      
                      {creatorDetails.join_date && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Joined</h4>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {new Date(creatorDetails.join_date).toLocaleDateString('en-US', {
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
          <div className="space-y-6">
            {/* One-time Support Card */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
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
                  >
                    {option.icon}
                    <span className="ml-2">{option.label}</span>
                  </Button>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="mb-4">
                <Label htmlFor="custom-amount" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Custom Amount (NPR)
                </Label>
                <Input
                  id="custom-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Support Message */}
              <div className="mb-6">
                <Label htmlFor="support-message" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Message (Optional)
                </Label>
                <Textarea
                  id="support-message"
                  placeholder="Say something nice..."
                  value={supporterMessage}
                  onChange={(e) => setSupporterMessage(e.target.value)}
                  className="mt-1"
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
                    Pay with eSewa
                  </>
                )}
              </Button>
              
              <p className="text-xs text-gray-500 text-center mt-2">
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
                        {method.type === 'esewa' && <Smartphone className="w-5 h-5 text-green-600" />}
                        {method.type === 'khalti' && <Smartphone className="w-5 h-5 text-purple-600" />}
                        {(method.type === 'bank_transfer' || method.type === 'bank') && <Building2 className="w-5 h-5 text-blue-600" />}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {method.type === 'esewa' && 'eSewa'}
                            {method.type === 'khalti' && 'Khalti'}
                            {(method.type === 'bank_transfer' || method.type === 'bank') && 'Bank Transfer'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{method.details}</p>
                        </div>
                      </div>
                      
                      {method.qr_code && (
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
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">Followers</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {creatorDetails.follower_count || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">Posts</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {creatorDetails.post_count || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Crown className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">Subscription Tiers</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {subscriptionTiers?.length || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">Member Since</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {creatorDetails.join_date ? new Date(creatorDetails.join_date).getFullYear() : 'N/A'}
                  </span>
                </div>
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