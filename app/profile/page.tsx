'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/header'
import { useAuth } from '@/contexts/supabase-auth-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings,
  Heart,
  Users,
  FileText,
  Calendar,
  Crown,
  ArrowLeft,
  Share2,
  Camera,
  Mail,
  CheckCircle,
  DollarSign,
  MessageCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils';
import { StatsCard } from '@/components/dashboard/StatsCard';
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

export default function ProfilePage() {
  const router = useRouter()
  const { user, userProfile, creatorProfile, isAuthenticated, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [posts, setPosts] = useState<Array<{
    id: string;
    title: string;
    content: string;
    image_url?: string | null;
    created_at: string;
    likes_count?: number;
    comments_count?: number;
  }>>([])
  const [postsLoading, setPostsLoading] = useState(true)

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth')
    }
  }, [loading, isAuthenticated, router])

  // Fetch user's posts
  useEffect(() => {
    const fetchPosts = async () => {
      if (user && isAuthenticated) {
        try {
          const { data, error } = await supabase
            .from('posts')
            .select(`
              *,
              post_likes(id)
            `)
            .eq('creator_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20)

          if (!error && data) {
            setPosts(data.map((post: {
              id: string;
              title: string;
              content: string;
              image_url: string | null;
              created_at: string;
            }) => ({
              id: post.id,
              title: post.title,
              content: post.content,
              image_url: post.image_url,
              type: post.image_url ? 'image' : 'text',
              likes: post.post_likes?.length || 0,
              createdAt: post.created_at,
              isPublic: post.is_public
            })))
          }
        } catch (error) {
          console.error('Failed to fetch posts:', error)
        } finally {
          setPostsLoading(false)
        }
      }
    }

    fetchPosts()
  }, [user, isAuthenticated])

  if (loading) {
    return (
      <div className={cn('min-h-screen', colors.bg.page)}>
        <Header />
        <div className={common.pageContainer}>
          <div className={cn(layout.flexCenter, 'h-64')}>
            <div className={cn('animate-spin rounded-full h-12 w-12 border-b-2 border-red-500')}></div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !userProfile) {
    return null
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Card className="p-8">
            <div className="flex flex-col lg:flex-row items-start space-y-6 lg:space-y-0 lg:space-x-8">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                    {userProfile.photo_url ? (
                      <Image 
                        src={userProfile.photo_url} 
                        alt={userProfile.display_name} 
                        width={128} 
                        height={128}
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-4xl font-bold text-white">
                        {userProfile.display_name?.[0]?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  {creatorProfile?.is_verified && (
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-grow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {userProfile.display_name || 'User'}
                      </h1>
                      {creatorProfile && (
                        <Badge variant="outline" className="bg-red-50 border-red-200 text-red-800">
                          <Crown className="w-3 h-3 mr-1" />
                          Creator
                        </Badge>
                      )}
                    </div>
                    {userProfile.email && (
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mb-2">
                        <Mail className="w-4 h-4" />
                        <span>{userProfile.email}</span>
                      </div>
                    )}
                    {creatorProfile?.category && (
                      <Badge variant="outline" className="mt-2">
                        {creatorProfile.category}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                    <Link href="/dashboard/creator">
                      <Button variant="outline">
                        <Settings className="w-4 h-4 mr-2" />
                        {creatorProfile ? 'Creator Dashboard' : 'Become Creator'}
                      </Button>
                    </Link>
                    <Button variant="outline" size="icon">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Bio */}
                {creatorProfile?.bio && (
                  <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-2xl">
                    {creatorProfile.bio}
                  </p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {creatorProfile && (
                    <>
                      <StatsCard
                        label="Followers"
                        value={creatorProfile.followers_count || 0}
                        icon={Users}
                        iconColor="text-blue-600"
                        useBauhaus={true}
                        accentColor="#3b82f6"
                      />
                      <StatsCard
                        label="Posts"
                        value={creatorProfile.posts_count || 0}
                        icon={FileText}
                        iconColor="text-purple-600"
                        useBauhaus={true}
                        accentColor="#8b5cf6"
                      />
                      <StatsCard
                        label="Supporters"
                        value={creatorProfile.supporters_count || 0}
                        icon={Heart}
                        iconColor="text-red-500"
                        useBauhaus={true}
                        accentColor="#ef4444"
                      />
                      <StatsCard
                        label="Earnings"
                        value={(creatorProfile.total_earnings || 0).toLocaleString()}
                        icon={DollarSign}
                        iconColor="text-green-600"
                        prefix="NPR"
                        useBauhaus={true}
                        accentColor="#10b981"
                      />
                    </>
                  )}
                  {!creatorProfile && (
                    <>
                      <StatsCard
                        label="Posts"
                        value={posts.length}
                        icon={FileText}
                        iconColor="text-purple-600"
                        useBauhaus={true}
                        accentColor="#8b5cf6"
                      />
                      <StatsCard
                        label="Joined"
                        value={formatDate(userProfile.created_at)}
                        icon={Calendar}
                        iconColor="text-blue-600"
                        useBauhaus={true}
                        accentColor="#3b82f6"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="posts">Posts</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">About</h3>
                  <div className="space-y-4">
                    {creatorProfile?.bio ? (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Bio</h4>
                        <p className="text-gray-700 dark:text-gray-300">{creatorProfile.bio}</p>
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">No bio added yet.</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {creatorProfile?.category && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Category</h4>
                          <Badge variant="outline">{creatorProfile.category}</Badge>
                        </div>
                      )}
                      
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Joined</h4>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700 dark:text-gray-300">
                            {formatDate(userProfile.created_at)}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Role</h4>
                        <Badge variant={userProfile.role === 'creator' ? 'default' : 'outline'}>
                          {userProfile.role === 'creator' ? (
                            <>
                              <Crown className="w-3 h-3 mr-1" />
                              Creator
                            </>
                          ) : (
                            'Supporter'
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>

                {creatorProfile && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Creator Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          NPR {(creatorProfile.total_earnings || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Supporters</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {creatorProfile.supporters_count || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Followers</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {creatorProfile.followers_count || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Posts</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {creatorProfile.posts_count || 0}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </TabsContent>

              {/* Posts Tab */}
              <TabsContent value="posts" className="space-y-6">
                {postsLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                  </div>
                ) : posts.length > 0 ? (
                  posts.map((post) => (
                    <Card key={post.id} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            {post.type === 'image' && <Camera className="w-5 h-5 text-white" />}
                            {post.type === 'text' && <FileText className="w-5 h-5 text-white" />}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                              {post.title || 'Untitled Post'}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {formatPostDate(post.createdAt)}
                            </p>
                          </div>
                        </div>
                        <Badge variant={post.isPublic ? "default" : "secondary"}>
                          {post.isPublic ? "Public" : "Supporters Only"}
                        </Badge>
                      </div>
                      
                      {post.content && (
                        <p className="text-gray-700 dark:text-gray-300 mb-4">{post.content}</p>
                      )}
                      
                      {post.image_url && (
                        <div className="mb-4 rounded-lg overflow-hidden bg-gray-100">
                          <Image
                            src={post.image_url}
                            alt="Post image"
                            width={600}
                            height={400}
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-2">
                          <Heart className="w-4 h-4" />
                          <span>{post.likes} likes</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MessageCircle className="w-4 h-4" />
                          <span>Comments</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Eye className="w-4 h-4" />
                          <span>Views</span>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="p-8 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      No Posts Yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {creatorProfile 
                        ? 'Start creating content to share with your supporters!'
                        : 'Become a creator to start posting content!'
                      }
                    </p>
                    {creatorProfile ? (
                      <Link href="/dashboard/creator">
                        <Button>
                          <FileText className="w-4 h-4 mr-2" />
                          Create Post
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/dashboard/creator">
                        <Button>
                          <Crown className="w-4 h-4 mr-2" />
                          Become Creator
                        </Button>
                      </Link>
                    )}
                  </Card>
                )}
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {posts.length > 0 ? (
                      posts.slice(0, 5).map((post) => (
                        <div key={post.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                              Posted: {post.title || 'Untitled Post'}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {formatPostDate(post.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                        No activity yet
                      </p>
                    )}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                {creatorProfile ? (
                  <>
                    <Link href="/dashboard/creator">
                      <Button variant="outline" className="w-full justify-start">
                        <Crown className="w-4 h-4 mr-2" />
                        Creator Dashboard
                      </Button>
                    </Link>
                    <Link href="/dashboard/creator?tab=posts">
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="w-4 h-4 mr-2" />
                        Create Post
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Link href="/dashboard/creator">
                    <Button className="w-full bg-gradient-to-r from-red-500 to-pink-600">
                      <Crown className="w-4 h-4 mr-2" />
                      Become a Creator
                    </Button>
                  </Link>
                )}
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full justify-start">
                    <Heart className="w-4 h-4 mr-2" />
                    Main Dashboard
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
            </Card>

            {/* Profile Info */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Profile Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {userProfile.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Display Name</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {userProfile.display_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Role</p>
                  <Badge variant={userProfile.role === 'creator' ? 'default' : 'outline'}>
                    {userProfile.role === 'creator' ? (
                      <>
                        <Crown className="w-3 h-3 mr-1" />
                        Creator
                      </>
                    ) : (
                      'Supporter'
                    )}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Member Since</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {formatDate(userProfile.created_at)}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

