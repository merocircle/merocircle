'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/supabase-auth-context';
import { PageLayout } from '@/components/common/PageLayout';
import { SectionHeader } from '@/components/common/SectionHeader';
import { CreatorMiniCard } from '@/components/common/CreatorMiniCard';
import { EmptyStateCard } from '@/components/common/EmptyStateCard';
import { EnhancedPostCard } from '@/components/posts/EnhancedPostCard';
import { Input } from '@/components/ui/input';
import {
  Search,
  Sparkles,
  Rss,
} from 'lucide-react';

interface UnifiedFeedData {
  creators: Array<any>;
  posts: Array<any>;
}

const CATEGORIES = ['All', 'Music', 'Art', 'Photography', 'Video', 'Writing', 'Tech', 'Other'];

export default function DashboardPage() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const router = useRouter();
  const [feedData, setFeedData] = useState<UnifiedFeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Allow unauthenticated browsing - no redirect to /auth
  useEffect(() => {
    const fetchUnifiedFeed = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/unified-feed');
        if (!response.ok) throw new Error('Failed to fetch feed');

        const data = await response.json();
        setFeedData(data);
      } catch (error) {
        console.error('Feed error:', error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch feed for both authenticated and unauthenticated users
    if (!authLoading) {
      fetchUnifiedFeed();
    }
  }, [authLoading]);

  if (authLoading || loading) {
    return <PageLayout loading={authLoading || loading}><div /></PageLayout>;
  }

  // Filter creators based on category and search
  // Also exclude current user's own creator card
  const filteredCreators = (feedData?.creators || []).filter(creator => {
    // Exclude current user's own creator card
    if (creator.user_id === user?.id) {
      return false;
    }
    const matchesCategory = selectedCategory === 'All' ||
      creator.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = !searchQuery ||
      creator.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.bio?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
            />
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Creators for You Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <SectionHeader
            title="Creators for you"
            description={selectedCategory !== 'All' ? `${selectedCategory} creators` : 'Trending creators'}
            icon={Sparkles}
            iconColor="text-yellow-500"
          />

          {filteredCreators.length === 0 ? (
            <EmptyStateCard
              icon={Search}
              title="No creators found"
              description="Try adjusting your search or filters"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredCreators.slice(0, 6).map((creator: any) => (
                <CreatorMiniCard
                  key={creator.user_id}
                  id={creator.user_id}
                  name={creator.display_name}
                  avatarUrl={creator.avatar_url}
                  supporterCount={creator.supporter_count || 0}
                  bio={creator.bio}
                  category={creator.category}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* Feed Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <SectionHeader
            title="Feed"
            description="Discover trending posts from amazing creators"
            icon={Rss}
            iconColor="text-blue-500"
          />

          {feedData?.posts && feedData.posts.length > 0 ? (
            feedData.posts.map((post: any) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <EnhancedPostCard
                  post={post}
                  currentUserId={user?.id}
                  showActions={true}
                  isSupporter={post.is_supporter || false}
                />
              </motion.div>
            ))
          ) : (
            <EmptyStateCard
              icon={Rss}
              title="No posts yet"
              description="Check back later for content from creators"
            />
          )}
        </motion.div>
      </div>
    </PageLayout>
  );
}
