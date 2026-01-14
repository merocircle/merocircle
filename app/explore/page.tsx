'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/supabase-auth-context'
import { useDiscoveryFeed } from '@/hooks/useSocial'
import { PageLayout } from '@/components/common/PageLayout'
import { SearchHeader } from '@/components/common/SearchHeader'
import { SectionHeader } from '@/components/common/SectionHeader'
import { CreatorGrid } from '@/components/common/CreatorGrid'
import { EmptyStateCard } from '@/components/common/EmptyStateCard'
import { CTABanner } from '@/components/common/CTABanner'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { Button } from '@/components/ui/button'
import { APP_CONFIG } from '@/lib/constants'
import { 
  TrendingUp, 
  Users, 
  Star,
  Heart,
  Globe,
  Search,
} from 'lucide-react'

export default function ExplorePage() {
  const { loading: authLoading } = useAuth()
  const { feed, loading, error, refetch } = useDiscoveryFeed()
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  if (authLoading || loading) {
    return <PageLayout loading />;
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
    <PageLayout>
      <SearchHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showCategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
        >
          <StatsCard
            label="Active Creators"
            value={APP_CONFIG.stats.activeCreators}
            icon={Users}
            iconColor="text-blue-600"
            useBauhaus={true}
            accentColor="#3b82f6"
          />
          <StatsCard
            label="Supporters"
            value={APP_CONFIG.stats.supporters}
            icon={Heart}
            iconColor="text-red-500"
            useBauhaus={true}
            accentColor="#ef4444"
          />
          <StatsCard
            label="Earned"
            value={APP_CONFIG.stats.totalEarned}
            icon={Star}
            iconColor="text-purple-600"
            prefix={APP_CONFIG.currency}
            useBauhaus={true}
            accentColor="#8b5cf6"
          />
          <StatsCard
            label="Uptime"
            value={APP_CONFIG.stats.uptime}
            icon={TrendingUp}
            iconColor="text-green-600"
            useBauhaus={true}
            accentColor="#10b981"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-12"
        >
          <SectionHeader
            title={selectedCategory !== 'All' ? `${selectedCategory} Creators` : 'Featured Creators'}
            description={selectedCategory 
              ? `Discover talented ${selectedCategory.toLowerCase()} creators` 
              : 'Top creators making waves in Nepal'
            }
            className="mb-6"
          />

          {error ? (
            <EmptyStateCard
              icon={Search}
              title="Error loading creators"
              description={error}
              action={{ label: 'Try Again', onClick: refetch }}
            />
          ) : filteredCreators.length === 0 ? (
            <EmptyStateCard
              icon={Search}
              title="No creators found"
              description="Try adjusting your search or filters"
            />
          ) : (
            <CreatorGrid
              creators={filteredCreators}
              columns={{ default: 1, md: 2, lg: 3 }}
              gap={6}
            />
          )}
        </motion.div>

        <CTABanner
          title="Are you a creator?"
          description="Join Nepal's largest creator community and start earning today"
          buttons={[
            { label: 'Start Creating', href: '/signup/creator', variant: 'secondary' },
            { label: 'Learn More', href: '/about', variant: 'outline' }
          ]}
          size="large"
          delay={0.5}
        />
      </div>
    </PageLayout>
  )
}
