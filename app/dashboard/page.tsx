'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/supabase-auth-context';
import { useDiscoveryFeed } from '@/hooks/useSocial';
import { PageLayout } from '@/components/common/PageLayout';
import { SearchHeader } from '@/components/common/SearchHeader';
import { WelcomeBanner } from '@/components/common/WelcomeBanner';
import { SectionHeader } from '@/components/common/SectionHeader';
import { CreatorGrid } from '@/components/common/CreatorGrid';
import { CreatorMiniCard } from '@/components/common/CreatorMiniCard';
import { EmptyStateCard } from '@/components/common/EmptyStateCard';
import { CTABanner } from '@/components/common/CTABanner';
import { 
  Search, 
  TrendingUp, 
  Sparkles,
  Heart,
  Users,
} from 'lucide-react';

export default function DashboardPage() {
  const { isAuthenticated, loading: authLoading, userProfile } = useAuth();
  const router = useRouter();
  const { feed, loading } = useDiscoveryFeed();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || loading || !isAuthenticated) {
    return <PageLayout loading={authLoading || loading} />;
  }

  // Combine creators and deduplicate by user_id
  const allCreatorsMap = new Map();
  [...(feed?.trending_creators || []), ...(feed?.suggested_creators || [])].forEach(creator => {
    if (!allCreatorsMap.has(creator.user_id)) {
      allCreatorsMap.set(creator.user_id, creator);
    }
  });
  const allCreators = Array.from(allCreatorsMap.values());
  
  // Filter creators for "Creators for you" section - only show trending (exclude suggested)
  const creatorsForYou = (feed?.trending_creators || []).filter(creator => {
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
        actionIcon={Search}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WelcomeBanner
          title={`Welcome back, ${userProfile?.display_name || 'Creator'}! 👋`}
          description="Discover amazing creators and support their work"
          stats={[
            { icon: Users, label: 'Creators', value: allCreators.length },
            { icon: Heart, label: 'Supporters', value: '50K+' }
          ]}
          className="mb-8"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <SectionHeader
            title="Recently Visited"
            action={{ label: 'See All', onClick: () => {} }}
          />
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {allCreators.slice(0, 6).map((creator) => (
              <CreatorMiniCard
                key={creator.user_id}
                id={creator.user_id}
                name={creator.display_name}
                avatarUrl={creator.avatar_url}
                supporterCount={creator.supporter_count || 0}
              />
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <SectionHeader
            title="Based on your recent visits"
            description="Creators you might like"
            icon={Sparkles}
            iconColor="text-yellow-500"
          />
          
          <CreatorGrid
            creators={feed?.suggested_creators?.slice(0, 6) || []}
            columns={{ default: 1, md: 2, xl: 3 }}
            gap={6}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <SectionHeader
            title="Creators for you"
            description={selectedCategory !== 'All' ? `${selectedCategory} creators` : 'Trending creators making waves'}
            icon={TrendingUp}
            iconColor="text-green-500"
            action={{ label: 'View All', onClick: () => {} }}
          />

          {creatorsForYou.length === 0 ? (
            <EmptyStateCard
              icon={Search}
              title="No creators found"
              description="Try adjusting your search or filters"
            />
          ) : (
            <CreatorGrid
              creators={creatorsForYou}
              columns={{ default: 1, md: 2, xl: 3 }}
              gap={6}
            />
          )}
        </motion.div>

        <CTABanner
          title="Are you a creator?"
          description="Join thousands of creators earning on Creators Nepal"
          buttons={[
            { label: 'Start Creating', href: '/signup/creator', variant: 'secondary' }
          ]}
          className="mt-12 mb-8"
        />
      </div>
    </PageLayout>
  );
}
