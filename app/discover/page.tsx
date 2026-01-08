'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Header } from '@/components/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/supabase-auth-context'
import { useDiscoveryFeed } from '@/hooks/useSocial'
import CreatorCard from '@/components/social/CreatorCard'
import PostCard from '@/components/social/PostCard'
import CreatorSearch from '@/components/social/CreatorSearch'
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
  Search, 
  TrendingUp, 
  Users, 
  Sparkles,
  Filter,
  Grid,
  List,
  Compass
} from 'lucide-react'

export default function DiscoverPage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { feed, loading, error, refetch } = useDiscoveryFeed()
  const [activeTab, setActiveTab] = useState('trending')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  if (authLoading) {
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

  return (
    <div className={cn('min-h-screen', colors.bg.page)}>
      <Header />
      
      <div className={common.pageContainer}>
        <motion.div
          {...animations.fadeIn}
          className="mb-8"
        >
          <div className={cn(layout.flexBetween, 'mb-6')}>
            <div className={cn(layout.flexRow, 'space-x-4')}>
              <div className={cn(responsive.avatar, effects.gradient.red, effects.rounded.full, layout.flexCenter)}>
                <Compass className={cn(responsive.iconLarge, 'text-white')} />
              </div>
              <div>
                <h1 className={cn(typography.h1, 'text-3xl')}>
                  Discover Creators
                </h1>
                <p className={typography.body}>
                  Find amazing creators and support their work
                </p>
              </div>
            </div>
            
            <div className={cn(layout.flexRow, 'space-x-3')}>
              <Button 
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className={responsive.icon} />
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className={responsive.icon} />
              </Button>
            </div>
          </div>

          <Card className={spacing.card}>
            <CreatorSearch placeholder="Search for creators by name, category, or tags..." />
          </Card>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className={common.tabsContainer}>
          <TabsList className={cn('grid w-full grid-cols-3')}>
            <TabsTrigger value="trending">
              <TrendingUp className="w-4 h-4 mr-2" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="creators">
              <Users className="w-4 h-4 mr-2" />
              All Creators
            </TabsTrigger>
            <TabsTrigger value="posts">
              <Sparkles className="w-4 h-4 mr-2" />
              Recent Posts
            </TabsTrigger>
          </TabsList>

          {/* Trending Tab */}
          <TabsContent value="trending" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
              </div>
            ) : error ? (
              <Card className="p-8 text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={refetch}>Try Again</Button>
              </Card>
            ) : (
              <>
                {/* Trending Creators */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      Trending Creators
                    </h2>
                    <Button variant="ghost" size="sm">
                      View All
                    </Button>
                  </div>
                  
                  <div className={viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                    : 'space-y-4'
                  }>
                    {feed?.trending_creators?.map((creator) => (
                      <CreatorCard key={creator.user_id} creator={creator} />
                    ))}
                  </div>
                </div>

                {/* Recent Posts */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      Recent Posts
                    </h2>
                  </div>
                  
                  <div className="space-y-6">
                    {feed?.recent_posts?.slice(0, 5).map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* All Creators Tab */}
          <TabsContent value="creators" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                All Creators
              </h2>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                : 'space-y-4'
              }>
                {feed?.suggested_creators?.map((creator) => (
                  <CreatorCard key={creator.user_id} creator={creator} />
                ))}
                {feed?.trending_creators?.map((creator) => (
                  <CreatorCard key={creator.user_id} creator={creator} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Recent Posts Tab */}
          <TabsContent value="posts" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Recent Posts
              </h2>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {feed?.recent_posts?.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Categories Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-12"
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Browse by Category
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                'Art', 
                'Music', 
                'Photography', 
                'Writing', 
                'Cooking', 
                'Tech', 
                'Fashion', 
                'Travel',
                'Gaming',
                'Education',
                'Fitness',
                'Crafts'
              ].map((category) => (
                <Button 
                  key={category} 
                  variant="outline" 
                  className="justify-center hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-600 hover:text-white transition-all"
                >
                  {category}
                </Button>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

