'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Header } from '@/components/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/supabase-auth-context'
import { useDiscoveryFeed } from '@/hooks/useSocial'
import CreatorCard from '@/components/social/CreatorCard'
import CreatorSearch from '@/components/social/CreatorSearch'
import { 
  Search, 
  TrendingUp, 
  Users, 
  Sparkles,
  Filter,
  Star,
  Heart,
  Eye,
  MapPin,
  Globe
} from 'lucide-react'

const categories = [
  { name: 'Art', icon: '🎨', count: 234 },
  { name: 'Music', icon: '🎵', count: 189 },
  { name: 'Photography', icon: '📷', count: 156 },
  { name: 'Writing', icon: '✍️', count: 145 },
  { name: 'Cooking', icon: '👨‍🍳', count: 98 },
  { name: 'Tech', icon: '💻', count: 87 },
  { name: 'Fashion', icon: '👗', count: 76 },
  { name: 'Travel', icon: '✈️', count: 65 },
  { name: 'Gaming', icon: '🎮', count: 54 },
  { name: 'Education', icon: '📚', count: 43 },
  { name: 'Fitness', icon: '💪', count: 32 },
  { name: 'Crafts', icon: '🧶', count: 28 },
]

export default function ExplorePage() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { feed, loading, error, refetch } = useDiscoveryFeed()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  if (authLoading) {
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
            <Globe className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Explore Nepal's Creative Community
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover talented creators, support their work, and be part of Nepal's growing creative economy
          </p>
        </motion.div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12"
        >
          <Card className="p-6">
            <CreatorSearch placeholder="Search for creators, categories, or tags..." />
          </Card>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
        >
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">1,234</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Creators</div>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">50K+</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Supporters</div>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">₹2M+</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Earned</div>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">99.9%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
          </Card>
        </motion.div>

        {/* Categories Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Browse by Category
            </h2>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Card 
                key={category.name}
                className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                  selectedCategory === category.name 
                    ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : ''
                }`}
                onClick={() => setSelectedCategory(
                  selectedCategory === category.name ? null : category.name
                )}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">{category.icon}</div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {category.count} creators
                  </p>
                </div>
              </Card>
            ))}
          </div>
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
                {selectedCategory ? `${selectedCategory} Creators` : 'Featured Creators'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedCategory 
                  ? `Discover talented ${selectedCategory.toLowerCase()} creators` 
                  : 'Top creators making waves in Nepal'
                }
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {feed?.trending_creators?.map((creator) => (
                <CreatorCard key={creator.user_id} creator={creator} />
              ))}
              {feed?.suggested_creators?.map((creator) => (
                <CreatorCard key={creator.user_id} creator={creator} />
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
          <Card className="p-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">
              Are you a creator?
            </h2>
            <p className="text-xl mb-6 opacity-90">
              Join Nepal's largest creator community and start earning today
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Button size="lg" variant="secondary">
                Start Creating
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white/20">
                Learn More
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

