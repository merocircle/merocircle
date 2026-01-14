'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { SidebarNav } from '@/components/sidebar-nav'
import { useAuth } from '@/contexts/supabase-auth-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EnhancedPostCard } from '@/components/posts/EnhancedPostCard'
import { LoadingSpinner } from '@/components/dashboard/LoadingSpinner'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { 
  Rss,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Compass
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeedData {
  feedPosts: Array<any>
  trendingPosts: Array<any>
  stats: {
    totalSupported: number
    creatorsSupported: number
    thisMonth: number
  }
  hasSupportedCreators: boolean
}

export default function FeedPage() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('feed')
  const [feedData, setFeedData] = useState<FeedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    const fetchFeed = async () => {
      if (!isAuthenticated || !user) return
      
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/dashboard/feed')
        if (!response.ok) {
          throw new Error('Failed to fetch feed')
        }
        
        const data = await response.json()
        setFeedData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load feed')
        console.error('Feed error:', err)
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated && user) {
      fetchFeed()
    }
  }, [isAuthenticated, user])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
        <SidebarNav />
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </main>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
        <SidebarNav />
        <main className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <SidebarNav />
      
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Rss className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Your Feed
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Posts from creators you support
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-1">
              <TabsTrigger value="feed" className="gap-2">
                <Rss className="w-4 h-4" />
                From Your Support
              </TabsTrigger>
              <TabsTrigger value="trending" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Trending
              </TabsTrigger>
            </TabsList>

            {/* Feed Tab - Posts from supported creators */}
            <TabsContent value="feed" className="space-y-6 mt-6">
              {feedData?.feedPosts && feedData.feedPosts.length > 0 ? (
                feedData.feedPosts.map((post: any) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <EnhancedPostCard 
                      post={post}
                      currentUserId={user?.id}
                      showActions={true}
                    />
                  </motion.div>
                ))
              ) : (
                <Card className="p-12 text-center">
                  <Rss className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No posts yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {feedData?.hasSupportedCreators 
                      ? 'The creators you support haven\'t posted anything yet.'
                      : 'Start supporting creators to see their posts in your feed!'
                    }
                  </p>
                  {!feedData?.hasSupportedCreators && (
                    <Link href="/explore">
                      <Button>
                        <Compass className="w-4 h-4 mr-2" />
                        Explore Creators
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  )}
                </Card>
              )}
            </TabsContent>

            {/* Trending Tab */}
            <TabsContent value="trending" className="space-y-6 mt-6">
              {feedData?.trendingPosts && feedData.trendingPosts.length > 0 ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Trending Posts
                    </h2>
                  </div>
                  {feedData.trendingPosts.map((post: any) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <EnhancedPostCard 
                        post={post}
                        currentUserId={user?.id}
                        showActions={true}
                      />
                    </motion.div>
                  ))}
                </>
              ) : (
                <Card className="p-12 text-center">
                  <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No trending posts
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Check back later for trending content
                  </p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
