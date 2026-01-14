'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { SidebarNav } from '@/components/sidebar-nav'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/supabase-auth-context'
import { useDiscoveryFeed } from '@/hooks/useSocial'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { EnhancedCreatorCard } from '@/components/social/EnhancedCreatorCard'
import CreatorSearch from '@/components/social/CreatorSearch'
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  Users, 
  Filter,
  Star,
  Heart,
  Globe,
  Search,
  Sparkles,
  Music,
  Palette,
  Camera,
  Video,
  BookOpen,
  Utensils,
  Code,
  Dumbbell,
  ArrowRight
} from 'lucide-react'

const categories = [
  { name: 'All', icon: Sparkles, color: 'from-purple-500 to-pink-500' },
  { name: 'Music', icon: Music, color: 'from-blue-500 to-cyan-500' },
  { name: 'Art', icon: Palette, color: 'from-red-500 to-orange-500' },
  { name: 'Photography', icon: Camera, color: 'from-green-500 to-emerald-500' },
  { name: 'Video', icon: Video, color: 'from-purple-500 to-violet-500' },
  { name: 'Writing', icon: BookOpen, color: 'from-yellow-500 to-orange-500' },
  { name: 'Cooking', icon: Utensils, color: 'from-red-500 to-pink-500' },
  { name: 'Tech', icon: Code, color: 'from-blue-500 to-indigo-500' },
  { name: 'Fitness', icon: Dumbbell, color: 'from-green-500 to-teal-500' },
]

export default function ExplorePage() {
  const { loading: authLoading } = useAuth()
  const { feed, loading, error, refetch } = useDiscoveryFeed()
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
        <SidebarNav />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </main>
      </div>
    )
  }

  // Combine creators and deduplicate by user_id
  const allCreatorsMap = new Map();
  [...(feed?.trending_creators || []), ...(feed?.suggested_creators || [])].forEach(creator => {
    if (!allCreatorsMap.has(creator.user_id)) {
      allCreatorsMap.set(creator.user_id, creator);
    }
  });
  const allCreators = Array.from(allCreatorsMap.values());

  const filteredCreators = allCreators.filter(creator => {
    const matchesCategory = selectedCategory === 'All' || 
      creator.creator_profile?.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = !searchQuery || 
      creator.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.bio?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <SidebarNav />
      
      <main className="flex-1 overflow-y-auto">
        {/* Header with Search */}
        <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search creators or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 text-base bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
              </div>
              <Button variant="outline" size="icon" className="h-11 w-11">
                <Filter className="w-5 h-5" />
              </Button>
            </div>

            {/* Category Filter Pills */}
            <div className="mt-4 flex overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide space-x-2">
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = selectedCategory === category.name;
                
                return (
                  <Button
                    key={category.name}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category.name)}
                    className={cn(
                      'flex-shrink-0 gap-2 h-9',
                      isActive && `bg-gradient-to-r ${category.color} text-white border-0 hover:opacity-90`
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {category.name}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mb-6">
              <Globe className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Explore Nepal&apos;s Creative Community
            </h1>
            <p className="text-xl max-w-2xl mx-auto text-gray-600 dark:text-gray-400">
              Discover talented creators, support their work, and be part of Nepal&apos;s growing creative economy
            </p>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
          >
            <StatsCard
              label="Active Creators"
              value={1234}
              icon={Users}
              iconColor="text-blue-600"
              useBauhaus={true}
              accentColor="#3b82f6"
            />
            <StatsCard
              label="Supporters"
              value="50K+"
              icon={Heart}
              iconColor="text-red-500"
              useBauhaus={true}
              accentColor="#ef4444"
            />
            <StatsCard
              label="Earned"
              value={2000000}
              icon={Star}
              iconColor="text-purple-600"
              prefix="₹"
              useBauhaus={true}
              accentColor="#8b5cf6"
            />
            <StatsCard
              label="Uptime"
              value="99.9%"
              icon={TrendingUp}
              iconColor="text-green-600"
              useBauhaus={true}
              accentColor="#10b981"
            />
          </motion.div>

          {/* Featured Creators Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {selectedCategory !== 'All' ? `${selectedCategory} Creators` : 'Featured Creators'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedCategory 
                    ? `Discover talented ${selectedCategory.toLowerCase()} creators` 
                    : 'Top creators making waves in Nepal'
                  }
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
              </div>
            ) : error ? (
              <Card className="p-8 text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={refetch}>Try Again</Button>
              </Card>
            ) : filteredCreators.length === 0 ? (
              <Card className="p-12 text-center">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No creators found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search or filters
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCreators.map((creator) => (
                  <EnhancedCreatorCard key={creator.user_id} creator={creator} />
                ))}
              </div>
            )}
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Card className="p-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center border-0">
              <h2 className="text-3xl font-bold mb-4">
                Are you a creator?
              </h2>
              <p className="text-xl mb-6 opacity-90">
                Join Nepal&apos;s largest creator community and start earning today
              </p>
              <div className="flex items-center justify-center space-x-4">
                <Button size="lg" variant="secondary">
                  Start Creating
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white/20">
                  Learn More
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
